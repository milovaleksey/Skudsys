import { useState, useEffect, useRef } from 'react';

export interface ParkingVehicle {
  entryTime: string;
  fullName: string;
  upn: string;
  carBrand: string;
  licensePlate: string;
}

export interface ParkingConfig {
  id: string;
  name: string;
  address: string;
  maxCapacity: number;
  vehiclesTopic: string;
}

export interface ParkingData extends ParkingConfig {
  vehicles: ParkingVehicle[];
  currentCount: number;
}

export function useParkingMQTT() {
  const [parkings, setParkings] = useState<ParkingData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);

  const connect = () => {
    try {
      // Получаем базовый URL API из переменной окружения
      const apiUrl = import.meta.env.VITE_API_URL || '';

      // Определяем WebSocket URL
      let wsUrl: string;

      // Если VITE_API_URL задан полностью (http://... или https://...)
      if (apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
        const url = new URL(apiUrl);
        const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${url.host}/ws/parking`;
      }
      // Если не задан - используем текущий хост
      else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${window.location.host}/ws/parking`;
      }

      console.log('[Parking WS] Подключение к', wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[Parking WebSocket] Подключено');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'parking_config') {
            console.log('[Parking WebSocket] Получена конфигурация парковок:', data.parkings);
            
            // Инициализируем парковки с пустыми списками транспорта
            const initialParkings: ParkingData[] = data.parkings.map((config: ParkingConfig) => ({
              ...config,
              vehicles: [],
              currentCount: 0,
            }));
            
            setParkings(initialParkings);
          } else if (data.type === 'parking_vehicles') {
            console.log('[Parking WebSocket] Обновление транспорта:', data.parkingId, data.vehicles.length);
            
            setParkings(prev => prev.map(parking => {
              if (parking.id === data.parkingId) {
                return {
                  ...parking,
                  vehicles: data.vehicles,
                  currentCount: data.vehicles.length,
                };
              }
              return parking;
            }));
          } else if (data.type === 'parking_update') {
            console.log('[Parking WebSocket] Обновление парковки:', data.parkingId);
            
            setParkings(prev => prev.map(parking => {
              if (parking.id === data.parkingId) {
                return {
                  ...parking,
                  vehicles: data.vehicles || parking.vehicles,
                  currentCount: data.vehicles ? data.vehicles.length : parking.currentCount,
                };
              }
              return parking;
            }));
          }
        } catch (err) {
          console.error('[Parking WebSocket] Ошибка парсинга:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[Parking WebSocket] Ошибка подключения:', event);
        setError('Ошибка подключения к серверу парковок');
      };

      ws.onclose = () => {
        console.log('[Parking WebSocket] Отключено');
        setIsConnected(false);
        wsRef.current = null;

        // Переподключение с экспоненциальной задержкой
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;
        
        console.log(`[Parking WebSocket] Переподключение через ${delay}ms (попытка ${reconnectAttempts.current})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[Parking WebSocket] Ошибка создания подключения:', err);
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
    parkings,
    isConnected,
    error,
    reconnect,
  };
}
