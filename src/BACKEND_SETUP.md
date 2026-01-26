# 🔧 Настройка Backend

Руководство по настройке backend части системы UTMN Security.

---

## 🚀 Быстрый старт

### Вариант A: Автоматический (рекомендуется)

```bash
# Запустить полное развертывание с проверкой backend
sudo ./deploy-production.sh
```

Скрипт автоматически:
- ✅ Проверит MySQL
- ✅ Создаст .env файл
- ✅ Создаст базу данных
- ✅ Выполнит миграции
- ✅ Развернет всё

### Вариант B: Пошаговый

```bash
# 1. Генерация секретов
chmod +x generate-secrets.sh
./generate-secrets.sh

# 2. Создание .env
cp backend/.env.example backend/.env
nano backend/.env  # Вставьте сгенерированные секреты

# 3. Создание базы данных
mysql -u root -p < database/init.sql

# 4. Установка зависимостей
cd backend
npm install

# 5. Запуск
npm start
```

---

## 📝 Конфигурация .env

### Обязательные параметры

```env
# База данных
DB_HOST=localhost
DB_NAME=utmn_security
DB_USER=utmn_user
DB_PASSWORD=ваш_надежный_пароль

# JWT (используйте сгенерированные!)
JWT_SECRET=ваш_случайный_секрет_32_символа
JWT_REFRESH_SECRET=ваш_другой_секрет_32_символа

# CORS (ваш домен!)
CORS_ORIGIN=http://your-server-ip
```

### Генерация секретов

```bash
# Автоматически
./generate-secrets.sh

# Вручную
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 32  # JWT_REFRESH_SECRET
```

---

## 🗄️ База данных

### Создание пользователя MySQL

```bash
# Войти в MySQL
sudo mysql -u root -p

# Выполнить команды
CREATE DATABASE utmn_security CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'utmn_user'@'localhost' IDENTIFIED BY 'ваш_пароль';
GRANT ALL PRIVILEGES ON utmn_security.* TO 'utmn_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Инициализация схемы

```bash
# Автоматически (при deploy-production.sh)
# Выберите "y" когда скрипт спросит

# Вручную
mysql -u utmn_user -p utmn_security < database/init.sql
```

### Проверка

```bash
mysql -u utmn_user -p utmn_security -e "SHOW TABLES;"
```

Должно показать:
```
+---------------------------+
| Tables_in_utmn_security   |
+---------------------------+
| access_logs               |
| access_points             |
| audit_log                 |
| dormitories               |
| employees                 |
| parking_spots             |
| roles                     |
| sessions                  |
| storage_lockers           |
| students                  |
| users                     |
+---------------------------+
```

---

## 👤 Тестовый пользователь

После инициализации БД создается тестовый администратор:

- **Username:** admin
- **Password:** Admin2025
- **Role:** admin

⚠️ **ВАЖНО:** Измените пароль после первого входа!

---

## 🔐 Безопасность

### Проверочный список

- [ ] JWT_SECRET - случайная строка минимум 32 символа
- [ ] JWT_REFRESH_SECRET - отличается от JWT_SECRET
- [ ] DB_PASSWORD - надежный пароль (не используйте 'password')
- [ ] CORS_ORIGIN - ваш реальный домен (не localhost в production)
- [ ] .env файл имеет права 600 (только владелец может читать)
- [ ] .env НЕ в Git (проверьте .gitignore)
- [ ] Тестовый пароль admin изменен

### Установка прав на .env

```bash
chmod 600 backend/.env
chown www-data:www-data backend/.env  # В production
```

### Изменение пароля admin

```sql
-- Сгенерировать хеш нового пароля в Node.js
-- node -e "const bcrypt = require('bcrypt'); bcrypt.hash('НовыйПароль123', 10, (err, hash) => console.log(hash));"

