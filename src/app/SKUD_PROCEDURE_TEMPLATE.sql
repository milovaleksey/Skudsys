-- ============================================
-- Хранимая процедура: sp_search_person_by_identifier
-- База данных: perco (СКУД)
-- Назначение: Поиск человека по идентификатору карты
-- ============================================

USE perco;

DROP PROCEDURE IF EXISTS sp_search_person_by_identifier;

DELIMITER $$

CREATE PROCEDURE sp_search_person_by_identifier(IN p_identifier INT)
BEGIN
    /*
     * Поиск по идентификатору карты (целое число)
     * 
     * Параметры:
     *   p_identifier (INT) - Идентификатор карты (например: 1446738, 76, 76012345)
     * 
     * Возвращает:
     *   - person_id: ID человека
     *   - full_name: ФИО
     *   - email/upn: Email
     *   - department: Подразделение
     *   - position: Должность
     *   - card_number: Номер карты
     *   - identifier: Идентификатор
     *   - person_type: Тип (employee, student, teacher)
     *   - last_seen: Последний проход (дата/время)
     *   - last_location: Место последнего прохода
     *   - is_active: Активен ли (1/0)
     */
    
    SELECT 
        -- Информация о человеке
        p.id AS person_id,
        p.full_name,
        p.upn AS email,
        p.dept_name AS department,
        p.job_title AS position,
        
        -- Информация о карте
        c.code AS card_number,
        c.id AS identifier,
        
        -- Тип человека (адаптируйте под вашу логику)
        CASE 
            WHEN p.dept_name LIKE '%студент%' OR p.dept_name LIKE '%student%' THEN 'student'
            WHEN p.dept_name LIKE '%преподаватель%' OR p.dept_name LIKE '%teacher%' THEN 'teacher'
            WHEN p.dept_name LIKE '%сотрудник%' OR p.dept_name LIKE '%employee%' THEN 'employee'
            ELSE 'employee'
        END AS person_type,
        
        -- Последний проход
        e.event_time AS last_seen,
        ap.name AS last_location,
        
        -- Статус
        CASE 
            WHEN p.is_deleted = 0 AND c.is_deleted = 0 THEN 1
            ELSE 0
        END AS is_active
        
    FROM 
        people p
        
    -- Присоединяем карты/идентификаторы
    LEFT JOIN 
        identifiers c ON p.id = c.owner_id
        
    -- Последний проход человека
    LEFT JOIN (
        SELECT 
            owner_id,
            event_time,
            access_point_id
        FROM events
        WHERE 
            owner_id IS NOT NULL
            AND event_time IS NOT NULL
        ORDER BY event_time DESC
        LIMIT 1
    ) e ON p.id = e.owner_id
    
    -- Точка доступа последнего прохода
    LEFT JOIN 
        access_points ap ON e.access_point_id = ap.id
        
    WHERE 
        -- Поиск по коду карты или ID идентификатора
        (c.code = p_identifier OR c.id = p_identifier)
        -- Только не удалённые записи
        AND p.is_deleted = 0
        AND c.is_deleted = 0
        
    LIMIT 1;
    
END$$

DELIMITER ;

-- ============================================
-- ТЕСТИРОВАНИЕ
-- ============================================

-- Пример вызова:
-- CALL sp_search_person_by_identifier(1446738);

-- Проверка создания:
-- SHOW PROCEDURE STATUS WHERE Db = 'perco' AND Name = 'sp_search_person_by_identifier';

-- ============================================
-- АДАПТАЦИЯ ПОД ВАШУ СХЕМУ
-- ============================================

