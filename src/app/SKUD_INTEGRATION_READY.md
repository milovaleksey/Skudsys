# 🚀 SKUD API Integration - Quick Start

## ✅ Что было сделано

Добавлен второй коннектор к MySQL для работы с базой данных СКУД.

### Новые файлы Backend:

1. **`/backend/src/config/skudDatabase.js`** - коннектор к БД СКУД
2. **`/backend/src/controllers/skudController.js`** - контроллер для работы с данными
3. **`/backend/src/routes/skud.js`** - API роуты

### Обновлённые файлы:

1. **`/backend/src/server.js`** - подключение нового коннектора и роутов
2. **`/lib/api.ts`** - добавлен `skudApi` с методами
3. **`/components/IdentifierSearchPage.tsx`** - интеграция с реальным API

---

## 📋 Конфигурация

Добавьте в `/backend/.env`:

```bash
# База данных СКУД (можно использовать ту же БД)
SKUD_DB_HOST=localhost
SKUD_DB_PORT=3306
SKUD_DB_USER=utmn_user
SKUD_DB_PASSWORD=your_password
SKUD_DB_NAME=utmn_security
SKUD_DB_CONNECTION_LIMIT=10
```

Если переменные `SKUD_DB_*` не указаны, используются значения из `DB_*`.

---

## 🔧 Запуск

### 1. Перезапустите backend:

```bash
cd backend
npm start
```

**Вы должны увидеть:**
```
✅ Подключено к MySQL
✅ Подключено к базе данных SKUD
🚀 Сервер запущен на порту 3000
```

### 2. Frontend уже готов

Страница "Поиск по идентификатору" теперь работает с реальным API.

---

## 🧪 Тестирование

### Через браузер:

1. Войдите в систему
2. Перейдите в "Поиск по идентификатору"
3. Введите:
   - Номер карты (например: `123.456789` или `1234567890123`)
   - Часть ФИО (например: `Иванов`)
   - Email (например: `ivanov@utmn.ru`)

### Через API напрямую:

```bash
# Получить токен
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Поиск по идентификатору
curl http://localhost:3000/v1/skud/search?query=иванов \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Доступные API endpoints:

| Endpoint | Описание | Права |
|----------|----------|-------|
| `GET /v1/skud/search?query=...` | Поиск по идентификатору | `identifier-search` |
| `GET /v1/skud/passes` | Журнал проходов | `passes` |
| `GET /v1/skud/location?query=...` | Местоположение человека | `location` |
| `GET /v1/skud/access-points` | Список точек доступа | `passes` |

**Полная документация:** `/SKUD_API.md`

---

## 🎯 Следующие шаги

Теперь можно реализовать:

1. **Отчет о проходах** (`/components/PassesReportPage.tsx`)
   - Использовать `skudApi.getPassesReport()`
   - Фильтрация по датам, типу персоны, точкам доступа

2. **Где находится человек** (`/components/LocationPage.tsx`)
   - Использовать `skudApi.getPersonLocation()`
   - Отображение последнего местоположения

3. **Отчет по иностранным студентам**
   - Добавить endpoint для фильтрации студентов `is_foreign = true`

4. **Отчет по сотрудникам** (`/components/EmployeesReportPage.tsx`)
   - Уже есть API, добавить детали из СКУД

---

## ✅ Готово!

Страница "Поиск по идентификатору" теперь подключена к реальной базе данных СКУД!

**Что дальше?**
Сообщите, какую страницу хотите реализовать следующей:
- Отчет о проходах
- Где находится человек
- Отчет по иностранным студентам
- Отчет по сотрудникам
