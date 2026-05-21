-- ====================================================================================================
-- ШАБЛОНЫ ХРАНИМЫХ ПРОЦЕДУР ДЛЯ ОТЧЕТА О ПРОХОДАХ
-- База данных СКУД (MySQL)
-- ====================================================================================================

-- ====================================================================================================
-- 1. ПРОЦЕДУРА: sp_get_passes_by_fio
-- Описание: Получение журнала проходов человека по ФИО с диапазоном дат
-- Вызов: CALL sp_get_passes_by_fio('Милов', 'Алексей', 'Сергеевич', '2026-03-03 00:00:00', '2026-03-03 23:59:59');
-- ====================================================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_get_passes_by_fio$$

CREATE PROCEDURE sp_get_passes_by_fio(
    IN p_last_name VARCHAR(100),
    IN p_first_name VARCHAR(100),
    IN p_middle_name VARCHAR(100),
    IN p_date_from DATETIME,
    IN p_date_to DATETIME
)
BEGIN
    -- Поиск всех проходов человека по ФИО за указанный период
    -- Возвращает список всех проходов с сортировкой от новых к старым
    
    SELECT 
        -- ===== ОБЯЗАТЕЛЬНЫЕ ПОЛЯ =====
        
        -- ID записи о проходе
        al.id AS id,
        
        -- Время события (проход)
        -- Формат: YYYY-MM-DD HH:MM:SS
        al.event_time AS event_time,
        
        -- Полное ФИО человека
        CONCAT_WS(' ', p.last_name, p.first_name, p.middle_name) AS full_name,
        
        -- UPN/Email (например: a.s.milov@utmn.ru)
        -- Может быть NULL
        p.upn AS upn,
        
        -- Номер карты СКУД (например: "1446738")
        -- Может быть NULL
        c.card_number AS card_number,
        
        -- Название точки прохода (контрольной точки)
        -- Например: "Главный вход, корпус А"
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
        
    FROM 
        access_logs al
        
    -- Присоединяем таблицу людей (persons)
    LEFT JOIN persons p ON al.person_id = p.id
    
    -- Присоединяем таблицу карт
    LEFT JOIN cards c ON p.card_id = c.id
    
    -- Присоединяем точки доступа (турникеты, двери и т.д.)
    LEFT JOIN access_points ap ON al.access_point_id = ap.id
    
    WHERE 
        -- Фильтруем по ФИО
        p.last_name = p_last_name
        AND p.first_name = p_first_name
        AND (
            p_middle_name = '' 
            OR p_middle_name IS NULL 
            OR p.middle_name = p_middle_name
        )
        
        -- Фильтруем по диапазону дат
        AND al.event_time >= p_date_from
        AND al.event_time <= p_date_to
    
    -- Сортируем по времени события (новые события вверху)
    ORDER BY al.event_time DESC;
    
END$$

DELIMITER ;


-- ====================================================================================================
-- 2. ПРОЦЕДУРА: sp_get_passes_by_upn
-- Описание: Получение журнала проходов человека по UPN (email) с диапазоном дат
-- Вызов: CALL sp_get_passes_by_upn('a.s.milov@utmn.ru', '2026-03-03 00:00:00', '2026-03-03 23:59:59');
-- ====================================================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_get_passes_by_upn$$

