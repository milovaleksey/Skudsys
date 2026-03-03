import { useState, useEffect, useRef } from 'react';

export interface StorageSystem {
  id: string;
  name: string;
  type: 'clothes' | 'items';
  building: string;
  address?: string;
  totalCapacity: number;
  occupiedCount: number;
  status: 'active' | 'inactive' | 'maintenance';
  mqttTopicStatus: string;
  mqttTopicOccupancy: string;
  updatedAt?: string;
}

export interface StorageData extends StorageSystem {
  occupiedCount: number;
  status: 'active' | 'inactive' | 'maintenance';
}

export function useStorageMQTT() {
  const [storages, setStorages] = useState<StorageData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);

  const connect = () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';
      const wsUrl = apiUrl.replace(/^http/, 'ws').replace(/\/v1$/, '');
      const ws = new WebSocket(`${wsUrl}/ws/storage`);

      ws.onopen = () => {
        console.log('[Storage WebSocket] Подключено');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'storage_config') {
            console.log('[Storage WebSocket] Получена конфигурация систем хранения:', data.storages);
            
            // Инициализируем системы хранения
            const initialStorages: StorageData[] = data.storages.map((config: StorageSystem) => ({
              ...config,
              occupiedCount: config.occupiedCount || 0,
              status: config.status || 'active',
            }));
            
            setStorages(initialStorages);
          } else if (data.type === 'storage-occupancy') {
            console.log('[Storage WebSocket] Обновление занятости:', data.data);
            
            setStorages(prev => prev.map(storage => {
              if (storage.id === data.data.systemId || 
                  storage.name === data.data.name ||
                  storage.building === data.data.building) {
                return {
                  ...storage,
                  occupiedCount: data.data.occupiedCount,
                  updatedAt: new Date().toISOString(),
                };
              }
              return storage;
            }));
          } else if (data.type === 'storage-status') {
            console.log('[Storage WebSocket] Обновление статуса:', data.data);
            
            setStorages(prev => prev.map(storage => {
              if (storage.id === data.data.systemId || 
                  storage.name === data.data.name ||
                  storage.building === data.data.building) {
                return {
                  ...storage,
                  status: data.data.status,
                  updatedAt: new Date().toISOString(),
                };
              }
              return storage;
            }));
          } else if (data.type === 'connection') {
            console.log('[Storage WebSocket] Сообщение подключения:', data.message);
          } else if (data.type === 'pong') {
            // Ответ на ping - игнорируем
          }
        } catch (err) {
          console.error('[Storage WebSocket] Ошибка парсинга:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[Storage WebSocket] Ошибка подключения:', event);
        setError('Ошибка подключения к серверу систем хранения');
      };

      ws.onclose = () => {
        console.log('[Storage WebSocket] Отключено');
        setIsConnected(false);
        wsRef.current = null;

        // Переподключение с экспоненциальной задержкой
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;
        
        console.log(`[Storage WebSocket] Переподключение через ${delay}ms (попытка ${reconnectAttempts.current})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[Storage WebSocket] Ошибка создания подключения:', err);
      setError('Не удалось подключиться к серверу');
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const reconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    reconnectAttempts.current = 0;
    connect();
  };

  return {
    storages,
    isConnected,
    error,
    reconnect,
  };
}