-- ====================================================================================================
-- ШАБЛОНЫ ХРАНИМЫХ ПРОЦЕДУР ДЛЯ ПОИСКА МЕСТОПОЛОЖЕНИЯ ЧЕЛОВЕКА
-- База данных СКУД (MySQL)
-- ====================================================================================================

-- ====================================================================================================
-- 1. ПРОЦЕДУРА: sp_get_last_entry_event
-- Описание: Поиск последнего прохода человека по ФИО
-- Вызов: CALL sp_get_last_entry_event('Милов', 'Алексей', 'Сергеевич');
-- ====================================================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_get_last_entry_event$$

CREATE PROCEDURE sp_get_last_entry_event(
    IN p_last_name VARCHAR(100),
    IN p_first_name VARCHAR(100),
    IN p_middle_name VARCHAR(100)
)
BEGIN
    -- Поиск последнего события прохода для человека по ФИО
    -- Возвращает информацию о человеке и его последнем проходе через СКУД
    
    SELECT 
        -- ===== ОБЯЗАТЕЛЬНЫЕ ПОЛЯ =====
        
        -- Полное ФИО человека
        CONCAT_WS(' ', p_last_name, p_first_name, p_middle_name) AS full_name,
        
        -- UPN/Email (например: a.s.milov@utmn.ru)
        -- Если NULL, то показываем NULL
        p.upn AS upn,
        
        -- Номер карты СКУД (например: "1446738" или "0001446738")
        -- Если NULL, то показываем NULL
        c.card_number AS card_number,
        
        -- Подразделение/Отдел
        -- Для сотрудников: название отдела
        -- Для студентов: "Институт, курс N"
        -- Если NULL, то показываем NULL
        COALESCE(
            e.department,
            CONCAT_WS(', ', s.faculty, CONCAT('курс ', s.course))
        ) AS department,
        
        -- Тип человека: 'employee' | 'student'
        CASE 
            WHEN e.id IS NOT NULL THEN 'employee'
            WHEN s.id IS NOT NULL THEN 'student'
            ELSE 'unknown'
        END AS person_type,
        
        -- Название точки прохода (контрольной точки)
        -- Например: "Главный вход, корпус А"
        ap.name AS checkpoint_name,
        
        -- Местоположение точки прохода (детальное описание)
        -- Например: "1 этаж, турникет №3"
        -- Если NULL, можно объединить с checkpoint_name
        COALESCE(ap.location, ap.name) AS location,
        
        -- Время события (последний проход)
        -- Формат: YYYY-MM-DD HH:MM:SS
        al.event_time AS event_time,
        
        -- ===== ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ (опциональные) =====
        
        -- ID человека в системе
        p.id AS person_id,
        
        -- Направление прохода: 'in' (вход) | 'out' (выход)
        al.direction AS direction,
        
        -- Здание/корпус
        ap.building AS building
        
    FROM 
        access_logs al
        
    -- Присоединяем таблицу людей (persons)
    LEFT JOIN persons p ON al.person_id = p.id
    
    -- Присоединяем таблицу карт
    LEFT JOIN cards c ON p.card_id = c.id
    
    -- Присоединяем таблицу сотрудников
    LEFT JOIN employees e ON p.id = e.person_id
    
    -- Присоединяем таблицу студентов
    LEFT JOIN students s ON p.id = s.person_id
    
    -- Присоединяем точки доступа (турникеты, двери и т.д.)
    LEFT JOIN access_points ap ON al.access_point_id = ap.id
    
    WHERE 
        -- Фильтруем по ФИО (поиск с учетом регистра или без - зависит от collation)
        p.last_name = p_last_name
        AND p.first_name = p_first_name
        AND (
            p_middle_name = '' 
            OR p_middle_name IS NULL 
            OR p.middle_name = p_middle_name
        )
    
    -- Сортируем по времени события (последнее событие вверху)
    ORDER BY al.event_time DESC
    
    -- Берем только последнюю запись
    LIMIT 1;
    
END$$

DELIMITER ;


-- ====================================================================================================
-- 2. ПРОЦЕДУРА: sp_get_last_entry_by_upn
-- Описание: Поиск последнего прохода человека по UPN (email)
-- Вызов: CALL sp_get_last_entry_by_upn('a.s.milov@utmn.ru');
-- ====================================================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_get_last_entry_by_upn$$

