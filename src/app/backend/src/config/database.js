const mysql = require('mysql2/promise');

let pool = null;

const connectDatabase = async () => {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'utmn_security',
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
      queueLimit: 0,
      charset: 'utf8mb4'
    });

    // Проверка подключения
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    return pool;
  } catch (error) {
    console.error('Ошибка подключения к MySQL:', error);
    throw error;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('База данных не подключена');
  }
  return pool;
};

const closeDatabase = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

module.exports = {
  connectDatabase,
  getPool,
  closeDatabase
};