/*
 * ВАЖНО! Эта процедура - ШАБЛОН.
 * Вам нужно адаптировать её под вашу реальную схему базы данных.
 * 
 * 1. ЗАМЕНИТЕ ИМЕНА ТАБЛИЦ:
 *    - people         → ваша таблица с людьми
 *    - identifiers    → ваша таблица с картами/идентификаторами
 *    - events         → ваша таблица с событиями/проходами
 *    - access_points  → ваша таблица с точками доступа
 * 
 * 2. ЗАМЕНИТЕ ИМЕНА КОЛОНОК:
 *    Людей:
 *      - p.id              → ID человека
 *      - p.full_name       → ФИО
 *      - p.upn             → Email/UPN
 *      - p.dept_name       → Название подразделения
 *      - p.job_title       → Должность
 *      - p.is_deleted      → Флаг удаления (0 = активен, 1 = удалён)
 *    
 *    Карты/идентификаторы:
 *      - c.id              → ID идентификатора
 *      - c.code            → Номер карты (целое число)
 *      - c.owner_id        → ID владельца (ссылка на p.id)
 *      - c.is_deleted      → Флаг удаления
 *    
 *    События/проходы:
 *      - e.owner_id        → ID человека (ссылка на p.id)
 *      - e.event_time      → Время события
 *      - e.access_point_id → ID точки доступа
 *    
 *    Точки доступа:
 *      - ap.id             → ID точки доступа
 *      - ap.name           → Название точки доступа
 * 
 * 3. ЛОГИКА ОПРЕДЕЛЕНИЯ ТИПА ЧЕЛОВЕКА:
 *    Измените CASE в зависимости от вашей логики:
 *    
 *    Вариант 1: По названию подразделения
 *      CASE 
 *          WHEN p.dept_name LIKE '%студент%' THEN 'student'
 *          WHEN p.dept_name LIKE '%преподаватель%' THEN 'teacher'
 *          ELSE 'employee'
 *      END
 *    
 *    Вариант 2: По полю person_type (если есть)
 *      p.person_type AS person_type
 *    
 *    Вариант 3: По связанной таблице
 *      pt.name AS person_type
 *      LEFT JOIN person_types pt ON p.person_type_id = pt.id
 * 
 * 4. ФЛАГИ АКТИВНОСТИ:
 *    Если у вас другие поля для определения активности:
 *      - p.status = 'active'
 *      - p.enabled = 1
 *      - p.valid_from <= NOW() AND p.valid_to >= NOW()
 * 
 * 5. ПОСЛЕДНИЙ ПРОХОД:
 *    Если нужна другая логика выборки последнего прохода:
 *      - По конкретному типу события (WHERE event_type = 'access')
 *      - За определённый период (WHERE event_time >= DATE_SUB(NOW(), INTERVAL 30 DAY))
 */

-- ============================================
-- ПРИМЕРЫ ВОЗМОЖНЫХ СХЕМ
-- ============================================

/*
 * ПРИМЕР 1: Простая схема
 * 
 * Таблицы:
 *   - users (id, name, email)
 *   - cards (id, number, user_id)
 *   - access_log (id, card_id, timestamp, location)
 * 
 * Процедура:
 *   SELECT 
 *     u.id, u.name, u.email,
 *     c.number AS card_number,
 *     al.timestamp AS last_seen,
 *     al.location
 *   FROM users u
 *   JOIN cards c ON u.id = c.user_id
 *   LEFT JOIN (
 *     SELECT card_id, timestamp, location
 *     FROM access_log
 *     ORDER BY timestamp DESC
 *     LIMIT 1
 *   ) al ON c.id = al.card_id
 *   WHERE c.number = p_identifier;
 */

/*
 * ПРИМЕР 2: Сложная схема с типами
 * 
 * Таблицы:
 *   - persons (id, full_name, email, person_type_id)
 *   - person_types (id, name: 'student', 'teacher', 'employee')
 *   - credentials (id, code, person_id, credential_type_id)
 *   - credential_types (id, name: 'card', 'fingerprint')
 *   - access_events (id, credential_id, event_time, reader_id)
 *   - readers (id, name, location)
 * 
 * Процедура:
 *   SELECT 
 *     p.id, p.full_name, p.email,
 *     pt.name AS person_type,
 *     cr.code AS card_number,
 *     ae.event_time AS last_seen,
 *     r.location AS last_location
 *   FROM persons p
 *   JOIN person_types pt ON p.person_type_id = pt.id
 *   JOIN credentials cr ON p.id = cr.person_id
 *   LEFT JOIN (
 *     SELECT credential_id, event_time, reader_id
 *     FROM access_events
 *     ORDER BY event_time DESC
 *     LIMIT 1
 *   ) ae ON cr.id = ae.credential_id
 *   LEFT JOIN readers r ON ae.reader_id = r.id
 *   WHERE cr.code = p_identifier
 *     AND cr.credential_type_id = (SELECT id FROM credential_types WHERE name = 'card');
 */

-- ============================================
-- ОТЛАДКА
-- ============================================

-- Если процедура не возвращает результаты, проверьте:

-- 1. Существует ли идентификатор в таблице?
SELECT * FROM identifiers WHERE code = 1446738 OR id = 1446738;

-- 2. Есть ли связь с человеком?
SELECT 
    i.id, i.code, i.owner_id,
    p.id, p.full_name
FROM identifiers i
LEFT JOIN people p ON i.owner_id = p.id
WHERE i.code = 1446738 OR i.id = 1446738;

-- 3. Проверьте флаги удаления:
SELECT 
    i.code, i.is_deleted AS card_deleted,
    p.full_name, p.is_deleted AS person_deleted
FROM identifiers i
JOIN people p ON i.owner_id = p.id
WHERE i.code = 1446738;

-- 4. Посмотрите последние события:
SELECT 
    e.owner_id, e.event_time, e.access_point_id,
    p.full_name,
    ap.name AS access_point
FROM events e
JOIN people p ON e.owner_id = p.id
LEFT JOIN access_points ap ON e.access_point_id = ap.id
WHERE e.owner_id = (SELECT owner_id FROM identifiers WHERE code = 1446738)
ORDER BY e.event_time DESC
LIMIT 5;