CREATE PROCEDURE sp_get_last_entry_by_upn(
    IN p_upn VARCHAR(255)
)
BEGIN
    -- Поиск последнего события прохода для человека по UPN (email)
    -- Возвращает информацию о человеке и его последнем проходе через СКУД
    
    SELECT 
        -- ===== ОБЯЗАТЕЛЬНЫЕ ПОЛЯ =====
        
        -- Полное ФИО человека
        CONCAT_WS(' ', p.last_name, p.first_name, p.middle_name) AS full_name,
        
        -- UPN/Email (например: a.s.milov@utmn.ru)
        p.upn AS upn,
        
        -- Номер карты СКУД (например: "1446738" или "0001446738")
        -- Если NULL, то показываем NULL
        c.card_number AS card_number,
        
        -- Подразделение/Отдел
        -- Для сотрудников: название отдела
        -- Для студентов: "Институт, курс N"
        -- Если NULL, то показываем NULL
        COALESCE(
            e.department,
            CONCAT_WS(', ', s.faculty, CONCAT('курс ', s.course))
        ) AS department,
        
        -- Тип человека: 'employee' | 'student'
        CASE 
            WHEN e.id IS NOT NULL THEN 'employee'
            WHEN s.id IS NOT NULL THEN 'student'
            ELSE 'unknown'
        END AS person_type,
        
        -- Название точки прохода (контрольной точки)
        -- Например: "Главный вход, корпус А"
        ap.name AS checkpoint_name,
        
        -- Местоположение точки прохода (детальное описание)
        -- Например: "1 этаж, турникет №3"
        -- Если NULL, можно объединить с checkpoint_name
        COALESCE(ap.location, ap.name) AS location,
        
        -- Время события (последний проход)
        -- Формат: YYYY-MM-DD HH:MM:SS
        al.event_time AS event_time,
        
        -- ===== ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ (опциональные) =====
        
        -- ID человека в системе
        p.id AS person_id,
        
        -- Направление прохода: 'in' (вход) | 'out' (выход)
        al.direction AS direction,
        
        -- Здание/корпус
        ap.building AS building
        
    FROM 
        access_logs al
        
    -- Присоединяем таблицу людей (persons)
    LEFT JOIN persons p ON al.person_id = p.id
    
    -- Присоединяем таблицу карт
    LEFT JOIN cards c ON p.card_id = c.id
    
    -- Присоединяем таблицу сотрудников
    LEFT JOIN employees e ON p.id = e.person_id
    
    -- Присоединяем таблицу студентов
    LEFT JOIN students s ON p.id = s.person_id
    
    -- Присоединяем точки доступа (турникеты, двери и т.д.)
    LEFT JOIN access_points ap ON al.access_point_id = ap.id
    
    WHERE 
        -- Фильтруем по UPN (email)
        p.upn = p_upn
    
    -- Сортируем по времени события (последнее событие вверху)
    ORDER BY al.event_time DESC
    
    -- Берем только последнюю запись
    LIMIT 1;
    
END$$

DELIMITER ;


-- ====================================================================================================
-- СТРУКТУРА ВОЗВРАЩАЕМЫХ ДАННЫХ
-- ====================================================================================================

/*
Обе процедуры возвращают одинаковую структуру данных:

+------------------+---------------+------------------------------------------+
| Поле             | Тип           | Описание                                 |
+------------------+---------------+------------------------------------------+
| full_name        | VARCHAR(255)  | Полное ФИО человека                      |
| upn              | VARCHAR(255)  | Email/UPN (может быть NULL)              |
| card_number      | VARCHAR(50)   | Номер карты СКУД (может быть NULL)       |
| department       | TEXT          | Подразделение/Институт (может быть NULL) |
| person_type      | VARCHAR(20)   | 'employee' | 'student' | 'unknown'      |
| checkpoint_name  | VARCHAR(255)  | Название точки прохода                   |
| location         | TEXT          | Детальное местоположение                 |
| event_time       | DATETIME      | Время последнего прохода                 |
| person_id        | INT           | ID человека в системе (опционально)      |
| direction        | VARCHAR(10)   | 'in' | 'out' (опционально)                |
| building         | VARCHAR(100)  | Здание/корпус (опционально)              |
+------------------+---------------+------------------------------------------+

ПРИМЕРЫ ДАННЫХ:

1. Сотрудник:
   full_name: "Милов Алексей Сергеевич"
   upn: "a.s.milov@utmn.ru"
   card_number: "1446738"
   department: "Институт математики и компьютерных наук"
   person_type: "employee"
   checkpoint_name: "Главный вход, корпус А"
   location: "1 этаж, турникет №3"
   event_time: "2026-03-03 14:35:22"
   direction: "in"
   building: "Корпус А"

2. Студент:
   full_name: "Петрова Мария Сергеевна"
   upn: "petrova@study.utmn.ru"
   card_number: "0987654321"
   department: "Институт социально-гуманитарных наук, курс 3"
   person_type: "student"
   checkpoint_name: "Библиотека"
   location: "2 этаж, вход в читальный зал"
   event_time: "2026-03-03 13:20:45"
   direction: "in"
   building: "Главный корпус"

3. Данные отсутствуют:
   Если человек не найден или нет записей о проходах, процедура вернет пустой результат (0 строк).
*/


