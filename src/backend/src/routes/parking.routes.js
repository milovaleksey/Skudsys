const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('parking'));

router.get('/spots', (req, res) => {
  res.json({ success: true, message: 'GET /parking/spots - список парковочных мест' });
});

router.post('/occupy', (req, res) => {
  res.json({ success: true, message: 'POST /parking/occupy - занять место' });
});

router.post('/free', (req, res) => {
  res.json({ success: true, message: 'POST /parking/free - освободить место' });
});

module.exports = router;
