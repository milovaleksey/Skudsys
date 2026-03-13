#!/bin/bash

# ════════════════════════════════════════════════════════════════
#  Копирование всех файлов в frontend/ для monorepo структуры
# ════════════════════════════════════════════════════════════════

set -e  # Остановка при ошибке

echo "🚀 Копирование файлов в frontend/"
echo ""

# Цвета
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверяем что мы в нужной директории
if [ ! -d "frontend" ]; then
  echo "❌ Директория frontend/ не найдена!"
  echo "   Запустите скрипт из: /var/www/utmn-security/debug/"
  exit 1
fi

echo -e "${BLUE}📂 Проверка структуры...${NC}"
echo ""

# Создаём необходимые директории
mkdir -p frontend/components
mkdir -p frontend/hooks
mkdir -p frontend/lib
mkdir -p frontend/styles
mkdir -p frontend/contexts
mkdir -p frontend/public

echo -e "${GREEN}✅ Директории созданы${NC}"
echo ""

# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}1️⃣  Копируем HOOKS${NC}"
echo "─────────────────────────────────────────────────────────────"

if [ -d "hooks" ]; then
  cp -v hooks/*.ts frontend/hooks/ 2>/dev/null || echo "  (нет .ts файлов)"
  echo -e "${GREEN}  ✅ Hooks скопированы${NC}"
else
  echo -e "${YELLOW}  ⚠️  Директория hooks/ не найдена${NC}"
fi

echo ""

# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}2️⃣  Копируем COMPONENTS${NC}"
echo "─────────────────────────────────────────────────────────────"

if [ -d "components" ]; then
  # Копируем только если файлы НЕ существуют в frontend
  rsync -av --ignore-existing components/ frontend/components/
  echo -e "${GREEN}  ✅ Components скопированы${NC}"
else
  echo -e "${YELLOW}  ⚠️  Директория components/ не найдена${NC}"
fi

echo ""

# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}3️⃣  Копируем LIB${NC}"
echo "─────────────────────────────────────────────────────────────"

if [ -d "lib" ]; then
  rsync -av --ignore-existing lib/ frontend/lib/
  echo -e "${GREEN}  ✅ Lib скопирована${NC}"
else
  echo -e "${YELLOW}  ⚠️  Директория lib/ не найдена${NC}"
fi

echo ""

# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}4️⃣  Копируем CONTEXTS${NC}"
echo "─────────────────────────────────────────────────────────────"

if [ -d "contexts" ]; then
  rsync -av --ignore-existing contexts/ frontend/contexts/
  echo -e "${GREEN}  ✅ Contexts скопированы${NC}"
else
  echo -e "${YELLOW}  ⚠️  Директория contexts/ не найдена${NC}"
fi

echo ""

# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}5️⃣  Копируем STYLES${NC}"
echo "─────────────────────────────────────────────────────────────"

if [ -d "styles" ]; then
  rsync -av --ignore-existing styles/ frontend/styles/
  echo -e "${GREEN}  ✅ Styles скопированы${NC}"
else
  echo -e "${YELLOW}  ⚠️  Директория styles/ не найдена${NC}"
fi

echo ""

# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}6️⃣  Копируем PUBLIC${NC}"
echo "─────────────────────────────────────────────────────────────"

if [ -d "public" ]; then
  rsync -av --ignore-existing public/ frontend/public/
  echo -e "${GREEN}  ✅ Public скопированы${NC}"
else
  echo -e "${YELLOW}  ⚠️  Директория public/ не найдена${NC}"
fi

echo ""

# ════════════════════════════════════════════════════════════════
echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ ГОТОВО!${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📊 Структура frontend/:"
echo ""
tree -L 2 frontend/ -I 'node_modules' 2>/dev/null || ls -la frontend/
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "🚀 Следующий шаг:"
echo ""
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "════════════════════════════════════════════════════════════════"
