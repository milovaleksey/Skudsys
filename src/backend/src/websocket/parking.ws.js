const WebSocket = require('ws');
const url = require('url');
const parkingMQTTService = require('../services/parking-mqtt.service');

/**
 * Инициализация WebSocket сервера для парковок
 */
function initParkingWebSocket(server) {
  const wss = new WebSocket.Server({ noServer: true });

  console.log('[Parking WS] ✅ WebSocket инициализирован для /parking-ws');

  // Обработка подключений
  wss.on('connection', (ws, req) => {
    console.log('[Parking WS] Новое подключение');

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
        console.log('[Parking WS] Получено сообщение:', data);

        // Обработка команд от клиента
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('[Parking WS] Ошибка обработки сообщения:', error);
      }
    });

    ws.on('error', (error) => {
      console.error('[Parking WS] Ошибка WebSocket:', error);
    });

    ws.on('close', () => {
      console.log('[Parking WS] Клиент отключен');
    });
  });

  // Heartbeat ping
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.warn('[Parking WS] Клиент не отвечает, отключение');
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // 30 секунд

  wss.on('close', () => {
    clearInterval(interval);
  });

  return { wss, path: '/parking-ws' };
}

module.exports = { initParkingWebSocket };