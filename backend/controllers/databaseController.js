const databaseService = require('../services/databaseService');
const aiAnalysisService = require('../services/aiAnalysisService');

/**
 * Database Controller - Manages form databases and AI analysis
 */

// List all databases (forms) for a user
exports.getDatabases = async (req, res) => {
  try {
    const userId = req.user.id;
    const { organizationId } = req.query;

    const databases = await databaseService.getDatabases(userId, organizationId);

    res.json({
      success: true,
      databases,
      total: databases.length,
    });
  } catch (error) {
    console.error('Get databases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve databases',
    });
  }
};

// Get records from a specific database
exports.getDatabaseRecords = async (req, res) => {
  try {
    const { databaseId } = req.params;
    const userId = req.user.id;
    const { page, limit, filters, sort, sortOrder } = req.query;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      filters: filters ? JSON.parse(filters) : {},
      sort: sort || 'submittedAt',
      sortOrder: sortOrder || 'desc',
    };

    const result = await databaseService.getDatabaseRecords(databaseId, userId, options);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Get database records error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Database not found',
    });
  }
};

// Search across databases
exports.searchDatabases = async (req, res) => {
  try {
    const userId = req.user.id;
    const { query, databases, fields, limit } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const options = {
      databases: databases || [],
      fields: fields || [],
      limit: parseInt(limit) || 20,
    };

    const results = await databaseService.searchDatabases(userId, query, options);

    res.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Search databases error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
    });
  }
};

// Get database analytics
exports.getDatabaseAnalytics = async (req, res) => {
  try {
    const { databaseId } = req.params;
    const userId = req.user.id;

    const analytics = await databaseService.getDatabaseAnalytics(databaseId, userId);

    res.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error('Get database analytics error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Database not found',
    });
  }
};

// Export database
exports.exportDatabase = async (req, res) => {
  try {
    const { databaseId } = req.params;
    const userId = req.user.id;
    const { format = 'json', limit } = req.query;

    const options = {
      limit: parseInt(limit) || 10000,
    };

    const exportData = await databaseService.exportDatabase(databaseId, userId, format, options);

    // Set appropriate headers for download
    const filename = `database_${databaseId}_export.${format}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', exportData.mimeType);

    if (format === 'json') {
      res.json(exportData);
    } else {
      res.send(exportData);
    }
  } catch (error) {
    console.error('Export database error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Export failed',
    });
  }
};

// AI Analysis endpoints

// Analyze database with AI
exports.analyzeDatabase = async (req, res) => {
  try {
    const { databaseId } = req.params;
    const userId = req.user.id;
    // `model` used to let callers pin gpt-4 vs gpt-3.5 — both the same
    // vendor, so never a real fallback. Which model actually answers is now
    // decided by the free-tier chain (backend/lib/aiChain.js); any `model`
    // sent by an old client is accepted but ignored.
    const { query, analysisType } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Analysis query is required',
      });
    }

    const analysisRequest = {
      query,
      analysisType: analysisType || 'CUSTOM',
    };

    const result = await aiAnalysisService.analyzeDatabase(databaseId, userId, analysisRequest);

    res.json({
      success: true,
      analysis: result,
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Analysis failed',
    });
  }
};

// Generate insights for a database
exports.generateInsights = async (req, res) => {
  try {
    const { databaseId } = req.params;
    const userId = req.user.id;
    const { insightType = 'comprehensive' } = req.body;

    const insights = await aiAnalysisService.generateInsights(databaseId, userId, insightType);

    res.json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error('Generate insights error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Insight generation failed',
    });
  }
};

// Intelligent search across databases
exports.intelligentSearch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { query, databases, includeInsights } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const options = {
      databases: databases || [],
      includeInsights: includeInsights !== false,
    };

    const results = await aiAnalysisService.intelligentSearch(userId, query, options);

    res.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Intelligent search error:', error);
    res.status(500).json({
      success: false,
      message: 'Intelligent search failed',
    });
  }
};

// Get predictive insights
exports.getPredictiveInsights = async (req, res) => {
  try {
    const { databaseId } = req.params;
    const userId = req.user.id;

    const insights = await aiAnalysisService.analyzePredictiveInsights(databaseId, userId);

    res.json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error('Predictive insights error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Predictive analysis failed',
    });
  }
};

// Export analysis results
exports.exportAnalysis = async (req, res) => {
  try {
    const { analysisId } = req.params;
    const userId = req.user.id;
    const { format = 'json' } = req.query;

    const exportData = await aiAnalysisService.exportAnalysis(analysisId, userId, format);

    const filename = `analysis_${analysisId}.${format}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (format === 'json') {
      res.json(exportData);
    } else {
      res.send(exportData);
    }
  } catch (error) {
    console.error('Export analysis error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Analysis not found',
    });
  }
};

// Get analysis history for a user
exports.getAnalysisHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, databaseId, analysisType } = req.query;

    const whereClause = {
      userId,
      ...(databaseId && { formId: databaseId }),
      ...(analysisType && { analysisType }),
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [analyses, total] = await Promise.all([
      prisma.lLMAnalysis.findMany({
        where: whereClause,
        select: {
          id: true,
          analysisType: true,
          prompt: true,
          status: true,
          processingTime: true,
          model: true,
          createdAt: true,
          form: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: parseInt(limit),
      }),
      prisma.lLMAnalysis.count({
        where: whereClause,
      }),
    ]);

    res.json({
      success: true,
      analyses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get analysis history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analysis history',
    });
  }
};
