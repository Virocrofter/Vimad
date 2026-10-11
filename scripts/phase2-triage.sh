#!/bin/bash
cd "$(dirname "$0")/.." || exit 1
WEB="apps/web/src"

echo "### 1. Files importing mocks"
grep -rl --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" \
  -E "useMockQuery|mockData|MOCK_" "$WEB/app" 2>/dev/null | sort | while read -r f; do
  hits=$(grep -c -E "useMockQuery|mockData|MOCK_" "$f")
  echo "$hits  $f"
done | sort -rn
echo ""

echo "### 2. Mock source files (delete candidates)"
find "$WEB" -type f \( -name "data.js" -o -name "data.ts" -o -name "*mock*" -o -name "useMockQuery*" \) \
  -not -path "*/node_modules/*" | sort
echo ""

echo "### 3. Pages with NO matching API route"
for page in $(find "$WEB/app" -name "page.tsx" -o -name "page.jsx" | sort); do
  route=$(echo "$page" | sed "s|$WEB/app||; s|/page\..*||")
  api_route=$(echo "$route" | sed 's|/([^)]*)||g')
  if [ -n "$api_route" ] && [ "$api_route" != "/" ]; then
    if ! find apps/api/src -type d -path "*${api_route##*/}*" 2>/dev/null | grep -q . \
       && ! grep -rq "${api_route##*/}" apps/api/src/routes 2>/dev/null; then
      echo "NO-API  $route"
    fi
  fi
done
echo ""

echo "### 4. Summary"
total_pages=$(find "$WEB/app" -name "page.tsx" -o -name "page.jsx" | wc -l | tr -d ' ')
mock_pages=$(grep -rl -E "useMockQuery|mockData|MOCK_" "$WEB/app" 2>/dev/null | grep -E "page\.(tsx|jsx)$" | wc -l | tr -d ' ')
echo "Total pages:        $total_pages"
echo "Pages using mocks:  $mock_pages"
