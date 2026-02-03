const fs = require('fs');
const path = require('path');

// Попытка найти .env
const envPathBackend = path.join(__dirname, '.env');
const envPathRoot = path.join(__dirname, '..', '.env');

if (fs.existsSync(envPathBackend)) {
  require('dotenv').config({ path: envPathBackend });
} else if (fs.existsSync(envPathRoot)) {
  require('dotenv').config({ path: envPathRoot });
}

const { connectDatabase, closeDatabase } = require('./src/config/database');

async function checkAuditSchema() {
  try {
    const pool = await connectDatabase();
    console.log('Проверка схемы таблицы audit_log...');
    
    const [columns] = await pool.query('SHOW COLUMNS FROM audit_log');
    console.log('Колонки таблицы audit_log:');
    columns.forEach(col => console.log(`- ${col.Field} (${col.Type})`));

  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    await closeDatabase();
  }
}

checkAuditSchema();