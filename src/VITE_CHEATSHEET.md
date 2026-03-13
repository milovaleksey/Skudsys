# 📋 Vite - Шпаргалка

## 🚀 Запуск приложения

| Способ | Команда |
|--------|---------|
| **Автоматический** | `./FIX_VITE_NOW.sh` |
| Из корня | `npm run dev` |
| Из /frontend | `cd frontend && npm run dev` |
| Авто-определение | `./start-frontend.sh` |

## 🧪 Проверка и тестирование

| Что проверить | Команда |
|---------------|---------|
| **Полные тесты** | `./test-vite-setup.sh` |
| Структура проекта | `./check-structure.sh` |
| Health check | `curl http://localhost:5173` |

## 📁 Структура проекта

```
/
├── components/          ← Основные компоненты ЗДЕСЬ
├── contexts/           ← Контексты ЗДЕСЬ
├── lib/               ← API ЗДЕСЬ
├── hooks/             ← Хуки ЗДЕСЬ
├── App.tsx            ← Главный App ЗДЕСЬ
│
└── frontend/
    ├── App.tsx        ← Импортирует из ../components
    ├── main.tsx       ← Импортирует из ../styles
    └── vite.config.ts ← Алиасы на ../
```

## 🔧 Что исправлено

| Файл | Что изменено |
|------|--------------|
| `/frontend/vite.config.ts` | Алиасы → `../components`, `../contexts` |
| `/frontend/tsconfig.json` | Paths → корневые папки |
| `/frontend/App.tsx` | Импорты → `../components/` |
| `/frontend/main.tsx` | Стили → `../styles/` |

## 📚 Документация

| Тип | Файл |
|-----|------|
| **Быстрый старт** | [НАЧАТЬ_ЗДЕСЬ_VITE.md](./НАЧАТЬ_ЗДЕСЬ_VITE.md) |
| Русский язык | [VITE_ИСПРАВЛЕНИЕ.md](./VITE_ИСПРАВЛЕНИЕ.md) |
| Полное руководство | [VITE_SETUP_README.md](./VITE_SETUP_README.md) |
| Навигация | [VITE_FIX_INDEX.md](./VITE_FIX_INDEX.md) |

## ⚙️ Production

```bash
# На сервере (ничего не менять!)
npm run build  # Из корня

# Результат в /dist
```

## ❌ Частые ошибки

| Ошибка | Решение |
|--------|---------|
| "Cannot find module './components'" | Исправлено в `/frontend/App.tsx` |
| "Can't resolve '@/components'" | Исправлено в `/frontend/vite.config.ts` |
| Vite dependency errors | Используйте корневую структуру |

## 🔍 Диагностика

```bash
# 1. Проверить структуру
./check-structure.sh

# 2. Тесты
./test-vite-setup.sh

# 3. Запуск
./FIX_VITE_NOW.sh
```

## 💡 Советы

- ✅ На production - запускать из КОРНЯ
- ✅ Для разработки - можно откуда угодно
- ✅ Сначала тесты, потом запуск
- ✅ Если работает - не трогать

## 📞 Помощь

**Проблема:** "Не запускается"  
**Решение:** `./FIX_VITE_NOW.sh`

**Проблема:** "Ошибки импортов"  
**Решение:** Смотрите [VITE_ИСПРАВЛЕНИЕ.md](./VITE_ИСПРАВЛЕНИЕ.md)

**Проблема:** "Какую команду использовать?"  
**Решение:** `./start-frontend.sh`

---

**Одна команда для всего:**
```bash
./FIX_VITE_NOW.sh
```

🎉 Готово!
