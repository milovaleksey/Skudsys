# 🚀 Быстрый старт: Настройка аналитики СКУД

## Проблема

Если на странице "Аналитика" показывается только **10 зон/корпусов** вместо всех (~22+), нужно настроить MQTT топики.

## Решение за 3 шага

### Шаг 1: Настройте .env

Убедитесь что в `/backend/.env` указаны параметры MQTT:

```env
MQTT_BROKER=localhost
MQTT_PORT=1883
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_password
```

### Шаг 2: Отправьте конфигурацию и данные

```bash
cd backend

# Вариант 1: Одной командой (рекомендуется)
npm run analytics:setup

# Вариант 2: По отдельности
npm run analytics:config  # 1. Отправить конфигурацию
npm run analytics:data     # 2. Отправить данные (нужен путь к CSV)

# Или напрямую:
node scripts/publish-analytics-config.js
node scripts/publish-analytics-data.js ../imports/rez.csv
```

### Шаг 3: Перезапустите backend

```bash
# Остановите backend (Ctrl+C) если запущен
# Запустите снова:
npm start
```

## Проверка

Откройте http://localhost:5173/analytics

✅ **Должно отображаться ~22 здания** в фильтре "Корпус/Здание":
- Корпус №3, №4, №5, №6, №7, №10, №11, №12, №13, №16, №17, №19
- Общежитие 1, 3, 4, 5
- Ишим Корпус №1, №5
- Ишим Общежитие
- Кирова 25 (кадры, док обеспечение)
- Корпус №22 Ленина 12 (Кап строй)
- Корпус №22 Ленина 12 (СГИ)

## Отладка

**Backend логи** (должны быть такие сообщения):
```
[MQTT] ✅ Подключено к брокеру
[MQTT] 📊 Получена конфигурация аналитики
[MQTT] 📊 Получено 883 записей данных аналитики
[MQTT] ✅ Обработано 10 типов аналитики
```

**Если логов нет:**
```bash
# Проверьте что backend запущен
cd backend
npm start

# В логах должно быть:
# [MQTT] 📋 Конфигурация обновлена
# [Analytics Processor] Получено XXX записей
```

**Frontend логи** (F12 → Console):
```
[Analytics WebSocket] ✅ Подключено
[Analytics WebSocket] 📊 Начальные данные: {
  ключи: ['total_stats', 'time_series', 'top_zones', ...],
  top_zones_count: 22,
  time_series_count: 45
}
🔍 Нормализация названий зданий: {
  исходных_записей: 883,
  уникальных_после_нормализации: 22
}
```

**Если показывает:**
```
[Analytics WebSocket] ⚠️ Начальные данные ПУСТЫЕ!
```

**Значит backend не получил данные из MQTT. Выполните:**
```bash
cd backend
npm run analytics:setup  # Отправить конфигурацию и данные
npm start                 # Перезапустить
```

## Дополнительно

📚 Подробная документация: `/backend/scripts/README.md`

💡 Скрипты:
- `publish-analytics-config.js` - конфигурация аналитики (лимиты, типы графиков)
- `publish-analytics-data.js` - публикация данных из CSV в MQTT

---

**Если проблема не решается:**
1. Проверьте что MQTT брокер запущен и доступен
2. Проверьте логи backend на ошибки
3. Убедитесь что топики `Skud/analytics/config` и `Skud/analytics/events/aggregated` доступны