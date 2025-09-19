// Direct migration application script
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase environment variables');
  console.log('Please ensure your .env.local file contains:');
  console.log('  - NEXT_PUBLIC_SUPABASE_URL');
  console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🚀 Applying multi-tournament migration...\n');

  try {
    // 1. Create tournaments table
    console.log('1️⃣ Creating tournaments table...');
    const { error: tournamentsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS tournaments (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          slug VARCHAR(50) UNIQUE NOT NULL,
          description TEXT,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'archived')),
          format VARCHAR(50) DEFAULT 'patrons_cup' CHECK (format IN ('patrons_cup', 'stableford', 'stroke_play', 'custom')),
          divisions JSONB DEFAULT '["Trophy", "Shield", "Plaque", "Bowl", "Mug"]',
          point_system JSONB DEFAULT '{
            "friAM4BBB": {"win": 5, "tie": 2.5},
            "friPMFoursomes": {"trophy": {"win": 3, "tie": 1.5}, "bowl": {"win": 4, "tie": 2}},
            "satAM4BBB": {"win": 5, "tie": 2.5},
            "satPMFoursomes": {"trophy": {"win": 3, "tie": 1.5}, "bowl": {"win": 4, "tie": 2}},
            "sunSingles": {"win": 3, "tie": 1.5}
          }',
          settings JSONB DEFAULT '{
            "course": "Muthaiga Golf Club",
            "maxPlayersPerTeam": 12,
            "allowThreeWayMatches": true,
            "enableProMatches": true
          }',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (tournamentsError) {
      console.log('   ⚠️  RPC method not available, trying direct SQL...');
      // Try direct SQL execution
      const { error: directError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'tournaments');
      
      if (directError) {
        console.log('   ❌ Cannot create tournaments table directly');
        console.log('   📝 Please apply the migration manually in Supabase dashboard');
        console.log('   📄 Use the contents of apply-migration-now.sql');
        return;
      }
    } else {
      console.log('   ✅ Tournaments table created successfully');
    }

    // 2. Insert Patrons Cup 2025 tournament
    console.log('\n2️⃣ Inserting Patrons Cup 2025 tournament...');
    const { data: existingTournament, error: checkError } = await supabase
      .from('tournaments')
      .select('id')
      .eq('slug', 'patrons-cup-2025')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.log('   ⚠️  Tournaments table not accessible yet');
      console.log('   📝 Please apply the migration manually in Supabase dashboard');
      return;
    }

    if (!existingTournament) {
      const { error: insertError } = await supabase
        .from('tournaments')
        .insert({
          name: 'Patrons Cup 2025',
          slug: 'patrons-cup-2025',
          description: 'Annual Patrons Cup Tournament at Muthaiga Golf Club',
          start_date: '2025-08-22',
          end_date: '2025-08-24',
          status: 'active',
          format: 'patrons_cup'
        });

      if (insertError) {
        console.log('   ❌ Error inserting tournament:', insertError.message);
      } else {
        console.log('   ✅ Patrons Cup 2025 tournament created');
      }
    } else {
      console.log('   ✅ Patrons Cup 2025 tournament already exists');
    }

    // 3. Add tournament_id columns
    console.log('\n3️⃣ Adding tournament_id columns...');
    const tables = ['teams', 'players', 'matches', 'scores'];
    
    for (const table of tables) {
      const { error: columnError } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS tournament_id INTEGER;`
      });

      if (columnError) {
        console.log(`   ⚠️  Cannot add tournament_id to ${table} directly`);
      } else {
        console.log(`   ✅ Added tournament_id column to ${table}`);
      }
    }

    // 4. Set default tournament_id for existing data
    console.log('\n4️⃣ Setting default tournament_id for existing data...');
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('id')
      .eq('slug', 'patrons-cup-2025')
      .single();

    if (tournament) {
      for (const table of tables) {
        const { error: updateError } = await supabase.rpc('exec_sql', {
          sql: `UPDATE ${table} SET tournament_id = ${tournament.id} WHERE tournament_id IS NULL;`
        });

        if (updateError) {
          console.log(`   ⚠️  Cannot update ${table} tournament_id directly`);
        } else {
          console.log(`   ✅ Updated ${table} with tournament_id`);
        }
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log('📝 If some steps failed, please apply the migration manually:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Copy/paste contents of apply-migration-now.sql');
    console.log('   3. Click "Run" to execute');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n📝 Please apply the migration manually:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Copy/paste contents of apply-migration-now.sql');
    console.log('   3. Click "Run" to execute');
  }
}

applyMigration();
