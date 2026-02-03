require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkLogs() {
  console.log('🔍 Проверка таблицы audit_log...');

  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  };

  console.log(`📡 Подключение к БД: ${config.host}:${config.port}, база: ${config.database}`);

  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Подключение успешно');

    // 1. Проверка структуры таблицы
    console.log('\n📋 Структура таблицы audit_log:');
    const [columns] = await connection.query('DESCRIBE audit_log');
    columns.forEach(col => {
      console.log(` - ${col.Field} (${col.Type})`);
    });

    // 2. Проверка количества записей
    const [countResult] = await connection.query('SELECT COUNT(*) as total FROM audit_log');
    const total = countResult[0].total;
    console.log(`\n📊 Всего записей в логе: ${total}`);

    // 3. Вывод последних 5 записей
    if (total > 0) {
      console.log('\n📝 Последние 5 записей:');
      const [rows] = await connection.query('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 5');
      
      rows.forEach((row, index) => {
        console.log(`\n[Запись #${index + 1}] ID: ${row.id}`);
        console.log(`Action: ${row.action}`);
        console.log(`Entity: ${row.entity_type} #${row.entity_id}`);
        console.log(`User ID: ${row.user_id}`);
        
        // Проверяем наличие полей с данными
        if (row.changes) console.log(`Changes: ${typeof row.changes === 'object' ? JSON.stringify(row.changes) : row.changes}`);
        if (row.old_values) console.log(`Old Values: ${typeof row.old_values === 'object' ? JSON.stringify(row.old_values) : row.old_values}`);
        if (row.new_values) console.log(`New Values: ${typeof row.new_values === 'object' ? JSON.stringify(row.new_values) : row.new_values}`);
        
        console.log(`Time: ${row.created_at}`);
      });
    } else {
      console.log('\n⚠️ Таблица пуста. Попробуйте выполнить какое-нибудь действие (создать/изменить пользователя), чтобы появилась запись.');
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkLogs();
