#!/bin/bash

# Script to remove version numbers from imports
# This fixes TypeScript errors caused by versioned imports

echo "🔧 Fixing versioned imports..."

# Find all .tsx and .ts files and remove version numbers from imports
find components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/@[0-9]\+\.[0-9]\+\.[0-9]\+//g' {} \;

echo "✅ Fixed all versioned imports in components/"

# Also fix contexts
if [ -d "contexts" ]; then
  find contexts -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/@[0-9]\+\.[0-9]\+\.[0-9]\+//g' {} \;
  echo "✅ Fixed all versioned imports in contexts/"
fi

echo ""
echo "✨ All done! Run 'npm run dev' to test."
