const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const videoIngestionService = require('../services/videoIngestionService');
const auth = require('../middleware/auth');

// Configure multer for video file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads/videos');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `video-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
      'video/webm',
      'video/x-flv',
      'video/x-m4v',
      'video/x-ms-wmv',
    ];
    if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only video files are allowed.`), false);
    }
  },
});

/**
 * @route POST /api/v1/videos/upload
 * @desc Upload and analyze a video file
 * @access Private
 */
router.post('/upload', auth, upload.single('video'), async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No video file provided',
      });
    }

    const options = {
      name: req.body.name || req.file.originalname,
      description: req.body.description,
      frameInterval: parseInt(req.body.frameInterval) || 5,
      maxFrames: parseInt(req.body.maxFrames) || 10,
      transcribeAudio: req.body.transcribeAudio !== 'false',
      analyzeFrames: req.body.analyzeFrames !== 'false',
      formId: req.body.formId,
      organizationId: req.body.organizationId,
    };

    const result = await videoIngestionService.processVideoFile(req.file, userId, options);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route GET /api/v1/videos
 * @desc Get all video sources for user
 * @access Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit, offset, status } = req.query;

    const result = await videoIngestionService.getUserVideoSources(userId, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      status,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get video sources error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route GET /api/v1/videos/:id
 * @desc Get single video source by ID
 * @access Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await videoIngestionService.getVideoSource(id, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get video source error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route DELETE /api/v1/videos/:id
 * @desc Delete video source
 * @access Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await videoIngestionService.deleteVideoSource(id, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Delete video source error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route GET /api/v1/videos/meta/info
 * @desc Get video processing capabilities
 * @access Public
 */
router.get('/meta/info', async (req, res) => {
  const hasFFmpeg = await videoIngestionService.checkFFmpeg();

  res.json({
    success: true,
    data: {
      ffmpegAvailable: hasFFmpeg,
      supportedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'm4v', 'wmv'],
      maxFileSize: '500MB',
      features: {
        frameExtraction: hasFFmpeg,
        audioTranscription: true,
        visualAnalysis: true,
      },
      defaultSettings: {
        frameInterval: 5,
        maxFrames: 10,
        transcribeAudio: true,
        analyzeFrames: true,
      },
    },
  });
});

module.exports = router;
