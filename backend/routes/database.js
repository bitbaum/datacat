const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const databaseController = require('../controllers/databaseController');

// Apply authentication middleware to all routes
router.use(auth);

// Database management routes
router.get('/', databaseController.getDatabases);
router.get('/:databaseId/records', databaseController.getDatabaseRecords);
router.post('/search', databaseController.searchDatabases);
router.get('/:databaseId/analytics', databaseController.getDatabaseAnalytics);
router.get('/:databaseId/export', databaseController.exportDatabase);

// AI Analysis routes
router.post('/:databaseId/analyze', databaseController.analyzeDatabase);
router.post('/:databaseId/insights', databaseController.generateInsights);
router.post('/intelligent-search', databaseController.intelligentSearch);
router.get('/:databaseId/predictive-insights', databaseController.getPredictiveInsights);

// Analysis management
router.get('/analyses/history', databaseController.getAnalysisHistory);
router.get('/analyses/:analysisId/export', databaseController.exportAnalysis);

module.exports = router;
