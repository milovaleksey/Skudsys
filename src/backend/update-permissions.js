require('dotenv').config();
const mysql = require('mysql2/promise');

async function updatePermissions() {
  console.log('🔄 Обновление прав доступа для роли admin...');

  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  };

  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Подключение успешно');

    // Находим роль admin
    const [roles] = await connection.query('SELECT * FROM roles WHERE name = ?', ['admin']);
    
    if (roles.length === 0) {
      console.error('❌ Роль admin не найдена!');
      return;
    }

    const adminRole = roles[0];
    let permissions = [];
    
    // Парсим текущие права
    try {
      if (typeof adminRole.permissions === 'string') {
        permissions = JSON.parse(adminRole.permissions);
      } else if (Array.isArray(adminRole.permissions)) {
        permissions = adminRole.permissions;
      }
    } catch (e) {
      console.error('Ошибка парсинга прав:', e);
      permissions = [];
    }

    console.log('Текущие права admin:', permissions);

    // Добавляем новое право 'user-logs' если его нет
    if (!permissions.includes('user-logs')) {
      permissions.push('user-logs');
      console.log('➕ Добавлено право: user-logs');
      
      // Обновляем в БД
      await connection.query('UPDATE roles SET permissions = ? WHERE id = ?', [JSON.stringify(permissions), adminRole.id]);
      console.log('✅ Права роли admin успешно обновлены');
    } else {
      console.log('ℹ️ Право user-logs уже есть у роли admin');
    }

    // Также проверим роль security
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
        console.log('✅ Права роли security успешно обновлены');
      }
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

module.exports = updatePermissions;

if (require.main === module) {
  updatePermissions();
}