-- ====================================================================================================
-- ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ
-- ====================================================================================================

-- Поиск по ФИО (с отчеством)
CALL sp_get_last_entry_event('Милов', 'Алексей', 'Сергеевич');

-- Поиск по ФИО (без отчества)
CALL sp_get_last_entry_event('Иванов', 'Иван', '');

-- Поиск по UPN (сотрудник)
CALL sp_get_last_entry_by_upn('a.s.milov@utmn.ru');

-- Поиск по UPN (студент)
CALL sp_get_last_entry_by_upn('petrova@study.utmn.ru');


-- ====================================================================================================
-- ТРЕБОВАНИЯ К БАЗЕ ДАННЫХ
-- ====================================================================================================

/*
Для работы процедур требуются следующие таблицы:

1. persons - Таблица людей
   - id (INT, PRIMARY KEY)
   - last_name (VARCHAR)
   - first_name (VARCHAR)
   - middle_name (VARCHAR, может быть NULL)
   - upn (VARCHAR, уникальный email)
   - card_id (INT, внешний ключ на cards.id)

2. cards - Таблица карт СКУД
   - id (INT, PRIMARY KEY)
   - card_number (VARCHAR, номер карты)

3. employees - Таблица сотрудников
   - id (INT, PRIMARY KEY)
   - person_id (INT, внешний ключ на persons.id)
   - department (VARCHAR, название отдела)

4. students - Таблица студентов
   - id (INT, PRIMARY KEY)
   - person_id (INT, внешний ключ на persons.id)
   - faculty (VARCHAR, название института/факультета)
   - course (INT, номер курса)

5. access_logs - Журнал проходов
   - id (INT, PRIMARY KEY)
   - person_id (INT, внешний ключ на persons.id)
   - access_point_id (INT, внешний ключ на access_points.id)
   - event_time (DATETIME, время прохода)
   - direction (VARCHAR, направление: 'in' или 'out')

6. access_points - Точки доступа (турникеты, двери)
   - id (INT, PRIMARY KEY)
   - name (VARCHAR, название точки)
   - location (TEXT, детальное описание местоположения)
   - building (VARCHAR, название здания/корпуса)

ВАЖНО: Названия таблиц и полей могут отличаться в вашей базе данных.
       Адаптируйте процедуры под вашу структуру БД!
*/


-- ====================================================================================================
-- ИНТЕГРАЦИЯ С BACKEND
-- ====================================================================================================

/*
Backend контроллер в файле /backend/src/controllers/skudController.js автоматически:

1. Вызывает процедуру с правильными параметрами
2. Обрабатывает результат
3. Форматирует дату/время в читаемый формат
4. Возвращает JSON в формате:
   {
     "success": true,
     "data": {
       "fullName": "Милов Алексей Сергеевич",
       "upn": "a.s.milov@utmn.ru",
       "cardNumber": "1446738",
       "department": "Институт математики и компьютерных наук",
       "type": "employee",
       "lastLocation": {
         "checkpoint": "Главный вход, корпус А",
         "time": "2026-03-03 14:35:22"
       }
     }
   }

Контроллер поддерживает гибкое именование полей:
- full_name или fullName
- card_number или cardNumber
- person_type или type
- checkpoint_name или location или access_point_name
- event_time или access_time или lastSeen
*/


-- ====================================================================================================
-- ТЕСТИРОВАНИЕ
-- ====================================================================================================

/*
После создания процедур выполните тестовые вызовы:

1. Проверьте существование процедур:
   SHOW PROCEDURE STATUS WHERE Db = 'ваша_база_данных';

2. Проверьте работу поиска по ФИО:
   CALL sp_get_last_entry_event('Тестовая', 'Фамилия', 'Отчество');

3. Проверьте работу поиска по UPN:
   CALL sp_get_last_entry_by_upn('test@utmn.ru');

4. Проверьте backend API:
   curl -X GET "http://localhost:3000/v1/skud/location/by-fio?lastName=Милов&firstName=Алексей&middleName=Сергеевич" \
        -H "Authorization: Bearer YOUR_TOKEN"

5. Проверьте frontend:
   - Откройте страницу "Где находится человек"
   - Введите ФИО или UPN
   - Нажмите "Найти"
*/
