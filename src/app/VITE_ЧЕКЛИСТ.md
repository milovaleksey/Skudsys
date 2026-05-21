# ✅ Чеклист запуска Vite

## 🎯 Цель

Запустить Vite **из frontend/** директории без ошибок импорта.

---

## 📋 Шаги

### 1. Скопировать файлы в frontend/

```bash
cd /var/www/utmn-security/debug
bash ФИНАЛЬНОЕ_ИСПРАВЛЕНИЕ_VITE.sh
```

**Ожидаемый результат:**
```
✅ КОПИРОВАНИЕ ЗАВЕРШЕНО!
✅ Все файлы на месте! Можно запускать Vite.
```

---

### 2. Проверить что hooks скопированы

```bash
ls frontend/hooks/
```

**Должно быть 6 файлов:**
- ✅ `useAnalyticsMQTT.ts`
- ✅ `useForeignStudentsMQTT.ts`
- ✅ `useMQTT.ts`
- ✅ `useParkingMQTT.ts`
- ✅ `useStorageMQTT.ts`
- ✅ `useStorageWebSocket.ts`

---

### 3. Проверить что components скопированы

```bash
ls frontend/components/ | head -10
```

**Должно быть:**
- ✅ `MainPage.tsx`
- ✅ `LoginPage.tsx`
- ✅ `EngineeringPage.tsx`
- ✅ `AnalyticsPage.tsx`
- ✅ `ParkingPage.tsx`
- ✅ И другие...

---

### 4. Проверить критически важные файлы

```bash
# Проверка вручную
ls frontend/lib/api.ts
ls frontend/contexts/AuthContext.tsx
ls frontend/styles/globals.css
ls frontend/App.tsx
ls frontend/main.tsx
ls frontend/index.html
```

**Все должны существовать!**

---

### 5. Запустить Vite ИЗ FRONTEND!

```bash
cd /var/www/utmn-security/debug/frontend  # ← ВАЖНО!
npm run dev
```

**Ожидаемый вывод:**
```
  VITE v5.4.11  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://10.101.221.207:5173/
  ➜  press h + enter to show help
```

**БЕЗ ошибок:**
- ❌ `Failed to resolve import "../hooks/useMQTT"`
- ❌ `Failed to resolve import "../components/..."`

---

### 6. Проверить в браузере

Откройте:
```
http://10.101.221.207:5173
```

**Должно быть:**
- ✅ Страница логина загружается
- ✅ Нет ошибок в консоли браузера
- ✅ Стили применены

---

## ⚠️ Частые ошибки

### Ошибка 1: "Failed to resolve import"

**Причина:**  
Vite запущен из корня проекта, а не из `frontend/`

**Решение:**
```bash
cd /var/www/utmn-security/debug/frontend  # ← Сначала перейти!
npm run dev                                # ← Потом запустить
```

---

### Ошибка 2: "Cannot find module './hooks/...'"

**Причина:**  
Hooks не скопированы в `frontend/hooks/`

**Решение:**
```bash
cd /var/www/utmn-security/debug
cp -r hooks/*.ts frontend/hooks/
```

---

### Ошибка 3: "EADDRINUSE: address already in use"

**Причина:**  
Порт 5173 уже занят (Vite уже запущен)

**Решение:**
```bash
# Найти процесс
lsof -i :5173

# Убить
kill -9 <PID>

# Или изменить порт в vite.config.ts
server: {
  port: 5174,  // Другой порт
}
```

---

## 🎉 Успех!

Если всё прошло успешно:

1. ✅ Vite запущен без ошибок
2. ✅ Страница логина загружается
3. ✅ Можно войти в систему

**Следующий шаг:**  
Вернуться к тестированию MQTT истории!

```bash
cd /var/www/utmn-security/debug/backend
node test-mqtt-bad-events.js
```

---

**Дата:** Март 2026  
**Версия:** 1.0  
**Статус:** ✅ Готово к использованию
