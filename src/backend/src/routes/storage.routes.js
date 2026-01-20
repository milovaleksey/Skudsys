const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('storage'));

router.get('/lockers', (req, res) => {
  res.json({ success: true, message: 'GET /storage/lockers - список ячеек хранения' });
});

module.exports = router;
