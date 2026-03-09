/**
 * MQTT сервис для аналитики
 * Обрабатывает данные проходов по зданиям и публикует агрегированную статистику
 */

const mqtt = require('mqtt');
const { getSkudPool } = require('../config/skudDatabase');

class AnalyticsMQTTService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.config = null;
    this.reconnectTimer = null;
    this.updateInterval = null;
    
    // Топики из ENV или дефолтные
    this.topics = {
      config: process.env.ANALYTICS_MQTT_CONFIG_TOPIC || 'Skud/analytics/config',
      data: process.env.ANALYTICS_MQTT_DATA_TOPIC || 'Skud/analytics/data',
      status: process.env.ANALYTICS_MQTT_STATUS_TOPIC || 'Skud/analytics/status'
    };
    
    // Интервал обновления (по умолчанию 5 минут)
    this.updateIntervalMs = parseInt(process.env.ANALYTICS_MQTT_UPDATE_INTERVAL) || 300000;
  }

  /**
   * Инициализация MQTT клиента
   */
  async initialize() {
    const brokerUrl = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
    const username = process.env.MQTT_USERNAME || '';
    const password = process.env.MQTT_PASSWORD || '';

    console.log(`[Analytics MQTT] Connecting to broker: ${brokerUrl}`);

    try {
      this.client = mqtt.connect(brokerUrl, {
        username,
        password,
        clientId: `analytics_service_${Date.now()}`,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 30000
      });

      this.client.on('connect', () => {
        console.log('[Analytics MQTT] ✅ Connected to broker');
        this.isConnected = true;
        this.publishStatus('connected');
        
        // Подписываемся на топик конфигурации
        this.client.subscribe(this.topics.config, (err) => {
          if (err) {
            console.error('[Analytics MQTT] ❌ Subscription error:', err);
          } else {
            console.log(`[Analytics MQTT] 📡 Subscribed to ${this.topics.config}`);
          }
        });
        
        // Публикуем дефолтную конфигурацию
        this.publishDefaultConfig();
        
        // Запускаем периодическое обновление данных (каждые 5 минут)
        this.startDataUpdates();
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });

      this.client.on('error', (error) => {
        console.error('[Analytics MQTT] ❌ Connection error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('[Analytics MQTT] 🔌 Connection closed');
        this.isConnected = false;
      });

      this.client.on('offline', () => {
        console.log('[Analytics MQTT] 📴 Client offline');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('[Analytics MQTT] ❌ Initialization error:', error);
      throw error;
    }
  }

  /**
   * Обработка входящих сообщений
   */
  handleMessage(topic, message) {
    try {
      const payload = JSON.parse(message.toString());
      console.log(`[Analytics MQTT] 📩 Received message on ${topic}`);

      if (topic === this.topics.config) {
        this.config = payload;
        console.log('[Analytics MQTT] 🔧 Config updated');
        // При обновлении конфига сразу обновляем данные
        this.updateData();
      }
    } catch (error) {
      console.error('[Analytics MQTT] ❌ Message handling error:', error);
    }
  }

  /**
   * Публикация дефолтной конфигурации
   */
  publishDefaultConfig() {
    const defaultConfig = {
      version: '1.0',
      widgets: [
        {
          id: 'total-passes-chart',
          type: 'area',
          title: 'Общая динамика проходов',
          description: 'Временной ряд всех проходов по дням',
          dataSource: 'time-series-total',
          color: '#00aeef',
          showTrend: true,
          showAverage: true
        },
        {
          id: 'top-buildings-bar',
          type: 'bar',
          title: 'Топ-10 зданий',
          description: 'Рейтинг самых посещаемых локаций',
          dataSource: 'top-buildings',
          limit: 10,
          color: '#00aeef',
          showPercentage: true
        },
        {
          id: 'building-comparison',
          type: 'line',
          title: 'Сравнение корпусов',
          description: 'Динамика топ-5 корпусов',
          dataSource: 'buildings-comparison',
          buildings: ['Корпус №4', 'Корпус №5', 'Корпус №16', 'Корпус №11', 'Корпус №10'],
          colors: ['#00aeef', '#0098d1', '#0082b3', '#006c95', '#005677']
        },
        {
          id: 'category-pie',
          type: 'pie',
          title: 'Распределение по типам',
          description: 'Корпуса vs Общежития',
          dataSource: 'category-distribution',
          colors: ['#00aeef', '#ff6b6b', '#4ecdc4']
        },
        {
          id: 'weekday-pattern',
          type: 'bar',
          title: 'Активность по дням недели',
          description: 'Паттерн посещений',
          dataSource: 'weekday-pattern',
          color: '#00aeef'
        }
      ],
      filters: [
        {
          id: 'date-range',
          type: 'dateRange',
          label: 'Период',
          default: 'last-7-days',
          options: ['last-7-days', 'last-30-days', 'last-90-days', 'custom']
        },
        {
          id: 'building-type',
          type: 'select',
          label: 'Тип здания',
          options: ['Все', 'Корпуса', 'Общежития'],
          default: 'Все'
        },
        {
          id: 'top-n',
          type: 'select',
          label: 'Показать топ',
          options: [5, 10, 20, 50],
          default: 10
        }
      ]
    };

    this.config = defaultConfig;
    this.publish(this.topics.config, defaultConfig);
    console.log('[Analytics MQTT] 📤 Published default config');
  }

  /**
   * Запуск периодического обновления данных
   */
  startDataUpdates() {
    // Сразу обновляем данные
    this.updateData();
    
    // Затем обновляем каждые 5 минут
    this.updateInterval = setInterval(() => {
      this.updateData();
    }, this.updateIntervalMs); // 5 минут
    
    console.log('[Analytics MQTT] ⏰ Data updates scheduled every 5 minutes');
  }

  /**
   * Остановка периодического обновления
   */
  stopDataUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('[Analytics MQTT] ⏰ Data updates stopped');
    }
  }

  /**
   * Обновление и публикация данных
   */
  async updateData() {
    if (!this.isConnected) {
      console.log('[Analytics MQTT] ⚠️ Not connected, skipping data update');
      return;
    }

    try {
      console.log('[Analytics MQTT] 🔄 Updating analytics data...');
      
      // Определяем период (последние 30 дней по умолчанию)
      const dateTo = new Date();
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - 30);

      // Получаем данные из БД
      const [timeSeriesData, topBuildings, categoryDistribution, weekdayPattern] = await Promise.all([
        this.getTimeSeriesData(dateFrom, dateTo),
        this.getTopBuildings(dateFrom, dateTo, 20),
        this.getCategoryDistribution(dateFrom, dateTo),
        this.getWeekdayPattern(dateFrom, dateTo)
      ]);

      // Формируем датасет
      const datasets = {
        'time-series-total': timeSeriesData,
        'top-buildings': topBuildings,
        'buildings-comparison': await this.getBuildingsComparison(dateFrom, dateTo, topBuildings.slice(0, 5).map(b => b.name)),
        'category-distribution': categoryDistribution,
        'weekday-pattern': weekdayPattern
      };

      // Считаем метаданные
      const totalPasses = topBuildings.reduce((sum, b) => sum + b.count, 0);
      const uniqueBuildings = topBuildings.length;

      const payload = {
        timestamp: new Date().toISOString(),
        datasets,
        metadata: {
          totalPasses,
          uniqueBuildings,
          dateRange: {
            from: dateFrom.toISOString().split('T')[0],
            to: dateTo.toISOString().split('T')[0]
          }
        }
      };

      this.publish(this.topics.data, payload);
      console.log('[Analytics MQTT] ✅ Data published successfully');
      console.log(`[Analytics MQTT] 📊 Total passes: ${totalPasses}, Buildings: ${uniqueBuildings}`);

    } catch (error) {
      console.error('[Analytics MQTT] ❌ Data update error:', error);
    }
  }

  /**
   * Получение временных рядов (проходы по дням)
   */
  async getTimeSeriesData(dateFrom, dateTo) {
    try {
      const pool = getSkudPool();
      const query = `
        SELECT 
          DATE(Time) as date,
          COUNT(*) as count
        FROM AcessEvent
        WHERE Time BETWEEN ? AND ?
        GROUP BY DATE(Time)
        ORDER BY date ASC
      `;
      
      const [rows] = await pool.query(query, [dateFrom, dateTo]);
      
      return rows.map(row => ({
        date: row.date.toISOString().split('T')[0],
        count: row.count
      }));
    } catch (error) {
      console.error('[Analytics MQTT] ❌ getTimeSeriesData error:', error);
      return [];
    }
  }

  /**
   * Получение топ зданий
   */
  async getTopBuildings(dateFrom, dateTo, limit = 10) {
    try {
      const pool = getSkudPool();
      const query = `
        SELECT 
          COALESCE(rz.Name, 'Не указано') as name,
          COUNT(*) as count
        FROM AcessEvent ae
        LEFT JOIN AcessPoint ap ON ae.AcessPointId = ap.ID
        LEFT JOIN RootZone rz ON ap.RootZoneId = rz.ID
        WHERE ae.Time BETWEEN ? AND ?
        GROUP BY rz.ID, rz.Name
        ORDER BY count DESC
        LIMIT ?
      `;
      
      const [rows] = await pool.query(query, [dateFrom, dateTo, limit]);
      
      const total = rows.reduce((sum, row) => sum + row.count, 0);
      
      return rows.map(row => ({
        name: row.name,
        count: row.count,
        percentage: total > 0 ? parseFloat(((row.count / total) * 100).toFixed(1)) : 0
      }));
    } catch (error) {
      console.error('[Analytics MQTT] ❌ getTopBuildings error:', error);
      return [];
    }
  }

  /**
   * Получение распределения по категориям
   */
  async getCategoryDistribution(dateFrom, dateTo) {
    try {
      const pool = getSkudPool();
      const query = `
        SELECT 
          COALESCE(rz.Name, 'Не указано') as name,
          COUNT(*) as count
        FROM AcessEvent ae
        LEFT JOIN AcessPoint ap ON ae.AcessPointId = ap.ID
        LEFT JOIN RootZone rz ON ap.RootZoneId = rz.ID
        WHERE ae.Time BETWEEN ? AND ?
        GROUP BY rz.ID, rz.Name
      `;
      
      const [rows] = await pool.query(query, [dateFrom, dateTo]);
      
      // Группируем по типам
      const categories = {
        'Корпуса': 0,
        'Общежития': 0,
        'Прочее': 0
      };
      
      rows.forEach(row => {
        if (row.name.includes('Корпус')) {
          categories['Корпуса'] += row.count;
        } else if (row.name.includes('Общежитие')) {
          categories['Общежития'] += row.count;
        } else {
          categories['Прочее'] += row.count;
        }
      });
      
      const total = Object.values(categories).reduce((sum, val) => sum + val, 0);
      
      return Object.entries(categories)
        .filter(([, count]) => count > 0)
        .map(([category, count]) => ({
          category,
          count,
          percentage: total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0
        }));
    } catch (error) {
      console.error('[Analytics MQTT] ❌ getCategoryDistribution error:', error);
      return [];
    }
  }

  /**
   * Получение паттерна по дням недели
   */
  async getWeekdayPattern(dateFrom, dateTo) {
    try {
      const pool = getSkudPool();
      const query = `
        SELECT 
          DAYOFWEEK(Time) as dow,
          COUNT(*) as count
        FROM AcessEvent
        WHERE Time BETWEEN ? AND ?
        GROUP BY DAYOFWEEK(Time)
        ORDER BY dow
      `;
      
      const [rows] = await pool.query(query, [dateFrom, dateTo]);
      
      const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      
      return rows.map(row => ({
        day: dayNames[row.dow - 1],
        count: row.count
      }));
    } catch (error) {
      console.error('[Analytics MQTT] ❌ getWeekdayPattern error:', error);
      return [];
    }
  }

  /**
   * Получение сравнения зданий
   */
  async getBuildingsComparison(dateFrom, dateTo, buildings) {
    try {
      const pool = getSkudPool();
      
      // Получаем данные для каждого здания по дням
      const promises = buildings.map(async (building) => {
        const query = `
          SELECT 
            DATE(ae.Time) as date,
            COUNT(*) as count
          FROM AcessEvent ae
          LEFT JOIN AcessPoint ap ON ae.AcessPointId = ap.ID
          LEFT JOIN RootZone rz ON ap.RootZoneId = rz.ID
          WHERE ae.Time BETWEEN ? AND ?
            AND rz.Name = ?
          GROUP BY DATE(ae.Time)
          ORDER BY date ASC
        `;
        
        const [rows] = await pool.query(query, [dateFrom, dateTo, building]);
        return { building, data: rows };
      });
      
      const results = await Promise.all(promises);
      
      // Объединяем данные в один массив
      const dates = new Set();
      results.forEach(({ data }) => {
        data.forEach(row => {
          dates.add(row.date.toISOString().split('T')[0]);
        });
      });
      
      const comparison = Array.from(dates).sort().map(date => {
        const item = { date };
        results.forEach(({ building, data }) => {
          const row = data.find(r => r.date.toISOString().split('T')[0] === date);
          item[building] = row ? row.count : 0;
        });
        return item;
      });
      
      return comparison;
    } catch (error) {
      console.error('[Analytics MQTT] ❌ getBuildingsComparison error:', error);
      return [];
    }
  }

  /**
   * Публикация статуса
   */
  publishStatus(status) {
    const payload = {
      status,
      timestamp: new Date().toISOString()
    };
    this.publish(this.topics.status, payload);
  }

  /**
   * Общий метод публикации
   */
  publish(topic, payload) {
    if (!this.client || !this.isConnected) {
      console.log('[Analytics MQTT] ⚠️ Cannot publish: not connected');
      return;
    }

    try {
      const message = JSON.stringify(payload);
      this.client.publish(topic, message, { qos: 1, retain: true }, (error) => {
        if (error) {
          console.error(`[Analytics MQTT] ❌ Publish error on ${topic}:`, error);
        } else {
          console.log(`[Analytics MQTT] 📤 Published to ${topic}`);
        }
      });
    } catch (error) {
      console.error('[Analytics MQTT] ❌ Publish error:', error);
    }
  }

  /**
   * Отключение
   */
  async disconnect() {
    console.log('[Analytics MQTT] 🔌 Disconnecting...');
    
    this.stopDataUpdates();
    
    if (this.client) {
      this.client.end(false, () => {
        console.log('[Analytics MQTT] ✅ Disconnected');
      });
    }
    
    this.isConnected = false;
  }

  /**
   * Получение статуса
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      config: this.config,
      topics: this.topics
    };
  }
}

// Singleton instance
let analyticsServiceInstance = null;

const getAnalyticsService = () => {
  if (!analyticsServiceInstance) {
    analyticsServiceInstance = new AnalyticsMQTTService();
  }
  return analyticsServiceInstance;
};

module.exports = {
  getAnalyticsService,
  AnalyticsMQTTService
};