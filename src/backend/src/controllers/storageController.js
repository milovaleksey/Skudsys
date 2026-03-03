/**
 * Storage Systems Controller
 * Manages storage systems (for clothes and items) without database
 * All data comes from MQTT and stored in memory
 */

const logger = require('../utils/logger');

// In-memory storage for systems
let storageSystems = [];
let lastConfigUpdate = null;

/**
 * Set storage systems from MQTT config
 * Called by MQTT service when config is received
 */
exports.setStorageSystems = (systems) => {
  storageSystems = systems.map(system => ({
    ...system,
    occupied_count: system.occupied_count || 0,
    status: system.status || 'active',
    updated_at: new Date().toISOString()
  }));
  lastConfigUpdate = new Date().toISOString();
  logger.info(`Storage systems configuration updated: ${storageSystems.length} systems loaded`);
};

/**
 * Get all storage systems
 * GET /v1/storage/systems
 */
exports.getAllStorageSystems = async (req, res) => {
  try {
    res.json({
      success: true,
      data: storageSystems,
      total: storageSystems.length,
      lastConfigUpdate
    });
  } catch (error) {
    logger.error('Error fetching storage systems:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении систем хранения',
      error: error.message
    });
  }
};

/**
 * Get storage system by ID
 * GET /v1/storage/systems/:id
 */
exports.getStorageSystemById = async (req, res) => {
  try {
    const { id } = req.params;
    const system = storageSystems.find(s => s.id === parseInt(id));

    if (!system) {
      return res.status(404).json({
        success: false,
        message: 'Система хранения не найдена'
      });
    }

    res.json({
      success: true,
      data: system
    });
  } catch (error) {
    logger.error('Error fetching storage system by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении системы хранения',
      error: error.message
    });
  }
};

/**
 * Update occupancy from MQTT
 * This is called by MQTT service when occupancy message is received
 */
exports.updateOccupancy = async (topic, occupiedCount) => {
  try {
    const system = storageSystems.find(s => s.mqtt_topic_occupancy === topic);

    if (!system) {
      logger.warn(`No storage system found for MQTT topic: ${topic}`);
      return;
    }

    system.occupied_count = occupiedCount;
    system.updated_at = new Date().toISOString();

    logger.info(`Updated storage system ${system.id} (${system.name}) occupancy: ${occupiedCount}/${system.total_capacity}`);
  } catch (error) {
    logger.error('Error updating storage occupancy:', error);
  }
};

/**
 * Update status from MQTT
 * This is called by MQTT service when status message is received
 */
exports.updateStatus = async (topic, status) => {
  try {
    const system = storageSystems.find(s => s.mqtt_topic_status === topic);

    if (!system) {
      logger.warn(`No storage system found for MQTT topic: ${topic}`);
      return;
    }

    system.status = status;
    system.updated_at = new Date().toISOString();

    logger.info(`Updated storage system ${system.id} (${system.name}) status: ${status}`);
  } catch (error) {
    logger.error('Error updating storage status:', error);
  }
};

/**
 * Get storage statistics
 * GET /v1/storage/statistics
 */
exports.getStorageStatistics = async (req, res) => {
  try {
    // Overall statistics
    const overall = {
      total_systems: storageSystems.length,
      total_capacity: storageSystems.reduce((sum, s) => sum + (s.total_capacity || 0), 0),
      total_occupied: storageSystems.reduce((sum, s) => sum + (s.occupied_count || 0), 0),
      total_available: 0,
      active_systems: storageSystems.filter(s => s.status === 'active').length,
      inactive_systems: storageSystems.filter(s => s.status === 'inactive').length
    };
    overall.total_available = overall.total_capacity - overall.total_occupied;

    // By type
    const byTypeMap = {};
    storageSystems.forEach(system => {
      if (!byTypeMap[system.type]) {
        byTypeMap[system.type] = {
          type: system.type,
          count: 0,
          total_capacity: 0,
          occupied_count: 0,
          available_count: 0
        };
      }
      byTypeMap[system.type].count++;
      byTypeMap[system.type].total_capacity += system.total_capacity || 0;
      byTypeMap[system.type].occupied_count += system.occupied_count || 0;
    });
    const byType = Object.values(byTypeMap);
    byType.forEach(item => {
      item.available_count = item.total_capacity - item.occupied_count;
    });

    // By building
    const byBuildingMap = {};
    storageSystems.forEach(system => {
      if (!byBuildingMap[system.building]) {
        byBuildingMap[system.building] = {
          building: system.building,
          count: 0,
          total_capacity: 0,
          occupied_count: 0,
          available_count: 0
        };
      }
      byBuildingMap[system.building].count++;
      byBuildingMap[system.building].total_capacity += system.total_capacity || 0;
      byBuildingMap[system.building].occupied_count += system.occupied_count || 0;
    });
    const byBuilding = Object.values(byBuildingMap);
    byBuilding.forEach(item => {
      item.available_count = item.total_capacity - item.occupied_count;
    });

    res.json({
      success: true,
      data: {
        overall,
        byType,
        byBuilding
      }
    });
  } catch (error) {
    logger.error('Error fetching storage statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении статистики',
      error: error.message
    });
  }
};

/**
 * Get all storage systems (for internal use)
 */
exports.getAllSystemsInternal = () => {
  return storageSystems;
};