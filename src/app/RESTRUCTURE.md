# 🔄 Реструктуризация проекта

## Цель
Организовать проект как monorepo с отдельными папками `/frontend` и `/backend`.

---

## ✅ Что уже сделано

Созданы конфигурационные файлы в `/frontend`:
- ✅ `package.json`
- ✅ `vite.config.ts`
- ✅ `tsconfig.json`
- ✅ `tsconfig.node.json`
- ✅ `tailwind.config.js`
- ✅ `postcss.config.js`
- ✅ `vite-env.d.ts`
- ✅ `index.html`

---

## 📋 Команды для завершения реструктуризации

### Шаг 1: Скопируйте исходные файлы

```bash
# Главные файлы
cp App.tsx frontend/
cp main.tsx frontend/

# Директории
cp -r components frontend/
cp -r contexts frontend/
cp -r lib frontend/
cp -r styles frontend/
cp -r public frontend/

# Если нужно, создайте директорию public
mkdir -p frontend/public
cp public/logo.svg frontend/public/ 2>/dev/null || true
```

### Шаг 2: Установите зависимости

```bash
cd frontend
npm install
```

### Шаг 3: Проверьте сборку

```bash
# Development
npm run dev

# Production build
npm run build
```

### Шаг 4: Обновите корневой package.json (опционально)

Создайте `/package.json` для управления monorepo:

```json
{
  "name": "utmn-security-monorepo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "install:frontend": "cd frontend && npm install",
    "install:backend": "cd backend && npm install",
    "install:all": "npm run install:frontend && npm run install:backend",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm start",
    "build:frontend": "cd frontend && npm run build",
    "build:all": "npm run build:frontend"
  }
}
```

---

## 📁 Новая структура проекта

```
/
├── frontend/                   # Frontend приложение
│   ├── components/            # React компоненты
│   ├── contexts/              # React контексты
│   ├── lib/                   # Библиотеки и утилиты
│   ├── styles/                # CSS файлы
│   ├── public/                # Статические файлы
│   ├── App.tsx                # Главный компонент
│   ├── main.tsx               # Точка входа
│   ├── index.html             # HTML шаблон
│   ├── package.json           # Зависимости frontend
│   ├── vite.config.ts         # Конфигурация Vite
│   ├── tsconfig.json          # Конфигурация TypeScript
│   ├── tailwind.config.js     # Конфигурация Tailwind
│   └── dist/                  # Собранное приложение (создается при build)
│
├── backend/                    # Backend приложение
│   ├── src/                   # Исходный код
│   │   ├── config/           # Конфигурация
│   │   ├── controllers/      # Контроллеры
│   │   ├── middleware/       # Middleware
│   │   ├── routes/           # Маршруты API
│   │   └── server.js         # Точка входа
│   └── package.json          # Зависимости backend
│
├── database/                   # SQL схемы и миграции
├── nginx/                      # Конфигурации Nginx
├── scripts/                    # Утилиты и скрипты
├── systemd/                    # Systemd сервисы
│
└── README.md                   # Документация
```

---

## 🔧 Преимущества новой структуры

1. **Четкое разделение** - Frontend и Backend полностью независимы
2. **Удобная разработка** - Каждая часть имеет свои зависимости
3. **Простое развертывание** - Можно деплоить части раздельно
4. **Масштабируемость** - Легко добавить mobile app, admin panel и т.д.
5. **CI/CD friendly** - Проще настроить автоматизацию

---

## 🚀 Команды для работы

### Frontend

```bash
# Перейти в frontend
cd frontend

# Установить зависимости
npm install

# Запустить dev сервер
npm run dev

# Собрать production
npm run build

# Предпросмотр production сборки
npm run preview
```

### Backend

```bash
# Перейти в backend
cd backend

# Установить зависимости
npm install

# Запустить сервер
npm start

# Запустить с автоперезагрузкой
npm run dev
```

### Monorepo (из корня)

```bash
# Установить все зависимости
npm run install:all

# Запустить frontend dev
npm run dev:frontend

# Запустить backend dev
npm run dev:backend

# Собрать frontend
npm run build:frontend
```

---

## 📦 Обновление BUILD_AND_DEPLOY.sh

После реструктуризации обновите скрипт сборки:

```bash
#!/bin/bash
set -e

echo "🚀 Сборка UTMN Security System"
echo ""

# Frontend
echo "📦 Сборка Frontend..."
cd frontend
npm run build
cd ..

echo "✅ Сборка завершена!"
echo ""
echo "📁 Frontend: frontend/dist/"
echo "📝 Следующие шаги:"
echo "   scp -r frontend/dist/* user@server:/var/www/utmn-security/frontend/"
echo "   sudo systemctl restart utmn-security"
```

---

## ⚠️ Важные замечания

1. **Git**: Добавьте `frontend/node_modules` и `frontend/dist` в `.gitignore`
2. **Nginx**: Обновите пути в конфигурации (если используется)
3. **Systemd**: Обновите пути в `utmn-security.service`
4. **Environment**: Создайте `frontend/.env` для переменных окружения

---

## 🔄 Миграция с текущей структуры

Если хотите сохранить текущую структуру работающей во время миграции:

```bash
# 1. Скопируйте файлы (не перемещайте)
cp App.tsx frontend/
cp main.tsx frontend/
cp -r components frontend/
cp -r contexts frontend/
cp -r lib frontend/
cp -r styles frontend/

# 2. Протестируйте новую структуру
cd frontend
npm install
npm run dev

# 3. Если все работает, удалите старые файлы из корня
cd ..
rm -rf components contexts lib styles
rm App.tsx main.tsx index.html
# и т.д.
```

---

**Статус:** 🟡 В процессе  
**Дата:** 25.01.2026
