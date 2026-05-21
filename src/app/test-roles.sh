#!/bin/bash

# Конфигурация
API_URL="http://localhost:3000/api"
USERNAME="admin"
PASSWORD="Admin2025"

echo "======================================================="
echo "   Тестирование управления ролями (CRUD)"
echo "======================================================="

# 1. Авторизация
echo ""
echo "[1/5] Авторизация..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | head -n 1 | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
    echo "❌ Ошибка входа"
    exit 1
fi
echo "✅ Токен получен"

# 2. Создание роли
ROLE_NAME="test_role_$(date +%s)"
echo ""
echo "[2/5] Создание роли '$ROLE_NAME'..."
CREATE_DATA="{\"name\": \"$ROLE_NAME\", \"displayName\": \"Тестовая Роль\", \"description\": \"Автоматический тест\", \"permissions\": [\"dashboard\", \"analytics\"]}"

CREATE_RESPONSE=$(curl -s -X POST "$API_URL/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$CREATE_DATA")

ROLE_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":[^,}]*' | head -n 1 | sed 's/"id"://' | tr -d '"')

if [ -n "$ROLE_ID" ]; then
    echo "✅ Роль создана. ID: $ROLE_ID"
else
    echo "❌ Ошибка создания роли"
    echo "Ответ: $CREATE_RESPONSE"
    exit 1
fi

# 3. Проверка создания (список)
echo ""
echo "[3/5] Проверка наличия роли в списке..."
LIST_RESPONSE=$(curl -s -X GET "$API_URL/roles" \
  -H "Authorization: Bearer $TOKEN")

if echo "$LIST_RESPONSE" | grep -q "$ROLE_NAME"; then
    echo "✅ Роль найдена в общем списке"
else
    echo "❌ Роль не найдена в списке"
    exit 1
fi

# 4. Обновление роли
echo ""
echo "[4/5] Обновление роли..."
UPDATE_DATA="{\"displayName\": \"Обновленная Тестовая Роль\", \"description\": \"Обновлено скриптом\", \"permissions\": [\"dashboard\"]}"

UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL/roles/$ROLE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$UPDATE_DATA")

if echo "$UPDATE_RESPONSE" | grep -q "Обновленная"; then
    echo "✅ Роль успешно обновлена"
else
    echo "❌ Ошибка обновления"
    echo "Ответ: $UPDATE_RESPONSE"
    exit 1
fi

# 5. Удаление роли
echo ""
echo "[5/5] Удаление роли..."
DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/roles/$ROLE_ID" \
  -H "Authorization: Bearer $TOKEN")

if echo "$DELETE_RESPONSE" | grep -q "success\":true"; then
    echo "✅ Роль удалена"
else
    echo "❌ Ошибка удаления"
    echo "Ответ: $DELETE_RESPONSE"
    exit 1
fi

echo ""
echo "======================================================="
echo "   Все тесты CRUD ролей пройдены успешно!"
echo "======================================================="
