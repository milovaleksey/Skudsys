# 🔍 Диагностика ошибки валидации при логине

## ✅ ИСПРАВЛЕНО!

### Проблема
Frontend отправлял поле `authType`, которое не было в схеме валидации backend.

### Решение
Добавлено `authType` в схему валидации `/backend/src/controllers/auth.controller.js`:

```javascript
const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  authType: Joi.string().valid('local', 'sso').optional()  // ✅ Добавлено
});
```

---

## 🚀 Перезапуск backend

```bash
# 1. Перезапустите backend
sudo systemctl restart utmn-security

# 2. Проверьте статус
sudo systemctl status utmn-security

# 3. Проверьте логи
sudo journalctl -u utmn-security -n 20 --no-pager
```

---

## 👤 Создание тестового пользователя

### Вариант 1: Через скрипт (РЕКОМЕНДУЕТСЯ)

```bash
cd /var/www/utmn-security/backend
node create-test-user.js
```

**Создаёт пользователя:**
- Username: `admin`
- Password: `Admin2025`
- Role: `admin`

### Вариант 2: Через MySQL

```bash
# Подключитесь к БД
mysql -u utmn_user -p utmn_security_db

# Создайте пользователя
INSERT INTO users (username, full_name, email, password_hash, role_name, auth_type, is_active)
VALUES (
  'admin',
  'Администратор',
  'admin@utmn.ru',
  '$2b$10$qKZYN8xGxQQ5XxVxVxVxVO7sKjK3K3K3K3K3K3K3K3K3K3K3K3K3K2',
  'admin',
  'local',
  1
);
```

---

## 🧪 Проверка работоспособности

### 1. Проверьте API

```bash
curl http://localhost:3000/api/health
```

**Ожидается:**
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

### 2. Попробуйте логин через curl

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin2025",
    "authType": "local"
  }'
```

**Ожидается:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "expiresIn": 86400,
    "user": {
      "id": 1,
      "username": "admin",
      "fullName": "Администратор",
      ...
    }
  }
}
```

### 3. Попробуйте в браузере

1. Откройте приложение
2. Введите:
   - Username: `admin`
   - Password: `Admin2025`
   - Auth Type: `Local`
3. Нажмите "Войти"

---

**Версия:** 1.0  
**Дата:** 25.01.2026