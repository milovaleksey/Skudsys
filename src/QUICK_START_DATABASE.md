# ⚡ Быстрый старт с базой данных

## 🎯 Цель
Запустить фронтенд + backend + MySQL за 5 минут.

---

## 📋 Предварительные требования

- ✅ MySQL установлен и запущен
- ✅ Node.js 16+ установлен
- ✅ Git установлен

---

## 🚀 Запуск за 3 шага

### Шаг 1: Настройка Backend

```bash
# Перейдите в папку backend
cd /root/utmn-security/backend

# Создайте .env файл
cat > .env << 'EOF'
PORT=3000
NODE_ENV=production
API_VERSION=v1

DB_HOST=localhost
DB_PORT=3306
DB_USER=utmn_security
DB_PASSWORD=YourMySQLPassword123
DB_NAME=utmn_security_db

JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
CORS_CREDENTIALS=true

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# ⚠️ ВАЖНО: Замените YourMySQLPassword123 на ваш пароль MySQL!
nano .env
```

### Шаг 2: Создание базы данных

```bash
# Вернитесь в корень проекта
cd /root/utmn-security

# Создайте базу данных
mysql -u root -p << EOF
CREATE DATABASE IF NOT EXISTS utmn_security_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'utmn_security'@'localhost' IDENTIFIED BY 'YourMySQLPassword123';
GRANT ALL PRIVILEGES ON utmn_security_db.* TO 'utmn_security'@'localhost';
FLUSH PRIVILEGES;
EOF

# ⚠️ ВАЖНО: Замените YourMySQLPassword123 на ваш пароль!

# Импортируйте схему
mysql -u utmn_security -p utmn_security_db < database/schema.sql
```

### Шаг 3: Создание администратора

```bash
# Сгенерируйте хеш пароля
cd /root/utmn-security/backend
node -e "console.log(require('bcrypt').hashSync('admin123', 10))" $2b$10$NAx5lcua/Uz/SGx0YhXGw.Y58nqVP//5cxAMdzSZvmyu6QGJ82bDC

# Скопируйте полученный хеш и вставьте в SQL:
mysql -u utmn_security -p utmn_security_db << 'EOF'
-- Создаём роль admin
INSERT INTO roles (name, display_name, description, permissions, is_system, created_at)
VALUES (
  'admin',
  'Администратор',
  'Полный доступ ко всем функциям системы',
  '["dashboard","dashboard-builder","passes","location","analytics","parking","storage","foreign-students","students","employees","users-settings","roles-settings","user-logs"]',
  1,
  NOW()
);

-- Создаём пользователя admin (замените ХЕШ_ПАРОЛЯ на сгенерированный выше)
INSERT INTO users (username, full_name, email, password_hash, role_id, auth_type, is_active, created_at)
VALUES (
  'admin',
  'Администратор Системы',
  'admin@utmn.ru',
  'ВАШ_СГЕНЕРИРОВАННЫЙ_ХЕШ',
  (SELECT id FROM roles WHERE name = 'admin'),
  'local',
  1,
  NOW()
);
EOF
```

---

## 🎯 Автоматический запуск

### Вариант A: Используйте готовый скрипт

```bash
# Сделайте скрипт исполняемым
chmod +x start-with-database.sh stop-servers.sh

# Запустите систему
./start-with-database.sh
```

### Вариант B: Ручной запуск

```bash
# Терминал 1: Backend
cd /root/utmn-security/backend
npm install  # Первый раз
npm start

# Терминал 2: Frontend
cd /root/utmn-security
npm install  # Первый раз
npm run dev
```

---

## ✅ Проверка

### 1. Backend работает:
```bash
curl http://localhost:3000/health
```

Ожидаемый ответ:
```json
{
  "success": true,
  "message": "API работает",
  "timestamp": "2026-01-21T...",
  "version": "v1"
}
```

### 2. Авторизация работает:
```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "authType": "local"
  }'
```

### 3. Frontend открывается:
Откройте в браузере: http://localhost:5173

