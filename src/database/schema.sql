-- ============================================
-- База данных: Системы безопасности инфраструктуры ТюмГУ
-- СУБД: MySQL 8.0+
-- Кодировка: utf8mb4
-- ============================================

-- Создание базы данных
CREATE DATABASE IF NOT EXISTS utmn_security
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE utmn_security;

-- ============================================
-- ТАБЛИЦА: roles (Роли)
-- ============================================
CREATE TABLE roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    permissions JSON NOT NULL COMMENT 'Массив прав доступа в формате JSON',
    is_system BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Системная роль (нельзя удалить)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_is_system (is_system)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ТАБЛИЦА: users (Пользователи)
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) COMMENT 'NULL для SSO пользователей',
    role_name VARCHAR(100) NOT NULL,
    auth_type ENUM('local', 'sso') NOT NULL DEFAULT 'local',
    avatar_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    
    FOREIGN KEY (role_name) REFERENCES roles(name) ON UPDATE CASCADE,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role_name),
    INDEX idx_auth_type (auth_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ТАБЛИЦА: sessions (Сессии пользователей)
-- ============================================
CREATE TABLE sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ТАБЛИЦА: audit_log (Журнал аудита)
-- ============================================
CREATE TABLE audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL COMMENT 'CREATE, UPDATE, DELETE, LOGIN, LOGOUT',
    entity_type VARCHAR(50) NOT NULL COMMENT 'user, role, session',
    entity_id VARCHAR(100),
    old_values JSON COMMENT 'Старые значения (для UPDATE, DELETE)',
    new_values JSON COMMENT 'Новые значения (для CREATE, UPDATE)',
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity_type (entity_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ТАБЛИЦА: students (Студенты)
-- ============================================
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_number VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    faculty VARCHAR(200),
    course INT,
    group_number VARCHAR(50),
    is_foreign BOOLEAN NOT NULL DEFAULT FALSE,
    country VARCHAR(100) COMMENT 'Страна для иностранных студентов',
    dormitory_id INT,
    room_number VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_student_number (student_number),
    INDEX idx_email (email),
    INDEX idx_is_foreign (is_foreign),
    INDEX idx_is_active (is_active),
    INDEX idx_dormitory (dormitory_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ТАБЛИЦА: employees (Сотрудники)
-- ============================================
CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_number VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    department VARCHAR(200),
    position VARCHAR(200),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_employee_number (employee_number),
    INDEX idx_email (email),
    INDEX idx_department (department),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ТАБЛИЦА: dormitories (Общежития)
-- ============================================
CREATE TABLE dormitories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address VARCHAR(500) NOT NULL,
    total_rooms INT NOT NULL DEFAULT 0,
    total_places INT NOT NULL DEFAULT 0,
    occupied_places INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ТАБЛИЦА: access_points (Точки доступа)
-- ============================================
CREATE TABLE access_points (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    location VARCHAR(500) NOT NULL,
    type ENUM('entrance', 'exit', 'internal') NOT NULL,
    building VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_type (type),
    INDEX idx_building (building),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ТАБЛИЦА: access_logs (Журнал проходов)
-- ============================================
CREATE TABLE access_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    access_point_id INT NOT NULL,
    person_type ENUM('student', 'employee', 'guest') NOT NULL,
    person_id INT COMMENT 'ID студента или сотрудника',
    person_name VARCHAR(200),
    card_number VARCHAR(50),
    direction ENUM('in', 'out') NOT NULL,
    access_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (access_point_id) REFERENCES access_points(id),
    INDEX idx_access_point (access_point_id),
    INDEX idx_person (person_type, person_id),
    INDEX idx_card_number (card_number),
    INDEX idx_access_time (access_time),
    INDEX idx_direction (direction)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ТАБЛИЦА: parking_spots (Парковочные места)
-- ============================================
CREATE TABLE parking_spots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    spot_number VARCHAR(20) NOT NULL UNIQUE,
    zone VARCHAR(50) NOT NULL,
    level INT DEFAULT 1,
    is_occupied BOOLEAN NOT NULL DEFAULT FALSE,
    vehicle_number VARCHAR(20),
    owner_type ENUM('student', 'employee', 'guest'),
    owner_id INT,
    occupied_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_spot_number (spot_number),
    INDEX idx_zone (zone),
    INDEX idx_is_occupied (is_occupied),
    INDEX idx_vehicle_number (vehicle_number),
    INDEX idx_owner (owner_type, owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ТАБЛИЦА: storage_lockers (Ячейки хранения)
-- ============================================
CREATE TABLE storage_lockers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    locker_number VARCHAR(20) NOT NULL UNIQUE,
    location VARCHAR(200) NOT NULL,
    size ENUM('small', 'medium', 'large') NOT NULL,
    is_occupied BOOLEAN NOT NULL DEFAULT FALSE,
    owner_type ENUM('student', 'employee'),
    owner_id INT,
    occupied_at TIMESTAMP NULL,
    occupied_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_locker_number (locker_number),
    INDEX idx_location (location),
    INDEX idx_is_occupied (is_occupied),
    INDEX idx_owner (owner_type, owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ВСТАВКА СИСТЕМНЫХ РОЛЕЙ
-- ============================================
INSERT INTO roles (id, name, display_name, description, permissions, is_system) VALUES
('admin', 'admin', 'Администратор', 'Полный доступ ко всем функциям системы', 
 '["dashboard", "passes", "location", "analytics", "parking", "storage", "foreign-students", "students", "employees", "users-settings", "roles-settings"]', 
 TRUE),

('security', 'security', 'Безопасность', 'Доступ к системам безопасности и контроля доступа', 
 '["dashboard", "passes", "location", "parking", "storage"]', 
 TRUE),

('manager', 'manager', 'Менеджер', 'Доступ к аналитике и отчетам', 
 '["dashboard", "analytics", "students", "employees", "foreign-students"]', 
 TRUE),

('operator', 'operator', 'Оператор', 'Доступ к просмотру и работе с данными', 
 '["dashboard", "passes", "location", "students", "employees"]', 
 TRUE),

('viewer', 'viewer', 'Наблюдатель', 'Только просмотр общей информации', 
 '["dashboard", "analytics"]', 
 TRUE);

-- ============================================
-- ВСТАВКА ТЕСТОВЫХ ПОЛЬЗОВАТЕЛЕЙ
-- ============================================
-- Пароль для всех: test123 (хеш bcrypt)
-- $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

INSERT INTO users (username, full_name, email, password_hash, role_name, auth_type, is_active, last_login) VALUES
('admin_security', 'Иванов Иван Иванович', 'ivanov@utmn.ru', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', 'local', TRUE, '2026-01-19 08:15:00'),
('petrova@utmn.ru', 'Петрова Мария Сергеевна', 'petrova@utmn.ru', NULL, 'security', 'sso', TRUE, '2026-01-19 09:30:00'),
('sidorov', 'Сидоров Петр Алексеевич', 'sidorov@utmn.ru', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'manager', 'local', TRUE, '2026-01-18 16:20:00'),
('kuznetsova@utmn.ru', 'Кузнецова Елена Викторовна', 'kuznetsova@utmn.ru', NULL, 'operator', 'sso', TRUE, '2026-01-19 07:45:00'),
('viewer_user', 'Смирнов Андрей Николаевич', 'smirnov@utmn.ru', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'viewer', 'local', FALSE, '2026-01-17 12:10:00');

-- ============================================
-- ВСТАВКА ТЕСТОВЫХ ОБЩЕЖИТИЙ
-- ============================================
INSERT INTO dormitories (name, address, total_rooms, total_places, occupied_places, is_active) VALUES
('Общежитие №1', 'ул. Володарского, 37', 150, 300, 287, TRUE),
('Общежитие №2', 'ул. Республики, 47', 120, 240, 230, TRUE),
('Общежитие №3', 'ул. Мельникайте, 70', 180, 360, 341, TRUE),
('Общежитие №4', 'ул. Герцена, 68', 100, 200, 195, TRUE),
('Общежитие №5', 'ул. Ленина, 25', 140, 280, 264, TRUE),
('Общежитие №6', 'ул. Профсоюзная, 57', 110, 220, 210, TRUE),
('Общежитие №7', 'ул. 50 лет Октября, 57а', 160, 320, 305, TRUE),
('Общежитие №8', 'ул. Широтная, 117', 130, 260, 248, TRUE);

-- ============================================
-- ВСТАВКА ТОЧЕК ДОСТУПА
-- ============================================
INSERT INTO access_points (name, location, type, building, is_active) VALUES
('Главный вход', 'Корпус А, 1 этаж', 'entrance', 'Корпус А', TRUE),
('Вход со стороны парковки', 'Корпус А, 1 этаж', 'entrance', 'Корпус А', TRUE),
('Вход в библиотеку', 'Библиотека, 1 этаж', 'entrance', 'Библиотека', TRUE),
('Турникет общежития №1', 'Общежитие №1, вход', 'entrance', 'Общежитие №1', TRUE),
('Турникет общежития №2', 'Общежитие №2, вход', 'entrance', 'Общежитие №2', TRUE);

-- ============================================
-- СОЗДАНИЕ ПРЕДСТАВЛЕНИЙ (VIEWS)
-- ============================================

-- Представление: Активные пользователи с полной информацией о ролях
CREATE VIEW v_users_with_roles AS
SELECT 
    u.id,
    u.username,
    u.full_name,
    u.email,
    u.auth_type,
    u.is_active,
    u.last_login,
    u.created_at,
    r.name AS role_name,
    r.display_name AS role_display_name,
    r.description AS role_description,
    r.permissions AS role_permissions,
    r.is_system AS role_is_system
FROM users u
INNER JOIN roles r ON u.role_name = r.name;

-- Представление: Статистика проходов за сегодня
CREATE VIEW v_today_access_stats AS
SELECT 
    DATE(access_time) AS date,
    COUNT(*) AS total_passes,
    COUNT(CASE WHEN direction = 'in' THEN 1 END) AS entries,
    COUNT(CASE WHEN direction = 'out' THEN 1 END) AS exits,
    COUNT(DISTINCT person_id) AS unique_persons
FROM access_logs
WHERE DATE(access_time) = CURDATE()
GROUP BY DATE(access_time);

-- Представление: Статистика парковки
CREATE VIEW v_parking_stats AS
SELECT 
    zone,
    COUNT(*) AS total_spots,
    SUM(CASE WHEN is_occupied THEN 1 ELSE 0 END) AS occupied_spots,
    SUM(CASE WHEN NOT is_occupied THEN 1 ELSE 0 END) AS free_spots,
    ROUND(SUM(CASE WHEN is_occupied THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS occupancy_rate
FROM parking_spots
GROUP BY zone;

-- Представление: Статистика ячеек хранения
CREATE VIEW v_storage_stats AS
SELECT 
    location,
    size,
    COUNT(*) AS total_lockers,
    SUM(CASE WHEN is_occupied THEN 1 ELSE 0 END) AS occupied_lockers,
    SUM(CASE WHEN NOT is_occupied THEN 1 ELSE 0 END) AS free_lockers
FROM storage_lockers
GROUP BY location, size;

-- Представление: Студенты в общежитиях
CREATE VIEW v_students_in_dormitories AS
SELECT 
    d.id AS dormitory_id,
    d.name AS dormitory_name,
    COUNT(s.id) AS students_count,
    COUNT(CASE WHEN s.is_foreign THEN 1 END) AS foreign_students_count
FROM dormitories d
LEFT JOIN students s ON s.dormitory_id = d.id AND s.is_active = TRUE
WHERE d.is_active = TRUE
GROUP BY d.id, d.name;

-- ============================================
-- ХРАНИМЫЕ ПРОЦЕДУРЫ
-- ============================================

-- Процедура: Регистрация прохода
DELIMITER //
CREATE PROCEDURE sp_register_access(
    IN p_access_point_id INT,
    IN p_person_type ENUM('student', 'employee', 'guest'),
    IN p_person_id INT,
    IN p_person_name VARCHAR(200),
    IN p_card_number VARCHAR(50),
    IN p_direction ENUM('in', 'out')
)
BEGIN
    INSERT INTO access_logs (
        access_point_id, 
        person_type, 
        person_id, 
        person_name, 
        card_number, 
        direction, 
        access_time
    ) VALUES (
        p_access_point_id,
        p_person_type,
        p_person_id,
        p_person_name,
        p_card_number,
        p_direction,
        NOW()
    );
END //
DELIMITER ;

-- Процедура: Занять парковочное место
DELIMITER //
CREATE PROCEDURE sp_occupy_parking_spot(
    IN p_spot_number VARCHAR(20),
    IN p_vehicle_number VARCHAR(20),
    IN p_owner_type ENUM('student', 'employee', 'guest'),
    IN p_owner_id INT
)
BEGIN
    UPDATE parking_spots
    SET 
        is_occupied = TRUE,
        vehicle_number = p_vehicle_number,
        owner_type = p_owner_type,
        owner_id = p_owner_id,
        occupied_at = NOW()
    WHERE spot_number = p_spot_number
    AND is_occupied = FALSE;
    
    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Парковочное место недоступно';
    END IF;
END //
DELIMITER ;

-- Процедура: Освободить парковочное место
DELIMITER //
CREATE PROCEDURE sp_free_parking_spot(
    IN p_spot_number VARCHAR(20)
)
BEGIN
    UPDATE parking_spots
    SET 
        is_occupied = FALSE,
        vehicle_number = NULL,
        owner_type = NULL,
        owner_id = NULL,
        occupied_at = NULL
    WHERE spot_number = p_spot_number;
END //
DELIMITER ;

-- Процедура: Получить статистику пользователей
DELIMITER //
CREATE PROCEDURE sp_get_user_statistics()
BEGIN
    SELECT 
        COUNT(*) AS total_users,
        SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active_users,
        SUM(CASE WHEN NOT is_active THEN 1 ELSE 0 END) AS inactive_users,
        SUM(CASE WHEN auth_type = 'local' THEN 1 ELSE 0 END) AS local_users,
        SUM(CASE WHEN auth_type = 'sso' THEN 1 ELSE 0 END) AS sso_users
    FROM users;
    
    SELECT 
        r.display_name AS role_name,
        COUNT(u.id) AS user_count
    FROM roles r
    LEFT JOIN users u ON u.role_name = r.name
    GROUP BY r.name, r.display_name
    ORDER BY user_count DESC;
END //
DELIMITER ;

-- ============================================
-- ТРИГГЕРЫ
-- ============================================

-- Триггер: Аудит создания пользователя
DELIMITER //
CREATE TRIGGER tr_user_after_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values)
    VALUES (NEW.id, 'CREATE', 'user', NEW.id, JSON_OBJECT(
        'username', NEW.username,
        'full_name', NEW.full_name,
        'email', NEW.email,
        'role_name', NEW.role_name,
        'auth_type', NEW.auth_type,
        'is_active', NEW.is_active
    ));
END //
DELIMITER ;

-- Триггер: Аудит обновления пользователя
DELIMITER //
CREATE TRIGGER tr_user_after_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_values, new_values)
    VALUES (NEW.id, 'UPDATE', 'user', NEW.id, 
    JSON_OBJECT(
        'username', OLD.username,
        'full_name', OLD.full_name,
        'email', OLD.email,
        'role_name', OLD.role_name,
        'is_active', OLD.is_active
    ),
    JSON_OBJECT(
        'username', NEW.username,
        'full_name', NEW.full_name,
        'email', NEW.email,
        'role_name', NEW.role_name,
        'is_active', NEW.is_active
    ));
END //
DELIMITER ;

-- Триггер: Аудит удаления пользователя
DELIMITER //
CREATE TRIGGER tr_user_after_delete
AFTER DELETE ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_values)
    VALUES (OLD.id, 'DELETE', 'user', OLD.id, JSON_OBJECT(
        'username', OLD.username,
        'full_name', OLD.full_name,
        'email', OLD.email,
        'role_name', OLD.role_name
    ));
END //
DELIMITER ;

-- ============================================
-- ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ
-- ============================================

-- Составной индекс для быстрого поиска пользователей
CREATE INDEX idx_users_search ON users(username, email, full_name);

-- Индекс для быстрого поиска проходов по времени
CREATE INDEX idx_access_logs_time_range ON access_logs(access_time, person_type, access_point_id);

-- Индекс для аудита
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id, created_at);

-- ============================================
-- КОММЕНТАРИИ К ТАБЛИЦАМ
-- ============================================
ALTER TABLE roles COMMENT 'Роли пользователей с правами доступа';
ALTER TABLE users COMMENT 'Пользователи системы';
ALTER TABLE sessions COMMENT 'Активные сессии пользователей';
ALTER TABLE audit_log COMMENT 'Журнал аудита всех действий';
ALTER TABLE students COMMENT 'Студенты университета';
ALTER TABLE employees COMMENT 'Сотрудники университета';
ALTER TABLE dormitories COMMENT 'Общежития университета';
ALTER TABLE access_points COMMENT 'Точки доступа (турникеты, входы)';
ALTER TABLE access_logs COMMENT 'Журнал проходов через точки доступа';
ALTER TABLE parking_spots COMMENT 'Парковочные места';
ALTER TABLE storage_lockers COMMENT 'Ячейки хранения вещей';

-- ============================================
-- КОНЕЦ СКРИПТА
-- ============================================
