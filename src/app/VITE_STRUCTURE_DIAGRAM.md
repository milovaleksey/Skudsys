# 🗂️ Визуальная диаграмма структуры проекта

## 📊 Текущая структура (Monorepo)

```
utmn-security/
│
├─── 📁 components/              ⭐ ОСНОВНЫЕ КОМПОНЕНТЫ ЗДЕСЬ
│    ├── LoginPage.tsx
│    ├── MainPage.tsx
│    ├── EngineeringPage.tsx
│    ├── AnalyticsPage.tsx
│    ├── ParkingPage.tsx
│    ├── StorageSystemsPage.tsx
│    └── ... (все остальные)
│
├─── 📁 contexts/                ⭐ ОСНОВНЫЕ КОНТЕКСТЫ ЗДЕСЬ
│    └── AuthContext.tsx
│
├─── 📁 lib/                     ⭐ ОСНОВНАЯ API БИБЛИОТЕКА ЗДЕСЬ
│    └── api.ts
│
├─── 📁 hooks/                   ⭐ ОСНОВНЫЕ ХУКИ ЗДЕСЬ
│    ├── useMQTT.ts
│    ├── useParkingMQTT.ts
│    └── ... (другие хуки)
│
├─── 📁 styles/                  ⭐ ОСНОВНЫЕ СТИЛИ ЗДЕСЬ
│    ├── globals.css
│    └── datepicker-custom.css
│
├─── 📄 App.tsx                  ⭐ ОСНОВНОЙ APP
├─── 📄 main.tsx                 ⭐ ОСНОВНАЯ ТОЧКА ВХОДА
├─── 📄 index.html               ⭐ ОСНОВНОЙ HTML
├─── 📄 vite.config.ts           ⭐ ОСНОВНОЙ VITE CONFIG
├─── 📄 tsconfig.json            ⭐ ОСНОВНОЙ TS CONFIG
├─── 📄 package.json             ⭐ ОСНОВНЫЕ ЗАВИСИМОСТИ
│
├─── 📁 frontend/                💡 FRONTEND КОПИЯ (для monorepo)
│    │
│    ├── 📁 contexts/            📋 Frontend копия контекстов
│    │    └── AuthContext.tsx
│    │
│    ├── 📁 lib/                 📋 Frontend копия API
│    │    └── api.ts
│    │
│    ├── 📁 styles/              📋 Frontend копия стилей
│    │    └── globals.css
│    │
│    ├── 📄 App.tsx              ✅ ИСПРАВЛЕНО: импорты ../components/
│    ├── 📄 main.tsx             ✅ ИСПРАВЛЕНО: импорты ../styles/
│    ├── 📄 index.html           📋 Frontend HTML
│    ├── 📄 vite.config.ts       ✅ ИСПРАВЛЕНО: алиасы на ../
│    ├── 📄 tsconfig.json        ✅ ИСПРАВЛЕНО: paths на ../
│    └── 📄 package.json         📋 Frontend зависимости
│
├─── 📁 backend/                 🔧 BACKEND
│    ├── 📁 src/
│    │    ├── 📁 controllers/
│    │    ├── 📁 routes/
│    │    ├── 📁 middleware/
│    │    ├── 📁 websocket/
│    │    └── server.js
│    └── 📄 package.json
│
└─── 📁 Документация Vite/       📚 ДОКУМЕНТАЦИЯ ПО ИСПРАВЛЕНИЮ
     ├── НАЧАТЬ_ЗДЕСЬ_VITE.md
     ├── VITE_ИСПРАВЛЕНИЕ.md
     ├── VITE_CHEATSHEET.md
     └── ... (другие документы)
```

---

## 🔄 Схема импортов

### Корневая структура (работает как есть)

```
/App.tsx
  ↓ import
  ./components/LoginPage  ← ✅ Прямой импорт
  ./components/MainPage   ← ✅ Прямой импорт
  ./contexts/AuthContext  ← ✅ Прямой импорт
```

### Frontend структура (ИСПРАВЛЕНО)

```
/frontend/App.tsx
  ↓ import
  ../components/LoginPage  ← ✅ ИСПРАВЛЕНО: был ./components/
  ../components/MainPage   ← ✅ ИСПРАВЛЕНО: был ./components/
  ../contexts/AuthContext  ← ✅ ИСПРАВЛЕНО: был ./contexts/
```

