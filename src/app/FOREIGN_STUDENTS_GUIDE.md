# Система отчетов по иностранным студентам

## Обзор

Страница "Отчет по иностранным студентам" предоставляет:
- **Динамические карточки статистики** через MQTT (включая диаграмму распределения по странам)
- **Два шаблона отчетов** для анализа данных
- **Справочник стран** из MQTT

---

## 📊 Структура MQTT

### 1. Топик конфигурации карточек
**Топик:** `Skud/foreign-students/config`

```json
[
  {
    "id": "total_foreign_students",
    "label": "Всего иностранных студентов",
    "icon": "users",
    "color": "#00aeef",
    "unit": "чел"
  },
  {
    "id": "countries_count",
    "label": "Количество стран",
    "icon": "globe",
    "color": "#10b981",
    "unit": "шт"
  },
  {
    "id": "active_today",
    "label": "Активных сегодня",
    "icon": "activity",
    "color": "#3b82f6"
  },
  {
    "id": "missing_3days",
    "label": "Отсутствуют >3 дней",
    "icon": "alert-circle",
    "color": "#ef4444"
  }
]
```

### 2. Динамические значения карточек
Для каждой карточки публикуйте значение в отдельный топик:

**Топик:** `Skud/foreign-students/data/{card_id}`

Примеры:
```bash
# Всего иностранных студентов
mosquitto_pub -h 10.101.221.232 -t "Skud/foreign-students/data/total_foreign_students" -m "1245"

# Количество стран
mosquitto_pub -h 10.101.221.232 -t "Skud/foreign-students/data/countries_count" -m "68"

# Активных сегодня
mosquitto_pub -h 10.101.221.232 -t "Skud/foreign-students/data/active_today" -m "987"

# Отсутствуют >3 дней
mosquitto_pub -h 10.101.221.232 -t "Skud/foreign-students/data/missing_3days" -m "34"
```

### 3. Статистика по странам (для диаграммы)
**Топик:** `Skud/foreign-students/stats`

```json
[
  {"country": "КАЗАХСТАН", "students_count": 345},
  {"country": "УЗБЕКИСТАН", "students_count": 267},
  {"country": "ТАДЖИКИСТАН", "students_count": 189},
  {"country": "КИРГИЗИЯ", "students_count": 142},
  {"country": "КИТАЙ", "students_count": 98},
  {"country": "ТУРКМЕНИСТАН", "students_count": 76},
  {"country": "ИНДИЯ", "students_count": 54},
  {"country": "ВЬЕТНАМ", "students_count": 42},
  {"country": "МОНГОЛИЯ", "students_count": 32}
]
```

> **Примечание:** Страна "РОССИЯ" автоматически исключается из диаграммы.

### 4. Справочник стран
**Топик:** `Skud/foreign-students/countries`

```json
[
  {"code": "KZ", "name": "КАЗАХСТАН"},
  {"code": "UZ", "name": "УЗБЕКИСТАН"},
  {"code": "TJ", "name": "ТАДЖИКИСТАН"},
  {"code": "KG", "name": "КИРГИЗИЯ"},
  {"code": "CN", "name": "КИТАЙ"},
  {"code": "TM", "name": "ТУРКМЕНИСТАН"},
  {"code": "IN", "name": "ИНДИЯ"},
  {"code": "VN", "name": "ВЬЕТНАМ"},
  {"code": "MN", "name": "МОНГОЛИЯ"}
]
```

---

## 🔧 Backend API

### 1. Поиск проходов иностранных студентов
**Endpoint:** `GET /api/foreign-students/search`

**Query Parameters:**
- `searchType` - Тип поиска: `fio`, `upn`, `email`
- `searchValue` - Значение для поиска
- `dateFrom` - Дата начала (YYYY-MM-DD)
- `dateTo` - Дата окончания (YYYY-MM-DD)

**Пример запроса:**
```bash
GET /api/foreign-students/search?searchType=fio&searchValue=Иванов&dateFrom=2026-03-01&dateTo=2026-03-06
```

**Ответ:**
```json
{
  "success": true,
  "results": [
    {
      "id": 1,
      "fio": "Иванов Иван Иванович",
      "upn": "i.i.ivanov@utmn.ru",
      "email": "ivanov@utmn.ru",
      "country": "КАЗАХСТАН",
      "lastSeen": "2026-03-05 14:30:00",
      "location": "Корпус А, вход 1",
      "direction": "Вход"
    }
  ],
  "total": 1
}
```

### 2. Отчет о пропавших студентах
**Endpoint:** `GET /api/foreign-students/missing`

