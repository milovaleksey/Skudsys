# Автоматическое назначение ролей по группам AD и обновление данных при SSO входе

## 1. Настройка групп AD в таблице roles

Выполните SQL скрипт на сервере:

```bash
mysql -u root -p utmn_security
```

```sql
-- Добавьте группы AD для каждой роли

-- Администраторы (полный доступ)
UPDATE roles
SET external_groups = JSON_ARRAY(
  'CN=DL-MSCADA-Role-Engineer,OU=Scada,OU=t1,OU=Servers,DC=utmn,DC=ru',
  'CN=DL-Grp-Booco-CIT,OU=BOOCO,OU=t1,OU=Servers,DC=utmn,DC=ru'
)
WHERE name = 'admin';

-- Безопасность (доступ к СКУД)
UPDATE roles
SET external_groups = JSON_ARRAY(
  'CN=DL-Grp-Booco-Staff,OU=BOOCO,OU=t1,OU=Servers,DC=utmn,DC=ru',
  'CN=DL-Grp-SRV_SCUD01-RDP,OU=SCUD,OU=t1,OU=Servers,DC=utmn,DC=ru',
  'CN=DL-Grp-SRV_SCUD02-RDP,OU=SCUD,OU=t1,OU=Servers,DC=utmn,DC=ru'
)
WHERE name = 'security';

-- Операторы
UPDATE roles
SET external_groups = JSON_ARRAY(
  'CN=DL-MSCADA-Role-Operator,OU=Scada,OU=t1,OU=Servers,DC=utmn,DC=ru'
)
WHERE name = 'operator';

-- Менеджеры (аналитика и отчеты)
UPDATE roles
SET external_groups = JSON_ARRAY(
  'CN=DL-Grp-Analytics,OU=Groups,DC=utmn,DC=ru'
)
WHERE name = 'manager';

-- Проверка
SELECT id, name, display_name, external_groups
FROM roles
ORDER BY is_system DESC, name;
```

## 2. Обновление auth.controller.js

В файле `/opt/utmn-security/src/app/backend/src/controllers/auth.controller.js`

Найдите метод `oidcCallback` и замените код после получения `userinfo` на:

