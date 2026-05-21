# ✅ Интеграция страницы "Где находится человек" с базой данных СКУД

## 🎯 Что было сделано:

### 1. ✅ Backend API

#### Добавлены новые методы в контроллер `/backend/src/controllers/skudController.js`:

**a) `getLocationByFio` - Поиск по ФИО**
- **Endpoint:** `GET /api/v1/skud/location/by-fio`
- **Параметры:** `lastName`, `firstName`, `middleName` (опционально)
- **Процедура:** `CALL sp_get_last_entry_event(?, ?, ?)`
- **Пример:** `GET /api/v1/skud/location/by-fio?lastName=Милов&firstName=Алексей&middleName=Сергеевич`

**b) `getLocationByUpn` - Поиск по UPN (email)**
- **Endpoint:** `GET /api/v1/skud/location/by-upn`
- **Параметры:** `upn`
- **Процедура:** `CALL sp_get_last_entry_by_upn(?)`
- **Пример:** `GET /api/v1/skud/location/by-upn?upn=a.s.milov@utmn.ru`

#### Добавлены роуты в `/backend/src/routes/skud.js`:
```javascript
router.get('/location/by-fio', authenticate, checkPermission('location'), skudController.getLocationByFio);
router.get('/location/by-upn', authenticate, checkPermission('location'), skudController.getLocationByUpn);
```

---

### 2. ✅ Frontend API

#### Обновлен `/lib/api.ts`:
```typescript
async getLocationByFio(lastName: string, firstName: string, middleName?: string)
async getLocationByUpn(upn: string)
```

---

### 3. ✅ Frontend компонент

#### Обновлен `/components/LocationPage.tsx`:
- ❌ Удалены mock данные
- ✅ Добавлен реальный API запрос к backend
- ✅ Автоматический разбор ФИО на части (Фамилия Имя Отчество)
- ✅ Обработка ошибок с toast уведомлениями
- ✅ Loading состояние при поиске

---

### 4. ✅ SQL процедуры

#### Создан шаблон `/SKUD_LOCATION_PROCEDURES_TEMPLATE.sql`:

**Процедура 1: `sp_get_last_entry_event`**
```sql
CALL sp_get_last_entry_event('Милов', 'Алексей', 'Сергеевич');
```

**Процедура 2: `sp_get_last_entry_by_upn`**
```sql
CALL sp_get_last_entry_by_upn('a.s.milov@utmn.ru');
```

---

## 📋 Структура возвращаемых данных

### Хранимая процедура возвращает:

| Поле | Тип | Описание | Обязательно |
|------|-----|----------|-------------|
| `full_name` | VARCHAR(255) | Полное ФИО | ✅ |
| `upn` | VARCHAR(255) | Email (например: `a.s.milov@utmn.ru`) | ✅ |
| `card_number` | VARCHAR(50) | Номер карты СКУД | ✅ |
| `department` | TEXT | Подразделение/Институт | ✅ |
| `person_type` | VARCHAR(20) | `'employee'` или `'student'` | ✅ |
| `checkpoint_name` | VARCHAR(255) | Название точки прохода | ✅ |
| `location` | TEXT | Детальное местоположение | ✅ |
| `event_time` | DATETIME | Время последнего прохода | ✅ |
| `person_id` | INT | ID человека | ❌ |
| `direction` | VARCHAR(10) | `'in'` или `'out'` | ❌ |
| `building` | VARCHAR(100) | Здание/корпус | ❌ |

### Backend преобразует в JSON:

```json
{
  "success": true,
  "data": {
    "fullName": "Милов Алексей Сергеевич",
    "upn": "a.s.milov@utmn.ru",
    "cardNumber": "1446738",
    "department": "Институт математики и компьютерных наук",
    "type": "employee",
    "lastLocation": {
      "checkpoint": "Главный вход, корпус А",
      "time": "2026-03-03 14:35:22"
    }
  }
}
```

---

## 🔧 Требования к базе данных СКУД

### Необходимые таблицы:

1. **`persons`** - Люди
   - `id`, `last_name`, `first_name`, `middle_name`, `upn`, `card_id`

2. **`cards`** - Карты СКУД
   - `id`, `card_number`

3. **`employees`** - Сотрудники
   - `id`, `person_id`, `department`

4. **`students`** - Студенты
   - `id`, `person_id`, `faculty`, `course`

5. **`access_logs`** - Журнал проходов
   - `id`, `person_id`, `access_point_id`, `event_time`, `direction`

