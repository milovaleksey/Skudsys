const express = require('express');
const router = express.Router();
const mqttController = require('../controllers/mqtt.controller');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * GET /api/mqtt/cards
 * Получить конфигурацию карточек с их значениями
 */
router.get('/cards', authenticate, mqttController.getCards);

/**
 * GET /api/mqtt/values
 * Получить только значения карточек
 */
router.get('/values', authenticate, mqttController.getCardValues);

/**
 * GET /api/mqtt/status
 * Получить статус MQTT подключения
 */
router.get('/status', authenticate, mqttController.getStatus);

/**
 * POST /api/mqtt/publish
 * Опубликовать сообщение в MQTT (только для администраторов)
 */
router.post(
  '/publish',
  authenticate,
  authorize('mqtt-publish'),
  mqttController.publish
);

module.exports = router;