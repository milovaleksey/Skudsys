# ✅ ФИНАЛЬНАЯ ИНСТРУКЦИЯ - Динамическая аналитика работает!

## 🎉 Что готово:

### Backend:
- ✅ MQTT Service - подписка на топики аналитики
- ✅ Analytics Processor - 10 типов аналитики
- ✅ WebSocket Server - трансляция данных клиентам

### Frontend:
- ✅ useAnalyticsMQTT - hook для получения данных
- ✅ AnalyticsPage - обновлена для динамических данных

---

## 🚀 КАК ЗАПУСТИТЬ:

### 1. Запустите backend:
```bash
cd backend
npm run dev
```

### 2. Опубликуйте конфигурацию (ОБЯЗАТЕЛЬНО с флагом `-r`):
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "Skud/analytics/config" \
  -f ANALYTICS_CONFIG_EXAMPLE.json \
  -r
```

### 3. Опубликуйте данные:
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "Skud/analytics/events/aggregated" \
  -f imports/event-data-1.json
```

### 4. Откройте страницу "Аналитика" в браузере

---

## 📊 ЧТО УВИДИТЕ В ЛОГАХ:

### Backend (должно быть):
```
[MQTT] ✅ Подписка на топик конфигурации аналитики: Skud/analytics/config
[MQTT] ✅ Подписка на топик данных аналитики: Skud/analytics/events/aggregated
[MQTT] 📊 Получена конфигурация аналитики
[MQTT] 📊 Конфигурация содержит 10 типов аналитики
[Analytics Processor] Конфигурация обновлена
[MQTT] ⏳ Ожидание данных аналитики...

[MQTT] 📊 Получено 1000 записей данных аналитики
[Analytics Processor] Получено 1000 записей
[MQTT] 📊 Конфигурация есть, обрабатываем данные...
[MQTT] 📊 Обработка данных аналитики...
[MQTT] ✅ Обработано 10 типов аналитики
[WebSocket] 📊 Рассылка обновления аналитики клиентам
```

### Браузер Console (F12):
```javascript
[Analytics WebSocket] Подключение к ws://localhost:3000/ws/mqtt?token=...
[Analytics WebSocket] ✅ Подключено
[Analytics WebSocket] Получено: initial
[Analytics WebSocket] Получены начальные данные аналитики
[Analytics WebSocket] Получено: analytics-updated
[Analytics WebSocket] Обновление данных аналитики
```

---

## 📈 ЧТО УВИДИТЕ НА СТРАНИЦЕ:

### Карточки статистики (4 шт):
1. **Всего проходов** - сумма всех событий
2. **Уникальных зон** - количество разных зон
3. **Среднее в день** - среднее количество проходов
4. **Пиковый день** - день с максимальной активностью

### Графики:
1. **Area Chart** - Динамика проходов по дням
2. **Horizontal Bar** - Топ-10 зон по активности
3. **Bar Chart** - Распределение по дням недели
4. **Line Chart** - Сравнение топ-5 зон по дням

---

## 🔧 ОТЛАДКА:

### Если видите "Загрузка данных аналитики...":

1. **Откройте отладочную секцию** внизу страницы (development mode)
2. **Проверьте "Доступные данные"** - должен быть JSON с данными
3. **Если JSON пустой** - данные не пришли:
   - Проверьте backend логи
   - Проверьте WebSocket подключение в Network tab (F12)
   - Убедитесь что конфигурация опубликована с `-r` флагом

### Если показывает "MQTT отключен":
- Backend не запущен
- Порт 3000 недоступен
- Проблема с токеном авторизации

### Если в логах "Неизвестный тип: ...":
- Эти типы пропущены (trend и heatmap уже добавлены)
- Они не критичны, остальные 8 типов работают

---

## 🎯 ТОПИКИ MQTT:

### Конфигурация (retained):
```
Skud/analytics/config
```

### Данные:
```
Skud/analytics/events/aggregated
```

### Проверка:
```bash
# Проверить retained конфигурацию
timeout 3 mosquitto_sub -h localhost -p 1883 \
  -t "Skud/analytics/config" -C 1

# Подписаться на все топики аналитики
mosquitto_sub -h localhost -p 1883 \
  -t "Skud/analytics/#" -v
```

---

## 📋 СТРУКТУРА ДАННЫХ:

### Конфигурация содержит 10 типов:
1. `total_stats` - общая статистика
2. `time_series` - временные ряды
3. `top_zones` - топ зон
4. `weekday_pattern` - по дням недели
5. `zone_comparison` - сравнение зон
6. `zone_categories` - категоризация
7. `growth_rate` - темп роста
8. `dormitory_analysis` - общежития
9. `weekend_activity` - будни vs выходные
10. `monthly_heatmap` - тепловая карта

### Данные в формате:
```json
{
  "total_stats": {
    "totalPasses": 123456,
    "uniqueZones": 17,
    "avgDailyPasses": 4115,
    "peakDay": { "date": "...", "value": 14679 }
  },
  "time_series": [
    { "date": "2025-06-17", "count": 4500 },
    ...
  ],
  "top_zones": [
    { "name": "Корпус №5", "count": 25000, "percentage": "16.67" },
    ...
  ]
}
```

---

## ✨ ГОТОВО!

Система динамической аналитики полностью настроена и готова к использованию!

**Обновляйте данные** - публикуйте новый JSON в топик:
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "Skud/analytics/events/aggregated" \
  -f your-new-data.json
```

**Изменяйте конфигурацию** - публикуйте новый конфиг:
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "Skud/analytics/config" \
  -f your-new-config.json \
  -r
```

Всё обновится автоматически через WebSocket! 🚀
