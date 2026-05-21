/**
 * Второй коннектор к MySQL для работы с базой данных СКУД
 * Используется для получения данных о проходах, местоположении людей, 
 * информации о студентах и сотрудниках
 */

const mysql = require('mysql2/promise');

let skudPool = null;

const connectSkudDatabase = async () => {
  try {
    skudPool = mysql.createPool({
      host: process.env.SKUD_DB_HOST || process.env.DB_HOST || 'localhost',
      port: process.env.SKUD_DB_PORT || process.env.DB_PORT || 3306,
      user: process.env.SKUD_DB_USER || process.env.DB_USER || 'root',
      password: process.env.SKUD_DB_PASSWORD || process.env.DB_PASSWORD,
      database: process.env.SKUD_DB_NAME || 'utmn_security',
      waitForConnections: true,
      connectionLimit: parseInt(process.env.SKUD_DB_CONNECTION_LIMIT || process.env.DB_CONNECTION_LIMIT) || 10,
      queueLimit: 0,
      charset: 'utf8mb4'
    });

    // Проверка подключения
    const connection = await skudPool.getConnection();
    await connection.ping();
    connection.release();

    console.log('✓ Подключение к базе данных СКУД установлено');
    return skudPool;
  } catch (error) {
    console.error('✗ Ошибка подключения к базе данных СКУД:', error.message);
    throw error;
  }
};

const getSkudPool = () => {
  if (!skudPool) {
    throw new Error('База данных СКУД не подключена');
  }
  return skudPool;
};

const closeSkudDatabase = async () => {
  if (skudPool) {
    await skudPool.end();
    skudPool = null;
    console.log('✓ Подключение к базе данных СКУД закрыто');
  }
};

module.exports = {
  connectSkudDatabase,
  getSkudPool,
  closeSkudDatabase
};
