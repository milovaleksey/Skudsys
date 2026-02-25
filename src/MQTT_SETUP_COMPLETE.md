# ✅ MQTT конфигурация готова к использованию

## 🎉 Что создано

### 📄 Файлы конфигурации
1. **mqtt-config-example.json** - Простая конфигурация (8 карточек)
2. **mqtt-config-extended.json** - Расширенная конфигурация (18 карточек)

### 🔧 Скрипты запуска
3. **mqtt-publish-config.sh** - Публикация простой конфигурации (Linux/Mac)
4. **mqtt-publish-config.bat** - Публикация простой конфигурации (Windows)
5. **mqtt-publish-extended.sh** - Публикация расширенной конфигурации
6. **mqtt-simulator.sh** - Live симулятор обновлений
7. **make-mqtt-executable.sh** - Установка прав доступа

### 📚 Документация
8. **MQTT_QUICKSTART.md** - Краткая шпаргалка
9. **MQTT_CARDS_GUIDE.md** - Подробное руководство
10. **MQTT_EXAMPLES_README.md** - Главная инструкция
11. **MQTT_VISUAL_EXAMPLE.md** - Визуальные примеры
12. **MQTT_SETUP_COMPLETE.md** - Этот файл

---

## 🚀 Быстрый старт (3 команды)

```bash
# 1. Сделать скрипты исполняемыми
chmod +x make-mqtt-executable.sh && ./make-mqtt-executable.sh

# 2. Опубликовать конфигурацию
./mqtt-publish-config.sh

# 3. Открыть дашборд
http://10.101.221.207:5173
```

**Результат:** 8 карточек на дашборде с данными в реальном времени! 🎯

---

## 📊 Что вы получите

### Простая конфигурация (8 карточек)
```
✅ Всего студентов: 15,234
✅ Всего сотрудников: 2,847
✅ Общежитие №1: 456
✅ Общежитие №2: 523
✅ Общежитие №3: 398
✅ Общежитие №4: 612
✅ Общежитие №5: 487
✅ Общежитие №6: 541
```

### Расширенная конфигурация (18 карточек)
```
✅ Общая статистика (4 карточки)
   • Студенты: всего + на территории
   • Сотрудники: всего + на территории

✅ Общежития (12 карточек)
   • №1-6: проживает + сейчас находятся

✅ Дополнительно (2 карточки)
   • Парковка: занято/всего
   • Библиотека: посетителей
```

---

## 🎨 Настройка под себя

### Изменить названия общежитий

Откройте `mqtt-config-example.json`:
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

### Добавить свои карточки

1. Добавьте в `cards` массив новую карточку
2. Опубликуйте обновленную конфигурацию
3. Опубликуйте значение в новый топик

### Изменить цвета

Доступные цвета:
```
#00aeef - синий ТюмГУ    #10b981 - зеленый
#f59e0b - оранжевый      #8b5cf6 - фиолетовый
#ec4899 - розовый        #06b6d4 - голубой
#f97316 - красно-оранж.  #14b8a6 - бирюзовый
```

---

## 🔄 Обновление значений

### Вручную
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "Skud/stats/students/total" \
  -m "15500"
```

### Автоматически из БД (Python)
```python
import paho.mqtt.publish as publish
import mysql.connector

# Подключение к БД
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="your_password",
    database="utmn_security"
)

cursor = db.cursor()
cursor.execute("SELECT COUNT(*) FROM students")
count = cursor.fetchone()[0]

# Публикация в MQTT
publish.single(
    "Skud/stats/students/total",
    str(count),
    hostname="localhost"
)
```

### Автоматически из БД (Bash + Cron)
```bash
#!/bin/bash
# /opt/mqtt-updater.sh

STUDENTS=$(mysql -u root -pPASSWORD -D utmn_security -se "SELECT COUNT(*) FROM students")
EMPLOYEES=$(mysql -u root -pPASSWORD -D utmn_security -se "SELECT COUNT(*) FROM employees")

