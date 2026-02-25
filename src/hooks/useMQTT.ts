import { useEffect, useState, useCallback, useRef } from 'react';
import { apiRequest } from '../lib/api';

interface StatCard {
  id: string;
  label: string;
  icon?: string;
  valueTopic: string;
  color?: string;
  unit?: string;
  value?: string | null;
}

interface MQTTStatus {
  connected: boolean;
  broker: string;
  cardsCount: number;
  valuesCount: number;
}

/**
 * Хук для получения карточек через API
 */
export function useMQTTCards() {
  const [cards, setCards] = useState<StatCard[]>([]);
  const [status, setStatus] = useState<MQTTStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCards = useCallback(async () => {
    try {
      const response = await apiRequest('/mqtt/cards');
      if (response.success) {
        setCards(response.data.cards || []);
        setStatus(response.data.status || null);
        setError(null);
      }
    } catch (err) {
      console.error('Ошибка загрузки карточек:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCards();
    
    // Обновляем данные каждые 10 секунд (fallback если WebSocket не работает)
    const interval = setInterval(loadCards, 10000);
    
    return () => clearInterval(interval);
  }, [loadCards]);

  return { cards, status, isLoading, error, refetch: loadCards };
}

/**
 * Хук для WebSocket подключения к MQTT обновлениям
 */
export function useMQTTWebSocket() {
  const [cards, setCards] = useState<StatCard[]>([]);
  const [status, setStatus] = useState<MQTTStatus | null>(null);
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
        console.error('[WebSocket] Нет токена авторизации');
        setError('Требуется авторизация');
        return;
      }

      // Получаем базовый URL API из переменной окружения
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      // DEBUG: Выводим что прочитали из .env
      console.log('[WebSocket] DEBUG: VITE_API_URL =', import.meta.env.VITE_API_URL);
      console.log('[WebSocket] DEBUG: apiUrl =', apiUrl);
      
      // Определяем WebSocket URL
      let wsUrl: string;
      
      // Если VITE_API_URL задан полностью (http://... или https://...)
      if (apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
        const url = new URL(apiUrl);
        const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${url.host}/ws/mqtt?token=${token}`;
        console.log('[WebSocket] Используем WebSocket URL из VITE_API_URL:', wsUrl);
      } 
      // Если не задан или задан относительный путь - используем текущий хост с портом 3000
      else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const hostname = window.location.hostname; // только hostname без порта
        wsUrl = `${protocol}//${hostname}:3000/ws/mqtt?token=${token}`;
        console.log('[WebSocket] Используем дефолтный WebSocket URL (порт 3000):', wsUrl);
      }

      console.log('[WebSocket] Подключение к', wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] ✅ Подключено');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WebSocket] Получено:', data.type);

          switch (data.type) {
            case 'initial':
              // Начальные данные при подключении
              setCards(data.cards || []);
              setStatus(data.status || null);
              break;

            case 'config-updated':
              // Обновление конфигурации карточек
              setCards(data.cards || []);
              break;

            case 'value-updated':
              // Обновление значения одной карточки
              setCards(prev => prev.map(card => 
                card.id === data.cardId 
                  ? { ...card, value: data.value }
                  : card
              ));
              break;

            case 'status-changed':
              // Изменение статуса MQTT
              setStatus(data.status);
              break;

            case 'heartbeat':
              // Heartbeat для поддержания соединения
              break;

            case 'pong':
              // Ответ на ping
              break;

            default:
              console.warn('[WebSocket] Неизвестный тип сообщения:', data.type);
          }
        } catch (err) {
          console.error('[WebSocket] Ошибка парсинга сообщения:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[WebSocket] Ошибка:', event);
        setError('Ошибка WebSocket подключения');
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Отключено:', event.code, event.reason);
        setIsConnected(false);

        // Пытаемся переподключиться
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`[WebSocket] Переподключение через ${delay}ms (попытка ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('[WebSocket] Превышено количество попыток переподключения');
          setError('Не удалось подключиться к серверу');
        }
      };

    } catch (err) {
      console.error('[WebSocket] Ошибка создания подключения:', err);
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
    cards,
    status,
    isConnected,
    error,
    reconnect: connect,
  };
}

/**
 * Хук для публикации в MQTT (только для администраторов)
 */
export function useMQTTPublish() {
  const publish = useCallback(async (topic: string, message: string, retain = false) => {
    try {
      const response = await apiRequest('/mqtt/publish', {
        method: 'POST',
        body: JSON.stringify({ topic, message, retain }),
      });

      if (response.success) {
        return { success: true };
      } else {
        return { success: false, error: response.message };
      }
    } catch (err) {
      console.error('шибка публикации:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Ошибка публикации' 
      };
    }
  }, []);

  return { publish };
}