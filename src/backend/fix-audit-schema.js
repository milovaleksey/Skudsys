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

async function fixAuditSchema() {
  try {
    console.log('Подключение к базе данных...');
    const pool = await connectDatabase();
    
    console.log('Исправление таблицы audit_log...');
    
    // Проверка наличия колонки changes
    const [columns] = await pool.query('SHOW COLUMNS FROM audit_log WHERE Field = "changes"');
    
    if (columns.length === 0) {
      console.log('Колонка changes отсутствует. Создаем...');
      // Добавляем колонку changes типа JSON (или TEXT для совместимости)
      await pool.query('ALTER TABLE audit_log ADD COLUMN changes JSON NULL AFTER entity_id');
      console.log('✅ Колонка changes успешно добавлена.');
    } else {
      console.log('Колонка changes уже существует.');
    }

    // Также проверим details, возможно она называлась так
    const [detailsCol] = await pool.query('SHOW COLUMNS FROM audit_log WHERE Field = "details"');
    if (detailsCol.length > 0) {
        console.log('⚠️ Обнаружена колонка details. Возможно, стоит использовать её вместо changes.');
    }

    console.log('Исправление завершено.');
  } catch (error) {
    console.error('Критическая ошибка:', error);
  } finally {
    await closeDatabase();
  }
}

fixAuditSchema();