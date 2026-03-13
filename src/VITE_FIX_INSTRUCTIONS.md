# 🔧 Инструкция по исправлению проблем с Vite

## Проблема

У вас **monorepo структура** с двумя отдельными копиями frontend:
- Корневая: `/App.tsx`, `/components/`, `/contexts/`, `/lib/`
- Frontend: `/frontend/App.tsx`, `/frontend/contexts/`, `/frontend/lib/`

**НО**: компоненты находятся только в корневой папке `/components/`!

Когда вы запускаете `npm run dev` из `/frontend/`, Vite не может найти компоненты, потому что импорты в `/frontend/App.tsx` указывают на `./components/`, которой там нет.

## Что было исправлено

### 1. `/frontend/vite.config.ts`
Обновлены алиасы путей, чтобы они указывали на корневые папки:
```typescript
alias: {
  '@': resolve(__dirname, '../'),           // Корень проекта
  '@/components': resolve(__dirname, '../components'),
  '@/styles': resolve(__dirname, '../styles'),
  '@/contexts': resolve(__dirname, '../contexts'),
  '@/lib': resolve(__dirname, '../lib'),
  '@/hooks': resolve(__dirname, '../hooks'),
}
```

### 2. `/frontend/App.tsx`
Обновлены импорты для использования относительных путей:
```typescript
import { LoginPage } from '../components/LoginPage';
import { MainPage } from '../components/MainPage';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
```

### 3. `/frontend/main.tsx`
Обновлен путь к глобальным стилям:
```typescript
import '../styles/globals.css';
```

### 4. `/vite.config.ts` (корневой)
Добавлен алиас для hooks для согласованности.

## Как запускать приложение

### Вариант 1: Из корня (текущая рабочая версия на сервере)
```bash
# Из корневой директории проекта
npm run dev
```

Это запустит приложение используя:
- `/App.tsx`
- `/components/`
- `/contexts/`
- `/lib/`
- `/vite.config.ts`

### Вариант 2: Из /frontend (после исправления)
```bash
# Перейти в папку frontend
cd frontend
npm run dev
```

Теперь это будет работать, т.к. алиасы указывают на корневые папки.

### Вариант 3: Автоматический скрипт
```bash
# Сделать исполняемым
chmod +x start-frontend.sh

# Запустить
./start-frontend.sh
```

Скрипт автоматически определит структуру и запустит из нужной папки.

## Рекомендации

### Для production (на сервере)
**Используйте корневую структуру** - она у вас уже работает:
```bash
npm run dev          # для разработки
npm run build        # для production
```

### Если хотите перейти на monorepo
Вам нужно будет:
1. Скопировать `/components/` в `/frontend/components/`
2. Скопировать `/hooks/` в `/frontend/hooks/`
3. Убедиться что `/frontend/contexts/` и `/frontend/lib/` актуальны
4. Обновить все импорты в `/frontend/App.tsx` обратно на относительные `./`

**НО** для вашего случая рекомендую оставить как есть - корневая структура проще и работает.

## Проверка работоспособности

### 1. Проверить структуру
```bash
# Должны существовать:
ls -la components/          # Корневые компоненты
ls -la contexts/           # Корневые контексты
ls -la lib/                # Корневая библиотека API
ls -la hooks/              # Корневые хуки

# Во frontend должны быть свои копии:
ls -la frontend/contexts/  # Frontend контексты
ls -la frontend/lib/       # Frontend API
```

### 2. Запустить из корня
```bash
npm run dev
```

Если открывается на `http://localhost:5173` и нет ошибок импортов - всё работает!

### 3. Запустить из frontend (необязательно)
```bash
cd frontend
npm run dev
```

Теперь это тоже должно работать благодаря обновленным алиасам.

## Частые ошибки

### "Cannot find module './components/LoginPage'"
**Причина**: Запускаете из `/frontend/`, но импорты используют `./components/`  
**Решение**: 
- Либо запускайте из корня: `cd .. && npm run dev`
- Либо измените импорты на `../components/` (уже исправлено)

### "Module not found: Error: Can't resolve '@/components'"
**Причина**: Алиасы в vite.config.ts неправильно настроены  
**Решение**: Уже исправлено в `/frontend/vite.config.ts`

### Vite dependency errors
**Причина**: Разные версии зависимостей в корне и `/frontend/`  
**Решение**: Используйте одну структуру. Рекомендую корневую.

## Итого

✅ **Исправлено**: Алиасы и импорты теперь корректные  
✅ **Работает**: Можно запускать как из корня, так и из /frontend  
✅ **Рекомендация**: Для production используйте корневую структуру - она уже работает на сервере

## На сервере

Убедитесь что на production сервере вы запускаете из корня:
```bash
# В директории проекта (не в /frontend)
npm run build
```

И nginx настроен на раздачу `/dist` из корня проекта.
