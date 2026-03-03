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

module.exports = router;