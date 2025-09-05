const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with real credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeMGCData() {
  console.log('🔍 Analyzing MGC data from Supabase...\n');
  
  try {
    // Find MGC team
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .ilike('name', '%MGC%');
    
    if (teamsError) throw teamsError;
    
    if (!teams || teams.length === 0) {
      console.log('❌ No team found with MGC in the name');
      return;
    }
    
    const mgcTeam = teams[0];
    console.log(`🏌️  Found MGC team: ${mgcTeam.name} (ID: ${mgcTeam.id}, Division: ${mgcTeam.division})\n`);
    
    // Get all completed matches for MGC
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        *,
        holes (
          hole_number,
          par,
          team_a_score,
          team_b_score,
          team_c_score,
          team_a_strokes,
          team_b_strokes,
          team_c_strokes,
          status,
          last_updated
        )
      `)
      .or(`team_a_id.eq.${mgcTeam.id},team_b_id.eq.${mgcTeam.id},team_c_id.eq.${mgcTeam.id}`)
      .eq('status', 'completed');
    
    if (matchesError) throw matchesError;
    
    console.log(`📊 MGC has ${matches.length} completed matches\n`);
    
    // Analyze each match
    const matchAnalysis = matches.map(match => {
      console.log(`\n🎯 Analyzing Match ${match.game_number}: ${match.session} ${match.match_type} (${match.is_three_way ? '3-way' : '2-way'})`);
      
      // Show detailed hole data for debugging
      if (match.holes && match.holes.length > 0) {
        console.log(`   📊 Hole data sample (first 5 holes):`);
        match.holes.slice(0, 5).forEach(hole => {
          console.log(`      Hole ${hole.hole_number}: A=${hole.team_a_score}, B=${hole.team_b_score}, C=${hole.team_c_score}`);
        });
        if (match.holes.length > 5) {
          console.log(`      ... and ${match.holes.length - 5} more holes`);
        }
      } else {
        console.log(`   ⚠️  No holes data found`);
      }
      
      return analyzeMatch(match, mgcTeam.id);
    });
    
    // Calculate total points
    const totalPoints = matchAnalysis.reduce((sum, analysis) => sum + analysis.points, 0);
    const totalWins = matchAnalysis.reduce((sum, analysis) => sum + (analysis.result === 'win' ? 1 : 0), 0);
    const totalLosses = matchAnalysis.reduce((sum, analysis) => sum + (analysis.result === 'loss' ? 1 : 0), 0);
    const totalTies = matchAnalysis.reduce((sum, analysis) => sum + (analysis.result === 'tie' ? 1 : 0), 0);
    
    console.log(`\n📈 MGC Summary:`);
    console.log(`   Total Points: ${totalPoints}`);
    console.log(`   Wins: ${totalWins}`);
    console.log(`   Losses: ${totalLosses}`);
    console.log(`   Ties: ${totalTies}`);
    
  } catch (error) {
    console.error('❌ Error analyzing MGC data:', error);
  }
}

function analyzeMatch(match, mgcTeamId) {
  const isTeamA = match.team_a_id === mgcTeamId;
  const isTeamB = match.team_b_id === mgcTeamId;
  const isTeamC = match.team_c_id === mgcTeamId;
  
  if (!isTeamA && !isTeamB && !isTeamC) {
    return { result: 'unknown', points: 0, reason: 'MGC not in this match' };
  }
  
  // Check if we have hole data
  if (!match.holes || match.holes.length === 0) {
    console.log(`   ⚠️  No holes data - cannot calculate result`);
    return { result: 'unknown', points: 0, reason: 'No holes data' };
  }
  
  // Calculate match result
  if (match.is_three_way && match.team_c_id) {
    return analyzeThreeWayMatch(match, mgcTeamId);
  } else {
    return analyzeTwoWayMatch(match, mgcTeamId);
  }
}

function analyzeTwoWayMatch(match, mgcTeamId) {
  const isTeamA = match.team_a_id === mgcTeamId;
  const isTeamB = match.team_b_id === mgcTeamId;
  
  // Count holes won by each team
  let teamAHolesWon = 0;
  let teamBHolesWon = 0;
  let holesHalved = 0;
  let holesPlayed = 0;
  
  match.holes.forEach(hole => {
    const teamAStrokes = hole.team_a_score;
    const teamBStrokes = hole.team_b_score;
    
    if (teamAStrokes !== undefined && teamAStrokes !== null && 
        teamBStrokes !== undefined && teamBStrokes !== null) {
      holesPlayed++;
      
      if (teamAStrokes < teamBStrokes) {
        teamAHolesWon++;
      } else if (teamBStrokes < teamAStrokes) {
        teamBHolesWon++;
      } else {
        holesHalved++;
      }
    }
  });
  
  console.log(`   📊 Holes: Team A ${teamAHolesWon}, Team B ${teamBHolesWon}, Halved ${holesHalved} (${holesPlayed} played)`);
  
  // Determine winner
  let result, points;
  if (teamAHolesWon > teamBHolesWon) {
    result = isTeamA ? 'win' : 'loss';
    points = isTeamA ? getMatchPoints(match, 'win') : 0;
    console.log(`   🏆 Team A wins (${result === 'win' ? 'MGC wins' : 'MGC loses'})`);
  } else if (teamBHolesWon > teamAHolesWon) {
    result = isTeamB ? 'win' : 'loss';
    points = isTeamB ? getMatchPoints(match, 'win') : 0;
    console.log(`   🏆 Team B wins (${result === 'win' ? 'MGC wins' : 'MGC loses'})`);
  } else {
    result = 'tie';
    points = getMatchPoints(match, 'tie');
    console.log(`   🤝 Match tied`);
  }
  
  console.log(`   💰 Points awarded: ${points}`);
  
  return { result, points, holesPlayed };
}

function analyzeThreeWayMatch(match, mgcTeamId) {
  console.log(`   📊 3-way match - calculating head-to-head results`);
  
  // For 3-way matches, we need to calculate each head-to-head
  let totalPoints = 0;
  let wins = 0;
  let losses = 0;
  let ties = 0;
  
  // MGC vs Team A (if MGC is not Team A)
  if (mgcTeamId !== match.team_a_id) {
    const result = calculateHeadToHead(match, mgcTeamId, match.team_a_id);
    if (result === 'win') { wins++; totalPoints += getMatchPoints(match, 'win'); }
    else if (result === 'loss') losses++;
    else { ties++; totalPoints += getMatchPoints(match, 'tie'); }
  }
  
  // MGC vs Team B (if MGC is not Team B)
  if (mgcTeamId !== match.team_b_id) {
    const result = calculateHeadToHead(match, mgcTeamId, match.team_b_id);
    if (result === 'win') { wins++; totalPoints += getMatchPoints(match, 'win'); }
    else if (result === 'loss') losses++;
    else { ties++; totalPoints += getMatchPoints(match, 'tie'); }
  }
  
  // MGC vs Team C (if MGC is not Team C)
  if (mgcTeamId !== match.team_c_id) {
    const result = calculateHeadToHead(match, mgcTeamId, match.team_c_id);
    if (result === 'win') { wins++; totalPoints += getMatchPoints(match, 'win'); }
    else if (result === 'loss') losses++;
    else { ties++; totalPoints += getMatchPoints(match, 'tie'); }
  }
  
  console.log(`   📊 Head-to-head: ${wins}W-${losses}L-${ties}T`);
  console.log(`   💰 Total points: ${totalPoints}`);
  
  return { result: 'mixed', points: totalPoints, wins, losses, ties };
}

function calculateHeadToHead(match, team1Id, team2Id) {
  let team1Wins = 0;
  let team2Wins = 0;
  
  match.holes.forEach(hole => {
    const score1 = getTeamScore(hole, team1Id, match);
    const score2 = getTeamScore(hole, team2Id, match);
    
    if (score1 !== null && score2 !== null) {
      if (score1 < score2) team1Wins++;
      else if (score2 < score1) team2Wins++;
    }
  });
  
  if (team1Wins > team2Wins) return 'win';
  if (team2Wins > team1Wins) return 'loss';
  return 'tie';
}

function getTeamScore(hole, teamId, match) {
  if (match.team_a_id === teamId) return hole.team_a_score;
  if (match.team_b_id === teamId) return hole.team_b_score;
  if (match.team_c_id === teamId) return hole.team_c_score;
  return null;
}

function getMatchPoints(match, result) {
  if (result === 'loss') return 0;
  
  const { match_type, session, division } = match;
  const type = match_type;
  
  // Determine day from date
  const matchDate = new Date(match.date || match.match_date);
  const day = matchDate.getDay(); // 0=Sunday, 5=Friday, 6=Saturday
  
  // Points based on division type
  const isBowlMug = division === 'Bowl' || division === 'Mug';
  
  // Friday matches
  if (day === 5) {
    if (session === 'AM' && type === '4BBB') {
      return result === 'win' ? 5 : 2.5;
    } 
    if (session === 'PM' && type === 'Foursomes') {
      if (isBowlMug) {
        return result === 'win' ? 4 : 2;
      } else {
        return result === 'win' ? 3 : 1.5;
      }
    }
  }
  
  // Saturday matches
  if (day === 6) {
    if (session === 'AM' && type === '4BBB') {
      return result === 'win' ? 5 : 2.5;
    }
    if (session === 'PM' && type === 'Foursomes') {
      if (isBowlMug) {
        return result === 'win' ? 4 : 2;
      } else {
        return result === 'win' ? 3 : 1.5;
      }
    }
  }
  
  // Sunday matches (Singles)
  if (day === 0 && type === 'Singles') {
    return result === 'win' ? 3 : 1.5;
  }
  
  return result === 'win' ? 1 : 0.5;
}

// Run the analysis
analyzeMGCData();
