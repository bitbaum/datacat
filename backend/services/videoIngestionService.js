const prisma = require('../lib/prisma');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec, spawn } = require('child_process');
const execPromise = promisify(exec);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);

/**
 * Video Ingestion Service
 * Handles video uploads, frame extraction, audio transcription, and analysis
 */
class VideoIngestionService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads/videos');
    this.tempDir = path.join(__dirname, '../uploads/temp');
    this.supportedFormats = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'm4v', 'wmv'];
    this.maxFileSize = 500 * 1024 * 1024; // 500MB
  }

  /**
   * Initialize directories
   */
  async init() {
    try {
      await mkdir(this.uploadDir, { recursive: true });
      await mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }

  /**
   * Check if ffmpeg is available
   */
  async checkFFmpeg() {
    try {
      await execPromise('ffmpeg -version');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Process uploaded video file
   */
  async processVideoFile(file, userId, options = {}) {
    const {
      name = file.originalname,
      description = null,
      frameInterval = 5, // Extract frame every N seconds
      maxFrames = 10, // Maximum frames to analyze
      transcribeAudio = true,
      analyzeFrames = true,
      formId = null,
      organizationId = null,
    } = options;

    // Validate file
    this.validateFile(file);

    // Check ffmpeg
    const hasFFmpeg = await this.checkFFmpeg();
    if (!hasFFmpeg) {
      throw new Error('FFmpeg is not installed. Video processing requires FFmpeg.');
    }

    // Create data source record
    const dataSource = await prisma.dataSource.create({
      data: {
        type: 'VIDEO',
        name,
        description,
        status: 'PENDING',
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        filePath: file.path,
        metadata: {
          frameInterval,
          maxFrames,
          transcribeAudio,
          analyzeFrames,
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
      const tempDir = path.join(this.tempDir, dataSource.id);
      await mkdir(tempDir, { recursive: true });

      // Get video metadata
      const videoInfo = await this.getVideoInfo(file.path);

      // Extract frames
      let frameAnalyses = [];
      if (analyzeFrames) {
        const frames = await this.extractFrames(file.path, tempDir, {
          interval: frameInterval,
          maxFrames,
          duration: videoInfo.duration,
        });
        frameAnalyses = await this.analyzeFrames(frames);
      }

      // Extract and transcribe audio
      let transcription = null;
      if (transcribeAudio && videoInfo.hasAudio) {
        const audioPath = path.join(tempDir, 'audio.mp3');
        await this.extractAudio(file.path, audioPath);
        transcription = await this.transcribeAudio(audioPath);
      }

      // Generate video summary
      const summary = await this.generateVideoSummary(videoInfo, frameAnalyses, transcription);

      const processingTime = Date.now() - startTime;

      // Cleanup temp files
      await this.cleanupTempDir(tempDir);

      // Update data source with results
      const updatedDataSource = await prisma.dataSource.update({
        where: { id: dataSource.id },
        data: {
          status: 'COMPLETED',
          extractedText: transcription?.text || '',
          extractedData: {
            videoInfo,
            frames: frameAnalyses.map((f) => ({
              timestamp: f.timestamp,
              description: f.description,
              objects: f.objects,
              text: f.text,
            })),
            transcription: transcription
              ? {
                  text: transcription.text,
                  language: transcription.language,
                  duration: transcription.duration,
                  segments: transcription.segments?.slice(0, 20), // Limit segments
                }
              : null,
            summary,
            keywords: summary.keywords || [],
            topics: summary.topics || [],
          },
          processingTime,
          aiModel: 'gpt-4o + whisper-1',
          confidence: this.calculateConfidence(frameAnalyses, transcription),
          processedAt: new Date(),
        },
      });

      return {
        id: updatedDataSource.id,
        status: 'COMPLETED',
        videoInfo,
        frameCount: frameAnalyses.length,
        transcription: transcription?.text || null,
        summary,
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
   * Get video metadata using ffprobe
   */
  async getVideoInfo(videoPath) {
    try {
      const { stdout } = await execPromise(
        `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`,
      );
      const info = JSON.parse(stdout);

      const videoStream = info.streams?.find((s) => s.codec_type === 'video');
      const audioStream = info.streams?.find((s) => s.codec_type === 'audio');

      return {
        duration: parseFloat(info.format?.duration) || 0,
        width: videoStream?.width || 0,
        height: videoStream?.height || 0,
        fps: this.parseFps(videoStream?.r_frame_rate),
        codec: videoStream?.codec_name || 'unknown',
        bitrate: parseInt(info.format?.bit_rate) || 0,
        hasAudio: !!audioStream,
        audioCodec: audioStream?.codec_name || null,
        format: info.format?.format_name || 'unknown',
      };
    } catch (error) {
      console.error('Failed to get video info:', error);
      return {
        duration: 0,
        width: 0,
        height: 0,
        fps: 0,
        codec: 'unknown',
        bitrate: 0,
        hasAudio: true, // Assume audio exists
        audioCodec: null,
        format: 'unknown',
      };
    }
  }

  /**
   * Parse FPS from ffprobe format (e.g., "30/1" or "29.97")
   */
  parseFps(fpsString) {
    if (!fpsString) return 0;
    if (fpsString.includes('/')) {
      const [num, den] = fpsString.split('/').map(Number);
      return den ? Math.round((num / den) * 100) / 100 : 0;
    }
    return parseFloat(fpsString) || 0;
  }

  /**
   * Extract frames from video at intervals
   */
  async extractFrames(videoPath, outputDir, options = {}) {
    const { interval = 5, maxFrames = 10, duration = 0 } = options;

    const frames = [];
    const effectiveDuration = duration || 60; // Default to 60s if unknown

    // Calculate timestamps for frame extraction
    const timestamps = [];
    for (let t = 0; t < effectiveDuration && timestamps.length < maxFrames; t += interval) {
      timestamps.push(t);
    }

    // Always include a frame near the end
    if (timestamps.length > 0 && effectiveDuration > interval) {
      const lastTimestamp = timestamps[timestamps.length - 1];
      if (effectiveDuration - lastTimestamp > interval / 2) {
        timestamps.push(Math.max(0, effectiveDuration - 1));
      }
    }

    // Extract each frame
    for (const timestamp of timestamps.slice(0, maxFrames)) {
      const outputPath = path.join(outputDir, `frame_${timestamp.toFixed(1)}.jpg`);
      try {
        await execPromise(
          `ffmpeg -ss ${timestamp} -i "${videoPath}" -vframes 1 -q:v 2 "${outputPath}" -y`,
        );

        // Check if file was created
        if (fs.existsSync(outputPath)) {
          frames.push({
            path: outputPath,
            timestamp,
          });
        }
      } catch (error) {
        console.error(`Failed to extract frame at ${timestamp}s:`, error.message);
      }
    }

    return frames;
  }

  /**
   * Analyze extracted frames with Vision API
   */
  async analyzeFrames(frames) {
    const analyses = [];

    for (const frame of frames) {
      try {
        const imageBuffer = await readFile(frame.path);
        const base64Image = imageBuffer.toString('base64');

        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this video frame (timestamp: ${frame.timestamp}s). Provide:
1. Brief description of the scene
2. Key objects/people visible
3. Any text visible in the frame
4. Scene type (indoor/outdoor, day/night, etc.)

Response in JSON:
\`\`\`json
{
  "description": "brief scene description",
  "objects": ["list", "of", "objects"],
  "people": { "count": 0, "description": "" },
  "text": "any visible text",
  "sceneType": "indoor/outdoor/etc",
  "mood": "mood/atmosphere"
}
\`\`\``,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                    detail: 'low',
                  },
                },
              ],
            },
          ],
          max_tokens: 500,
          temperature: 0.3,
        });

        const analysisText = response.choices[0].message.content;
        let analysis;

        try {
          const jsonMatch =
            analysisText.match(/```json\n?([\s\S]*?)\n?```/) || analysisText.match(/\{[\s\S]*\}/);
          analysis = jsonMatch
            ? JSON.parse(jsonMatch[1] || jsonMatch[0])
            : { description: analysisText };
        } catch {
          analysis = { description: analysisText };
        }

        analyses.push({
          timestamp: frame.timestamp,
          ...analysis,
        });
      } catch (error) {
        console.error(`Failed to analyze frame at ${frame.timestamp}s:`, error.message);
        analyses.push({
          timestamp: frame.timestamp,
          description: 'Analysis failed',
          error: error.message,
        });
      }
    }

    return analyses;
  }

  /**
   * Extract audio from video
   */
  async extractAudio(videoPath, audioPath) {
    await execPromise(`ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -q:a 4 "${audioPath}" -y`);
    return audioPath;
  }

  /**
   * Transcribe audio using Whisper
   */
  async transcribeAudio(audioPath) {
    try {
      const response = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: 'whisper-1',
        response_format: 'verbose_json',
      });

      return response;
    } catch (error) {
      console.error('Audio transcription failed:', error);
      return null;
    }
  }

  /**
   * Generate overall video summary
   */
  async generateVideoSummary(videoInfo, frameAnalyses, transcription) {
    const context = {
      duration: videoInfo.duration,
      resolution: `${videoInfo.width}x${videoInfo.height}`,
      frames: frameAnalyses.map((f) => `[${f.timestamp}s]: ${f.description}`).join('\n'),
      transcript: transcription?.text?.slice(0, 2000) || 'No audio transcript',
    };

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              'You analyze video content based on frame descriptions and audio transcripts. Provide comprehensive summaries.',
          },
          {
            role: 'user',
            content: `Analyze this video content and provide a summary:

Video Info: ${context.duration}s, ${context.resolution}

Frame Descriptions:
${context.frames}

Audio Transcript:
${context.transcript}

Provide a JSON response:
\`\`\`json
{
  "summary": "2-3 sentence overview of the video content",
  "topics": ["main", "topics", "covered"],
  "keywords": ["relevant", "keywords"],
  "contentType": "tutorial/vlog/interview/presentation/entertainment/other",
  "keyMoments": [{ "timestamp": 0, "description": "key moment" }],
  "sentiment": "positive/negative/neutral"
}
\`\`\``,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Failed to generate summary:', error);
      return {
        summary: 'Video analysis completed',
        topics: [],
        keywords: [],
        contentType: 'unknown',
      };
    }
  }

  /**
   * Cleanup temporary files
   */
  async cleanupTempDir(tempDir) {
    try {
      const files = await readdir(tempDir);
      for (const file of files) {
        await unlink(path.join(tempDir, file));
      }
      await fs.promises.rmdir(tempDir);
    } catch (error) {
      console.error('Failed to cleanup temp dir:', error);
    }
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(frameAnalyses, transcription) {
    let confidence = 0.6;

    // Increase confidence based on successful frame analyses
    const successfulFrames = frameAnalyses.filter((f) => !f.error).length;
    if (successfulFrames > 0) {
      confidence += (successfulFrames / frameAnalyses.length) * 0.2;
    }

    // Increase confidence if transcription was successful
    if (transcription?.text) {
      confidence += 0.15;
    }

    return Math.min(Math.round(confidence * 100) / 100, 0.95);
  }

  /**
   * Validate uploaded file
   */
  validateFile(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new Error(`File too large. Maximum size is ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (!this.supportedFormats.includes(ext)) {
      throw new Error(`Unsupported format: ${ext}. Supported: ${this.supportedFormats.join(', ')}`);
    }
  }

  /**
   * Get all video data sources for a user
   */
  async getUserVideoSources(userId, options = {}) {
    const { limit = 50, offset = 0, status } = options;

    const where = {
      userId,
      type: 'VIDEO',
    };

    if (status) {
      where.status = status;
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
          mimeType: true,
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

    return { dataSources, total, limit, offset };
  }

  /**
   * Get single video source by ID
   */
  async getVideoSource(id, userId) {
    const dataSource = await prisma.dataSource.findFirst({
      where: { id, userId, type: 'VIDEO' },
      include: { analyses: true },
    });

    if (!dataSource) {
      throw new Error('Video source not found or access denied');
    }

    return dataSource;
  }

  /**
   * Delete video source
   */
  async deleteVideoSource(id, userId) {
    const dataSource = await prisma.dataSource.findFirst({
      where: { id, userId, type: 'VIDEO' },
    });

    if (!dataSource) {
      throw new Error('Video source not found or access denied');
    }

    if (dataSource.filePath) {
      try {
        await unlink(dataSource.filePath);
      } catch (e) {
        console.error('Failed to delete video file:', e);
      }
    }

    await prisma.dataSource.delete({ where: { id } });

    return { success: true };
  }
}

module.exports = new VideoIngestionService();
