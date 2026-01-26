/**
 * Скрипт для создания тестового пользователя
 * 
 * Использование:
 *   node create-test-user.js
 * 
 * Создаёт пользователя:
 *   Username: admin
 *   Password: Admin2025
 *   Role: admin
 */

const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTestUser() {
  let connection;
  
  try {
    // Подключение к БД
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'utmn_user',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'utmn_security_db'
    });

    console.log('✅ Подключено к базе данных');

    // Данные тестового пользователя
    const testUser = {
      username: 'admin',
      fullName: 'Администратор Системы',
      email: 'admin@utmn.ru',
      password: 'Admin2025',
      role: 'admin',
      authType: 'local'
    };

    // Проверить существует ли пользователь
    const [existing] = await connection.query(
      'SELECT id FROM users WHERE username = ?',
      [testUser.username]
    );

    if (existing.length > 0) {
      console.log('⚠️  Пользователь с username "admin" уже существует');
      console.log('   ID:', existing[0].id);
      
      // Обновить пароль
      const passwordHash = await bcrypt.hash(testUser.password, 10);
      await connection.query(
        'UPDATE users SET password_hash = ? WHERE username = ?',
        [passwordHash, testUser.username]
      );
      
      console.log('✅ Пароль обновлён на: Admin2025');
      return;
    }

    // Проверить существует ли роль
    const [roles] = await connection.query(
      'SELECT name FROM roles WHERE name = ?',
      [testUser.role]
    );

    if (roles.length === 0) {
      console.log('❌ Роль "admin" не найдена в базе данных');
      console.log('   Сначала выполните миграцию: npm run db:migrate');
      return;
    }

    // Хеширование пароля
    const passwordHash = await bcrypt.hash(testUser.password, 10);
    console.log('✅ Пароль захеширован');

    // Создать пользователя
    const [result] = await connection.query(
      `INSERT INTO users (username, full_name, email, password_hash, role_name, auth_type, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        testUser.username,
        testUser.fullName,
        testUser.email,
        passwordHash,
        testUser.role,
        testUser.authType,
        1
      ]
    );

    console.log('✅ Тестовый пользователь создан!');
    console.log('');
    console.log('📋 Данные для входа:');
    console.log('   Username: admin');
    console.log('   Password: Admin2025');
    console.log('   Role: admin');
    console.log('   ID:', result.insertId);
    console.log('');
    console.log('🔐 Вход через:');
    console.log('   curl -X POST http://localhost:3000/api/auth/login \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"username":"admin","password":"Admin2025"}\'');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('💡 Проверьте:');
      console.log('   1. MySQL запущен: sudo systemctl status mysql');
      console.log('   2. Параметры подключения в .env файле');
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('');
      console.log('💡 Таблицы не созданы. Выполните:');
      console.log('   npm run db:migrate');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('');
      console.log('✅ Соединение закрыто');
    }
  }
}

// Запуск
createTestUser();
