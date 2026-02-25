# 🚗 Парковки - Быстрая шпаргалка

## ⚡ Запуск за 3 команды

```bash
# 1. Сделать исполняемыми
chmod +x parking-publish.sh parking-simulator.sh

# 2. Опубликовать парковки
./parking-publish.sh

# 3. Открыть страницу "Парковочная система"
```

---

## 📊 Результат

- ✅ 3 парковки настроены
- ✅ 24 автомобиля (8 + 6 + 10)
- ✅ 165 мест всего (50 + 40 + 75)
- ✅ 14.5% загрузка

---

## 🔄 Live обновления

```bash
./parking-simulator.sh
```

Обновления каждые 5 секунд! ⚡

---

## 📝 Добавить парковку

```bash
# 1. Отредактировать parking-config.json
{
  "id": "new_parking",
  "name": "Название",
  "address": "Адрес",
  "maxCapacity": 30,
  "vehiclesTopic": "Skud/parking/new/vehicles"
}

# 2. Опубликовать
mosquitto_pub -t "Skud/parking/config" -f parking-config.json
mosquitto_pub -t "Skud/parking/new/vehicles" -m '[]'
```

---

## 🔍 Проверка

```bash
# Конфигурация
mosquitto_sub -t "Skud/parking/config" -C 1

# Транспорт
mosquitto_sub -t "Skud/parking/+/vehicles" -v
```

---

## 🐛 Не работает?

1. Backend перезапущен? `ps aux | grep node`
2. Mosquitto работает? `systemctl status mosquitto`
3. Конфигурация опубликована? `./parking-publish.sh`
4. WebSocket подключен? Смотрите "Система парковок подключена"

---

## 📖 Подробнее

Читайте `PARKING_MQTT_GUIDE.md` или `PARKING_SETUP_COMPLETE.md`
