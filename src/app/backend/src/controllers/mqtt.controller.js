const mqttService = require('../services/mqtt.service');

/**
 * Получить конфигурацию карточек с их значениями
 */
exports.getCards = async (req, res) => {
  try {
    const cards = mqttService.getCardsWithValues();
    const status = mqttService.getStatus();

    res.json({
      success: true,
      data: {
        cards,
        status,
      },
    });
  } catch (error) {
    console.error('[MQTT Controller] Ошибка при получении карточек:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении данных карточек',
      error: error.message,
    });
  }
};

/**
 * Получить только значения карточек
 */
exports.getCardValues = async (req, res) => {
  try {
    const values = mqttService.getCardValues();

    res.json({
      success: true,
      data: values,
    });
  } catch (error) {
    console.error('[MQTT Controller] Ошибка при получении значений:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении значений карточек',
      error: error.message,
    });
  }
};

/**
 * Получить статус MQTT подключения
 */
exports.getStatus = async (req, res) => {
  try {
    const status = mqttService.getStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('[MQTT Controller] Ошибка при получении статуса:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статуса MQTT',
      error: error.message,
    });
  }
};

/**
 * Опубликовать сообщение в MQTT (только для администраторов)
 */
exports.publish = async (req, res) => {
  try {
    const { topic, message, retain = false } = req.body;

    if (!topic || !message) {
      return res.status(400).json({
        success: false,
        message: 'Требуются параметры: topic и message',
      });
    }

    const success = mqttService.publish(topic, message, { retain });

    if (success) {
      res.json({
        success: true,
        message: 'Сообщение опубликовано',
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'MQTT не подключен',
      });
    }
  } catch (error) {
    console.error('[MQTT Controller] Ошибка при публикации:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при публикации сообщения',
      error: error.message,
    });
  }
};