6. **`access_points`** - Точки доступа
   - `id`, `name`, `location`, `building`

**⚠️ ВАЖНО:** Названия таблиц и полей могут отличаться в вашей БД. Адаптируйте процедуры из шаблона!

---

## 📝 Инструкция по установке

### Шаг 1: Создайте хранимые процедуры в MySQL

```bash
# Подключитесь к базе данных СКУД
mysql -u root -p skud_database

# Выполните скрипт
source /SKUD_LOCATION_PROCEDURES_TEMPLATE.sql
```

Или скопируйте процедуры из файла и выполните их через MySQL Workbench или другой клиент.

### Шаг 2: Проверьте созданные процедуры

```sql
-- Проверка существования
SHOW PROCEDURE STATUS WHERE Db = 'skud_database';

-- Тестовый вызов по ФИО
CALL sp_get_last_entry_event('Милов', 'Алексей', 'Сергеевич');

-- Тестовый вызов по UPN
CALL sp_get_last_entry_by_upn('a.s.milov@utmn.ru');
```

### Шаг 3: Перезапустите backend

```bash
cd backend
npm start
```

### Шаг 4: Протестируйте через frontend

1. Откройте страницу **"Где находится человек"**
2. Выберите **"По ФИО"** или **"По UPN"**
3. Введите данные:
   - **По ФИО:** `Милов Алексей Сергеевич`
   - **По UPN:** `a.s.milov@utmn.ru`
4. Нажмите **"Найти"**

---

## 🎨 Примеры вызовов API

### Поиск по ФИО:
```bash
curl -X GET "http://localhost:3000/v1/skud/location/by-fio?lastName=Милов&firstName=Алексей&middleName=Сергеевич" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Поиск по UPN:
```bash
curl -X GET "http://localhost:3000/v1/skud/location/by-upn?upn=a.s.milov@utmn.ru" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔍 Обработка ошибок

### Backend автоматически обрабатывает:

1. **Процедура не найдена:**
```json
{
  "success": false,
  "message": "Хранимая процедура sp_get_last_entry_event не найдена в базе данных",
  "error": {
    "message": "Необходимо создать процедуру sp_get_last_entry_event в базе данных СКУД",
    "code": "PROCEDURE_NOT_FOUND"
  }
}
```

2. **Человек не найден:**
```json
{
  "success": true,
  "data": null,
  "message": "Человек не найден или нет записей о проходах"
}
```

3. **Недостаточно параметров:**
```json
{
  "success": false,
  "message": "Необходимо указать фамилию и имя"
}
```

---

## ✨ Особенности реализации

### Backend контроллер:

1. **Гибкое именование полей** - поддерживает разные варианты:
   - `full_name` или `fullName`
   - `card_number` или `cardNumber`
   - `person_type` или `type`
   - `checkpoint_name` или `location` или `access_point_name`

2. **Автоматическое форматирование даты** - в `YYYY-MM-DD HH:MM:SS`

3. **Подробное логирование** - все вызовы процедур логируются в console

### Frontend компонент:

1. **Автоматический парсинг ФИО** - "Милов Алексей Сергеевич" → `{lastName, firstName, middleName}`

2. **Toast уведомления** - успех/ошибка/информация

3. **Поддержка Enter** - поиск по нажатию Enter

---

## 🎯 Результат

### Было (mock данные):
```javascript
const mockData = {
  'Иванов Иван Иванович': { ... },
  'ivanov@utmn.ru': { ... }
};
```

### Стало (реальная БД):
```javascript
const response = await skudApi.getLocationByFio('Милов', 'Алексей', 'Сергеевич');
const response = await skudApi.getLocationByUpn('a.s.milov@utmn.ru');
```

---

## 📦 Измененные файлы:

1. ✅ `/backend/src/controllers/skudController.js` - добавлены методы
2. ✅ `/backend/src/routes/skud.js` - добавлены роуты
3. ✅ `/lib/api.ts` - добавлены методы API
4. ✅ `/components/LocationPage.tsx` - убраны mock, добавлен реальный API
5. ✅ `/SKUD_LOCATION_PROCEDURES_TEMPLATE.sql` - шаблон процедур

---

## 🚀 Следующие шаги:

1. **Создайте процедуры в MySQL** используя шаблон
2. **Адаптируйте процедуры** под вашу структуру БД
3. **Протестируйте** вызовы процедур напрямую в MySQL
4. **Перезапустите backend**
5. **Протестируйте** через frontend

---

🎉 **Готово! Страница "Где находится человек" теперь работает с реальной базой данных СКУД!**
