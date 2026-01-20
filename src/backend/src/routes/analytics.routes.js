const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('dashboard', 'analytics'));

router.get('/dashboard', (req, res) => {
  res.json({ success: true, message: 'GET /analytics/dashboard - данные для главной панели' });
});

module.exports = router;
