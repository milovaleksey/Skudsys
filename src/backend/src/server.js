const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const { connectDatabase } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');

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

const app = express();
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

// API маршруты
app.use(`/${API_VERSION}/auth`, authRoutes);
app.use(`/${API_VERSION}/users`, userRoutes);
app.use(`/${API_VERSION}/roles`, roleRoutes);
app.use(`/${API_VERSION}/students`, studentRoutes);
app.use(`/${API_VERSION}/employees`, employeeRoutes);
app.use(`/${API_VERSION}/access-logs`, accessLogRoutes);
app.use(`/${API_VERSION}/parking`, parkingRoutes);
app.use(`/${API_VERSION}/storage`, storageRoutes);
app.use(`/${API_VERSION}/analytics`, analyticsRoutes);

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

    // Запуск сервера
    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/${API_VERSION}`);
      console.log(`🏥 Health: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
};

// Обработка завершения
process.on('SIGTERM', () => {
  console.log('SIGTERM получен, завершение работы...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT получен, завершение работы...');
  process.exit(0);
});

startServer();

module.exports = app;
