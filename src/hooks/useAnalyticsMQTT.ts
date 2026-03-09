import { useEffect, useState, useCallback, useRef } from 'react';

interface AnalyticsData {
  statistics: any;
  timeSeries: any[];
  topLocations: any[];
  weekdayPattern: any[];
  locationsComparison: any[];
  hourlyDistribution: any[];
}

/**
 * Хук для подписки на аналитические данные из MQTT через WebSocket
 */
export function useAnalyticsMQTT() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    statistics: null,
    timeSeries: [],
    topLocations: [],
    weekdayPattern: [],
    locationsComparison: [],
    hourlyDistribution: []
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('[Analytics WebSocket] Нет токена авторизации');
        setError('Требуется авторизация');
        return;
      }

      // Получаем базовый URL API из переменной окружения
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      // Определяем WebSocket URL
      let wsUrl: string;
      
      // Если VITE_API_URL задан полностью (http://... или https://...)
      if (apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
        const url = new URL(apiUrl);
        const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${url.host}/ws/mqtt?token=${token}`;
        console.log('[Analytics WebSocket] Используем WebSocket URL из VITE_API_URL:', wsUrl);
      } 
      // Если не задан или задан относительный путь - используем текущий хост с портом 3000
      else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const hostname = window.location.hostname;
        wsUrl = `${protocol}//${hostname}:3000/ws/mqtt?token=${token}`;
        console.log('[Analytics WebSocket] Используем дефолтный WebSocket URL (порт 3000):', wsUrl);
      }

      console.log('[Analytics WebSocket] Подключение к', wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Analytics WebSocket] ✅ Подключено');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[Analytics WebSocket] Получено:', data.type);

          switch (data.type) {
            case 'initial':
              // Начальные данные при подключении
              if (data.analytics) {
                console.log('[Analytics WebSocket] Получены начальные данные аналитики');
                setAnalyticsData(data.analytics);
              }
              break;

            case 'analytics-updated':
              // Обновление данных аналитики
              console.log('[Analytics WebSocket] Обновление данных аналитики');
              if (data.analytics) {
                setAnalyticsData(data.analytics);
              }
              break;

            case 'heartbeat':
              // Heartbeat для поддержания соединения
              break;

            case 'pong':
              // Ответ на ping
              break;

            default:
              // Игнорируем другие типы сообщений
              break;
          }
        } catch (err) {
          console.error('[Analytics WebSocket] Ошибка парсинга сообщения:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[Analytics WebSocket] Ошибка:', event);
        setError('Ошибка WebSocket подключения');
      };

      ws.onclose = (event) => {
        console.log('[Analytics WebSocket] Отключено:', event.code, event.reason);
        setIsConnected(false);

        // Пытаемся переподключиться
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`[Analytics WebSocket] Переподключение через ${delay}ms (попытка ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('[Analytics WebSocket] Превышено количество попыток переподключения');
          setError('Не удалось подключиться к серверу');
        }
      };

    } catch (err) {
      console.error('[Analytics WebSocket] Ошибка создания подключения:', err);
      setError(err instanceof Error ? err.message : 'Ошибка подключения');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendPing = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }));
    }
  }, []);

  useEffect(() => {
    connect();

    // Ping каждые 30 секунд для поддержания соединения
    const pingInterval = setInterval(sendPing, 30000);

    return () => {
      clearInterval(pingInterval);
      disconnect();
    };
  }, [connect, disconnect, sendPing]);

  return {
    ...analyticsData,
    isConnected,
    error,
    reconnect: connect,
  };
}
