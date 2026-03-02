# ✅ Поиск по идентификатору - Быстрый старт

## 🔧 Что изменилось:

✅ Процедура: `search_card` → `sp_search_person_by_identifier`  
✅ Параметр: целое число (INT)  
✅ Форматы: `"076.12345"` → `76012345`, `"0000076"` → `76`

---

## 🚀 1. Перезапустите backend:

```bash
cd /var/www/utmn-security/debug/backend
# Ctrl+C
npm start
```

---

## 🗄️ 2. Создайте процедуру в MySQL:

```sql
USE perco;

-- Скопируйте SQL из файла:
-- /SKUD_PROCEDURE_TEMPLATE.sql

-- Или создайте минимальную версию:
DROP PROCEDURE IF EXISTS sp_search_person_by_identifier;

DELIMITER $$
CREATE PROCEDURE sp_search_person_by_identifier(IN p_identifier INT)
BEGIN
    SELECT 
        p.id AS person_id,
        p.full_name,
        p.upn AS email,
        c.code AS card_number,
        c.id AS identifier,
        'employee' AS person_type,
        1 AS is_active
    FROM people p
    LEFT JOIN identifiers c ON p.id = c.owner_id
    WHERE c.code = p_identifier OR c.id = p_identifier
    LIMIT 1;
END$$
DELIMITER ;
```

**ВАЖНО:** Адаптируйте под вашу схему! См. `/SKUD_PROCEDURE_TEMPLATE.sql`

---

## 🧪 3. Протестируйте:

```bash
# В MySQL:
CALL sp_search_person_by_identifier(1446738);

# Через API:
curl "http://localhost:3000/v1/skud/search?query=1446738" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📖 Полная документация:

- `/SKUD_SEARCH_UPDATED.md` - детали и примеры
- `/SKUD_PROCEDURE_TEMPLATE.sql` - SQL шаблон с комментариями

---

🎉 **Готово!**
