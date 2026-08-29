const Bull = require('bull');
const Redis = require('ioredis');

// Configure Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
});

// Create job queues
const analysisQueue = new Bull('llm-analysis', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

const emailQueue = new Bull('email-notifications', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 25,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

const exportQueue = new Bull('data-export', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    removeOnComplete: 20,
    removeOnFail: 10,
    attempts: 2,
    timeout: 300000, // 5 minutes timeout for exports
  },
});

// Queue management functions
class QueueManager {
  static async addAnalysisJob(submissionId, options = {}) {
    const { analysisTypes = ['SENTIMENT', 'CLASSIFICATION'], priority = 1, delay = 0 } = options;

    return analysisQueue.add(
      'analyze-submission',
      {
        submissionId,
        analysisTypes,
        timestamp: new Date(),
      },
      {
        priority,
        delay,
        attempts: 3,
      },
    );
  }

  static async addEmailJob(emailData, options = {}) {
    const { priority = 2, delay = 0 } = options;

    return emailQueue.add('send-notification', emailData, {
      priority,
      delay,
      attempts: 5,
    });
  }

  static async addExportJob(exportData, options = {}) {
    const { priority = 3, delay = 0 } = options;

    return exportQueue.add('export-data', exportData, {
      priority,
      delay,
      timeout: 300000, // 5 minutes
    });
  }

  // Get queue statistics
  static async getQueueStats() {
    const [analysisStats, emailStats, exportStats] = await Promise.all([
      this.getIndividualQueueStats(analysisQueue, 'analysis'),
      this.getIndividualQueueStats(emailQueue, 'email'),
      this.getIndividualQueueStats(exportQueue, 'export'),
    ]);

    return {
      analysis: analysisStats,
      email: emailStats,
      export: exportStats,
      timestamp: new Date(),
    };
  }

  static async getIndividualQueueStats(queue, name) {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      name,
      counts: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
      },
      health: {
        isHealthy: failed.length < 10 && active.length < 50,
        failureRate: completed.length > 0 ? failed.length / (completed.length + failed.length) : 0,
      },
    };
  }

  // Queue cleanup
  static async cleanupQueues() {
    const olderThan = 24 * 60 * 60 * 1000; // 24 hours

    await Promise.all([
      analysisQueue.clean(olderThan, 'completed'),
      analysisQueue.clean(olderThan, 'failed'),
      emailQueue.clean(olderThan, 'completed'),
      emailQueue.clean(olderThan, 'failed'),
      exportQueue.clean(olderThan, 'completed'),
      exportQueue.clean(olderThan, 'failed'),
    ]);

    console.log('Queue cleanup completed');
  }

  // Pause/Resume queues
  static async pauseQueue(queueName) {
    const queue = this.getQueueByName(queueName);
    if (queue) {
      await queue.pause();
      console.log(`Queue ${queueName} paused`);
    }
  }

  static async resumeQueue(queueName) {
    const queue = this.getQueueByName(queueName);
    if (queue) {
      await queue.resume();
      console.log(`Queue ${queueName} resumed`);
    }
  }

  static getQueueByName(name) {
    switch (name) {
      case 'analysis':
        return analysisQueue;
      case 'email':
        return emailQueue;
      case 'export':
        return exportQueue;
      default:
        return null;
    }
  }

  // Graceful shutdown
  static async shutdown() {
    console.log('Shutting down queues gracefully...');

    await Promise.all([analysisQueue.close(), emailQueue.close(), exportQueue.close()]);

    await redis.disconnect();
    console.log('All queues shut down successfully');
  }
}

// Export queues and manager
module.exports = {
  analysisQueue,
  emailQueue,
  exportQueue,
  QueueManager,
  redis,
};
