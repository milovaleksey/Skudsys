/**
 * Простой logger для приложения
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'info'];

function formatMessage(level, ...args) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}]`;
}

const logger = {
  debug: (...args) => {
    if (currentLevel <= LOG_LEVELS.debug) {
      console.log(formatMessage('debug'), ...args);
    }
  },

  info: (...args) => {
    if (currentLevel <= LOG_LEVELS.info) {
      console.log(formatMessage('info'), ...args);
    }
  },

  warn: (...args) => {
    if (currentLevel <= LOG_LEVELS.warn) {
      console.warn(formatMessage('warn'), ...args);
    }
  },

  error: (...args) => {
    if (currentLevel <= LOG_LEVELS.error) {
      console.error(formatMessage('error'), ...args);
    }
  },
};

module.exports = logger;
