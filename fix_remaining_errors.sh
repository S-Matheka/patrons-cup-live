#!/bin/bash

echo "Fixing remaining critical errors..."

# Fix unescaped quotes by replacing with HTML entities
sed -i '' 's/don'\''t/don\&apos;t/g' src/app/admin/dashboard/page.tsx
sed -i '' 's/won'\''t/won\&apos;t/g' src/app/live/page.tsx  
sed -i '' 's/can'\''t/can\&apos;t/g' src/app/page.tsx

# Remove unused imports more specifically
sed -i '' 's/import { useState } from '\''react'\'';/\/\/ import { useState } from '\''react'\'';/g' src/app/page.tsx

# Comment out unused variable assignments
sed -i '' 's/const \[showAll, setShowAll\]/\/\/ const \[showAll, setShowAll\]/g' src/components/Leaderboard.tsx
sed -i '' 's/const getTrendIcon = /\/\/ const getTrendIcon = /g' src/components/Leaderboard.tsx
sed -i '' 's/const formatStrokeDifferential = /\/\/ const formatStrokeDifferential = /g' src/components/Leaderboard.tsx

# Fix unused scores variable in admin dashboard
sed -i '' 's/const { teams, matches, scores }/const { teams, matches }/g' src/app/admin/dashboard/page.tsx

echo "Remaining errors fixed!"
