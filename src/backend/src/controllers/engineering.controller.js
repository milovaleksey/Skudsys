/**
 * Контроллер для инженерного раздела
 * Управление аномальными событиями СКУД и правилами доступа
 */

const mqttService = require('../services/mqtt.service');

// In-memory хранилище для правил доступа (в production - использовать БД)
let accessRules = [
  {
    id: '1',
    department: 'Институт математики и компьютерных наук',
    accessTemplate: 'Полный доступ 24/7',
    userType: 'employee',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    department: 'Студенческий совет',
    accessTemplate: 'Доступ с 8:00 до 22:00',
    userType: 'student',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

// In-memory хранилище для аномальных событий (получаем из MQTT)
let badEvents = [];

/**
 * Получить аномальные события
 * GET /api/engineering/bad-events
 */
exports.getBadEvents = async (req, res) => {
  try {
    const { limit = 1000, offset = 0 } = req.query;
    
    // Возвращаем события с пагинацией
    const events = badEvents.slice(offset, offset + parseInt(limit));
    
    res.json({
      success: true,
      events,
      total: badEvents.length
    });
  } catch (error) {
    console.error('Ошибка получения аномальных событий:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения данных'
    });
  }
};

/**
 * Получить правила доступа
 * GET /api/engineering/access-rules
 */
exports.getAccessRules = async (req, res) => {
  try {
    res.json({
      success: true,
      rules: accessRules
    });
  } catch (error) {
    console.error('Ошибка получения правил доступа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения правил'
    });
  }
};

/**
 * Создать правило доступа
 * POST /api/engineering/access-rules
 */
exports.createAccessRule = async (req, res) => {
  try {
    const { department, accessTemplate, userType } = req.body;

    // Валидация
    if (!department || !accessTemplate || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Заполните все обязательные поля'
      });
    }

    if (!['employee', 'student', 'both'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный тип пользователя'
      });
    }

    // Создаем новое правило
    const newRule = {
      id: Date.now().toString(),
      department,
      accessTemplate,
      userType,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    accessRules.push(newRule);

    res.json({
      success: true,
      rule: newRule,
      message: 'Правило создано'
    });
  } catch (error) {
    console.error('Ошибка создания правила:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка создания правила'
    });
  }
};

/**
 * Обновить правило доступа
 * PUT /api/engineering/access-rules/:id
 */
exports.updateAccessRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { department, accessTemplate, userType } = req.body;

    const ruleIndex = accessRules.findIndex(r => r.id === id);
    
    if (ruleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Правило не найдено'
      });
    }

    // Обновляем правило
    accessRules[ruleIndex] = {
      ...accessRules[ruleIndex],
      department,
      accessTemplate,
      userType
    };

    res.json({
      success: true,
      rule: accessRules[ruleIndex],
      message: 'Правило обновлено'
    });
  } catch (error) {
    console.error('Ошибка обновления правила:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления правила'
    });
  }
};

/**
 * Удалить правило доступа
 * DELETE /api/engineering/access-rules/:id
 */
exports.deleteAccessRule = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ruleIndex = accessRules.findIndex(r => r.id === id);
    
    if (ruleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Правило не найдено'
      });
    }

    accessRules.splice(ruleIndex, 1);

    res.json({
      success: true,
      message: 'Правило удалено'
    });
  } catch (error) {
    console.error('Ошибка удаления правила:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления правила'
    });
  }
};

/**
 * Переключить активность правила
 * PATCH /api/engineering/access-rules/:id/toggle
 */
exports.toggleAccessRule = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ruleIndex = accessRules.findIndex(r => r.id === id);
    
    if (ruleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Правило не найдено'
      });
    }

    accessRules[ruleIndex].isActive = !accessRules[ruleIndex].isActive;

    res.json({
      success: true,
      rule: accessRules[ruleIndex],
      message: accessRules[ruleIndex].isActive ? 'Правило активировано' : 'Правило деактивировано'
    });
  } catch (error) {
    console.error('Ошибка переключения правила:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка переключения правила'
    });
  }
};

/**
 * Добавить аномальное событие из MQTT
 * Используется внутренне MQTT сервисом
 */
exports.addBadEvent = (event) => {
  badEvents.unshift(event);
  
  // Храним последние 10000 событий
  if (badEvents.length > 10000) {
    badEvents = badEvents.slice(0, 10000);
  }
};

/**
 * Добавить массив аномальных событий из MQTT
 */
exports.addBadEvents = (events) => {
  if (Array.isArray(events)) {
    badEvents = [...events, ...badEvents].slice(0, 10000);
  }
};

/**
 * Получить текущее состояние
 */
exports.getState = () => ({
  badEventsCount: badEvents.length,
  accessRulesCount: accessRules.length
});
