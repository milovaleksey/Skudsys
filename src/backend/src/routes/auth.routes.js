const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiter');

// POST /auth/login - локальная авторизация
router.post('/login', authRateLimiter, authController.login);

// POST /auth/sso - SSO авторизация
router.post('/sso', authRateLimiter, authController.ssoLogin);

// POST /auth/logout - выход (требует авторизации)
router.post('/logout', authenticate, authController.logout);

// GET /auth/me - информация о текущем пользователе (требует авторизации)
router.get('/me', authenticate, authController.me);

module.exports = router;
