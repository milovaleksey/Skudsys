# 📝 Шпаргалка по командам

## 🚀 Быстрый старт

```bash
# 1. Создать БД
mysql -u root -p
CREATE DATABASE utmn_security;
EXIT;

# 2. Установить зависимости
cd backend && npm install && cd ..
npm install

# 3. Настроить backend/.env
# Указать DB_PASSWORD

# 4. Инициализировать таблицы
cd backend && node src/scripts/initDatabase.js && cd ..

# 5. Запустить
./start.sh  # Linux/Mac
start.bat   # Windows
```

---

## 🔧 Основные команды

### Запуск

```bash
# Автоматически
./start.sh          # Linux/Mac
start.bat           # Windows

# Вручную - Backend
cd backend
npm run dev

# Вручную - Frontend
npm run dev
```

### Остановка

```
Ctrl + C в каждом терминале
```

---

## 🗄️ MySQL

### Подключение
```bash
mysql -u root -p
mysql -u root -p utmn_security
```

### Создание БД
```sql
CREATE DATABASE utmn_security CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW DATABASES;
```

### Проверка таблиц
```sql
USE utmn_security;
SHOW TABLES;
SELECT COUNT(*) FROM users;
```

### Создание пользователя
```sql
CREATE USER 'utmn_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON utmn_security.* TO 'utmn_user'@'localhost';
FLUSH PRIVILEGES;
```

### Сброс пароля root
```bash
# Windows
mysqld --skip-grant-tables

# Новый терминал
mysql -u root
ALTER USER 'root'@'localhost' IDENTIFIED BY 'новый_пароль';
FLUSH PRIVILEGES;
```

---

## 📦 NPM команды

### Установка
```bash
npm install              # Установить все зависимости
npm install --force      # Принудительная установка
npm ci                   # Чистая установка (CI/CD)
```

### Очистка
```bash
rm -rf node_modules package-lock.json
npm install
```

### Backend
```bash
cd backend
npm run dev              # Запуск в dev режиме
npm start                # Запуск в production
npm test                 # Тесты
```

### Frontend
```bash
npm run dev              # Запуск Vite dev сервера
npm run build            # Сборка для production
npm run preview          # Предпросмотр production сборки
```

---

## 🔍 Проверка работы

### Backend
```bash
# Health check
curl http://localhost:3000/health

# Логин
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_security","password":"AdminSecure2024!"}'

# Получить пользователей (нужен токен)
curl http://localhost:3000/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Frontend
```bash
# Открыть в браузере
open http://localhost:5173        # Mac
start http://localhost:5173       # Windows
xdg-open http://localhost:5173    # Linux
```

---

## 🐛 Решение проблем

### Убить процесс на порту

**Windows:**
```cmd
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Проверить какие порты заняты

**Windows:**
```cmd
netstat -ano | findstr LISTENING
```

**Mac/Linux:**
```bash
lsof -i -P -n | grep LISTEN
netstat -tulpn | grep LISTEN
```

### Перезапуск MySQL

**Windows:**
```cmd
net stop MySQL80
net start MySQL80
```

**Mac:**
```bash
brew services restart mysql
```

**Linux:**
```bash
sudo systemctl restart mysql
sudo systemctl status mysql
```

---

## 📂 Полезные пути

```bash
# Конфигурация Backend
backend/.env
backend/src/config/database.js

# Логи
backend/logs/

# База данных скрипты
backend/database/schema.sql
backend/database/seed.sql
backend/src/scripts/initDatabase.js

# Frontend конфигурация
vite.config.ts
src/config/api.ts
```

---

## 🔐 Тестовые пользователи

```
Администратор:
  username: admin_security
  password: AdminSecure2024!

Безопасность:
  username: security_operator
  password: SecureOp2024!

Менеджер:
  username: manager_analytics
  password: Manager2024!

Оператор:
  username: operator_main
  password: Operator2024!

Наблюдатель:
  username: observer_general
  password: Observer2024!
```

---

## 📊 SQL запросы для проверки

```sql
-- Количество пользователей
SELECT COUNT(*) FROM users;

-- Список пользователей
SELECT user_id, username, full_name, role FROM users;

-- Количество студентов
SELECT COUNT(*) FROM students;

-- Количество сотрудников
SELECT COUNT(*) FROM employees;

-- Последние логи доступа
SELECT * FROM access_logs ORDER BY log_id DESC LIMIT 10;

-- Пользователи по ролям
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Все таблицы
SHOW TABLES;

-- Структура таблицы
DESCRIBE users;

-- Очистить таблицу
TRUNCATE TABLE access_logs;

-- Удалить базу (ОСТОРОЖНО!)
DROP DATABASE utmn_security;
```

---

## 🔄 Git команды

```bash
# Клонировать
git clone <URL>

# Статус
git status

# Обновить
git pull

# Сбросить изменения
git reset --hard
git clean -fd

# Создать ветку
git checkout -b feature/new-feature

# Коммит
git add .
git commit -m "Описание изменений"
git push
```

---

## 📝 Backend .env шаблон

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=utmn_security
DB_USER=root
DB_PASSWORD=ваш_пароль

JWT_SECRET=utmn_security_secret_key_2026_minimum_32_characters
JWT_EXPIRES_IN=24h

NODE_ENV=development
PORT=3000
API_VERSION=v1

CORS_ORIGIN=http://localhost:5173
CORS_CREDENTIALS=true
```

---

## 🌐 URL после запуска

```
Frontend:    http://localhost:5173
Backend:     http://localhost:3000
API:         http://localhost:3000/v1
Health:      http://localhost:3000/health
```

---

## 📚 Документация

```
INSTALLATION_GUIDE.md   - Полная инструкция по установке
QUICK_INSTALL.md        - Быстрая установка
COMMANDS_CHEATSHEET.md  - Эта шпаргалка
START_GUIDE.md          - Руководство по запуску
CODE_STRUCTURE.md       - Структура кода
```

---

## 🛠️ Инструменты разработки

```bash
# Проверка синтаксиса
npm run lint              # ESLint

# Форматирование кода
npm run format            # Prettier

# Сборка
npm run build

# Тесты
npm test
npm run test:watch
npm run test:coverage
```

---

## 🔥 Горячие клавиши

```
Ctrl + C         - Остановить сервер
Ctrl + Z         - Приостановить процесс
Ctrl + D         - Выйти из MySQL консоли
F5               - Обновить браузер
Ctrl + Shift + R - Жесткое обновление браузера (очистить кеш)
F12              - Открыть консоль браузера
```

---

**Версия:** 1.0  
**Дата:** 20.01.2026
