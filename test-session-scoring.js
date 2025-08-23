const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Simplified version of the session-based scoring to test
function getSessionPoints(match) {
  const { match_type: type, session, division, match_date: date } = match;
  
  const matchDate = new Date(date);
  const dayOfWeek = matchDate.getDay();
  
  let day;
  if (dayOfWeek === 5) day = 'Friday';
  else if (dayOfWeek === 6) day = 'Saturday';
  else day = 'Sunday';
  
  const isBowlMug = division === 'Bowl' || division === 'Mug';
  
  if (day === 'Friday') {
    if (session === 'AM' && type === '4BBB') {
      return { win: 5, tie: 2.5 };
    } else if (session === 'PM' && type === 'Foursomes') {
      return isBowlMug ? { win: 4, tie: 2 } : { win: 3, tie: 1.5 };
    }
  } else if (day === 'Saturday') {
    if (session === 'AM' && type === '4BBB') {
      return { win: 5, tie: 2.5 };
    } else if (session === 'PM' && type === 'Foursomes') {
      return isBowlMug ? { win: 4, tie: 2 } : { win: 3, tie: 1.5 };
    }
  } else if (day === 'Sunday' && type === 'Singles') {
    return { win: 3, tie: 1.5 };
  }
  
  return { win: 1, tie: 0.5 };
}

async function testSessionScoring() {
  try {
    console.log('🧪 TESTING SESSION-BASED SCORING LOGIC\n');

    // Get MGC matches
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .or('team_a_id.eq.1,team_b_id.eq.1')
      .eq('division', 'Trophy')
      .order('game_number');

    if (error) throw error;

    // Group by session
    const sessions = {};
    matches.forEach(match => {
      const sessionKey = `${match.match_date}-${match.session}-${match.match_type}`;
      if (!sessions[sessionKey]) sessions[sessionKey] = [];
      sessions[sessionKey].push(match);
    });

    console.log('📊 MGC Trophy Division Sessions:');
    
    let totalPoints = 0;
    Object.entries(sessions).forEach(([sessionKey, sessionMatches]) => {
      const sampleMatch = sessionMatches[0];
      const sessionPoints = getSessionPoints(sampleMatch);
      
      const completed = sessionMatches.filter(m => m.status === 'completed').length;
      const inProgress = sessionMatches.filter(m => m.status === 'in-progress').length;
      const total = sessionMatches.length;
      
      console.log(`\n${sessionKey}:`);
      console.log(`  Matches: ${completed} completed, ${inProgress} live, ${total} total`);
      console.log(`  Session Points: ${sessionPoints.win} win, ${sessionPoints.tie} tie`);
      
      // For this test, assume MGC wins completed sessions and is leading live sessions
      if (completed === total) {
        console.log(`  ✅ Session completed - Award: ${sessionPoints.win} points`);
        totalPoints += sessionPoints.win;
      } else if (inProgress > 0) {
        console.log(`  🔄 Session in progress - Potential: ${sessionPoints.win} points`);
        totalPoints += sessionPoints.win; // For live display
      } else {
        console.log(`  ⏳ Session not started - Potential: ${sessionPoints.win} points`);
      }
    });

    console.log(`\n🏆 MGC Total Points (session-based): ${totalPoints}`);
    console.log(`📈 Maximum possible at tournament end: 5+3+5+3+3 = 19 points`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSessionScoring();
