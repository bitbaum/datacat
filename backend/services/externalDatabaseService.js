/**
 * External Database Ingestion Service
 * Handles connecting to external databases and importing data
 */

const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const { Pool } = require('pg');

/**
 * Supported database types
 */
const SUPPORTED_DATABASES = {
  POSTGRESQL: 'postgresql',
  MYSQL: 'mysql',
  SQLITE: 'sqlite',
  MSSQL: 'mssql'
};

/**
 * Test connection to an external database
 */
async function testConnection(connectionConfig) {
  const { type, host, port, database, username, password, ssl } = connectionConfig;

  try {
    if (type === SUPPORTED_DATABASES.POSTGRESQL) {
      const pool = new Pool({
        host,
        port: port || 5432,
        database,
        user: username,
        password,
        ssl: ssl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 10000
      });

      const client = await pool.connect();
      const result = await client.query('SELECT version()');
      client.release();
      await pool.end();

      return {
        success: true,
        message: 'Connection successful',
        version: result.rows[0].version,
        type: 'postgresql'
      };
    }

    // Add support for other database types as needed
    throw new Error(`Database type '${type}' is not yet supported`);

  } catch (error) {
    console.error('Database connection test failed:', error);
    return {
      success: false,
      message: error.message || 'Connection failed',
      error: error.code
    };
  }
}

/**
 * Get list of tables from external database
 */
async function getTables(connectionConfig) {
  const { type, host, port, database, username, password, ssl } = connectionConfig;

  try {
    if (type === SUPPORTED_DATABASES.POSTGRESQL) {
      const pool = new Pool({
        host,
        port: port || 5432,
        database,
        user: username,
        password,
        ssl: ssl ? { rejectUnauthorized: false } : false
      });

      const client = await pool.connect();
      const result = await client.query(`
        SELECT
          table_schema,
          table_name,
          (SELECT COUNT(*) FROM information_schema.columns c
           WHERE c.table_name = t.table_name AND c.table_schema = t.table_schema) as column_count
        FROM information_schema.tables t
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
          AND table_type = 'BASE TABLE'
        ORDER BY table_schema, table_name
      `);
      client.release();
      await pool.end();

      return {
        success: true,
        tables: result.rows.map(row => ({
          schema: row.table_schema,
          name: row.table_name,
          fullName: `${row.table_schema}.${row.table_name}`,
          columnCount: parseInt(row.column_count)
        }))
      };
    }

    throw new Error(`Database type '${type}' is not yet supported`);

  } catch (error) {
    console.error('Get tables failed:', error);
    return {
      success: false,
      message: error.message,
      tables: []
    };
  }
}

/**
 * Get table schema (columns) from external database
 */
async function getTableSchema(connectionConfig, tableName) {
  const { type, host, port, database, username, password, ssl } = connectionConfig;

  try {
    if (type === SUPPORTED_DATABASES.POSTGRESQL) {
      const pool = new Pool({
        host,
        port: port || 5432,
        database,
        user: username,
        password,
        ssl: ssl ? { rejectUnauthorized: false } : false
      });

      // Parse schema and table name
      const [schema, table] = tableName.includes('.')
        ? tableName.split('.')
        : ['public', tableName];

      const client = await pool.connect();

      // Get columns
      const columnsResult = await client.query(`
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position
      `, [schema, table]);

      // Get row count estimate
      const countResult = await client.query(`
        SELECT reltuples::bigint as estimate
        FROM pg_class
        WHERE oid = $1::regclass
      `, [`${schema}.${table}`]);

      client.release();
      await pool.end();

      return {
        success: true,
        tableName,
        schema,
        table,
        columns: columnsResult.rows.map(col => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES',
          default: col.column_default,
          maxLength: col.character_maximum_length
        })),
        estimatedRows: countResult.rows[0]?.estimate || 0
      };
    }

    throw new Error(`Database type '${type}' is not yet supported`);

  } catch (error) {
    console.error('Get table schema failed:', error);
    return {
      success: false,
      message: error.message,
      columns: []
    };
  }
}

/**
 * Import data from external database table
 */
