# Руководство по установке Backend

## 📋 Требования

- **Node.js:** >= 18.0.0
- **npm:** >= 9.0.0
- **MySQL:** >= 8.0
- **Git**

---

## 🚀 Установка

### 1. Клонирование проекта

```bash
git clone https://github.com/utmn/security-system.git
cd security-system/backend
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка MySQL

#### Создание базы данных

```bash
# Войти в MySQL
mysql -u root -p

# Выполнить SQL скрипт
mysql> source ../database/schema.sql

# Или через командную строку
mysql -u root -p < ../database/schema.sql
```

Скрипт `schema.sql` создаст:
- ✅ База данных `utmn_security`
- ✅ 11 таблиц (users, roles, sessions, audit_log, students, employees, и т.д.)
- ✅ 5 системных ролей
- ✅ 5 тестовых пользователей
- ✅ Представления (views) для статистики
- ✅ Хранимые процедуры
- ✅ Триггеры для аудита

### 4. Настройка переменных окружения

```bash
# Скопировать пример файла
cp .env.example .env

# Отредактировать .env
nano .env
```

**Обязательные переменные:**

```env
# База данных
DB_HOST=localhost
DB_PORT=3306
DB_NAME=utmn_security
DB_USER=root
DB_PASSWORD=ваш_пароль

# JWT секрет (генерируйте случайную строку!)
JWT_SECRET=сгенерируйте_случайную_строку_минимум_32_символа

# Порт сервера
PORT=3000
```

**Генерация случайного JWT_SECRET:**

```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 5. Проверка подключения к БД

```bash
# Запустить тестовое подключение
npm run db:test
```

---

## 🏃 Запуск

### Development mode (с автоперезагрузкой)

```bash
npm run dev
```

### Production mode

```bash
npm start
```

Сервер запустится на `http://localhost:3000`

### Проверка работы

```bash
# Проверить здоровье API
curl http://localhost:3000/health

# Должен вернуть:
# {
#   "success": true,
#   "message": "API работает",
#   "timestamp": "2026-01-19T...",
#   "version": "v1"
# }
```

---

## 🧪 Тестирование API

### 1. Авторизация

```bash
# Локальная авторизация
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_security",
    "password": "test123"
  }'

# Сохраните полученный токен
TOKEN="полученный_токен"
```

### 2. Получить список пользователей

```bash
curl -X GET "http://localhost:3000/v1/users?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Создать пользователя

```bash
curl -X POST http://localhost:3000/v1/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "new_user",
    "fullName": "Новый Пользователь",
    "email": "newuser@utmn.ru",
    "password": "securePass123",
    "role": "operator",
    "authType": "local",
    "isActive": true
  }'
```

### 4. Получить информацию о себе

```bash
curl -X GET http://localhost:3000/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## 👥 Тестовые пользователи

После выполнения `schema.sql` доступны следующие пользователи:

| Username | Пароль | Роль | Тип |
|----------|--------|------|-----|
| admin_security | test123 | admin | local |
| sidorov | test123 | manager | local |
| viewer_user | test123 | viewer | local |
| petrova@utmn.ru | N/A (SSO) | security | sso |
| kuznetsova@utmn.ru | N/A (SSO) | operator | sso |

**Примечание:** SSO пользователи требуют настройки интеграции с системой ТюмГУ.

---

## 📁 Структура проекта

```
backend/
├── src/
│   ├── config/
│   │   └── database.js           # Настройка MySQL подключения
│   ├── controllers/
│   │   ├── auth.controller.js    # Логика авторизации
│   │   └── user.controller.js    # Логика управления пользователями
│   ├── middleware/
│   │   ├── auth.js               # JWT авторизация и проверка прав
│   │   ├── errorHandler.js       # Обработка ошибок
│   │   └── rateLimiter.js        # Rate limiting
│   ├── routes/
│   │   ├── auth.routes.js        # Маршруты авторизации
│   │   ├── user.routes.js        # Маршруты пользователей
│   │   ├── role.routes.js        # Маршруты ролей
│   │   └── ...
│   └── server.js                 # Главный файл сервера
├── .env                          # Переменные окружения (не в git!)
├── .env.example                  # Пример переменных
├── package.json                  # Зависимости
└── README.md                     # Это руководство
```

---

## 🔧 Конфигурация

### CORS

По умолчанию API принимает запросы с любых доменов. Для production настройте в `.env`:

```env
CORS_ORIGIN=https://security.utmn.ru,https://admin.security.utmn.ru
CORS_CREDENTIALS=true
```

