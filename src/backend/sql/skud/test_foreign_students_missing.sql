-- =====================================================
-- Тестовые данные для шаблона "Пропавшие студенты"
-- =====================================================

-- Примечание: Эти запросы помогут создать тестовые данные
-- если в вашей базе еще нет достаточного количества записей

-- =====================================================
-- 1. Проверка существующих данных
-- =====================================================

-- Сколько иностранных студентов в системе?
SELECT 
    pc.country_name,
    COUNT(*) as student_count
FROM persons p
LEFT JOIN person_countries pc ON p.country_id = pc.id
WHERE p.person_type = 'student'
  AND pc.country_code != 'RU'
  AND pc.country_name != 'РОССИЯ'
GROUP BY pc.country_name
ORDER BY student_count DESC;

-- Последние визиты иностранных студентов
SELECT 
    CONCAT_WS(' ', p.last_name, p.first_name, p.middle_name) AS fio,
    p.upn,
    pc.country_name,
    MAX(e.event_time) AS last_visit,
    DATEDIFF(NOW(), MAX(e.event_time)) AS days_ago
FROM persons p
LEFT JOIN person_countries pc ON p.country_id = pc.id
LEFT JOIN events e ON p.id = e.person_id
WHERE p.person_type = 'student'
  AND pc.country_code != 'RU'
  AND pc.country_name != 'РОССИЯ'
GROUP BY p.id
HAVING days_ago IS NOT NULL
ORDER BY days_ago DESC
LIMIT 20;

-- =====================================================
-- 2. Тестовые запросы процедуры
-- =====================================================

-- Все страны, отсутствие более 3 дней
CALL sp_foreign_students_missing('all', 3);

-- Все страны, отсутствие более 7 дней (критические)
CALL sp_foreign_students_missing('all', 7);

-- Конкретная страна: Казахстан, >3 дней
CALL sp_foreign_students_missing('КАЗАХСТАН', 3);

-- Конкретная страна: Узбекистан, >5 дней
CALL sp_foreign_students_missing('УЗБЕКИСТАН', 5);

-- Все страны, отсутствие более 30 дней (долгое отсутствие)
CALL sp_foreign_students_missing('all', 30);

-- =====================================================
-- 3. Создание тестовых данных (опционально)
-- =====================================================

-- ВНИМАНИЕ: Используйте только для тестирования!
-- Не запускайте на production базе!

-- Вставка тестовых стран (если их нет)
INSERT IGNORE INTO person_countries (country_code, country_name) VALUES
    ('KZ', 'КАЗАХСТАН'),
    ('UZ', 'УЗБЕКИСТАН'),
    ('TJ', 'ТАДЖИКИСТАН'),
    ('KG', 'КИРГИЗИЯ'),
    ('TM', 'ТУРКМЕНИСТАН'),
    ('AZ', 'АЗЕРБАЙДЖАН'),
    ('AM', 'АРМЕНИЯ'),
    ('CN', 'КИТАЙ'),
    ('IN', 'ИНДИЯ'),
    ('VN', 'ВЬЕТНАМ');

-- Примеры тестовых иностранных студентов
-- ЗАМЕНИТЕ значения на реальные из вашей базы!

-- Студент с последним визитом 5 дней назад
INSERT INTO events (person_id, event_time, access_point_id, event_type)
VALUES (
    (SELECT id FROM persons WHERE upn = 'stud0123456789@study.utmn.ru' LIMIT 1),
    DATE_SUB(NOW(), INTERVAL 5 DAY),
    (SELECT id FROM access_points LIMIT 1),
    'entry'
);

-- Студент с последним визитом 10 дней назад
INSERT INTO events (person_id, event_time, access_point_id, event_type)
VALUES (
    (SELECT id FROM persons WHERE upn = 'foreign.student@study.utmn.ru' LIMIT 1),
    DATE_SUB(NOW(), INTERVAL 10 DAY),
    (SELECT id FROM access_points LIMIT 1),
    'entry'
);

-- =====================================================
-- 4. Проверка прав доступа
-- =====================================================

-- Проверка что процедура существует
SHOW PROCEDURE STATUS WHERE Name = 'sp_foreign_students_missing';

-- Проверка прав пользователя
SHOW GRANTS FOR 'skud_app'@'%';
SHOW GRANTS FOR 'skud_app'@'localhost';

-- =====================================================
-- 5. Анализ результатов
-- =====================================================

-- Распределение по количеству дней отсутствия
SELECT 
    CASE 
        WHEN days_missing < 7 THEN '3-6 дней'
        WHEN days_missing < 14 THEN '7-13 дней'
        WHEN days_missing < 30 THEN '14-29 дней'
        ELSE '30+ дней'
    END AS absence_range,
    COUNT(*) as student_count
FROM (
    SELECT 
        p.id,
        DATEDIFF(NOW(), MAX(e.event_time)) AS days_missing
    FROM persons p
    LEFT JOIN person_countries pc ON p.country_id = pc.id
    LEFT JOIN events e ON p.id = e.person_id
    WHERE p.person_type = 'student'
      AND pc.country_code != 'RU'
      AND pc.country_name != 'РОССИЯ'
    GROUP BY p.id
    HAVING days_missing >= 3
) AS subquery
GROUP BY absence_range
ORDER BY 
    CASE absence_range
        WHEN '3-6 дней' THEN 1
        WHEN '7-13 дней' THEN 2
        WHEN '14-29 дней' THEN 3
        WHEN '30+ дней' THEN 4
    END;

-- Топ-5 стран по количеству пропавших студентов (>3 дней)
SELECT 
    pc.country_name,
    COUNT(*) as missing_count
FROM persons p
LEFT JOIN person_countries pc ON p.country_id = pc.id
LEFT JOIN events e ON p.id = e.person_id
WHERE p.person_type = 'student'
  AND pc.country_code != 'RU'
  AND pc.country_name != 'РОССИЯ'
GROUP BY p.id, pc.country_name
HAVING DATEDIFF(NOW(), MAX(e.event_time)) >= 3
ORDER BY missing_count DESC
LIMIT 5;

-- =====================================================
-- 6. Отладка
-- =====================================================

-- Если процедура возвращает пустой результат, проверьте:

-- 1. Есть ли иностранные студенты?
SELECT COUNT(*) FROM persons p
LEFT JOIN person_countries pc ON p.country_id = pc.id
WHERE p.person_type = 'student'
  AND pc.country_code != 'RU';

-- 2. Есть ли у них события?
SELECT COUNT(*) FROM events e
INNER JOIN persons p ON e.person_id = p.id
LEFT JOIN person_countries pc ON p.country_id = pc.id
WHERE p.person_type = 'student'
  AND pc.country_code != 'RU';

-- 3. Какие есть точки доступа?
SELECT id, name FROM access_points LIMIT 10;

-- 4. Проверка связей
SELECT 
    p.id,
    p.upn,
    p.country_id,
    pc.country_name,
    COUNT(e.id) as event_count
FROM persons p
LEFT JOIN person_countries pc ON p.country_id = pc.id
LEFT JOIN events e ON p.id = e.person_id
WHERE p.person_type = 'student'
  AND pc.country_code != 'RU'
GROUP BY p.id
LIMIT 10;
