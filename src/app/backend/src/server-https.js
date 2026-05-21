const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
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
const passwordRoutes = require('./routes/password.routes');

const app = express();
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const API_VERSION = process.env.API_VERSION || 'v1';
const USE_HTTPS = process.env.USE_HTTPS === 'true';

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
    version: API_VERSION,
    https: USE_HTTPS
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
app.use(`/${API_VERSION}/password`, passwordRoutes);

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

// Функция для загрузки SSL сертификатов
const loadSSLCertificates = () => {
  const certDir = path.join(__dirname, '../../certs');
  
  try {
    const options = {
      key: fs.readFileSync(path.join(certDir, 'server.key')),
      cert: fs.readFileSync(path.join(certDir, 'server.crt'))
    };
    
    console.log('✅ SSL сертификаты загружены');
    return options;
  } catch (error) {
    console.error('❌ Ошибка загрузки SSL сертификатов:', error.message);
    console.error('💡 Сгенерируйте сертификаты: ./scripts/generate-ssl-cert.sh');
    return null;
  }
};

// Запуск сервера
const startServer = async () => {
  try {
    // Подключение к БД
    await connectDatabase();
    console.log('✅ Подключено к MySQL');

    if (USE_HTTPS) {
      // HTTPS режим
      const sslOptions = loadSSLCertificates();
      
      if (sslOptions) {
        // Запуск HTTPS сервера
        https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
          console.log('');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🔐 HTTPS сервер запущен');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`🚀 Порт:    ${HTTPS_PORT}`);
          console.log(`📡 API:     https://localhost:${HTTPS_PORT}/${API_VERSION}`);
          console.log(`🏥 Health:  https://localhost:${HTTPS_PORT}/health`);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('');
          console.log('⚠️  Используется самоподписанный сертификат');
          console.log('💡 Браузер может показать предупреждение безопасности');
          console.log('   Это нормально для разработки - нажмите "Продолжить"');
          console.log('');
        });

        // Опционально: редирект с HTTP на HTTPS
        if (process.env.HTTP_REDIRECT === 'true') {
          http.createServer((req, res) => {
            res.writeHead(301, { 
              Location: `https://localhost:${HTTPS_PORT}${req.url}` 
            });
            res.end();
          }).listen(PORT, () => {
            console.log(`🔄 HTTP → HTTPS редирект на порту ${PORT}`);
          });
        }
      } else {
        console.error('❌ Не удалось запустить HTTPS сервер');
        process.exit(1);
      }
    } else {
      // HTTP режим (обычный)
      http.createServer(app).listen(PORT, () => {
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🚀 HTTP сервер запущен');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🚀 Порт:    ${PORT}`);
        console.log(`📡 API:     http://localhost:${PORT}/${API_VERSION}`);
        console.log(`🏥 Health:  http://localhost:${PORT}/health`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
};

// Обработка завершения
process.on('SIGTERM', () => {
  console.log('👋 Получен сигнал SIGTERM. Завершение работы...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 Получен сигнал SIGINT. Завершение работы...');
  process.exit(0);
});

startServer();
