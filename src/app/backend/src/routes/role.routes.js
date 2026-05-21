const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Все маршруты требуют авторизации
router.use(authenticate);

// GET /roles - получить список всех ролей
router.get('/', roleController.getRoles);

// GET /roles/permissions - получить список всех прав
router.get('/permissions', roleController.getPermissions);

// GET /roles/:id - получить роль по ID
router.get('/:id', roleController.getRoleById);

// POST /roles - создать роль (только для пользователей с правом roles-settings)
router.post('/', authorize('roles-settings'), roleController.createRole);

// PUT /roles/:id - обновить роль (только для пользователей с правом roles-settings)
router.put('/:id', authorize('roles-settings'), roleController.updateRole);

// DELETE /roles/:id - удалить роль (только для пользователей с правом roles-settings)
router.delete('/:id', authorize('roles-settings'), roleController.deleteRole);

module.exports = router;