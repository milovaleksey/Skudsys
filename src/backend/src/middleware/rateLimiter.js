const rateLimit = require('express-rate-limit');

// Общий rate limiter (более мягкий для разработки)
const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000, // 1 минута (вместо 15)
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // 1000 запросов (вместо 100)
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Слишком много запросов, попробуйте позже'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Пропускаем некоторые пути
  skip: (req) => {
    // Не применяем rate limiting к health check и WebSocket upgrade
    return req.path === '/health' || 
           req.path === '/api/health' || 
           req.headers.upgrade === 'websocket';
  }
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