# 🔍 Диагностика проблемы: История MQTT событий

## ❌ Симптомы

При повторном входе на страницу "Инженерный раздел" таблица **пустая**.

В логах браузера:
```
✅ [Engineering] WebSocket подключен
[Engineering] Получено WebSocket сообщение: {type: 'initial', cards: [...], analytics: {...}, status: {...}}
```

**НЕТ** сообщения с историей: `{type: 'mqtt-message', topic: 'Skud/baddialsevent', data: [...]}`

---

## 🔍 Диагностика

### Шаг 1: Проверьте backend логи

Перезапустите backend и откройте страницу. В консоли backend должны увидеть:

```bash
[MQTT WebSocket] Новое подключение
[WebSocket] ✅ Аутентифицирован: admin
[WebSocket] 🔍 История badEvents: X событий  # ← СМОТРИТЕ СЮДА!
```

**Варианты:**

#### A. Если показывает `История badEvents: 0 событий`
```bash
[WebSocket] 🔍 История badEvents: 0 событий
[WebSocket] ⚠️ История пустая, нечего отправлять
```

**Проблема:** Массив `badEvents` пустой в памяти.

**Причины:**
1. Backend перезапускался → история потеряна (это нормально для in-memory)
2. MQTT не подключен → события не приходят
3. MQTT подключен, но события не публикуются в топик

**Решение:** Перейдите к Шагу 2

#### B. Если показывает `История badEvents: 1000 событий` (или любое > 0)
```bash
[WebSocket] 🔍 История badEvents: 1000 событий
[WebSocket] 📜 Отправка истории: 1000 аномальных событий новому клиенту
```

**Отлично!** Backend отправляет историю.

**Проблема на frontend:** Перейдите к Шагу 4

---

### Шаг 2: Отправьте тестовые события

Если история пустая, отправьте тестовые события:

```bash
cd backend
node test-mqtt-bad-events.js
```

**Ожидаемый вывод:**
```
🚀 Тестовая отправка аномальных событий в MQTT
📡 MQTT Broker: mqtt://10.101.221.207:1883
✅ Подключено к MQTT брокеру

📤 Отправка тестовых событий...

✅ Отправлено 5 событий в топик: Skud/baddialsevent

📊 События:
  1. 2026-03-13 18:30:00 - Отказ в доступе - неверный PIN
     ФИО: Иванов Иван Иванович
     Устройство: Считыватель 10, Зона: Корпус 1

  ...

🔌 Отключено от MQTT брокера
✅ Тест завершен! Проверьте страницу "Инженерный раздел"
```

**В backend логах должно появиться:**
```bash
[MQTT] 🚨 Получено 5 аномальных событий из топика Skud/baddialsevent
[Engineering] ➕ Добавлено 5 событий, было: 0, стало: 5
[MQTT] 🚨 Испускаем событие 'bad-event' для WebSocket клиентов
[WebSocket] 🚨 Рассылка аномальных событий СКУД клиентам
[WebSocket] 🚨 Подключено клиентов: 1
[WebSocket] ✅ Событие отправлено 1 клиентам
```

**В браузере должно появиться:**
```javascript
[Engineering] Получено WebSocket сообщение: {
  type: "mqtt-message",
  topic: "Skud/baddialsevent",
  data: [5 events]
}
🚨 [Engineering] Получено аномальное событие: ...
```

**Если события НЕ появились:**

#### Вариант A: Ошибка подключения к MQTT
```
❌ Timeout: Не удалось подключиться к MQTT брокеру
```

**Проверьте:**
1. MQTT брокер запущен:
   ```bash
   sudo systemctl status mosquitto
   ```

2. Настройки в `/backend/.env`:
   ```env
   MQTT_BROKER=mqtt://10.101.221.207:1883
   MQTT_USERNAME=your_username  # если требуется
   MQTT_PASSWORD=your_password  # если требуется
   ```

3. Firewall не блокирует порт 1883:
   ```bash
   telnet 10.101.221.207 1883
   ```

#### Вариант B: Backend не подписан на топик

**Проверьте backend логи** при запуске:
```bash
[MQTT Service] 🔌 Подключение к MQTT: mqtt://10.101.221.207:1883
[MQTT] ✅ Подключен к MQTT брокеру
[MQTT] ✅ Подписан на топик: Skud/baddialsevent  # ← ДОЛЖНО БЫТЬ!
```

Если **НЕТ** строки "Подписан на топик":
- Проверьте `/backend/src/services/mqtt.service.js`
- Убедитесь что вызывается `subscribeToBadEventsTopic()`

---

### Шаг 3: Обновите страницу

После отправки тестовых событий:

1. **Обновите страницу** (F5)

