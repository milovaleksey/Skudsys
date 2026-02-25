# 🚀 Быстрый старт: Карточки общежитий

## Вариант 1: Простой (8 карточек)

### Запустить
```bash
# Linux/Mac
chmod +x mqtt-publish-config.sh
./mqtt-publish-config.sh

# Windows
mqtt-publish-config.bat
```

### Результат
- Всего студентов: 15,234
- Всего сотрудников: 2,847
- Общежития №1-6 (количество проживающих)

---

## Вариант 2: Расширенный (18 карточек)

### Запустить
```bash
chmod +x mqtt-publish-extended.sh
./mqtt-publish-extended.sh
```

### Результат
- Студенты: всего + сейчас на территории
- Сотрудники: всего + сейчас на территории
- Общежития №1-6: проживает + сейчас находятся
- Парковка
- Библиотека

---

## Вариант 3: Live демонстрация

### Запустить симулятор
```bash
chmod +x mqtt-simulator.sh
./mqtt-simulator.sh
```

Значения будут обновляться каждые 3 секунды! ⚡

---

## 🎨 Свои названия общежитий?

Отредактируйте `mqtt-config-example.json`:

```json
{
  "id": "dorm_polevaya",
  "title": "Общежитие на Полевой",
  "subtitle": "ул. Полевая, 123",
  "icon": "building",
  "color": "#f59e0b",
  "topic": "Skud/dorms/polevaya/residents"
}
```

Затем опубликуйте:
```bash
mosquitto_pub -t "Skud/main/stat" -f mqtt-config-example.json
mosquitto_pub -t "Skud/dorms/polevaya/residents" -m "456"
```

---

## 🔄 Обновить одно значение

```bash
mosquitto_pub -h localhost -p 1883 \
  -t "Skud/dorms/1/residents" \
  -m "500"
```

Карточка обновится мгновенно! ⚡

---

## 📊 Проверить что работает

```bash
# Смотрим конфигурацию
mosquitto_sub -t "Skud/main/stat" -v

# Смотрим все значения
mosquitto_sub -t "Skud/#" -v

# Проверка через API
curl http://localhost:3000/v1/mqtt/cards
```

---

## 🎯 Важные топики

| Топик | Описание |
|-------|----------|
| `Skud/main/stat` | Конфигурация карточек (JSON) |
| `Skud/stats/students/total` | Всего студентов |
| `Skud/stats/employees/total` | Всего сотрудников |
| `Skud/dorms/1/residents` | Общежитие №1 |
| `Skud/dorms/2/residents` | Общежитие №2 |

---

## 🐛 Не работает?

1. **Backend запущен?** `ps aux | grep node`
2. **Mosquitto работает?** `systemctl status mosquitto`
3. **WebSocket подключен?** Смотрите "Сервер статистики подключен" на дашборде
4. **Конфигурация опубликована?** `mosquitto_sub -t "Skud/main/stat"`

---

## 📚 Подробная документация

Читайте `MQTT_CARDS_GUIDE.md` для:
- Интеграции с Python/Node.js
- Автоматического обновления из базы данных
- Кастомизации иконок и цветов
- Примеров скриптов