**Query Parameters:**
- `country` - Код страны или `all` для всех стран (по умолчанию `all`)
- `daysThreshold` - Количество дней отсутствия (по умолчанию `3`)

**Пример запроса:**
```bash
GET /api/foreign-students/missing?country=all&daysThreshold=3
```

**Ответ:**
```json
{
  "success": true,
  "results": [
    {
      "id": 2,
      "fio": "Алиев Али Алиевич",
      "upn": "a.a.aliev@utmn.ru",
      "email": "aliev@utmn.ru",
      "country": "УЗБЕКИСТАН",
      "lastSeen": "2026-03-01 09:15:00",
      "lastLocation": "Корпус Б, вход 2",
      "daysMissing": 5
    }
  ],
  "total": 1
}
```

---

## 🗄️ SQL: Хранимые процедуры

### 1. Процедура поиска проходов (sp_foreign_students_search)

```sql
DELIMITER $$

CREATE PROCEDURE sp_foreign_students_search(
    IN p_search_type VARCHAR(10),   -- 'fio', 'upn', 'email'
    IN p_search_value VARCHAR(255),
    IN p_date_from DATE,
    IN p_date_to DATE
)
BEGIN
    -- Поиск проходов только иностранных студентов
    SELECT 
        l.id,
        p.full_name AS fio,
        p.upn,
        p.email,
        p.country,
        DATE_FORMAT(l.pass_time, '%Y-%m-%d %H:%i:%s') AS pass_time,
        d.location_name AS location,
        CASE 
            WHEN l.direction = 'IN' THEN 'Вход'
            WHEN l.direction = 'OUT' THEN 'Выход'
            ELSE l.direction
        END AS direction
    FROM access_logs l
    INNER JOIN persons p ON l.person_id = p.id
    INNER JOIN doors d ON l.door_id = d.id
    WHERE 
        p.person_type = 'student'
        AND p.country IS NOT NULL 
        AND p.country != 'РОССИЯ'
        AND l.pass_time BETWEEN p_date_from AND DATE_ADD(p_date_to, INTERVAL 1 DAY)
        AND (
            (p_search_type = 'fio' AND p.full_name LIKE CONCAT('%', p_search_value, '%'))
            OR (p_search_type = 'upn' AND (p.upn LIKE CONCAT('%', p_search_value, '%') OR p.email LIKE CONCAT('%', p_search_value, '%')))
            OR (p_search_type = 'email' AND p.email LIKE CONCAT('%', p_search_value, '%'))
        )
    ORDER BY l.pass_time DESC
    LIMIT 1000;
END$$

DELIMITER ;
```

### 2. Процедура отчета о пропавших студентах (sp_foreign_students_missing)

```sql
DELIMITER $$

CREATE PROCEDURE sp_foreign_students_missing(
    IN p_country VARCHAR(10),  -- 'all' или код страны
    IN p_days_threshold INT    -- Количество дней отсутствия
)
BEGIN
    -- Находим иностранных студентов, которые не заходили N дней
    SELECT 
        p.id,
        p.full_name AS fio,
        p.upn,
        p.email,
        p.country,
        DATE_FORMAT(last_visit.last_seen, '%Y-%m-%d %H:%i:%s') AS last_seen,
        last_visit.last_location,
        DATEDIFF(CURDATE(), DATE(last_visit.last_seen)) AS days_missing
    FROM persons p
    LEFT JOIN (
        SELECT 
            l.person_id,
            MAX(l.pass_time) AS last_seen,
            (SELECT d.location_name 
             FROM access_logs l2 
             INNER JOIN doors d ON l2.door_id = d.id 
             WHERE l2.person_id = l.person_id 
             ORDER BY l2.pass_time DESC 
             LIMIT 1) AS last_location
        FROM access_logs l
        GROUP BY l.person_id
    ) AS last_visit ON p.id = last_visit.person_id
    WHERE 
        p.person_type = 'student'
        AND p.country IS NOT NULL 
        AND p.country != 'РОССИЯ'
        AND (p_country = 'all' OR p.country_code = p_country)
        AND (
            last_visit.last_seen IS NULL 
            OR DATEDIFF(CURDATE(), DATE(last_visit.last_seen)) >= p_days_threshold
        )
    ORDER BY days_missing DESC
    LIMIT 500;
END$$

DELIMITER ;
```

---

## 📝 Установка хранимых процедур

```bash
# Подключитесь к MySQL базе СКУД
mysql -u your_user -p skud_database

# Выполните SQL скрипты выше
source /path/to/sp_foreign_students_search.sql
source /path/to/sp_foreign_students_missing.sql

# Проверьте созданные процедуры
SHOW PROCEDURE STATUS WHERE Db = 'skud_database';
```

---

## 🧪 Тестирование

