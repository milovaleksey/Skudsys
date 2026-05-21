# Структура проекта

```
utmn-security/
│
├── 📁 Frontend (React + TypeScript + Vite)
│   ├── components/              # React компоненты
│   │   ├── ui/                 # Shadcn UI компоненты (27 файлов)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   │
│   │   ├── figma/              # Утилитарные компоненты
│   │   │   └── ImageWithFallback.tsx
│   │   │
│   │   ├── DashboardBuilder.tsx      # Конструктор дашбордов
│   │   ├── EmployeesReportPage.tsx   # Отчет по сотрудникам
│   │   ├── IdentifierSearchPage.tsx  # Поиск по идентификатору
│   │   ├── LocationPage.tsx          # Где находится человек
│   │   ├── LoginPage.tsx             # Страница входа
│   │   ├── Logo.tsx                  # Логотип ТюмГУ
│   │   ├── MainPage.tsx              # Главная страница + навигация
│   │   ├── ParkingPage.tsx           # Парковочная система
│   │   ├── PassesReportPage.tsx      # Отчет о проходах
│   │   ├── RoleSwitcher.tsx          # Переключатель ролей (demo)
│   │   ├── RolesManagementPage.tsx   # Управление ролями
│   │   ├── StudentsReportPage.tsx    # Отчет по студентам
│   │   ├── UnderConstructionPage.tsx # Заглушка для страниц
│   │   ├── UserLogsPage.tsx          # Логи пользователей
│   │   └── UsersSettingsPage.tsx     # Управление пользователями
│   │
│   ├── contexts/               # React Context
│   │   └── AuthContext.tsx    # Контекст авторизации
│   │
│   ├── lib/                   # Утилиты
│   │   └── api.ts            # API клиент
│   │
│   ├── public/               # Публичные файлы
│   │   └── logo.svg         # SVG логотип
│   │
│   ├── styles/              # Стили
│   │   ├── globals.css      # Глобальные CSS + Tailwind
│   │   └── datepicker-custom.css  # Кастомные стили календаря
│   │
│   ├── App.tsx              # Корневой компонент
│   ├── main.tsx             # Точка входа
│   ├── index.html           # HTML шаблон
│   ├── package.json         # Frontend зависимости
│   ├── vite.config.ts       # Vite конфигурация (HTTP)
│   ├── vite.config.https.ts # Vite конфигурация (HTTPS)
│   ├── tailwind.config.js   # Tailwind CSS
│   ├── tsconfig.json        # TypeScript конфигурация
│   └── postcss.config.js    # PostCSS конфигурация
│
├── 📁 Backend (Node.js + Express)
│   ├── src/
│   │   ├── controllers/          # Контроллеры API
│   │   │   ├── auth.controller.js   # Авторизация
│   │   │   └── user.controller.js   # Пользователи
│   │   │
│   │   ├── routes/               # Маршруты API
│   │   │   ├── accessLog.routes.js   # Логи проходов
│   │   │   ├── analytics.routes.js   # Аналитика
│   │   │   ├── auth.routes.js        # Авторизация
│   │   │   ├── employee.routes.js    # Сотрудники
│   │   │   ├── parking.routes.js     # Парковка
│   │   │   ├── role.routes.js        # Роли
│   │   │   ├── storage.routes.js     # Хранилище
│   │   │   ├── student.routes.js     # Студенты
│   │   │   └── user.routes.js        # Пользователи
│   │   │
│   │   ├── middleware/           # Middleware
│   │   │   ├── auth.js              # JWT аутентификация
│   │   │   ├── errorHandler.js      # Обработка ошибок
│   │   │   └── rateLimiter.js       # Rate limiting
│   │   │
│   │   ├── config/              # Конфигурация
│   │   │   └── database.js         # Подключение к MySQL
│   │   │
│   │   ├── server.js            # HTTP сервер (основной)
│   │   └── server-https.js      # HTTPS сервер
│   │
│   └── package.json             # Backend зависимости
│
├── 📁 Database (MySQL)
│   ├── schema.sql               # SQL схема базы данных
│   │
│   └── Таблицы (11):
│       ├── users                   # Пользователи
│       ├── roles                   # Роли
│       ├── permissions             # Права
│       ├── role_permissions        # Роли ↔ Права
│       ├── role_external_groups    # AD/SSO группы
│       ├── students                # Студенты
│       ├── employees               # Сотрудники
│       ├── access_logs             # Логи проходов
│       ├── parking                 # Парковка
│       ├── storage                 # Хранилище
│       └── user_logs               # Логи пользователей
│
├── 📁 Nginx (Reverse Proxy)
│   ├── nginx.conf                    # Базовая конфигурация
│   ├── production.conf               # Production
│   ├── utmn-security.conf           # Основная
│   ├── utmn-security-dev.conf       # Dev
│   ├── utmn-security-external.conf  # External
│   └── utmn-security-http.conf      # HTTP
│
├── 📁 Scripts (Утилиты)
│   ├── create-admin.sql            # Создать админа
│   ├── generate-password.js        # Генератор паролей
│   ├── generate-ssl-cert.sh        # SSL сертификаты
│   └── setup-nginx.sh              # Настройка Nginx
│
├── 📁 Systemd (Автозапуск)
│   └── utmn-security.service      # Systemd сервис
│
├── 📁 Documentation (Документация)
│   ├── README.md                   # Главная документация
│   ├── START.md                    # Быстрый старт
│   ├── QUICK_REFERENCE.md          # Шпаргалка
│   ├── MYSQL_EXTERNAL_ACCESS.md    # MySQL доступ
│   ├── DEVELOPER_GUIDE.md          # Для разработчиков
│   ├── API_DOCUMENTATION.md        # API docs
│   ├── CHANGELOG.md                # История изменений
│   ├── PROJECT_STRUCTURE.md        # Структура (этот файл)
│   ├── Attributions.md             # Атрибуции (защищен)
│   └── guidelines/Guidelines.md    # Гайдлайны (защищен)
│
└── 📁 Deployment Scripts (Развертывание)
    ├── deploy.sh                   # Основной скрипт развертывания
    ├── deploy-http.sh              # HTTP развертывание
    ├── deploy-external.sh          # External развертывание
    ├── setup-mysql-external.sh     # MySQL внешний доступ
    ├── check-status.sh             # Проверка статуса
    ├── reset-database.sh           # Сброс БД
    ├── start-with-database.sh      # Запуск с БД
    ├── stop-servers.sh             # Остановка серверов
    ├── fix-all.sh                  # Исправление всех проблем
    ├── fix-imports.sh              # Исправление импортов
    ├── make-executable.sh          # Сделать скрипты исполняемыми
    └── create-release.sh           # Создание релиза
```

