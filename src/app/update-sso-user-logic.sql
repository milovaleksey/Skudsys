-- Скрипт для добавления external_groups в роли для SSO маппинга

-- 1. Проверим текущую структуру таблицы roles
DESCRIBE roles;

-- 2. Если поле external_groups уже есть, можно добавить группы AD для ролей
-- Примеры маппинга групп AD на роли:

-- Администраторы
UPDATE roles
SET external_groups = JSON_ARRAY(
  'CN=DL-MSCADA-Role-Engineer,OU=Scada,OU=t1,OU=Servers,DC=utmn,DC=ru',
  'CN=DL-Grp-Booco-CIT,OU=BOOCO,OU=t1,OU=Servers,DC=utmn,DC=ru'
)
WHERE name = 'admin';

-- Безопасность (security)
UPDATE roles
SET external_groups = JSON_ARRAY(
  'CN=DL-Grp-Booco-Staff,OU=BOOCO,OU=t1,OU=Servers,DC=utmn,DC=ru',
  'CN=DL-Grp-SRV_SCUD01-RDP,OU=SCUD,OU=t1,OU=Servers,DC=utmn,DC=ru',
  'CN=DL-Grp-SRV_SCUD02-RDP,OU=SCUD,OU=t1,OU=Servers,DC=utmn,DC=ru',
  'CN=DL-Grp-SRV_SCUD03-RDP,OU=SCUD,OU=t1,OU=Servers,DC=utmn,DC=ru'
)
WHERE name = 'security';

-- Операторы
UPDATE roles
SET external_groups = JSON_ARRAY(
  'CN=DL-MSCADA-Role-Operator,OU=Scada,OU=t1,OU=Servers,DC=utmn,DC=ru'
)
WHERE name = 'operator';

-- Менеджеры (для аналитики и отчетов)
UPDATE roles
SET external_groups = JSON_ARRAY(
  'CN=DL-Grp-Analytics,OU=Groups,DC=utmn,DC=ru'
)
WHERE name = 'manager';

-- 3. Проверим что сохранилось
SELECT id, name, display_name, external_groups
FROM roles
ORDER BY is_system DESC, name;