-- Обновить в БД
UPDATE users 
SET password = 'новый_bcrypt_хеш' 
WHERE username = 'admin';
```

---

## 🔌 API Endpoints

### Health Check

```bash
curl http://localhost:3000/health
```

Ответ:
```json
{
  "status": "ok",
  "timestamp": "2026-01-25T14:30:00.000Z"
}
```

### Авторизация

```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin2025",
    "authType": "local"
  }'
```

---

## 📊 Мониторинг

### Логи backend

```bash
# Systemd
sudo journalctl -u utmn-security -f

# PM2 (если используется)
pm2 logs utmn-security

# Прямой запуск
tail -f backend/logs/app.log
```

### Проверка процесса

```bash
# Systemd
sudo systemctl status utmn-security

# PM2
pm2 status

# Вручную
ps aux | grep node
```

### Проверка подключения к БД

```bash
# Из backend директории
node -e "
const mysql = require('mysql2');
const conn = mysql.createConnection({
  host: 'localhost',
  user: 'utmn_user',
  password: 'ваш_пароль',
  database: 'utmn_security'
});
conn.connect(err => {
  if (err) console.error('❌ Ошибка:', err.message);
  else console.log('✅ Подключение успешно');
  conn.end();
});
"
```

---

## 🛠️ Миграции

### Структура директории

```
database/
├── init.sql              # Начальная инициализация
└── migrations/           # Миграции схемы
    ├── 001_add_column.sql
    ├── 002_create_index.sql
    └── ...
```

### Создание миграции

```bash
# Создать файл
nano database/migrations/003_my_migration.sql

# Формат имени: XXX_description.sql
# XXX - порядковый номер (001, 002, 003...)
```

### Выполнение миграций

```bash
# Автоматически (при deploy-production.sh)
sudo ./deploy-production.sh

# Вручную - все миграции
for f in database/migrations/*.sql; do
  mysql -u utmn_user -p utmn_security < "$f"
done

# Вручную - конкретная миграция
mysql -u utmn_user -p utmn_security < database/migrations/001_add_column.sql
```

---

## 🐛 Решение проблем

### Backend не запускается

```bash
# Проверьте логи
sudo journalctl -u utmn-security -n 50

# Типичные проблемы:
# 1. MySQL не запущен
sudo systemctl start mysql

# 2. Неверные данные в .env
cat backend/.env

# 3. Порт 3000 занят
sudo lsof -i :3000
```

### Ошибка подключения к БД

```bash
# Проверьте MySQL
sudo systemctl status mysql

# Проверьте пользователя
mysql -u utmn_user -p

# Проверьте права
mysql -u root -p -e "SHOW GRANTS FOR 'utmn_user'@'localhost';"

# Пересоздайте пользователя
mysql -u root -p
DROP USER 'utmn_user'@'localhost';
CREATE USER 'utmn_user'@'localhost' IDENTIFIED BY 'новый_пароль';
GRANT ALL PRIVILEGES ON utmn_security.* TO 'utmn_user'@'localhost';
FLUSH PRIVILEGES;
```

### JWT ошибки

```bash
# Проверьте что JWT_SECRET установлен
grep JWT_SECRET backend/.env

# Перегенерируйте секреты
./generate-secrets.sh

# Обновите .env и перезапустите
sudo systemctl restart utmn-security
```

### CORS ошибки

```bash
# Проверьте CORS_ORIGIN
grep CORS_ORIGIN backend/.env

# Должен совпадать с доменом frontend
# В development: http://localhost, http://localhost:5173
# В production: http://your-server-ip или http://your-domain.com

# Обновите и перезапустите
nano backend/.env
sudo systemctl restart utmn-security
```

---

## 📚 Дополнительные ресурсы

- [deploy-production.sh](./deploy-production.sh) - Автоматическое развертывание
- [generate-secrets.sh](./generate-secrets.sh) - Генератор секретов
- [database/init.sql](./database/init.sql) - Схема БД
- [backend/.env.example](./backend/.env.example) - Пример конфигурации
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API документация

---

**Дата:** 25.01.2026  
**Версия:** 1.0.0
