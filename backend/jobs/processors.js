const { analysisQueue, emailQueue, exportQueue } = require('./queue');
const LLMAnalysisService = require('../services/llm-analysis');

// Lazy load the LLM service
let llmAnalysisService = null;
const getLLMService = () => {
  if (!llmAnalysisService) {
    llmAnalysisService = new LLMAnalysisService();
  }
  return llmAnalysisService;
};
const webSocketService = require('../services/websocket');
const prisma = require('../lib/prisma');
const fs = require('fs').promises;
const path = require('path');

// LLM Analysis Job Processor
analysisQueue.process('analyze-submission', async (job) => {
  const { submissionId, analysisTypes } = job.data;

  console.log(`Processing LLM analysis for submission ${submissionId}`);

  try {
    // Update job progress
    await job.progress(10);

    // Get submission with form info for WebSocket notification
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { form: { select: { id: true } } },
    });

    // Update submission status
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: 'PROCESSING' },
    });

    await job.progress(20);

    // Perform LLM analysis
    const results = await getLLMService().analyzeSubmission(submissionId, analysisTypes);

    await job.progress(80);

    // Update submission status
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: 'PROCESSED' },
    });

    await job.progress(100);

    // Notify connected clients via WebSocket
    webSocketService.notifyAnalysisComplete(submission.form.id, submissionId, results);

    console.log(`LLM analysis completed for submission ${submissionId}`);
    return {
      submissionId,
      analysisCount: results.length,
      completedAt: new Date(),
    };
  } catch (error) {
    console.error(`LLM analysis failed for submission ${submissionId}:`, error);

    // Update submission status to failed
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: 'PENDING' }, // Reset to pending for retry
    });

    throw error;
  }
});

// Email Notification Job Processor
emailQueue.process('send-notification', async (job) => {
  const { type, recipient, data } = job.data;

  console.log(`Processing email notification: ${type} to ${recipient}`);

  try {
    await job.progress(10);

    // Here you would integrate with your email service (SendGrid, AWS SES, etc.)
    // For now, we'll simulate the email sending

    await job.progress(50);

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await job.progress(90);

    // Log the email (in production, replace with actual email service)
    console.log(`Email sent: ${type} to ${recipient}`, {
      subject: data.subject,
      preview: data.content?.substring(0, 100) + '...',
    });

    await job.progress(100);

    return {
      type,
      recipient,
      sentAt: new Date(),
      status: 'sent',
    };
  } catch (error) {
    console.error(`Email sending failed for ${type} to ${recipient}:`, error);
    throw error;
  }
});