mosquitto_pub -h localhost -p 1883 -t "Skud/stats/students/total" -m "$STUDENTS"
mosquitto_pub -h localhost -p 1883 -t "Skud/stats/employees/total" -m "$EMPLOYEES"
```

Добавить в cron (каждые 5 минут):
```bash
*/5 * * * * /opt/mqtt-updater.sh
```

---

## 🎬 Live демонстрация

Запустите симулятор для демонстрации real-time обновлений:

```bash
./mqtt-simulator.sh
```

Карточки будут обновляться каждые 3 секунды! ⚡

```
[14:30:15] 📊 Обновлено:
           Студентов: 8945 | Сотрудников: 1625
           Общ.№1: 314 | Общ.№2: 400 | Парковка: 236

[14:30:18] 📊 Обновлено:
           Студентов: 8942 | Сотрудников: 1623
           Общ.№1: 312 | Общ.№2: 398 | Парковка: 234
```

---

## 📖 Документация

### Для быстрого старта
Читайте: **MQTT_QUICKSTART.md**

### Для настройки
Читайте: **MQTT_CARDS_GUIDE.md**

### Для визуального понимания
Читайте: **MQTT_VISUAL_EXAMPLE.md**

### Для полной информации
Читайте: **README_MQTT.md**

---

## 🔍 Проверка работы

### 1. Backend запущен?
```bash
ps aux | grep "node.*server.js"
# Должен быть процесс: node backend/src/server.js
```

### 2. Mosquitto работает?
```bash
systemctl status mosquitto
# Должен быть: active (running)
```

### 3. Конфигурация опубликована?
```bash
mosquitto_sub -h localhost -p 1883 -t "Skud/main/stat" -C 1
# Должен вывести JSON конфигурацию
```

### 4. WebSocket подключен?
Откройте дашборд, должно быть:
```
✅ Сервер статистики подключен 🟢
```

### 5. Карточки отображаются?
На главной странице должны быть карточки с данными

---

## 🐛 Troubleshooting

| Проблема | Решение |
|----------|---------|
| WebSocket не подключается | Проверьте backend логи, перезапустите backend |
| Карточки не отображаются | Опубликуйте конфигурацию: `./mqtt-publish-config.sh` |
| Значения не обновляются | Проверьте mosquitto: `systemctl status mosquitto` |
| Ошибка CORS | Проверьте `/backend/.env`, должен быть `CORS_ORIGIN` |

---

## 📋 Чек-лист готовности

- [x] ✅ Файлы конфигурации созданы
- [x] ✅ Скрипты запуска готовы
- [x] ✅ Документация написана
- [ ] 🔧 Скрипты сделаны исполняемыми (`./make-mqtt-executable.sh`)
- [ ] 📡 Конфигурация опубликована (`./mqtt-publish-config.sh`)
- [ ] 🌐 Дашборд показывает карточки
- [ ] ⚡ WebSocket подключен

---

## 🎯 Следующие шаги

1. **Запустите простую конфигурацию**
   ```bash
   ./mqtt-publish-config.sh
   ```

2. **Проверьте результат** на дашборде

3. **Настройте под свои общежития**
   - Отредактируйте `mqtt-config-example.json`
   - Опубликуйте обновленную конфигурацию

4. **Интегрируйте с БД**
   - Создайте скрипт обновления
   - Добавьте в cron для автоматизации

5. **Попробуйте live демонстрацию**
   ```bash
   ./mqtt-simulator.sh
   ```

---

## 💡 Примеры топиков

```
Skud/main/stat                   - Конфигурация карточек (JSON)
Skud/stats/students/total        - Всего студентов
Skud/stats/students/present      - Студентов на территории
Skud/stats/employees/total       - Всего сотрудников
Skud/stats/employees/present     - Сотрудников на территории
Skud/dorms/1/residents           - Общежитие №1 (проживает)
Skud/dorms/1/present             - Общежитие №1 (сейчас)
Skud/parking/occupied            - Парковка (занято)
Skud/library/visitors            - Библиотека (посетителей)
```

---

## 🎉 Готово к использованию!

Вся конфигурация готова. Запускайте и наслаждайтесь мониторингом в реальном времени! 🚀

**Удачи!** 💪