async function importData(connectionConfig, tableName, options, userId) {
  const { type, host, port, database, username, password, ssl } = connectionConfig;
  const { limit = 1000, offset = 0, columns = [], where = '' } = options;

  const startTime = Date.now();

  try {
    if (type === SUPPORTED_DATABASES.POSTGRESQL) {
      const pool = new Pool({
        host,
        port: port || 5432,
        database,
        user: username,
        password,
        ssl: ssl ? { rejectUnauthorized: false } : false
      });

      // Parse schema and table name
      const [schema, table] = tableName.includes('.')
        ? tableName.split('.')
        : ['public', tableName];

      const client = await pool.connect();

      // Build query
      const selectColumns = columns.length > 0 ? columns.join(', ') : '*';
      let query = `SELECT ${selectColumns} FROM "${schema}"."${table}"`;
      if (where) {
        query += ` WHERE ${where}`;
      }
      query += ` LIMIT ${limit} OFFSET ${offset}`;

      const result = await client.query(query);

      // Get total count
      let countQuery = `SELECT COUNT(*) as total FROM "${schema}"."${table}"`;
      if (where) {
        countQuery += ` WHERE ${where}`;
      }
      const countResult = await client.query(countQuery);

      client.release();
      await pool.end();

      const processingTime = Date.now() - startTime;

      // Create a DataSource record
      const dataSource = await prisma.dataSource.create({
        data: {
          type: 'DATABASE',
          name: `Import from ${database}.${tableName}`,
          description: `Imported ${result.rows.length} rows from ${tableName}`,
          status: 'COMPLETED',
          fileUrl: `postgresql://${host}:${port}/${database}`,
          extractedText: JSON.stringify(result.rows, null, 2).slice(0, 10000),
          extractedData: {
            source: {
              type: 'postgresql',
              host,
              database,
              table: tableName
            },
            columns: columns.length > 0 ? columns : Object.keys(result.rows[0] || {}),
            rowCount: result.rows.length,
            totalRows: parseInt(countResult.rows[0].total),
            query: {
              limit,
              offset,
              where: where || null
            },
            sampleData: result.rows.slice(0, 10)
          },
          metadata: {
            importedAt: new Date().toISOString(),
            processingTime
          },
          processingTime,
          processedAt: new Date(),
          userId
        }
      });

      return {
        success: true,
        dataSourceId: dataSource.id,
        data: result.rows,
        rowCount: result.rows.length,
        totalRows: parseInt(countResult.rows[0].total),
        processingTime,
        columns: Object.keys(result.rows[0] || {})
      };
    }

    throw new Error(`Database type '${type}' is not yet supported`);

  } catch (error) {
    console.error('Import data failed:', error);

    // Log failed attempt
    await prisma.dataSource.create({
      data: {
        type: 'DATABASE',
        name: `Failed import from ${tableName}`,
        status: 'FAILED',
        error: error.message,
        metadata: {
          connectionConfig: { type, host, port, database },
          tableName
        },
        userId
      }
    });

    return {
      success: false,
      message: error.message,
      data: []
    };
  }
}

/**
 * Execute custom query on external database
 */
async function executeQuery(connectionConfig, query, userId) {
  const { type, host, port, database, username, password, ssl } = connectionConfig;

  const startTime = Date.now();

  // Safety check - only allow SELECT queries
  const normalizedQuery = query.trim().toUpperCase();
  if (!normalizedQuery.startsWith('SELECT')) {
    throw new Error('Only SELECT queries are allowed for security reasons');
  }

  try {
    if (type === SUPPORTED_DATABASES.POSTGRESQL) {
      const pool = new Pool({
        host,
        port: port || 5432,
        database,
        user: username,
        password,
        ssl: ssl ? { rejectUnauthorized: false } : false
      });

      const client = await pool.connect();
      const result = await client.query(query);
      client.release();
      await pool.end();

      const processingTime = Date.now() - startTime;

      // Create a DataSource record
      const dataSource = await prisma.dataSource.create({
        data: {
          type: 'DATABASE',
          name: `Custom query on ${database}`,
          description: query.slice(0, 200),
          status: 'COMPLETED',
          fileUrl: `postgresql://${host}:${port}/${database}`,
          extractedText: JSON.stringify(result.rows, null, 2).slice(0, 10000),
          extractedData: {
            source: {
              type: 'postgresql',
              host,
              database
            },
            query,
            columns: result.fields.map(f => f.name),
            rowCount: result.rows.length,
            sampleData: result.rows.slice(0, 10)
          },
          metadata: {
            executedAt: new Date().toISOString(),
            processingTime
          },
          processingTime,
          processedAt: new Date(),
          userId
        }
      });

      return {
        success: true,
        dataSourceId: dataSource.id,
        data: result.rows,
        rowCount: result.rows.length,
        columns: result.fields.map(f => f.name),
        processingTime
      };
    }

    throw new Error(`Database type '${type}' is not yet supported`);

  } catch (error) {
    console.error('Execute query failed:', error);
    return {
      success: false,
      message: error.message,
      data: []
    };
  }
}

/**
 * Get recent database imports for a user
 */
async function getRecentImports(userId, options = {}) {
  const { limit = 20, offset = 0 } = options;

  try {
    const dataSources = await prisma.dataSource.findMany({
      where: {
        userId,
        type: 'DATABASE'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    const total = await prisma.dataSource.count({
      where: {
        userId,
        type: 'DATABASE'
      }
    });

    return {
      success: true,
      dataSources,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };

  } catch (error) {
    console.error('Get recent imports failed:', error);
    return {
      success: false,
      dataSources: [],
      total: 0
    };
  }
}

module.exports = {
  SUPPORTED_DATABASES,
  testConnection,
  getTables,
  getTableSchema,
  importData,
  executeQuery,
  getRecentImports
};
