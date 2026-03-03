# ✅ ГОТОВО: Отчеты по студентам и сотрудникам

## 🎯 Что было создано:

Созданы две новые страницы отчетов, **полностью идентичные** странице "Отчет о проходах", но использующие разные хранимые процедуры для фильтрации по типу лица (студент/сотрудник).

---

## 📋 Созданные компоненты:

### 1. **Отчет по студентам** (`StudentsReportPage.tsx`)
- ✅ Заголовок: "Отчет по студентам"
- ✅ Placeholder: "Петрова Мария Сергеевна" / "petrova@study.utmn.ru"
- ✅ Примеры для быстрого тестирования (студенты)
- ✅ Экспорт в Excel: `students_report_YYYY-MM-DD.xlsx`
- ✅ API: `getStudentsPassesByFio()` и `getStudentsPassesByUpn()`

### 2. **Отчет по сотрудникам** (`EmployeesReportPage.tsx`)
- ✅ Заголовок: "Отчет по сотрудникам"
- ✅ Placeholder: "Милов Алексей Сергеевич" / "a.s.milov@utmn.ru"
- ✅ Примеры для быстрого тестирования (сотрудники)
- ✅ Экспорт в Excel: `employees_report_YYYY-MM-DD.xlsx`
- ✅ API: `getEmployeesPassesByFio()` и `getEmployeesPassesByUpn()`

---

## 🔧 Backend интеграция:

### ✅ Контроллеры (`/backend/src/controllers/skudController.js`):

Добавлены 4 новых метода:

1. **`getStudentsPassesByFio()`** - Проходы студентов по ФИО
   - Процедура: `sp_get_students_passes_by_fio`
   - Параметры: `lastName`, `firstName`, `middleName`, `dateFrom`, `dateTo`

2. **`getStudentsPassesByUpn()`** - Проходы студентов по UPN
   - Процедура: `sp_get_students_passes_by_upn`
   - Параметры: `upn`, `dateFrom`, `dateTo`

3. **`getEmployeesPassesByFio()`** - Проходы сотрудников по ФИО
   - Процедура: `sp_get_employees_passes_by_fio`
   - Параметры: `lastName`, `firstName`, `middleName`, `dateFrom`, `dateTo`

4. **`getEmployeesPassesByUpn()`** - Проходы сотрудников по UPN
   - Процедура: `sp_get_employees_passes_by_upn`
   - Параметры: `upn`, `dateFrom`, `dateTo`

### ✅ Роуты (`/backend/src/routes/skud.js`):

Добавлены 4 новых endpoint:

```javascript
// Студенты
GET /v1/skud/students-passes/by-fio
GET /v1/skud/students-passes/by-upn

// Сотрудники
GET /v1/skud/employees-passes/by-fio
GET /v1/skud/employees-passes/by-upn
```

### ✅ API клиент (`/lib/api.ts`):

Добавлены методы:

```typescript
// Студенты
skudApi.getStudentsPassesByFio(lastName, firstName, middleName, dateFrom, dateTo)
skudApi.getStudentsPassesByUpn(upn, dateFrom, dateTo)

// Сотрудники
skudApi.getEmployeesPassesByFio(lastName, firstName, middleName, dateFrom, dateTo)
skudApi.getEmployeesPassesByUpn(upn, dateFrom, dateTo)
```

---

## 📊 Хранимые процедуры MySQL:

### Файл: `/SKUD_STUDENTS_EMPLOYEES_PROCEDURES.sql`

Созданы 4 процедуры:

1. **`sp_get_students_passes_by_fio`** - Проходы студентов по ФИО
2. **`sp_get_students_passes_by_upn`** - Проходы студентов по UPN
3. **`sp_get_employees_passes_by_fio`** - Проходы сотрудников по ФИО
4. **`sp_get_employees_passes_by_upn`** - Проходы сотрудников по UPN

---

## 🔍 Различия между процедурами:

Главное отличие - **фильтр по типу лица** (студент/сотрудник).

### Для СТУДЕНТОВ:
```sql
WHERE 
    ... -- фильтры по ФИО/UPN и датам
    
    -- ФИЛЬТР ПО ТИПУ: СТУДЕНТЫ
    AND p.person_type = 'student'            -- Вариант 1
    -- OR p.upn LIKE '%@study.%'             -- Вариант 2
    -- OR EXISTS (SELECT ... FROM students)  -- Вариант 3
```

