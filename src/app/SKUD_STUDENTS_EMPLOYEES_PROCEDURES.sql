# ===================================
# SQL TEMPLATE: СТУДЕНТЫ И СОТРУДНИКИ
# ===================================
# 
# Данный файл содержит шаблоны хранимых процедур для получения отчетов по студентам и сотрудникам
# 
# ПРОЦЕДУРЫ:
# 1. sp_get_students_passes_by_fio   - Проходы студентов по ФИО
# 2. sp_get_students_passes_by_upn   - Проходы студентов по UPN
# 3. sp_get_employees_passes_by_fio  - Проходы сотрудников по ФИО
# 4. sp_get_employees_passes_by_upn  - Проходы сотрудников по UPN
#
# ===================================

-- ====================================================================
-- ПРОЦЕДУРА 1: Получение проходов СТУДЕНТОВ по ФИО
-- ====================================================================
-- Использование:
--   CALL sp_get_students_passes_by_fio('Петрова', 'Мария', 'Сергеевна', '2026-03-03 00:00:00', '2026-03-03 23:59:59');

DELIMITER //

DROP PROCEDURE IF EXISTS sp_get_students_passes_by_fio//

CREATE PROCEDURE sp_get_students_passes_by_fio(
    IN p_last_name VARCHAR(100),
    IN p_first_name VARCHAR(100),
    IN p_middle_name VARCHAR(100),
    IN p_date_from DATETIME,
    IN p_date_to DATETIME
)
BEGIN
    -- =====================================================
    -- АДАПТИРУЙТЕ ЭТОТ SELECT ПОД ВАШУ СТРУКТУРУ БАЗЫ ДАННЫХ
    -- =====================================================
    
    SELECT 
        -- ===== ОБЯЗАТЕЛЬНЫЕ ПОЛЯ =====
        
        -- ID записи о проходе (уникальный)
        al.id AS id,
        
        -- Время события (проход)
        -- Формат: YYYY-MM-DD HH:MM:SS
        al.event_time AS event_time,
        
        -- Полное ФИО человека
        CONCAT_WS(' ', p.last_name, p.first_name, p.middle_name) AS full_name,
        
        -- UPN/Email (например: petrova@study.utmn.ru)
        -- Может быть NULL
        p.upn AS upn,
        
        -- Номер карты СКУД (например: "0987654321")
        -- Может быть NULL
        c.card_number AS card_number,
        
        -- Название точки прохода (контрольной точки)
        -- Например: "Вход студенты, корпус Б"
        ap.name AS checkpoint_name,
        
        -- ===== ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ (опциональные) =====
        
        -- Название события (тип прохода)
        -- Например: "Вход разрешен", "Выход", "Доступ запрещен", "Проход по расписанию"
        -- Может быть NULL
        al.event_name AS event_name,
        
        -- Направление прохода: 'in' (вход) | 'out' (выход)
        al.direction AS direction,
        
        -- Здание/корпус
        ap.building AS building,
        
        -- Местоположение (детальное описание)
        ap.location AS location
        
    FROM access_logs al
    
    -- Присоединяем таблицу людей/персон
    LEFT JOIN persons p ON al.person_id = p.id
    
    -- Присоединяем таблицу карт
    LEFT JOIN cards c ON p.card_id = c.id
    
    -- Присоединяем таблицу точек доступа
    LEFT JOIN access_points ap ON al.access_point_id = ap.id
    
    WHERE 
        -- ===== ФИЛЬТР ПО ФИО =====
        p.last_name = p_last_name
        AND p.first_name = p_first_name
        AND (p.middle_name = p_middle_name OR (p.middle_name IS NULL AND p_middle_name = ''))
        
        -- ===== ФИЛЬТР ПО ДИАПАЗОНУ ДАТ =====
        AND al.event_time >= p_date_from
        AND al.event_time <= p_date_to
        
        -- ===== ФИЛЬТР ПО ТИПУ ЛИЦА: СТУДЕНТЫ =====
        -- ВАРИАНТ 1: Если есть поле person_type
        AND p.person_type = 'student'
        
        -- ВАРИАНТ 2: Если определяем по email (@study.utmn.ru)
        -- AND p.upn LIKE '%@study.%'
        
        -- ВАРИАНТ 3: Если есть отдельная таблица студентов
        -- AND EXISTS (SELECT 1 FROM students s WHERE s.person_id = p.id)
    
    -- Сортировка: новые события вверху
    ORDER BY al.event_time DESC;
    
    -- =====================================================
    -- КОНЕЦ АДАПТИРУЕМОЙ ЧАСТИ
    -- =====================================================
