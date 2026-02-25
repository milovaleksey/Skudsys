const WebSocket = require('ws');
const url = require('url');
const parkingMQTTService = require('../services/parking-mqtt.service');
const logger = require('../utils/logger');

/**
 * Инициализация WebSocket сервера для парковок
 */
function initParkingWebSocket(server) {
  const wss = new WebSocket.Server({ noServer: true });

  // Обработка upgrade запросов
  server.on('upgrade', (request, socket, head) => {
    const pathname = url.parse(request.url).pathname;

    if (pathname === '/parking-ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  // Обработка подключений
  wss.on('connection', (ws) => {
    logger.info('[Parking WS] Новое подключение');

    // Регистрируем клиента в parking MQTT service
    parkingMQTTService.registerClient(ws);

    // Heartbeat
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        logger.debug('[Parking WS] Получено сообщение:', data);

        // Обработка команд от клиента
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        logger.error('[Parking WS] Ошибка обработки сообщения:', error);
      }
    });

    ws.on('error', (error) => {
      logger.error('[Parking WS] Ошибка WebSocket:', error);
    });

    ws.on('close', () => {
      logger.info('[Parking WS] Клиент отключен');
    });
  });

  // Heartbeat ping
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        logger.warn('[Parking WS] Клиент не отвечает, отключение');
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // 30 секунд

  wss.on('close', () => {
    clearInterval(interval);
  });

  logger.info('[Parking WS] ✅ WebSocket сервер для парковок инициализирован');
}

module.exports = { initParkingWebSocket };
