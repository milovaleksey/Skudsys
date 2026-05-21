const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('students', 'foreign-students'));

router.get('/', (req, res) => {
  res.json({ success: true, message: 'GET /students - список студентов' });
});

router.get('/statistics', authorize('students', 'analytics'), (req, res) => {
  res.json({ success: true, message: 'GET /students/statistics - статистика' });
});

module.exports = router;