END//

DELIMITER ;


-- ====================================================================
-- ПРОЦЕДУРА 2: Получение проходов СТУДЕНТОВ по UPN (email)
-- ====================================================================
-- Использование:
--   CALL sp_get_students_passes_by_upn('petrova@study.utmn.ru', '2026-03-03 00:00:00', '2026-03-03 23:59:59');

DELIMITER //

DROP PROCEDURE IF EXISTS sp_get_students_passes_by_upn//

CREATE PROCEDURE sp_get_students_passes_by_upn(
    IN p_upn VARCHAR(255),
    IN p_date_from DATETIME,
    IN p_date_to DATETIME
)
BEGIN
    -- =====================================================
    -- АДАПТИРУЙТЕ ЭТОТ SELECT ПОД ВАШУ СТРУКТУРУ БАЗЫ ДАННЫХ
    -- =====================================================
    
    SELECT 
        -- ===== ОБЯЗАТЕЛЬНЫЕ ПОЛЯ =====
        
        al.id AS id,
        al.event_time AS event_time,
        CONCAT_WS(' ', p.last_name, p.first_name, p.middle_name) AS full_name,
        p.upn AS upn,
        c.card_number AS card_number,
        ap.name AS checkpoint_name,
        
        -- ===== ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ =====
        
        al.event_name AS event_name,
        al.direction AS direction,
        ap.building AS building,
        ap.location AS location
        
    FROM access_logs al
    LEFT JOIN persons p ON al.person_id = p.id
    LEFT JOIN cards c ON p.card_id = c.id
    LEFT JOIN access_points ap ON al.access_point_id = ap.id
    
    WHERE 
        -- ===== ФИЛЬТР ПО UPN =====
        p.upn = p_upn
        
        -- ===== ФИЛЬТР ПО ДИАПАЗОНУ ДАТ =====
        AND al.event_time >= p_date_from
        AND al.event_time <= p_date_to
        
        -- ===== ФИЛЬТР ПО ТИПУ ЛИЦА: СТУДЕНТЫ =====
        -- ВАРИАНТ 1: Если есть поле person_type
        AND p.person_type = 'student'
        
        -- ВАРИАНТ 2: Если определяем по email (@study.utmn.ru)
        -- AND p.upn LIKE '%@study.%'
        
        -- ВАРИАНТ 3: Если есть отдельная таблица студентов
        -- AND EXISTS (SELECT 1 FROM students s WHERE s.person_id = p.id)
    
    ORDER BY al.event_time DESC;
    
    -- =====================================================
    -- КОНЕЦ АДАПТИРУЕМОЙ ЧАСТИ
    -- =====================================================
END//

DELIMITER ;


-- ====================================================================
-- ПРОЦЕДУРА 3: Получение проходов СОТРУДНИКОВ по ФИО
-- ====================================================================
-- Использование:
--   CALL sp_get_employees_passes_by_fio('Милов', 'Алексей', 'Сергеевич', '2026-03-03 00:00:00', '2026-03-03 23:59:59');

DELIMITER //

DROP PROCEDURE IF EXISTS sp_get_employees_passes_by_fio//