CREATE PROCEDURE sp_get_passes_by_upn(
    IN p_upn VARCHAR(255),
    IN p_date_from DATETIME,
    IN p_date_to DATETIME
)
BEGIN
    -- Поиск всех проходов человека по UPN (email) за указанный период
    -- Возвращает список всех проходов с сортировкой от новых к старым
    
    SELECT 
        -- ===== ОБЯЗАТЕЛЬНЫЕ ПОЛЯ =====
        
        -- ID записи о проходе
        al.id AS id,
        
        -- Время события (проход)
        -- Формат: YYYY-MM-DD HH:MM:SS
        al.event_time AS event_time,
        
        -- Полное ФИО человека
        CONCAT_WS(' ', p.last_name, p.first_name, p.middle_name) AS full_name,
        
        -- UPN/Email (например: a.s.milov@utmn.ru)
        p.upn AS upn,
        
        -- Номер ка��ты СКУД (например: "1446738")
        -- Может быть NULL
        c.card_number AS card_number,
        
        -- Название точки прохода (контрольной точки)
        -- Например: "Главный вход, корпус А"
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
        
    FROM 
        access_logs al
        
    -- Присоединяем таблицу людей (persons)
    LEFT JOIN persons p ON al.person_id = p.id
    
    -- Присоединяем таблицу карт
    LEFT JOIN cards c ON p.card_id = c.id
    
    -- Присоединяем точки доступа (т��рникеты, двери и т.д.)
    LEFT JOIN access_points ap ON al.access_point_id = ap.id
    
    WHERE 
        -- Фильтруем по UPN (email)
        p.upn = p_upn
        
        -- Фильтруем по диапазону дат
        AND al.event_time >= p_date_from
        AND al.event_time <= p_date_to
    
    -- Сортируем по времени события (новые события вверху)
    ORDER BY al.event_time DESC;
    
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
| id               | INT           | ID записи о проходе                      |
| event_time       | DATETIME      | Время прохода                            |
| full_name        | VARCHAR(255)  | Полное ФИО человека                      |
| upn              | VARCHAR(255)  | Email/UPN (может быть NULL)              |
| card_number      | VARCHAR(50)   | Номер карты СКУД (может быть NULL)       |
| checkpoint_name  | VARCHAR(255)  | Название точки прохода                   |
| event_name       | VARCHAR(255)  | Название события (опционально)           |
| direction        | VARCHAR(10)   | 'in' | 'out' (опционально)                |
| building         | VARCHAR(100)  | Здание/корпус (опционально)              |
| location         | TEXT          | Детальное местоположение (опционально)   |
+------------------+---------------+------------------------------------------+

ПРИМЕРЫ ДАННЫХ:

1. Сотрудник (несколько проходов за день):
   
   id: 12345
   event_time: "2026-03-03 14:35:22"
   full_name: "Милов Алексей Сергеевич"
   upn: "a.s.milov@utmn.ru"
   card_number: "1446738"
   checkpoint_name: "Главный вход, корпус А"
   event_name: "Вход разрешен"
   direction: "out"
   building: "Корпус А"
   
   id: 12340
   event_time: "2026-03-03 08:12:15"
   full_name: "Милов Алексей Сергеевич"
   upn: "a.s.milov@utmn.ru"
   card_number: "1446738"
   checkpoint_name: "Главный вход, корпус А"
   event_name: "Вход разрешен"
   direction: "in"
   building: "Корпус А"

2. Студент:
   
   id: 54321
   event_time: "2026-03-03 13:20:45"
   full_name: "Петрова Мария Сергеевна"
   upn: "petrova@study.utmn.ru"
   card_number: "0987654321"
   checkpoint_name: "Библиотека"
   event_name: "Вход разрешен"
   direction: "in"
   building: "Главный корпус"

3. Нет данных за период:
   Если проходов не найдено за указанный период, процедура вернет пустой результат (0 строк).
*/


-- ====================================================================================================
-- ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ
-- ====================================================================================================

-- Поиск проходов по ФИО (с отчеством) за сегодня
CALL sp_get_passes_by_fio(
    'Милов', 
    'Алексей', 
    'Сергеевич',
    '2026-03-03 00:00:00',
    '2026-03-03 23:59:59'
);

-- Поиск проходов по ФИО (без отчества) за неделю
CALL sp_get_passes_by_fio(
    'Ив��нов', 
    'Иван', 
    '',
    '2026-03-01 00:00:00',
    '2026-03-07 23:59:59'
);

-- Поиск проходов по UPN (сотрудник) за месяц
CALL sp_get_passes_by_upn(
    'a.s.milov@utmn.ru',
    '2026-03-01 00:00:00',
    '2026-03-31 23:59:59'
);

