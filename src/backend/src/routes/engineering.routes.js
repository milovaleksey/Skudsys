/**
 * Роуты для инженерного раздела
 */

const express = require('express');
const router = express.Router();
const engineeringController = require('../controllers/engineering.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * GET /api/engineering/bad-events
 * Получить аномальные события СКУД
 */
router.get('/bad-events', authenticate, engineeringController.getBadEvents);

/**
 * GET /api/engineering/access-rules
 * Получить правила доступа
 */
router.get('/access-rules', authenticate, engineeringController.getAccessRules);

/**
 * POST /api/engineering/access-rules
 * Создать правило доступа
 */
router.post('/access-rules', authenticate, engineeringController.createAccessRule);

/**
 * PUT /api/engineering/access-rules/:id
 * Обновить правило доступа
 */
router.put('/access-rules/:id', authenticate, engineeringController.updateAccessRule);

/**
 * DELETE /api/engineering/access-rules/:id
 * Удалить правило доступа
 */
router.delete('/access-rules/:id', authenticate, engineeringController.deleteAccessRule);

/**
 * PATCH /api/engineering/access-rules/:id/toggle
 * Переключить активность правила
 */
router.patch('/access-rules/:id/toggle', authenticate, engineeringController.toggleAccessRule);

module.exports = router;
