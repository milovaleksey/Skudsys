# 📊 Настройка MQTT карточек - Готовые примеры

## 🎯 Что у нас есть

У вас есть **3 готовых варианта** конфигурации карточек для дашборда:

### 1️⃣ Простой вариант (8 карточек)
- Всего студентов
- Всего сотрудников  
- Общежития №1-6

**Файлы:**
- `mqtt-config-example.json` - конфигурация
- `mqtt-publish-config.sh` - скрипт запуска (Linux/Mac)
- `mqtt-publish-config.bat` - скрипт запуска (Windows)

### 2️⃣ Расширенный вариант (18 карточек)
- Студенты: всего + сейчас на территории
- Сотрудники: всего + сейчас на территории
- Общежития №1-6: проживает + сейчас находятся
- Парковка (занято/всего)
- Библиотека (посетителей)

**Файлы:**
- `mqtt-config-extended.json` - конфигурация
- `mqtt-publish-extended.sh` - скрипт запуска

### 3️⃣ Live симулятор
Демонстрация обновлений в реальном времени (каждые 3 секунды)

**Файлы:**
- `mqtt-simulator.sh` - live симулятор

---

## 🚀 Быстрый старт

### Шаг 1: Сделайте скрипты исполняемыми

```bash
chmod +x make-mqtt-executable.sh
./make-mqtt-executable.sh
```

### Шаг 2: Выберите вариант и запустите

**Вариант 1 - Простой:**
```bash
./mqtt-publish-config.sh
```

**Вариант 2 - Расширенный:**
```bash
./mqtt-publish-extended.sh
```

**Вариант 3 - Live демонстрация:**
```bash
./mqtt-publish-extended.sh  # Сначала опубликуйте конфигурацию
./mqtt-simulator.sh          # Затем запустите симулятор
```

### Шаг 3: Откройте дашборд

Перейдите на главную страницу и увидите:
- ✅ "Сервер статистики подключен" с зеленой точкой
- 📊 Карточки с данными из MQTT
- ⚡ Live обновления (если запущен симулятор)

---

## 📝 Настройка под ваши общежития

### 1. Отредактируйте конфигурацию

Откройте `mqtt-config-example.json` и измените:

```json
{
  "id": "dorm_polevaya",
  "title": "Ваше название",
  "subtitle": "Ваш адрес",
  "icon": "building",
  "color": "#f59e0b",
  "topic": "Skud/dorms/polevaya/residents"
}
```

### 2. Опубликуйте конфигурацию

```bash
mosquitto_pub -h localhost -p 1883 \
  -t "Skud/main/stat" \
  -f mqtt-config-example.json
```

### 3. Опубликуйте значения

```bash
mosquitto_pub -h localhost -p 1883 \
  -t "Skud/dorms/polevaya/residents" \
  -m "456"
```

---

## 🔄 Обновление значений

### Вручную через mosquitto_pub

```bash
# Обновить количество студентов
mosquitto_pub -h localhost -p 1883 \
  -t "Skud/stats/students/total" \
  -m "15500"

# Обновить общежитие №1
mosquitto_pub -h localhost -p 1883 \
  -t "Skud/dorms/1/residents" \
  -m "480"
```

### Автоматически из вашей системы

**Python пример:**
```python
import paho.mqtt.publish as publish

# Получаем данные из вашей БД
students_count = get_students_count_from_db()

# Публикуем в MQTT
publish.single(
    "Skud/stats/students/total",
    str(students_count),
    hostname="localhost"
)
```

**Node.js пример:**
```javascript
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

// Получаем данные из вашей БД
const studentsCount = await getStudentsCountFromDB();

// Публикуем в MQTT
client.publish('Skud/stats/students/total', studentsCount.toString());
```

---

## 🎨 Доступные иконки и цвета

### Иконки
```
users, briefcase, building, home, school, user, user-check,
map-pin, car, package, book, clipboard, calendar, clock
```

### Цвета (HEX)
```
#00aeef - синий (фирменный ТюмГУ)
#10b981 - зеленый
#f59e0b - оранжевый
#8b5cf6 - фиолетовый
#ec4899 - розовый
#06b6d4 - голубой
#f97316 - оранжево-красный
#14b8a6 - бирюзовый
#3b82f6 - синий
#ef4444 - красный
```

---

## 🐛 Отладка

### Проверить что MQTT работает

```bash
# Смотрим конфигурацию
mosquitto_sub -h localhost -p 1883 -t "Skud/main/stat" -v

# Смотрим все топики
mosquitto_sub -h localhost -p 1883 -t "Skud/#" -v
```

### Проверить через API

```bash
# Получить карточки
curl http://localhost:3000/v1/mqtt/cards

# Статус подключения
curl http://localhost:3000/v1/mqtt/status
```

### Проверить WebSocket в браузере

Откройте консоль (F12) и найдите:
```
[WebSocket] Подключено к ws://...
[WebSocket] Получены данные карточек: 8 карточек
```

---

## 📚 Документация

- **MQTT_QUICKSTART.md** - краткая шпаргалка
- **MQTT_CARDS_GUIDE.md** - подробное руководство с примерами
- **README_MQTT.md** - полная документация MQTT системы

---

## ✅ Чеклист

- [ ] Backend запущен (`node backend/src/server.js`)
- [ ] Mosquitto запущен (`systemctl status mosquitto`)
- [ ] Скрипты исполняемые (`./make-mqtt-executable.sh`)
- [ ] Конфигурация опубликована (`./mqtt-publish-config.sh`)
- [ ] Дашборд показывает "Сервер статистики подключен"
- [ ] Карточки отображаются с данными

---

## 🎉 Готово!

Теперь у вас работает система мониторинга с:
- ⚡ Real-time обновлениями через WebSocket
- 📊 Динамическими карточками из MQTT
- 🏢 Мониторингом общежитий, студентов и сотрудников
- 🎨 Красивым фирменным интерфейсом ТюмГУ

**Нужна помощь?** Читайте подробную документацию в `MQTT_CARDS_GUIDE.md`
