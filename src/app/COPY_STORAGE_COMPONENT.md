# 🔧 Копирование StorageSystemsPage в /frontend

## 🎯 Проблема

```
Failed to resolve import "sonner@2.0.3" from "components/StorageSystemsPage.tsx"
```

Компонент `StorageSystemsPage.tsx` находится в корне `/components/`, но Vite ищет его в `/frontend/components/`.

## ✅ Решение

### Вариант 1: Запустить скрипт миграции (рекомендуется)

```bash
cd /var/www/utmn-security/debug
bash migrate-to-frontend.sh
```

Этот скрипт скопирует ВСЕ компоненты из `/components` в `/frontend/components`.

### Вариант 2: Скопировать вручную только нужный компонент

```bash
cd /var/www/utmn-security/debug

# Создать директорию components если не существует
mkdir -p frontend/components

# Скопировать только StorageSystemsPage
cp components/StorageSystemsPage.tsx frontend/components/

# Также скопировать зависимости если их нет
cp -n components/MainPage.tsx frontend/components/ 2>/dev/null || true
cp -n hooks/useStorageWebSocket.ts frontend/hooks/ 2>/dev/null || true
```

### Вариант 3: Скопировать всё вручную

```bash
cd /var/www/utmn-security/debug

# Создать директорию
mkdir -p frontend/components

# Копировать все компоненты
cp -r components/* frontend/components/
```

## 🔍 Проверка

После копирования проверьте:

```bash
ls -la frontend/components/StorageSystemsPage.tsx
```

Должен показать файл:
```
-rw-r--r-- 1 user user 15123 ... frontend/components/StorageSystemsPage.tsx
```

## 🚀 Перезапуск frontend

```bash
cd frontend
npm run dev
```

Ошибка должна исчезнуть! 🎉

---

## 📝 Примечание

Проект использует monorepo структуру:
- `/components/` - исходные компоненты (корень)
- `/frontend/components/` - компоненты для dev-сервера Vite

При разработке нужно обновлять оба места или использовать скрипт миграции.
