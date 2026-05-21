require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('--- Тестирование подключения к базе данных ---');
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`User: ${process.env.DB_USER}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'utmn_security'
    });

    console.log('✅ Подключение успешно установлено!');

    const [rows] = await connection.execute('SELECT 1 as val');
    console.log('✅ Тестовый запрос (SELECT 1) выполнен успешно:', rows);

    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📊 Таблицы в базе данных:');
    tables.forEach(row => {
      console.log(` - ${Object.values(row)[0]}`);
    });

    await connection.end();
    console.log('--- Тест завершен успешно ---');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка подключения:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('👉 Проверьте логин и пароль в файле .env');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('👉 Проверьте, запущен ли сервер MySQL и правильный ли хост/порт');
    }
    process.exit(1);
  }
}

testConnection();
