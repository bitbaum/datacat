const prisma = require('../lib/prisma');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);

/**
 * Image/Document Ingestion Service
 * Handles image uploads, OCR via Vision API, and document analysis
 */
class ImageIngestionService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads/images');
    this.supportedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'pdf'];
    this.maxFileSize = 20 * 1024 * 1024; // 20MB
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
   * Process uploaded image/document file
   * @param {Object} file - Uploaded file object (from multer)
   * @param {string} userId - User ID
   * @param {Object} options - Processing options
   */
  async processImageFile(file, userId, options = {}) {
    const {
      name = file.originalname,
      description = null,
      extractionPrompt = null, // Custom prompt for what to extract
      formId = null,
      organizationId = null,
      documentType = 'auto', // auto, receipt, invoice, form, id_card, business_card, document, photo
    } = options;

    // Validate file
    this.validateFile(file);

    // Create data source record
    const dataSource = await prisma.dataSource.create({
      data: {
        type: 'IMAGE',
        name,
        description,
        status: 'PENDING',
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        filePath: file.path,
        metadata: {
          documentType,
          extractionPrompt,
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

      // Analyze image with Vision API
      const visionResult = await this.analyzeImageWithVision(file.path, {
        documentType,
        extractionPrompt,
      });

      const processingTime = Date.now() - startTime;

      // Extract structured data from vision result
      const extractedData = await this.extractStructuredData(visionResult, documentType);

      // Update data source with results
      const updatedDataSource = await prisma.dataSource.update({
        where: { id: dataSource.id },
        data: {
          status: 'COMPLETED',
          extractedText: visionResult.text,
          extractedData: {
            ...extractedData,
            rawAnalysis: visionResult.analysis,
            documentType: visionResult.detectedType || documentType,
          },
          processingTime,
          aiModel: 'gpt-4-vision-preview',
          confidence: this.calculateConfidence(visionResult, extractedData),
          processedAt: new Date(),
        },
      });

      return {
        id: updatedDataSource.id,
        status: 'COMPLETED',
        extractedText: visionResult.text,
        documentType: visionResult.detectedType || documentType,
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
   * Analyze image using OpenAI Vision API
   */
  async analyzeImageWithVision(filePath, options = {}) {
    const { documentType, extractionPrompt } = options;

    // Read image and convert to base64
    const imageBuffer = await readFile(filePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = this.getMimeType(filePath);

    // Build the analysis prompt based on document type
    const systemPrompt = this.buildVisionPrompt(documentType, extractionPrompt);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: systemPrompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.2,
    });

    const analysisText = response.choices[0].message.content;

    // Parse the response to extract structured data
    let parsedResult;
    try {
      // Try to parse as JSON if the response contains JSON
      const jsonMatch =
        analysisText.match(/```json\n?([\s\S]*?)\n?```/) || analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        parsedResult = { rawText: analysisText };
      }
    } catch {
      parsedResult = { rawText: analysisText };
    }

    return {
      text: parsedResult.extractedText || parsedResult.text || this.extractPlainText(analysisText),
      analysis: analysisText,
      structured: parsedResult,
      detectedType: parsedResult.documentType || null,
      usage: response.usage,
    };
  }

  /**
   * Build vision prompt based on document type
   */
  buildVisionPrompt(documentType, customPrompt) {
    if (customPrompt) {
      return `Analyze this image and: ${customPrompt}

Please provide your response in the following JSON format:
\`\`\`json
{
  "extractedText": "all visible text from the image",
  "documentType": "detected document type",
  "data": { extracted structured data based on the request },
  "confidence": 0.0-1.0
}
\`\`\``;
    }

    const prompts = {
      auto: `Analyze this image thoroughly. Identify the document type and extract all relevant information.

Your response should be in JSON format:
\`\`\`json
{
  "documentType": "the type of document (receipt, invoice, form, id_card, business_card, photo, screenshot, diagram, handwritten_note, other)",
  "extractedText": "all visible text from the image, preserving structure where possible",
  "summary": "brief description of what the image contains",
  "data": {
    "key-value pairs of extracted structured data"
  },
  "entities": {
    "names": [],
    "dates": [],
    "amounts": [],
    "addresses": [],
    "emails": [],
    "phones": []
  },
  "confidence": 0.0-1.0
}
\`\`\``,

      receipt: `This is a receipt or bill. Extract all information including:
- Store/vendor name
- Date and time
- All line items with prices
- Subtotal, tax, total
- Payment method if visible
- Any other relevant details

Response format:
\`\`\`json
{
  "documentType": "receipt",
  "extractedText": "all text from receipt",
  "vendor": { "name": "", "address": "", "phone": "" },
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "items": [{ "name": "", "quantity": 1, "unitPrice": 0.00, "total": 0.00 }],
  "subtotal": 0.00,
  "tax": 0.00,
  "total": 0.00,
  "paymentMethod": "",
  "currency": "USD",
  "confidence": 0.0-1.0
}
\`\`\``,

      invoice: `This is an invoice. Extract all business and transaction information:
- Company details (name, address, contact)
- Invoice number and date
- Bill to / Ship to information
- All line items
- Payment terms and totals

Response format:
\`\`\`json
{
  "documentType": "invoice",
  "extractedText": "all text from invoice",
  "invoiceNumber": "",
  "date": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "from": { "company": "", "address": "", "email": "", "phone": "" },
  "to": { "company": "", "address": "", "email": "", "phone": "" },
  "items": [{ "description": "", "quantity": 1, "unitPrice": 0.00, "total": 0.00 }],
  "subtotal": 0.00,
  "tax": 0.00,
  "total": 0.00,
  "currency": "USD",
  "paymentTerms": "",
  "notes": "",
  "confidence": 0.0-1.0
}
\`\`\``,

      form: `This is a form or document. Extract all field labels and their values:

Response format:
\`\`\`json
{
  "documentType": "form",
  "extractedText": "all text from form",
  "title": "form title if visible",
  "fields": [{ "label": "", "value": "", "type": "text|checkbox|date|signature" }],
  "sections": [{ "title": "", "fields": [] }],
  "signatures": ["list of signature locations if present"],
  "dates": ["list of dates found"],
  "confidence": 0.0-1.0
}
\`\`\``,

      id_card: `This appears to be an ID card or official document. Extract identifying information:

Response format:
\`\`\`json
{
  "documentType": "id_card",
  "extractedText": "all visible text",
  "cardType": "driver_license|passport|national_id|other",
  "name": { "full": "", "first": "", "last": "" },
  "dateOfBirth": "YYYY-MM-DD",
  "idNumber": "",
  "expirationDate": "YYYY-MM-DD",
  "issueDate": "YYYY-MM-DD",
  "address": "",
  "issuingAuthority": "",
  "confidence": 0.0-1.0
}
\`\`\``,

      business_card: `This is a business card. Extract contact and professional information:

Response format:
\`\`\`json
{
  "documentType": "business_card",
  "extractedText": "all text from card",
  "name": "",
  "title": "",
  "company": "",
  "email": "",
  "phone": [],
  "website": "",
  "address": "",
  "socialMedia": {},
  "confidence": 0.0-1.0
}
\`\`\``,

      document: `Analyze this document and extract all text and key information:

Response format:
\`\`\`json
{
  "documentType": "document",
  "extractedText": "all text preserving paragraphs and structure",
  "title": "",
  "author": "",
  "date": "",
  "summary": "",
  "sections": [{ "heading": "", "content": "" }],
  "entities": { "names": [], "dates": [], "organizations": [] },
  "confidence": 0.0-1.0
}
\`\`\``,

      photo: `Describe this photo in detail:

Response format:
\`\`\`json
{
  "documentType": "photo",
  "extractedText": "any visible text",
  "description": "detailed description of the image",
  "subjects": ["main subjects in the photo"],
  "location": "if identifiable",
  "objects": ["notable objects visible"],
  "colors": ["dominant colors"],
  "mood": "overall mood/atmosphere",
  "confidence": 0.0-1.0
}
\`\`\``,
    };

    return prompts[documentType] || prompts['auto'];
  }

  /**
   * Extract structured data from vision result
   */
  async extractStructuredData(visionResult, documentType) {
    // If structured data was already parsed, use it
    if (visionResult.structured && Object.keys(visionResult.structured).length > 1) {
      return visionResult.structured;
    }

    // Otherwise, try to extract from the raw analysis
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a data extraction assistant. Convert the following image analysis into structured JSON data. Focus on extracting key information relevant to a ${documentType} document type.`,
          },
          {
            role: 'user',
            content: visionResult.analysis,
          },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Failed to extract structured data:', error);
      return {
        text: visionResult.text,
        rawAnalysis: visionResult.analysis,
      };
    }
  }

  /**
   * Extract plain text from analysis result
   */
  extractPlainText(analysisText) {
    // Remove JSON blocks and extract just the text content
    let text = analysisText
      .replace(/```json[\s\S]*?```/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .trim();

    // If there's still JSON, try to extract the text field
    try {
      const json = JSON.parse(text);
      if (json.extractedText) return json.extractedText;
      if (json.text) return json.text;
    } catch {
      // Not JSON, return as is
    }

    return text;
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(visionResult, extractedData) {
    let confidence = 0.7; // Base confidence

    // Increase confidence based on structured data quality
    if (extractedData && Object.keys(extractedData).length > 3) {
      confidence += 0.1;
    }

    // Check if we have extracted text
    if (visionResult.text && visionResult.text.length > 50) {
      confidence += 0.1;
    }

    // Check for specific confidence in the result
    if (extractedData.confidence) {
      confidence = (confidence + extractedData.confidence) / 2;
    }

    return Math.min(Math.round(confidence * 100) / 100, 0.99);
  }

  /**
   * Get MIME type from file path
   */
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    const mimeTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      bmp: 'image/bmp',
      tiff: 'image/tiff',
      pdf: 'application/pdf',
    };
    return mimeTypes[ext] || 'image/jpeg';
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
      throw new Error(
        `Unsupported format: ${ext}. Supported formats: ${this.supportedFormats.join(', ')}`,
      );
    }
  }

  /**
   * Process image from base64 data (for camera captures)
   */
  async processBase64Image(base64Data, userId, options = {}) {
    await this.init();

    // Extract base64 content and mime type
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid base64 image data');
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');

    // Determine file extension from mime type
    const mimeToExt = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/bmp': 'bmp',
    };

    const ext = mimeToExt[mimeType] || 'jpg';
    const filename = `capture_${Date.now()}.${ext}`;
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
      return await this.processImageFile(file, userId, options);
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
   * Get all image data sources for a user
   */
  async getUserImageSources(userId, options = {}) {
    const { limit = 50, offset = 0, status, formId, documentType } = options;

    const where = {
      userId,
      type: 'IMAGE',
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
          mimeType: true,
          fileSize: true,
          fileUrl: true,
          extractedText: true,
          extractedData: true,
          processingTime: true,
          confidence: true,
          createdAt: true,
          processedAt: true,
          metadata: true,
        },
      }),
      prisma.dataSource.count({ where }),
    ]);

    // Filter by document type if specified
    let filteredSources = dataSources;
    if (documentType) {
      filteredSources = dataSources.filter(
        (ds) =>
          ds.extractedData?.documentType === documentType ||
          ds.metadata?.documentType === documentType,
      );
    }

    return {
      dataSources: filteredSources,
      total: documentType ? filteredSources.length : total,
      limit,
      offset,
    };
  }

  /**
   * Get single image data source by ID
   */
  async getImageSource(id, userId) {
    const dataSource = await prisma.dataSource.findFirst({
      where: {
        id,
        userId,
        type: 'IMAGE',
      },
      include: {
        analyses: true,
      },
    });

    if (!dataSource) {
      throw new Error('Image source not found or access denied');
    }

    return dataSource;
  }

  /**
   * Delete image data source
   */
  async deleteImageSource(id, userId) {
    const dataSource = await prisma.dataSource.findFirst({
      where: {
        id,
        userId,
        type: 'IMAGE',
      },
    });

    if (!dataSource) {
      throw new Error('Image source not found or access denied');
    }

    // Delete file if exists
    if (dataSource.filePath) {
      try {
        await unlink(dataSource.filePath);
      } catch (e) {
        console.error('Failed to delete image file:', e);
      }
    }

    await prisma.dataSource.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Re-analyze image with custom prompt
   */
  async reanalyzeImage(id, userId, customPrompt) {
    const dataSource = await this.getImageSource(id, userId);

    if (!dataSource.filePath) {
      throw new Error('Original file not available for re-analysis');
    }

    const startTime = Date.now();

    const visionResult = await this.analyzeImageWithVision(dataSource.filePath, {
      documentType: dataSource.metadata?.documentType || 'auto',
      extractionPrompt: customPrompt,
    });

    const processingTime = Date.now() - startTime;

    // Save analysis record
    const analysis = await prisma.dataSourceAnalysis.create({
      data: {
        dataSourceId: id,
        analysisType: 'CUSTOM',
        prompt: customPrompt,
        result: {
          text: visionResult.text,
          structured: visionResult.structured,
          analysis: visionResult.analysis,
        },
        model: 'gpt-4-vision-preview',
        processingTime,
        status: 'COMPLETED',
      },
    });

    return {
      analysisId: analysis.id,
      text: visionResult.text,
      result: visionResult.structured,
      processingTime,
    };
  }
}

module.exports = new ImageIngestionService();
