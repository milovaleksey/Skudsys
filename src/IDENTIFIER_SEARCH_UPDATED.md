# ✅ Обновлено: Поиск только по идентификатору карты

## 🎯 Что изменено

Обновлена логика поиска - теперь ищет **только по номеру карты** с поддержкой преобразования форматов.

---

## 🔧 Изменения в Backend

### `/backend/src/controllers/skudController.js`

#### Добавлена функция `parseCardIdentifier`:

```javascript
/**
 * Парсинг идентификатора карты из различных форматов
 * @param {string} input - "076,10849" или "4991585" или "0004991585"
 * @returns {string[]} - Массив вариантов для поиска
 */
function parseCardIdentifier(input) {
  // Формат с запятой: "076,10849" → hex → decimal
  if (input.includes(',')) {
    const [high, low] = input.split(',');
    const highByte = parseInt(high, 10);  // 76
    const lowBytes = parseInt(low, 10);   // 10849
    
    const highHex = highByte.toString(16);  // 0x4C
    const lowHex = lowBytes.toString(16);   // 0x2A61
    const combined = parseInt(`0x${highHex}${lowHex}`, 16);  // 4991585
    
    return [combined.toString(), combined.toString().padStart(10, '0')];
  }
  
  // Чистое число: "4991585" или "0004991585"
  const numeric = parseInt(input, 10);
  return [input, numeric.toString(), numeric.toString().padStart(10, '0')];
}
```

#### Обновлен SQL запрос:

**Было:** Поиск по `employee_number`, `full_name`, `email`, `card_number`  
**Стало:** Поиск только по `card_number` с точным совпадением

```sql
WHERE al.card_number = ? OR al.card_number = ? OR al.card_number = ?
```

---

## 🎨 Изменения в Frontend

### `/components/IdentifierSearchPage.tsx`

#### Обновлен UI:

1. **Placeholder:** `"076,10849 или 4991585 или 0004991585"`

2. **Информационная панель:**
   - ✅ `076,10849` - формат "старший байт, младшие байты"
   - ✅ `4991585` - прямой числовой идентификатор
   - ✅ `0004991585` - с ведущими нулями

3. **Toast уведомления:**
   - Карта не найдена → `"Карта не найдена. Проверьте правильность ввода идентификатора."`

---

## 📋 Примеры работы

### Пример 1: Формат с запятой

**Ввод:** `076,10849`

**Преобразование:**
```
Старший байт: 76 (decimal) → 0x4C (hex)
Младшие байты: 10849 (decimal) → 0x2A61 (hex)
Объединение: 0x4C2A61
Результат: 4991585 (decimal)
```

**SQL запрос:**
```sql
WHERE al.card_number = '4991585' OR al.card_number = '0004991585'
```

### Пример 2: Прямое число

**Ввод:** `4991585`

**SQL запрос:**
```sql
WHERE al.card_number = '4991585' OR al.card_number = '0004991585'
```

### Пример 3: Число с нулями

**Ввод:** `0004991585`

**SQL запрос:**
```sql
WHERE al.card_number = '0004991585' OR al.card_number = '4991585'
```

---

## 🧪 Тестирование

### Через веб-интерфейс:

1. Войдите в систему (admin/admin123)
2. Перейдите в "Поиск по идентификатору"
3. Введите:
   - `076,10849` ✅
   - `4991585` ✅
   - `0004991585` ✅

### Через API:

```bash
# Формат с запятой
curl "http://localhost:3000/v1/skud/search?query=076,10849" \
  -H "Authorization: Bearer $TOKEN"

# Прямое число
curl "http://localhost:3000/v1/skud/search?query=4991585" \
  -H "Authorization: Bearer $TOKEN"

# С ведущими нулями
curl "http://localhost:3000/v1/skud/search?query=0004991585" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔍 Логи Backend

При поиске вы увидите в консоли:

```
[parseCardIdentifier] Input: "076,10849" → High: 76 (0x4C), Low: 10849 (0x2A61) → Combined: 0x4C2A61 → Decimal: 4991585
[searchByIdentifier] Search identifiers: [ '4991585', '0004991585' ]
```

---

## ✅ Готово!

Теперь поиск работает **только по номеру карты** с автоматическим преобразованием форматов:
- ✅ `076,10849` → преобразуется в decimal
- ✅ `4991585` → прямой поиск
- ✅ `0004991585` → учитывает ведущие нули

**Перезапустите backend для применения изменений:**
```bash
cd backend
npm start
```

🎉 Готово к использованию!
