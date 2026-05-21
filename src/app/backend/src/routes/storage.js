/**
 * Storage Systems Routes
 * Routes for managing storage systems (clothes and items)
 */

const express = require('express');
const router = express.Router();
const storageController = require('../controllers/storageController');
const { verifyToken } = require('../middleware/auth');

// Public routes (read-only for all authenticated users)
router.get('/systems', verifyToken, storageController.getAllStorageSystems);
router.get('/systems/:id', verifyToken, storageController.getStorageSystemById);
router.get('/statistics', verifyToken, storageController.getStorageStatistics);

// Admin only routes (create, update, delete)
const { requireRole } = require('../middleware/auth');

router.post('/systems', verifyToken, requireRole(['admin']), storageController.createStorageSystem);
router.put('/systems/:id', verifyToken, requireRole(['admin']), storageController.updateStorageSystem);
router.delete('/systems/:id', verifyToken, requireRole(['admin']), storageController.deleteStorageSystem);

module.exports = router;