2. **Проверьте backend логи:**
   ```bash
   [WebSocket] 🔍 История badEvents: 5 событий
   [WebSocket] 📜 Отправка истории: 5 аномальных событий новому клиенту
   ```

3. **Проверьте браузер:**
   - ✅ Таблица содержит 5 событий
   - ✅ Индикатор MQTT зеленый

**Если всё работает** → Проблема решена! ✅

**Если таблица всё еще пустая** → Перейдите к Шагу 4

---

### Шаг 4: Проверьте frontend обработку

Если backend отправляет историю, но frontend не отображает:

#### A. Проверьте консоль браузера

Должны быть логи:
```javascript
[Engineering] Получено WebSocket сообщение: {
  type: "mqtt-message",
  topic: "Skud/baddialsevent",
  data: [...]
}
```

**Если НЕТ этого лога:**
- WebSocket сообщение не доходит до frontend
- Проверьте сетевые логи (Network tab → WS)

**Если ЕСТЬ этот лог, но таблица пустая:**

#### B. Проверьте обработку в EngineeringPage.tsx

Откройте `/components/EngineeringPage.tsx`, найдите обработчик:

```typescript
ws.onmessage = (event) => {
  try {
    const message = JSON.parse(event.data);
    console.log('[Engineering] Получено WebSocket сообщение:', message);
    
    // Обработка данных из топика Skud/baddialsevent
    if (message.topic === 'Skud/baddialsevent' && message.data) {
      console.log('🚨 [Engineering] Получено аномальное событие:', message.data);
      const newEvents = Array.isArray(message.data) ? message.data : [message.data];
      setBadEvents(prev => [...newEvents, ...prev].slice(0, 1000));
    }
  } catch (error) {
    console.error('[Engineering] Ошибка парсинга:', error);
  }
};
```

**Убедитесь что:**
- ✅ `message.topic === 'Skud/baddialsevent'` - true
- ✅ `message.data` - не пустой массив
- ✅ `setBadEvents` вызывается

#### C. Проверьте React State

Добавьте временное логирование:

```typescript
useEffect(() => {
  console.log('[Engineering] badEvents изменились:', badEvents.length);
}, [badEvents]);
```

Если состояние обновляется, но таблица пустая:
- Проверьте фильтры (может фильтр скрывает события)
- Проверьте рендер таблицы

---

### Шаг 5: Проверьте API endpoint

Независимо от WebSocket, страница также запрашивает `/api/engineering/bad-events`:

**Backend логи:**
```bash
[Engineering API] 📊 Запрос bad-events: всего 5 событий в памяти
[Engineering API] 📤 Отправляем 5 событий клиенту
```

**Браузер (Network tab):**
```
Request: GET /v1/engineering/bad-events
Response: {
  "success": true,
  "events": [...],
  "total": 5
}
```

**Если total: 0:**
- События не сохраняются в контроллере
- Проверьте что MQTT вызывает `engineeringController.addBadEvents()`

---

## 🎯 Быстрая проверка

```bash
# 1. Отправьте тестовые события
cd backend
node test-mqtt-bad-events.js

# 2. Проверьте что backend получил
# В логах должно быть:
# [Engineering] ➕ Добавлено 5 событий

# 3. Обновите страницу в браузере
# В логах backend должно быть:
# [WebSocket] 📜 Отправка истории: 5 аномальных событий

# 4. Проверьте таблицу
# Должны быть 5 строк
```

---

## 📋 Чеклист диагностики

### Backend
- [ ] MQTT брокер запущен и доступен
- [ ] Backend подключен к MQTT
- [ ] Backend подписан на `Skud/baddialsevent`
- [ ] Тестовый скрипт успешно отправляет события
- [ ] Backend получает события (логи `[MQTT] 🚨 Получено...`)
- [ ] События сохраняются (логи `[Engineering] ➕ Добавлено...`)
- [ ] WebSocket отправляет историю (логи `[WebSocket] 📜 Отправка истории...`)

### Frontend
- [ ] WebSocket подключается (зеленый индикатор)
- [ ] WebSocket получает сообщение `type: 'mqtt-message'`
- [ ] `setBadEvents` вызывается
- [ ] Состояние `badEvents` обновляется
- [ ] Таблица рендерится без ошибок
- [ ] Фильтры не скрывают события

---

## ✅ Решение найдено?

Если после всех шагов проблема не решена, предоставьте:

1. **Backend логи** при подключении клиента
2. **Frontend логи** из консоли браузера
3. **Network tab** → WS соединение
4. **Вывод** `node test-mqtt-bad-events.js`

---

**Дата:** Март 2026  
**Версия:** 1.0  
**Статус:** 🔍 Диагностический гайд