### Для СОТРУДНИКОВ:
```sql
WHERE 
    ... -- фильтры по ФИО/UPN и датам
    
    -- ФИЛЬТР ПО ТИПУ: СОТРУДНИКИ
    AND p.person_type = 'employee'           -- Вариант 1
    -- OR p.upn NOT LIKE '%@study.%'         -- Вариант 2
    -- OR EXISTS (SELECT ... FROM employees) -- Вариант 3
```

---

## 📦 Структура данных (одинаковая для всех):

### Обязательные поля:
- `id` - ID записи о проходе
- `event_time` - Время прохода (DATETIME)
- `full_name` - ФИО
- `checkpoint_name` - Название точки прохода

### Опциональные поля:
- `upn` - Email/UPN
- `card_number` - Номер карты
- `event_name` - Название события
- `direction` - Направление (in/out)
- `building` - Здание
- `location` - Местоположение

---

## 🎨 Интерфейс страниц:

### Общие элементы (одинаковые для всех 3 страниц):

✅ **Фильтры:**
- Тип поиска: По ФИО / По UPN (радио-кнопки)
- Поле ввода с автоопределением типа (если есть `@` → UPN)
- Дата от (DatePicker)
- Дата до (DatePicker)
- Кнопка "Найти"
- Примеры для быстрого тестирования

✅ **Счетчик:** "Всего записей: X"

✅ **Таблица** (7 колонок):
1. Время
2. ФИО
3. UPN
4. Номер карты
5. Событие
6. Точка прохода
7. Здание

✅ **Экспорт в Excel:**
- Кнопка активна только если есть данные
- 8 столбцов в Excel (включая "Направление")

---

## 📋 Инструкция по установке:

### 1. Создайте процедуры в MySQL

```bash
mysql -u root -p skud_database < /SKUD_STUDENTS_EMPLOYEES_PROCEDURES.sql
```

Или вручную:
```sql
-- Откройте файл SKUD_STUDENTS_EMPLOYEES_PROCEDURES.sql
-- Скопируйте и выполните каждую процедуру
```

### 2. Адаптируйте процедуры под вашу БД

Откройте файл `/SKUD_STUDENTS_EMPLOYEES_PROCEDURES.sql` и адаптируйте:

- **Названия таблиц:** `access_logs`, `persons`, `cards`, `access_points`
- **Названия полей:** `event_time`, `person_id`, `card_number`, etc.
- **Фильтр по типу:** выберите один из 3 вариантов (см. комментарии в файле)

### 3. Проверьте процедуры

```sql
-- Покажите все процедуры
SHOW PROCEDURE STATUS WHERE Db = 'skud_database';

-- Тесты
CALL sp_get_students_passes_by_fio('Петрова', 'Мария', 'Сергеевна', '2026-03-01 00:00:00', '2026-03-31 23:59:59');
CALL sp_get_students_passes_by_upn('petrova@study.utmn.ru', '2026-03-01 00:00:00', '2026-03-31 23:59:59');
CALL sp_get_employees_passes_by_fio('Милов', 'Алексей', 'Сергеевич', '2026-03-01 00:00:00', '2026-03-31 23:59:59');
CALL sp_get_employees_passes_by_upn('a.s.milov@utmn.ru', '2026-03-01 00:00:00', '2026-03-31 23:59:59');
```

### 4. Перезапустите backend

```bash
cd backend
npm start
```

### 5. Добавьте страницы в роутинг

В файле где настроен роутинг (например, `/routes.ts` или `/App.tsx`):

```typescript
import { StudentsReportPage } from './components/StudentsReportPage';
import { EmployeesReportPage } from './components/EmployeesReportPage';

// Добавьте в роуты:
{ path: "students-report", Component: StudentsReportPage },
{ path: "employees-report", Component: EmployeesReportPage },
```

---

## 🎯 Примеры использования:

### Отчет по студентам:

**Ввод:** `Петрова Мария Сергеевна` или `petrova@study.utmn.ru`  
**Даты:** Сегодня (автоматически)

**API вызов:**
```
GET /v1/skud/students-passes/by-fio?lastName=Петрова&firstName=Мария&middleName=Сергеевна&dateFrom=2026-03-03%2000:00:00&dateTo=2026-03-03%2023:59:59
```

**SQL вызов:**
```sql
CALL sp_get_students_passes_by_fio('Петрова', 'Мария', 'Сергеевна', '2026-03-03 00:00:00', '2026-03-03 23:59:59');
```

---

### Отчет по сотрудникам:

**Ввод:** `Милов Алексей Сергеевич` или `a.s.milov@utmn.ru`  
**Даты:** Сегодня (автоматически)

