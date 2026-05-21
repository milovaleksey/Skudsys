# Динамические карточки статистики через MQTT

Система поддерживает динамическое отображение статистических карточек, которые настраиваются через MQTT в реальном времени.

## Принцип работы

1. **Конфигурация карточек** загружается из топика `Skud/main/stat` в формате JSON
2. **Значения карточек** обновляются в реальном времени из топиков, указанных в конфигурации
3. Если MQTT отключен, система использует fallback данные из REST API

## Формат конфигурации

Опубликуйте в топик `Skud/main/stat` JSON массив с конфигурацией карточек:

```json
[
  {
    "id": "students_total",
    "label": "Всего студентов",
    "icon": "users",
    "valueTopic": "Skud/stats/students/total",
    "color": "#00aeef",
    "unit": "чел."
  },
  {
    "id": "employees_total",
    "label": "Всего сотрудников",
    "icon": "briefcase",
    "valueTopic": "Skud/stats/employees/total",
    "color": "#10b981",
    "unit": "чел."
  },
  {
    "id": "parking_occupied",
    "label": "Занято мест",
    "icon": "car",
    "valueTopic": "Skud/stats/parking/occupied",
    "color": "#f59e0b",
    "unit": "мест"
  },
  {
    "id": "active_sessions",
    "label": "Активных сессий",
    "icon": "activity",
    "valueTopic": "Skud/stats/sessions/active",
    "color": "#8b5cf6"
  }
]
```

### Поля конфигурации

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | string | ✅ | Уникальный идентификатор карточки |
| `label` | string | ✅ | Название карточки (отображается на UI) |
| `valueTopic` | string | ✅ | MQTT топик откуда читать значение |
| `icon` | string | ❌ | Название иконки (см. список ниже) |
| `color` | string | ❌ | Цвет акцента (hex формат, по умолчанию #00aeef) |
| `unit` | string | ❌ | Единица измерения (отображается рядом со значением) |

### Доступные иконки

- `users` - иконка пользователей
- `briefcase` - портфель
- `car` - автомобиль
- `activity` - активность
- `trending-up` - рост
- `trending-down` - падение
- `alert-circle` - предупреждение
- `check-circle` - успех
- `clock` - часы
- `database` - база данных
- `server` - сервер
- `wifi` - подключение
- `wifi-off` - отключение

## Публикация значений

После настройки карточек, публикуйте значения в соответствующие топики:

```bash
# Пример с mosquitto_pub
mosquitto_pub -h localhost -t "Skud/stats/students/total" -m "1547"
mosquitto_pub -h localhost -t "Skud/stats/employees/total" -m "312"
mosquitto_pub -h localhost -t "Skud/stats/parking/occupied" -m "45 / 100"
mosquitto_pub -h localhost -t "Skud/stats/sessions/active" -m "23"
```

Значения могут быть:
- Числами: `1547`
- Строками с форматированием: `"45 / 100"`
- Текстом: `"В норме"`

## Настройка MQTT брокера

### WebSocket подключение

Для работы MQTT в браузере необходим WebSocket транспорт:

**Mosquitto** (`mosquitto.conf`):
```conf
listener 1883
protocol mqtt

listener 9001
protocol websockets
```

**EMQX**:
```conf
listeners.ws.default {
  bind = "0.0.0.0:9001"
}
```

### Настройки в UI

1. Откройте главную страницу дашборда
2. Нажмите "Настройки MQTT"
3. Укажите:
   - **Адрес брокера**: localhost (или IP вашего сервера)
   - **Порт WebSocket**: 9001 (стандартный для WS)
   - **Логин/Пароль**: при необходимости

## Пример полной настройки

### 1. Опубликуйте конфигурацию карточек:

```bash
mosquitto_pub -h localhost -t "Skud/main/stat" -m '[
  {
    "id": "students",
    "label": "Студентов в кампусе",
    "icon": "users",
    "valueTopic": "Skud/stats/students/total",
    "color": "#00aeef",
    "unit": "чел."
  },
  {
    "id": "temperature",
    "label": "Температура",
    "icon": "activity",
    "valueTopic": "Skud/stats/environment/temp",
    "color": "#ef4444",
    "unit": "°C"
  }
]'
```

### 2. Публикуйте значения:

```bash
# Один раз или периодически
while true; do
  mosquitto_pub -h localhost -t "Skud/stats/students/total" -m "$((RANDOM % 2000))"
  mosquitto_pub -h localhost -t "Skud/stats/environment/temp" -m "$(echo "scale=1; 20 + $RANDOM % 10" | bc)"
  sleep 5
done
```

### 3. Карточки автоматически обновятся в UI

## Troubleshooting

### Ошибка подключения

**Проблема**: "Ошибка подключения к MQTT"

**Решение**:
- Проверьте, запущен ли MQTT брокер
- Убедитесь, что WebSocket listener включен
- Проверьте firewall (порт 9001 должен быть открыт)
- Попробуйте подключиться с `ws://` или `wss://` явно

### Карточки не отображаются

**Проблема**: Показывается "Загрузка конфигурации карточек..."

**Решение**:
- Убедитесь, что конфигурация опубликована в топик `Skud/main/stat`
- Проверьте формат JSON (должен быть валидным)
- Откройте консоль браузера для проверки ошибок

### Значения не обновляются

**Проблема**: Карточки показывают "..."

**Решение**:
- Проверьте, что данные публикуются в правильные топики
- Убедитесь, что топики в конфигурации совпадают с теми, куда публикуются данные
- Проверьте права доступа к топикам (ACL)
