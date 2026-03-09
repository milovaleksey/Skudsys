/**
 * React Hook для Analytics MQTT WebSocket
 * Подписывается на данные аналитики через WebSocket
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface AnalyticsWidget {
  id: string;
  type: 'area' | 'bar' | 'line' | 'pie';
  title: string;
  description: string;
  dataSource: string;
  color?: string;
  colors?: string[];
  limit?: number;
  showTrend?: boolean;
  showAverage?: boolean;
  showPercentage?: boolean;
  buildings?: string[];
}

interface AnalyticsFilter {
  id: string;
  type: 'dateRange' | 'select';
  label: string;
  options?: any[];
  default: any;
}

interface AnalyticsConfig {
  version: string;
  widgets: AnalyticsWidget[];
  filters: AnalyticsFilter[];
}

interface AnalyticsDataset {
  [key: string]: any[];
}

interface AnalyticsMetadata {
  totalPasses: number;
  uniqueBuildings: number;
  dateRange: {
    from: string;
    to: string;
  };
}

interface AnalyticsData {
  timestamp: string;
  datasets: AnalyticsDataset;
  metadata: AnalyticsMetadata;
}

interface UseAnalyticsMQTTReturn {
  config: AnalyticsConfig | null;
  data: AnalyticsData | null;
  isConnected: boolean;
  error: string | null;
  requestUpdate: () => void;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export function useAnalyticsMQTT(): UseAnalyticsMQTTReturn {
  const [config, setConfig] = useState<AnalyticsConfig | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;

  /**
   * Получение URL WebSocket
   */
  const getWebSocketUrl = useCallback(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    
    if (apiUrl) {
      // Если задан полный URL API, конвертируем в WebSocket URL
      const wsUrl = apiUrl.replace(/^http/, 'ws').replace(/\/v1$/, '');
      return `${wsUrl}/ws/analytics`;
    }
    
    // Иначе используем относительный путь (для прод с Nginx)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/analytics`;
  }, []);

  /**
   * Подключение к WebSocket
   */
  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      console.log('[Analytics MQTT] Already connected');
      return;
    }

    try {
      const wsUrl = getWebSocketUrl();
      console.log('[Analytics MQTT] Connecting to:', wsUrl);
      
      setStatus('connecting');
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('[Analytics MQTT] ✅ Connected');
        setIsConnected(true);
        setStatus('connected');
        setError(null);
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (err) {
          console.error('[Analytics MQTT] ❌ Message parse error:', err);
        }
      };

      ws.current.onerror = (event) => {
        console.error('[Analytics MQTT] ❌ WebSocket error:', event);
        setError('Ошибка подключения к WebSocket');
        setStatus('error');
      };

      ws.current.onclose = (event) => {
        console.log('[Analytics MQTT] 🔌 Connection closed:', event.code, event.reason);
        setIsConnected(false);
        setStatus('disconnected');
        
        // Автопереподключение
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`[Analytics MQTT] 🔄 Reconnecting in ${delay}ms...`);
          
          reconnectTimer.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else {
          setError('Не удалось подключиться к серверу');
          setStatus('error');
        }
      };
    } catch (err) {
      console.error('[Analytics MQTT] ❌ Connection error:', err);
      setError('Не удалось установить соединение');
      setStatus('error');
    }
  }, [getWebSocketUrl]);

  /**
   * Обработка входящих сообщений
   */
  const handleMessage = useCallback((message: any) => {
    console.log('[Analytics MQTT] 📩 Message:', message.type);

    switch (message.type) {
      case 'connected':
        console.log('[Analytics MQTT] Received welcome message');
        break;

      case 'config':
        console.log('[Analytics MQTT] 🔧 Config received');
        setConfig(message.data);
        break;

      case 'data':
        console.log('[Analytics MQTT] 📊 Data received');
        setData(message.data);
        break;

      case 'status':
        console.log('[Analytics MQTT] 📡 Status:', message.data);
        break;

      case 'error':
        console.error('[Analytics MQTT] ❌ Error:', message.message);
        setError(message.message);
        break;

      case 'pong':
        // Heartbeat response
        break;

      default:
        console.log('[Analytics MQTT] ⚠️ Unknown message type:', message.type);
    }
  }, []);

  /**
   * Запрос обновления данных
   */
  const requestUpdate = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      console.log('[Analytics MQTT] 🔄 Requesting data update...');
      ws.current.send(JSON.stringify({ type: 'request_update' }));
    } else {
      console.warn('[Analytics MQTT] ⚠️ Cannot request update: not connected');
    }
  }, []);

  /**
   * Отправка ping для поддержания соединения
   */
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 секунд

    return () => clearInterval(pingInterval);
  }, []);

  /**
   * Подключение при монтировании
   */
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return {
    config,
    data,
    isConnected,
    error,
    requestUpdate,
    status
  };
}
