const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Все маршруты требуют аутентификации
router.use(authenticate);

// Доступ только для администраторов и безопасности
router.use(authorize('admin', 'security'));

// Получить журнал аудита
router.get('/', auditController.getLogs);

// Получить опции фильтрации
router.get('/filters', auditController.getFilterOptions);

module.exports = router;
