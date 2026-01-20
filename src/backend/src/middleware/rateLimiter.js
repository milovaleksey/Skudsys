const rateLimit = require('express-rate-limit');

// Общий rate limiter
const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 минут
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 запросов
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Слишком много запросов, попробуйте позже'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter для авторизации
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX_ATTEMPTS) || 5, // 5 попыток
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_AUTH_ATTEMPTS',
      message: 'Слишком много попыток авторизации'
    }
  },
  skipSuccessfulRequests: true,
});

module.exports = {
  rateLimiter,
  authRateLimiter
};
