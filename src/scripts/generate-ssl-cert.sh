#!/bin/bash

# Генерация самоподписанных SSL сертификатов для разработки
# Для Linux/Mac

echo "🔐 Генерация самоподписанных SSL сертификатов для разработки"
echo ""

# Создать папку для сертификатов
CERT_DIR="./certs"
mkdir -p "$CERT_DIR"

# Параметры сертификата
DOMAIN="localhost"
DAYS=365
COUNTRY="RU"
STATE="Tyumen"
CITY="Tyumen"
ORGANIZATION="TyumGU"
ORGANIZATIONAL_UNIT="Security Department"
EMAIL="security@utmn.ru"

echo "📝 Параметры сертификата:"
echo "  Домен: $DOMAIN"
echo "  Срок действия: $DAYS дней"
echo "  Организация: $ORGANIZATION"
echo ""

# Генерация приватного ключа
echo "🔑 Генерация приватного ключа..."
openssl genrsa -out "$CERT_DIR/server.key" 2048

if [ $? -ne 0 ]; then
    echo "❌ Ошибка генерации ключа"
    exit 1
fi
echo "✅ Приватный ключ создан: $CERT_DIR/server.key"

# Генерация CSR (Certificate Signing Request)
echo ""
echo "📄 Генерация CSR..."
openssl req -new -key "$CERT_DIR/server.key" -out "$CERT_DIR/server.csr" \
    -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORGANIZATION/OU=$ORGANIZATIONAL_UNIT/CN=$DOMAIN/emailAddress=$EMAIL"

if [ $? -ne 0 ]; then
    echo "❌ Ошибка генерации CSR"
    exit 1
fi
echo "✅ CSR создан: $CERT_DIR/server.csr"

# Создание конфигурации для SAN (Subject Alternative Names)
echo ""
echo "⚙️  Создание конфигурации SAN..."
cat > "$CERT_DIR/san.cnf" << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=$COUNTRY
ST=$STATE
L=$CITY
O=$ORGANIZATION
OU=$ORGANIZATIONAL_UNIT
CN=$DOMAIN
emailAddress=$EMAIL

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
DNS.3 = 127.0.0.1
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

echo "✅ Конфигурация создана: $CERT_DIR/san.cnf"

# Генерация самоподписанного сертификата
echo ""
echo "🔐 Генерация самоподписанного сертификата..."
openssl x509 -req -days $DAYS \
    -in "$CERT_DIR/server.csr" \
    -signkey "$CERT_DIR/server.key" \
    -out "$CERT_DIR/server.crt" \
    -extfile "$CERT_DIR/san.cnf" \
    -extensions v3_req

if [ $? -ne 0 ]; then
    echo "❌ Ошибка генерации сертификата"
    exit 1
fi
echo "✅ Сертификат создан: $CERT_DIR/server.crt"

# Генерация PEM файла (комбинация ключа и сертификата)
echo ""
echo "📦 Создание PEM файла..."
cat "$CERT_DIR/server.crt" "$CERT_DIR/server.key" > "$CERT_DIR/server.pem"
echo "✅ PEM файл создан: $CERT_DIR/server.pem"

# Установка правильных прав доступа
chmod 600 "$CERT_DIR/server.key"
chmod 644 "$CERT_DIR/server.crt"
chmod 600 "$CERT_DIR/server.pem"

# Вывод информации о сертификате
echo ""
echo "📋 Информация о сертификате:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
openssl x509 -in "$CERT_DIR/server.crt" -noout -text | grep -A1 "Subject:"
openssl x509 -in "$CERT_DIR/server.crt" -noout -text | grep -A1 "Validity"
openssl x509 -in "$CERT_DIR/server.crt" -noout -text | grep -A3 "Subject Alternative Name"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Создание .gitignore для папки сертификатов
echo ""
echo "🔒 Создание .gitignore..."
cat > "$CERT_DIR/.gitignore" << EOF
# Игнорировать все сертификаты
*.key
*.crt
*.csr
*.pem
*.cnf

# Кроме README
!README.md
EOF
echo "✅ .gitignore создан"

# Создание README
cat > "$CERT_DIR/README.md" << EOF
# SSL Сертификаты для разработки

⚠️ **ТОЛЬКО ДЛЯ РАЗРАБОТКИ! НЕ ИСПОЛЬЗОВАТЬ В PRODUCTION!**

## Файлы

- \`server.key\` - Приватный ключ (НЕ КОММИТИТЬ!)
- \`server.crt\` - Сертификат
- \`server.csr\` - Certificate Signing Request
- \`server.pem\` - Комбинация сертификата и ключа
- \`san.cnf\` - Конфигурация SAN

## Использование

### Backend (Express)
\`\`\`javascript
const fs = require('fs');
const https = require('https');

const options = {
  key: fs.readFileSync('./certs/server.key'),
  cert: fs.readFileSync('./certs/server.crt')
};

https.createServer(options, app).listen(3000);
\`\`\`

### Frontend (Vite)
\`\`\`javascript
// vite.config.js
import fs from 'fs';

export default {
  server: {
    https: {
      key: fs.readFileSync('./certs/server.key'),
      cert: fs.readFileSync('./certs/server.crt')
    }
  }
}
\`\`\`

## Установка в систему (опционально)

### macOS
\`\`\`bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain certs/server.crt
\`\`\`

### Linux (Ubuntu/Debian)
\`\`\`bash
sudo cp certs/server.crt /usr/local/share/ca-certificates/utmn-dev.crt
sudo update-ca-certificates
\`\`\`

### Windows
\`\`\`
certutil -addstore -f "ROOT" certs/server.crt
\`\`\`

## Удаление сертификата

### macOS
\`\`\`bash
sudo security delete-certificate -c "localhost" /Library/Keychains/System.keychain
\`\`\`

### Linux
\`\`\`bash
sudo rm /usr/local/share/ca-certificates/utmn-dev.crt
sudo update-ca-certificates
\`\`\`

### Windows
\`\`\`
certutil -delstore "ROOT" "localhost"
\`\`\`

## Регенерация

Для создания новых сертификатов:
\`\`\`bash
./scripts/generate-ssl-cert.sh
\`\`\`

Срок действия: $DAYS дней
EOF

echo "✅ README создан: $CERT_DIR/README.md"

# Итоговая информация
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Самоподписанные сертификаты успешно созданы!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 Файлы находятся в: $CERT_DIR/"
echo ""
echo "📝 Следующие шаги:"
echo ""
echo "1️⃣  Настройте Backend (backend/src/server.js):"
echo "   См. пример в: $CERT_DIR/README.md"
echo ""
echo "2️⃣  Настройте Frontend (vite.config.js):"
echo "   См. пример в: $CERT_DIR/README.md"
echo ""
echo "3️⃣  (Опционально) Установите сертификат в систему:"
echo "   macOS:   sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $CERT_DIR/server.crt"
echo "   Linux:   sudo cp $CERT_DIR/server.crt /usr/local/share/ca-certificates/utmn-dev.crt && sudo update-ca-certificates"
echo "   Windows: certutil -addstore -f \"ROOT\" $CERT_DIR/server.crt"
echo ""
echo "⚠️  ВАЖНО: Эти сертификаты только для разработки!"
echo "   НЕ используйте их в production!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
