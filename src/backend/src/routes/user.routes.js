const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Все маршруты требуют авторизации и прав users-settings
router.use(authenticate);
router.use(authorize('users-settings'));

// GET /users - получить список пользователей
router.get('/', userController.getUsers);

// GET /users/statistics - статистика пользователей
router.get('/statistics', userController.getUserStatistics);

// GET /users/:id - получить пользователя по ID
router.get('/:id', userController.getUserById);

// POST /users - создать пользователя
router.post('/', userController.createUser);

// PUT /users/:id - обновить пользователя
router.put('/:id', userController.updateUser);

// DELETE /users/:id - удалить пользователя
router.delete('/:id', userController.deleteUser);

module.exports = router;
