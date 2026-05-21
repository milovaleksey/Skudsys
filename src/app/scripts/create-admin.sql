-- =====================================================
-- Скрипт создания администратора для первого запуска
-- =====================================================

USE utmn_security_db;

-- 1. Создаём роль администратора (если не существует)
INSERT IGNORE INTO roles (name, display_name, description, permissions, is_system, created_at)
VALUES (
  'admin',
  'Администратор',
  'Полный доступ ко всем функциям системы',
  '["dashboard","dashboard-builder","passes","location","analytics","parking","storage","foreign-students","students","employees","users-settings","roles-settings","user-logs"]',
  1,
  NOW()
);

-- 2. Создаём остальные системные роли
INSERT IGNORE INTO roles (name, display_name, description, permissions, is_system, created_at)
VALUES
  ('security', 'Безопасность', 'Доступ к системам безопасности и контроля доступа', '["dashboard","passes","location","parking","storage"]', 1, NOW()),
  ('manager', 'Менеджер', 'Доступ к аналитике и отчетам', '["dashboard","analytics","students","employees","foreign-students"]', 1, NOW()),
  ('operator', 'Оператор', 'Доступ к просмотру и работе с данными', '["dashboard","passes","location","students","employees"]', 1, NOW()),
  ('viewer', 'Наблюдатель', 'Только просмотр общей информации', '["dashboard","analytics"]', 1, NOW());

-- 3. Создаём администратора
-- Пароль: admin123 (хеш bcrypt)
INSERT INTO users (username, full_name, email, password_hash, role_id, auth_type, is_active, created_at)
VALUES (
  'admin',
  'Администратор Системы',
  'admin@utmn.ru',
  '$2b$10$YourBcryptHashHere', -- Замените на реальный хеш!
  (SELECT id FROM roles WHERE name = 'admin' LIMIT 1),
  'local',
  1,
  NOW()
)
ON DUPLICATE KEY UPDATE
  full_name = 'Администратор Системы',
  email = 'admin@utmn.ru',
  is_active = 1;

-- 4. Проверяем созданных пользователей
SELECT 
  u.id,
  u.username,
  u.full_name,
  u.email,
  r.display_name as role,
  u.auth_type,
  u.is_active,
  u.created_at
FROM users u
JOIN roles r ON u.role_id = r.id
ORDER BY u.id;

-- =====================================================
-- Для создания нового пароля используйте Node.js:
-- node -e "console.log(require('bcrypt').hashSync('ваш_пароль', 10))"
-- =====================================================
