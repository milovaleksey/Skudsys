const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const mqttService = require('../services/mqtt.service');

/**
 * Инициализация WebSocket сервера для MQTT обновлений
 */
function initMQTTWebSocket(server) {
  const wss = new WebSocket.Server({ 
    noServer: true
  });

  console.log('[MQTT WebSocket] Инициализирован для /ws/mqtt');

  // Множество подключенных клиентов
  const clients = new Set();

  wss.on('connection', (ws, req) => {
    console.log('[MQTT WebSocket] Новое подключение');

    // Аутентификация через токен в query параметрах
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      console.log('[WebSocket] ❌ Отклонено: отсутствует токен');
      ws.close(4001, 'Требуется токен авторизации');
      return;
    }

    try {
      // Проверяем токен
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      ws.userId = decoded.userId;
      ws.username = decoded.username;
      console.log(`[WebSocket] ✅ Аутентифицирован: ${ws.username}`);

      // Добавляем клиента в список
      clients.add(ws);

      // Отправляем текущие данные при подключении
      const initialData = {
        type: 'initial',
        cards: mqttService.getCardsWithValues(),
        status: mqttService.getStatus(),
      };
      ws.send(JSON.stringify(initialData));

      // Обработка сообщений от клиента
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('[WebSocket] Получено сообщение от клиента:', data);

          // Можно добавить обработку команд от клиента
          if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (error) {
          console.error('[WebSocket] Ошибка обработки сообщения:', error);
        }
      });

      // Обработка отключения
      ws.on('close', () => {
        console.log(`[WebSocket] Клиент отключен: ${ws.username}`);
        clients.delete(ws);
      });

      // Обработка ошибок
      ws.on('error', (error) => {
        console.error('[WebSocket] Ошибка соединения:', error);
        clients.delete(ws);
      });

    } catch (error) {
      console.log('[WebSocket] ❌ Неверный токен:', error.message);
      ws.close(4002, 'Неверный токен авторизации');
    }
  });

  // Отправка обновлений всем подключенным клиентам при обновлении конфигурации
  mqttService.on('config-updated', (cards) => {
    console.log('[WebSocket] 📊 Рассылка обновления конфигурации клиентам');
    const message = JSON.stringify({
      type: 'config-updated',
      cards: mqttService.getCardsWithValues(),
    });

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // Отправка обновлений при изменении значения
  mqttService.on('value-updated', ({ cardId, value }) => {
    console.log(`[WebSocket] 📨 Рассылка обновления значения [${cardId}] клиентам`);
    const message = JSON.stringify({
      type: 'value-updated',
      cardId,
      value,
    });

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // Отправка статуса подключения
  mqttService.on('connected', () => {
    console.log('[WebSocket] 📡 Рассылка статуса: подключено');
    const message = JSON.stringify({
      type: 'status-changed',
      status: mqttService.getStatus(),
    });

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  mqttService.on('disconnected', () => {
    console.log('[WebSocket] 📡 Рассылка статуса: отключено');
    const message = JSON.stringify({
      type: 'status-changed',
      status: mqttService.getStatus(),
    });

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // Heartbeat для поддержания соединения
  const heartbeatInterval = setInterval(() => {
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'heartbeat' }));
      } else {
        clients.delete(client);
      }
    });
  }, 30000); // Каждые 30 секунд

  // Очистка при завершении
  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  return { wss, path: '/ws/mqtt' };
}

module.exports = { initMQTTWebSocket };