### Rate Limiting

Ограничения по умолчанию:
- **API запросы:** 100 запросов / 15 минут
- **Авторизация:** 5 попыток / 15 минут

Настройка в `.env`:

```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX_ATTEMPTS=5
```

### JWT Token

Время жизни токена по умолчанию: **24 часа**

```env
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

---

## 🔐 Безопасность

### 1. Хеширование паролей

Используется **bcrypt** с 10 раундами:

```env
BCRYPT_ROUNDS=10
```

### 2. Защита заголовков

Используется **helmet.js** для установки безопасных HTTP заголовков.

### 3. Аудит действий

Все действия пользователей записываются в таблицу `audit_log`:
- Авторизация/выход
- Создание/изменение/удаление записей
- IP адрес и User-Agent

### 4. Защита от SQL инъекций

Все запросы используют **prepared statements** через mysql2.

---

## 📊 Мониторинг и логи

### Логирование запросов

Используется **morgan** для логирования HTTP запросов:

```bash
GET /v1/users 200 45.123 ms
POST /v1/auth/login 200 156.789 ms
```

### Уровни логирования

```env
LOG_LEVEL=debug  # debug, info, warn, error
LOG_FILE_PATH=./logs/app.log
```

---

## 🐛 Отладка

### Включить детальные логи

```bash
NODE_ENV=development npm run dev
```

В режиме development в ответах ошибок будет stack trace.

### Проверить подключение к MySQL

```bash
mysql -u root -p utmn_security -e "SELECT COUNT(*) FROM users;"
```

### Проверить таблицы

```bash
mysql -u root -p utmn_security -e "SHOW TABLES;"
```

---

## 🚀 Deployment (Production)

### 1. Переменные окружения

```env
NODE_ENV=production
PORT=3000
DB_HOST=production-mysql-host
JWT_SECRET=очень_длинный_случайный_секрет
CORS_ORIGIN=https://security.utmn.ru
```

### 2. Использование PM2 (рекомендуется)

```bash
# Установить PM2
npm install -g pm2

# Запустить приложение
pm2 start src/server.js --name utmn-security-api

# Автозапуск при перезагрузке
pm2 startup
pm2 save

# Мониторинг
pm2 monit

# Логи
pm2 logs utmn-security-api
```

### 3. Nginx reverse proxy

```nginx
server {
    listen 80;
    server_name api.security.utmn.ru;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. SSL сертификат

```bash
# Установить certbot
sudo apt install certbot python3-certbot-nginx

# Получить сертификат
sudo certbot --nginx -d api.security.utmn.ru
```

---

## 📝 API Документация

Полная документация API доступна в файле `/database/API.md`

### Основные endpoints:

- `POST /v1/auth/login` - авторизация
- `GET /v1/users` - список пользователей
- `GET /v1/roles` - список ролей
- `GET /v1/students` - список студентов
- `GET /v1/employees` - список сотрудников
- `GET /v1/access-logs` - журнал проходов
- `GET /v1/parking/spots` - парковочные места
- `GET /v1/storage/lockers` - ячейки хранения
- `GET /v1/analytics/dashboard` - данные для дашборда

---

## ❓ FAQ

### Q: Как сбросить пароль пользователя?

```sql
-- Пароль: newpass123
UPDATE users 
SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE username = 'admin_security';
```

### Q: Как добавить новую системную роль?

```sql
INSERT INTO roles (id, name, display_name, description, permissions, is_system)
VALUES ('custom_role', 'custom_role', 'Моя роль', 'Описание', 
        '["dashboard", "passes"]', FALSE);
```

### Q: Как посмотреть логи аудита?

```sql
SELECT 
    a.action,
    a.entity_type,
    u.username,
    a.created_at
FROM audit_log a
LEFT JOIN users u ON a.user_id = u.id
ORDER BY a.created_at DESC
LIMIT 50;
```

### Q: API не отвечает

1. Проверьте, запущен ли сервер: `pm2 status`
2. Проверьте логи: `pm2 logs utmn-security-api`
3. Проверьте подключение к MySQL: `mysql -u root -p -e "SELECT 1"`
4. Проверьте порт: `netstat -tulpn | grep 3000`

---

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи сервера
2. Проверьте подключение к MySQL
3. Убедитесь что все переменные в `.env` заполнены
4. Обратитесь к документации API (`/database/API.md`)

---

**Версия:** 1.0  
**Дата:** 19.01.2026  
**ТюмГУ - Системы безопасности инфраструктуры**
