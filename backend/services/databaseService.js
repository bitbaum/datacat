const prisma = require('../lib/prisma');

/**
 * Database Service for managing form-generated databases
 * Treats each form as a database table, submissions as records
 */
class DatabaseService {
  /**
   * Get all "databases" (forms) with their record counts and schema info
   */
  async getDatabases(userId, organizationId = null) {
    const whereClause = {
      userId,
      isPublished: true,
      ...(organizationId && { organizationId }),
    };

    const databases = await prisma.form.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        schema: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Transform schema to provide database-like metadata
    return databases.map((db) => ({
      id: db.id,
      name: db.title,
      description: db.description,
      tableSchema: this.extractTableSchema(db.schema),
      recordCount: db._count.submissions,
      createdAt: db.createdAt,
      updatedAt: db.updatedAt,
    }));
  }

  /**
   * Get all records (submissions) from a specific database (form)
   */
  async getDatabaseRecords(formId, userId, options = {}) {
    const {
      page = 1,
      limit = 50,
      filters = {},
      sort = 'submittedAt',
      sortOrder = 'desc',
    } = options;

    // Verify user has access to this form
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        userId,
      },
      select: {
        id: true,
        title: true,
        schema: true,
      },
    });

    if (!form) {
      throw new Error('Database not found or access denied');
    }

    const skip = (page - 1) * limit;

    // Build filter conditions based on form data
    const whereClause = {
      formId,
      ...this.buildFilterConditions(filters),
    };

    const [records, total] = await Promise.all([
      prisma.submission.findMany({
        where: whereClause,
        select: {
          id: true,
          data: true,
          submittedAt: true,
          updatedAt: true,
          status: true,
          submitter: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          [sort]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.submission.count({
        where: whereClause,
      }),
    ]);

    return {
      databaseName: form.title,
      schema: this.extractTableSchema(form.schema),
      records: records.map((record) => ({
        id: record.id,
        ...record.data,
        _metadata: {
          submittedAt: record.submittedAt,
          updatedAt: record.updatedAt,
          status: record.status,
          submittedBy: record.submitter,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Search across databases using natural language queries
   * This will be enhanced with AI search capabilities
   */
  async searchDatabases(userId, query, options = {}) {
    const { databases = [], fields = [], limit = 20 } = options;

    // Get user's forms to search within
    const userForms = await prisma.form.findMany({
      where: {
        userId,
        isPublished: true,
        ...(databases.length > 0 && { id: { in: databases } }),
      },
      select: {
        id: true,
        title: true,
        schema: true,
      },
    });

    const searchResults = [];

    for (const form of userForms) {
      // Build search conditions based on query
      const searchConditions = this.buildSearchConditions(query, form.schema, fields);

      if (searchConditions.length > 0) {
        const matches = await prisma.submission.findMany({
          where: {
            formId: form.id,
            OR: searchConditions,
          },
          select: {
            id: true,
            data: true,
            submittedAt: true,
          },
          take: limit,
        });

        if (matches.length > 0) {
          searchResults.push({
            databaseId: form.id,
            databaseName: form.title,
            matches: matches.map((match) => ({
              id: match.id,
              data: match.data,
              submittedAt: match.submittedAt,
              relevanceScore: this.calculateRelevanceScore(query, match.data),
            })),
          });
        }
      }
    }

    return {
      query,
      totalDatabases: searchResults.length,
      totalMatches: searchResults.reduce((sum, db) => sum + db.matches.length, 0),
      results: searchResults,
    };
  }

  /**
   * Get database statistics and insights
   */
  async getDatabaseAnalytics(formId, userId) {
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        userId,
      },
      select: {
        id: true,
        title: true,
        schema: true,
        createdAt: true,
      },
    });

    if (!form) {
      throw new Error('Database not found or access denied');
    }

    const [totalRecords, recentSubmissions, statusDistribution] = await Promise.all([
      prisma.submission.count({ where: { formId } }),
      prisma.submission.findMany({
        where: { formId },
        select: {
          submittedAt: true,
        },
        orderBy: {
          submittedAt: 'desc',
        },
        take: 30,
      }),
      prisma.submission.groupBy({
        by: ['status'],
        where: { formId },
        _count: {
          status: true,
        },
      }),
    ]);

    // Analyze field completion rates
    const fieldAnalytics = await this.analyzeFieldCompletion(formId, form.schema);

    return {
      databaseId: formId,
      databaseName: form.title,
      createdAt: form.createdAt,
      totalRecords,
      recentActivity: this.calculateSubmissionTrends(recentSubmissions),
      statusDistribution,
      fieldAnalytics,
      dataQuality: this.calculateDataQuality(fieldAnalytics),
    };
  }

  /**
   * Export database to various formats
   */
  async exportDatabase(formId, userId, format = 'json', options = {}) {
    const records = await this.getDatabaseRecords(formId, userId, {
      limit: options.limit || 10000,
    });

    switch (format.toLowerCase()) {
      case 'csv':
        return this.exportToCSV(records);
      case 'json':
        return this.exportToJSON(records);
      case 'xlsx':
        return this.exportToExcel(records);
      default:
        throw new Error('Unsupported export format');
    }
  }

  // Helper methods

  extractTableSchema(formSchema) {
    if (!formSchema.fields) return {};

    return formSchema.fields.reduce((schema, field) => {
      schema[field.name] = {
        type: field.type,
        label: field.label,
        required: field.required || false,
        options: field.options || null,
      };
      return schema;
    }, {});
  }

  buildFilterConditions(filters) {
    const conditions = {};

    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        conditions[`data.${field}`] = {
          contains: value,
          mode: 'insensitive',
        };
      }
    });

    return conditions;
  }

  buildSearchConditions(query, formSchema, fields) {
    const conditions = [];
    const searchableFields =
      fields.length > 0 ? fields : formSchema.fields?.map((f) => f.name) || [];

    searchableFields.forEach((fieldName) => {
      conditions.push({
        [`data.${fieldName}`]: {
          contains: query,
          mode: 'insensitive',
        },
      });
    });

    return conditions;
  }

  calculateRelevanceScore(query, data) {
    // Simple relevance scoring - can be enhanced with fuzzy matching
    let score = 0;
    const queryLower = query.toLowerCase();

    Object.values(data).forEach((value) => {
      if (typeof value === 'string' && value.toLowerCase().includes(queryLower)) {
        score += 1;
      }
    });

    return score;
  }

  calculateSubmissionTrends(submissions) {
    const trends = {};
    const now = new Date();

    submissions.forEach((sub) => {
      const dayDiff = Math.floor((now - new Date(sub.submittedAt)) / (1000 * 60 * 60 * 24));
      const period = dayDiff <= 7 ? 'week' : dayDiff <= 30 ? 'month' : 'older';
      trends[period] = (trends[period] || 0) + 1;
    });

    return trends;
  }

  async analyzeFieldCompletion(formId, schema) {
    if (!schema.fields) return {};

    const submissions = await prisma.submission.findMany({
      where: { formId },
      select: { data: true },
    });

    const fieldStats = {};

    schema.fields.forEach((field) => {
      const completionCount = submissions.filter(
        (sub) => sub.data[field.name] && sub.data[field.name] !== '',
      ).length;

      fieldStats[field.name] = {
        label: field.label,
        completionRate: submissions.length > 0 ? completionCount / submissions.length : 0,
        totalResponses: completionCount,
        missedResponses: submissions.length - completionCount,
      };
    });

    return fieldStats;
  }

  calculateDataQuality(fieldAnalytics) {
    const fields = Object.values(fieldAnalytics);
    if (fields.length === 0) return 0;

    const avgCompletion =
      fields.reduce((sum, field) => sum + field.completionRate, 0) / fields.length;
    return Math.round(avgCompletion * 100);
  }

  exportToCSV(records) {
    // Implementation for CSV export
    const headers = Object.keys(records.schema);
    const rows = records.records.map((record) => headers.map((header) => record[header] || ''));

    return {
      headers,
      rows,
      mimeType: 'text/csv',
    };
  }

  exportToJSON(records) {
    return {
      database: records.databaseName,
      schema: records.schema,
      records: records.records,
      mimeType: 'application/json',
    };
  }

  exportToExcel(records) {
    // Implementation for Excel export would go here
    return {
      data: records,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }
}

module.exports = new DatabaseService();
