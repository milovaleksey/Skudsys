# 🚗 Парковки - Быстрая шпаргалка

## ⚡ Запуск за 3 команды

```bash
# 1. Перезапустить backend
cd /var/www/utmn-security/debug/backend && npm start

# 2. Опубликовать парковки (в новом терминале)
cd /var/www/utmn-security/debug
export MQTT_HOST=10.101.221.232
chmod +x parking-publish.sh
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
export MQTT_HOST=10.101.221.232
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
mosquitto_pub -h 10.101.221.232 -t "Skud/parking/config" -f parking-config.json
mosquitto_pub -h 10.101.221.232 -t "Skud/parking/new/vehicles" -m '[]'
```

---

## 🔍 Проверка

```bash
# Конфигурация
mosquitto_sub -h 10.101.221.232 -t "Skud/parking/config" -C 1

# Транспорт
mosquitto_sub -h 10.101.221.232 -t "Skud/parking/+/vehicles" -v
```

---

## 🐛 Не работает?

1. Backend перезапущен? `ps aux | grep node`
2. MQTT_BROKER в .env? `cat /var/www/utmn-security/debug/backend/.env | grep MQTT_BROKER`
3. Конфигурация опубликована? `MQTT_HOST=10.101.221.232 ./parking-publish.sh`
4. WebSocket подключен? Смотрите "Система парковок подключена"

---

## 📖 Подробнее

Читайте `PARKING_FINAL_READY.md` или `PARKING_MQTT_GUIDE.md`