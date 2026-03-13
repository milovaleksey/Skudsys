# 🛡️ Система безопасности инфраструктуры ТюмГУ

Веб-приложение для управления безопасностью инфраструктуры Тюменского государственного университета с ролевым доступом, аналитикой и мониторингом.

![Версия](https://img.shields.io/badge/version-2.0-blue)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![MySQL](https://img.shields.io/badge/mysql-8.0%2B-orange)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ⚡ Важно! Vite Setup исправлен

**Если возникают ошибки с Vite:**

⚡ **[VITE_QUICK.md](./VITE_QUICK.md)** - 1 команда для запуска (самое быстрое!)

**Или смотрите подробнее:**
- 🚀 **[НАЧАТЬ_ЗДЕСЬ_VITE.md](./НАЧАТЬ_ЗДЕСЬ_VITE.md)** - Быстрый старт
- 📋 **[VITE_CHEATSHEET.md](./VITE_CHEATSHEET.md)** - Шпаргалка
- 🇷🇺 **[VITE_ИСПРАВЛЕНИЕ.md](./VITE_ИСПРАВЛЕНИЕ.md)** - Инструкция на русском
- 🔧 **[VITE_SETUP_README.md](./VITE_SETUP_README.md)** - Полное руководство
- 📝 **[FIX_SUMMARY.md](./FIX_SUMMARY.md)** - Краткая справка

**Утилиты:**
- 🧪 Проверка: `./test-vite-setup.sh`
- ⚡ Автоисправление: `./FIX_VITE_NOW.sh`
- 💡 Справка: `cat vite-help.txt`

---

## 🚀 Быстрый старт

**Развертывание за 3 команды:**

```bash
# 1. Права на выполнение
chmod +x make-scripts-executable.sh && ./make-scripts-executable.sh

# 2. Копирование файлов в /frontend
./copy-all-now.sh

# 3. Развертывание на сервер
sudo ./deploy-from-sync.sh
```

**📖 Подробная инструкция:** [START_HERE.md](./START_HERE.md)  
**📚 Навигация по документации:** [INDEX.md](./INDEX.md)

---

## 📁 Структура проекта (Monorepo)

```
/opt/utmn-security/
├── frontend/              # React + TypeScript + Vite
│   ├── components/       # React компоненты
│   ├── contexts/         # React контексты (Auth, etc.)
│   ├── lib/              # API client и утилиты
│   ├── styles/           # CSS стили
│   └── dist/             # Production build
│
├── backend/               # Node.js + Express + MySQL
│   ├── src/
│   │   ├── controllers/  # Контроллеры API
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Middleware (auth, rate limit)
│   │   └── config/       # Конфигурация
│   └── package.json
│
├── database/              # SQL схемы и миграции
├── nginx/                 # Конфигурации Nginx
├── systemd/               # Systemd сервисы
│
└── Скрипты развертывания:
    ├── deploy-from-sync.sh   # Полное развертывание
    ├── quick-deploy.sh       # Быстрое развертывание
    ├── rollback.sh           # Откат к предыдущей версии
    └── status.sh             # Проверка статуса
```

---

## 🎯 Возможности

### 🔐 Безопасность и контроль доступа
- **Ролевая система** - 5 типов ролей (admin, security, manager, operator, viewer)
- **JWT аутентификация** с refresh tokens
- **Двухфакторная авторизация** (local и SSO)
- **Аудит действий** - полный журнал всех операций
- **Rate limiting** - защита от DDoS атак

### 📊 Функционал
- **Dashboard** - главная панель с ключевыми метриками
- **Управление студентами** - учёт студентов и иностранных граждан
- **Управление сотрудниками** - база данных персонала
- **Журнал проходов** - мониторинг входов/выходов через турникеты
- **Парковка** - управление парковочными местами
- **Хранилище вещей** - учёт ячеек хранения
- **Аналитика** - отчёты и статистика
- **Поиск по идентификатору** - быстрый поиск людей
- **Местонахождение** - отслеживание перемещений

### 🎨 Технологии

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS v4
- Vite
- React Router v7
- Recharts (графики)
- Radix UI (компоненты)
- Lucide React (иконки)

**Backend:**
- Node.js 20.x
- Express.js
- MySQL 8.0
- JWT Authentication
- bcrypt (хеширование паролей)

**Deployment:**
- Nginx (reverse proxy)
- systemd (process management)
- PM2 (опционально)

---

## 📋 Требования

### Минимальные
- **OS:** Debian 11/12, Ubuntu 20.04+
- **CPU:** 2 cores
- **RAM:** 4 GB
- **Disk:** 20 GB

### Программное обеспечение
- Node.js 18.x или 20.x
- MySQL 8.0+
- Nginx 1.18+

---

## 🔧 Конфигурация

### Backend (.env)

```env
# База данных
DB_HOST=localhost
DB_PORT=3306
DB_NAME=utmn_security
DB_USER=utmn_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=24h

# Сервер
NODE_ENV=production
PORT=3000
API_VERSION=v1

# CORS
CORS_ORIGIN=http://your-server-ip
```

### Frontend (.env)

```env
# API URL (пусто для Nginx proxy)
VITE_API_BASE_URL=

# Версия API
VITE_API_VERSION=v1
```

---

## 🎭 Роли и права

| Роль | Описание | Доступ |
|------|----------|--------|
| **admin** | Администратор | Полный доступ ко всем функциям |
| **security** | Безопасность | Проходы, местонахождение, парковка, хранилище |
| **manager** | Менеджер | Аналитика, отчёты по студентам и сотрудникам |
| **operator** | Оператор | Просмотр и работа с данными |
| **viewer** | Наблюдатель | Только просмотр dashboard и аналитики |

---

## 🌐 API Endpoints

### Аутентификация
```
POST   /v1/auth/login          # Вход
POST   /v1/auth/logout         # Выход
POST   /v1/auth/refresh        # Обновление токена
GET    /v1/auth/me             # Текущий пользователь
```

### Пользователи
```
GET    /v1/users               # Список пользователей
GET    /v1/users/:id           # Пользователь по ID
POST   /v1/users               # Создать пользователя
PUT    /v1/users/:id           # Обновить пользователя
DELETE /v1/users/:id           # Удалить пользователя
```

### Студенты
```
GET    /v1/students            # Список студентов
GET    /v1/students/:id        # Студент по ID
GET    /v1/students/statistics # Статистика
```

### Сотрудники
```
GET    /v1/employees           # Список сотрудников
GET    /v1/employees/:id       # Сотрудник по ID
GET    /v1/employees/statistics # Статистика
```

### Логи доступа
```
GET    /v1/access-logs         # Журнал проходов
POST   /v1/access-logs         # Добавить запись
GET    /v1/access-logs/statistics # Статистика
```

### Парковка
```
GET    /v1/parking/lots        # Парковочные зоны
GET    /v1/parking/statistics  # Статистика
```

### Хранилище
```
GET    /v1/storage             # Ячейки хранения
POST   /v1/storage             # Создать запись
GET    /v1/storage/statistics  # Статистика
```

### Аналитика
```
GET    /v1/analytics/dashboard       # Dashboard метрики
GET    /v1/analytics/access-trends   # Тренды проходов
GET    /v1/analytics/parking-trends  # Тренды парковки
```

Полная документация API: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## 🛠️ Управление

### Backend сервис

```bash
# Статус
sudo systemctl status utmn-security

# Запуск/остановка
sudo systemctl start utmn-security
sudo systemctl stop utmn-security
sudo systemctl restart utmn-security

# Логи
sudo journalctl -u utmn-security -f
```

### Nginx

```bash
# Перезагрузка
sudo systemctl reload nginx

# Проверка конфигурации
sudo nginx -t

# Логи
sudo tail -f /var/log/nginx/utmn-security-*.log
```

### База данных

```bash
# Резервная копия
mysqldump -u utmn_user -p utmn_security > backup.sql

# Восстановление
mysql -u utmn_user -p utmn_security < backup.sql
```

---

## 📊 База данных

### Основные таблицы

- **roles** - Роли пользователей
- **users** - Пользователи системы
- **sessions** - Активные сессии
- **students** - Студенты университета
- **employees** - Сотрудники
- **dormitories** - Общежития
- **access_points** - Точки доступа (турникеты)
- **access_logs** - Журнал проходов
- **parking_spots** - Парковочные места
- **storage_lockers** - Ячейки хранения
- **audit_log** - Журнал аудита

### Views и процедуры

- `v_users_with_roles` - Пользователи с ролями
- `v_today_access_stats` - Статистика проходов за сегодня
- `v_parking_stats` - Статистика парковки
- `sp_register_access` - Регистрация прохода
- `sp_occupy_parking_spot` - Занять парковочное место

---

## 🔒 Безопасность

- ✅ JWT токены с auto-refresh
- ✅ bcrypt хеширование паролей (cost factor: 10)
- ✅ Rate limiting (100 запросов / 15 минут)
- ✅ Helmet.js безопасные заголовки
- ✅ CORS защита
- ✅ SQL injection защита (prepared statements)
- ✅ XSS защита
- ✅ Аудит всех действий

---

## 📝 Разработка

### Установка для разработки

```bash
npm install
cd backend && npm install && cd ..
```

### Запуск dev серверов

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npm run dev
```

### Сборка production

```bash
# Frontend
npm run build

# Backend не требует сборки
cd backend
npm start
```

### Линтинг

```bash
# Frontend
npm run lint

# Backend
cd backend
npm run lint
```

---

## 📖 Документация

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Полное руководство по развертыванию
- [BACKEND_SETUP.md](./BACKEND_SETUP.md) - Настройка backend и базы данных
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API документация
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - Руководство разработчика
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Структура проекта

---

## 🐛 Решение проблем

### Backend не запускается

```bash
# Проверьте логи
sudo journalctl -u utmn-security -n 50

# Проверьте MySQL
sudo systemctl status mysql
mysql -u utmn_user -p utmn_security -e "SELECT 1;"
```

### Frontend не грузится

```bash
# Проверьте Nginx
sudo nginx -t
sudo systemctl status nginx

# Проверьте файлы
ls -la /var/www/utmn-security/dist/
```

### API не работает

```bash
# Health check
curl http://localhost:3000/health
curl http://localhost/health

# Проверьте CORS
cat /var/www/utmn-security/backend/.env | grep CORS
```

Больше информации: [DEPLOYMENT.md - Решение проблем](./DEPLOYMENT.md#решение-проблем)

---

## 🤝 Участие в разработке

1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

---

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE)

---

## 👥 Команда

**Тюменский государственный университет**

- Фирменный цвет: `#00aeef`
- Версия: 2.0
- Дата: Январь 2026

---

## 🔗 Полезные ссылки

- [Официальный сайт ТюмГУ](https://www.utmn.ru/)
- [React документация](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Express.js](https://expressjs.com/)
- [MySQL документация](https://dev.mysql.com/doc/)

---

**Сделано с ❤️ для ТюмГУ**