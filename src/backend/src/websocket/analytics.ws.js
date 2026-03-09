/**
 * WebSocket сервер для аналитики
 * Передает данные MQTT на frontend в реальном времени
 */

const WebSocket = require('ws');
const { getAnalyticsService } = require('../services/analytics-mqtt.service');

class AnalyticsWebSocketServer {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.analyticsService = null;
  }

  /**
   * Инициализация WebSocket сервера
   */
  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/analytics'
    });

    console.log('[Analytics WS] 🌐 WebSocket server initialized on /ws/analytics');

    this.wss.on('connection', (ws, req) => {
      const clientIp = req.socket.remoteAddress;
      console.log(`[Analytics WS] 👤 Client connected from ${clientIp}`);
      
      this.clients.add(ws);

      // Отправляем приветственное сообщение
      this.sendToClient(ws, {
        type: 'connected',
        message: 'Connected to Analytics WebSocket'
      });

      // Отправляем текущие данные
      this.sendCurrentData(ws);

      // Обработка сообщений от клиента
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('[Analytics WS] ❌ Message parse error:', error);
          this.sendToClient(ws, {
            type: 'error',
            message: 'Invalid message format'
          });
        }
      });

      // Обработка отключения
      ws.on('close', () => {
        console.log(`[Analytics WS] 👋 Client disconnected from ${clientIp}`);
        this.clients.delete(ws);
      });

      // Обработка ошибок
      ws.on('error', (error) => {
        console.error('[Analytics WS] ❌ WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Ping-pong для поддержания соединения
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });
    });

    // Периодическая проверка активных подключений
    this.startHeartbeat();

    // Инициализируем MQTT сервис
    this.initializeAnalyticsService();

    return this.wss;
  }

  /**
   * Инициализация MQTT сервиса аналитики
   */
  async initializeAnalyticsService() {
    try {
      this.analyticsService = getAnalyticsService();
      
      // Инициализируем MQTT клиент
      await this.analyticsService.initialize();
      
      // Подписываемся на обновления через setInterval
      this.startMQTTPolling();
      
      console.log('[Analytics WS] ✅ Analytics MQTT service initialized');
    } catch (error) {
      console.error('[Analytics WS] ❌ Failed to initialize Analytics MQTT service:', error);
    }
  }

  /**
   * Периодический опрос MQTT данных
   */
  startMQTTPolling() {
    // Проверяем каждые 10 секунд, если есть новые данные - отправляем
    setInterval(() => {
      if (this.analyticsService && this.analyticsService.isConnected) {
        const status = this.analyticsService.getStatus();
        
        // Отправляем статус всем подключенным клиентам
        this.broadcastStatus(status);
      }
    }, 10000); // 10 секунд
  }

  /**
   * Отправка текущих данных клиенту
   */
  async sendCurrentData(ws) {
    try {
      if (!this.analyticsService) {
        return;
      }

      const status = this.analyticsService.getStatus();
      
      this.sendToClient(ws, {
        type: 'status',
        data: {
          isConnected: status.isConnected,
          hasConfig: !!status.config
        }
      });

      // Если есть конфиг, отправляем его
      if (status.config) {
        this.sendToClient(ws, {
          type: 'config',
          data: status.config
        });
      }
    } catch (error) {
      console.error('[Analytics WS] ❌ sendCurrentData error:', error);
    }
  }

  /**
   * Обработка сообщений от клиента
   */
  handleClientMessage(ws, data) {
    console.log('[Analytics WS] 📩 Received message:', data.type);

    switch (data.type) {
      case 'ping':
        this.sendToClient(ws, { type: 'pong' });
        break;

      case 'request_update':
        // Клиент запрашивает обновление данных
        if (this.analyticsService) {
          this.analyticsService.updateData();
        }
        break;

      case 'get_status':
        this.sendCurrentData(ws);
        break;

      default:
        console.log(`[Analytics WS] ⚠️ Unknown message type: ${data.type}`);
    }
  }

  /**
   * Рассылка статуса всем клиентам
   */
  broadcastStatus(status) {
    const message = {
      type: 'status',
      data: {
        isConnected: status.isConnected,
        hasConfig: !!status.config,
        timestamp: new Date().toISOString()
      }
    };

    this.broadcast(message);
  }

  /**
   * Рассылка данных всем клиентам
   */
  broadcastData(data) {
    const message = {
      type: 'data',
      data
    };

    this.broadcast(message);
  }

  /**
   * Рассылка конфига всем клиентам
   */
  broadcastConfig(config) {
    const message = {
      type: 'config',
      data: config
    };

    this.broadcast(message);
  }

  /**
   * Отправка сообщения одному клиенту
   */
  sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('[Analytics WS] ❌ Send error:', error);
      }
    }
  }

  /**
   * Рассылка сообщения всем клиентам
   */
  broadcast(message) {
    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
          sentCount++;
        } catch (error) {
          console.error('[Analytics WS] ❌ Broadcast error:', error);
        }
      }
    });

    if (sentCount > 0) {
      console.log(`[Analytics WS] 📤 Broadcasted ${message.type} to ${sentCount} client(s)`);
    }
  }

  /**
   * Heartbeat для поддержания соединений
   */
  startHeartbeat() {
    const interval = setInterval(() => {
      this.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          console.log('[Analytics WS] 💀 Terminating inactive client');
          this.clients.delete(ws);
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 секунд

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  /**
   * Получение статистики
   */
  getStats() {
    return {
      connectedClients: this.clients.size,
      mqttConnected: this.analyticsService ? this.analyticsService.isConnected : false
    };
  }

  /**
   * Остановка сервера
   */
  async shutdown() {
    console.log('[Analytics WS] 🛑 Shutting down...');

    // Отключаем MQTT сервис
    if (this.analyticsService) {
      await this.analyticsService.disconnect();
    }

    // Закрываем все WebSocket соединения
    this.clients.forEach((client) => {
      client.close(1000, 'Server shutting down');
    });

    // Закрываем сервер
    if (this.wss) {
      this.wss.close(() => {
        console.log('[Analytics WS] ✅ WebSocket server closed');
      });
    }
  }
}

// Singleton instance
let analyticsWSInstance = null;

const getAnalyticsWebSocketServer = () => {
  if (!analyticsWSInstance) {
    analyticsWSInstance = new AnalyticsWebSocketServer();
  }
  return analyticsWSInstance;
};

module.exports = {
  getAnalyticsWebSocketServer,
  AnalyticsWebSocketServer
};
