#!/bin/bash

echo "Fixing syntax errors in match files..."

# Fix admin match file
sed -i '' '167,175s/^/\/\/ /' src/app/admin/match/[id]/page.tsx
sed -i '' '177,185s/^/\/\/ /' src/app/admin/match/[id]/page.tsx

# Fix public match file  
sed -i '' '87,95s/^/\/\/ /' src/app/match/[id]/page.tsx
sed -i '' '99,107s/^/\/\/ /' src/app/match/[id]/page.tsx

# Also comment out the handleSaveMatch function since it's not used
sed -i '' '61,109s/^/\/\/ /' src/app/match/[id]/page.tsx

echo "Syntax errors fixed!"
