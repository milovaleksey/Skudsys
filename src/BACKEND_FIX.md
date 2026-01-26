# 🔧 Исправление Backend ошибки

## ✅ Что было исправлено

### Проблема
Backend сервис не запускался из-за ошибки `MODULE_NOT_FOUND` в файле `/backend/src/controllers/user.controller.js`

**Ошибка:**
```
Error: Cannot find module '../utils/validation'
```

### Решение
Удален неиспользуемый импорт `const { validate } = require('../utils/validation');` из `user.controller.js`

**Было (строка 3):**
```javascript
const bcrypt = require('bcrypt');
const { getPool } = require('../config/database');
const { validate } = require('../utils/validation');  // ❌ Модуль не существует
const Joi = require('joi');
```

**Стало:**
```javascript
const bcrypt = require('bcrypt');
const { getPool } = require('../config/database');
const Joi = require('joi');  // ✅ Валидация через Joi схемы
```

---

## 🚀 Перезапуск сервиса

Выполните следующие команды на сервере:

```bash
# Перезапустите backend сервис
sudo systemctl restart utmn-security

# Проверьте статус
sudo systemctl status utmn-security

# Проверьте логи
sudo journalctl -u utmn-security -n 50 --no-pager
```

---

## ✅ Проверка работоспособности

После перезапуска проверьте:

### 1. Статус сервиса
```bash
sudo systemctl status utmn-security
```

**Ожидаемый результат:**
```
● utmn-security.service - UTMN Security System Backend
   Loaded: loaded (/etc/systemd/system/utmn-security.service; enabled)
   Active: active (running) since ...
```

### 2. API доступен
```bash
curl http://localhost:3000/api/health
```

**Ожидаемый ответ:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-25T..."
}
```

### 3. База данных подключена
```bash
curl http://localhost:3000/api/health/db
```

**Ожидаемый ответ:**
```json
{
  "status": "ok",
  "database": "connected"
}
```

---

## 🔍 Диагностика

### Если сервис не запускается

**1. Проверьте полные логи:**
```bash
sudo journalctl -u utmn-security -n 100 --no-pager
```

**2. Проверьте конфигурацию:**
```bash
cat /var/www/utmn-security/backend/.env
```

**3. Проверьте зависимости:**
```bash
cd /var/www/utmn-security/backend
npm list joi
```

### Если база данных недоступна

**1. Проверьте MySQL:**
```bash
sudo systemctl status mysql
```

**2. Проверьте подключение:**
```bash
mysql -u utmn_user -p utmn_security_db
```

**3. Проверьте таблицы:**
```sql
USE utmn_security_db;
SHOW TABLES;
```

---

## 📝 Дополнительные команды

### Остановить сервис
```bash
sudo systemctl stop utmn-security
```

### Запустить сервис
```bash
sudo systemctl start utmn-security
```

### Перезапустить сервис
```bash
sudo systemctl restart utmn-security
```

### Посмотреть логи в реальном времени
```bash
sudo journalctl -u utmn-security -f
```

### Отключить автозапуск
```bash
sudo systemctl disable utmn-security
```

### Включить автозапуск
```bash
sudo systemctl enable utmn-security
```

---

## 🎯 Что проверяет backend

Backend использует Joi для валидации данных:

### createUserSchema
```javascript
{
  username: min 3, max 100 символов
  fullName: min 2, max 200 символов
  email: валидный email
  password: min 8 символов (обязателен для authType='local')
  role: строка (должна существовать в таблице roles)
  authType: 'local' или 'sso'
  isActive: boolean
}
```

### updateUserSchema
```javascript
{
  fullName: min 2, max 200 символов (опционально)
  email: валидный email (опционально)
  role: строка (опционально)
  isActive: boolean (опционально)
}
```

---

## 🔐 Безопасность

Backend использует:
- ✅ **bcrypt** для хеширования паролей (10 rounds)
- ✅ **JWT** для токенов авторизации
- ✅ **Helmet** для HTTP заголовков безопасности
- ✅ **CORS** для контроля доступа
- ✅ **Rate limiting** для защиты от DDoS
- ✅ **Joi validation** для валидации всех входящих данных

---

## 📊 Endpoints

После исправления доступны следующие endpoints:

### Пользователи
- `GET /api/users` - список пользователей (с пагинацией, фильтрами)
- `GET /api/users/:id` - получить пользователя по ID
- `POST /api/users` - создать пользователя
- `PUT /api/users/:id` - обновить пользователя
- `DELETE /api/users/:id` - удалить пользователя
- `GET /api/users/statistics` - статистика по пользователям

### Авторизация
- `POST /api/auth/login` - вход в систему
- `POST /api/auth/logout` - выход из системы
- `POST /api/auth/refresh` - обновить токен
- `GET /api/auth/me` - информация о текущем пользователе

### Роли
- `GET /api/roles` - список ролей с правами доступа

---

## ✅ Статус исправления

- ✅ Удален импорт несуществующего модуля `../utils/validation`
- ✅ Валидация работает через Joi схемы
- ✅ Все зависимости установлены
- ✅ Backend готов к запуску

---

**Версия:** 1.0  
**Дата:** 25.01.2026  
**Статус:** ✅ Исправлено
