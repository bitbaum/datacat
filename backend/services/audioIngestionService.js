const prisma = require('../lib/prisma');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

/**
 * Audio Ingestion Service
 * Handles audio file uploads, transcription via Whisper API, and data extraction
 */
class AudioIngestionService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads/audio');
    this.supportedFormats = ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm', 'ogg', 'flac'];
    this.maxFileSize = 25 * 1024 * 1024; // 25MB (Whisper API limit)
  }

  /**
   * Initialize upload directory
   */
  async init() {
    try {
      await mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }

  /**
   * Process uploaded audio file
   * @param {Object} file - Uploaded file object (from multer)
   * @param {string} userId - User ID
   * @param {Object} options - Processing options
   */
  async processAudioFile(file, userId, options = {}) {
    const {
      name = file.originalname,
      description = null,
      language = null, // Auto-detect if not specified
      prompt = null, // Context prompt to improve transcription
      formId = null,
      organizationId = null,
      responseFormat = 'verbose_json',
    } = options;

    // Validate file
    this.validateFile(file);

    // Create data source record
    const dataSource = await prisma.dataSource.create({
      data: {
        type: 'AUDIO',
        name,
        description,
        status: 'PENDING',
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        filePath: file.path,
        metadata: {
          language,
          prompt,
          responseFormat,
          uploadedAt: new Date().toISOString(),
        },
        userId,
        organizationId,
        formId,
      },
    });

    try {
      // Update status to processing
      await prisma.dataSource.update({
        where: { id: dataSource.id },
        data: { status: 'PROCESSING' },
      });

      const startTime = Date.now();

      // Transcribe audio using Whisper
      const transcription = await this.transcribeAudio(file.path, {
        language,
        prompt,
        responseFormat,
      });

      const processingTime = Date.now() - startTime;

      // Extract structured data from transcription
      const extractedData = await this.extractStructuredData(transcription);

      // Update data source with results
      const updatedDataSource = await prisma.dataSource.update({
        where: { id: dataSource.id },
        data: {
          status: 'COMPLETED',
          extractedText: transcription.text,
          extractedData: {
            ...extractedData,
            segments: transcription.segments || [],
            words: transcription.words || [],
            language: transcription.language,
            duration: transcription.duration,
          },
          processingTime,
          aiModel: 'whisper-1',
          confidence: this.calculateConfidence(transcription),
          processedAt: new Date(),
        },
      });

      return {
        id: updatedDataSource.id,
        status: 'COMPLETED',
        transcription: transcription.text,
        language: transcription.language,
        duration: transcription.duration,
        segments: transcription.segments,
        extractedData,
        processingTime,
        confidence: updatedDataSource.confidence,
      };
    } catch (error) {
      // Update status to failed
      await prisma.dataSource.update({
        where: { id: dataSource.id },
        data: {
          status: 'FAILED',
          error: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper API
   */
  async transcribeAudio(filePath, options = {}) {
    const { language, prompt, responseFormat = 'verbose_json' } = options;

    const transcriptionParams = {
      file: fs.createReadStream(filePath),
      model: 'whisper-1',
      response_format: responseFormat,
    };

    if (language) {
      transcriptionParams.language = language;
    }

    if (prompt) {
      transcriptionParams.prompt = prompt;
    }

    const response = await this.openai.audio.transcriptions.create(transcriptionParams);

    return response;
  }

  /**
   * Extract structured data from transcription using GPT-4
   */
  async extractStructuredData(transcription) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a data extraction assistant. Analyze the following audio transcription and extract structured information. Return a JSON object with the following fields (include only those that are present):
            - summary: Brief summary of the content
            - topics: Array of main topics discussed
            - entities: Object with named entities (people, organizations, locations, dates, etc.)
            - sentiment: Overall sentiment (positive, negative, neutral)
            - keyPoints: Array of key points or takeaways
            - actionItems: Array of action items or tasks mentioned
            - questions: Array of questions asked
            - decisions: Array of decisions made
            - type: Type of audio (meeting, interview, voice_note, lecture, conversation, other)`,
          },
          {
            role: 'user',
            content: transcription.text,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Failed to extract structured data:', error);
      return {
        summary: null,
        topics: [],
        error: 'Failed to extract structured data',
      };
    }
  }

  /**
   * Calculate confidence score based on transcription quality
   */
  calculateConfidence(transcription) {
    let confidence = 0.8; // Base confidence

    // Adjust based on available data
    if (transcription.segments && transcription.segments.length > 0) {
      // Calculate average segment confidence if available
      const avgSegmentConfidence =
        transcription.segments.reduce((sum, seg) => {
          return sum + (seg.avg_logprob ? Math.exp(seg.avg_logprob) : 0.8);
        }, 0) / transcription.segments.length;

      confidence = Math.min(avgSegmentConfidence, 0.99);
    }

    // Reduce confidence for very short transcriptions
    if (transcription.text && transcription.text.length < 50) {
      confidence *= 0.9;
    }

    return Math.round(confidence * 100) / 100;
  }

  /**
   * Validate uploaded file
   */
  validateFile(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      throw new Error(`File too large. Maximum size is ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check file format
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (!this.supportedFormats.includes(ext)) {
      throw new Error(
        `Unsupported audio format: ${ext}. Supported formats: ${this.supportedFormats.join(', ')}`,
      );
    }
  }

  /**
   * Process audio from base64 data (for voice recordings from browser)
   */
  async processBase64Audio(base64Data, userId, options = {}) {
    await this.init();

    // Extract base64 content and mime type
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid base64 audio data');
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');

    // Determine file extension from mime type
    const mimeToExt = {
      'audio/webm': 'webm',
      'audio/mp3': 'mp3',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'audio/mp4': 'm4a',
      'audio/m4a': 'm4a',
      'audio/flac': 'flac',
    };

    const ext = mimeToExt[mimeType] || 'webm';
    const filename = `recording_${Date.now()}.${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    // Write file
    await writeFile(filePath, buffer);

    // Create file object similar to multer
    const file = {
      originalname: options.name || filename,
      mimetype: mimeType,
      size: buffer.length,
      path: filePath,
    };

    try {
      return await this.processAudioFile(file, userId, options);
    } finally {
      // Clean up temp file
      try {
        await unlink(filePath);
      } catch (e) {
        console.error('Failed to delete temp file:', e);
      }
    }
  }

  /**
   * Get all audio data sources for a user
   */
  async getUserAudioSources(userId, options = {}) {
    const { limit = 50, offset = 0, status, formId } = options;

    const where = {
      userId,
      type: 'AUDIO',
    };

    if (status) {
      where.status = status;
    }

    if (formId) {
      where.formId = formId;
    }

    const [dataSources, total] = await Promise.all([
      prisma.dataSource.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          originalFilename: true,
          fileSize: true,
          extractedText: true,
          extractedData: true,
          processingTime: true,
          confidence: true,
          createdAt: true,
          processedAt: true,
        },
      }),
      prisma.dataSource.count({ where }),
    ]);

    return {
      dataSources,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get single audio data source by ID
   */
  async getAudioSource(id, userId) {
    const dataSource = await prisma.dataSource.findFirst({
      where: {
        id,
        userId,
        type: 'AUDIO',
      },
      include: {
        analyses: true,
      },
    });

    if (!dataSource) {
      throw new Error('Audio source not found or access denied');
    }

    return dataSource;
  }

  /**
   * Delete audio data source
   */
  async deleteAudioSource(id, userId) {
    const dataSource = await prisma.dataSource.findFirst({
      where: {
        id,
        userId,
        type: 'AUDIO',
      },
    });

    if (!dataSource) {
      throw new Error('Audio source not found or access denied');
    }

    // Delete file if exists
    if (dataSource.filePath) {
      try {
        await unlink(dataSource.filePath);
      } catch (e) {
        console.error('Failed to delete audio file:', e);
      }
    }

    await prisma.dataSource.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Analyze transcription with AI
   */
  async analyzeTranscription(id, userId, analysisPrompt) {
    const dataSource = await this.getAudioSource(id, userId);

    if (!dataSource.extractedText) {
      throw new Error('No transcription available for analysis');
    }

    const startTime = Date.now();

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            "You are an AI analyst. Analyze the following audio transcription based on the user's request. Provide detailed, actionable insights.",
        },
        {
          role: 'user',
          content: `Transcription:\n${dataSource.extractedText}\n\nAnalysis Request:\n${analysisPrompt}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    });

    const processingTime = Date.now() - startTime;

    // Save analysis
    const analysis = await prisma.dataSourceAnalysis.create({
      data: {
        dataSourceId: id,
        analysisType: 'CUSTOM',
        prompt: analysisPrompt,
        result: {
          content: response.choices[0].message.content,
          usage: response.usage,
        },
        model: 'gpt-4-turbo-preview',
        processingTime,
        status: 'COMPLETED',
      },
    });

    return {
      analysisId: analysis.id,
      result: response.choices[0].message.content,
      processingTime,
    };
  }
}

module.exports = new AudioIngestionService();
