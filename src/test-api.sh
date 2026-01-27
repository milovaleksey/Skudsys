#!/bin/bash

# Конфигурация
API_URL="http://localhost:3000/api"
USERNAME="admin"
PASSWORD="Admin2025"

echo "======================================================="
echo "   Тестирование API Backend (ТюмГУ Security)"
echo "======================================================="

# 1. Проверка доступности сервера
echo ""
echo "[1/4] Проверка доступности API..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" || echo "000")

if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "404" ]; then
    echo "✅ Сервер доступен (Код ответа: $HTTP_CODE)"
else
    echo "❌ Сервер недоступен или вернул ошибку. Код: $HTTP_CODE"
    echo "👉 Убедитесь, что backend запущен (npm start в папке backend)"
    exit 1
fi

# 2. Авторизация
echo ""
echo "[2/4] Попытка входа (Login)..."
echo "Пользователь: $USERNAME"

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}")

# Проверяем, есть ли access_token в ответе
if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo "✅ Вход выполнен успешно!"
    
    # Извлекаем токен (используем grep/sed для совместимости, если нет jq)
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')
    echo "🔑 Токен получен (длина: ${#TOKEN} символов)"
else
    echo "❌ Ошибка входа"
    echo "Ответ сервера: $LOGIN_RESPONSE"
    exit 1
fi

# 3. Проверка профиля (Auth Me)
echo ""
echo "[3/4] Проверка токена (/auth/me)..."
ME_RESPONSE=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ME_RESPONSE" | grep -q "id"; then
    echo "✅ Токен валиден. Данные профиля получены."
    # echo "Данные: $ME_RESPONSE"
else
    echo "❌ Ошибка проверки токена"
    echo "Ответ: $ME_RESPONSE"
    exit 1
fi

# 4. Запрос данных из БД (Roles)
echo ""
echo "[4/4] Запрос списка ролей (/roles)..."
ROLES_RESPONSE=$(curl -s -X GET "$API_URL/roles" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ROLES_RESPONSE" | grep -q "success"; then
    echo "✅ Список ролей получен успешно"
    # Попробуем подсчитать количество, если формат JSON позволяет простой grep
    COUNT=$(echo "$ROLES_RESPONSE" | grep -o "id" | wc -l)
    echo "📊 Найдено записей: $COUNT"
else
    echo "❌ Ошибка получения данных"
    echo "Ответ: $ROLES_RESPONSE"
fi

echo ""
echo "======================================================="
echo "   Тестирование завершено"
echo "======================================================="
