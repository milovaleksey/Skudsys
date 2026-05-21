# 📊 Шаблон "Пропавшие студенты" - Краткая сводка

## ✅ Что сделано

### 1. Backend (полностью готов)

#### Контроллер: `/backend/src/controllers/foreignStudentsController.js`
- ✅ Метод `getMissingStudents()` уже существует
- ✅ Обновлен формат ответа на `PassRecord`:
  ```javascript
  {
    id, fullName, upn, cardNumber, 
    country, time, checkpoint, daysMissing
  }
  ```

#### Роут: `/backend/src/routes/foreignStudents.js`
- ✅ `GET /api/foreign-students/missing`
- ✅ Query параметры: `country`, `daysThreshold`

#### Регистрация: `/backend/src/server.js`
- ✅ Роут зарегистрирован на `/api/foreign-students` и `/v1/foreign-students`

### 2. Frontend (полностью готов)

#### API: `/lib/api.ts`
- ✅ Добавлен метод `skudApi.getForeignStudentsMissing(country, daysThreshold)`

#### Компонент: `/components/ForeignStudentsReport.tsx`
- ✅ Форма с полями:
  - Выбор страны (dropdown с динамическим списком)
  - Порог дней отсутствия (number input, по умолчанию 3)
- ✅ Обработчик `handleMissingReport()` использует новый API
- ✅ Таблица результатов с колонками:
  - ФИО
  - Логин/Почта
  - **Страна** (синий бейджик с иконкой глобуса)
  - Последний визит
  - Место
  - **Дней отсутствия** (красный ≥7, желтый <7)
- ✅ Экспорт в Excel

### 3. База данных

#### Хранимая процедура: `/backend/sql/skud/sp_foreign_students_missing.sql`
- ✅ Создана процедура `sp_foreign_students_missing(p_country, p_days_threshold)`
- ✅ Логика:
  - Фильтрует только иностранных студентов (не Россия)
  - Группирует по персоне, находит последний визит
  - Рассчитывает `DATEDIFF(NOW(), MAX(event_time))`
  - Фильтрует по `days_missing >= p_days_threshold`
  - Опционально фильтрует по стране
  - Сортирует по убыванию дней отсутствия
- ✅ Права доступа для `skud_app` пользователя

#### Тестовые данные: `/backend/sql/skud/test_foreign_students_missing.sql`
- ✅ Запросы для проверки данных
- ✅ Примеры вызовов процедуры
- ✅ Запросы для отладки

## 🔧 Что осталось сделать

### ❗ Единственный шаг - развертывание БД:

```bash
# Выполнить SQL скрипт в базе СКУД
mysql -u root -p skud_database < /backend/sql/skud/sp_foreign_students_missing.sql
```

### Проверка:
```sql
-- Проверить что процедура создана
SHOW PROCEDURE STATUS WHERE Name = 'sp_foreign_students_missing';

-- Тестовый вызов
CALL sp_foreign_students_missing('all', 3);
```

## 📋 Документация

Создана подробная документация:
- ✅ `/FOREIGN_STUDENTS_TEMPLATE_2_DEPLOY.md` - полное руководство
- ✅ `/backend/sql/skud/sp_foreign_students_missing.sql` - хранимая процедура
- ✅ `/backend/sql/skud/test_foreign_students_missing.sql` - тесты и примеры

## 🎯 Итого

### Готово к работе:
1. ✅ Backend API полностью функционален
2. ✅ Frontend UI полностью готов
3. ✅ SQL скрипты подготовлены

### Требуется:
1. ❗ Выполнить SQL скрипт в базе данных СКУД

---

**Время на развертывание**: ~5 минут  
**Статус**: ✅ Готов к развертыванию  
**Дата**: 9 марта 2026
