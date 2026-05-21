# 📋 Быстрое копирование файлов в /frontend

## ✅ Что уже скопировано:
- ✅ App.tsx
- ✅ main.tsx  
- ✅ contexts/AuthContext.tsx

## 📦 Что нужно скопировать:

Выполните эти команды из корня проекта:

```bash
# Components
cp -r components frontend/

# Lib
cp -r lib frontend/

# Styles
cp -r styles frontend/

# Public (если есть)
if [ -d "public" ]; then
  cp -r public frontend/
else
  mkdir -p frontend/public
fi
```

## Одной командой:

```bash
cp -r components lib styles frontend/ && ([ -d "public" ] && cp -r public frontend/ || mkdir -p frontend/public)
```

## После копирования:

```bash
cd frontend
npm run build
```

Если всё работает - готово! 🎉
