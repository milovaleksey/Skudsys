const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('employees'));

router.get('/', (req, res) => {
  res.json({ success: true, message: 'GET /employees - список сотрудников' });
});

module.exports = router;
