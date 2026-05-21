const mqtt = require('mqtt');
const EventEmitter = require('events');

/**
 * MQTT сервис для работы с данными иностранных студентов
 */
class ForeignStudentsMQTTService extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.isConnected = false;
    
    // Кеши данных
    this.statCards = [];
    this.cardValues = {};
    this.countryStats = [];
    this.countries = [];
    
    this.config = {
      broker: process.env.FOREIGN_MQTT_BROKER || process.env.MQTT_BROKER || 'localhost',
      port: parseInt(process.env.FOREIGN_MQTT_PORT || process.env.MQTT_PORT) || 1883,
      username: process.env.FOREIGN_MQTT_USERNAME || process.env.MQTT_USERNAME || undefined,
      password: process.env.FOREIGN_MQTT_PASSWORD || process.env.MQTT_PASSWORD || undefined,
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

    console.log(`[Foreign Students MQTT] Подключение к брокеру: ${url}`);

    const options = {
      clean: true,
      connectTimeout: 4000,
      clientId: `foreign_students_backend_${Math.random().toString(16).substr(2, 8)}`,
      username,
      password,
      reconnectPeriod: 5000,
    };

    try {
      this.client = mqtt.connect(url, options);

      this.client.on('connect', () => {
        console.log('[Foreign Students MQTT] ✅ Успешно подключено к брокеру');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
        
        // Подписываемся на все топики
        this.subscribeToTopics();
      });

      this.client.on('error', (error) => {
        console.error('[Foreign Students MQTT] ❌ Ошибка подключения:', error.message);
        this.isConnected = false;
      });

      this.client.on('reconnect', () => {
        this.reconnectAttempts++;
        console.log(`[Foreign Students MQTT] 🔄 Попытка переподключения ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('[Foreign Students MQTT] ❌ Превышено количество попыток переподключения');
          this.client.end();
        }
      });

      this.client.on('close', () => {
        console.log('[Foreign Students MQTT] 🔌 Соединение закрыто');
        this.isConnected = false;
        this.emit('disconnected');
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });
    } catch (error) {
      console.error('[Foreign Students MQTT] ❌ Ошибка при создании клиента:', error.message);
      this.isConnected = false;
    }
  }

  /**
   * Подписка на топики
   */
  subscribeToTopics() {
    const topics = [
      'Skud/foreign-students/config',
      'Skud/foreign-students/stats',
      'Skud/foreign-students/countries',
      'Skud/foreign-students/data/#'
    ];

    topics.forEach(topic => {
      this.client.subscribe(topic, (err) => {
        if (err) {
          console.error(`[Foreign Students MQTT] ❌ Ошибка подписки на ${topic}:`, err.message);
        } else {
          console.log(`[Foreign Students MQTT] ✅ Подписка на топик: ${topic}`);
        }
      });
    });
  }

  /**
   * Обработка входящих сообщений
   */
  handleMessage(topic, message) {
    const messageStr = message.toString();
    
    try {
      // Конфигурация карточек статистики
      if (topic === 'Skud/foreign-students/config') {
        const data = JSON.parse(messageStr);
        if (Array.isArray(data)) {
          this.statCards = data;
          console.log(`[Foreign Students MQTT] 📊 Получена конфигурация: ${data.length} карточек`);
          this.emit('config-updated', data);
          
          // Подписываемся на топики данных карточек
          data.forEach(card => {
            if (card.valueTopic) {
              this.client.subscribe(card.valueTopic, (err) => {
                if (!err) {
                  console.log(`[Foreign Students MQTT] ✅ Подписка на данные карточки: ${card.valueTopic}`);
                }
              });
            }
          });
        }
      }
      
      // Статистика по странам
      else if (topic === 'Skud/foreign-students/stats') {
        const data = JSON.parse(messageStr);
        if (Array.isArray(data)) {
          this.countryStats = data;
          console.log(`[Foreign Students MQTT] 📈 Получена статистика: ${data.length} стран`);
          this.emit('stats-updated', data);
        }
      }
      
      // Справочник стран
      else if (topic === 'Skud/foreign-students/countries') {
        const data = JSON.parse(messageStr);
        if (Array.isArray(data)) {
          this.countries = data;
          console.log(`[Foreign Students MQTT] 🌍 Получен справочник: ${data.length} стран`);
          this.emit('countries-updated', data);
        }
      }
      
      // Данные карточек
      else if (topic.startsWith('Skud/foreign-students/data/')) {
        const cardId = topic.replace('Skud/foreign-students/data/', '');
        this.cardValues[cardId] = messageStr;
        console.log(`[Foreign Students MQTT] 📨 Обновление значения карточки [${cardId}]: ${messageStr}`);
        this.emit('card-value-updated', { cardId, value: messageStr });
      }
    } catch (error) {
      console.error('[Foreign Students MQTT] ❌ Ошибка парсинга сообщения:', error.message);
      console.error('[Foreign Students MQTT] Topic:', topic);
      console.error('[Foreign Students MQTT] Message:', messageStr);
    }
  }

  /**
   * Получить все данные
   */
  getAllData() {
    return {
      statCards: this.statCards,
      cardValues: this.cardValues,
      countryStats: this.countryStats,
      countries: this.countries,
    };
  }

  /**
   * Получить статус подключения
   */
  getStatus() {
    return {
      connected: this.isConnected,
      broker: `${this.config.broker}:${this.config.port}`,
      cardsCount: this.statCards.length,
      countriesCount: this.countries.length,
    };
  }

  /**
   * Публикация сообщения
   */
  publish(topic, message, options = {}) {
    if (!this.isConnected) {
      console.error('[Foreign Students MQTT] ❌ Невозможно опубликовать: не подключено к брокеру');
      return false;
    }

    this.client.publish(topic, message, options, (err) => {
      if (err) {
        console.error(`[Foreign Students MQTT] ❌ Ошибка публикации в ${topic}:`, err.message);
      } else {
        console.log(`[Foreign Students MQTT] ✅ Опубликовано в ${topic}`);
      }
    });

    return true;
  }

  /**
   * Отключение от брокера
   */
  disconnect() {
    if (this.client) {
      console.log('[Foreign Students MQTT] 🔌 Отключение от брокера...');
      this.client.end();
      this.client = null;
      this.isConnected = false;
    }
  }
}

// Создаем синглтон
const foreignStudentsMQTTService = new ForeignStudentsMQTTService();

module.exports = foreignStudentsMQTTService;
