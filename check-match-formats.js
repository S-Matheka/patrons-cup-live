const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMatchFormats() {
  console.log('🔍 Checking match formats according to TOCs...\n');
  
  try {
    // Get all matches with team information
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        *,
        team_a:teams!team_a_id(name, division),
        team_b:teams!team_b_id(name, division),
        team_c:teams!team_c_id(name, division)
      `);
    
    if (matchesError) throw matchesError;
    
    console.log(`📊 Found ${matches.length} total matches\n`);
    
    // Group by match type and session
    const matchTypes = {};
    
    matches.forEach(match => {
      const key = `${match.session}_${match.match_type}`;
      if (!matchTypes[key]) {
        matchTypes[key] = {
          total: 0,
          threeWay: 0,
          twoWay: 0,
          divisions: new Set(),
          incorrect: []
        };
      }
      
      matchTypes[key].total++;
      
      if (match.is_three_way && match.team_c_id) {
        matchTypes[key].threeWay++;
      } else {
        matchTypes[key].twoWay++;
      }
      
      if (match.team_a?.division) matchTypes[key].divisions.add(match.team_a.division);
      if (match.team_b?.division) matchTypes[key].divisions.add(match.team_b.division);
      if (match.team_c?.division) matchTypes[key].divisions.add(match.team_c.division);
      
      // Check if format is correct according to TOCs
      const isCorrect = checkMatchFormat(match);
      if (!isCorrect) {
        matchTypes[key].incorrect.push({
          id: match.id,
          gameNumber: match.game_number,
          teamA: match.team_a?.name,
          teamB: match.team_b?.name,
          teamC: match.team_c?.name,
          isThreeWay: match.is_three_way,
          shouldBeThreeWay: shouldBeThreeWay(match)
        });
      }
    });
    
    // Display results
    Object.entries(matchTypes).forEach(([key, data]) => {
      console.log(`🎯 ${key}:`);
      console.log(`   Total: ${data.total}`);
      console.log(`   3-way: ${data.threeWay}`);
      console.log(`   2-way: ${data.twoWay}`);
      console.log(`   Divisions: ${Array.from(data.divisions).join(', ')}`);
      
      if (data.incorrect.length > 0) {
        console.log(`   ❌ Incorrect formats: ${data.incorrect.length}`);
        data.incorrect.forEach(match => {
          console.log(`      Match ${match.gameNumber}: ${match.teamA} vs ${match.teamB}${match.teamC ? ` vs ${match.teamC}` : ''} (${match.isThreeWay ? '3-way' : '2-way'}, should be ${match.shouldBeThreeWay ? '3-way' : '2-way'})`);
        });
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error checking match formats:', error);
  }
}

function shouldBeThreeWay(match) {
  // According to TOCs:
  // - 4BBB: Always 2-way (4 players per team, 2 pairs)
  // - Foursomes: Always 3-way (3 teams playing simultaneously)
  // - Singles: Always 3-way (all teams in division play simultaneously)
  
  if (match.match_type === '4BBB') {
    return false; // 4BBB should always be 2-way
  } else if (match.match_type === 'Foursomes') {
    return true; // Foursomes should always be 3-way
  } else if (match.match_type === 'Singles') {
    return true; // Singles should always be 3-way
  }
  
  return false; // Default to 2-way
}

function checkMatchFormat(match) {
  const shouldBe = shouldBeThreeWay(match);
  return match.is_three_way === shouldBe;
}

checkMatchFormats();
