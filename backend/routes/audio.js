const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const audioIngestionService = require('../services/audioIngestionService');
const auth = require('../middleware/auth');

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads/audio');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `audio-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit (Whisper API max)
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a',
      'audio/wav', 'audio/webm', 'audio/ogg', 'audio/flac',
      'audio/x-m4a', 'audio/x-wav'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only audio files are allowed.`), false);
    }
  }
});

/**
 * @route POST /api/v1/audio/upload
 * @desc Upload and transcribe an audio file
 * @access Private
 */
router.post('/upload', auth, upload.single('audio'), async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    const options = {
      name: req.body.name || req.file.originalname,
      description: req.body.description,
      language: req.body.language,
      prompt: req.body.prompt,
      formId: req.body.formId,
      organizationId: req.body.organizationId
    };

    const result = await audioIngestionService.processAudioFile(
      req.file,
      userId,
      options
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Audio upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/v1/audio/record
 * @desc Process base64 audio data (from browser recording)
 * @access Private
 */
router.post('/record', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { audioData, name, description, language, prompt, formId } = req.body;

    if (!audioData) {
      return res.status(400).json({
        success: false,
        error: 'No audio data provided'
      });
    }

    const result = await audioIngestionService.processBase64Audio(
      audioData,
      userId,
      { name, description, language, prompt, formId }
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Audio record error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/audio
 * @desc Get all audio sources for user
 * @access Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit, offset, status, formId } = req.query;

    const result = await audioIngestionService.getUserAudioSources(userId, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      status,
      formId
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get audio sources error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/audio/:id
 * @desc Get single audio source by ID
 * @access Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await audioIngestionService.getAudioSource(id, userId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get audio source error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/v1/audio/:id
 * @desc Delete audio source
 * @access Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await audioIngestionService.deleteAudioSource(id, userId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Delete audio source error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/v1/audio/:id/analyze
 * @desc Analyze transcription with custom prompt
 * @access Private
 */
router.post('/:id/analyze', auth, async (req, res) => {
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

    const result = await audioIngestionService.analyzeTranscription(id, userId, prompt);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Analyze transcription error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