CREATE PROCEDURE sp_get_employees_passes_by_fio(
    IN p_last_name VARCHAR(100),
    IN p_first_name VARCHAR(100),
    IN p_middle_name VARCHAR(100),
    IN p_date_from DATETIME,
    IN p_date_to DATETIME
)
BEGIN
    -- =====================================================
    -- АДАПТИРУЙТЕ ЭТОТ SELECT ПОД ВАШУ СТРУКТУРУ БАЗЫ ДАННЫХ
    -- =====================================================
    
    SELECT 
        -- ===== ОБЯЗАТЕЛЬНЫЕ ПОЛЯ =====
        
        al.id AS id,
        al.event_time AS event_time,
        CONCAT_WS(' ', p.last_name, p.first_name, p.middle_name) AS full_name,
        p.upn AS upn,
        c.card_number AS card_number,
        ap.name AS checkpoint_name,
        
        -- ===== ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ =====
        
        al.event_name AS event_name,
        al.direction AS direction,
        ap.building AS building,
        ap.location AS location
        
    FROM access_logs al
    LEFT JOIN persons p ON al.person_id = p.id
    LEFT JOIN cards c ON p.card_id = c.id
    LEFT JOIN access_points ap ON al.access_point_id = ap.id
    
    WHERE 
        -- ===== ФИЛЬТР ПО ФИО =====
        p.last_name = p_last_name
        AND p.first_name = p_first_name
        AND (p.middle_name = p_middle_name OR (p.middle_name IS NULL AND p_middle_name = ''))
        
        -- ===== ФИЛЬТР ПО ДИАПАЗОНУ ДАТ =====
        AND al.event_time >= p_date_from
        AND al.event_time <= p_date_to
        
        -- ===== ФИЛЬТР ПО ТИПУ ЛИЦА: СОТРУДНИКИ =====
        -- ВАРИАНТ 1: Если есть поле person_type
        AND p.person_type = 'employee'
        
        -- ВАРИАНТ 2: Если определяем по email (не @study.utmn.ru)
        -- AND p.upn NOT LIKE '%@study.%'
        
        -- ВАРИАНТ 3: Если есть отдельная таблица сотрудников
        -- AND EXISTS (SELECT 1 FROM employees e WHERE e.person_id = p.id)
    
    ORDER BY al.event_time DESC;
    
    -- =====================================================
    -- КОНЕЦ АДАПТИРУЕМОЙ ЧАСТИ
    -- =====================================================
END//

DELIMITER ;


-- ====================================================================
-- ПРОЦЕДУРА 4: Получение проходов СОТРУДНИКОВ по UPN (email)
-- ====================================================================
-- Использование:
--   CALL sp_get_employees_passes_by_upn('a.s.milov@utmn.ru', '2026-03-03 00:00:00', '2026-03-03 23:59:59');

DELIMITER //

DROP PROCEDURE IF EXISTS sp_get_employees_passes_by_upn//

CREATE PROCEDURE sp_get_employees_passes_by_upn(
    IN p_upn VARCHAR(255),
    IN p_date_from DATETIME,
    IN p_date_to DATETIME
)
BEGIN
    -- =====================================================
    -- АДАПТИРУЙТЕ ЭТОТ SELECT ПОД ВАШУ СТРУКТУРУ БАЗЫ ДАННЫХ
    -- =====================================================
    
    SELECT 
        -- ===== ОБЯЗАТЕЛЬНЫЕ ПОЛЯ =====
        
        al.id AS id,
        al.event_time AS event_time,
        CONCAT_WS(' ', p.last_name, p.first_name, p.middle_name) AS full_name,
        p.upn AS upn,
        c.card_number AS card_number,
        ap.name AS checkpoint_name,
        
        -- ===== ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ =====
        
        al.event_name AS event_name,
        al.direction AS direction,
        ap.building AS building,
        ap.location AS location
        
    FROM access_logs al
    LEFT JOIN persons p ON al.person_id = p.id
    LEFT JOIN cards c ON p.card_id = c.id
    LEFT JOIN access_points ap ON al.access_point_id = ap.id
    
    WHERE 
        -- ===== ФИЛЬТР ПО UPN =====
        p.upn = p_upn
        
        -- ===== ФИЛЬТР ПО ДИАПАЗОНУ ДАТ =====
        AND al.event_time >= p_date_from
        AND al.event_time <= p_date_to
        
        -- ===== ФИЛЬТР ПО ТИПУ ЛИЦА: СОТРУДНИКИ =====
        -- ВАРИАНТ 1: Если есть поле person_type
        AND p.person_type = 'employee'
        
        -- ВАРИАНТ 2: Если определяем по email (не @study.utmn.ru)
        -- AND p.upn NOT LIKE '%@study.%'
        
        -- ВАРИАНТ 3: Если есть отдельная таблица сотрудников
        -- AND EXISTS (SELECT 1 FROM employees e WHERE e.person_id = p.id)
    
    ORDER BY al.event_time DESC;
    
    -- =====================================================
    -- КОНЕЦ АДАПТИРУЕМОЙ ЧАСТИ
    -- =====================================================