Войдите:
- **Логин:** `admin`
- **Пароль:** `admin123`
- **Тип авторизации:** Локальная

---

## 📊 Импорт данных

### Импорт студентов

```sql
-- Пример добавления студентов
INSERT INTO students (full_name, student_id, faculty, course, group_name, email, phone, is_foreign, created_at)
VALUES
  ('Иванов Иван Иванович', 'ST2024001', 'ИМИ', 3, 'ПИ-21-1', 'ivanov@stud.utmn.ru', '+7-912-345-6789', 0, NOW()),
  ('Петров Пётр Петрович', 'ST2024002', 'ИМИ', 2, 'ИВТ-22-1', 'petrov@stud.utmn.ru', '+7-912-345-6790', 0, NOW()),
  ('Сидорова Мария Александровна', 'ST2024003', 'ФизТех', 4, 'ФИЗ-20-1', 'sidorova@stud.utmn.ru', '+7-912-345-6791', 0, NOW());
```

### Импорт сотрудников

```sql
INSERT INTO employees (full_name, employee_id, department, position, email, phone, created_at)
VALUES
  ('Козлов Андрей Викторович', 'EMP001', 'ИМИ', 'Доцент', 'kozlov@utmn.ru', '+7-3452-123-456', NOW()),
  ('Новикова Елена Ивановна', 'EMP002', 'ФизТех', 'Профессор', 'novikova@utmn.ru', '+7-3452-123-457', NOW());
```

### Импорт парковок

```sql
-- Парковка К1
INSERT INTO parking_lots (name, total_capacity, current_count, created_at)
VALUES ('Парковка К1', 50, 0, NOW());

-- Парковка К5
INSERT INTO parking_lots (name, total_capacity, current_count, created_at)
VALUES ('Парковка К5', 40, 0, NOW());
```

---

## 🛠️ Полезные команды

### Просмотр логов

```bash
# Backend логи
tail -f /root/utmn-security/backend.log

# Frontend логи (в терминале где запущен npm run dev)
```

### Остановка серверов

```bash
# Если использовали скрипт
./stop-servers.sh

# Вручную
pkill -f "node.*server.js"
pkill -f "vite"
```

### Перезапуск MySQL

```bash
sudo systemctl restart mysql
```

### Проверка процессов

```bash
# Проверка портов
netstat -tuln | grep -E '3000|5173|3306'

# Проверка процессов
ps aux | grep -E 'node|vite'
```

---

## 🐛 Решение проблем

### Проблема: Backend не подключается к MySQL

**Решение:**
```bash
# Проверьте, запущен ли MySQL
sudo systemctl status mysql

# Проверьте учётные данные
mysql -u utmn_security -p

# Проверьте настройки в backend/.env
cat backend/.env | grep DB_
```

### Проблема: CORS ошибка в браузере

**Решение:** Добавьте URL фронтенда в `backend/.env`:
```env
CORS_ORIGIN=http://localhost:5173,http://ваш_ip:3001
```

### Проблема: 401 Unauthorized при авторизации

**Решение:** Проверьте хеш пароля:
```bash
cd backend
node -e "const bcrypt = require('bcrypt'); bcrypt.compare('admin123', 'ВАШ_ХЕШ_ИЗ_БД', (err, res) => console.log(res))"
```

---

## 📚 Дополнительная документация

- [CONNECT_DATABASE.md](CONNECT_DATABASE.md) - Подробная инструкция
- [API_ENDPOINTS.md](API_ENDPOINTS.md) - Список всех API endpoints
- [database/schema.sql](database/schema.sql) - Схема базы данных
- [README_BACKEND.md](README_BACKEND.md) - Backend документация

---

## ✨ Готово!

Теперь вы можете:
1. Войти в систему через браузер
2. Начать импортировать данные
3. Настроить дашборды
4. Работать с отчётами

**Первый вход:**
- URL: http://localhost:5173
- Логин: `admin`
- Пароль: `admin123`

Удачи! 🚀
