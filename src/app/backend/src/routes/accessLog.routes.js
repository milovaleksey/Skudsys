const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('passes'));

router.get('/', (req, res) => {
  res.json({ success: true, message: 'GET /access-logs - журнал проходов' });
});

router.get('/statistics', authorize('passes', 'analytics'), (req, res) => {
  res.json({ success: true, message: 'GET /access-logs/statistics - статистика проходов' });
});

module.exports = router;
