# ✅ Чеклист исправления Vite - Проверьте всё перед запуском

## 📋 Быстрая проверка (обязательно)

### ✅ Шаг 1: Структура проекта
```bash
[ ] Папка /components/ существует и содержит компоненты
[ ] Папка /contexts/ существует
[ ] Папка /lib/ существует
[ ] Папка /hooks/ существует
[ ] Папка /styles/ существует
[ ] Файл /App.tsx существует
[ ] Файл /main.tsx существует
```

**Проверить автоматически:**
```bash
./check-structure.sh
```

### ✅ Шаг 2: Frontend конфигурация
```bash
[ ] Файл /frontend/vite.config.ts существует
[ ] Файл /frontend/tsconfig.json существует
[ ] Файл /frontend/App.tsx существует
[ ] Файл /frontend/main.tsx существует
```

### ✅ Шаг 3: Исправления применены
```bash
[ ] /frontend/vite.config.ts - алиасы указывают на '../components'
[ ] /frontend/tsconfig.json - paths включают '../components'
[ ] /frontend/App.tsx - импорты используют '../components/LoginPage'
[ ] /frontend/main.tsx - стили импортируются из '../styles/globals.css'
```

**Проверить автоматически:**
```bash
./test-vite-setup.sh
```

### ✅ Шаг 4: Зависимости установлены
```bash
[ ] node_modules/ в корне существует
[ ] package-lock.json в корне существует
[ ] Vite установлен (npm list vite)
[ ] React установлен (npm list react)
```

**Проверить:**
```bash
npm list vite react
```

---

## 🔧 Полная проверка (рекомендуется)

### 1. Файловая система

#### Корневые файлы
- [ ] `/vite.config.ts` - существует
- [ ] `/tsconfig.json` - существует
- [ ] `/package.json` - существует
- [ ] `/index.html` - существует
- [ ] `/App.tsx` - существует
- [ ] `/main.tsx` - существует

#### Frontend файлы
- [ ] `/frontend/vite.config.ts` - существует
- [ ] `/frontend/tsconfig.json` - существует
- [ ] `/frontend/package.json` - существует
- [ ] `/frontend/index.html` - существует
- [ ] `/frontend/App.tsx` - существует
- [ ] `/frontend/main.tsx` - существует

#### Компоненты
- [ ] `/components/LoginPage.tsx` - существует
- [ ] `/components/MainPage.tsx` - существует
- [ ] `/components/EngineeringPage.tsx` - существует
- [ ] Другие компоненты в `/components/`

#### Контексты и библиотеки
- [ ] `/contexts/AuthContext.tsx` - существует
- [ ] `/lib/api.ts` - существует
- [ ] `/hooks/` - папка существует

#### Стили
- [ ] `/styles/globals.css` - существует
- [ ] `/styles/` - другие стили

### 2. Конфигурация Vite

#### /vite.config.ts (корень)
- [ ] Импортирует `@vitejs/plugin-react`
- [ ] Содержит `plugins: [react()]`
- [ ] Алиас `@/components` указывает на `./components`
- [ ] Алиас `@/hooks` указывает на `./hooks`
- [ ] Настроен proxy для `/v1` и `/health`

**Проверить:**
```bash
cat vite.config.ts | grep -E "@/components|@/hooks|plugins"
```

#### /frontend/vite.config.ts
- [ ] Импортирует `@vitejs/plugin-react`
- [ ] Содержит `plugins: [react()]`
- [ ] Алиас `@/components` указывает на `../components`
- [ ] Алиас `@/contexts` указывает на `../contexts`
- [ ] Алиас `@/lib` указывает на `../lib`
- [ ] Алиас `@/hooks` указывает на `../hooks`
- [ ] Настроен proxy для `/v1` и `/health`

**Проверить:**
```bash
cat frontend/vite.config.ts | grep -E "\.\./components|\.\./hooks"
```

### 3. Конфигурация TypeScript

#### /tsconfig.json (корень)
- [ ] Содержит `paths` с `@/components/*`
- [ ] Содержит `paths` с `@/hooks/*`
- [ ] `include` содержит `components`
- [ ] `include` содержит `hooks`

**Проверить:**
```bash
cat tsconfig.json | grep -E "paths|include"
```

#### /frontend/tsconfig.json
- [ ] Содержит `paths` с `../components/*`
- [ ] Содержит `paths` с `../hooks/*`
- [ ] `include` содержит `../components`
- [ ] `include` содержит `../hooks`

**Проверить:**
```bash
cat frontend/tsconfig.json | grep -E "\.\./components|\.\./hooks"
```

### 4. React компоненты

#### /frontend/App.tsx
- [ ] Импортирует `LoginPage` из `../components/LoginPage`
- [ ] Импортирует `MainPage` из `../components/MainPage`
- [ ] Импортирует `AuthProvider, useAuth` из `../contexts/AuthContext`
- [ ] Экспортирует по умолчанию `App`

**Проверить:**
```bash
cat frontend/App.tsx | grep "import.*\.\./components"
```

