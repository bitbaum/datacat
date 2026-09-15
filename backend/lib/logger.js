const pinoHttp = require('pino-http');

// The one logger for the backend. pino-http builds the pino instance and
// exposes it as `.logger`, so the request middleware (index.js) and every
// service, job and socket handler write through the same level, destination
// and redaction list. pino itself is not a direct dependency: pnpm does not
// hoist pino-http's copy into backend/node_modules, and adding a second one
// would be a second place to configure.
const httpLogger = pinoHttp({
  redact: ['req.headers.authorization', 'req.headers.cookie'],
});

module.exports = { httpLogger, logger: httpLogger.logger };