**API вызов:**
```
GET /v1/skud/employees-passes/by-fio?lastName=Милов&firstName=Алексей&middleName=Сергеевич&dateFrom=2026-03-03%2000:00:00&dateTo=2026-03-03%2023:59:59
```

**SQL вызов:**
```sql
CALL sp_get_employees_passes_by_fio('Милов', 'Алексей', 'Сергеевич', '2026-03-03 00:00:00', '2026-03-03 23:59:59');
```

---

## 📦 Измененные/созданные файлы:

### Frontend:
1. ✅ `/components/StudentsReportPage.tsx` - **НОВЫЙ** компонент
2. ✅ `/components/EmployeesReportPage.tsx` - **НОВЫЙ** компонент
3. ✅ `/lib/api.ts` - добавлены 4 метода API

### Backend:
4. ✅ `/backend/src/controllers/skudController.js` - добавлены 4 метода контроллера
5. ✅ `/backend/src/routes/skud.js` - добавлены 4 роута

### Database:
6. ✅ `/SKUD_STUDENTS_EMPLOYEES_PROCEDURES.sql` - **НОВЫЙ** SQL шаблон с процедурами

### Documentation:
7. ✅ `/STUDENTS_EMPLOYEES_REPORTS_COMPLETE.md` - **НОВЫЙ** файл документации

---

## 🆚 Сравнение с "Отчет о проходах":

| Характеристика | Отчет о проходах | Отчет по студентам | Отчет по сотрудникам |
|----------------|------------------|--------------------|--------------------|
| **Процедуры** | `sp_get_passes_by_*` | `sp_get_students_passes_by_*` | `sp_get_employees_passes_by_*` |
| **Фильтр** | Все типы лиц | Только студенты | Только сотрудники |
| **Примеры** | Иванов Иван | Петрова Мария | Милов Алексей |
| **Email** | Любой | `@study.utmn.ru` | `@utmn.ru` |
| **Excel файл** | `passes_report_*.xlsx` | `students_report_*.xlsx` | `employees_report_*.xlsx` |
| **API endpoint** | `/skud/passes/*` | `/skud/students-passes/*` | `/skud/employees-passes/*` |

---

## 🚀 Следующие шаги:

1. ✅ Создайте процедуры в MySQL (адаптируйте под вашу БД)
2. ✅ Перезапустите backend
3. ✅ Добавьте страницы в роутинг
4. ✅ Добавьте пункты в навигационное меню (Sidebar)
5. ✅ Протестируйте все 3 страницы с реальными данными

---

## ✨ Особенности всех страниц:

- ✅ **Автоопределение типа поиска** (ФИО/UPN) при вводе
- ✅ **Дефолтные даты** - сегодняшний день
- ✅ **Поддержка Enter** для быстрого поиска
- ✅ **Toast уведомления** (успех/ошибка/информация)
- ✅ **Loading состояния**
- ✅ **Экспорт в Excel** с правильным форматированием
- ✅ **7 колонок** в таблице (включая "Здание")
- ✅ **Чередующиеся цвета** строк для лучшей читаемости
- ✅ **Hover-эффекты**

---

## 📞 Поддержка:

### Если процедура не найдена:

Backend вернет дружественное сообщение:
```json
{
  "success": false,
  "message": "Хранимая процедура sp_get_students_passes_by_fio не найдена в базе данных",
  "error": {
    "message": "Необходимо создать процедуру sp_get_students_passes_by_fio в базе данных СКУД",
    "code": "PROCEDURE_NOT_FOUND"
  }
}
```

### Логи для отладки:

Backend выводит в консоль:
```
[getStudentsPassesByFio] Calling sp_get_students_passes_by_fio('Петрова', 'Мария', 'Сергеевна', '2026-03-03 00:00:00', '2026-03-03 23:59:59')
[getStudentsPassesByFio] Procedure returned 5 results
[getStudentsPassesByFio] Formatted 5 results
```

---

🎉 **Готово! Теперь у вас есть 3 идентичные страницы отчетов с разными фильтрами!**

### Структура отчетов:

```
📊 Отчет о проходах      → Все проходы (студенты + сотрудники + гости)
📚 Отчет по студентам    → Только проходы студентов
👨‍💼 Отчет по сотрудникам → Только проходы сотрудников
```

Все страницы имеют **абсолютно идентичный интерфейс** и функционал, различаются только:
- Заголовком
- Примерами
- Хранимыми процедурами (фильтр по типу лица)
- Названием экспортируемого файла
