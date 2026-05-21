/**
 * Роуты для работы с данными СКУД
 * Все роуты требуют аутентификации и проверки прав доступа
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permissions');
const skudController = require('../controllers/skudController');

// Поиск по идентификатору (номер карты, сотрудника и т.д.)
router.get(
  '/search',
  authenticate,
  checkPermission('identifier-search'),
  skudController.searchByIdentifier
);

// Журнал проходов
router.get(
  '/passes',
  authenticate,
  checkPermission('passes'),
  skudController.getPassesReport
);

// Местоположение человека
router.get(
  '/location',
  authenticate,
  checkPermission('location'),
  skudController.getPersonLocation
);

// Местоположение по ФИО (хранимая процедура sp_get_last_entry_event)
router.get(
  '/location/by-fio',
  authenticate,
  checkPermission('location'),
  skudController.getLocationByFio
);

// Местоположение по UPN (хранимая процедура sp_get_last_entry_by_upn)
router.get(
  '/location/by-upn',
  authenticate,
  checkPermission('location'),
  skudController.getLocationByUpn
);

// Список точек доступа
router.get(
  '/access-points',
  authenticate,
  checkPermission('passes'),
  skudController.getAccessPoints
);

// Журнал проходов по ФИО (хранимая процедура sp_get_passes_by_fio)
router.get(
  '/passes/by-fio',
  authenticate,
  checkPermission('passes'),
  skudController.getPassesByFio
);

// Журнал проходов по UPN (хранимая процедура sp_get_passes_by_upn)
router.get(
  '/passes/by-upn',
  authenticate,
  checkPermission('passes'),
  skudController.getPassesByUpn
);

// ===== ОТЧЕТЫ ПО СТУДЕНТАМ =====

// Журнал проходов СТУДЕНТОВ по ФИО (хранимая процедура sp_get_students_passes_by_fio)
router.get(
  '/students-passes/by-fio',
  authenticate,
  checkPermission('passes'),
  skudController.getStudentsPassesByFio
);

// Журнал проходов СТУДЕНТОВ по UPN (хранимая процедура sp_get_students_passes_by_upn)
router.get(
  '/students-passes/by-upn',
  authenticate,
  checkPermission('passes'),
  skudController.getStudentsPassesByUpn
);

// ===== ОТЧЕТЫ ПО СОТРУДНИКАМ =====

// Журнал проходов СОТРУДНИКОВ по ФИО (хранимая процедура sp_get_employees_passes_by_fio)
router.get(
  '/employees-passes/by-fio',
  authenticate,
  checkPermission('passes'),
  skudController.getEmployeesPassesByFio
);

// Журнал проходов СОТРУДНИКОВ по UPN (хранимая процедура sp_get_employees_passes_by_upn)
router.get(
  '/employees-passes/by-upn',
  authenticate,
  checkPermission('passes'),
  skudController.getEmployeesPassesByUpn
);

// ===== ОТЧЕТЫ ПО ИНОСТРАННЫМ СТУДЕНТАМ =====

// Журнал проходов ИНОСТРАННЫХ СТУДЕНТОВ по ФИО (хранимая процедура sp_get_foreign_students_passes_by_fio)
router.get(
  '/foreign-students-passes/by-fio',
  authenticate,
  checkPermission('passes'),
  skudController.getForeignStudentsPassesByFio
);

// Журнал проходов ИНОСТРАННЫХ СТУДЕНТОВ по UPN (хранимая процедура sp_get_foreign_students_passes_by_upn)
router.get(
  '/foreign-students-passes/by-upn',
  authenticate,
  checkPermission('passes'),
  skudController.getForeignStudentsPassesByUpn
);

// ===== АНАЛИТИКА =====

// Временные ряды проходов (по дням)
router.get(
  '/analytics/time-series',
  authenticate,
  checkPermission('analytics'),
  skudController.getPassesTimeSeries
);

// Распределение проходов по часам
router.get(
  '/analytics/hourly',
  authenticate,
  checkPermission('analytics'),
  skudController.getPassesHourly
);

// Топ локаций по активности
router.get(
  '/analytics/top-locations',
  authenticate,
  checkPermission('analytics'),
  skudController.getTopLocations
);

// Общая статистика по проходам
router.get(
  '/analytics/statistics',
  authenticate,
  checkPermission('analytics'),
  skudController.getAnalyticsStatistics
);

// Распределение по дням недели
router.get(
  '/analytics/weekday-pattern',
  authenticate,
  checkPermission('analytics'),
  skudController.getWeekdayPattern
);

// Сравнение нескольких локаций
router.get(
  '/analytics/locations-comparison',
  authenticate,
  checkPermission('analytics'),
  skudController.getLocationsComparison
);

module.exports = router;