#### /frontend/main.tsx
- [ ] Импортирует стили из `../styles/globals.css`
- [ ] Импортирует `App` из `./App`
- [ ] Содержит `ReactDOM.createRoot`

**Проверить:**
```bash
cat frontend/main.tsx | grep "import.*\.\./styles"
```

### 5. Зависимости

#### package.json (корень)
- [ ] `vite` версия 5.x
- [ ] `@vitejs/plugin-react` версия 4.x
- [ ] `react` версия 18.x
- [ ] `typescript` версия 5.x

**Проверить:**
```bash
cat package.json | grep -E "vite|react|typescript"
```

#### /frontend/package.json
- [ ] `vite` версия 5.x
- [ ] `@vitejs/plugin-react` версия 4.x
- [ ] `react` версия 18.x
- [ ] `typescript` версия 5.x

**Проверить:**
```bash
cat frontend/package.json | grep -E "vite|react|typescript"
```

---

## 🧪 Тестирование

### Автоматические тесты
```bash
[ ] ./test-vite-setup.sh - все тесты прошли
[ ] ./check-structure.sh - структура правильная
[ ] npm run build - сборка успешна (необязательно)
```

### Ручная проверка
```bash
[ ] npm run dev - запускается без ошибок
[ ] http://localhost:5173 - открывается
[ ] Консоль браузера - нет ошибок импортов
[ ] Компоненты загружаются
[ ] Нет ошибок 404
```

---

## 🚀 Запуск

### Первый запуск
```bash
[ ] Сделаны исполняемыми все скрипты
[ ] Запущен ./FIRST_RUN_VITE.sh
[ ] Приложение запустилось
[ ] Нет ошибок в консоли
```

### Обычный запуск
```bash
[ ] ./FIX_VITE_NOW.sh работает
[ ] npm run dev работает
[ ] ./start-frontend.sh работает
```

---

## 📝 Документация

### Созданные файлы
```bash
[ ] НАЧАТЬ_ЗДЕСЬ_VITE.md - существует
[ ] VITE_ИСПРАВЛЕНИЕ.md - существует
[ ] VITE_CHEATSHEET.md - существует
[ ] VITE_SETUP_README.md - существует
[ ] FIX_SUMMARY.md - существует
[ ] vite-help.txt - существует
[ ] VITE_QUICK.md - существует
```

### Утилиты
```bash
[ ] FIX_VITE_NOW.sh - исполняемый
[ ] test-vite-setup.sh - исполняемый
[ ] check-structure.sh - исполняемый
[ ] start-frontend.sh - исполняемый
[ ] FIRST_RUN_VITE.sh - исполняемый
```

**Сделать исполняемыми:**
```bash
chmod +x *.sh
```

---

## ⚙️ Production

### На сервере
```bash
[ ] Используется корневая структура (не /frontend)
[ ] npm run build выполняется из корня
[ ] Результат в /dist
[ ] Nginx раздает /dist (не /frontend/dist)
[ ] Backend на порту 3000
[ ] Frontend на порту 80/443 через Nginx
```

---

## ❌ Распространенные проблемы

### Проблема 1: "Cannot find module './components/LoginPage'"
- [ ] Проверить `/frontend/App.tsx` - должно быть `../components/LoginPage`
- [ ] Проверить что `/components/LoginPage.tsx` существует
- [ ] Запускать из корня: `npm run dev`

### Проблема 2: "Can't resolve '@/components'"
- [ ] Проверить `/frontend/vite.config.ts` - алиас должен быть `../components`
- [ ] Перезапустить dev сервер

### Проблема 3: TypeScript ошибки
- [ ] Проверить `/frontend/tsconfig.json` - paths должны быть `../components/*`
- [ ] Перезапустить VS Code / IDE

### Проблема 4: Vite не запускается
- [ ] Проверить node_modules установлены: `npm install`
- [ ] Проверить версию Node.js: `node --version` (должно быть ≥18)
- [ ] Очистить кеш: `rm -rf node_modules package-lock.json && npm install`

---

## ✅ Финальная проверка

### Готово к использованию если:
- [x] Все файлы конфигурации на месте
- [x] Все тесты проходят
- [x] `npm run dev` запускается без ошибок
- [x] http://localhost:5173 открывается
- [x] Нет ошибок в консоли браузера
- [x] Компоненты отображаются

### Запустить финальный тест:
```bash
# 1. Проверка
./test-vite-setup.sh

# 2. Запуск
./FIX_VITE_NOW.sh
```

---

## 🎯 Итог

**Если все пункты отмечены - конфигурация исправлена правильно!**

Можете продолжать разработку как обычно:
```bash
npm run dev  # Разработка
npm run build  # Production
```

**На production сервере:**
```bash
npm run build  # Из КОРНЯ проекта
```

---

**Последнее обновление:** Март 2026  
**Статус:** ✅ Готово к проверке

Прочитайте **VITE_ИСПРАВЛЕНИЕ.md** для деталей.
