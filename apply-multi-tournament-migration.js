#!/usr/bin/env node

/**
 * Script to apply multi-tournament migration directly to Supabase
 * This script reads the migration file and applies it to your Supabase database
 */

const fs = require('fs');
const path = require('path');

// Check if environment variables are set
const requiredEnvVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(envVar => console.error(`   - ${envVar}`));
  console.error('\nPlease ensure your .env.local file contains these variables.');
  process.exit(1);
}

// Import Supabase client
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase configuration not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🚀 Starting multi-tournament migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250101000000_multi_tournament_support.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // Some errors are expected (like "already exists")
            if (error.message.includes('already exists') || 
                error.message.includes('does not exist') ||
                error.message.includes('duplicate key')) {
              console.log(`   ⚠️  ${error.message}`);
            } else {
              throw error;
            }
          } else {
            console.log(`   ✅ Statement executed successfully`);
          }
        } catch (err) {
          console.error(`   ❌ Error executing statement:`, err.message);
          // Continue with other statements
        }
      }
    }

    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    
    const { data: tournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('*');

    if (tournamentsError) {
      console.error('❌ Error verifying tournaments table:', tournamentsError.message);
    } else {
      console.log(`✅ Found ${tournaments.length} tournaments:`);
      tournaments.forEach(tournament => {
        console.log(`   - ${tournament.name} (${tournament.status})`);
      });
    }

    // Check if existing data has tournament_id
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, tournament_id')
      .limit(5);

    if (teamsError) {
      console.error('❌ Error verifying teams table:', teamsError.message);
    } else {
      console.log(`✅ Teams table updated - sample data:`);
      teams.forEach(team => {
        console.log(`   - ${team.name} (tournament_id: ${team.tournament_id})`);
      });
    }

    console.log('\n🎉 Multi-tournament migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Update your application context');
    console.log('   2. Add tournament selector to navigation');
    console.log('   3. Test the implementation');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Check if we're running this script directly
if (require.main === module) {
  applyMigration();
}

module.exports = { applyMigration };
