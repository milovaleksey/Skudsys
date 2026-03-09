-- =====================================================
-- Хранимая процедура: sp_foreign_students_missing
-- Описание: Поиск иностранных студентов, которые 
--           отсутствуют более N дней
-- Параметры:
--   - p_country: код страны или 'all' для всех стран
--   - p_days_threshold: порог отсутствия в днях
-- =====================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_foreign_students_missing$$

CREATE PROCEDURE sp_foreign_students_missing(
    IN p_country VARCHAR(255),
    IN p_days_threshold INT
)
BEGIN
    -- Получаем список иностранных студентов с последним визитом
    -- и количеством дней отсутствия
    SELECT 
        p.id,
        CONCAT_WS(' ', p.last_name, p.first_name, p.middle_name) AS fio,
        p.upn,
        p.card_number,
        pc.country_name AS country,
        MAX(e.event_time) AS last_seen,
        ap.name AS last_location,
        e.device_name AS device_name,
        DATEDIFF(NOW(), MAX(e.event_time)) AS days_missing
    FROM 
        persons p
    LEFT JOIN 
        person_countries pc ON p.country_id = pc.id
    LEFT JOIN 
        events e ON p.id = e.person_id
    LEFT JOIN 
        access_points ap ON e.access_point_id = ap.id
    WHERE 
        -- Только иностранные студенты (исключаем Россию)
        pc.country_code != 'RU' 
        AND pc.country_name != 'РОССИЯ'
        AND p.person_type = 'student'
        -- Фильтр по стране (если указана конкретная)
        AND (p_country = 'all' OR pc.country_name = p_country)
    GROUP BY 
        p.id, p.last_name, p.first_name, p.middle_name, 
        p.upn, p.card_number, pc.country_name, ap.name, e.device_name
    HAVING 
        -- Фильтр по количеству дней отсутствия
        days_missing >= p_days_threshold
    ORDER BY 
        days_missing DESC, fio ASC
    LIMIT 1000;
END$$

DELIMITER ;

-- Права доступа
GRANT EXECUTE ON PROCEDURE sp_foreign_students_missing TO 'skud_app'@'%';
GRANT EXECUTE ON PROCEDURE sp_foreign_students_missing TO 'skud_app'@'localhost';