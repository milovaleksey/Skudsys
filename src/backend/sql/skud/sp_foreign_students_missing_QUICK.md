# 📋 Быстрая справка: sp_foreign_students_missing

## ⚡ Краткая информация

```sql
CALL sp_foreign_students_missing(p_country, p_days_threshold);
```

---

## 📥 ВХОДНЫЕ ПАРАМЕТРЫ

| Параметр | Тип | Обязателен | Описание | Примеры |
|----------|-----|------------|----------|---------|
| `p_country` | VARCHAR(255) | ✅ Да | Фильтр по стране | `'all'`, `'КАЗАХСТАН'`, `'КИТАЙ'` |
| `p_days_threshold` | INT | ✅ Да | Минимум дней отсутствия | `3`, `7`, `30` |

### Примеры вызова:
```sql
-- Все страны, отсутствие >3 дней
CALL sp_foreign_students_missing('all', 3);

-- Казахстан, отсутствие >7 дней
CALL sp_foreign_students_missing('КАЗАХСТАН', 7);

-- Китай, отсутствие >5 дней
CALL sp_foreign_students_missing('КИТАЙ', 5);
```

---

## 📤 ВЫХОДНЫЕ ДАННЫЕ

| Поле | Тип | NULL? | Описание | Пример значения |
|------|-----|-------|----------|-----------------|
| `id` | INT | ❌ | ID записи события | `12345` |
| `fio` | VARCHAR(255) | ❌ | ФИО студента | `Абдалла Алаиддин Саед` |
| `upn` | VARCHAR(255) | ✅ | Логин/почта | `stud0123456789@study.utmn.ru` |
| `card_number` | VARCHAR(50) | ✅ | Номер карты | `1234567890` |
| `country` | VARCHAR(255) | ❌ | Страна | `КАЗАХСТАН` |
| `last_seen` | DATETIME | ❌ | Последний визит | `2026-03-02 14:30:00` |
| `last_location` | VARCHAR(255) | ✅ | Место | `Главный корпус, вход 1` |
| `days_missing` | INT | ❌ | Дней отсутствия | `7` |

### Пример результата:
```
+-----+---------------------------+--------------------------------+-------------+-----------+---------------------+-----------------+--------------+
| id  | fio                       | upn                            | card_number | country   | last_seen           | last_location   | days_missing |
+-----+---------------------------+--------------------------------+-------------+-----------+---------------------+-----------------+--------------+
| 101 | Абдалла Алаиддин Саед     | stud0123456789@study.utmn.ru   | 1234567890  | ЕГИПЕТ    | 2026-03-02 14:30:00 | Главный корпус  | 7            |
| 102 | Нурсултан Назарбаев       | foreign.stud@study.utmn.ru     | 9876543210  | КАЗАХСТАН | 2026-03-04 09:15:00 | Корпус 2        | 5            |
| 103 | Ли Вэй                    | li.wei@study.utmn.ru           | 5555555555  | КИТАЙ     | 2026-03-05 16:45:00 | Библиотека      | 4            |
+-----+---------------------------+--------------------------------+-------------+-----------+---------------------+-----------------+--------------+
```

---

## 🎯 Логика работы

1. **Выбор**: Иностранные студенты (не Россия)
2. **Группировка**: По каждому студенту
3. **Расчет**: `DATEDIFF(NOW(), MAX(event_time))` = дней отсутствия
4. **Фильтр**: `days_missing >= p_days_threshold`
5. **Опционально**: Фильтр по стране (если не `'all'`)
6. **Сортировка**: По убыванию `days_missing`, затем по `fio`
7. **Лимит**: 1000 записей

---

## 🌐 REST API

### Endpoint:
```
GET /api/foreign-students/missing
```

### Query параметры:
| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `country` | string | `'all'` | Страна или `'all'` |
| `daysThreshold` | number | `3` | Минимум дней |

### Примеры запросов:
```bash
# Все страны, >3 дней
GET /api/foreign-students/missing?country=all&daysThreshold=3

# Казахстан, >7 дней
GET /api/foreign-students/missing?country=КАЗАХСТАН&daysThreshold=7
```

### Формат ответа:
```json
{
  "success": true,
  "results": [
    {
      "id": 101,
      "fullName": "Абдалла Алаиддин Саед",
      "upn": "stud0123456789@study.utmn.ru",
      "cardNumber": "1234567890",
      "country": "ЕГИПЕТ",
      "time": "2026-03-02 14:30:00",
      "checkpoint": "Главный корпус, вход 1",
      "daysMissing": 7,
      "eventName": null,
      "direction": null,
      "building": null
    }
  ],
  "total": 1
}
```

---

## 🔧 Требования к БД

### Таблицы:
- ✅ `persons` (id, last_name, first_name, middle_name, upn, card_number, country_id, person_type)
- ✅ `person_countries` (id, country_code, country_name)
- ✅ `events` (person_id, event_time, access_point_id)
- ✅ `access_points` (id, name)

### Связи:
- `persons.country_id` → `person_countries.id`
- `events.person_id` → `persons.id`
- `events.access_point_id` → `access_points.id`

### Индексы (рекомендуется):
```sql
CREATE INDEX idx_persons_country ON persons(country_id);
CREATE INDEX idx_persons_type ON persons(person_type);
CREATE INDEX idx_events_person ON events(person_id);
CREATE INDEX idx_events_time ON events(event_time);
```

---

## 🧪 Тестирование

### SQL:
```sql
-- Проверка что процедура существует
SHOW PROCEDURE STATUS WHERE Name = 'sp_foreign_students_missing';

-- Тестовые вызовы
CALL sp_foreign_students_missing('all', 3);
CALL sp_foreign_students_missing('КАЗАХСТАН', 7);
CALL sp_foreign_students_missing('all', 30);
```

### curl:
```bash
TOKEN="your_jwt_token"

# Базовый запрос
curl -X GET "http://localhost:3000/api/foreign-students/missing?country=all&daysThreshold=3" \
  -H "Authorization: Bearer $TOKEN"

# Конкретная страна
curl -X GET "http://localhost:3000/api/foreign-students/missing?country=КАЗАХСТАН&daysThreshold=7" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Рекомендуемые пороги

| Дней отсутствия | Категория | Цвет | Действие |
|-----------------|-----------|------|----------|
| 3-6 дней | Предупреждение | 🟡 Желтый | Мониторинг |
| 7-13 дней | Критическое | 🔴 Красный | Требует внимания |
| 14-29 дней | Серьезное | 🔴 Красный | Связаться со студентом |
| 30+ дней | Долгосрочное | ⚫ Черный | Проверка статуса |

---

## 📁 Связанные файлы

- **Процедура**: `/backend/sql/skud/sp_foreign_students_missing.sql`
- **Спецификация**: `/backend/sql/skud/sp_foreign_students_missing_SPEC.md`
- **Тесты**: `/backend/sql/skud/test_foreign_students_missing.sql`
- **Контроллер**: `/backend/src/controllers/foreignStudentsController.js`
- **Роут**: `/backend/src/routes/foreignStudents.js`
- **Frontend**: `/components/ForeignStudentsReport.tsx`
- **API**: `/lib/api.ts` → `skudApi.getForeignStudentsMissing()`

---

**Версия**: 1.0  
**Дата**: 9 марта 2026  
**Статус**: ✅ Production Ready
