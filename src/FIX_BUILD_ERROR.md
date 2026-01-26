# 🔧 Исправление ошибки сборки

## ❌ Ошибка

```
[vite]: Rollup failed to resolve import "/main.tsx" from "/opt/utmn-security/frontend/index.html".
```

## ✅ Решение

Файлы `App.tsx` и `main.tsx` уже скопированы в `/frontend`, но нужно скопировать остальные директории.

---

## Вариант 1: Автоматический (рекомендуется)

```bash
# Дайте права на выполнение
chmod +x copy-all-now.sh

# Запустите скрипт
./copy-all-now.sh
```

---

## Вариант 2: Вручную

```bash
# Из корня проекта выполните:
cp -r components frontend/
cp -r lib frontend/
cp -r styles frontend/

# Public (если есть)
if [ -d "public" ]; then
  cp -r public frontend/
else
  mkdir -p frontend/public
fi
```

---

## Вариант 3: Одной командой

```bash
cp -r components lib styles frontend/ && ([ -d "public" ] && cp -r public frontend/ || mkdir -p frontend/public)
```

---

## Проверка

После копирования запустите сборку:

```bash
cd frontend
npm run build
```

Должно пройти успешно! ✅

---

## Что уже скопировано

- ✅ `/frontend/App.tsx`
- ✅ `/frontend/main.tsx`
- ✅ `/frontend/contexts/AuthContext.tsx`
- ✅ Все конфигурационные файлы (package.json, vite.config.ts и т.д.)

## Что нужно скопировать

- ⏳ `/components` → `/frontend/components`
- ⏳ `/lib` → `/frontend/lib`
- ⏳ `/styles` → `/frontend/styles`
- ⏳ `/public` → `/frontend/public`

---

## Структура после копирования

```
frontend/
├── components/           ← Скопировать
├── contexts/            ✅ Готово
├── lib/                 ← Скопировать
├── styles/              ← Скопировать
├── public/              ← Скопировать
├── App.tsx              ✅ Готово
├── main.tsx             ✅ Готово
├── index.html           ✅ Готово
├── package.json         ✅ Готово
└── vite.config.ts       ✅ Готово
```

---

**Готово к использованию!** 🚀
