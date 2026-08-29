const express = require('express');
const router = express.Router();
const websiteIngestionService = require('../services/websiteIngestionService');
const auth = require('../middleware/auth');

/**
 * @route POST /api/v1/websites/scrape
 * @desc Scrape and analyze a URL
 * @access Private
 */
router.post('/scrape', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      url,
      name,
      description,
      extractType = 'auto',
      waitForSelector,
      screenshot = false,
      customPrompt,
      formId,
      organizationId,
    } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
      });
    }

    const result = await websiteIngestionService.processUrl(url, userId, {
      name,
      description,
      extractType,
      waitForSelector,
      screenshot,
      customPrompt,
      formId,
      organizationId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Website scrape error:', error);
    res
      .status(
        error.message.includes('Invalid URL') || error.message.includes('not allowed') ? 400 : 500,
      )
      .json({
        success: false,
        error: error.message,
      });
  }
});

/**
 * @route POST /api/v1/websites/batch
 * @desc Batch scrape multiple URLs
 * @access Private
 */
router.post('/batch', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { urls, ...options } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'URLs array is required',
      });
    }

    if (urls.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 URLs per batch',
      });
    }

    const results = await websiteIngestionService.processUrls(urls, userId, options);

    res.json({
      success: true,
      data: {
        total: urls.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      },
    });
  } catch (error) {
    console.error('Batch scrape error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route GET /api/v1/websites
 * @desc Get all website sources for user
 * @access Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit, offset, status } = req.query;

    const result = await websiteIngestionService.getUserWebsiteSources(userId, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      status,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get website sources error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route GET /api/v1/websites/:id
 * @desc Get single website source by ID
 * @access Private
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await websiteIngestionService.getWebsiteSource(id, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get website source error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route DELETE /api/v1/websites/:id
 * @desc Delete website source
 * @access Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await websiteIngestionService.deleteWebsiteSource(id, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Delete website source error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route POST /api/v1/websites/:id/rescrape
 * @desc Re-scrape a URL
 * @access Private
 */
router.post('/:id/rescrape', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const options = req.body;

    const result = await websiteIngestionService.rescrapeUrl(id, userId, options);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Rescrape URL error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route GET /api/v1/websites/meta/info
 * @desc Get website scraping capabilities
 * @access Public
 */
router.get('/meta/info', async (req, res) => {
  res.json({
    success: true,
    data: {
      supportedTypes: ['auto', 'article', 'product', 'contact', 'listing', 'form'],
      features: {
        screenshot: true,
        customSelectors: true,
        batchScraping: true,
        structuredExtraction: true,
        aiAnalysis: true,
      },
      limits: {
        maxBatchSize: 10,
        maxContentLength: '100KB',
        timeout: '30s',
      },
      blockedDomains: ['localhost', '127.0.0.1', 'private networks'],
    },
  });
});

module.exports = router;
