-- ============================================
-- Миграция: Добавление разрешения engineering
-- Дата: 2026-03-12
-- Описание: Добавляет доступ к инженерному разделу
-- ============================================

-- Информация о текущих правах admin
SELECT name, permissions 
FROM roles 
WHERE name = 'admin';

-- Информация о текущих правах security
SELECT name, permissions 
FROM roles 
WHERE name = 'security';

-- ============================================
-- ВАЖНО! Выполните следующие команды ТОЛЬКО если
-- разрешение 'engineering' еще НЕ добавлено
-- ============================================

-- Добавление разрешения engineering для роли admin
-- ВНИМАНИЕ: Замените '[...текущие права...]' на актуальный список
UPDATE roles 
SET permissions = JSON_ARRAY_APPEND(permissions, '$', 'engineering')
WHERE name = 'admin' 
  AND NOT JSON_CONTAINS(permissions, '"engineering"', '$');

-- Добавление разрешения engineering для роли security
-- ВНИМАНИЕ: Замените '[...текущие права...]' на актуальный список
UPDATE roles 
SET permissions = JSON_ARRAY_APPEND(permissions, '$', 'engineering')
WHERE name = 'security' 
  AND NOT JSON_CONTAINS(permissions, '"engineering"', '$');

-- ============================================
-- Проверка результата
-- ============================================

-- Проверяем что разрешение добавлено для admin
SELECT 
  name,
  permissions,
  JSON_CONTAINS(permissions, '"engineering"', '$') AS has_engineering
FROM roles 
WHERE name = 'admin';

-- Проверяем что разрешение добавлено для security
SELECT 
  name,
  permissions,
  JSON_CONTAINS(permissions, '"engineering"', '$') AS has_engineering
FROM roles 
WHERE name = 'security';

-- ============================================
-- Откат миграции (если нужно)
-- ============================================

-- Удаление разрешения engineering для admin
-- UPDATE roles 
-- SET permissions = JSON_REMOVE(
--   permissions, 
--   REPLACE(JSON_SEARCH(permissions, 'one', 'engineering'), '"', '')
-- )
-- WHERE name = 'admin';

-- Удаление разрешения engineering для security
-- UPDATE roles 
-- SET permissions = JSON_REMOVE(
--   permissions, 
--   REPLACE(JSON_SEARCH(permissions, 'one', 'engineering'), '"', '')
-- )
-- WHERE name = 'security';

-- ============================================
-- Финальная проверка всех ролей
-- ============================================

SELECT 
  name,
  JSON_LENGTH(permissions) AS total_permissions,
  JSON_CONTAINS(permissions, '"engineering"', '$') AS has_engineering,
  permissions
FROM roles
ORDER BY name;

-- ============================================
-- Конец миграции
-- ============================================
