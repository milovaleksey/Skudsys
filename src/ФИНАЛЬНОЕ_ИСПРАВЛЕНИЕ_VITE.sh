#!/bin/bash

# ════════════════════════════════════════════════════════════════
#  ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ VITE - Копирование всех файлов
# ════════════════════════════════════════════════════════════════

set -e  # Остановка при ошибке

echo "🚀 ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ VITE"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Цвета
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Проверяем что мы в нужной директории
if [ ! -d "frontend" ]; then
  echo -e "${RED}❌ Директория frontend/ не найдена!${NC}"
  echo "   Запустите скрипт из: /var/www/utmn-security/debug/"
  exit 1
fi

echo -e "${BLUE}📂 Проверка и создание структуры...${NC}"
echo ""

# Создаём все необходимые директории
mkdir -p frontend/components
mkdir -p frontend/components/ui
mkdir -p frontend/components/figma
mkdir -p frontend/hooks
mkdir -p frontend/lib
mkdir -p frontend/styles
mkdir -p frontend/contexts
mkdir -p frontend/public

echo -e "${GREEN}✅ Директории созданы${NC}"
echo ""

# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}1️⃣  Копируем COMPONENTS${NC}"
echo "────────────────────────────────────────────────────────────"

if [ -d "components" ]; then
  # Копируем все .tsx файлы
  echo "  📦 Копируем основные компоненты..."
  rsync -av --ignore-existing components/*.tsx frontend/components/ 2>/dev/null || true
  
  # Копируем UI компоненты
  if [ -d "components/ui" ]; then
    echo "  📦 Копируем UI компоненты..."
    rsync -av --ignore-existing components/ui/ frontend/components/ui/ 2>/dev/null || true
  fi
  
  # Копируем Figma компоненты
  if [ -d "components/figma" ]; then
    echo "  📦 Копируем Figma компоненты..."
    rsync -av --ignore-existing components/figma/ frontend/components/figma/ 2>/dev/null || true
  fi
  
  echo -e "${GREEN}  ✅ Components скопированы${NC}"
else
  echo -e "${YELLOW}  ⚠️  Директория components/ не найдена${NC}"
fi

echo ""

# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}2️⃣  Копируем HOOKS${NC}"
echo "────────────────────────────────────────────────────────────"

if [ -d "hooks" ]; then
  cp -v hooks/*.ts frontend/hooks/ 2>/dev/null || true
  echo -e "${GREEN}  ✅ Hooks скопированы${NC}"
else
  echo -e "${YELLOW}  ⚠️  Директория hooks/ не найдена${NC}"
fi

echo ""

# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}3️⃣  Копируем LIB${NC}"
echo "────────────────────────────────────────────────────────────"

if [ -d "lib" ]; then
  rsync -av --ignore-existing lib/ frontend/lib/ 2>/dev/null || true
  echo -e "${GREEN}  ✅ Lib скопирована${NC}"
else
  echo -e "${YELLOW}  ⚠️  Директория lib/ не найдена${NC}"
fi

echo ""

# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}4️⃣  Копируем CONTEXTS${NC}"
echo "────────────────────────────────────────────────────────────"

if [ -d "contexts" ]; then
  rsync -av --ignore-existing contexts/ frontend/contexts/ 2>/dev/null || true
  echo -e "${GREEN}  ✅ Contexts скопированы${NC}"
else
  echo -e "${YELLOW}  ⚠️  Директория contexts/ не найдена${NC}"
fi

echo ""

# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}5️⃣  Копируем STYLES${NC}"
echo "────────────────────────────────────────────────────────────"

if [ -d "styles" ]; then
  rsync -av --ignore-existing styles/ frontend/styles/ 2>/dev/null || true
  echo -e "${GREEN}  ✅ Styles скопированы${NC}"
else
  echo -e "${YELLOW}  ⚠️  Директория styles/ не найдена${NC}"
fi

echo ""

# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}6️⃣  Копируем PUBLIC${NC}"
echo "────────────────────────────────────────────────────────────"

if [ -d "public" ]; then
  rsync -av --ignore-existing public/ frontend/public/ 2>/dev/null || true
  echo -e "${GREEN}  ✅ Public файлы скопированы${NC}"
else
  echo -e "${YELLOW}  ⚠️  Директория public/ не найдена${NC}"
fi

echo ""

# ════════════════════════════════════════════════════════════════
echo -e "${BLUE}7️⃣  Проверка критически важных файлов${NC}"
echo "────────────────────────────────────────────────────────────"

CRITICAL_FILES=(
  "frontend/hooks/useMQTT.ts"
  "frontend/hooks/useAnalyticsMQTT.ts"
  "frontend/hooks/useForeignStudentsMQTT.ts"
  "frontend/hooks/useParkingMQTT.ts"
  "frontend/hooks/useStorageMQTT.ts"
  "frontend/components/MainPage.tsx"
  "frontend/components/LoginPage.tsx"
  "frontend/contexts/AuthContext.tsx"
  "frontend/lib/api.ts"
  "frontend/styles/globals.css"
)

MISSING=0

for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "  ${GREEN}✅${NC} $file"
  else
    echo -e "  ${RED}❌${NC} $file ${YELLOW}(отсутствует!)${NC}"
    MISSING=$((MISSING + 1))
  fi
done

echo ""

if [ $MISSING -gt 0 ]; then
  echo -e "${RED}⚠️  Внимание: ${MISSING} критически важных файлов отсутствует!${NC}"
  echo ""
  echo "Скопируйте их вручную или проверьте исходную директорию."
  echo ""
fi

# ════════════════════════════════════════════════════════════════
echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ КОПИРОВАНИЕ ЗАВЕРШЕНО!${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Показываем структуру
echo -e "${BLUE}📊 Структура frontend/:${NC}"
echo ""
tree -L 2 frontend/ -I 'node_modules|dist' 2>/dev/null || {
  echo "frontend/"
  ls -la frontend/ | grep ^d
}

echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}🚀 Следующие шаги:${NC}"
echo ""
echo "  1. Перейдите в frontend:"
echo "     cd frontend"
echo ""
echo "  2. Запустите Vite:"
echo "     npm run dev"
echo ""
echo "  3. Проверьте что ошибок нет:"
echo "     Откройте http://10.101.221.207:5173"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

if [ $MISSING -eq 0 ]; then
  echo -e "${GREEN}✅ Все файлы на месте! Можно запускать Vite.${NC}"
else
  echo -e "${YELLOW}⚠️  Некоторые файлы отсутствуют. Проверьте список выше.${NC}"
fi

echo ""
