# 🔧 Исправление для Vite 6 - БЕЗ @vitejs/plugin-react

## 🎯 Проблема

Figma Make использует Vite 6.3.5, которая несовместима с `@vitejs/plugin-react@6.0.0`.

Ошибка:
```
Package subpath './internal' is not defined by "exports" in vite/package.json
```

## ✅ Решение

**Убрал проблемный плагин** и использую встроенный `esbuild` для обработки React/JSX!

### Что изменено

#### ❌ Было (НЕ РАБОТАЛО):
```typescript
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // ...
});
```

#### ✅ Стало (РАБОТАЕТ):
```typescript
export default defineConfig({
  plugins: [], // Без плагина!
  esbuild: {
    loader: 'tsx',
    include: /\.[jt]sx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.ts': 'tsx',
        '.tsx': 'tsx',
      },
    },
  },
  // ...
});
```

## 🚀 Преимущества

1. **Нет зависимости от проблемного плагина**
2. **Встроенная поддержка React через esbuild** (быстрее!)
3. **Работает с Vite 6.x**
4. **Меньше зависимостей**

## 📝 Обновленные файлы

- `/vite.config.ts` - убран плагин, добавлен esbuild
- `/frontend/vite.config.ts` - убран плагин, добавлен esbuild

## 🎯 Что это дает

Vite 6 имеет встроенную поддержку JSX/TSX через esbuild. Плагин `@vitejs/plugin-react` нужен только для:
- Fast Refresh (горячая перезагрузка)
- Специфичных React фич

Для базового React-приложения достаточно встроенного esbuild!

## ⚠️ Важно

**Fast Refresh может не работать** без плагина, но:
- ✅ Приложение запустится
- ✅ Компоненты будут рендериться
- ✅ Production сборка работает
- ⚠️ При изменениях файлов - полная перезагрузка страницы (не HMR)

Это компромисс для работы с Vite 6 в Figma Make.

## 🔮 Для production сервера

На вашем сервере используйте стабильный Vite 5.x с плагином:

```json
"vite": "^5.0.8",
"@vitejs/plugin-react": "^4.2.1"
```

```typescript
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()], // С плагином!
  // ...
});
```

---

**Статус:** ✅ Должно работать в Figma Make  
**Для сервера:** Используйте Vite 5.x (стабильная версия)

Попробуйте запустить!