// Data Export Job Processor
exportQueue.process('export-data', async (job) => {
  const { formId, format, userId, dateFrom, dateTo } = job.data;

  console.log(`Processing data export for form ${formId} in ${format} format`);

  try {
    await job.progress(10);

    // Fetch submissions
    const submissions = await prisma.submission.findMany({
      where: {
        formId,
        ...((dateFrom || dateTo) && {
          submittedAt: {
            ...(dateFrom && { gte: new Date(dateFrom) }),
            ...(dateTo && { lte: new Date(dateTo) }),
          },
        }),
      },
      include: {
        form: {
          select: {
            title: true,
            schema: true,
          },
        },
        submitter: {
          select: {
            name: true,
            email: true,
          },
        },
        analyses: {
          select: {
            analysisType: true,
            result: true,
            confidence: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    await job.progress(30);

    // Prepare export data
    let exportData;
    let filename;
    let mimeType;

    if (format === 'json') {
      exportData = JSON.stringify(
        {
          form: {
            id: formId,
            title: submissions[0]?.form.title || 'Unknown Form',
            exportedAt: new Date(),
            totalSubmissions: submissions.length,
          },
          submissions: submissions.map((sub) => ({
            id: sub.id,
            submittedAt: sub.submittedAt,
            status: sub.status,
            source: sub.source,
            data: sub.data,
            submitter: sub.submitter
              ? {
                  name: sub.submitter.name,
                  email: sub.submitter.email,
                }
              : null,
            analyses: sub.analyses,
          })),
        },
        null,
        2,
      );
      filename = `form-${formId}-export-${Date.now()}.json`;
      mimeType = 'application/json';
    } else if (format === 'csv') {
      // Convert to CSV format
      exportData = await this.convertToCSV(submissions);
      filename = `form-${formId}-export-${Date.now()}.csv`;
      mimeType = 'text/csv';
    }

    await job.progress(70);

    // Save export file
    const exportDir = path.join(process.cwd(), 'exports');
    await fs.mkdir(exportDir, { recursive: true });

    const filePath = path.join(exportDir, filename);
    await fs.writeFile(filePath, exportData);

    await job.progress(90);

    // Update background job record
    await prisma.backgroundJob.updateMany({
      where: {
        type: 'DATA_EXPORT',
        data: {
          path: ['formId'],
          equals: formId,
        },
        status: 'PROCESSING',
      },
      data: {
        status: 'COMPLETED',
        result: {
          filename,
          filePath,
          fileSize: Buffer.byteLength(exportData),
          recordCount: submissions.length,
          mimeType,
        },
        completedAt: new Date(),
      },
    });

    await job.progress(100);

    console.log(`Data export completed: ${filename}`);
    return {
      formId,
      filename,
      recordCount: submissions.length,
      completedAt: new Date(),
    };
  } catch (error) {
    console.error(`Data export failed for form ${formId}:`, error);

    // Update job status
    await prisma.backgroundJob.updateMany({
      where: {
        type: 'DATA_EXPORT',
        data: {
          path: ['formId'],
          equals: formId,
        },
        status: 'PROCESSING',
      },
      data: {
        status: 'FAILED',
        error: error.message,
      },
    });

    throw error;
  }
});

// Helper function to convert submissions to CSV
async function convertToCSV(submissions) {
  if (submissions.length === 0) {
    return 'No data to export';
  }

  // Get all unique field keys from submissions
  const fieldKeys = new Set();
  submissions.forEach((sub) => {
    Object.keys(sub.data).forEach((key) => fieldKeys.add(key));
  });

  // Create CSV headers
  const headers = [
    'Submission ID',
    'Submitted At',
    'Status',
    'Source',
    'Submitter Name',
    'Submitter Email',
    ...Array.from(fieldKeys),
    'Analysis Summary',
  ];

  // Create CSV rows
  const rows = submissions.map((sub) => {
    const row = [
      sub.id,
      sub.submittedAt.toISOString(),
      sub.status,
      sub.source,
      sub.submitter?.name || 'Anonymous',
      sub.submitter?.email || 'N/A',
    ];

    // Add field values
    fieldKeys.forEach((key) => {
      const value = sub.data[key];
      if (typeof value === 'object') {
        row.push(JSON.stringify(value));
      } else {
        row.push(String(value || ''));
      }
    });

    // Add analysis summary
    const analysisTypes = sub.analyses.map((a) => a.analysisType).join(', ');
    row.push(analysisTypes || 'No analysis');

    return row;
  });

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return csvContent;
}

// Queue event handlers for monitoring
analysisQueue.on('completed', (job, result) => {
  console.log(`Analysis job ${job.id} completed:`, result);
});

analysisQueue.on('failed', (job, err) => {
  console.error(`Analysis job ${job.id} failed:`, err.message);
});

emailQueue.on('completed', (job, result) => {
  console.log(`Email job ${job.id} completed:`, result);
});

emailQueue.on('failed', (job, err) => {
  console.error(`Email job ${job.id} failed:`, err.message);
});

exportQueue.on('completed', (job, result) => {
  console.log(`Export job ${job.id} completed:`, result);
});

exportQueue.on('failed', (job, err) => {
  console.error(`Export job ${job.id} failed:`, err.message);
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down job processors...');
  await analysisQueue.close();
  await emailQueue.close();
  await exportQueue.close();
  process.exit(0);
});

console.log('Job processors initialized and ready');

module.exports = {
  analysisQueue,
  emailQueue,
  exportQueue,
};
