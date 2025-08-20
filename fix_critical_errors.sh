#!/bin/bash

echo "Fixing critical build errors..."

# Fix missing imports in main page
sed -i '' '5s/import { Calendar } from '\''lucide-react'\'';/import { Calendar, Clock, CheckCircle, Circle, Trophy, Medal, Zap } from '\''lucide-react'\'';/' src/app/page.tsx

# Fix unescaped quotes by replacing with &apos;
sed -i '' "s/4th Edition Patron's Cup/4th Edition Patron\&apos;s Cup/g" src/app/admin/dashboard/page.tsx
sed -i '' "s/won't/won\&apos;t/g" src/app/live/page.tsx
sed -i '' "s/can't/can\&apos;t/g" src/app/page.tsx
sed -i '' "s/4th Edition Patron's Cup/4th Edition Patron\&apos;s Cup/g" src/app/page.tsx

# Fix any types in admin scoring
sed -i '' 's/getMatchPlayers = (match: Match, teamId: number | null, count: number = 2)/getMatchPlayers = (match: Match, teamId: number | null, count: number = 2)/g' src/app/admin/scoring/page.tsx

# Remove unused err variable
sed -i '' 's/) catch (err) {/) catch {/g' src/app/admin/login/page.tsx

# Comment out unused variables to avoid errors
sed -i '' 's/const teamAScore = /\/\/ const teamAScore = /g' src/app/admin/match/[id]/page.tsx
sed -i '' 's/const teamBScore = /\/\/ const teamBScore = /g' src/app/admin/match/[id]/page.tsx
sed -i '' 's/const teamAScore = /\/\/ const teamAScore = /g' src/app/match/[id]/page.tsx  
sed -i '' 's/const teamBScore = /\/\/ const teamBScore = /g' src/app/match/[id]/page.tsx

# Remove unused imports
sed -i '' 's/import { useParams, useRouter }/import { useParams }/g' src/app/match/[id]/page.tsx

echo "Critical errors fixed!"
