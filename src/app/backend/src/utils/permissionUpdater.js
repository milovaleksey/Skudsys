const mysql = require('mysql2/promise');
const { getPool } = require('../config/database');
require('dotenv').config();

/**
 * Updates permissions for roles in the database.
 * Adds 'user-logs' permission to 'admin' and 'security' roles if missing.
 */
async function updatePermissions() {
  console.log('🔄 Обновление прав доступа...');

  let connection;
  let usePool = false;

  try {
    // Try to use existing pool first
    try {
      const pool = getPool();
      if (pool) {
        connection = await pool.getConnection();
        usePool = true;
      }
    } catch (e) {
      // Pool not initialized, create standalone connection
      const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
      };
      connection = await mysql.createConnection(config);
    }

    if (!connection) {
      throw new Error('Не удалось установить соединение с БД');
    }

    // Update Admin role
    const [roles] = await connection.query('SELECT * FROM roles');
    
    for (const role of roles) {
      // Storage permission for admin, security, teacher, student
      const storageRoles = ['admin', 'security', 'teacher', 'student'];
      // user-logs only for admin and security
      const userLogsRoles = ['admin', 'security'];

      let permissions = [];
      try {
        if (typeof role.permissions === 'string') {
          // Handle potentially malformed JSON or single quotes
          const cleanJson = role.permissions.replace(/'/g, '"');
          permissions = JSON.parse(cleanJson);
        } else if (Array.isArray(role.permissions)) {
          permissions = role.permissions;
        }
      } catch (e) {
        console.warn(`⚠️ Сброс прав для роли ${role.name} из-за ошибки парсинга:`, e.message);
        permissions = [];
      }

      if (!Array.isArray(permissions)) permissions = [];

      let hasUpdates = false;

      // Add user-logs permission (only for admin and security)
      if (userLogsRoles.includes(role.name) && !permissions.includes('user-logs')) {
        permissions.push('user-logs');
        hasUpdates = true;
        console.log(`➕ Добавление user-logs к роли ${role.name}`);
      }

      // Add storage permission (for admin, security, teacher, student)
      if (storageRoles.includes(role.name) && !permissions.includes('storage')) {
        permissions.push('storage');
        hasUpdates = true;
        console.log(`➕ Добавление storage к роли ${role.name}`);
      }

      if (hasUpdates) {
        await connection.query(
          'UPDATE roles SET permissions = ? WHERE id = ?', 
          [JSON.stringify(permissions), role.id]
        );
        console.log(`✅ Права роли ${role.name} обновлены:`, permissions);
      } else if (storageRoles.includes(role.name) || userLogsRoles.includes(role.name)) {
        console.log(`ℹ️ Роль ${role.name} уже имеет все необходимые права:`, permissions);
      }
    }

  } catch (error) {
    console.error('❌ Ошибка обновления прав:', error.message);
  } finally {
    if (connection) {
      if (usePool) {
        connection.release();
      } else {
        await connection.end();
      }
    }
  }
}

module.exports = updatePermissions;

if (require.main === module) {
  updatePermissions();
}