END//

DELIMITER ;


-- ====================================================================
-- ПРОВЕРКА СОЗДАННЫХ ПРОЦЕДУР
-- ====================================================================

-- Показать все процедуры в текущей базе данных
SHOW PROCEDURE STATUS WHERE Db = DATABASE();

-- Тесты процедур

-- Тест 1: Проходы студентов по ФИО
-- CALL sp_get_students_passes_by_fio('Петрова', 'Мария', 'Сергеевна', '2026-03-01 00:00:00', '2026-03-31 23:59:59');

-- Тест 2: Проходы студентов по UPN
-- CALL sp_get_students_passes_by_upn('petrova@study.utmn.ru', '2026-03-01 00:00:00', '2026-03-31 23:59:59');

-- Тест 3: Проходы сотрудников по ФИО
-- CALL sp_get_employees_passes_by_fio('Милов', 'Алексей', 'Сергеевич', '2026-03-01 00:00:00', '2026-03-31 23:59:59');

-- Тест 4: Проходы сотрудников по UPN
-- CALL sp_get_employees_passes_by_upn('a.s.milov@utmn.ru', '2026-03-01 00:00:00', '2026-03-31 23:59:59');


-- ====================================================================
-- ПРИМЕЧАНИЯ ПО АДАПТАЦИИ
-- ====================================================================

/*
1. НАЗВАНИЯ ТАБЛИЦ:
   - access_logs     → ваша таблица журнала проходов (может быть events, journal, passes)
   - persons         → ваша таблица людей (может быть users, people, individuals)
   - cards           → ваша таблица карт (может быть badges, access_cards)
   - access_points   → ваша таблица точек доступа (может быть doors, checkpoints, gates)

2. НАЗВАНИЯ ПОЛЕЙ:
   - event_time      → может быть timestamp, access_time, datetime
   - person_id       → может быть user_id, people_id
   - card_number     → может быть badge_number, card_id
   - checkpoint_name → может быть door_name, access_point_name
   - event_name      → может быть event_type, action, status
   - person_type     → может быть user_type, role

3. ФИЛЬТР ПО ТИПУ (СТУДЕНТ/СОТРУДНИК):
   Выберите один из трех вариантов в комментариях в процедурах:
   
   ВАРИАНТ 1: Если в таблице persons есть поле person_type
      AND p.person_type = 'student'   // или 'employee'
   
   ВАРИАНТ 2: Если определяем по домену email
      AND p.upn LIKE '%@study.%'      // студенты
      AND p.upn NOT LIKE '%@study.%'  // сотрудники
   
   ВАРИАНТ 3: Если есть отдельные таблицы students и employees
      AND EXISTS (SELECT 1 FROM students s WHERE s.person_id = p.id)
      AND EXISTS (SELECT 1 FROM employees e WHERE e.person_id = p.id)

4. СТРУКТУРА ВОЗВРАЩАЕМЫХ ДАННЫХ:
   Обязательно должны быть поля:
   - id               (INT)
   - event_time       (DATETIME)
   - full_name        (VARCHAR)
   - checkpoint_name  (VARCHAR)
   
   Опционально:
   - upn, card_number, event_name, direction, building, location

5. ПРИМЕНЕНИЕ:
   - Скопируйте этот файл
   - Адаптируйте SELECT запросы под вашу структуру БД
   - Выполните в MySQL:
     mysql -u root -p skud_database < SKUD_STUDENTS_EMPLOYEES_PROCEDURES.sql
*/
