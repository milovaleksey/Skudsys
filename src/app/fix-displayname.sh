#!/bin/bash

# Скрипт для добавления поля displayname из ADFS в name
# Запуск: bash fix-displayname.sh

echo "🔧 Добавление поля displayname..."

OIDC_FILE="/opt/utmn-security/src/app/backend/src/services/oidc.service.js"

if [ ! -f "$OIDC_FILE" ]; then
  echo "❌ Файл не найден: $OIDC_FILE"
  exit 1
fi

# Backup
echo "📦 Создание бэкапа..."
cp "$OIDC_FILE" "${OIDC_FILE}.backup"

# Находим строку с name: decoded.name и добавляем displayname
echo "✏️  Исправление извлечения имени пользователя..."

# Ищем строку где формируется name
sed -i "s|name: decoded\.name || decoded\.given_name|name: decoded.displayname || decoded.name || decoded.given_name|g" "$OIDC_FILE"

# Если не нашли, пробуем другой вариант
sed -i "s|name: decoded\.name|name: decoded.displayname || decoded.name|g" "$OIDC_FILE"
sed -i "s|name: decoded\.given_name|name: decoded.displayname || decoded.given_name|g" "$OIDC_FILE"

echo ""
echo "✅ Изменения применены!"
echo ""
echo "Проверьте строку в файле:"
grep -n "name: decoded" "$OIDC_FILE"
echo ""
echo "Теперь перезапустите backend:"
echo "  pm2 restart all"
echo "  pm2 logs utmn-backend --lines 50"
