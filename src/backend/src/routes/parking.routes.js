const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const parkingMQTTService = require('../services/parking-mqtt.service');

router.use(authenticate);
router.use(authorize('parking'));

// Получить статистику парковок
router.get('/statistics', (req, res) => {
  try {
    const parkings = parkingMQTTService.getParkings();
    
    const statistics = {
      totalParking: parkings.length,
      totalOccupied: parkings.reduce((sum, p) => sum + p.currentCount, 0),
      totalCapacity: parkings.reduce((sum, p) => sum + p.maxCapacity, 0),
      parkings: parkings.map(p => ({
        id: p.id,
        name: p.name,
        occupied: p.currentCount,
        capacity: p.maxCapacity,
        percentage: p.maxCapacity > 0 ? Math.round((p.currentCount / p.maxCapacity) * 100) : 0
      }))
    };
    
    res.json({ success: true, data: statistics });
  } catch (error) {
    console.error('[Parking Routes] Ошибка получения статистики:', error);
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'PARKING_STATS_ERROR',
        message: 'Ошибка получения статистики парковок' 
      } 
    });
  }
});

// Получить статус MQTT сервиса
router.get('/status', (req, res) => {
  try {
    const connected = parkingMQTTService.isConnected;
    const parkings = parkingMQTTService.getParkings();
    
    res.json({ 
      success: true, 
      data: {
        connected,
        parkingsCount: parkings.length,
        totalVehicles: parkings.reduce((sum, p) => sum + p.currentCount, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'PARKING_STATUS_ERROR',
        message: 'Ошибка получения статуса парковок' 
      } 
    });
  }
});

// Получить список всех парковок с транспортом
router.get('/parkings', (req, res) => {
  try {
    const parkings = parkingMQTTService.getParkings();
    res.json({ success: true, data: parkings });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'PARKING_LIST_ERROR',
        message: 'Ошибка получения списка парковок' 
      } 
    });
  }
});

// Получить данные конкретной парковки
router.get('/parkings/:id', (req, res) => {
  try {
    const parkings = parkingMQTTService.getParkings();
    const parking = parkings.find(p => p.id === req.params.id);
    
    if (!parking) {
      return res.status(404).json({ 
        success: false, 
        error: { 
          code: 'PARKING_NOT_FOUND',
          message: 'Парковка не найдена' 
        } 
      });
    }
    
    res.json({ success: true, data: parking });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'PARKING_GET_ERROR',
        message: 'Ошибка получения данных парковки' 
      } 
    });
  }
});

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