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

// Список точек доступа
router.get(
  '/access-points',
  authenticate,
  checkPermission('passes'),
  skudController.getAccessPoints
);

module.exports = router;
