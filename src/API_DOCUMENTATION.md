# API Документация

## Базовый URL

```
http://ваш-сервер:3001/api
```

## Аутентификация

Большинство endpoints требуют JWT токен в заголовке:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Авторизация

### POST /api/auth/login

Вход в систему и получение JWT токена.

**Тело запроса:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Ответ (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "fullName": "Администратор",
    "role": "admin"
  }
}
```

**Ошибки:**
- `401` - Неверные учетные данные
- `400` - Отсутствуют обязательные поля

---

### POST /api/auth/sso

SSO авторизация через внешнюю систему (AD/LDAP).

**Тело запроса:**
```json
{
  "username": "ivanov",
  "externalGroups": ["dl-human-monitor-admin", "staff"]
}
```

**Ответ (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 5,
    "username": "ivanov",
    "fullName": "Иванов И.И.",
    "role": "admin",
    "assignedByGroup": "dl-human-monitor-admin"
  }
}
```

---

### POST /api/auth/logout

Выход из системы.

**Заголовки:**
```
Authorization: Bearer YOUR_TOKEN
```

**Ответ (200 OK):**
```json
{
  "message": "Выход выполнен успешно"
}
```

---

## Пользователи

### GET /api/users

Получить список всех пользователей.

**Права:** `users-settings`

**Заголовки:**
```
Authorization: Bearer YOUR_TOKEN
```

**Ответ (200 OK):**
```json
[
  {
    "id": 1,
    "username": "admin",
    "fullName": "Администратор",
    "role": "admin",
    "createdAt": "2026-01-23T10:00:00.000Z"
  },
  {
    "id": 2,
    "username": "operator1",
    "fullName": "Оператор 1",
    "role": "operator",
    "createdAt": "2026-01-23T11:00:00.000Z"
  }
]
```

---

### POST /api/users

Создать нового пользователя.

**Права:** `users-settings`

**Тело запроса:**
```json
{
  "username": "newuser",
  "password": "securePassword123",
  "fullName": "Новый Пользователь",
  "role": "operator"
}
```

**Ответ (201 Created):**
```json
{
  "id": 3,
  "username": "newuser",
  "fullName": "Новый Пользователь",
  "role": "operator"
}
```

**Ошибки:**
- `400` - Пользователь уже существует
- `400` - Отсутствуют обязательные поля

---

### PUT /api/users/:id

Обновить данные пользователя.

**Права:** `users-settings`

**Тело запроса:**
```json
{
  "fullName": "Обновленное Имя",
  "role": "manager"
}
```

**Ответ (200 OK):**
```json
{
  "message": "Пользователь обновлен"
}
```

---

### PUT /api/users/:id/password

Изменить пароль пользователя.

**Права:** `users-settings`

**Тело запроса:**
```json
{
  "newPassword": "newSecurePassword123"
}
```

**Ответ (200 OK):**
```json
{
  "message": "Пароль изменен"
}
```

---

### DELETE /api/users/:id

Удалить пользователя.

**Права:** `users-settings`

**Ответ (200 OK):**
```json
{
  "message": "Пользователь удален"
}
```

**Ошибки:**
- `403` - Нельзя удалить последнего администратора

---

## Роли

### GET /api/roles

Получить список всех ролей.

**Права:** `roles-settings`

**Ответ (200 OK):**
```json
[
  {
    "id": 1,
    "name": "admin",
    "displayName": "Администратор",
    "description": "Полный доступ",
    "permissions": [
      "dashboard",
      "users-settings",
      "roles-settings",
      ...
    ]
  },
  {
    "id": 2,
    "name": "operator",
    "displayName": "Оператор",
    "description": "Базовый доступ",
    "permissions": ["dashboard", "passes", "location"]
  }
]
```

---

### POST /api/roles

Создать новую роль.

**Права:** `roles-settings`

**Тело запроса:**
```json
{
  "name": "custom_role",
  "displayName": "Кастомная роль",
  "description": "Описание роли",
  "permissions": ["dashboard", "passes", "analytics"]
}
```

**Ответ (201 Created):**
```json
{
  "id": 6,
  "name": "custom_role",
  "displayName": "Кастомная роль"
}
```

---

### PUT /api/roles/:id

Обновить роль.

**Права:** `roles-settings`

**Тело запроса:**
```json
{
  "displayName": "Новое название",
  "description": "Новое описание",
  "permissions": ["dashboard", "passes"]
}
```

**Ответ (200 OK):**
```json
{
  "message": "Роль обновлена"
}
```

---

### DELETE /api/roles/:id

Удалить роль.

**Права:** `roles-settings`

