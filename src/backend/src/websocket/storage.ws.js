/**
 * Storage WebSocket Service
 * Provides real-time updates for storage systems to connected clients
 */

const WebSocket = require('ws');
const url = require('url');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');

let wss = null;
const clients = new Set();

/**
 * Initialize WebSocket server for storage updates
 */
function initStorageWebSocket(server) {
  wss = new WebSocket.Server({ 
    noServer: true,
    path: '/ws/storage'
  });

  // NOTE: upgrade event is handled in server.js
  // This function only sets up the WebSocket server

  wss.on('connection', (ws, request) => {
    // Extract token from query params
    const params = url.parse(request.url, true).query;
    const token = params.token;

    // Verify JWT token
    if (!token) {
      logger.warn('Storage WebSocket connection rejected: No token provided');
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      ws.userId = decoded.id;
      ws.userRole = decoded.role;
      
      logger.info(`Storage WebSocket client connected: User ${ws.userId} (${ws.userRole})`);
    } catch (error) {
      logger.warn('Storage WebSocket connection rejected: Invalid token');
      ws.close(1008, 'Invalid authentication token');
      return;
    }

    clients.add(ws);

    // Send initial connection success message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to storage updates',
      timestamp: new Date().toISOString()
    }));

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        logger.debug(`Storage WebSocket message from user ${ws.userId}:`, data);

        // Handle ping/pong for keep-alive
        if (data.type === 'ping') {
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          }));
        }
      } catch (error) {
        logger.error('Error parsing Storage WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      logger.info(`Storage WebSocket client disconnected: User ${ws.userId}`);
    });

    ws.on('error', (error) => {
      logger.error(`Storage WebSocket error for user ${ws.userId}:`, error);
      clients.delete(ws);
    });

    // Set up ping interval to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(pingInterval);
      }
    }, 30000); // Ping every 30 seconds

    ws.on('close', () => {
      clearInterval(pingInterval);
    });
  });

  logger.info('✅ Storage WebSocket server initialized on /ws/storage');

  // Return wss and path for upgrade handling in server.js
  return {
    wss,
    path: '/ws/storage'
  };
}

/**
 * Broadcast storage update to all connected clients
 */
function broadcastStorageUpdate(event, data) {
  if (!wss) {
    logger.warn('Storage WebSocket server not initialized');
    return;
  }

  const message = JSON.stringify({
    type: event,
    data,
    timestamp: new Date().toISOString()
  });

  let successCount = 0;
  let failCount = 0;

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
        successCount++;
      } catch (error) {
        logger.error('Error sending storage update to client:', error);
        failCount++;
      }
    }
  });

  logger.debug(`Broadcasted storage update (${event}) to ${successCount} clients (${failCount} failed)`);
}

/**
 * Send update to specific client
 */
function sendToClient(userId, event, data) {
  const message = JSON.stringify({
    type: event,
    data,
    timestamp: new Date().toISOString()
  });

  let sent = false;
  clients.forEach((client) => {
    if (client.userId === userId && client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
        sent = true;
      } catch (error) {
        logger.error(`Error sending storage update to user ${userId}:`, error);
      }
    }
  });

  return sent;
}

/**
 * Get number of connected clients
 */
function getClientCount() {
  return clients.size;
}

/**
 * Close all connections
 */
function closeAll() {
  clients.forEach((client) => {
    client.close(1000, 'Server shutting down');
  });
  clients.clear();

  if (wss) {
    wss.close(() => {
      logger.info('Storage WebSocket server closed');
    });
  }
}

module.exports = {
  initStorageWebSocket,
  broadcastStorageUpdate,
  sendToClient,
  getClientCount,
  closeAll
};