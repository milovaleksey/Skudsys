# Аналитика СКУД - Быстрая диагностика

## 🔥 Экспресс-проверка (30 секунд)

### 1️⃣ Откройте консоль браузера (F12)

**✅ Хорошо:**
```
[Analytics WebSocket] ✅ Подключено
[Analytics WebSocket] 📊 Начальные данные: {
  top_zones_count: 22,
  ...
}
```

**❌ Проблема:**
```
[Analytics WebSocket] ⚠️ Начальные данные ПУСТЫЕ!
```

### 2️⃣ Если данные пустые → Запустите скрипт

```bash
cd backend
npm run analytics:setup
npm start
```

### 3️⃣ Перезагрузите страницу (F5)

Должно появиться ~22 здания в фильтре.

---

## 📊 Что отправляет скрипт `analytics:setup`

1. **Конфигурация** → `Skud/analytics/config`
   - Устанавливает `limit: 100` для топ зон
   - Описывает 10 типов аналитики

2. **Данные** → `Skud/analytics/events/aggregated`
   - Из CSV файла `/imports/rez.csv`
   - 883 записи × 22 здания × период 2 месяца

---

## 🐛 Полная диагностика

### Backend не подключается к MQTT

**Проверьте `.env`:**
```env
MQTT_BROKER=localhost
MQTT_PORT=1883
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_password
```

**Проверьте что MQTT брокер запущен:**
```bash
# Mosquitto (пример)
systemctl status mosquitto

# Или проверьте порт
netstat -an | grep 1883
```

### Backend подключен, но нет данных

**Посмотрите логи backend:**
```
[MQTT] ✅ Подключено к брокеру
[MQTT] 📊 Получена конфигурация аналитики  ← Должно быть!
[MQTT] 📊 Получено 883 записей             ← Должно быть!
[MQTT] ✅ Обработано 10 типов аналитики    ← Должно быть!
```

**Если этих логов нет:**
```bash
cd backend
npm run analytics:config  # Только конфигурация
npm run analytics:data     # Только данные
npm start
```

### Frontend не получает данные

**Проверьте WebSocket URL в консоли:**
```
[Analytics WebSocket] Используем дефолтный WebSocket URL (порт 3000): ws://localhost:3000/ws/mqtt?token=...
```

**Должен совпадать с портом backend!**

Если backend на другом порту, измените `.env`:
```env
VITE_API_URL=http://localhost:YOUR_PORT
```

---

## 📚 Полная документация

- `/QUICK_START_ANALYTICS.md` - пошаговая инструкция
- `/backend/scripts/README.md` - описание скриптов
- `/backend/scripts/publish-analytics-config.js` - скрипт конфигурации
- `/backend/scripts/publish-analytics-data.js` - скрипт данных

---

## 💡 Частые вопросы

**Q: Почему показывает 10 зон?**  
A: Не отправлена конфигурация с `limit: 100`. Запустите `npm run analytics:config`

**Q: Где взять CSV с данными?**  
A: Уже есть в `/imports/rez.csv` (883 записи)

**Q: Можно ли изменить лимит?**  
A: Да, откройте `scripts/publish-analytics-config.js` и измените `limit: 100` на нужное значение, затем запустите скрипт снова

**Q: Нужно ли отправлять каждый раз?**  
A: Нет! Данные публикуются с флагом `retain: true` и сохраняются в MQTT брокере

**Q: Как добавить свои данные?**  
A: Подготовьте CSV файл в формате:
```csv
event_date,root_zone_name,total_events
2025-06-18,"Корпус №11",19
```
Затем: `npm run analytics:data path/to/your.csv`