```
/frontend/main.tsx
  ↓ import
  ../styles/globals.css    ← ✅ ИСПРАВЛЕНО: был ./styles/
  ./App                    ← ✅ Локальный импорт
```

---

## ⚙️ Схема конфигурации Vite

### Корневой vite.config.ts

```typescript
/vite.config.ts
│
├─ alias: '@/components' → './components'     ✅ Локальная папка
├─ alias: '@/contexts'   → './contexts'       ✅ Локальная папка
├─ alias: '@/lib'        → './lib'            ✅ Локальная папка
├─ alias: '@/hooks'      → './hooks'          ✅ Локальная папка
│
└─ plugins: [react()]                         ✅ React плагин
```

### Frontend vite.config.ts (ИСПРАВЛЕНО)

```typescript
/frontend/vite.config.ts
│
├─ alias: '@/components' → '../components'    ✅ ИСПРАВЛЕНО: была './components'
├─ alias: '@/contexts'   → '../contexts'      ✅ ИСПРАВЛЕНО: была './contexts'
├─ alias: '@/lib'        → '../lib'           ✅ ИСПРАВЛЕНО: была './lib'
├─ alias: '@/hooks'      → '../hooks'         ✅ ИСПРАВЛЕНО: была './hooks'
│
└─ plugins: [react()]                         ✅ React плагин
```

---

## 🎯 Схема работы приложения

### Запуск из корня (рекомендуется для production)

```
npm run dev (из корня)
    ↓
vite.config.ts (корневой)
    ↓
main.tsx → App.tsx → компоненты из ./components/
    ↓
http://localhost:5173
```

### Запуск из /frontend (теперь тоже работает!)

```
cd frontend && npm run dev
    ↓
frontend/vite.config.ts (алиасы на ../)
    ↓
frontend/main.tsx → frontend/App.tsx → компоненты из ../components/
    ↓
http://localhost:5173
```

---

## 📦 Production сборка

### Из корня (рекомендуется)

```
npm run build (из корня)
    ↓
TypeScript компиляция
    ↓
Vite bundling
    ↓
/dist/
    ├── index.html
    ├── assets/
    │   ├── index-[hash].js
    │   └── index-[hash].css
    └── ...
```

### Nginx раздача

```
Nginx
    ↓
/var/www/utmn-security/dist/
    ↓
Статические файлы
    ↓
http://your-server/
```

---

## 🔀 Сравнение: До и После исправления

### ❌ ДО исправления

```
/frontend/App.tsx
  import { LoginPage } from './components/LoginPage'
                            ↑ ОШИБКА! ./components/ не существует

/frontend/vite.config.ts
  alias: '@/components': './components'
                         ↑ ОШИБКА! ./components/ не существует
```

### ✅ ПОСЛЕ исправления

```
/frontend/App.tsx
  import { LoginPage } from '../components/LoginPage'
                            ↑ ПРАВИЛЬНО! ../components/ существует

/frontend/vite.config.ts
  alias: '@/components': '../components'
                         ↑ ПРАВИЛЬНО! ../components/ существует
```

---

## 🗺️ Карта файлов конфигурации

### Корень проекта
```
/
├── vite.config.ts        ✅ Основной конфиг
├── tsconfig.json         ✅ TS конфиг
├── package.json          ✅ Зависимости
└── index.html            ✅ Точка входа
```

### Frontend
```
/frontend/
├── vite.config.ts        ✅ ИСПРАВЛЕНО: алиасы на ../
├── tsconfig.json         ✅ ИСПРАВЛЕНО: paths на ../
├── package.json          ✅ Frontend зависимости
└── index.html            ✅ Frontend точка входа
```

---

## 🔧 Схема реше��ия проблемы

### Проблема
```
Frontend пытался найти:
  /frontend/components/     ← НЕ СУЩЕСТВУЕТ ❌
  /frontend/contexts/       ← НЕ СУЩЕСТВУЕТ ❌ (есть своя копия, но импорт был неправильный)
  /frontend/lib/           ← НЕ СУЩЕСТВУЕТ ❌ (есть своя копия, но импорт был неправильный)
```

