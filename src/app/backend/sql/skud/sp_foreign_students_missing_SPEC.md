# 📋 Спецификация процедуры `sp_foreign_students_missing`

## 🎯 Назначение
Поиск иностранных студентов, которые отсутствуют в системе СКУД более N дней.

---

## 📥 ВХОДНЫЕ ПАРАМЕТРЫ

### 1. `p_country` (VARCHAR(255))
**Описание**: Фильтр по стране  
**Допустимые значения**:
- `'all'` - все страны (кроме России)
- Название страны: `'КАЗАХСТАН'`, `'УЗБЕКИСТАН'`, `'КИТАЙ'` и т.д.

**Примеры**:
```sql
-- Все страны
CALL sp_foreign_students_missing('all', 3);

-- Только Казахстан
CALL sp_foreign_students_missing('КАЗАХСТАН', 3);

-- Только Китай
CALL sp_foreign_students_missing('КИТАЙ', 7);
```

**Важно**: 
- Название страны должно ТОЧНО совпадать с `person_countries.country_name` в БД
- Регистр имеет значение (обычно ЗАГЛАВНЫЕ буквы)
- Россия автоматически исключается из результатов

---

### 2. `p_days_threshold` (INT)
**Описание**: Минимальное количество дней отсутствия  
**Допустимые значения**: Любое целое число ≥ 1

**Примеры**:
```sql
-- Отсутствие более 3 дней
CALL sp_foreign_students_missing('all', 3);

-- Отсутствие более 7 дней (критическое)
CALL sp_foreign_students_missing('all', 7);

-- Отсутствие более 30 дней (долгосрочное)
CALL sp_foreign_students_missing('all', 30);
```

**Рекомендации**:
- `3` дня - базовый порог для мониторинга
- `7` дней - критический порог (требует внимания)
- `14-30` дней - долгосрочное отсутствие (возможно отчисление)

---

## 📤 ВЫХОДНЫЕ ДАННЫЕ

### Формат: SELECT результат (таблица)

| Поле | Тип | Nullable | Описание | Пример |
|------|-----|----------|----------|---------|
| `id` | INT | NO | ID записи события | `12345` |
| `fio` | VARCHAR(255) | NO | Полное имя студента | `Абдалла Алаиддин Саед` |
| `upn` | VARCHAR(255) | YES | Логин/почта студента | `stud0123456789@study.utmn.ru` |
| `card_number` | VARCHAR(50) | YES | Номер карты доступа | `1234567890` |
| `country` | VARCHAR(255) | NO | Название страны | `КАЗАХСТАН` |
| `last_seen` | DATETIME | NO | Дата/время последнего визита | `2026-03-02 14:30:00` |
| `last_location` | VARCHAR(255) | YES | Место последнего визита | `Главный корпус, вход 1` |
| `device_name` | VARCHAR(255) | YES | Точка прохода (устройство) | `Турникет №5` |
| `days_missing` | INT | NO | Количество дней отсутствия | `7` |

---

## 📊 Примеры выходных данных

### Пример 1: Успешный результат (найдены студенты)
```sql
CALL sp_foreign_students_missing('all', 3);
```

**Результат:**
| id | fio | upn | card_number | country | last_seen | last_location | device_name | days_missing |
|----|-----|-----|-------------|---------|-----------|---------------|-------------|--------------|
| 101 | Абдалла Алаиддин Саед | stud0123456789@study.utmn.ru | 1234567890 | ЕГИПЕТ | 2026-03-02 14:30:00 | Главный корпус | Турникет №1 | 7 |
| 102 | Нурсултан Назарбаев | foreign.stud@study.utmn.ru | 9876543210 | КАЗАХСТАН | 2026-03-04 09:15:00 | Корпус 2 | Турникет №2 | 5 |
| 103 | Ли Вэй | li.wei@study.utmn.ru | 5555555555 | КИТАЙ | 2026-03-05 16:45:00 | Библиотека | Турникет №3 | 4 |

**Количество строк**: 3

---

### Пример 2: Пустой результат (не найдены студенты)
```sql
CALL sp_foreign_students_missing('БРАЗИЛИЯ', 3);
```

**Результат:**
| id | fio | upn | card_number | country | last_seen | last_location | device_name | days_missing |
|----|-----|-----|-------------|---------|-----------|---------------|-------------|--------------|
| (пусто) | | | | | | | | |

**Количество строк**: 0

---

### Пример 3: Фильтрация по конкретной стране
```sql
CALL sp_foreign_students_missing('КАЗАХСТАН', 5);
```

**Результат:**
| id | fio | upn | card_number | country | last_seen | last_location | device_name | days_missing |
|----|-----|-----|-------------|---------|-----------|---------------|-------------|--------------|
| 201 | Нурсултан Назарбаев | stud.kz@study.utmn.ru | 9876543210 | КАЗАХСТАН | 2026-03-01 10:00:00 | Главный корпус | Турникет №4 | 8 |
| 202 | Айгуль Токтарова | aigul.t@study.utmn.ru | 1111222233 | КАЗАХСТАН | 2026-03-03 11:20:00 | Корпус 3 | Турникет №5 | 6 |

**Количество строк**: 2

---

## 🔍 Логика работы

