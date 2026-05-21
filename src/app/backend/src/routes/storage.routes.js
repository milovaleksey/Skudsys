/**
 * Storage Systems Routes
 * Routes for managing storage systems (clothes and items)
 * Configuration comes from MQTT, only read operations available
 */

const express = require('express');
const router = express.Router();
const storageController = require('../controllers/storageController');
const { authenticate, authorize } = require('../middleware/auth');

// All storage routes require authentication
router.use(authenticate);

// Read-only routes (all authenticated users with storage permission)
router.get('/systems', authorize('storage'), storageController.getAllStorageSystems);
router.get('/systems/:id', authorize('storage'), storageController.getStorageSystemById);
router.get('/statistics', authorize('storage'), storageController.getStorageStatistics);

// Note: Create, update, and delete operations are not available
// Configuration is managed through MQTT topic: storage/config

module.exports = router;