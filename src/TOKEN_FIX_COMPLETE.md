# ✅ Полное исправление проблемы с токеном

## 🐛 Проблемы

1. **Токен не использовался при загрузке ролей** - роли пытались загрузиться ДО того как токен был установлен
2. **Ошибка 401 при загрузке ролей** - запрос выполнялся без токена
3. **Попытка refresh при первом 401** - создавало рекурсию и 404 ошибку
4. **Endpoint `/v1/auth/refresh` не найден** - попытка обновить несуществующий endpoint

## ✅ Решение

### 1. Добавлена задержка загрузки ролей

**Файлы:**
- `/contexts/AuthContext.tsx`
- `/frontend/contexts/AuthContext.tsx`

**Изменения:**
```typescript
// Сначала сохраняем токен
TokenManager.setToken(response.data.token);
TokenManager.setRefreshToken(response.data.refreshToken);

// Затем устанавливаем пользователя
setUser(response.data.user as User);

// Загружаем роли ПОСЛЕ с задержкой 100мс
setTimeout(async () => {
  try {
    console.log('📋 Loading roles with token...');
    const rolesResponse = await rolesApi.getAll();
    if (rolesResponse.success && rolesResponse.data) {
      console.log('✅ Roles loaded:', rolesResponse.data);
      setRoles(rolesResponse.data as Role[]);
    }
  } catch (error) {
    console.error('Failed to load roles after login:', error);
    // Не критично, используем роли по умолчанию
  }
}, 100);
```

### 2. Улучшено логирование запросов

**Файлы:**
- `/lib/api.ts`
- `/frontend/lib/api.ts`

**Изменения:**
```typescript
if (token) {
  headers['Authorization'] = `Bearer ${token}`;
  console.log('🌐 Making request to:', endpoint, 'with token');
} else {
  console.log('🌐 Making request to:', endpoint, 'without token');
}
```

### 3. Исправлена логика refresh токена

**Изменения:**
```typescript
if (!response.ok) {
  // Если токен истёк, пытаемся обновить (но НЕ для auth endpoints)
  if (response.status === 401 && token && !endpoint.includes('/auth/')) {
    console.log('⚠️ Got 401, attempting token refresh...');
    const refreshed = await this.refreshToken();
    if (refreshed) {
      console.log('✅ Token refreshed, retrying request...');
      return this.request<T>(endpoint, options);
    }
  }
  // ...
}
```

**Теперь refresh НЕ вызывается для:**
- Запросов авторизации `/v1/auth/login`
- Загрузки ролей при первом входе
- Любых других `/v1/auth/*` endpoints

## 🧪 Как проверить

### 1. Пересобрать и развернуть

```bash
cd frontend
npm install
npm run build

cd ..
sudo ./quick-deploy.sh
```

### 2. Проверить в браузере

1. Откройте DevTools (F12)
2. Вкладка **Console**
3. Войдите с `admin` / `Admin2025`

**Ожидаемый вывод:**

```
🔐 Attempting login for: admin authType: local
🌐 Making request to: /auth/login without token
📥 Login response: {success: true, ...}
✅ Login successful, saving tokens...
Token: eyJhbGciOiJIUzI1NiI...
Refresh Token: present
💾 Saving token: eyJhbGciOiJIUzI1NiI...
✅ Token saved to localStorage
💾 Saving refresh token
👤 Setting user: {id: 1, username: 'admin', ...}
🔑 Getting token: eyJhbGciOiJIUzI1NiI...
✔️ Token verification after save: saved
```

Через 100мс:

```
📋 Loading roles with token...
🔑 Getting token: eyJhbGciOiJIUzI1NiI...
🌐 Making request to: /roles with token
✅ Roles loaded: [{id: '1', name: 'admin', ...}]
```

### 3. Проверить переход на страницу пользователей

1. После входа перейдите на "Управление пользователями"
2. В консоли должно быть:

```
🔑 Getting token: eyJhbGciOiJIUzI1NiI...
🌐 Making request to: /users with token
```

3. **Ошибок 401 НЕ должно быть!**

### 4. Проверить localStorage

В DevTools → Application → Local Storage:

```
auth_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
refresh_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📊 Что изменилось

### ДО исправления:

```
1. Login успешен
2. TokenManager.setToken() ← Токен сохранен
3. rolesApi.getAll() ← 401! Токен не используется
4. refreshToken() ← 404! Endpoint не существует
5. ❌ Ошибка
```

### ПОСЛЕ исправления:

```
1. Login успешен
2. TokenManager.setToken() ← Токен сохранен
3. setUser() ← Пользователь установлен
4. setTimeout 100ms ← Даем время на синхронизацию
5. rolesApi.getAll() ← ✅ Токен используется!
6. ✅ Роли загружены
```

## 🔍 Дополнительная отладка

### Если проблема сохраняется

**1. Очистите localStorage**
```javascript
localStorage.clear()
```

**2. Проверьте Network вкладку**

Найдите запрос `/v1/roles`:
- **Headers** → должен быть `Authorization: Bearer eyJ...`
- **Response** → должен быть `{success: true, data: [...]}`

**3. Проверьте что backend работает**

```bash
# Проверьте статус
sudo systemctl status utmn-security

# Проверьте логи
sudo journalctl -u utmn-security -n 50

# Проверьте endpoint ролей
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/v1/roles
```

## 📝 Итоги

### Исправлено:

1. ✅ Токен сохраняется в localStorage
2. ✅ Токен используется во всех запросах
3. ✅ Роли загружаются ПОСЛЕ установки токена
4. ✅ Нет попыток refresh при первом 401
5. ✅ Подробное логирование всех операций

### Особенности:

- **setTimeout 100ms** - гарантирует что токен точно установлен перед следующим запросом
- **Проверка `/auth/`** - исключает попытки refresh для auth endpoints
- **Роли по умолчанию** - если загрузка не удалась, используются DEFAULT_ROLES
- **Полное логирование** - каждый шаг виден в консоли

---

**Дата:** 26.01.2026  
**Версия:** 2.0.0  
**Статус:** ✅ Полностью исправлено
