const mqtt = require('mqtt');
const logger = require('../utils/logger');

class ParkingMQTTService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.parkingConfigs = [];
    this.parkingVehicles = {};
    this.wsClients = new Set();
    
    // MQTT настройки
    this.mqttHost = process.env.MQTT_HOST || 'localhost';
    this.mqttPort = process.env.MQTT_PORT || 1883;
    this.mqttUsername = process.env.MQTT_USERNAME || '';
    this.mqttPassword = process.env.MQTT_PASSWORD || '';
  }

  /**
   * Подключение к MQTT брокеру
   */
  connect() {
    try {
      const options = {
        host: this.mqttHost,
        port: this.mqttPort,
        clientId: `utmn_parking_${Math.random().toString(16).slice(2, 10)}`,
        clean: true,
        reconnectPeriod: 5000,
      };

      if (this.mqttUsername) {
        options.username = this.mqttUsername;
        options.password = this.mqttPassword;
      }

      this.client = mqtt.connect(options);

      this.client.on('connect', () => {
        logger.info('[Parking MQTT] ✅ Подключено к брокеру');
        this.isConnected = true;

        // Подписываемся на конфигурацию парковок
        this.client.subscribe('Skud/parking/config', (err) => {
          if (err) {
            logger.error('[Parking MQTT] Ошибка подписки на config:', err);
          } else {
            logger.info('[Parking MQTT] ✅ Подписка на Skud/parking/config');
          }
        });
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });

      this.client.on('error', (error) => {
        logger.error('[Parking MQTT] Ошибка:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        logger.warn('[Parking MQTT] Отключено от брокера');
        this.isConnected = false;
      });

    } catch (error) {
      logger.error('[Parking MQTT] Ошибка подключения:', error);
    }
  }

  /**
   * Обработка входящих MQTT сообщений
   */
  handleMessage(topic, message) {
    try {
      const payload = message.toString();
      
      if (topic === 'Skud/parking/config') {
        // Конфигурация парковок
        const config = JSON.parse(payload);
        this.parkingConfigs = config.parkings || [];
        
        logger.info(`[Parking MQTT] Получена конфигурация: ${this.parkingConfigs.length} парковок`);
        
        // Отписываемся от старых топиков
        this.parkingConfigs.forEach(parking => {
          this.client.unsubscribe(parking.vehiclesTopic, (err) => {
            if (err) {
              logger.error(`[Parking MQTT] Ошибка отписки от ${parking.vehiclesTopic}:`, err);
            }
          });
        });
        
        // Подписываемся на топики с транспортом
        this.parkingConfigs.forEach(parking => {
          this.client.subscribe(parking.vehiclesTopic, (err) => {
            if (err) {
              logger.error(`[Parking MQTT] Ошибка подписки на ${parking.vehiclesTopic}:`, err);
            } else {
              logger.info(`[Parking MQTT] ✅ Подписка на ${parking.vehiclesTopic}`);
            }
          });
          
          // Инициализируем пустой массив
          this.parkingVehicles[parking.id] = [];
        });
        
        // Отправляем конфигурацию всем подключенным клиентам
        this.broadcastToClients({
          type: 'parking_config',
          parkings: this.parkingConfigs,
        });
        
      } else {
        // Ищем парковку по топику
        const parking = this.parkingConfigs.find(p => p.vehiclesTopic === topic);
        
        if (parking) {
          const vehicles = JSON.parse(payload);
          this.parkingVehicles[parking.id] = vehicles;
          
          logger.info(`[Parking MQTT] Обновление ${parking.name}: ${vehicles.length} автомобилей`);
          
          // Отправляем обновление клиентам
          this.broadcastToClients({
            type: 'parking_vehicles',
            parkingId: parking.id,
            vehicles: vehicles,
          });
        }
      }
      
    } catch (error) {
      logger.error('[Parking MQTT] Ошибка обработки сообщения:', error);
    }
  }

  /**
   * Регистрация WebSocket клиента
   */
  registerClient(ws) {
    this.wsClients.add(ws);
    logger.info(`[Parking MQTT] Клиент подключен. Всего: ${this.wsClients.size}`);

    // Отправляем текущую конфигурацию
    if (this.parkingConfigs.length > 0) {
      ws.send(JSON.stringify({
        type: 'parking_config',
        parkings: this.parkingConfigs,
      }));
      
      // Отправляем текущие данные по каждой парковке
      this.parkingConfigs.forEach(parking => {
        if (this.parkingVehicles[parking.id]) {
          ws.send(JSON.stringify({
            type: 'parking_vehicles',
            parkingId: parking.id,
            vehicles: this.parkingVehicles[parking.id],
          }));
        }
      });
    }

    ws.on('close', () => {
      this.wsClients.delete(ws);
      logger.info(`[Parking MQTT] Клиент отключен. Осталось: ${this.wsClients.size}`);
    });
  }

  /**
   * Рассылка сообщения всем подключенным клиентам
   */
  broadcastToClients(data) {
    const message = JSON.stringify(data);
    let sent = 0;
    let failed = 0;

    this.wsClients.forEach(ws => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        try {
          ws.send(message);
          sent++;
        } catch (error) {
          logger.error('[Parking MQTT] Ошибка отправки клиенту:', error);
          failed++;
        }
      }
    });

    if (sent > 0) {
      logger.debug(`[Parking MQTT] Отправлено ${sent} клиентам (ошибок: ${failed})`);
    }
  }

  /**
   * Получить статус подключения
   */
  getStatus() {
    return {
      connected: this.isConnected,
      parkingsCount: this.parkingConfigs.length,
      wsClients: this.wsClients.size,
      parkings: this.parkingConfigs.map(p => ({
        id: p.id,
        name: p.name,
        vehiclesCount: this.parkingVehicles[p.id]?.length || 0,
      })),
    };
  }

  /**
   * Получить данные парковок
   */
  getParkings() {
    return this.parkingConfigs.map(parking => ({
      ...parking,
      vehicles: this.parkingVehicles[parking.id] || [],
      currentCount: (this.parkingVehicles[parking.id] || []).length,
    }));
  }

  /**
   * Отключение от MQTT
   */
  disconnect() {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
      logger.info('[Parking MQTT] Отключено');
    }
  }
}

// Singleton instance
const parkingMQTTService = new ParkingMQTTService();

module.exports = parkingMQTTService;
