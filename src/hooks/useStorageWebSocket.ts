/**
 * WebSocket Hook для Storage Systems
 * Обеспечивает real-time обновления данных о системах хранения через WebSocket
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { TokenManager } from '../lib/api';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

interface StorageSystem {
  id: number;
  name: string;
  type: 'clothes' | 'items';
  building: string;
  address?: string;
  total_capacity: number;
  occupied_count: number;
  status: 'active' | 'inactive' | 'maintenance';
  mqtt_topic_status: string;
  mqtt_topic_occupancy: string;
  created_at: string;
  updated_at: string;
}

interface StorageMessage {
  type: 'connection' | 'storage-status' | 'storage-occupancy' | 'pong';
  message?: string;
  data?: any;
  timestamp: string;
}

interface UseStorageWebSocketOptions {
  onStatusUpdate?: (data: any) => void;
  onOccupancyUpdate?: (data: any) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Event) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export const useStorageWebSocket = (options: UseStorageWebSocketOptions = {}) => {
  const {
    onStatusUpdate,
    onOccupancyUpdate,
    onConnected,
    onDisconnected,
    onError,
    autoReconnect = true,
    reconnectInterval = 5000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<StorageMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    const token = TokenManager.getToken();
    if (!token) {
      console.error('❌ No auth token found, cannot connect to Storage WebSocket');
      setError('Authentication token not found');
      return;
    }

    try {
      const wsUrl = `${WS_URL}/ws/storage?token=${token}`;
      console.log('🔌 Connecting to Storage WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ Storage WebSocket connected');
        setIsConnected(true);
        setError(null);
        onConnected?.();

        // Start ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Ping every 30 seconds
      };

      ws.onmessage = (event) => {
        try {
          const message: StorageMessage = JSON.parse(event.data);
          setLastMessage(message);

          console.log('📨 Storage WebSocket message:', message.type);

          switch (message.type) {
            case 'connection':
              console.log('✅ Storage connection confirmed:', message.message);
              break;

            case 'storage-status':
              console.log('🟢 Storage status update:', message.data);
              onStatusUpdate?.(message.data);
              break;

            case 'storage-occupancy':
              console.log('📊 Storage occupancy update:', message.data);
              onOccupancyUpdate?.(message.data);
              break;

            case 'pong':
              console.log('🏓 Storage pong received');
              break;

            default:
              console.log('❓ Unknown storage message type:', message.type);
          }
        } catch (error) {
          console.error('❌ Error parsing Storage WebSocket message:', error);
        }
      };

      ws.onerror = (event) => {
        console.error('❌ Storage WebSocket error:', event);
        setError('WebSocket connection error');
        onError?.(event);
      };

      ws.onclose = () => {
        console.log('⚠️ Storage WebSocket disconnected');
        setIsConnected(false);
        onDisconnected?.();

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt to reconnect if enabled and component is still mounted
        if (autoReconnect && mountedRef.current) {
          console.log(`🔄 Attempting to reconnect Storage WebSocket in ${reconnectInterval}ms...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, reconnectInterval);
        }
      };
    } catch (error) {
      console.error('❌ Error connecting to Storage WebSocket:', error);
      setError('Failed to connect to WebSocket');
    }
  }, [
    autoReconnect,
    reconnectInterval,
    onConnected,
    onDisconnected,
    onError,
    onStatusUpdate,
    onOccupancyUpdate,
  ]);

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting Storage WebSocket...');

    // Clear timers
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('⚠️ Storage WebSocket not connected, cannot send message');
      return false;
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    mountedRef.current = true;
    connect();

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    error,
    sendMessage,
    reconnect: connect,
    disconnect,
  };
};

export default useStorageWebSocket;
