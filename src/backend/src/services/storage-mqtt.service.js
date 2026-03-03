/**
 * Storage MQTT Service
 * Handles MQTT subscriptions and updates for storage systems
 * All configuration comes from MQTT, no database required
 */

const mqtt = require('mqtt');
const logger = require('../utils/logger');
const storageController = require('../controllers/storageController');

// MQTT Topics
const CONFIG_TOPIC = 'storage/config'; // Topic for storage systems configuration

class StorageMQTTService {
  constructor() {
    this.client = null;
    this.subscribedTopics = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  /**
   * Connect to MQTT broker
   */
  connect() {
    const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
    const options = {
      clientId: `tyumgu_storage_${Math.random().toString(16).substr(2, 8)}`,
      clean: true,
      connectTimeout: 4000,
      username: process.env.MQTT_USERNAME || '',
      password: process.env.MQTT_PASSWORD || '',
      reconnectPeriod: 5000,
    };

    logger.info(`Connecting to Storage MQTT broker: ${brokerUrl}`);

    this.client = mqtt.connect(brokerUrl, options);

    this.client.on('connect', () => {
      logger.info('✅ Connected to Storage MQTT broker');
      this.reconnectAttempts = 0;
      
      // Subscribe to configuration topic
      this.subscribe(CONFIG_TOPIC);
      logger.info(`📡 Subscribed to storage configuration topic: ${CONFIG_TOPIC}`);
    });

    this.client.on('message', (topic, message) => {
      this.handleMessage(topic, message);
    });

    this.client.on('error', (error) => {
      logger.error('Storage MQTT connection error:', error);
    });

    this.client.on('reconnect', () => {
      this.reconnectAttempts++;
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        logger.info(`Attempting to reconnect to Storage MQTT broker (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      }
    });

    this.client.on('close', () => {
      logger.warn('Disconnected from Storage MQTT broker');
    });

    this.client.on('offline', () => {
      logger.warn('Storage MQTT client is offline');
    });
  }

  /**
   * Subscribe to a topic
   */
  subscribe(topic) {
    if (!this.client || !this.client.connected) {
      logger.warn('Cannot subscribe, MQTT client not connected');
      return;
    }

    if (this.subscribedTopics.has(topic)) {
      return; // Already subscribed
    }

    this.client.subscribe(topic, { qos: 1 }, (err) => {
      if (err) {
        logger.error(`Failed to subscribe to topic ${topic}:`, err);
      } else {
        this.subscribedTopics.add(topic);
        logger.info(`✅ Subscribed to storage topic: ${topic}`);
      }
    });
  }

  /**
   * Unsubscribe from a topic
   */
  unsubscribe(topic) {
    if (!this.client || !this.client.connected) {
      return;
    }

    if (!this.subscribedTopics.has(topic)) {
      return; // Not subscribed
    }

    this.client.unsubscribe(topic, (err) => {
      if (err) {
        logger.error(`Failed to unsubscribe from topic ${topic}:`, err);
      } else {
        this.subscribedTopics.delete(topic);
        logger.info(`Unsubscribed from storage topic: ${topic}`);
      }
    });
  }

  /**
   * Handle incoming MQTT message
   */
  async handleMessage(topic, message) {
    try {
      const payload = message.toString();
      logger.debug(`Storage MQTT message received on ${topic}`);

      // Handle configuration topic
      if (topic === CONFIG_TOPIC) {
        this.handleConfigUpdate(payload);
        return;
      }

      // Handle occupancy and status topics
      const systems = storageController.getAllSystemsInternal();
      
      // Check if it's a status topic
      const statusSystem = systems.find(s => s.mqtt_topic_status === topic);
      if (statusSystem) {
        await storageController.updateStatus(topic, payload);
        this.broadcastToWebSocket('storage-status', {
          topic,
          status: payload,
          systemId: statusSystem.id,
          systemName: statusSystem.name,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Check if it's an occupancy topic
      const occupancySystem = systems.find(s => s.mqtt_topic_occupancy === topic);
      if (occupancySystem) {
        const occupiedCount = parseInt(payload, 10);
        if (!isNaN(occupiedCount)) {
          await storageController.updateOccupancy(topic, occupiedCount);
          this.broadcastToWebSocket('storage-occupancy', {
            topic,
            occupiedCount,
            systemId: occupancySystem.id,
            systemName: occupancySystem.name,
            timestamp: new Date().toISOString()
          });
        }
        return;
      }

      logger.warn(`Received message on unknown storage topic: ${topic}`);
    } catch (error) {
      logger.error('Error handling storage MQTT message:', error);
    }
  }

  /**
   * Handle configuration update from MQTT
   */
  handleConfigUpdate(payload) {
    try {
      const config = JSON.parse(payload);
      
      if (!Array.isArray(config)) {
        logger.error('Storage config must be an array');
        return;
      }

      logger.info(`📦 Received storage configuration with ${config.length} systems`);

      // Validate configuration
      const validSystems = config.filter(system => {
        if (!system.id || !system.name || !system.type || !system.building) {
          logger.warn('Invalid storage system configuration:', system);
          return false;
        }
        return true;
      });

      // Update controller with new configuration
      storageController.setStorageSystems(validSystems);

      // Unsubscribe from old topics
      const oldTopics = Array.from(this.subscribedTopics).filter(t => t !== CONFIG_TOPIC);
      oldTopics.forEach(topic => this.unsubscribe(topic));

      // Subscribe to new topics
      validSystems.forEach(system => {
        if (system.mqtt_topic_status) {
          this.subscribe(system.mqtt_topic_status);
        }
        if (system.mqtt_topic_occupancy) {
          this.subscribe(system.mqtt_topic_occupancy);
        }
      });

      logger.info(`✅ Storage configuration updated: ${validSystems.length} systems loaded`);

      // Broadcast config update to WebSocket clients
      this.broadcastToWebSocket('storage_config', validSystems);

    } catch (error) {
      logger.error('Error parsing storage configuration:', error);
    }
  }

  /**
   * Broadcast update to WebSocket clients
   */
  broadcastToWebSocket(event, data) {
    const { broadcastStorageUpdate, getClientCount } = require('../websocket/storage.ws');
    if (broadcastStorageUpdate) {
      logger.info(`Broadcasting ${event} to ${getClientCount()} clients`);
      
      // For storage_config, data is array of systems
      // broadcastStorageUpdate will wrap it as {type: event, data: data}
      // But frontend expects {type: 'storage_config', storages: [...]}
      // So we need to pass {storages: data} as data parameter
      if (event === 'storage_config') {
        broadcastStorageUpdate(event, { storages: data });
      } else {
        broadcastStorageUpdate(event, data);
      }
    }
  }

  /**
   * Publish message to topic
   */
  publish(topic, message, options = {}) {
    if (!this.client || !this.client.connected) {
      logger.warn('Cannot publish, MQTT client not connected');
      return Promise.reject(new Error('MQTT client not connected'));
    }

    return new Promise((resolve, reject) => {
      this.client.publish(topic, message, { qos: 1, ...options }, (err) => {
        if (err) {
          logger.error(`Failed to publish to topic ${topic}:`, err);
          reject(err);
        } else {
          logger.info(`Published to storage topic ${topic}`);
          resolve();
        }
      });
    });
  }

  /**
   * Disconnect from MQTT broker
   */
  disconnect() {
    if (this.client) {
      this.client.end();
      logger.info('Disconnected from Storage MQTT broker');
    }
  }

  /**
   * Check connection status
   */
  isConnected() {
    return this.client && this.client.connected;
  }
}

// Singleton instance
const storageMQTTService = new StorageMQTTService();

module.exports = storageMQTTService;