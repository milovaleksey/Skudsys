# ⚡ Быстрое исправление ошибки валидации

## ✅ Все проблемы исправлены!

### Проблема 1: "Ошибка валидации"
Backend не принимал поле `authType` от frontend

### Проблема 2: "Маршрут не найден"
Backend использовал префикс `/v1`, а curl пытался использовать `/api`

---

## ✅ Что исправлено

### 1. Схема валидации (auth.controller.js)
```javascript
const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  authType: Joi.string().valid('local', 'sso').optional()  // ✅ Добавлено
});
```

### 2. Маршруты (server.js)
Добавлена поддержка ОБОИХ префиксов:
- ✅ `/v1/auth/login` (для frontend)
- ✅ `/api/auth/login` (для совместимости)

---

## 🚀 Что делать на сервере

### 1. Перезапустите backend
```bash
sudo systemctl restart utmn-security
```

### 2. Проверьте статус
```bash
sudo systemctl status utmn-security
```

### 3. Проверьте API доступен
```bash
# Проверка 1: Health check
curl http://localhost:3000/api/health

# Проверка 2: Health check (альтернативный путь)
curl http://localhost:3000/health
```

**Ожидается:**
```json
{
  "success": true,
  "message": "API работает",
  "timestamp": "...",
  "version": "v1"
}
```

### 4. Создайте тестового пользователя
```bash
cd /var/www/utmn-security/backend
node create-test-user.js
```

**Будет создан:**
- Username: `admin`
- Password: `Admin2025`

### 5. Проверьте логин (ОБОИМИ СПОСОБАМИ)

**Способ 1: Через /api**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin2025"}'
```

**Способ 2: Через /v1**
```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin2025"}'
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "expiresIn": 86400,
    "user": {
      "id": 1,
      "username": "admin",
      "fullName": "Администратор Системы",
      "email": "admin@utmn.ru",
      "role": "admin",
      "roleDisplayName": "Администратор",
      "authType": "local",
      "isActive": true
    }
  }
}
```

---

## 🎯 Готово!

Теперь можно войти в систему через браузер:
- Username: **admin**
- Password: **Admin2025**
- Auth Type: **Local**

---

## 📋 Если не работает

### Проверьте логи
```bash
sudo journalctl -u utmn-security -n 50 --no-pager
```

### Проверьте статус сервиса
```bash
sudo systemctl status utmn-security
```

### Проверьте API доступен
```bash
curl http://localhost:3000/api/health
```

Если ответ `{"status":"ok"}` - всё работает!

---

**Статус:** ✅ Исправлено  
**Дата:** 25.01.2026