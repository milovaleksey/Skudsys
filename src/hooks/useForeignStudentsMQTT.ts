import { useState, useEffect } from 'react';
import { StatCard } from '../lib/mqtt';

export interface CountryStats {
  country: string;
  students_count: number;
}

export interface Country {
  code: string;
  name: string;
}

export function useForeignStudentsMQTT() {
  const [statCards, setStatCards] = useState<StatCard[]>([]);
  const [cardValues, setCardValues] = useState<Record<string, string>>({});
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isMounted = true;

    const connect = () => {
      // Не переподключаться, если компонент размонтирован
      if (!isMounted) return;

      try {
        // Подключение к WebSocket серверу
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('[Foreign Students MQTT] WebSocket connected');
          setIsConnected(true);
          setError(null);

          // Подписка на топики
          ws?.send(JSON.stringify({
            action: 'subscribe',
            topics: [
              'Skud/foreign-students/config',
              'Skud/foreign-students/stats',
              'Skud/foreign-students/countries'
            ]
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Конфигурация карточек статистики
            if (data.topic === 'Skud/foreign-students/config') {
              if (Array.isArray(data.payload)) {
                setStatCards(data.payload);
                console.log('[Foreign Students MQTT] Config loaded:', data.payload.length, 'cards');
              }
            }
            
            // Статистика по странам для диаграммы
            else if (data.topic === 'Skud/foreign-students/stats') {
              if (Array.isArray(data.payload)) {
                setCountryStats(data.payload);
                console.log('[Foreign Students MQTT] Country stats loaded:', data.payload.length, 'countries');
              }
            }
            
            // Справочник стран
            else if (data.topic === 'Skud/foreign-students/countries') {
              if (Array.isArray(data.payload)) {
                setCountries(data.payload);
                console.log('[Foreign Students MQTT] Countries loaded:', data.payload.length, 'countries');
              }
            }
            
            // Динамические значения карточек
            else if (data.topic && data.topic.startsWith('Skud/foreign-students/data/')) {
              const cardId = data.topic.replace('Skud/foreign-students/data/', '');
              setCardValues(prev => ({
                ...prev,
                [cardId]: data.payload
              }));
            }
          } catch (err) {
            console.error('[Foreign Students MQTT] Parse error:', err);
          }
        };

        ws.onerror = (err) => {
          console.error('[Foreign Students MQTT] WebSocket error:', err);
          setError('Ошибка подключения к серверу данных');
          setIsConnected(false);
        };

        ws.onclose = () => {
          console.log('[Foreign Students MQTT] WebSocket closed');
          setIsConnected(false);
          
          // Переподключение через 3 секунды
          if (isMounted) {
            console.log('[Foreign Students MQTT] Планирую переподключение через 3 секунды');
            reconnectTimeout = setTimeout(connect, 3000);
          } else {
            console.log('[Foreign Students MQTT] Компонент размонтирован, переподключение отменено');
          }
        };
      } catch (err) {
        console.error('[Foreign Students MQTT] Connection error:', err);
        setError('Не удалось установить соединение');
        setIsConnected(false);
        
        // Переподключение через 3 секунды
        if (isMounted) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      }
    };

    connect();

    return () => {
      isMounted = false;
      console.log('[Foreign Students MQTT] Компонент размонтируется, закрываем WebSocket');
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  const reconnect = () => {
    setError(null);
    window.location.reload();
  };

  return {
    statCards,
    cardValues,
    countryStats,
    countries,
    isConnected,
    error,
    reconnect
  };
}