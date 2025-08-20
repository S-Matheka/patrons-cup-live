#!/bin/bash

echo "Fixing TypeScript and ESLint errors..."

# Fix unescaped quotes - replace ' with &apos;
find src -name "*.tsx" -exec sed -i '' "s/don't/don&apos;t/g" {} \;
find src -name "*.tsx" -exec sed -i '' "s/can't/can&apos;t/g" {} \;
find src -name "*.tsx" -exec sed -i '' "s/won't/won&apos;t/g" {} \;
find src -name "*.tsx" -exec sed -i '' "s/isn't/isn&apos;t/g" {} \;

# Fix specific files with issues
# Remove unused imports and variables
sed -i '' '/import.*Zap.*from/s/Zap, //g' src/app/live/page.tsx
sed -i '' '/import.*Users.*from/s/Users, //g' src/app/page.tsx
sed -i '' '/import.*BarChart3.*from/s/BarChart3, //g' src/app/page.tsx
sed -i '' '/import.*ExternalLink.*from/s/ExternalLink, //g' src/app/page.tsx
sed -i '' '/import.*Link.*from/d' src/app/page.tsx
sed -i '' '/import.*Users.*from/s/Users, //g' src/app/schedule/page.tsx
sed -i '' '/import.*TrendingDown.*from/s/TrendingDown, //g' src/app/standings/page.tsx
sed -i '' '/import.*Minus.*from/s/Minus, //g' src/app/standings/page.tsx
sed -i '' '/import.*BarChart3.*from/s/BarChart3, //g' src/app/stats/page.tsx
sed -i '' '/import.*TeamCard.*from/d' src/app/teams/page.tsx
sed -i '' '/import.*Trophy.*from/s/Trophy, //g' src/components/Leaderboard.tsx
sed -i '' '/import.*Medal.*from/s/Medal, //g' src/components/Leaderboard.tsx
sed -i '' '/import.*Clock.*from/s/Clock, //g' src/components/Leaderboard.tsx

echo "Build errors fixed!"