**Ответ (200 OK):**
```json
{
  "message": "Роль удалена"
}
```

**Ошибки:**
- `403` - Нельзя удалить системные роли (admin, security, manager, operator, viewer)

---

### GET /api/roles/:id/external-groups

Получить список внешних групп AD/SSO для роли.

**Права:** `roles-settings`

**Ответ (200 OK):**
```json
[
  {
    "id": 1,
    "groupName": "dl-human-monitor-admin",
    "description": "Группа администраторов"
  },
  {
    "id": 2,
    "groupName": "security-team",
    "description": "Команда безопасности"
  }
]
```

---

### POST /api/roles/:id/external-groups

Добавить внешнюю группу AD/SSO к роли.

**Права:** `roles-settings`

**Тело запроса:**
```json
{
  "groupName": "dl-human-monitor-admin",
  "description": "Группа администраторов"
}
```

**Ответ (201 Created):**
```json
{
  "id": 3,
  "roleId": 1,
  "groupName": "dl-human-monitor-admin",
  "description": "Группа администраторов"
}
```

---

### DELETE /api/roles/:roleId/external-groups/:groupId

Удалить внешнюю группу из роли.

**Права:** `roles-settings`

**Ответ (200 OK):**
```json
{
  "message": "Группа удалена"
}
```

---

## Студенты

### GET /api/students

Получить список студентов с фильтрацией.

**Права:** `students`

**Параметры запроса:**
- `dormitory` (опционально) - Номер общежития (1-4)
- `faculty` (опционально) - Факультет
- `year` (опционально) - Курс
- `search` (опционально) - Поиск по ФИО

**Пример:**
```
GET /api/students?dormitory=1&year=2
```

**Ответ (200 OK):**
```json
[
  {
    "id": 1,
    "fullName": "Иванов Иван Иванович",
    "studentId": "123.456789",
    "cardNumber": "1234567890123",
    "faculty": "Институт математики и компьютерных наук",
    "course": 2,
    "dormitory": 1,
    "room": "205",
    "email": "ivanov@student.utmn.ru",
    "phone": "+79123456789"
  }
]
```

---

### GET /api/students/:id

Получить данные конкретного студента.

**Права:** `students`

**Ответ (200 OK):**
```json
{
  "id": 1,
  "fullName": "Иванов Иван Иванович",
  "studentId": "123.456789",
  "cardNumber": "1234567890123",
  "faculty": "Институт математики и компьютерных наук",
  "course": 2,
  "dormitory": 1,
  "room": "205",
  "email": "ivanov@student.utmn.ru",
  "phone": "+79123456789",
  "lastAccess": "2026-01-23T14:30:00.000Z",
  "lastLocation": "Общежитие №1"
}
```

---

## Сотрудники

### GET /api/employees

Получить список сотрудников с фильтрацией.

**Права:** `employees`

**Параметры запроса:**
- `department` (опционально) - Подразделение
- `position` (опционально) - Должность
- `search` (опционально) - Поиск по ФИО

**Пример:**
```
GET /api/employees?department=IT
```

**Ответ (200 OK):**
```json
[
  {
    "id": 1,
    "fullName": "Петров Петр Петрович",
    "employeeId": "234.567890",
    "cardNumber": "2345678901234",
    "position": "Инженер",
    "department": "Отдел информационных технологий",
    "email": "petrov@utmn.ru",
    "phone": "+79123456780"
  }
]
```

---

## Логи проходов

### GET /api/access-logs

Получить логи проходов.

**Права:** `passes`

**Параметры запроса:**
- `startDate` - Дата начала (YYYY-MM-DD)
- `endDate` - Дата окончания (YYYY-MM-DD)
- `personType` (опционально) - Тип: student, employee, all
- `cardNumber` (опционально) - Номер карты
- `location` (опционально) - Местоположение

**Пример:**
```
GET /api/access-logs?startDate=2026-01-20&endDate=2026-01-23&personType=student
```

**Ответ (200 OK):**
```json
[
  {
    "id": 1,
    "cardNumber": "1234567890123",
    "fullName": "Иванов Иван Иванович",
    "personType": "student",
    "location": "Общежитие №1",
    "direction": "entry",
    "timestamp": "2026-01-23T08:30:00.000Z"
  },
  {
    "id": 2,
    "cardNumber": "1234567890123",
    "fullName": "Иванов Иван Иванович",
    "personType": "student",
    "location": "Общежитие №1",
    "direction": "exit",
    "timestamp": "2026-01-23T18:45:00.000Z"
  }
]
```

---

### GET /api/access-logs/export

Экспорт логов в Excel.