```javascript
async oidcCallback(req, res) {
  try {
    const { code, state } = req.query;

    // ... существующий код получения токенов и userinfo ...

    // ==========================================
    // НАЧАЛО НОВОЙ ЛОГИКИ
    // ==========================================

    const username = userinfo.email.split('@')[0];
    const pool = getPool();

    // 1. Получаем все роли из БД с external_groups
    const [roles] = await pool.query(
      'SELECT id, name, display_name, external_groups FROM roles'
    );

    console.log('📋 Загружено ролей из БД:', roles.length);

    // 2. Определяем роль пользователя по группам AD
    let userRole = 'viewer'; // Роль по умолчанию
    let assignedByGroup = null;

    if (userinfo.memberOf && Array.isArray(userinfo.memberOf)) {
      console.log('🔍 Проверка групп AD пользователя...');

      // Проходим по всем ролям
      for (const role of roles) {
        // Парсим external_groups (это JSON в БД)
        let externalGroups = [];
        try {
          if (role.external_groups) {
            externalGroups = typeof role.external_groups === 'string'
              ? JSON.parse(role.external_groups)
              : role.external_groups;
          }
        } catch (e) {
          console.error(`Ошибка парсинга external_groups для роли ${role.name}:`, e);
          continue;
        }

        // Если у роли нет групп - пропускаем
        if (!externalGroups || externalGroups.length === 0) {
          continue;
        }

        // Проверяем есть ли совпадения
        for (const adGroup of userinfo.memberOf) {
          if (externalGroups.includes(adGroup)) {
            userRole = role.name;
            assignedByGroup = adGroup;
            console.log(`✅ Найдено совпадение: группа "${adGroup}" → роль "${role.display_name}"`);
            break;
          }
        }

        if (assignedByGroup) break; // Нашли роль, выходим
      }
    }

    if (!assignedByGroup) {
      console.log(`⚠️ Группы AD не совпали, назначена роль по умолчанию: ${userRole}`);
    } else {
      console.log(`✅ Роль определена по группе AD: ${userRole} (${assignedByGroup})`);
    }

    // 3. Проверяем существует ли пользователь
    const [existingUsers] = await pool.query(
      'SELECT id, username, full_name, email, role FROM users WHERE username = ?',
      [username]
    );

    let userId;

    if (existingUsers.length > 0) {
      // Пользователь существует - ОБНОВЛЯЕМ данные
      const existingUser = existingUsers[0];
      userId = existingUser.id;

      console.log(`👤 Пользователь ${username} уже существует, обновляем данные...`);

      // Обновляем full_name, email, role и last_login
      await pool.query(
        `UPDATE users
         SET full_name = ?,
             email = ?,
             role = ?,
             last_login = NOW()
         WHERE id = ?`,
        [userinfo.name || username, userinfo.email, userRole, userId]
      );

      console.log(`✅ Обновлены данные:`, {
        full_name: userinfo.name || username,
        email: userinfo.email,
        role: userRole
      });

    } else {
      // Пользователь новый - СОЗДАЕМ
      console.log(`➕ Создание нового SSO пользователя: ${username}`);

      const [result] = await pool.query(
        `INSERT INTO users (username, full_name, email, role, auth_type, is_active, created_at, last_login)
         VALUES (?, ?, ?, ?, 'sso', 1, NOW(), NOW())`,
        [username, userinfo.name || username, userinfo.email, userRole]
      );

      userId = result.insertId;
      console.log(`✅ Создан новый SSO пользователь ID ${userId}, роль: ${userRole}`);
    }

    // 4. Генерируем JWT токен
    const token = jwt.sign(
      { userId, username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId, username, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Перенаправляем на фронтенд с токенами
    const frontendUrl = process.env.FRONTEND_URL || 'https://report.utmn.ru';
    res.redirect(`${frontendUrl}?token=${token}&refresh=${refreshToken}`);

  } catch (error) {
    console.error('❌ Ошибка OIDC callback:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'OIDC_ERROR',
        message: 'Ошибка авторизации через SSO'
      }
    });
  }
}
```

## 3. Применение изменений

```bash
# Перезапустите backend
pm2 restart all

# Проверьте логи
pm2 logs utmn-backend --lines 100
```

## 4. Тестирование

1. Выйдите из системы
2. Войдите через SSO
3. В логах должно появиться:
```
📋 Загружено ролей из БД: 5
🔍 Проверка групп AD пользователя...
✅ Найдено совпадение: группа "CN=DL-MSCADA-Role-Engineer..." → роль "Администратор"
✅ Роль определена по группе AD: admin (CN=DL-MSCADA-Role-Engineer...)
👤 Пользователь a.s.milov уже существует, обновляем данные...
✅ Обновлены данные: { full_name: 'Милов Алексей Сергеевич', email: 'a.s.milov@utmn.ru', role: 'admin' }
```

## Что это дает:

✅ **Автоматическое назначение ролей** по группам Active Directory
✅ **Обновление ФИО** при каждом входе (если изменилось в AD)
✅ **Обновление email** при каждом входе
✅ **Обновление роли** если пользователя добавили/убрали из групп AD
✅ **Централизованное управление** - роли настраиваются в БД, не в коде
✅ **Роль по умолчанию** - если пользователь не в группах, получает роль `viewer`

## Дополнительно: Приоритет ролей

Если пользователь состоит в нескольких группах, будет назначена **первая найденная роль**.

Чтобы настроить приоритет, отсортируйте роли в БД или измените порядок проверки:

```javascript
// Сортировка ролей по приоритету (например, admin сначала)
const rolePriority = ['admin', 'security', 'manager', 'operator', 'viewer'];

const sortedRoles = roles.sort((a, b) => {
  const priorityA = rolePriority.indexOf(a.name);
  const priorityB = rolePriority.indexOf(b.name);
  return priorityA - priorityB;
});

// Используйте sortedRoles вместо roles
```
