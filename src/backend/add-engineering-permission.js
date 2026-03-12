/**
 * Скрипт для добавления разрешения 'engineering' (Инженерный раздел)
 * 
 * Запуск: node backend/add-engineering-permission.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function addEngineeringPermission() {
  let connection;

  try {
    // Подключение к БД
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'security_system'
    });

    console.log('✅ Подключение к БД установлено');

    // ========================================
    // 1. Обновление роли ADMIN
    // ========================================
    const [adminRole] = await connection.query(
      'SELECT permissions FROM roles WHERE name = ?',
      ['admin']
    );

    if (adminRole.length === 0) {
      console.error('❌ Роль admin не найдена');
      return;
    }

    let adminPermissions = [];
    try {
      adminPermissions = JSON.parse(adminRole[0].permissions);
    } catch (e) {
      console.error('❌ Ошибка парсинга прав admin:', e);
      return;
    }

    if (adminPermissions.includes('engineering')) {
      console.log('ℹ️  Право engineering уже существует для роли admin');
    } else {
      adminPermissions.push('engineering');
      
      await connection.query(
        'UPDATE roles SET permissions = ? WHERE name = ?',
        [JSON.stringify(adminPermissions), 'admin']
      );

      console.log('✅ Право engineering добавлено для роли admin');
    }

    // ========================================
    // 2. Обновление роли SECURITY
    // ========================================
    const [securityRole] = await connection.query(
      'SELECT permissions FROM roles WHERE name = ?',
      ['security']
    );

    if (securityRole.length === 0) {
      console.warn('⚠️  Роль security не найдена, пропускаем');
    } else {
      let securityPermissions = [];
      try {
        securityPermissions = JSON.parse(securityRole[0].permissions);
      } catch (e) {
        console.error('❌ Ошибка парсинга прав security:', e);
        return;
      }

      if (securityPermissions.includes('engineering')) {
        console.log('ℹ️  Право engineering уже существует для роли security');
      } else {
        securityPermissions.push('engineering');
        
        await connection.query(
          'UPDATE roles SET permissions = ? WHERE name = ?',
          [JSON.stringify(securityPermissions), 'security']
        );

        console.log('✅ Право engineering добавлено для роли security');
      }
    }

    // ========================================
    // 3. Вывод текущего состояния
    // ========================================
    console.log('\n📊 Текущее состояние ролей:');
    
    const [allRoles] = await connection.query('SELECT name, permissions FROM roles');
    
    allRoles.forEach(role => {
      const permissions = JSON.parse(role.permissions);
      const hasEngineering = permissions.includes('engineering');
      console.log(`\n${role.name}:`);
      console.log(`  - Всего прав: ${permissions.length}`);
      console.log(`  - engineering: ${hasEngineering ? '✅' : '❌'}`);
      if (hasEngineering) {
        console.log(`  - Все права: ${permissions.join(', ')}`);
      }
    });

    console.log('\n✅ Миграция завершена успешно!');
    console.log('\nℹ️  Доступ к инженерному разделу теперь имеют роли: admin, security');

  } catch (error) {
    console.error('❌ Ошибка выполнения миграции:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Соединение с БД закрыто');
    }
  }
}

// Запуск миграции
addEngineeringPermission()
  .then(() => {
    console.log('\n✨ Готово! Перезапустите backend сервер.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Критическая ошибка:', error);
    process.exit(1);
  });
