# 📋 API для чтения пользователей и ролей из БД

## ✅ Что реализовано

### Backend
1. **Role Controller** (`/backend/src/controllers/role.controller.js`)
   - Получение всех ролей из БД
   - Получение роли по ID
   - Создание новой роли
   - Обновление роли
   - Удаление роли
   - Получение списка прав (permissions)

2. **Обновлены маршруты** (`/backend/src/routes/role.routes.js`)
   - Подключен role.controller
   - Настроена авторизация

3. **Формат данных**
   - ID преобразуется в строку для совместимости с frontend
   - Permissions парсятся из JSON
   - ExternalGroups парсятся из JSON

### Frontend
- AuthContext уже настроен для загрузки ролей из API
- При монтировании автоматически вызывается `rolesApi.getAll()`

---

## 🚀 Тестирование на сервере

### 1. Перезапустите backend

```bash
sudo systemctl restart utmn-security
```

### 2. Проверьте логи

```bash
sudo journalctl -u utmn-security -n 20 --no-pager
```

Не должно быть ошибок при запуске.

---

## 🧪 Тесты API

### Получить JWT токен

Сначала залогиньтесь, чтобы получить токен:

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin2025"}' \
  | grep -o '"token":"[^"]*"' \
  | cut -d'"' -f4)

echo "Token: $TOKEN"
```

### Тест 1: Получить все роли

```bash
curl http://localhost:3000/api/roles \
  -H "Authorization: Bearer $TOKEN"
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "admin",
      "displayName": "Администратор",
      "description": "Полный доступ к системе",
      "permissions": ["dashboard", "users-settings", "roles-settings", ...],
      "isSystem": true,
      "externalGroups": [],
      "createdAt": "2026-01-25T...",
      "updatedAt": null
    },
    {
      "id": "2",
      "name": "security",
      ...
    }
  ]
}
```

### Тест 2: Получить роль по ID

```bash
curl http://localhost:3000/api/roles/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Тест 3: Получить список прав (permissions)

```bash
curl http://localhost:3000/api/roles/permissions \
  -H "Authorization: Bearer $TOKEN"
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "data": [
    { "id": "dashboard", "name": "Главная панель", "category": "Основные" },
    { "id": "users-settings", "name": "Управление пользователями", "category": "Администрирование" },
    ...
  ]
}
```

### Тест 4: Получить всех пользователей

```bash
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "admin",
        "fullName": "Администратор Системы",
        "email": "admin@utmn.ru",
        "role": "admin",
        "roleDisplayName": "Администратор",
        "authType": "local",
        "isActive": true,
        "createdAt": "2026-01-25T...",
        "lastLogin": "2026-01-25T..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### Тест 5: Создать новую роль

```bash
curl -X POST http://localhost:3000/api/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "custom_role",
    "displayName": "Пользовательская роль",
    "description": "Тестовая роль",
    "permissions": ["dashboard", "analytics"]
  }'
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "data": {
    "id": "6",
    "name": "custom_role",
    "displayName": "Пользовательская роль",
    "description": "Тестовая роль",
    "permissions": ["dashboard", "analytics"],
    "isSystem": false,
    "externalGroups": [],
    "createdAt": "2026-01-25T..."
  }
}
```

---

## 🌐 Проверка в браузере

### 1. Откройте приложение

Откройте frontend в браузере.

### 2. Откройте DevTools (F12)

Перейдите на вкладку **Console**.

### 3. Залогиньтесь

Войдите с учетными данными:
- Username: `admin`
- Password: `Admin2025`

### 4. Проверьте Network

В DevTools → Network найдите запросы:

1. **`/v1/auth/login`** - должен вернуть `200 OK` с токеном
2. **`/v1/auth/me`** - загрузка текущего пользователя
3. **`/v1/roles`** - загрузка ролей из БД

### 5. Проверьте Console

Не должно быть ошибок типа:
- "Failed to load roles"
- "CORS error"
- "401 Unauthorized"

### 6. Проверьте данные в AuthContext

В Console выполните:

```javascript
// Это должно показать загруженные роли из БД
console.log('Roles:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
```

Или просто посмотрите в React DevTools → Components → AuthProvider

---

## 📊 Структура данных

### Role (из БД)

```typescript
interface Role {
  id: string;            // Преобразуется из number в string
  name: string;          // Уникальное имя (admin, security, etc)
  displayName: string;   // Отображаемое имя
  description: string;   // Описание
  permissions: string[]; // Массив прав
  isSystem: boolean;     // Системная роль (нельзя удалить)
  externalGroups: string[]; // Группы AD/SSO
  createdAt: string;     // Дата создания
  updatedAt?: string;    // Дата обновления
}
```

### User (из БД)

```typescript
interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;          // Ссылка на role.name
  roleDisplayName: string;
  authType: 'local' | 'sso';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}
```

---

## 🔒 Права доступа

### Для просмотра ролей
Требуется аутентификация (JWT токен)

### Для создания/изменения/удаления ролей
Требуется право `roles-settings`

### Системные роли
- Нельзя удалить
- Можно изменить только permissions

---

## ⚠️ Возможные ошибки

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Токен недействителен или истек"
  }
}
```

**Решение:** Перелогиньтесь, получите новый токен

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Недостаточно прав для выполнения операции"
  }
}
```

**Решение:** У пользователя нет нужного права (например, `roles-settings`)

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "ROLE_NOT_FOUND",
    "message": "Роль не найдена"
  }
}
```

**Решение:** Проверьте ID роли

### Ошибка парсинга JSON

Если в БД сохранено некорректное JSON значение в поле `permissions` или `external_groups`:

**Решение:**
```sql
-- Исправить вручную в MySQL
UPDATE roles SET permissions = '[]' WHERE permissions IS NULL OR permissions = '';
```

---

## 📝 Следующие шаги

1. ✅ Протестируйте загрузку ролей в браузере
2. ✅ Проверьте что роли отображаются в настройках
3. ✅ Протестируйте создание/изменение ролей через UI
4. 🔄 Реализуйте загрузку пользователей (уже готово в backend)
5. 🔄 Подключите управление пользователями в UI

---

**Дата:** 25.01.2026  
**Статус:** ✅ Готово к тестированию
