const fs = require('fs');
const path = require('path');

// Попытка найти .env
const envPathBackend = path.join(__dirname, '.env');
const envPathRoot = path.join(__dirname, '..', '.env');

if (fs.existsSync(envPathBackend)) {
  require('dotenv').config({ path: envPathBackend });
  console.log('Загружен .env из backend директории');
} else if (fs.existsSync(envPathRoot)) {
  require('dotenv').config({ path: envPathRoot });
  console.log('Загружен .env из корневой директории');
} else {
  console.log('⚠️ .env файл не найден, пробуем использовать переменные окружения');
}

const { connectDatabase, closeDatabase } = require('./src/config/database');

async function fixRolesTable() {
  try {
    console.log('Подключение к базе данных...');
    const pool = await connectDatabase();
    
    console.log('Исправление таблицы roles...');
    
    // 1. Проверяем текущую структуру
    const [columns] = await pool.query('SHOW COLUMNS FROM roles WHERE Field = "id"');
    console.log('Текущее состояние колонки id:', columns[0]);

    // 2. Делаем id авто-инкрементируемым
    // MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY
    // Но сначала проверим, есть ли PRIMARY KEY
    const [indexes] = await pool.query('SHOW INDEX FROM roles WHERE Key_name = "PRIMARY"');
    const isPrimaryKey = indexes.some(idx => idx.Column_name === 'id');

    try {
        if (isPrimaryKey) {
             console.log('ID уже является Primary Key. Добавляем AUTO_INCREMENT...');
             await pool.query('ALTER TABLE roles MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT');
        } else {
             console.log('Делаем ID Primary Key и AUTO_INCREMENT...');
             await pool.query('ALTER TABLE roles MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT PRIMARY KEY');
        }
        console.log('✅ Успешно исправлена колонка id в таблице roles');
    } catch (alterError) {
        console.error('Ошибка при ALTER TABLE:', alterError.message);
    }

    console.log('Исправление завершено.');
  } catch (error) {
    console.error('Критическая ошибка:', error);
  } finally {
    await closeDatabase();
  }
}

fixRolesTable();