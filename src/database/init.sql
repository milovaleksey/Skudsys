-- ============================================================================
-- Инициализация базы данных UTMN Security
-- ============================================================================

-- Удаление существующих таблиц (осторожно!)
-- SET FOREIGN_KEY_CHECKS = 0;
-- DROP TABLE IF EXISTS audit_log, sessions, access_logs, storage_lockers, parking_spots, access_points, dormitories, employees, students, users, roles;
-- SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- ТАБЛИЦА: roles - Роли пользователей
-- ============================================================================

CREATE TABLE IF NOT EXISTS `roles` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `displayName` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `permissions` JSON NOT NULL,
  `isSystem` BOOLEAN DEFAULT FALSE,
  `externalGroups` JSON DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ТАБЛИЦА: users - Пользователи системы
-- ============================================================================

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `fullName` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `role` VARCHAR(50) NOT NULL,
  `authType` ENUM('local', 'sso') DEFAULT 'local',
  `avatar` VARCHAR(255) DEFAULT NULL,
  `isActive` BOOLEAN DEFAULT TRUE,
  `lastLogin` TIMESTAMP NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`role`) REFERENCES `roles`(`name`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`),
  INDEX `idx_isActive` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ТАБЛИЦА: sessions - Активные сессии пользователей
-- ============================================================================

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `token` VARCHAR(500) NOT NULL,
  `refreshToken` VARCHAR(500) DEFAULT NULL,
  `ipAddress` VARCHAR(45) DEFAULT NULL,
  `userAgent` TEXT DEFAULT NULL,
  `expiresAt` TIMESTAMP NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_userId` (`userId`),
  INDEX `idx_token` (`token`(255)),
  INDEX `idx_expiresAt` (`expiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ТАБЛИЦА: students - Студенты университета
-- ============================================================================

CREATE TABLE IF NOT EXISTS `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `studentId` VARCHAR(20) NOT NULL UNIQUE,
  `lastName` VARCHAR(50) NOT NULL,
  `firstName` VARCHAR(50) NOT NULL,
  `middleName` VARCHAR(50) DEFAULT NULL,
  `dateOfBirth` DATE NOT NULL,
  `gender` ENUM('male', 'female') NOT NULL,
  `nationality` VARCHAR(50) DEFAULT 'Россия',
  `isForeign` BOOLEAN DEFAULT FALSE,
  `faculty` VARCHAR(100) NOT NULL,
  `specialization` VARCHAR(100) NOT NULL,
  `course` TINYINT NOT NULL,
  `group` VARCHAR(20) NOT NULL,
  `enrollmentDate` DATE NOT NULL,
  `status` ENUM('active', 'academic_leave', 'expelled', 'graduated') DEFAULT 'active',
  `cardNumber` VARCHAR(50) DEFAULT NULL UNIQUE,
  `phoneNumber` VARCHAR(20) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_studentId` (`studentId`),
  INDEX `idx_lastName` (`lastName`),
  INDEX `idx_cardNumber` (`cardNumber`),
  INDEX `idx_faculty` (`faculty`),
  INDEX `idx_status` (`status`),
  INDEX `idx_isForeign` (`isForeign`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ТАБЛИЦА: employees - Сотрудники университета
-- ============================================================================

CREATE TABLE IF NOT EXISTS `employees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employeeId` VARCHAR(20) NOT NULL UNIQUE,
  `lastName` VARCHAR(50) NOT NULL,
  `firstName` VARCHAR(50) NOT NULL,
  `middleName` VARCHAR(50) DEFAULT NULL,
  `dateOfBirth` DATE NOT NULL,
  `gender` ENUM('male', 'female') NOT NULL,
  `position` VARCHAR(100) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `hireDate` DATE NOT NULL,
  `status` ENUM('active', 'vacation', 'sick_leave', 'dismissed') DEFAULT 'active',
  `cardNumber` VARCHAR(50) DEFAULT NULL UNIQUE,
  `phoneNumber` VARCHAR(20) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_employeeId` (`employeeId`),
  INDEX `idx_lastName` (`lastName`),
  INDEX `idx_cardNumber` (`cardNumber`),
  INDEX `idx_department` (`department`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ТАБЛИЦА: dormitories - Общежития
-- ============================================================================

CREATE TABLE IF NOT EXISTS `dormitories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `number` VARCHAR(10) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `totalRooms` INT NOT NULL,
  `totalBeds` INT NOT NULL,
  `occupiedBeds` INT DEFAULT 0,
  `description` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_number` (`number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ТАБЛИЦА: access_points - Точки доступа (турникеты)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `access_points` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `location` VARCHAR(100) NOT NULL,
  `building` VARCHAR(50) NOT NULL,
  `floor` VARCHAR(10) DEFAULT NULL,
  `type` ENUM('entrance', 'exit', 'both') DEFAULT 'both',
  `isActive` BOOLEAN DEFAULT TRUE,
  `description` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_code` (`code`),
  INDEX `idx_building` (`building`),
  INDEX `idx_isActive` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ТАБЛИЦА: access_logs - Журнал проходов
-- ============================================================================

CREATE TABLE IF NOT EXISTS `access_logs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `accessPointId` INT NOT NULL,
  `cardNumber` VARCHAR(50) NOT NULL,
  `personType` ENUM('student', 'employee', 'unknown') NOT NULL,
  `personId` INT DEFAULT NULL,
  `personName` VARCHAR(150) DEFAULT NULL,
  `direction` ENUM('in', 'out') NOT NULL,
  `accessTime` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('granted', 'denied') DEFAULT 'granted',
  `denialReason` VARCHAR(255) DEFAULT NULL,
  FOREIGN KEY (`accessPointId`) REFERENCES `access_points`(`id`) ON DELETE CASCADE,
  INDEX `idx_cardNumber` (`cardNumber`),
  INDEX `idx_accessTime` (`accessTime`),
  INDEX `idx_accessPointId` (`accessPointId`),
  INDEX `idx_personType` (`personType`),
  INDEX `idx_status` (`status`),
  INDEX `idx_composite` (`accessTime`, `accessPointId`, `cardNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ТАБЛИЦА: parking_spots - Парковочные места
-- ============================================================================

CREATE TABLE IF NOT EXISTS `parking_spots` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `spotNumber` VARCHAR(20) NOT NULL UNIQUE,
  `zone` VARCHAR(50) NOT NULL,
  `type` ENUM('standard', 'disabled', 'electric', 'visitor') DEFAULT 'standard',
  `status` ENUM('free', 'occupied', 'reserved', 'maintenance') DEFAULT 'free',
  `occupiedBy` INT DEFAULT NULL,
  `occupiedByType` ENUM('student', 'employee') DEFAULT NULL,
  `vehicleNumber` VARCHAR(20) DEFAULT NULL,
  `occupiedAt` TIMESTAMP NULL,
  `description` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_spotNumber` (`spotNumber`),
  INDEX `idx_zone` (`zone`),
  INDEX `idx_status` (`status`),
  INDEX `idx_vehicleNumber` (`vehicleNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ТАБЛИЦА: storage_lockers - Ячейки хранения вещей
-- ============================================================================

CREATE TABLE IF NOT EXISTS `storage_lockers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `lockerNumber` VARCHAR(20) NOT NULL UNIQUE,
  `location` VARCHAR(100) NOT NULL,
  `size` ENUM('small', 'medium', 'large') DEFAULT 'medium',
  `status` ENUM('free', 'occupied', 'maintenance') DEFAULT 'free',
  `occupiedBy` INT DEFAULT NULL,
  `occupiedByType` ENUM('student', 'employee') DEFAULT NULL,
  `occupiedByName` VARCHAR(150) DEFAULT NULL,
  `occupiedAt` TIMESTAMP NULL,
  `expiresAt` TIMESTAMP NULL,
  `description` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_lockerNumber` (`lockerNumber`),
  INDEX `idx_location` (`location`),
  INDEX `idx_status` (`status`),
  INDEX `idx_expiresAt` (`expiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ТАБЛИЦА: audit_log - Журнал аудита действий
-- ============================================================================

CREATE TABLE IF NOT EXISTS `audit_log` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `username` VARCHAR(50) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity` VARCHAR(50) NOT NULL,
  `entityId` VARCHAR(50) DEFAULT NULL,
  `changes` JSON DEFAULT NULL,
  `ipAddress` VARCHAR(45) DEFAULT NULL,
  `userAgent` TEXT DEFAULT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_userId` (`userId`),
  INDEX `idx_timestamp` (`timestamp`),
  INDEX `idx_action` (`action`),
  INDEX `idx_entity` (`entity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- НАЧАЛЬНЫЕ ДАННЫЕ: Роли
-- ============================================================================

INSERT INTO `roles` (`id`, `name`, `displayName`, `description`, `permissions`, `isSystem`) VALUES
('admin', 'admin', 'Администратор', 'Полный доступ ко всем функциям системы', 
 '["dashboard", "dashboard-builder", "passes", "identifier-search", "location", "analytics", "parking", "storage", "foreign-students", "students", "employees", "users-settings", "roles-settings", "user-logs"]', 
 TRUE),
 
('security', 'security', 'Безопасность', 'Доступ к системам безопасности и контроля доступа', 
 '["dashboard", "passes", "identifier-search", "location", "parking", "storage"]', 
 TRUE),
 
('manager', 'manager', 'Менеджер', 'Доступ к аналитике и отчетам', 
 '["dashboard", "analytics", "students", "employees", "foreign-students"]', 
 TRUE),
 
('operator', 'operator', 'Оператор', 'Доступ к просмотру и работе с данными', 
 '["dashboard", "passes", "identifier-search", "location", "students", "employees"]', 
 TRUE),
 
('viewer', 'viewer', 'Наблюдатель', 'Только просмотр общей информации', 
 '["dashboard", "analytics"]', 
 TRUE)
ON DUPLICATE KEY UPDATE
  `displayName` = VALUES(`displayName`),
  `description` = VALUES(`description`),
  `permissions` = VALUES(`permissions`);

-- ============================================================================
-- НАЧАЛЬНЫЕ ДАННЫЕ: Пользователи
-- ============================================================================

-- Пароль для тестового администратора: Admin2025
-- bcrypt hash с rounds=10
INSERT INTO `users` (`username`, `password`, `fullName`, `email`, `role`, `authType`, `isActive`) VALUES
('admin', '$2b$10$rXH.JnKZ9yP4YHxL5Jh3.OGqVzJK9.gGHrN0J8aWKq5xT7LnM0JDO', 'Администратор системы', 'admin@utmn.ru', 'admin', 'local', TRUE)
ON DUPLICATE KEY UPDATE
  `fullName` = VALUES(`fullName`),
  `email` = VALUES(`email`),
  `role` = VALUES(`role`);

-- ============================================================================
-- НАЧАЛЬНЫЕ ДАННЫЕ: Точки доступа (примеры)
-- ============================================================================

INSERT INTO `access_points` (`code`, `name`, `location`, `building`, `type`, `isActive`) VALUES
('MAIN-001', 'Главный вход', 'Главный корпус, центральный вход', 'Главный корпус', 'both', TRUE),
('MAIN-002', 'Вход со стороны парковки', 'Главный корпус, боковой вход', 'Главный корпус', 'both', TRUE),
('LIB-001', 'Вход в библиотеку', 'Библиотека, 1 этаж', 'Библиотека', 'both', TRUE),
('DORM-001', 'Общежитие №1, центральный вход', 'Общежитие №1', 'Общежитие №1', 'both', TRUE)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `location` = VALUES(`location`);

-- ============================================================================
-- НАЧАЛЬНЫЕ ДАННЫЕ: Общежития (примеры)
-- ============================================================================

INSERT INTO `dormitories` (`number`, `name`, `address`, `totalRooms`, `totalBeds`) VALUES
('1', 'Общежитие №1', 'ул. Ленина, д. 25', 100, 200),
('2', 'Общежитие №2', 'ул. Республики, д. 47', 120, 240),
('3', 'Общежитие №3', 'ул. Мельникайте, д. 70', 90, 180)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `address` = VALUES(`address`);

-- ============================================================================
-- ПРЕДСТАВЛЕНИЯ (VIEWS)
-- ============================================================================

-- Представление: Пользователи с информацией о ролях
CREATE OR REPLACE VIEW `v_users_with_roles` AS
SELECT 
  u.`id`,
  u.`username`,
  u.`fullName`,
  u.`email`,
  u.`role` AS roleName,
  r.`displayName` AS roleDisplayName,
  r.`permissions`,
  u.`authType`,
  u.`isActive`,
  u.`lastLogin`,
  u.`createdAt`
FROM `users` u
LEFT JOIN `roles` r ON u.`role` = r.`name`;

-- Представление: Статистика проходов за сегодня
CREATE OR REPLACE VIEW `v_today_access_stats` AS
SELECT 
  DATE(accessTime) AS date,
  accessPointId,
  ap.name AS accessPointName,
  direction,
  COUNT(*) AS count
FROM `access_logs` al
LEFT JOIN `access_points` ap ON al.accessPointId = ap.id
WHERE DATE(accessTime) = CURDATE()
GROUP BY DATE(accessTime), accessPointId, direction;

-- Представление: Статистика парковки
CREATE OR REPLACE VIEW `v_parking_stats` AS
SELECT 
  zone,
  type,
  COUNT(*) AS total,
  SUM(CASE WHEN status = 'free' THEN 1 ELSE 0 END) AS free,
  SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) AS occupied,
  SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) AS reserved
FROM `parking_spots`
GROUP BY zone, type;

-- ============================================================================
-- ПРОЦЕДУРЫ (STORED PROCEDURES) - опционально
-- ============================================================================

-- Процедура: Регистрация прохода
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS `sp_register_access`(
  IN p_accessPointId INT,
  IN p_cardNumber VARCHAR(50),
  IN p_direction ENUM('in', 'out')
)
BEGIN
  DECLARE v_personType ENUM('student', 'employee', 'unknown');
  DECLARE v_personId INT;
  DECLARE v_personName VARCHAR(150);
  
  -- Поиск в студентах
  SELECT 'student', id, CONCAT(lastName, ' ', firstName) 
  INTO v_personType, v_personId, v_personName
  FROM students 
  WHERE cardNumber = p_cardNumber AND status = 'active'
  LIMIT 1;
  
  -- Если не найден, поис�� в сотрудниках
  IF v_personId IS NULL THEN
    SELECT 'employee', id, CONCAT(lastName, ' ', firstName)
    INTO v_personType, v_personId, v_personName
    FROM employees 
    WHERE cardNumber = p_cardNumber AND status = 'active'
    LIMIT 1;
  END IF;
  
  -- Если не найден, отмечаем как unknown
  IF v_personId IS NULL THEN
    SET v_personType = 'unknown';
  END IF;
  
  -- Вставка записи
  INSERT INTO access_logs 
    (accessPointId, cardNumber, personType, personId, personName, direction)
  VALUES 
    (p_accessPointId, p_cardNumber, v_personType, v_personId, v_personName, p_direction);
  
END //
DELIMITER ;

-- ============================================================================
-- ЗАВЕРШЕНИЕ
-- ============================================================================

-- Оптимизация таблиц
ANALYZE TABLE roles, users, students, employees, access_logs, parking_spots, storage_lockers;

SELECT 'База данных UTMN Security успешно инициализирована!' AS message;
