# Быстрая проверка Foreign Students MQTT

## Шаг 1: Перезапустите backend

```bash
cd backend
npm start
```

В логах вы должны увидеть:
```
[Foreign Students WebSocket] Инициализирован для /ws
🔌 Подключение к Foreign Students MQTT брокеру...
[Foreign Students MQTT] Подключение к брокеру: mqtt://localhost:1883
[Foreign Students MQTT] ✅ Успешно подключено к брокеру
[Foreign Students MQTT] ✅ Подписка на топик: Skud/foreign-students/config
[Foreign Students MQTT] ✅ Подписка на топик: Skud/foreign-students/stats
```

## Шаг 2: Опубликуйте тестовые данные

```bash
cd backend/scripts
chmod +x publish-foreign-students-simple.sh
./publish-foreign-students-simple.sh
```

В логах backend вы должны увидеть:
```
[Foreign Students MQTT] 📊 Получена конфигурация: 4 карточек
[Foreign Students MQTT] 📈 Получена статистика: 10 стран
[Foreign Students MQTT] 📨 Обновление значения карточки [Skud/foreign-students/data/total]: 434
```

## Шаг 3: Откройте страницу в браузере

1. Откройте страницу "Отчет по иностранным студентам"
2. Откройте консоль браузера (F12)

В консоли вы должны увидеть:
```
[Foreign Students MQTT] Подключение к: ws://10.101.221.207:3000/ws
[Foreign Students MQTT] WebSocket connected
[Foreign Students MQTT] Получено: {topic: 'Skud/foreign-students/config', payload: Array(4)}
[Foreign Students MQTT] Config loaded: 4 cards
[Foreign Students MQTT] Получено: {topic: 'Skud/foreign-students/stats', payload: Array(10)}
[Foreign Students MQTT] Country stats loaded: 10 countries
```

## Что должно быть на странице

✅ **4 карточки статистики** вверху:
- Всего иностранных студентов: 434
- Активных за сегодня: 287
- Стран представлено: 15
- Новых за месяц: 28

✅ **Диаграмма-пончик** с 10 странами

✅ **Зеленая галочка** в правом верхнем углу = WebSocket подключен

## Если карточки не появляются

### Проверка 1: Backend подключен к MQTT?
```bash
# В логах backend должно быть:
[Foreign Students MQTT] ✅ Успешно подключено к брокеру
```

### Проверка 2: MQTT брокер запущен?
```bash
sudo systemctl status mosquitto
# или
ps aux | grep mosquitto
```

### Проверка 3: Данные опубликованы?
```bash
# Подпишитесь на все топики
mosquitto_sub -h localhost -t "Skud/foreign-students/#" -v
```

### Проверка 4: WebSocket подключается?
В консоли браузера должно быть:
```
[Foreign Students MQTT] WebSocket connected
```

Если видите ошибку, проверьте:
- Backend запущен на порту 3000
- Нет ошибок в логах backend
- VITE_API_URL правильно настроен

### Проверка 5: Backend получает сообщения?
```bash
# В логах backend при публикации должно появиться:
[Foreign Students MQTT] 📊 Получена конфигурация: 4 карточек
```

## Отладка

### Логи backend
```bash
cd backend
npm start | grep "Foreign Students"
```

### Мониторинг MQTT
```bash
# В одном терминале - подписка
mosquitto_sub -h localhost -t "Skud/foreign-students/#" -v

# В другом терминале - публикация
./backend/scripts/publish-foreign-students-simple.sh
```

### Проверка WebSocket вручную
```javascript
// В консоли браузера
const ws = new WebSocket('ws://10.101.221.207:3000/ws');
ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log('Message:', e.data);
ws.onerror = (e) => console.error('Error:', e);
```

## Тестирование обновлений в реальном времени

```bash
# Измените значение карточки
mosquitto_pub -h localhost -t "Skud/foreign-students/data/active_today" -m "305"

# Значение должно обновиться на странице без перезагрузки
```
