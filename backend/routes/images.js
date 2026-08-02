const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const imageIngestionService = require('../services/imageIngestionService');
const auth = require('../middleware/auth');

// Configure multer for image file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads/images');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `image-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'image/webp', 'image/bmp', 'image/tiff',
      'application/pdf'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only images and PDFs are allowed.`), false);
    }
  }
});

/**
 * @route POST /api/v1/images/upload
 * @desc Upload and analyze an image/document
 * @access Private
 */
router.post('/upload', auth, upload.single('image'), async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const options = {
      name: req.body.name || req.file.originalname,
      description: req.body.description,
      documentType: req.body.documentType || 'auto',
      extractionPrompt: req.body.extractionPrompt,
      formId: req.body.formId,
      organizationId: req.body.organizationId
    };

    const result = await imageIngestionService.processImageFile(
      req.file,
      userId,
      options
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/v1/images/capture
 * @desc Process base64 image data (from camera capture)
 * @access Private
 */
router.post('/capture', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageData, name, description, documentType, extractionPrompt, formId } = req.body;

    if (!imageData) {
      return res.status(400).json({
        success: false,
        error: 'No image data provided'
      });
    }

    const result = await imageIngestionService.processBase64Image(
      imageData,
      userId,
      { name, description, documentType, extractionPrompt, formId }
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Image capture error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/images
 * @desc Get all image sources for user
 * @access Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit, offset, status, formId, documentType } = req.query;

    const result = await imageIngestionService.getUserImageSources(userId, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      status,
      formId,
      documentType
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get image sources error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/images/:id
 * @desc Get single image source by ID
 * @access Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await imageIngestionService.getImageSource(id, userId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get image source error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/v1/images/:id
 * @desc Delete image source
 * @access Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await imageIngestionService.deleteImageSource(id, userId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Delete image source error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/v1/images/:id/reanalyze
 * @desc Re-analyze image with custom prompt
 * @access Private
 */
router.post('/:id/reanalyze', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Analysis prompt is required'
      });
    }

    const result = await imageIngestionService.reanalyzeImage(id, userId, prompt);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Reanalyze image error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/images/types
 * @desc Get supported document types
 * @access Public
 */
router.get('/meta/types', (req, res) => {
  res.json({
    success: true,
    data: {
      documentTypes: [
        { id: 'auto', name: 'Auto-detect', description: 'Automatically detect document type' },
        { id: 'receipt', name: 'Receipt', description: 'Store receipts and bills' },
        { id: 'invoice', name: 'Invoice', description: 'Business invoices' },
        { id: 'form', name: 'Form', description: 'Filled forms and documents' },
        { id: 'id_card', name: 'ID Card', description: 'Identity documents' },
        { id: 'business_card', name: 'Business Card', description: 'Contact cards' },
        { id: 'document', name: 'Document', description: 'General documents' },
        { id: 'photo', name: 'Photo', description: 'Photographs and images' }
      ],
      supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'pdf'],
      maxFileSize: '20MB'
    }
  });
});

module.exports = router;
