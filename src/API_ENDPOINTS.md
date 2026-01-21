# 📡 API Endpoints Documentation - v1.0

## База URL
```
Production: https://your-domain.ru/api
Testing:    http://your-server-ip/api
Local:      http://localhost:3000/api
```

---

## 🔐 Авторизация

### POST `/auth/login`
Вход в систему

**Request:**
```json
{
  "username": "admin@utmn.ru",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "fullName": "Администратор Системы",
    "upn": "admin@utmn.ru",
    "role": "admin",
    "roleDescription": "Администратор"
  }
}
```

**Response (401):**
```json
{
  "error": "Неверный логин или пароль"
}
```

---

### POST `/auth/logout`
Выход из системы

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Выход выполнен успешно"
}
```

---

### GET `/auth/verify`
Проверка токена

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "fullName": "Администратор Системы",
    "upn": "admin@utmn.ru",
    "role": "admin"
  }
}
```

---

## 👥 Пользователи

### GET `/users`
Получить список всех пользователей

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
```
?search=иванов          // Поиск по ФИО/UPN
?role=admin             // Фильтр по роли
?page=1                 // Страница
&limit=50               // Записей на странице
```

**Response (200):**
```json
{
  "users": [
    {
      "id": 1,
      "fullName": "Иванов Иван Иванович",
      "upn": "ivanov@utmn.ru",
      "role": "admin",
      "roleDescription": "Администратор",
      "department": "IT отдел",
      "position": "Системный администратор",
      "createdAt": "2026-01-15T10:30:00Z",
      "lastLogin": "2026-01-21T08:15:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 50
}
```

---

### GET `/users/:id`
Получить пользователя по ID

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": 1,
  "fullName": "Иванов Иван Иванович",
  "upn": "ivanov@utmn.ru",
  "role": "admin",
  "roleDescription": "Администратор",
  "department": "IT отдел",
  "position": "Системный администратор",
  "phone": "+7 (345) 123-45-67",
  "email": "ivanov@utmn.ru",
  "createdAt": "2026-01-15T10:30:00Z",
  "lastLogin": "2026-01-21T08:15:00Z"
}
```

---

### POST `/users`
Создать нового пользователя

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "fullName": "Петров Петр Петрович",
  "upn": "petrov@utmn.ru",
  "password": "SecurePass123!",
  "role": "manager",
  "department": "Безопасность",
  "position": "Менеджер",
  "phone": "+7 (345) 123-45-68",
  "email": "petrov@utmn.ru"
}
```

**Response (201):**
```json
{
  "id": 152,
  "fullName": "Петров Петр Петрович",
  "upn": "petrov@utmn.ru",
  "role": "manager",
  "message": "Пользователь успешно создан"
}
```

---

### PUT `/users/:id`
Обновить пользователя

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "fullName": "Петров Петр Петрович",
  "role": "admin",
  "department": "IT отдел",
  "position": "Старший менеджер"
}
```

**Response (200):**
```json
{
  "id": 152,
  "message": "Пользователь успешно обновлен"
}
```

---

### DELETE `/users/:id`
Удалить пользователя

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Пользователь успешно удален"
}
```

---

## 📋 Логи

### GET `/logs`
Получить логи пользователей

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
```
?search=иванов          // Поиск по ФИО/UPN
&action=login           // Фильтр по действию
&level=info             // Фильтр по уровню
&dateFrom=2026-01-01    // Дата от
&dateTo=2026-01-21      // Дата до
&page=1                 // Страница
&limit=50               // Записей на странице
```

**Response (200):**
```json
{
  "logs": [
    {
      "id": 1,
      "timestamp": "2026-01-21T08:15:32Z",
      "userId": 1,
      "userName": "Иванов Иван Иванович",
      "userUPN": "ivanov@utmn.ru",
      "action": "login",
      "actionDescription": "Вход в систему",
      "level": "success",
      "ipAddress": "192.168.1.100",
      "details": "Успешная авторизация"
    }
  ],
  "total": 5432,
  "page": 1,
  "limit": 50
}
```

**Action Types:**
- `login` - Вход в систему
- `logout` - Выход из системы
- `view_report` - Просмотр отчета
- `export_data` - Экспорт данных
- `edit_user` - Редактирование пользователя
- `delete_user` - Удаление пользователя
- `create_user` - Создание пользователя
- `edit_role` - Изменение роли
- `change_settings` - Изменение настроек
- `access_denied` - Отказ в доступе

**Level Types:**
- `info` - Информация
- `success` - Успех
- `warning` - Предупреждение
- `error` - Ошибка

---

## 🚗 Парковки

### GET `/parking`
Получить данные по всем парковкам

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "k1": {
    "name": "Парковка К1",
    "currentCount": 8,
    "totalCapacity": 50,
    "records": [
      {
        "id": 1,
        "entryTime": "2026-01-21T08:15:32Z",
        "fullName": "Иванов Иван Иванович",
        "upn": "ivanov@utmn.ru",
        "carBrand": "Toyota Camry",
        "licensePlate": "А123АА72"
      }
    ]
  },
  "k5": {
    "name": "Парковка К5",
    "currentCount": 6,
    "totalCapacity": 40,
    "records": [...]
  }
}
```

---

### GET `/parking/:parkingId`
Получить данные по конкретной парковке

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "name": "Парковка К1",
  "currentCount": 8,
  "totalCapacity": 50,
  "records": [
    {
      "id": 1,
      "entryTime": "2026-01-21T08:15:32Z",
      "fullName": "Иванов Иван Иванович",
      "upn": "ivanov@utmn.ru",
      "carBrand": "Toyota Camry",
      "licensePlate": "А123АА72",
      "exitTime": null
    }
  ]
}
```

