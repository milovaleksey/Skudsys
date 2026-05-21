# ✅ SKUD Database Connector - Готово!

## 🎯 Задача выполнена

Добавлен второй коннектор к MySQL базе данных для получения данных СКУД (проходы, студенты, сотрудники, местоположение).

---

## 📦 Новые файлы Backend

### Конфигурация
- **`/backend/src/config/skudDatabase.js`** - отдельный pool подключений к БД СКУД

### Контроллеры
- **`/backend/src/controllers/skudController.js`** - 4 метода:
  - `searchByIdentifier` - поиск по идентификатору/карте
  - `getPassesReport` - журнал проходов с фильтрацией
  - `getPersonLocation` - последнее местоположение человека
  - `getAccessPoints` - список точек доступа

### Роуты
- **`/backend/src/routes/skud.js`** - API endpoints с проверкой прав

---

## 🔄 Обновлённые файлы

### Backend
1. **`/backend/src/server.js`**
   - Импорт `connectSkudDatabase`
   - Импорт `skudRoutes`
   - Подключение `/v1/skud` и `/api/skud` роутов
   - Инициализация коннектора при старте

### Frontend
1. **`/lib/api.ts`** и **`/frontend/lib/api.ts`**
   - Добавлен `skudApi` с 4 методами
   
2. **`/components/IdentifierSearchPage.tsx`**
   - Интеграция с реальным API
   - Использование `skudApi.searchByIdentifier()`
   - Toast уведомления
   - Обработка ошибок

---

## 🚀 Как запустить

### 1. Настройка .env (опционально)

Если СКУД база на другом сервере:

```bash
# /backend/.env
SKUD_DB_HOST=10.101.221.xxx
SKUD_DB_PORT=3306
SKUD_DB_USER=skud_user
SKUD_DB_PASSWORD=password
SKUD_DB_NAME=skud_database
```

Если не указано - используется основная БД.

### 2. Перезапуск backend

```bash
cd backend
npm start
```

**Должны увидеть:**
```
✅ Подключено к MySQL
✅ Подключено к базе данных SKUD
🚀 Сервер запущен на порту 3000
```

### 3. Тестирование

#### Через веб-интерфейс:
1. Войдите в систему (admin/admin123)
2. Откройте "Поиск по идентификатору"
3. Введите запрос: `иванов`, `123.456789`, `ivanov@utmn.ru`

#### Через API:
```bash
# Получить токен
TOKEN=$(curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.data.token')

# Поиск
curl "http://localhost:3000/v1/skud/search?query=иванов" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📡 API Endpoints

| Endpoint | Метод | Описание | Права |
|----------|-------|----------|-------|
| `/v1/skud/search` | GET | Поиск по идентификатору | `identifier-search` |
| `/v1/skud/passes` | GET | Журнал проходов | `passes` |
| `/v1/skud/location` | GET | Местоположение человека | `location` |
| `/v1/skud/access-points` | GET | Список точек доступа | `passes` |

**Детальная документация:** `/SKUD_API.md`

---

## 🗄️ Структура БД

### Используемые таблицы:
- `employees` - сотрудники
- `students` - студенты
- `access_logs` - журнал проходов
- `access_points` - точки доступа

### Оптимизация:
- ✅ Индексы на всех полях поиска
- ✅ Window functions (ROW_NUMBER) для последнего прохода
- ✅ Connection pooling (10 подключений)
- ✅ UTF-8 (utf8mb4) для кириллицы

---

## 🎨 Frontend интеграция

```typescript
import { skudApi } from '../lib/api';

// Поиск по идентификатору
const response = await skudApi.searchByIdentifier('123.456789');

// Журнал проходов
const passes = await skudApi.getPassesReport({
  startDate: '2026-02-01 00:00:00',
  endDate: '2026-02-28 23:59:59',
  personType: 'employee'
});

// Местоположение
const location = await skudApi.getPersonLocation('Иванов');

// Точки доступа
const points = await skudApi.getAccessPoints();
```

---

## ✅ Что работает

- ✅ **Поиск по идентификатору** - реальные данные из БД
- ✅ Поиск по номеру карты (XXX.XXXXXX, 13 цифр)
- ✅ Поиск по ФИО
- ✅ Поиск по email
- ✅ Отображение последнего прохода
- ✅ Отображение местоположения
- ✅ Экспорт в Excel
- ✅ Toast уведомления

---

## 🔜 Следующие шаги

Выберите, что реализовать дальше:

1. **Отчет о проходах** (`PassesReportPage.tsx`)
   - `skudApi.getPassesReport()`
   - Фильтры: даты, тип персоны, точка доступа, направление
   - Экспорт в Excel

2. **Где находится человек** (`LocationPage.tsx`)
   - `skudApi.getPersonLocation()`
   - Отображение на карте/схеме здания
   - История передвижений

3. **Отчет по иностранным студентам**
   - Новый endpoint в `skudController`
   - Фильтр `is_foreign = true`

4. **Отчет по сотрудникам** (`EmployeesReportPage.tsx`)
   - Расширение данных из СКУД
   - Последние проходы

---

## 📝 Примечания

1. **Два независимых подключения к БД:**
   - `database.js` → Управление (users, roles, sessions)
   - `skudDatabase.js` → СКУД (passes, students, employees)

2. **Можно использовать одну БД:**
   - Просто не указывайте `SKUD_DB_*` переменные

3. **Производительность:**
   - Лимит 20 результатов на поиск
   - Кэширование через индексы
   - Эффективные JOIN запросы

---

## 🎉 Готово к работе!

Страница "Поиск по идентификатору" полностью функциональна с реальными данными из базы СКУД.

**Напишите, что реализовать дальше!** 🚀
