import pino from 'pino';

// Map pino levels to Cloud Logging severities so warn/error are filterable in
// GCP (pino's numeric levels otherwise land as DEFAULT severity).
const GCP_SEVERITY = {
  trace: 'DEBUG',
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR',
  fatal: 'CRITICAL',
};

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  messageKey: 'message', // Cloud Logging reads `message` as the display text
  formatters: {
    level(label) {
      return { severity: GCP_SEVERITY[label] || 'DEFAULT', level: label };
    },
  },
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true, messageKey: 'message' } }
    : undefined,
});

export default logger;