## Размеры и статистика

### Количество файлов

```
Компоненты UI:        27 файлов
Страницы React:       13 файлов
Backend routes:       9 файлов
Nginx конфиги:        5 файлов
SQL таблицы:          11 таблиц
Документация:         9 файлов
Скрипты развертывания: 13 файлов
```

### Языки программирования

```
TypeScript (Frontend):  ~15,000 строк
JavaScript (Backend):   ~3,500 строк
SQL (Database):         ~1,000 строк
Shell Scripts:          ~2,000 строк
CSS/Tailwind:          ~500 строк
Конфигурация:          ~300 строк
```

### Зависимости

**Frontend (package.json):**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Shadcn/ui
- date-fns
- lucide-react
- recharts
- xlsx
- mqtt
- react-grid-layout
- И другие...

**Backend (backend/package.json):**
- Express
- mysql2
- bcrypt
- jsonwebtoken
- cors
- dotenv
- express-rate-limit

## Ключевые файлы

### Конфигурация

| Файл | Описание |
|------|----------|
| `vite.config.ts` | Vite bundler конфигурация |
| `tailwind.config.js` | Tailwind CSS настройки |
| `tsconfig.json` | TypeScript компилятор |
| `backend/.env` | Backend переменные окружения |
| `nginx/*.conf` | Nginx reverse proxy |

### Точки входа

| Компонент | Файл |
|-----------|------|
| Frontend | `main.tsx` → `App.tsx` |
| Backend | `backend/src/server.js` |
| Database | `database/schema.sql` |
| Systemd | `systemd/utmn-security.service` |

### API Endpoints

Все маршруты определены в:
```
backend/src/routes/*.routes.js
```

И зарегистрированы в:
```
backend/src/server.js
```

## Потоки данных

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────┐
│    Nginx    │ :80
│  (Reverse   │
│   Proxy)    │
└──────┬──────┘
       │
       ├─────► Frontend (Vite) :5173
       │       └─── React Components
       │            └─── API Client (lib/api.ts)
       │
       └─────► Backend (Express) :3001
               ├─── Routes
               ├─── Controllers
               ├─── Middleware (Auth, Rate Limit)
               └─── MySQL :3306
                    └─── 11 таблиц
```

## Система прав доступа

```
users (username, password, role)
  │
  └──► roles (name, displayName)
         │
         ├──► role_permissions
         │      └──► permissions (name, description)
         │
         └──► role_external_groups (для AD/SSO)
                └──► external group mappings
```

## Сборка и развертывание

### Development

```bash
# Frontend
npm run dev          # → http://localhost:5173

# Backend
cd backend
npm start            # → http://localhost:3001
```

### Production

```bash
# Автоматическое развертывание
sudo ./deploy.sh

# Создается:
- /opt/utmn-security/           # Код
- /etc/nginx/sites-available/   # Nginx конфиг
- /etc/systemd/system/          # Systemd сервис
- /var/log/nginx/               # Логи
```

## Порты

| Сервис | Порт | Описание |
|--------|------|----------|
| Nginx | 80 | HTTP (public) |
| Vite | 5173 | Frontend dev server |
| Express | 3001 | Backend API |
| MySQL | 3306 | Database |

## Логи

| Компонент | Путь |
|-----------|------|
| Backend | `journalctl -u utmn-security` |
| Nginx | `/var/log/nginx/error.log` |
| MySQL | `/var/log/mysql/error.log` |

---

**Последнее обновление:** 23.01.2026  
**Версия проекта:** 1.0