**Права:** `passes`

**Параметры:** Те же, что и для GET /api/access-logs

**Ответ:** Excel файл (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

---

## Парковка

### GET /api/parking

Получить текущее состояние парковки.

**Права:** `parking`

**Ответ (200 OK):**
```json
{
  "totalSpaces": 200,
  "occupiedSpaces": 156,
  "availableSpaces": 44,
  "occupancyRate": 78,
  "vehicles": [
    {
      "id": 1,
      "plateNumber": "А123БВ196",
      "ownerName": "Иванов И.И.",
      "ownerType": "student",
      "entryTime": "2026-01-23T08:00:00.000Z",
      "parkingSpace": "A-15"
    }
  ]
}
```

---

### POST /api/parking/entry

Зарегистрировать въезд на парковку.

**Права:** `parking`

**Тело запроса:**
```json
{
  "plateNumber": "А123БВ196",
  "ownerName": "Иванов И.И.",
  "ownerType": "student",
  "parkingSpace": "A-15"
}
```

**Ответ (201 Created):**
```json
{
  "id": 1,
  "plateNumber": "А123БВ196",
  "entryTime": "2026-01-23T08:00:00.000Z"
}
```

---

### POST /api/parking/exit

Зарегистрировать выезд с парковки.

**Права:** `parking`

**Тело запроса:**
```json
{
  "plateNumber": "А123БВ196"
}
```

**Ответ (200 OK):**
```json
{
  "message": "Выезд зарегистрирован",
  "duration": "10:30:00"
}
```

---

## Аналитика

### GET /api/analytics/students

Статистика по студентам.

**Права:** `analytics`

**Ответ (200 OK):**
```json
{
  "total": 32000,
  "byDormitory": {
    "1": 345,
    "2": 264,
    "3": 412,
    "4": 298
  },
  "byFaculty": {
    "ИМИКН": 4500,
    "ИФиЖ": 3200,
    "ИБиП": 5100
  },
  "foreign": 1247
}
```

---

### GET /api/analytics/employees

Статистика по сотрудникам.

**Права:** `analytics`

**Ответ (200 OK):**
```json
{
  "total": 2400,
  "byDepartment": {
    "IT": 45,
    "HR": 12,
    "Security": 23
  },
  "byPosition": {
    "Профессор": 340,
    "Доцент": 520,
    "Инженер": 180
  }
}
```

---

## Логи пользователей

### GET /api/user-logs

Получить логи действий пользователей.

**Права:** `user-logs`

**Параметры запроса:**
- `startDate` - Дата начала (YYYY-MM-DD)
- `endDate` - Дата окончания (YYYY-MM-DD)
- `username` (опционально) - Имя пользователя
- `action` (опционально) - Тип действия

**Ответ (200 OK):**
```json
[
  {
    "id": 1,
    "username": "admin",
    "action": "login",
    "details": "Успешный вход в систему",
    "ipAddress": "192.168.1.100",
    "timestamp": "2026-01-23T10:00:00.000Z"
  },
  {
    "id": 2,
    "username": "admin",
    "action": "user_created",
    "details": "Создан пользователь: operator1",
    "ipAddress": "192.168.1.100",
    "timestamp": "2026-01-23T10:15:00.000Z"
  }
]
```

---

## Коды ошибок

- **200 OK** - Успешный запрос
- **201 Created** - Ресурс создан
- **400 Bad Request** - Неверные данные запроса
- **401 Unauthorized** - Требуется авторизация
- **403 Forbidden** - Недостаточно прав
- **404 Not Found** - Ресурс не найден
- **500 Internal Server Error** - Ошибка сервера

---

## Примеры использования

### cURL

```bash
# Авторизация
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

# Получить пользователей
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer $TOKEN"

# Создать пользователя
curl -X POST http://localhost:3001/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"newuser","password":"pass123","role":"operator","fullName":"Новый Пользователь"}'
```

### JavaScript (Fetch)

```javascript
// Авторизация
const login = async () => {
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const data = await response.json();
  return data.token;
};

// Получить пользователей
const getUsers = async (token) => {
  const response = await fetch('http://localhost:3001/api/users', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};
```

### Python (requests)

```python
import requests

# Авторизация
response = requests.post(
    'http://localhost:3001/api/auth/login',
    json={'username': 'admin', 'password': 'admin123'}
)
token = response.json()['token']

# Получить пользователей
response = requests.get(
    'http://localhost:3001/api/users',
    headers={'Authorization': f'Bearer {token}'}
)
users = response.json()
```

---

**Версия API:** 1.0  
**Дата обновления:** 23.01.2026
