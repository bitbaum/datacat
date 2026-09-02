const prisma = require('../lib/prisma');
const { chatText, isChainConfigured } = require('../lib/aiChain');

/**
 * AI Analysis Service for intelligent database querying and insights
 * Integrates with LLM models to analyze form submission data
 *
 * Text generation runs through the shared free-tier fallback chain
 * (backend/lib/aiChain.js — Groq -> OpenRouter via ai-kit) instead of a
 * single hardcoded OpenAI client, so a single vendor's outage/billing hiccup
 * no longer takes every database analysis feature down with it.
 */
class AIAnalysisService {
  /**
   * Analyze form database with natural language queries
   */
  async analyzeDatabase(formId, userId, analysisRequest) {
    // `model` is accepted for backward compatibility with existing callers but
    // no longer selects a specific vendor model — the free-tier fallback chain
    // (backend/lib/aiChain.js) decides which vendor/model actually answers,
    // since pinning one model here is exactly the single point of failure
    // this change removes. The record's `model` field is filled in with the
    // model that actually answered once the call completes.
    const { query, analysisType = 'CUSTOM' } = analysisRequest;

    // Get form and submissions data
    const formData = await this.getFormDataForAnalysis(formId, userId);

    if (!formData) {
      throw new Error('Database not found or access denied');
    }

    // Create analysis record
    const analysis = await prisma.lLMAnalysis.create({
      data: {
        formId,
        analysisType,
        prompt: query,
        model: 'ai-chain',
        userId,
        status: 'PROCESSING',
      },
    });

    try {
      const startTime = Date.now();

      // Prepare data context for AI
      const dataContext = this.prepareDataContext(formData);

      // Generate AI prompt based on analysis type
      const systemPrompt = this.generateSystemPrompt(analysisType, formData.schema);
      const userPrompt = this.generateUserPrompt(query, dataContext);

      // Call AI model
      const aiResponse = await this.callAIModel(systemPrompt, userPrompt);

      const processingTime = Date.now() - startTime;

      // Update analysis with results
      const updatedAnalysis = await prisma.lLMAnalysis.update({
        where: { id: analysis.id },
        data: {
          result: aiResponse,
          model: aiResponse.model,
          processingTime,
          status: 'COMPLETED',
        },
      });

      return {
        analysisId: updatedAnalysis.id,
        query,
        result: aiResponse,
        processingTime,
        databaseInfo: {
          name: formData.title,
          recordCount: formData.submissions.length,
          fields: Object.keys(formData.schema),
        },
      };
    } catch (error) {
      // Update analysis with error
      await prisma.lLMAnalysis.update({
        where: { id: analysis.id },
        data: {
          status: 'FAILED',
          error: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Generate insights and patterns from database
   */
  async generateInsights(formId, userId, insightType = 'comprehensive') {
    const formData = await this.getFormDataForAnalysis(formId, userId);

    if (!formData || formData.submissions.length === 0) {
      throw new Error('Insufficient data for analysis');
    }

    const insights = await this.analyzeDatabase(formId, userId, {
      query: this.getInsightPrompt(insightType, formData),
      analysisType: 'SUMMARY',
    });

    return insights;
  }

  /**
   * Smart search across multiple databases
   */
  async intelligentSearch(userId, searchQuery, options = {}) {
    const { databases = [], includeInsights = true } = options;

    // Get user's databases
    const userForms = await prisma.form.findMany({
      where: {
        userId,
        isPublished: true,
        ...(databases.length > 0 && { id: { in: databases } }),
      },
      select: {
        id: true,
        title: true,
        description: true,
        schema: true,
        _count: {
          select: { submissions: true },
        },
      },
    });

    const searchResults = {
      query: searchQuery,
      databases: [],
      overallInsights: null,
    };

    // Search each database
    for (const form of userForms) {
      if (form._count.submissions === 0) continue;

      try {
        const analysis = await this.analyzeDatabase(form.id, userId, {
          query: `Search and analyze this database for: "${searchQuery}". Provide relevant matches and insights.`,
          analysisType: 'EXTRACTION',
        });

        searchResults.databases.push({
          databaseId: form.id,
          databaseName: form.title,
          recordCount: form._count.submissions,
          analysis: analysis.result,
          relevanceScore: this.calculateDatabaseRelevance(searchQuery, form, analysis.result),
        });
      } catch (error) {
        console.error(`Search failed for database ${form.id}:`, error.message);
      }
    }

    // Generate overall insights if requested
    if (includeInsights && searchResults.databases.length > 0) {
      searchResults.overallInsights = await this.generateCrossDatabaseInsights(
        searchQuery,
        searchResults.databases,
      );
    }

    // Sort by relevance
    searchResults.databases.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return searchResults;
  }

  /**
   * Predict form completion patterns and suggest improvements
   */
  async analyzePredictiveInsights(formId, userId) {
    const formData = await this.getFormDataForAnalysis(formId, userId);

    if (!formData || formData.submissions.length < 10) {
      throw new Error('Need at least 10 submissions for predictive analysis');
    }

    const analysis = await this.analyzeDatabase(formId, userId, {
      query: `Analyze submission patterns, identify trends, predict future submissions, and suggest form improvements. Focus on:
      1. Completion rates by field
      2. Common dropout points
      3. Time-based submission patterns
      4. Data quality issues
      5. Recommendations for optimization`,
      analysisType: 'SUMMARY',
    });

    return {
      ...analysis,
      type: 'predictive_insights',
      recommendations: await this.generateFormOptimizationSuggestions(formData),
    };
  }

  /**
   * Export analysis results for reporting
   */
  async exportAnalysis(analysisId, userId, format = 'json') {
    const analysis = await prisma.lLMAnalysis.findFirst({
      where: {
        id: analysisId,
        userId,
      },
      include: {
        form: {
          select: {
            title: true,
            description: true,
          },
        },
      },
    });

    if (!analysis) {
      throw new Error('Analysis not found or access denied');
    }

    const exportData = {
      analysisId: analysis.id,
      databaseName: analysis.form?.title || 'Unknown',
      analysisType: analysis.analysisType,
      query: analysis.prompt,
      result: analysis.result,
      model: analysis.model,
      processingTime: analysis.processingTime,
      confidence: analysis.confidence,
      createdAt: analysis.createdAt,
    };

    switch (format.toLowerCase()) {
      case 'pdf':
        return this.exportToPDF(exportData);
      case 'csv':
        return this.exportAnalysisToCSV(exportData);
      default:
        return exportData;
    }
  }

  // Helper methods

  async getFormDataForAnalysis(formId, userId) {
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        userId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        schema: true,
        submissions: {
          select: {
            id: true,
            data: true,
            submittedAt: true,
            status: true,
          },
          orderBy: {
            submittedAt: 'desc',
          },
        },
      },
    });

    if (!form) return null;

    return {
      ...form,
      schema: form.schema.fields
        ? form.schema.fields.reduce((acc, field) => {
            acc[field.name] = {
              type: field.type,
              label: field.label,
              required: field.required,
            };
            return acc;
          }, {})
        : {},
    };
  }

  prepareDataContext(formData) {
    return {
      databaseName: formData.title,
      description: formData.description,
      schema: formData.schema,
      recordCount: formData.submissions.length,
      sampleRecords: formData.submissions.slice(0, 10).map((s) => s.data),
      submissionDates: formData.submissions.map((s) => s.submittedAt),
    };
  }

  generateSystemPrompt(analysisType, schema) {
    const basePrompt = `You are an AI data analyst specialized in analyzing form submission databases. 
    
Database Schema: ${JSON.stringify(schema, null, 2)}

Instructions:
- Analyze data patterns and provide actionable insights
- Use clear, business-friendly language
- Provide specific examples from the data when possible
- Structure your response as JSON with clear sections
- Be concise but thorough`;

    const typeSpecificPrompts = {
      SENTIMENT: 'Focus on emotional tone and sentiment analysis of text responses.',
      CLASSIFICATION: 'Categorize and classify the data into meaningful groups.',
      EXTRACTION: 'Extract specific information and data points as requested.',
      SUMMARY: 'Provide comprehensive summaries and key insights.',
      CUSTOM: 'Follow the specific analysis request provided by the user.',
    };

    return `${basePrompt}\n\nSpecific Focus: ${typeSpecificPrompts[analysisType] || typeSpecificPrompts.CUSTOM}`;
  }

  generateUserPrompt(query, dataContext) {
    return `Query: ${query}

Database Context:
- Name: ${dataContext.databaseName}
- Description: ${dataContext.description || 'No description'}
- Total Records: ${dataContext.recordCount}
- Fields: ${Object.keys(dataContext.schema).join(', ')}

Sample Data:
${JSON.stringify(dataContext.sampleRecords, null, 2)}

Please analyze this data and respond to the query above.`;
  }

  /**
   * Run one completion through the shared free-tier fallback chain.
   *
   * The `model` selector this used to take is gone — it only ever picked
   * between two hardcoded OpenAI models, both from the same vendor, so it was
   * never a real fallback. Which vendor/model actually answers is now decided
   * by backend/lib/aiChain.js.
   */
  async callAIModel(systemPrompt, userPrompt) {
    if (!(await isChainConfigured())) {
      throw new Error(
        'No AI vendor configured (set GROQ_API_KEY and/or OPENROUTER_API_KEY) — AI analysis is unavailable',
      );
    }

    try {
      const response = await chatText({
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.3,
        maxTokens: 2000,
      });

      return {
        content: response.content,
        usage: response.usage,
        model: response.model,
      };
    } catch (error) {
      console.error('AI model call failed:', error);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  getInsightPrompt(insightType, formData) {
    const prompts = {
      comprehensive: `Analyze this database comprehensively and provide:
        1. Key trends and patterns in the data
        2. Notable correlations between fields
        3. Data quality assessment
        4. Completion rate analysis
        5. Actionable recommendations for improvement`,

      completion_analysis: `Focus on analyzing form completion patterns:
        1. Which fields have the highest/lowest completion rates?
        2. Where do users typically drop off?
        3. How can we improve completion rates?`,

      trend_analysis: `Analyze temporal trends in the submissions:
        1. How has submission volume changed over time?
        2. Are there patterns by day/time/season?
        3. What trends can we predict for the future?`,
    };

    return prompts[insightType] || prompts.comprehensive;
  }

  calculateDatabaseRelevance(query, form, analysisResult) {
    let score = 0;
    const queryLower = query.toLowerCase();

    // Title relevance
    if (form.title.toLowerCase().includes(queryLower)) score += 10;

    // Description relevance
    if (form.description?.toLowerCase().includes(queryLower)) score += 5;

    // Schema field relevance
    if (form.schema.fields) {
      form.schema.fields.forEach((field) => {
        if (field.label.toLowerCase().includes(queryLower)) score += 3;
        if (field.name.toLowerCase().includes(queryLower)) score += 2;
      });
    }

    // Analysis result relevance (simple keyword matching)
    if (analysisResult.content && analysisResult.content.toLowerCase().includes(queryLower)) {
      score += 15;
    }

    return Math.min(score, 100); // Cap at 100
  }

  async generateCrossDatabaseInsights(query, databaseResults) {
    const combinedContext = databaseResults.map((db) => ({
      name: db.databaseName,
      records: db.recordCount,
      insights: db.analysis.content,
    }));

    try {
      const response = await this.callAIModel(
        'You are analyzing insights across multiple databases. Identify patterns, correlations, and insights that span across the different databases.',
        `Original Query: ${query}

        Database Results:
        ${JSON.stringify(combinedContext, null, 2)}

        Provide cross-database insights, patterns, and recommendations.`,
      );

      return response.content;
    } catch (error) {
      console.error('Cross-database insights generation failed:', error);
      return null;
    }
  }

  async generateFormOptimizationSuggestions(formData) {
    // Analyze completion rates, field types, and patterns
    const fieldAnalysis = {};

    formData.submissions.forEach((submission) => {
      Object.entries(formData.schema).forEach(([fieldName, fieldInfo]) => {
        if (!fieldAnalysis[fieldName]) {
          fieldAnalysis[fieldName] = {
            total: 0,
            completed: 0,
            fieldInfo,
          };
        }
        fieldAnalysis[fieldName].total++;
        if (submission.data[fieldName]) {
          fieldAnalysis[fieldName].completed++;
        }
      });
    });

    const suggestions = [];

    Object.entries(fieldAnalysis).forEach(([fieldName, analysis]) => {
      const completionRate = analysis.completed / analysis.total;

      if (completionRate < 0.7) {
        suggestions.push({
          field: fieldName,
          issue: 'Low completion rate',
          recommendation: `Consider making ${fieldName} optional or simplifying the input`,
          priority: 'high',
        });
      }
    });

    return suggestions;
  }

  exportToPDF(data) {
    // PDF export implementation would go here
    return {
      data,
      mimeType: 'application/pdf',
      filename: `analysis_${data.analysisId}.pdf`,
    };
  }

  exportAnalysisToCSV(data) {
    // CSV export for analysis results
    return {
      data,
      mimeType: 'text/csv',
      filename: `analysis_${data.analysisId}.csv`,
    };
  }
}

module.exports = new AIAnalysisService();