-- Поиск проходов по UPN (студент) за год
CALL sp_get_passes_by_upn(
    'petrova@study.utmn.ru',
    '2026-01-01 00:00:00',
    '2026-12-31 23:59:59'
);


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

3. access_logs - Журнал проходов
   - id (INT, PRIMARY KEY)
   - person_id (INT, внешний ключ на persons.id)
   - access_point_id (INT, внешний ключ на access_points.id)
   - event_time (DATETIME, время прохода)
   - direction (VARCHAR, направление: 'in' или 'out')
   - event_name (VARCHAR, название события, опционально)

4. access_points - Точки доступа (турникеты, двери)
   - id (INT, PRIMARY KEY)
   - name (VARCHAR, название точки)
   - location (TEXT, детальное описание местоположения)
   - building (VARCHAR, название здания/корпуса)

ВАЖНО: Названия таблиц и полей могут отличаться в вашей базе данных.
       Адаптируйте процедуры под вашу структуру БД!

ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ:
- INDEX idx_person_id ON access_logs(person_id, event_time)
- INDEX idx_event_time ON access_logs(event_time)
- INDEX idx_upn ON persons(upn)
- INDEX idx_full_name ON persons(last_name, first_name, middle_name)
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
     "data": [
       {
         "id": 12345,
         "time": "2026-03-03 14:35:22",
         "fullName": "Милов Алексей Сергеевич",
         "upn": "a.s.milov@utmn.ru",
         "cardNumber": "1446738",
         "checkpoint": "Главный вход, корпус А",
         "eventName": "Вход разрешен",
         "direction": "out",
         "building": "Корпус А"
       },
       ...
     ],
     "total": 15
   }

Контроллер поддерживает гибкое именование полей:
- full_name или fullName или person_name
- card_number или cardNumber
- event_time или access_time или time
- checkpoint_name или checkpoint или access_point_name
*/


-- ====================================================================================================
-- ТЕСТИРОВАНИЕ
-- ====================================================================================================

/*
После создания процедур выполните тестовые вызовы:

1. Проверьте существование процедур:
   SHOW PROCEDURE STATUS WHERE Db = 'ваша_база_данных';

2. Проверьте работу поиска по ФИО:
   CALL sp_get_passes_by_fio('Милов', 'Алексей', 'Сергеевич', '2026-03-01 00:00:00', '2026-03-31 23:59:59');

3. Проверьте работу поиска по UPN:
   CALL sp_get_passes_by_upn('a.s.milov@utmn.ru', '2026-03-01 00:00:00', '2026-03-31 23:59:59');

4. Проверьте backend API:
   curl -X GET "http://localhost:3000/v1/skud/passes/by-fio?lastName=Милов&firstName=Алексей&middleName=Сергеевич&dateFrom=2026-03-03%2000:00:00&dateTo=2026-03-03%2023:59:59" \
        -H "Authorization: Bearer YOUR_TOKEN"

5. Проверьте frontend:
   - Откройте страницу "Отчет о проходах"
   - Введите ФИО или UPN
   - Выберите диапазон дат (по умолчанию - сегодня)
   - Нажмите "Найти"
   - Проверьте экспорт в Excel
*/


-- ====================================================================================================
-- ОПТИМИЗАЦИЯ И ПРОИЗВОДИТЕЛЬНОСТЬ
-- ====================================================================================================

/*
Для б��льших объемов данных рекомендуется:

1. Создать индексы:
   CREATE INDEX idx_person_event_time ON access_logs(person_id, event_time DESC);
   CREATE INDEX idx_upn ON persons(upn);
   CREATE INDEX idx_full_name ON persons(last_name, first_name, middle_name);

2. Использовать партиционирование таблицы access_logs по дате (если более 1 млн записей)

3. Добавить LIMIT в процедуры для ограничения количества возвращаемых записей:
   ORDER BY al.event_time DESC
   LIMIT 1000;  -- максимум 1000 записей

4. Для очень больших диапазонов дат использовать пагинацию
*/