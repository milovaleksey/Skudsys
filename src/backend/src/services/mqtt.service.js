const mqtt = require('mqtt');
const EventEmitter = require('events');
const analyticsProcessor = require('./analytics.processor');

/**
 * MQTT сервис для работы с брокером
 * Подключается к MQTT, подписывается на топики и хранит данные в памяти
 */
class MQTTService extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.isConnected = false;
    this.cards = []; // Конфигурация карточек
    this.cardValues = {}; // Значения карточек
    
    // Данные аналитики из MQTT
    this.analyticsConfig = null; // Конфигурация аналитики
    this.analyticsRawData = null; // Сырые данные из MQTT
    this.analyticsProcessed = {}; // Обработанные данные по каждому типу аналитики
    
    this.config = {
      broker: process.env.MQTT_BROKER || 'localhost',
      port: parseInt(process.env.MQTT_PORT) || 1883,
      username: process.env.MQTT_USERNAME || undefined,
      password: process.env.MQTT_PASSWORD || undefined,
      configTopic: process.env.MQTT_CONFIG_TOPIC || 'Skud/main/stat',
      // Топики аналитики
      analyticsConfigTopic: 'Skud/analytics/config',
      analyticsDataTopic: 'Skud/analytics/events/aggregated'
    };
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  /**
   * Подключение к MQTT брокеру
   */
  connect() {
    const { broker, port, username, password } = this.config;
    const url = `mqtt://${broker}:${port}`;

    console.log(`[MQTT] Подключение к брокеру: ${url}`);

    const options = {
      clean: true,
      connectTimeout: 4000,
      clientId: `skud_backend_${Math.random().toString(16).substr(2, 8)}`,
      username,
      password,
      reconnectPeriod: 5000,
    };

    try {
      this.client = mqtt.connect(url, options);

      this.client.on('connect', () => {
        console.log('[MQTT] ✅ Успешно подключено к брокеру');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
        
        // Подписываемся на топик конфигурации
        this.subscribeToConfigTopic();
        
        // Подписываемся на топики аналитики
        this.subscribeToAnalyticsTopics();
      });

      this.client.on('error', (error) => {
        console.error('[MQTT] ❌ Ошибка подключения:', error.message);
        this.isConnected = false;
        // Не пробрасываем ошибку дальше, чтобы не упал весь сервер
      });

      this.client.on('reconnect', () => {
        this.reconnectAttempts++;
        console.log(`[MQTT] 🔄 Попытка переподключения ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('[MQTT] ❌ Превышено количество попыток переподключения');
          this.client.end();
        }
      });

      this.client.on('close', () => {
        console.log('[MQTT] 🔌 Соединение закрыто');
        this.isConnected = false;
        this.emit('disconnected');
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });
    } catch (error) {
      console.error('[MQTT] ❌ Ошибка при создании клиента:', error.message);
      this.isConnected = false;
    }
  }

  /**
   * Подписка на топик конфигурации карточек
   */
  subscribeToConfigTopic() {
    const { configTopic } = this.config;
    
    this.client.subscribe(configTopic, (err) => {
      if (err) {
        console.error(`[MQTT] ❌ Ошибка подписки на ${configTopic}:`, err.message);
      } else {
        console.log(`[MQTT] ✅ Подписка на топик конфигурации: ${configTopic}`);
      }
    });
  }

  /**
   * Подписка на топики значений карточек
   */
  subscribeToValueTopics(topics) {
    if (!topics || topics.length === 0) return;

    topics.forEach(topic => {
      this.client.subscribe(topic, (err) => {
        if (err) {
          console.error(`[MQTT] ❌ Ошибка подписки на ${topic}:`, err.message);
        } else {
          console.log(`[MQTT] ✅ Подписка на топик данных: ${topic}`);
        }
      });
    });
  }

  /**
   * Отписка от старых топиков значений
   */
  unsubscribeFromOldTopics(oldTopics) {
    if (!oldTopics || oldTopics.length === 0) return;

    oldTopics.forEach(topic => {
      // Не отписываемся от топика конфигурации
      if (topic === this.config.configTopic) return;
      
      this.client.unsubscribe(topic, (err) => {
        if (err) {
          console.error(`[MQTT] ❌ Ошибка отписки от ${topic}:`, err.message);
        } else {
          console.log(`[MQTT] ✅ Отписка от топика: ${topic}`);
        }
      });
    });
  }

  /**
   * Подписка на топики аналитики
   */
  subscribeToAnalyticsTopics() {
    const { analyticsConfigTopic, analyticsDataTopic } = this.config;
    
    this.client.subscribe(analyticsConfigTopic, (err) => {
      if (err) {
        console.error(`[MQTT] ❌ Ошибка подписки на ${analyticsConfigTopic}:`, err.message);
      } else {
        console.log(`[MQTT] ✅ Подписка на топик конфигурации аналитики: ${analyticsConfigTopic}`);
      }
    });
    
    this.client.subscribe(analyticsDataTopic, (err) => {
      if (err) {
        console.error(`[MQTT] ❌ Ошибка подписки на ${analyticsDataTopic}:`, err.message);
      } else {
        console.log(`[MQTT] ✅ Подписка на топик данных аналитики: ${analyticsDataTopic}`);
      }
    });
  }

  /**
   * Обработка входящих сообщений
   */
  handleMessage(topic, message) {
    const messageStr = message.toString();
    
    // Если это топик конфигурации
    if (topic === this.config.configTopic) {
      try {
        const newCards = JSON.parse(messageStr);
        
        if (!Array.isArray(newCards)) {
          console.error('[MQTT] ❌ Конфигурация карточек должна быть массивом');
          return;
        }

        console.log(`[MQTT] 📊 Получена конфигурация: ${newCards.length} карточек`);
        
        // Сохраняем старые топики для отписки
        const oldTopics = this.cards.map(card => card.valueTopic);
        
        // Обновляем конфигураию
        this.cards = newCards;
        
        // Получаем новые топики
        const newTopics = newCards.map(card => card.valueTopic);
        
        // Отписываемся от старых топиков, которых нет в новой конфигурации
        const topicsToUnsubscribe = oldTopics.filter(t => !newTopics.includes(t));
        this.unsubscribeFromOldTopics(topicsToUnsubscribe);
        
        // Подписываемся на новые топики
        const topicsToSubscribe = newTopics.filter(t => !oldTopics.includes(t));
        this.subscribeToValueTopics(topicsToSubscribe);
        
        // Очищаем значения для карточек, которых больше нет
        const currentCardIds = newCards.map(card => card.id);
        Object.keys(this.cardValues).forEach(id => {
          if (!currentCardIds.includes(id)) {
            delete this.cardValues[id];
          }
        });

        this.emit('config-updated', this.cards);
      } catch (error) {
        console.error('[MQTT] ❌ Ошибка парсинга конфигурации:', error.message);
      }
      return;
    }

    // Если это топик значения карточки
    const card = this.cards.find(c => c.valueTopic === topic);
    if (card) {
      this.cardValues[card.id] = messageStr;
      console.log(`[MQTT] 📨 Обновление значения [${card.id}]: ${messageStr}`);
      this.emit('value-updated', { cardId: card.id, value: messageStr });
    }

    // Если это топик аналитики
    const { analyticsConfigTopic, analyticsDataTopic } = this.config;
    if (topic === analyticsConfigTopic) {
      try {
        this.analyticsConfig = JSON.parse(messageStr);
        console.log('[MQTT] 📊 Получена конфигурация аналитики');
        
        // Устанавливаем конфигурацию в процессор
        analyticsProcessor.setConfig(this.analyticsConfig);
        
        // Если есть данные, обрабатываем заново
        if (this.analyticsRawData) {
          this.processAnalyticsData();
        }
      } catch (error) {
        console.error('[MQTT] ❌ Ошибка парсинга конфигурации аналитики:', error.message);
      }
    } else if (topic === analyticsDataTopic) {
      try {
        this.analyticsRawData = JSON.parse(messageStr);
        console.log(`[MQTT] 📊 Получено ${this.analyticsRawData.length} записей данных аналитики`);
        
        // Устанавливаем данные в процессор
        analyticsProcessor.setRawData(this.analyticsRawData);
        
        // Если есть конфигурация, обрабатываем
        if (this.analyticsConfig) {
          this.processAnalyticsData();
        }
      } catch (error) {
        console.error('[MQTT] ❌ Ошибка парсинга сырых данных аналитики:', error.message);
      }
    }
  }

  /**
   * Обработка данных аналитики согласно конфигурации
   */
  processAnalyticsData() {
    console.log('[MQTT] 📊 Обработка данных аналитики...');
    this.analyticsProcessed = analyticsProcessor.processAll();
    console.log(`[MQTT] ✅ Обработано ${Object.keys(this.analyticsProcessed).length} типов аналитики`);
    this.emit('analytics-updated', this.analyticsProcessed);
  }

  /**
   * Получить конфигурацию карточек
   */
  getCards() {
    return this.cards;
  }

  /**
   * Получить значения карточек
   */
  getCardValues() {
    return this.cardValues;
  }

  /**
   * Получить полные данные карточек (конфигурация + значения)
   */
  getCardsWithValues() {
    return this.cards.map(card => ({
      ...card,
      value: this.cardValues[card.id] || null,
    }));
  }

  /**
   * Получить статус подключения
   */
  getStatus() {
    return {
      connected: this.isConnected,
      broker: `${this.config.broker}:${this.config.port}`,
      cardsCount: this.cards.length,
      valuesCount: Object.keys(this.cardValues).length,
    };
  }

  /**
   * Получить данные аналитики
   */
  getAnalyticsData() {
    return this.analyticsProcessed;
  }

  /**
   * Публикация сообщения (для тестирования)
   */
  publish(topic, message, options = {}) {
    if (!this.isConnected) {
      console.error('[MQTT] ❌ Невозможно опубликовать: не подключено к брокеру');
      return false;
    }

    this.client.publish(topic, message, options, (err) => {
      if (err) {
        console.error(`[MQTT] ❌ Ошибка публикации в ${topic}:`, err.message);
      } else {
        console.log(`[MQTT] ✅ Опубликовано в ${topic}: ${message}`);
      }
    });

    return true;
  }

  /**
   * Отключение от брокера
   */
  disconnect() {
    if (this.client) {
      console.log('[MQTT] 🔌 Отключение от брокера...');
      this.client.end();
      this.client = null;
      this.isConnected = false;
    }
  }
}

// Создаем синглтон
const mqttService = new MQTTService();

module.exports = mqttService;