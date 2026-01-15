const express = require('express');
const router = express.Router();
const externalDatabaseService = require('../services/externalDatabaseService');

/**
 * External Database Ingestion Routes
 * Handles connecting to and importing from external databases
 */

/**
 * @route POST /api/v1/db-ingestion/test-connection
 * @desc Test connection to an external database
 * @access Private
 */
router.post('/test-connection', async (req, res) => {
  try {
    const { type, host, port, database, username, password, ssl } = req.body;

    if (!type || !host || !database || !username) {
      return res.status(400).json({
        success: false,
        error: 'Missing required connection parameters: type, host, database, username'
      });
    }

    const result = await externalDatabaseService.testConnection({
      type,
      host,
      port,
      database,
      username,
      password,
      ssl
    });

    res.json(result);

  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/v1/db-ingestion/tables
 * @desc Get list of tables from external database
 * @access Private
 */
router.post('/tables', async (req, res) => {
  try {
    const { type, host, port, database, username, password, ssl } = req.body;

    if (!type || !host || !database || !username) {
      return res.status(400).json({
        success: false,
        error: 'Missing required connection parameters'
      });
    }

    const result = await externalDatabaseService.getTables({
      type,
      host,
      port,
      database,
      username,
      password,
      ssl
    });

    res.json(result);

  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/v1/db-ingestion/schema
 * @desc Get schema for a specific table
 * @access Private
 */
router.post('/schema', async (req, res) => {
  try {
    const { connection, tableName } = req.body;

    if (!connection || !tableName) {
      return res.status(400).json({
        success: false,
        error: 'Connection config and tableName are required'
      });
    }

    const result = await externalDatabaseService.getTableSchema(connection, tableName);

    res.json(result);

  } catch (error) {
    console.error('Get schema error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/v1/db-ingestion/import
 * @desc Import data from external database table
 * @access Private
 */
router.post('/import', async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId || 'demo-user';
    const { connection, tableName, options = {} } = req.body;

    if (!connection || !tableName) {
      return res.status(400).json({
        success: false,
        error: 'Connection config and tableName are required'
      });
    }

    const result = await externalDatabaseService.importData(
      connection,
      tableName,
      options,
      userId
    );

    res.json(result);

  } catch (error) {
    console.error('Import data error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/v1/db-ingestion/query
 * @desc Execute a custom SELECT query on external database
 * @access Private
 */
router.post('/query', async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId || 'demo-user';
    const { connection, query } = req.body;

    if (!connection || !query) {
      return res.status(400).json({
        success: false,
        error: 'Connection config and query are required'
      });
    }

    const result = await externalDatabaseService.executeQuery(connection, query, userId);

    res.json(result);

  } catch (error) {
    console.error('Execute query error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/db-ingestion
 * @desc Get recent database imports for user
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId || 'demo-user';
    const { limit, offset } = req.query;

    const result = await externalDatabaseService.getRecentImports(userId, {
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0
    });

    res.json(result);

  } catch (error) {
    console.error('Get recent imports error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/db-ingestion/supported
 * @desc Get list of supported database types
 * @access Public
 */
router.get('/supported', (req, res) => {
  res.json({
    success: true,
    databases: [
      {
        type: 'postgresql',
        name: 'PostgreSQL',
        defaultPort: 5432,
        supported: true
      },
      {
        type: 'mysql',
        name: 'MySQL',
        defaultPort: 3306,
        supported: false,
        comingSoon: true
      },
      {
        type: 'sqlite',
        name: 'SQLite',
        defaultPort: null,
        supported: false,
        comingSoon: true
      },
      {
        type: 'mssql',
        name: 'Microsoft SQL Server',
        defaultPort: 1433,
        supported: false,
        comingSoon: true
      }
    ]
  });
});

module.exports = router;
