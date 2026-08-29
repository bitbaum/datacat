const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380';

let redisClient;

function getRedis() {
  if (!redisClient) {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });
    redisClient.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('Redis error:', err);
    });
  }
  return redisClient;
}

module.exports = getRedis();
