const WebSocket = require('ws');
const foreignStudentsMQTTService = require('../services/foreign-students-mqtt.service');

/**
 * Инициализация WebSocket сервера для Foreign Students MQTT
 */
function initForeignStudentsWebSocket(server) {
  const wss = new WebSocket.Server({ 
    noServer: true
  });

  console.log('[Foreign Students WebSocket] Инициализирован для /ws');

  // Множество подключенных клиентов
  const clients = new Set();

  wss.on('connection', (ws, req) => {
    console.log('[Foreign Students WebSocket] Новое подключение');

    // Добавляем клиента в список
    clients.add(ws);

    // Отправляем текущие данные при подключении
    const initialData = foreignStudentsMQTTService.getAllData();
    
    // Отправляем конфигурацию
    if (initialData.statCards.length > 0) {
      ws.send(JSON.stringify({
        topic: 'Skud/foreign-students/config',
        payload: initialData.statCards
      }));
    }

    // Отправляем статистику по странам
    if (initialData.countryStats.length > 0) {
      ws.send(JSON.stringify({
        topic: 'Skud/foreign-students/stats',
        payload: initialData.countryStats
      }));
    }

    // Отправляем справочник стран
    if (initialData.countries.length > 0) {
      ws.send(JSON.stringify({
        topic: 'Skud/foreign-students/countries',
        payload: initialData.countries
      }));
    }

    // Отправляем значения карточек
    Object.entries(initialData.cardValues).forEach(([cardId, value]) => {
      ws.send(JSON.stringify({
        topic: `Skud/foreign-students/data/${cardId}`,
        payload: value
      }));
    });

    // Обработка сообщений от клиента
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('[Foreign Students WebSocket] Получено сообщение:', data);

        // Обработка команды подписки
        if (data.action === 'subscribe') {
          console.log('[Foreign Students WebSocket] Клиент подписался на топики:', data.topics);
          // В данном случае мы отправляем все данные сразу, но можно добавить фильтрацию
        }

        // Ping-pong
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('[Foreign Students WebSocket] Ошибка обработки сообщения:', error);
      }
    });

    // Обработка отключения
    ws.on('close', () => {
      console.log('[Foreign Students WebSocket] Клиент отключен');
      clients.delete(ws);
    });

    // Обработка ошибок
    ws.on('error', (error) => {
      console.error('[Foreign Students WebSocket] Ошибка соединения:', error);
      clients.delete(ws);
    });
  });

  // Рассылка обновления конфигурации
  foreignStudentsMQTTService.on('config-updated', (data) => {
    console.log('[Foreign Students WebSocket] 📊 Рассылка обновления конфигурации');
    const message = JSON.stringify({
      topic: 'Skud/foreign-students/config',
      payload: data
    });

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // Рассылка обновления статистики
  foreignStudentsMQTTService.on('stats-updated', (data) => {
    console.log('[Foreign Students WebSocket] 📈 Рассылка обновления статистики');
    const message = JSON.stringify({
      topic: 'Skud/foreign-students/stats',
      payload: data
    });

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // Рассылка обновления справочника стран
  foreignStudentsMQTTService.on('countries-updated', (data) => {
    console.log('[Foreign Students WebSocket] 🌍 Рассылка обновления справочника стран');
    const message = JSON.stringify({
      topic: 'Skud/foreign-students/countries',
      payload: data
    });

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // Рассылка обновления значения карточки
  foreignStudentsMQTTService.on('card-value-updated', ({ cardId, value }) => {
    console.log(`[Foreign Students WebSocket] 📨 Рассылка обновления значения карточки [${cardId}]`);
    const message = JSON.stringify({
      topic: `Skud/foreign-students/data/${cardId}`,
      payload: value
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

  return { wss, path: '/ws' };
}

module.exports = { initForeignStudentsWebSocket };
