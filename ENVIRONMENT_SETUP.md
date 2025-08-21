# Environment Variables Setup Guide

## Required Environment Variables

This application requires the following environment variables to connect to Supabase:

### 1. NEXT_PUBLIC_SUPABASE_URL
- **Description**: Your Supabase project URL
- **Where to find**: Supabase Dashboard → Project Settings → API → Project URL
- **Example**: `https://your-project-id.supabase.co`

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Description**: Your Supabase anonymous/public key
- **Where to find**: Supabase Dashboard → Project Settings → API → Project API keys → anon/public
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. SUPABASE_SERVICE_ROLE_KEY
- **Description**: Your Supabase service role key (for admin operations)
- **Where to find**: Supabase Dashboard → Project Settings → API → Project API keys → service_role
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **⚠️ IMPORTANT**: Keep this secret! Never commit it to Git.

## Local Development Setup

1. Create a `.env.local` file in your project root:
```bash
cp .env.example .env.local  # If .env.example exists
# OR create .env.local manually
```

2. Add your environment variables to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

3. Restart your development server:
```bash
npm run dev
```

## Deployment Setup

### For Netlify:
1. Go to your Netlify site dashboard
2. Navigate to Site settings → Environment variables
3. Add the three environment variables listed above
4. Redeploy your site

### For Vercel:
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the three environment variables listed above
4. Redeploy your project

### For other platforms:
Add the environment variables through your hosting platform's dashboard or deployment configuration.

## Database Setup

Make sure you have:
1. ✅ Created your Supabase project
2. ✅ Imported the database schema using `complete-supabase-schema.sql`
3. ✅ Enabled Row Level Security policies
4. ✅ Added your tournament data (teams, players, matches)

## Testing the Setup

After setting up the environment variables, you should be able to:
- ✅ View the tournament schedule
- ✅ See live scoring updates
- ✅ Access admin panel with proper credentials
- ✅ Edit matches, teams, and players
- ✅ Real-time updates across multiple browsers

## Troubleshooting

**Error: "supabaseUrl is required"**
- Check that `NEXT_PUBLIC_SUPABASE_URL` is set correctly
- Ensure there are no typos in the environment variable name

**Error: "Admin client not available"**
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Ensure you're using the service_role key, not the anon key

**Data not loading**
- Verify your Supabase project is active
- Check that the database schema has been imported
- Ensure RLS policies are properly configured
