const mqtt = require('mqtt');
const EventEmitter = require('events');

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
    this.config = {
      broker: process.env.MQTT_BROKER || 'localhost',
      port: parseInt(process.env.MQTT_PORT) || 1883,
      username: process.env.MQTT_USERNAME || undefined,
      password: process.env.MQTT_PASSWORD || undefined,
      configTopic: process.env.MQTT_CONFIG_TOPIC || 'Skud/main/stat',
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

    this.client = mqtt.connect(url, options);

    this.client.on('connect', () => {
      console.log('[MQTT] ✅ Успешно подключено к брокеру');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
      
      // Подписываемся на топик конфигурации
      this.subscribeToConfigTopic();
    });

    this.client.on('error', (error) => {
      console.error('[MQTT] ❌ Ошибка подключения:', error.message);
      this.isConnected = false;
      this.emit('error', error);
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
        
        // Обновляем конфигурацию
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