### Решение
```
Frontend теперь находит:
  /components/              ← СУЩЕСТВУЕТ ✅ (через ../)
  /contexts/                ← СУЩЕСТВУЕТ ✅ (через ../)
  /lib/                     ← СУЩЕСТВУЕТ ✅ (через ../)
```

---

## 🎨 Визуальная схема импортов

```
┌─────────────────────────────────────────────────────┐
│                    КОРЕНЬ ПРОЕКТА                   │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │components│  │contexts  │  │   lib    │         │
│  │  (все    │  │(AuthCtx) │  │ (api.ts) │         │
│  │компоненты│  └──────────┘  └──────────┘         │
│  └──────────┘                                      │
│       ↑              ↑              ↑              │
│       │              │              │              │
│  ┌────┴────────────┐ │              │              │
│  │   App.tsx       ├─┘              │              │
│  │   (корневой)    ├────────────────┘              │
│  └─────────────────┘                               │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │              FRONTEND/                       │  │
│  │                                              │  │
│  │  ┌─────────────────┐                        │  │
│  │  │  App.tsx        │                        │  │
│  │  │  (frontend)     │                        │  │
│  │  └─────────────────┘                        │  │
│  │         │                                    │  │
│  │         │ import '../components/...'        │  │
│  │         │ import '../contexts/...'          │  │
│  │         │ import '../lib/...'               │  │
│  │         └───────────────────┐               │  │
│  │                             ↓               │  │
│  │                    (идет в корневые папки)  │  │
│  └──────────────────────────────────────────────┘  │
│                             ↑                      │
│                             │                      │
│                    ✅ ИСПРАВЛЕНО!                  │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Итоговая схема работы

### Development (npm run dev)

```
┌─────────────────────────────────────────────────┐
│  Разработчик                                    │
└─────────────────┬───────────────────────────────┘
                  ↓
          ┌───────────────┐
          │ npm run dev   │
          └───────┬───────┘
                  ↓
    ┌─────────────────────────────┐
    │   Vite Dev Server           │
    │   (localhost:5173)          │
    └─────────────┬───────────────┘
                  ↓
    ┌─────────────────────────────┐
    │   Hot Module Replacement    │
    │   (мгновенное обновление)   │
    └─────────────┬───────────────┘
                  ↓
         ┌────────────────┐
         │   Браузер      │
         └────────────────┘
```

### Production (npm run build)

```
┌─────────────────────────────────────────────────┐
│  npm run build                                  │
└─────────────────┬───────────────────────────────┘
                  ↓
          ┌───────────────┐
          │ Vite Build    │
          └───────┬───────┘
                  ↓
          ┌───────────────┐
          │  TypeScript   │
          │  Compilation  │
          └───────┬───────┘
                  ↓
          ┌───────────────┐
          │  Bundling     │
          │  Minification │
          └───────┬───────┘
                  ↓
          ┌───────────────┐
          │   /dist/      │
          └───────┬───────┘
                  ↓
          ┌───────────────┐
          │    Nginx      │
          └───────┬───────┘
                  ↓
         ┌────────────────┐
         │   Клиенты      │
         └────────────────┘
```

---

## 🎯 Где что находится - Быстрая справка

| Что ищем | Где находится | Путь из frontend |
|----------|---------------|------------------|
| Компоненты | `/components/` | `../components/` |
| Контексты | `/contexts/` | `../contexts/` |
| API | `/lib/` | `../lib/` |
| Хуки | `/hooks/` | `../hooks/` |
| Стили | `/styles/` | `../styles/` |
| App | `/App.tsx` | Своя копия в frontend |
| Main | `/main.tsx` | Своя копия в frontend |

---

**Понимание этой структуры поможет избежать ошибок импортов!**

Смотрите также:
- **[VITE_ИСПРАВЛЕНИЕ.md](./VITE_ИСПРАВЛЕНИЕ.md)** - Объяснение исправлений
- **[VITE_CHEATSHEET.md](./VITE_CHEATSHEET.md)** - Быстрая справка
- **[FIX_SUMMARY.md](./FIX_SUMMARY.md)** - Итоги
