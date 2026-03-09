const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getAnalyticsService } = require('../services/analytics-mqtt.service');

router.use(authenticate);
router.use(authorize('dashboard', 'analytics'));

router.get('/dashboard', (req, res) => {
  res.json({ success: true, message: 'GET /analytics/dashboard - данные для главной панели' });
});

/**
 * GET /analytics/mqtt/status
 * Получить статус MQTT подключения
 */
router.get('/mqtt/status', (req, res) => {
  try {
    const analyticsService = getAnalyticsService();
    const status = analyticsService.getStatus();
    
    res.json({
      success: true,
      data: {
        isConnected: status.isConnected,
        hasConfig: !!status.config,
        topics: status.topics
      }
    });
  } catch (error) {
    console.error('Error getting MQTT status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'MQTT_STATUS_ERROR',
        message: 'Ошибка получения статуса MQTT'
      }
    });
  }
});

/**
 * POST /analytics/mqtt/update
 * Запросить обновление данных
 */
router.post('/mqtt/update', async (req, res) => {
  try {
    const analyticsService = getAnalyticsService();
    
    if (!analyticsService.isConnected) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'MQTT_NOT_CONNECTED',
          message: 'MQTT не подключен'
        }
      });
    }
    
    await analyticsService.updateData();
    
    res.json({
      success: true,
      message: 'Обновление данных запущено'
    });
  } catch (error) {
    console.error('Error updating analytics data:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Ошибка обновления данных'
      }
    });
  }
});

/**
 * GET /analytics/mqtt/config
 * Получить текущую конфигурацию
 */
router.get('/mqtt/config', (req, res) => {
  try {
    const analyticsService = getAnalyticsService();
    const status = analyticsService.getStatus();
    
    if (!status.config) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONFIG_NOT_FOUND',
          message: 'Конфигурация не найдена'
        }
      });
    }
    
    res.json({
      success: true,
      data: status.config
    });
  } catch (error) {
    console.error('Error getting MQTT config:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONFIG_ERROR',
        message: 'Ошибка получения конфигурации'
      }
    });
  }
});

module.exports = router;