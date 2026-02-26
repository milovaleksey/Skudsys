const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');
require('dotenv').config();

const { connectDatabase } = require('./config/database');
const permissionUpdater = require('./utils/permissionUpdater');
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');
const mqttService = require('./services/mqtt.service');
const parkingMQTTService = require('./services/parking-mqtt.service');
const { initMQTTWebSocket } = require('./websocket/mqtt.ws');
const { initParkingWebSocket } = require('./websocket/parking.ws');

// Импорт маршрутов
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const roleRoutes = require('./routes/role.routes');
const studentRoutes = require('./routes/student.routes');
const employeeRoutes = require('./routes/employee.routes');
const accessLogRoutes = require('./routes/accessLog.routes');
const parkingRoutes = require('./routes/parking.routes');
const storageRoutes = require('./routes/storage.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const auditRoutes = require('./routes/audit.routes');
const mqttRoutes = require('./routes/mqtt.routes');

const app = express();

// Trust first proxy (Nginx) to fix X-Forwarded-For header issues with rate limiting
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Middleware
app.use(helmet()); // Безопасность заголовков
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: process.env.CORS_CREDENTIALS === 'true'
}));
app.use(compression()); // Сжатие ответов
app.use(morgan('combined')); // Логирование запросов
app.use(express.json()); // Парсинг JSON
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimiter);

// Проверка здоровья
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API работает',
    timestamp: new Date().toISOString(),
    version: API_VERSION
  });
});

// Health check с префиксом /api
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API работает',
    timestamp: new Date().toISOString(),
    version: API_VERSION
  });
});

// API маршруты (версия с /v1)
app.use(`/${API_VERSION}/auth`, authRoutes);
app.use(`/${API_VERSION}/users`, userRoutes);
app.use(`/${API_VERSION}/roles`, roleRoutes);
app.use(`/${API_VERSION}/students`, studentRoutes);
app.use(`/${API_VERSION}/employees`, employeeRoutes);
app.use(`/${API_VERSION}/access-logs`, accessLogRoutes);
app.use(`/${API_VERSION}/parking`, parkingRoutes);
app.use(`/${API_VERSION}/storage`, storageRoutes);
app.use(`/${API_VERSION}/analytics`, analyticsRoutes);
app.use(`/${API_VERSION}/audit-logs`, auditRoutes);
app.use(`/${API_VERSION}/mqtt`, mqttRoutes);

// API маршруты (версия с /api для совместимости)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/access-logs', accessLogRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/mqtt', mqttRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Маршрут не найден'
    }
  });
});

// Error handler
app.use(errorHandler);

// Запуск сервера
const startServer = async () => {
  try {
    // Подключение к базе данных
    await connectDatabase();
    console.log('✅ Подключено к MySQL');

    // Обнвление прав доступа
    console.log('🔄 Обновление прав доступа...');
    await permissionUpdater();
    console.log('✅ Права доступа обновлены');

    // Запуск сервера
    const server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/${API_VERSION}`);
      console.log(`🏥 Health: http://localhost:${PORT}/health`);
    });

    // Инициализация MQTT WebSocket
    const mqttWS = initMQTTWebSocket(server);

    // Инициализация Parking MQTT WebSocket
    const parkingWS = initParkingWebSocket(server);

    // Обработка WebSocket upgrade для разных путей
    server.on('upgrade', (request, socket, head) => {
      const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

      if (pathname === mqttWS.path) {
        mqttWS.wss.handleUpgrade(request, socket, head, (ws) => {
          mqttWS.wss.emit('connection', ws, request);
        });
      } else if (pathname === parkingWS.path) {
        parkingWS.wss.handleUpgrade(request, socket, head, (ws) => {
          parkingWS.wss.emit('connection', ws, request);
        });
      } else {
        console.warn(`[WebSocket] Неизвестный пу��ь: ${pathname}`);
        socket.destroy();
      }
    });

    // Подключение к MQTT брокеру
    if (process.env.MQTT_ENABLED !== 'false') {
      console.log('🔌 Подключение к MQTT брокеру...');
      mqttService.connect();
    } else {
      console.log('⚠️  MQTT отключен в конфигурации');
    }

    // Подключение к Parking MQTT брокеру
    if (process.env.PARKING_MQTT_ENABLED !== 'false') {
      console.log('🔌 Подключение к Parking MQTT брокеру...');
      parkingMQTTService.connect();
    } else {
      console.log('⚠️  Parking MQTT отключен в конфигурации');
    }
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
};

// Обработка завершения
process.on('SIGTERM', () => {
  console.log('SIGTERM получен, завершение работы...');
  mqttService.disconnect();
  parkingMQTTService.disconnect();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT получен, завершение работы...');
  mqttService.disconnect();
  parkingMQTTService.disconnect();
  process.exit(0);
});

startServer();

module.exports = app;