### SQL запрос (упрощенная версия):
```sql
SELECT 
    p.id,
    CONCAT_WS(' ', p.last_name, p.first_name, p.middle_name) AS fio,
    p.upn,
    p.card_number,
    pc.country_name AS country,
    MAX(e.event_time) AS last_seen,
    ap.name AS last_location,
    ap.device_name AS device_name,
    DATEDIFF(NOW(), MAX(e.event_time)) AS days_missing
FROM persons p
LEFT JOIN person_countries pc ON p.country_id = pc.id
LEFT JOIN events e ON p.id = e.person_id
LEFT JOIN access_points ap ON e.access_point_id = ap.id
WHERE 
    pc.country_code != 'RU'              -- Исключаем Россию
    AND p.person_type = 'student'        -- Только студенты
    AND (p_country = 'all' OR pc.country_name = p_country)  -- Фильтр по стране
GROUP BY p.id
HAVING days_missing >= p_days_threshold  -- Фильтр по дням
ORDER BY days_missing DESC, fio ASC
LIMIT 1000;
```

### Этапы обработки:
1. **Фильтрация персон**:
   - Только `person_type = 'student'`
   - Только НЕ Россия (`country_code != 'RU'`)
   - Опционально: конкретная страна

2. **Группировка**:
   - По каждому студенту (`GROUP BY p.id`)
   - Находим последний визит (`MAX(event_time)`)

3. **Расчет отсутствия**:
   - `DATEDIFF(NOW(), MAX(event_time))` = количество дней

4. **Фильтрация результата**:
   - `HAVING days_missing >= p_days_threshold`

5. **Сортировка**:
   - По убыванию дней отсутствия
   - Затем по алфавиту (ФИО)

6. **Ограничение**: До 1000 записей

---

## 🎨 Маппинг в Backend (Node.js)

### Входные данные (req.query):
```javascript
const { country = 'all', daysThreshold = '3' } = req.query;
const days = parseInt(daysThreshold);
```

### Вызов процедуры:
```javascript
const [results] = await skudPool.query(
  'CALL sp_foreign_students_missing(?, ?)',
  [country, days]
);
```

### Выходные данные (response):
```javascript
res.json({
  success: true,
  results: records.map(row => ({
    id: row.id,                    // INT
    fullName: row.fio,             // VARCHAR -> fio
    upn: row.upn,                  // VARCHAR
    cardNumber: row.card_number,   // VARCHAR
    country: row.country,          // VARCHAR
    time: row.last_seen,           // DATETIME -> last_seen
    checkpoint: row.last_location, // VARCHAR -> last_location
    deviceName: row.device_name,   // VARCHAR
    daysMissing: row.days_missing, // INT
    eventName: null,
    direction: null,
    building: null
  })),
  total: records.length
});
```

---

## 🧪 Тестовые сценарии

### Сценарий 1: Базовый поиск (все страны, 3 дня)
```bash
curl -X GET "http://localhost:3000/api/foreign-students/missing?country=all&daysThreshold=3" \
  -H "Authorization: Bearer $TOKEN"
```
**Ожидаемый результат**: Список всех иностранных студентов с отсутствием ≥3 дней

---

### Сценарий 2: Критическое отсутствие (7 дней)
```bash
curl -X GET "http://localhost:3000/api/foreign-students/missing?country=all&daysThreshold=7" \
  -H "Authorization: Bearer $TOKEN"
```
**Ожидаемый результат**: Список студентов с критическим отсутствием ≥7 дней

---

### Сценарий 3: Конкретная страна
```bash
curl -X GET "http://localhost:3000/api/foreign-students/missing?country=КАЗАХСТАН&daysThreshold=5" \
  -H "Authorization: Bearer $TOKEN"
```
**Ожидаемый результат**: Список студентов из Казахстана с отсутствием ≥5 дней

---

### Сценарий 4: Пустой результат
```bash
curl -X GET "http://localhost:3000/api/foreign-students/missing?country=all&daysThreshold=365" \
  -H "Authorization: Bearer $TOKEN"
```
**Ожидаемый результат**: Пустой массив `results: []`

---

## ⚠️ Важные замечания

### 1. Структура базы данных
Процедура ожидает следующие таблицы:
- ✅ `persons` - персоны (студенты)
- ✅ `person_countries` - справочник стран
- ✅ `events` - события проходов СКУД
- ✅ `access_points` - точки доступа

### 2. Поля в таблицах
**persons**:
- `id`, `last_name`, `first_name`, `middle_name`
- `upn`, `card_number`
- `country_id` → FK на `person_countries.id`
- `person_type` → должен быть `'student'`

**person_countries**:
- `id`, `country_code`, `country_name`
- `country_code != 'RU'` → исключает Россию

**events**:
- `person_id` → FK на `persons.id`
- `event_time` → DATETIME последнего визита
- `access_point_id` → FK на `access_points.id`

**access_points**:
- `id`, `name` → название места
- `device_name` → название устройства

### 3. NULL значения
- `upn` может быть NULL (если студент без логина)
- `card_number` может быть NULL (если карта не выдана)
- `last_location` может быть NULL (если нет данных о месте)

### 4. Производительность
- Лимит: 1000 записей
- Индексы рекомендуются на:
  - `persons.country_id`
  - `persons.person_type`
  - `events.person_id`
  - `events.event_time`

---

## 📞 Контакты для вопросов
- Backend: `/backend/src/controllers/foreignStudentsController.js`
- Frontend: `/components/ForeignStudentsReport.tsx`
- API: `/lib/api.ts` → `skudApi.getForeignStudentsMissing()`

---

**Дата создания**: 9 марта 2026  
**Версия**: 1.0  
**Статус**: ✅ Готово к использованию