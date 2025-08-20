#!/bin/bash

echo "Fixing TypeScript specific errors..."

# Fix any types in admin scoring page
sed -i '' 's/match: any/match: Match/g' src/app/admin/scoring/page.tsx
sed -i '' 's/teamId: number | null, count: number = 2/teamId: number | null, count: number = 2/g' src/app/admin/scoring/page.tsx

# Fix any types in schedule page
sed -i '' 's/match: any/match: Match/g' src/app/schedule/page.tsx

# Fix any types in main page
sed -i '' 's/match: any/match: Match/g' src/app/page.tsx
sed -i '' 's/hole: any/hole: Hole/g' src/app/page.tsx

# Fix any types in tournament context
sed -i '' 's/match: any/match: Match/g' src/context/TournamentContext.tsx

# Remove unused variables by commenting them out or removing assignments
sed -i '' 's/const activeMatches = \[\];/\/\/ const activeMatches = \[\];/g' src/app/live/page.tsx
sed -i '' 's/const scheduledMatches = /\/\/ const scheduledMatches = /g' src/app/live/page.tsx
sed -i '' 's/const completedMatches = /\/\/ const completedMatches = /g' src/app/live/page.tsx

# Remove unused router variable
sed -i '' 's/const router = useRouter();/\/\/ const router = useRouter();/g' src/app/match/[id]/page.tsx

# Remove unused Save import
sed -i '' '/import.*Save.*from/s/Save, //g' src/app/admin/match/[id]/page.tsx

echo "TypeScript errors fixed!"