### 1. Публикация тестовых данных

```bash
#!/bin/bash
# foreign-students-publish.sh

MQTT_HOST="10.101.221.232"

# Конфигурация карточек
mosquitto_pub -h $MQTT_HOST -t "Skud/foreign-students/config" -m '[
  {"id":"total_foreign_students","label":"Всего иностранных студентов","icon":"users","color":"#00aeef","unit":"чел"},
  {"id":"countries_count","label":"Количество стран","icon":"globe","color":"#10b981","unit":"шт"},
  {"id":"active_today","label":"Активных сегодня","icon":"activity","color":"#3b82f6"},
  {"id":"missing_3days","label":"Отсутствуют >3 дней","icon":"alert-circle","color":"#ef4444"}
]'

# Значения карточек
mosquitto_pub -h $MQTT_HOST -t "Skud/foreign-students/data/total_foreign_students" -m "1245"
mosquitto_pub -h $MQTT_HOST -t "Skud/foreign-students/data/countries_count" -m "68"
mosquitto_pub -h $MQTT_HOST -t "Skud/foreign-students/data/active_today" -m "987"
mosquitto_pub -h $MQTT_HOST -t "Skud/foreign-students/data/missing_3days" -m "34"

# Статистика по странам
mosquitto_pub -h $MQTT_HOST -t "Skud/foreign-students/stats" -m '[
  {"country":"КАЗАХСТАН","students_count":345},
  {"country":"УЗБЕКИСТАН","students_count":267},
  {"country":"ТАДЖИКИСТАН","students_count":189},
  {"country":"КИРГИЗИЯ","students_count":142},
  {"country":"КИТАЙ","students_count":98},
  {"country":"ТУРКМЕНИСТАН","students_count":76},
  {"country":"ИНДИЯ","students_count":54}
]'

# Справочник стран
mosquitto_pub -h $MQTT_HOST -t "Skud/foreign-students/countries" -m '[
  {"code":"KZ","name":"КАЗАХСТАН"},
  {"code":"UZ","name":"УЗБЕКИСТАН"},
  {"code":"TJ","name":"ТАДЖИКИСТАН"},
  {"code":"KG","name":"КИРГИЗИЯ"},
  {"code":"CN","name":"КИТАЙ"},
  {"code":"TM","name":"ТУРКМЕНИСТАН"},
  {"code":"IN","name":"ИНДИЯ"}
]'

echo "✅ Данные опубликованы в MQTT"
```

Сделайте скрипт исполняемым:
```bash
chmod +x foreign-students-publish.sh
./foreign-students-publish.sh
```

### 2. Тестирование API

```bash
# Получите токен
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | jq -r '.token')

# Тест 1: Поиск проходов
curl -X GET "http://localhost:3000/api/foreign-students/search?searchType=fio&searchValue=Иван&dateFrom=2026-03-01&dateTo=2026-03-06" \
  -H "Authorization: Bearer $TOKEN"

# Тест 2: Отчет о пропавших
curl -X GET "http://localhost:3000/api/foreign-students/missing?country=all&daysThreshold=3" \
  -H "Authorization: Bearer $TOKEN"
```

---

## ✅ Чеклист

- [ ] Хранимые процедуры созданы в базе СКУД
- [ ] Backend API endpoints работают
- [ ] MQTT конфигурация опубликована
- [ ] Frontend отображает карточки
- [ ] Диаграмма показывает распределение по странам
- [ ] Шаблон 1 (поиск) возвращает данные
- [ ] Шаблон 2 (пропавшие) возвращает данные
- [ ] Справочник стран загружается из MQTT
- [ ] Экспорт CSV работает

---

## 🎯 Особенности

1. **Динамические карточки** - обновляются в реальном времени через MQTT
2. **Диаграмма распределения** - топ-7 стран по количеству студентов (исключая Россию)
3. **Два шаблона отчетов**:
   - Поиск проходов с фильтрацией по ФИО/Логину/Email и датам
   - Отчет о пропавших студентах с выбором страны и порога дней
4. **Справочник стран** - часто обновляется через MQTT
5. **Единый дизайн** - использует компоненты DynamicStatCard и ChartStatCard
6. **Статус подключения** - значок CheckCircle/XCircle

---

## 📚 Следующие шаги

Вы упомянули, что "остальные шаблоны придумаю чуть позже". Когда будете готовы, можете добавить:
- Шаблон 3: Статистика по визам (истекающие визы)
- Шаблон 4: Анализ активности по дням недели
- Шаблон 5: Отчет по общежитиям
- И т.д.

Просто создайте новую кнопку в tabs и новый блок в условии `activeTemplate === 'new-template'`.