---

### GET `/parking/:parkingId/history`
История парковки (въезды/выезды)

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
```
?dateFrom=2026-01-01
&dateTo=2026-01-21
&search=А123АА72
```

**Response (200):**
```json
{
  "history": [
    {
      "id": 1,
      "entryTime": "2026-01-21T08:15:32Z",
      "exitTime": "2026-01-21T17:30:15Z",
      "duration": "9h 14m",
      "fullName": "Иванов Иван Иванович",
      "upn": "ivanov@utmn.ru",
      "carBrand": "Toyota Camry",
      "licensePlate": "А123АА72"
    }
  ],
  "total": 1250
}
```

---

## 👨‍🎓 Студенты

### GET `/students`
Получить список студентов

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
```
?search=иванов
&course=2
&faculty=IT
&page=1
&limit=50
```

**Response (200):**
```json
{
  "students": [
    {
      "id": 1,
      "fullName": "Студентов Студент Студентович",
      "upn": "studentov@student.utmn.ru",
      "studentId": "20240101",
      "course": 2,
      "faculty": "Институт математики и компьютерных наук",
      "group": "ПМИ-22-1",
      "email": "studentov@student.utmn.ru",
      "phone": "+7 (345) 123-45-69"
    }
  ],
  "total": 5000,
  "page": 1,
  "limit": 50
}
```

---

## 👔 Сотрудники

### GET `/staff`
Получить список сотрудников

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
```
?search=иванов
&department=IT отдел
&page=1
&limit=50
```

**Response (200):**
```json
{
  "staff": [
    {
      "id": 1,
      "fullName": "Иванов Иван Иванович",
      "upn": "ivanov@utmn.ru",
      "employeeId": "E-001",
      "department": "IT отдел",
      "position": "Системный администратор",
      "email": "ivanov@utmn.ru",
      "phone": "+7 (345) 123-45-67",
      "hireDate": "2020-09-01"
    }
  ],
  "total": 800,
  "page": 1,
  "limit": 50
}
```

---

## 📊 Дашборды

### GET `/dashboards`
Получить список сохраненных дашбордов

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "dashboards": [
    {
      "id": 1,
      "name": "Главный дашборд",
      "description": "Обзор всех систем",
      "createdBy": "admin@utmn.ru",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-21T09:30:00Z",
      "widgets": [...]
    }
  ]
}
```

---

### GET `/dashboards/:id`
Получить конкретный дашборд

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Главный дашборд",
  "description": "Обзор всех систем",
  "widgets": [
    {
      "id": "widget-1",
      "type": "metric",
      "title": "Всего пользователей",
      "dataSource": {
        "type": "mysql",
        "query": "SELECT COUNT(*) FROM users"
      },
      "position": { "x": 0, "y": 0, "w": 3, "h": 2 }
    }
  ]
}
```

---

### POST `/dashboards`
Создать новый дашборд

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "name": "Новый дашборд",
  "description": "Описание",
  "widgets": [...]
}
```

---

### PUT `/dashboards/:id`
Обновить дашборд

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "name": "Обновленное название",
  "widgets": [...]
}
```

---

### DELETE `/dashboards/:id`
Удалить дашборд

**Headers:**
```
Authorization: Bearer {token}
```

---

## 📈 Статистика

### GET `/stats/overview`
Общая статистика системы

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "users": {
    "total": 150,
    "active": 120,
    "online": 15
  },
  "students": {
    "total": 5000,
    "active": 4500
  },
  "staff": {
    "total": 800,
    "active": 750
  },
  "parking": {
    "totalSpots": 90,
    "occupied": 14,
    "free": 76,
    "occupancyRate": 15.6
  }
}
```

---

## ⚙️ Системные

### GET `/health`
Проверка здоровья API

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-01-21T12:00:00Z",
  "version": "1.0",
  "database": "connected",
  "mqtt": "connected"
}
```

---

### GET `/version`
Версия API

**Response (200):**
```json
{
  "version": "1.0.0",
  "buildDate": "2026-01-21",
  "environment": "production"
}
```

---

## 🔒 Коды ошибок

- `200` - OK
- `201` - Created
- `400` - Bad Request (неверные данные)
- `401` - Unauthorized (нет токена или токен истек)
- `403` - Forbidden (нет прав доступа)
- `404` - Not Found (ресурс не найден)
- `409` - Conflict (конфликт данных, например UPN уже существует)
- `500` - Internal Server Error

**Формат ошибки:**
```json
{
  "error": "Описание ошибки",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

---

## 📝 Примеры использования

### JavaScript/TypeScript (Axios)
```typescript
import axios from 'axios';

const API_URL = 'http://your-server.ru/api';
const token = localStorage.getItem('authToken');

// Получить пользователей
const getUsers = async () => {
  const response = await axios.get(`${API_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Создать пользователя
const createUser = async (userData) => {
  const response = await axios.post(`${API_URL}/users`, userData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
```

---

**Версия:** 1.0  
**Дата:** 21 января 2026  
**Всего endpoints:** 30+
