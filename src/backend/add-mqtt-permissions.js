/**
 * Скрипт для добавления прав доступа MQTT
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function addMQTTPermissions() {
  let connection;

  try {
    // Подключение к базе данных
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'utmn_security'
    });

    console.log('✅ Подключено к MySQL');

    // Получаем текущие права для роли admin
    const [adminRole] = await connection.query(
      'SELECT permissions FROM roles WHERE name = ?',
      ['admin']
    );

    if (adminRole.length === 0) {
      console.error('❌ Роль admin не найдена');
      return;
    }

    // Парсим текущие права
    let permissions = [];
    try {
      permissions = JSON.parse(adminRole[0].permissions);
    } catch (e) {
      console.error('❌ Ошибка парсинга прав:', e);
      return;
    }

    // Проверяем, есть ли уже право mqtt-publish
    if (permissions.includes('mqtt-publish')) {
      console.log('ℹ️  Право mqtt-publish уже существует для роли admin');
    } else {
      // Добавляем новое право
      permissions.push('mqtt-publish');
      
      // Обновляем права
      await connection.query(
        'UPDATE roles SET permissions = ? WHERE name = ?',
        [JSON.stringify(permissions), 'admin']
      );

      console.log('✅ Право mqtt-publish добавлено для роли admin');
    }

    // Получаем текущие права для роли security
    const [securityRole] = await connection.query(
      'SELECT permissions FROM roles WHERE name = ?',
      ['security']
    );

    if (securityRole.length > 0) {
      let securityPermissions = [];
      try {
        securityPermissions = JSON.parse(securityRole[0].permissions);
      } catch (e) {
        console.error('❌ Ошибка парсинга прав для security:', e);
        return;
      }

      if (!securityPermissions.includes('mqtt-publish')) {
        securityPermissions.push('mqtt-publish');
        
        await connection.query(
          'UPDATE roles SET permissions = ? WHERE name = ?',
          [JSON.stringify(securityPermissions), 'security']
        );

        console.log('✅ Право mqtt-publish добавлено для роли security');
      } else {
        console.log('ℹ️  Право mqtt-publish уже существует для роли security');
      }
    }

    console.log('\n✅ Все права доступа MQTT успешно обновлены!');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Подключение к БД закрыто');
    }
  }
}

// Запуск скрипта
addMQTTPermissions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Критическая ошибка:', error);
    process.exit(1);
  });
