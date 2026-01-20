const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

// Все маршруты требуют авторизации
router.use(authenticate);
router.use(authorize('roles-settings', 'users-settings'));

// Заглушки для API ролей
router.get('/', (req, res) => {
  res.json({ success: true, message: 'GET /roles - получить список ролей' });
});

router.get('/:id', (req, res) => {
  res.json({ success: true, message: 'GET /roles/:id - получить роль по ID' });
});

router.post('/', authorize('roles-settings'), (req, res) => {
  res.json({ success: true, message: 'POST /roles - создать роль' });
});

router.put('/:id', authorize('roles-settings'), (req, res) => {
  res.json({ success: true, message: 'PUT /roles/:id - обновить роль' });
});

router.delete('/:id', authorize('roles-settings'), (req, res) => {
  res.json({ success: true, message: 'DELETE /roles/:id - удалить роль' });
});

router.get('/permissions', (req, res) => {
  res.json({ success: true, message: 'GET /roles/permissions - список прав' });
});

module.exports = router;
