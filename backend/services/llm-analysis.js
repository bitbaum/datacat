const prisma = require('../lib/prisma');
const { chatJSON, isChainConfigured } = require('../lib/aiChain');

class LLMAnalysisService {
  // Main analysis orchestrator
  async analyzeSubmission(submissionId, analysisTypes = ['SENTIMENT', 'CLASSIFICATION']) {
    // Check if any AI vendor is configured before proceeding (Groq / OpenRouter
    // free tier via ai-kit — see backend/lib/aiChain.js for why this replaced
    // a hard OPENAI_API_KEY-only gate).
    if (!(await isChainConfigured())) {
      console.warn('LLM analysis skipped: no AI vendor configured (GROQ_API_KEY / OPENROUTER_API_KEY)');
      return [];
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            schema: true,
            settings: true,
          },
        },
      },
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    const results = [];

    // Process each analysis type
    for (const analysisType of analysisTypes) {
      try {
        const startTime = Date.now();

        const result = await this.performAnalysis(analysisType, submission.data, submission.form);

        const processingTime = Date.now() - startTime;

        // Save analysis result
        const analysis = await prisma.lLMAnalysis.create({
          data: {
            submissionId: submission.id,
            formId: submission.formId,
            analysisType,
            prompt: result.prompt,
            result: result.analysis,
            confidence: result.confidence,
            processingTime,
            model: result.model,
            status: 'COMPLETED',
            userId: submission.form.userId,
          },
        });

        results.push(analysis);
      } catch (error) {
        console.error(`LLM Analysis failed for ${analysisType}:`, error);

        // Save failed analysis
        await prisma.lLMAnalysis.create({
          data: {
            submissionId: submission.id,
            formId: submission.formId,
            analysisType,
            prompt: `Failed analysis for ${analysisType}`,
            result: {},
            status: 'FAILED',
            error: error.message,
            model: 'ai-chain',
            userId: submission.form.userId,
          },
        });
      }
    }

    return results;
  }

  // Perform specific analysis based on type
  async performAnalysis(analysisType, submissionData, form) {
    switch (analysisType) {
      case 'SENTIMENT':
        return this.analyzeSentiment(submissionData, form);
      case 'CLASSIFICATION':
        return this.classifySubmission(submissionData, form);
      case 'EXTRACTION':
        return this.extractKeyInfo(submissionData, form);
      case 'SUMMARY':
        return this.summarizeSubmission(submissionData, form);
      case 'CUSTOM':
        return this.customAnalysis(submissionData, form);
      default:
        throw new Error(`Unknown analysis type: ${analysisType}`);
    }
  }

  // Sentiment analysis
  async analyzeSentiment(submissionData, form) {
    const textFields = this.extractTextFields(submissionData, form.schema);
    const combinedText = textFields.join(' ');

    const prompt = `Analyze the sentiment of the following form submission. Consider the overall tone, emotions expressed, and satisfaction level.

Form: ${form.title}
Content: ${combinedText}

Respond with ONLY a JSON object (no other text) with:
- sentiment: "positive", "negative", or "neutral"
- confidence: number between 0 and 1
- emotions: array of detected emotions
- reasoning: brief explanation of the analysis`;

    const { json: analysis, model } = await chatJSON({
      system:
        'You are an expert sentiment analysis AI. Provide accurate sentiment analysis in the requested JSON format.',
      prompt,
      temperature: 0.3,
    });

    return {
      prompt,
      analysis,
      confidence: analysis.confidence,
      model,
    };
  }

  // Classification analysis
  async classifySubmission(submissionData, form) {
    const textFields = this.extractTextFields(submissionData, form.schema);
    const combinedText = textFields.join(' ');

    // Get dynamic categories based on form type
    const categories = this.getFormCategories(form);

    const prompt = `Classify this form submission into relevant categories based on its content and context.

Form: ${form.title}
Content: ${combinedText}
Possible Categories: ${categories.join(', ')}

Respond with ONLY a JSON object (no other text) with:
- primaryCategory: the main category
- secondaryCategories: array of additional relevant categories
- confidence: number between 0 and 1
- tags: array of relevant keywords/tags
- reasoning: brief explanation`;

    const { json: analysis, model } = await chatJSON({
      system: 'You are an expert content classifier. Analyze and categorize content accurately.',
      prompt,
      temperature: 0.2,
    });

    return {
      prompt,
      analysis,
      confidence: analysis.confidence,
      model,
    };
  }

  // Key information extraction
  async extractKeyInfo(submissionData, form) {
    const allData = JSON.stringify(submissionData, null, 2);

    const prompt = `Extract key information and insights from this form submission.

Form: ${form.title}
Data: ${allData}

Respond with ONLY a JSON object (no other text) with:
- keyPoints: array of the most important information points
- entities: object with extracted entities (names, dates, locations, etc.)
- priorities: array of items that seem to need attention
- actionItems: suggested actions based on the submission
- confidence: number between 0 and 1`;

    const { json: analysis, model } = await chatJSON({
      system:
        'You are an expert at extracting key information from structured data. Focus on actionable insights.',
      prompt,
      temperature: 0.1,
    });

    return {
      prompt,
      analysis,
      confidence: analysis.confidence,
      model,
    };
  }

  // Summary generation
  async summarizeSubmission(submissionData, form) {
    const allData = JSON.stringify(submissionData, null, 2);

    const prompt = `Create a comprehensive summary of this form submission.

Form: ${form.title}
Data: ${allData}

Respond with ONLY a JSON object (no other text) with:
- executiveSummary: brief 2-3 sentence overview
- detailedSummary: comprehensive paragraph summary
- highlights: array of key highlights
- concerns: array of any potential issues or concerns
- recommendations: array of suggested next steps`;

    const { json: analysis, model } = await chatJSON({
      system: 'You are an expert at creating clear, actionable summaries of form submissions.',
      prompt,
      temperature: 0.4,
    });

    return {
      prompt,
      analysis,
      confidence: 0.9, // Summaries are generally reliable
      model,
    };
  }

  // Custom analysis based on form settings
  async customAnalysis(submissionData, form) {
    const customPrompt = form.settings?.customAnalysisPrompt;
    if (!customPrompt) {
      throw new Error('Custom analysis prompt not configured for this form');
    }

    const allData = JSON.stringify(submissionData, null, 2);

    const prompt = `${customPrompt}

Form Data: ${allData}

Respond with ONLY a JSON object (no other text) with at least these fields:
- result: your main analysis result
- confidence: number between 0 and 1
- reasoning: explanation of your analysis`;

    const { json: analysis, model } = await chatJSON({
      system:
        'You are an expert analyst. Follow the custom prompt instructions carefully and provide results in JSON format.',
      prompt,
      temperature: 0.3,
    });

    return {
      prompt,
      analysis,
      confidence: analysis.confidence || 0.8,
      model,
    };
  }

  // Helper: Extract text fields from submission data
  extractTextFields(submissionData, formSchema) {
    const textFields = [];

    if (formSchema && formSchema.fields) {
      formSchema.fields.forEach((field) => {
        const value = submissionData[field.id];
        if (value && typeof value === 'string' && value.trim()) {
          textFields.push(`${field.label || field.id}: ${value}`);
        }
      });
    }

    // Fallback: extract all string values
    if (textFields.length === 0) {
      Object.entries(submissionData).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim()) {
          textFields.push(`${key}: ${value}`);
        }
      });
    }

    return textFields;
  }

  // Helper: Get form-specific categories
  getFormCategories(form) {
    const defaultCategories = [
      'General Inquiry',
      'Support Request',
      'Feedback',
      'Complaint',
      'Suggestion',
      'Application',
      'Information Request',
    ];

    // Check if form has custom categories
    if (form.settings?.analysisCategories && Array.isArray(form.settings.analysisCategories)) {
      return form.settings.analysisCategories;
    }

    // Domain-specific categories based on form title/content
    const title = form.title.toLowerCase();
    if (title.includes('hr') || title.includes('employee') || title.includes('job')) {
      return [
        'Job Application',
        'Employee Feedback',
        'HR Inquiry',
        'Benefits Question',
        'Performance Review',
        'Training Request',
        'Complaint',
        'Exit Interview',
      ];
    }

    if (title.includes('support') || title.includes('help') || title.includes('issue')) {
      return [
        'Technical Issue',
        'Account Problem',
        'Bug Report',
        'Feature Request',
        'General Support',
        'Billing Question',
        'User Guidance',
      ];
    }

    return defaultCategories;
  }

  // Get analysis history for a form
  async getAnalysisHistory(formId, options = {}) {
    const { limit = 50, analysisType, dateFrom, dateTo } = options;

    return prisma.lLMAnalysis.findMany({
      where: {
        formId,
        ...(analysisType && { analysisType }),
        ...((dateFrom || dateTo) && {
          createdAt: {
            ...(dateFrom && { gte: dateFrom }),
            ...(dateTo && { lte: dateTo }),
          },
        }),
      },
      include: {
        submission: {
          select: {
            id: true,
            submittedAt: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Get analysis insights/metrics
  async getAnalysisInsights(formId, dateRange = 30) {
    const dateFrom = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);

    const analyses = await prisma.lLMAnalysis.findMany({
      where: {
        formId,
        createdAt: { gte: dateFrom },
        status: 'COMPLETED',
      },
      select: {
        analysisType: true,
        result: true,
        confidence: true,
        processingTime: true,
        createdAt: true,
      },
    });

    // Process insights
    const insights = {
      totalAnalyses: analyses.length,
      averageConfidence: 0,
      averageProcessingTime: 0,
      sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
      topCategories: {},
      performanceMetrics: {
        successRate: 100, // All fetched analyses are completed
        fastestAnalysis: Math.min(...analyses.map((a) => a.processingTime || 0)),
        slowestAnalysis: Math.max(...analyses.map((a) => a.processingTime || 0)),
      },
    };

    if (analyses.length > 0) {
      insights.averageConfidence =
        analyses.reduce((sum, a) => sum + (a.confidence || 0), 0) / analyses.length;
      insights.averageProcessingTime =
        analyses.reduce((sum, a) => sum + (a.processingTime || 0), 0) / analyses.length;

      // Process sentiment distribution
      analyses.forEach((analysis) => {
        if (analysis.analysisType === 'SENTIMENT' && analysis.result?.sentiment) {
          insights.sentimentDistribution[analysis.result.sentiment]++;
        }

        if (analysis.analysisType === 'CLASSIFICATION' && analysis.result?.primaryCategory) {
          const category = analysis.result.primaryCategory;
          insights.topCategories[category] = (insights.topCategories[category] || 0) + 1;
        }
      });
    }

    return insights;
  }
}

module.exports = LLMAnalysisService;
