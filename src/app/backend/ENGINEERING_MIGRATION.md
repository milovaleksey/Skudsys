# Миграция: Добавление инженерного раздела

## Описание
Эта миграция добавляет разрешение `engineering` для доступа к инженерному разделу системы безопасности.

## Что добавляется
- Разрешение `engineering` для роли **admin**
- Разрешение `engineering` для роли **security**

## Запуск миграции

### 1. Подготовка
Убедитесь, что:
- ✅ Backend сервер остановлен
- ✅ База данных доступна
- ✅ Файл `.env` содержит корректные данные для подключения к БД

### 2. Выполнение миграции

```bash
# Из корневой директории проекта
node backend/add-engineering-permission.js
```

### 3. Проверка

После успешного выполнения вы увидите:
```
✅ Подключение к БД установлено
✅ Право engineering добавлено для роли admin
✅ Право engineering добавлено для роли security

📊 Текущее состояние ролей:

admin:
  - Всего прав: XX
  - engineering: ✅
  - Все права: dashboard, users-settings, roles-settings, ..., engineering

security:
  - Всего прав: XX
  - engineering: ✅

✅ Миграция завершена успешно!

ℹ️  Доступ к инженерному разделу теперь имеют роли: admin, security

✨ Готово! Перезапустите backend сервер.
```

### 4. Перезапуск сервера

```bash
# Из директории backend
npm run dev
# или
node src/server.js
```

## Функционал инженерного раздела

После миграции пользователи с ролями `admin` и `security` получат доступ к:

1. **Таблице аномальных событий СКУД**
   - Live-обновления через MQTT (топик `Skud/baddialsevent`)
   - Фильтрация по датам, типу события, устройству
   - Экспорт в Excel

2. **Управлению правилами доступа**
   - Создание правил (отдел + шаблон доступа + тип пользователя)
   - Редактирование и удаление правил
   - Активация/деактивация правил

## API Endpoints

После миграции доступны следующие endpoints:

```
GET    /api/engineering/bad-events          - Получить аномальные события
GET    /api/engineering/access-rules        - Получить правила доступа
POST   /api/engineering/access-rules        - Создать правило
PUT    /api/engineering/access-rules/:id    - Обновить правило
DELETE /api/engineering/access-rules/:id    - Удалить правило
PATCH  /api/engineering/access-rules/:id/toggle - Переключить активность
```

## Откат миграции

Если нужно удалить разрешение `engineering`:

```sql
-- Для роли admin
UPDATE roles 
SET permissions = JSON_REMOVE(permissions, JSON_UNQUOTE(JSON_SEARCH(permissions, 'one', 'engineering')))
WHERE name = 'admin';

-- Для роли security
UPDATE roles 
SET permissions = JSON_REMOVE(permissions, JSON_UNQUOTE(JSON_SEARCH(permissions, 'one', 'engineering')))
WHERE name = 'security';
```

## Поддержка

Если миграция не выполнилась:
1. Проверьте подключение к БД
2. Проверьте наличие ролей `admin` и `security`
3. Проверьте логи выполнения скрипта
4. Обратитесь к разработчикам системы
