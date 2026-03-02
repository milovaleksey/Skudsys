# ✅ Обновлён поиск по идентификатору

## 🔧 Что изменилось:

1. ✅ **Процедура изменена:** `search_card` → `sp_search_person_by_identifier`
2. ✅ **Передаётся целое число** вместо массива вариантов
3. ✅ **Поддерживаются все форматы:**
   - `"076.12345"` → `76012345` (убирает точку)
   - `"0000000076"` → `76` (убирает ведущие нули)
   - `"76"` → `76` (целое число)
   - `"076,10849"` → преобразует в hex → decimal

---

## 🚀 Перезапустите backend:

```bash
cd /var/www/utmn-security/debug/backend
# Ctrl+C
npm start
```

---

## 📊 Логи теперь показывают:

**Было:**
```
[searchByIdentifier] Search identifiers: [ '076.12345', '76', '0000000076' ]
[searchByIdentifier] Calling search_card('076.12345')
[searchByIdentifier] Error: PROCEDURE perco.search_card does not exist
```

**Стало:**
```
[parseCardIdentifier] Input: "076.12345" → Without dot: "76012345" → Numeric: 76012345
[searchByIdentifier] Calling sp_search_person_by_identifier(76012345)
[searchByIdentifier] Procedure returned 1 results for identifier: 76012345
[searchByIdentifier] Formatted 1 results
```

---

## 🗄️ Создание процедуры (если ещё не создана):

Если процедура `sp_search_person_by_identifier` не существует в базе данных СКУД, создайте её:

### SQL скрипт:

```sql
USE perco;

DROP PROCEDURE IF EXISTS sp_search_person_by_identifier;

DELIMITER $$

CREATE PROCEDURE sp_search_person_by_identifier(IN p_identifier INT)
BEGIN
    -- Поиск по идентификатору карты
    -- Возвращает информацию о человеке, его карте и последнем проходе
    
    SELECT 
        p.id AS person_id,
        p.full_name,
        p.upn AS email,
        p.dept_name AS department,
        p.job_title AS position,
        
        c.code AS card_number,
        c.id AS identifier,
        
        'employee' AS person_type,  -- или определяйте динамически
        
        e.event_time AS last_seen,
        ap.name AS last_location,
        
        1 AS is_active
        
    FROM 
        people p
        
    LEFT JOIN 
        identifiers c ON p.id = c.owner_id
        
    LEFT JOIN (
        -- Последний проход
        SELECT 
            owner_id,
            event_time,
            access_point_id
        FROM events
        WHERE owner_id IS NOT NULL
        ORDER BY event_time DESC
        LIMIT 1
    ) e ON p.id = e.owner_id
    
    LEFT JOIN 
        access_points ap ON e.access_point_id = ap.id
        
    WHERE 
        c.code = p_identifier
        OR c.id = p_identifier
        
    LIMIT 1;
    
END$$

DELIMITER ;
```

### Адаптация под вашу схему:

Процедура выше - это **шаблон**. Вам нужно **адаптировать** её под вашу реальную схему базы данных:

1. **Замените имена таблиц:**
   - `people` → ваша таблица с людьми
   - `identifiers` → ваша таблица с картами/идентификаторами
   - `events` → ваша таблица с проходами
   - `access_points` → ваша таблица с точками доступа

2. **Замените имена колонок:**
   - `p.id` → ID человека
   - `p.full_name` → ФИО
   - `p.upn` → email/UPN
   - `c.code` → номер карты
   - `e.event_time` → время прохода

3. **Определите тип человека:**
   ```sql
   -- Если есть поле person_type:
   p.person_type AS person_type
   
   -- Или определяйте динамически:
   CASE 
       WHEN p.dept_name LIKE '%студент%' THEN 'student'
       WHEN p.dept_name LIKE '%преподаватель%' THEN 'teacher'
       ELSE 'employee'
   END AS person_type
   ```

---

## 🧪 Тестирование:

### 1. Проверьте, что процедура создана:

```sql
USE perco;
SHOW PROCEDURE STATUS WHERE Db = 'perco' AND Name = 'sp_search_person_by_identifier';
```

### 2. Протестируйте процедуру вручную:

```sql
CALL sp_search_person_by_identifier(1446738);
```

**Должно вернуть:**
- `person_id` - ID человека
- `full_name` - ФИО
- `email` - email
- `card_number` - номер карты
- `last_seen` - последний проход
- `last_location` - где был

### 3. Протестируйте через API:

```bash
curl "http://localhost:3000/v1/skud/search?query=1446738" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": 12345,
      "identifier": "1446738",
      "identifierType": "employee",
      "fullName": "Иванов Иван Иванович",
      "email": "i.i.ivanov@utmn.ru",
      "position": "Преподаватель",
      "department": "Кафедра информатики",
      "cardNumber": "1446738",
      "lastSeen": "02.03.2026, 14:30:15",
      "location": "Главный вход",
      "status": "active"
    }
  ],
  "count": 1
}
```

---

## 📋 Примеры поиска:

### Поиск по формату с точкой:
```bash
# Ввод: "076.12345"
# Преобразуется в: 76012345
curl "http://localhost:3000/v1/skud/search?query=076.12345"
```

**Лог backend:**
```
[parseCardIdentifier] Input: "076.12345" → Without dot: "76012345" → Numeric: 76012345
[searchByIdentifier] Calling sp_search_person_by_identifier(76012345)
```

### Поиск по числу с ведущими нулями:
```bash
# Ввод: "0000000076"
# Преобразуется в: 76
curl "http://localhost:3000/v1/skud/search?query=0000000076"
```

**Лог backend:**
```
[parseCardIdentifier] Input: "0000000076" → Numeric: 76
[searchByIdentifier] Calling sp_search_person_by_identifier(76)
```

### Поиск по чистому числу:
```bash
# Ввод: "1446738"
# Остаётся: 1446738
curl "http://localhost:3000/v1/skud/search?query=1446738"
```

**Лог backend:**
```
[parseCardIdentifier] Input: "1446738" → Numeric: 1446738
[searchByIdentifier] Calling sp_search_person_by_identifier(1446738)
```

---

## ⚠️ Если процедура не существует:

Backend вернёт дружественное сообщение:

```json
{
  "success": false,
  "message": "Хранимая процедура sp_search_person_by_identifier не найдена в базе данных",
  "error": {
    "message": "Необходимо создать процедуру sp_search_person_by_identifier в базе данных СКУД",
    "code": "PROCEDURE_NOT_FOUND"
  }
}
```

**Решение:** Создайте процедуру (см. SQL скрипт выше)

---

## 🎯 Что дальше:

1. ✅ **Backend обновлён** - использует `sp_search_person_by_identifier(INTEGER)`
2. ✅ **Парсинг идентификаторов** - преобразует все форматы в целое число
3. ⏳ **Создайте процедуру** в базе данных СКУД (если ещё не создана)
4. ⏳ **Протестируйте** через API

---

## 📖 Связанные файлы:

- ✅ `/backend/src/controllers/skudController.js` - обновлён
- 📄 `/SKUD_PROCEDURE_TEMPLATE.sql` - шаблон процедуры (нужно создать)

---

🎉 **Готово! После создания процедуры поиск заработает!**
