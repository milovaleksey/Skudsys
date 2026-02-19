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
    const [roles] = await connection.query('SELECT * FROM roles WHERE name = ?', ['admin']);
    
    if (roles.length > 0) {
      const adminRole = roles[0];
      let permissions = [];
      
      try {
        if (typeof adminRole.permissions === 'string') {
          permissions = JSON.parse(adminRole.permissions);
        } else if (Array.isArray(adminRole.permissions)) {
          permissions = adminRole.permissions;
        }
      } catch (e) {
        console.error('Ошибка парсинга прав admin:', e);
        permissions = [];
      }

      if (!permissions.includes('user-logs')) {
        permissions.push('user-logs');
        await connection.query('UPDATE roles SET permissions = ? WHERE id = ?', [JSON.stringify(permissions), adminRole.id]);
        console.log('✅ Добавлено право user-logs для роли admin');
      }
    }

    // Update Security role
    const [secRoles] = await connection.query('SELECT * FROM roles WHERE name = ?', ['security']);
    if (secRoles.length > 0) {
      const secRole = secRoles[0];
      let secPerms = [];
      try {
        secPerms = typeof secRole.permissions === 'string' ? JSON.parse(secRole.permissions) : secRole.permissions;
      } catch (e) { secPerms = []; }
      
      if (!secPerms.includes('user-logs')) {
        secPerms.push('user-logs');
        await connection.query('UPDATE roles SET permissions = ? WHERE id = ?', [JSON.stringify(secPerms), secRole.id]);
        console.log('✅ Добавлено право user-logs для роли security');
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
