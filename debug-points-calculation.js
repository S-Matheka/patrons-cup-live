const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function getMatchPoints(match) {
  const { match_type, session, division } = match;
  
  // Determine day from date
  const dateValue = match.match_date;
  if (!dateValue) {
    return { win: 1, tie: 0.5 }; // fallback
  }
  
  const matchDate = new Date(dateValue);
  const dayOfWeek = matchDate.getDay(); // 0=Sunday, 5=Friday, 6=Saturday
  
  let day;
  if (dayOfWeek === 5) day = 'Friday';
  else if (dayOfWeek === 6) day = 'Saturday';
  else day = 'Sunday';
  
  // Points based on division type
  const isBowlMug = division === 'Bowl' || division === 'Mug';
  
  // Calculate points based on match type, day, session, and division
  if (day === 'Friday') {
    if (session === 'AM' && match_type === '4BBB') {
      return { win: 5, tie: 2.5 };
    } else if (session === 'PM' && match_type === 'Foursomes') {
      return isBowlMug ? { win: 4, tie: 2 } : { win: 3, tie: 1.5 };
    }
  } else if (day === 'Saturday') {
    if (session === 'AM' && match_type === '4BBB') {
      return { win: 5, tie: 2.5 };
    } else if (session === 'PM' && match_type === 'Foursomes') {
      return isBowlMug ? { win: 4, tie: 2 } : { win: 3, tie: 1.5 };
    }
  } else if (day === 'Sunday' && match_type === 'Singles') {
    return { win: 3, tie: 1.5 };
  }
  
  return { win: 1, tie: 0.5 };
}

async function debugPointsCalculation() {
  console.log('🔍 Debugging Points Calculation...\n');

  try {
    // Get all matches with holes data
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        *,
        holes!inner (
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
      .eq('division', 'Trophy')
      .order('game_number');

    if (matchesError) {
      console.error('❌ Error fetching matches:', matchesError);
      return;
    }

    // Get teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .eq('division', 'Trophy')
      .order('seed');

    if (teamsError) {
      console.error('❌ Error fetching teams:', teamsError);
      return;
    }

    console.log('🏆 TROPHY DIVISION POINTS CALCULATION:\n');

    // Calculate points for each team
    const teamPoints = {};
    teams.forEach(team => {
      teamPoints[team.id] = {
        name: team.name,
        totalPoints: 0,
        completedMatches: 0,
        inProgressMatches: 0,
        matchDetails: []
      };
    });

    // Process each match
    matches.forEach(match => {
      const matchPoints = getMatchPoints(match);
      const matchDate = new Date(match.match_date);
      const dayOfWeek = matchDate.getDay();
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
      
      console.log(`\n📋 Match ${match.game_number}: ${match.match_type} ${match.session} (${dayName} ${matchDate.toLocaleDateString()})`);
      console.log(`   Teams: ${match.team_a_id}, ${match.team_b_id}${match.team_c_id ? ', ' + match.team_c_id : ''}`);
      console.log(`   Status: ${match.status}`);
      console.log(`   Points: Win=${matchPoints.win}, Tie=${matchPoints.tie}`);
      console.log(`   Holes: ${match.holes.length}`);

      // Calculate match result
      if (match.status === 'completed') {
        // For completed matches, award points based on result
        if (match.is_three_way && match.team_c_id) {
          // 3-team stroke play - calculate total strokes
          const teamScores = [
            { teamId: match.team_a_id, total: 0 },
            { teamId: match.team_b_id, total: 0 },
            { teamId: match.team_c_id, total: 0 }
          ];

          match.holes.forEach(hole => {
            if (hole.team_a_score) teamScores[0].total += hole.team_a_score;
            if (hole.team_b_score) teamScores[1].total += hole.team_b_score;
            if (hole.team_c_score) teamScores[2].total += hole.team_c_score;
          });

          teamScores.sort((a, b) => a.total - b.total);
          
          // Winner gets win points
          teamPoints[teamScores[0].teamId].totalPoints += matchPoints.win;
          teamPoints[teamScores[0].teamId].completedMatches++;
          teamPoints[teamScores[0].teamId].matchDetails.push({
            match: match.game_number,
            result: 'WIN',
            points: matchPoints.win,
            type: `${match.match_type} ${match.session}`
          });

          // Second place gets tie points
          teamPoints[teamScores[1].teamId].totalPoints += matchPoints.tie;
          teamPoints[teamScores[1].teamId].completedMatches++;
          teamPoints[teamScores[1].teamId].matchDetails.push({
            match: match.game_number,
            result: 'TIE',
            points: matchPoints.tie,
            type: `${match.match_type} ${match.session}`
          });

          // Third place gets 0 points
          teamPoints[teamScores[2].teamId].completedMatches++;
          teamPoints[teamScores[2].teamId].matchDetails.push({
            match: match.game_number,
            result: 'LOSS',
            points: 0,
            type: `${match.match_type} ${match.session}`
          });

          console.log(`   Result: ${teamScores[0].teamId} wins (${teamScores[0].total}), ${teamScores[1].teamId} 2nd (${teamScores[1].total}), ${teamScores[2].teamId} 3rd (${teamScores[2].total})`);
        } else {
          // 2-team match play - calculate holes won
          let teamAHolesWon = 0;
          let teamBHolesWon = 0;

          match.holes.forEach(hole => {
            if (hole.team_a_score && hole.team_b_score) {
              if (hole.team_a_score < hole.team_b_score) {
                teamAHolesWon++;
              } else if (hole.team_b_score < hole.team_a_score) {
                teamBHolesWon++;
              }
            }
          });

          if (teamAHolesWon > teamBHolesWon) {
            // Team A wins
            teamPoints[match.team_a_id].totalPoints += matchPoints.win;
            teamPoints[match.team_a_id].completedMatches++;
            teamPoints[match.team_a_id].matchDetails.push({
              match: match.game_number,
              result: 'WIN',
              points: matchPoints.win,
              type: `${match.match_type} ${match.session}`
            });
            teamPoints[match.team_b_id].completedMatches++;
            teamPoints[match.team_b_id].matchDetails.push({
              match: match.game_number,
              result: 'LOSS',
              points: 0,
              type: `${match.match_type} ${match.session}`
            });
            console.log(`   Result: Team ${match.team_a_id} wins (${teamAHolesWon}-${teamBHolesWon})`);
          } else if (teamBHolesWon > teamAHolesWon) {
            // Team B wins
            teamPoints[match.team_b_id].totalPoints += matchPoints.win;
            teamPoints[match.team_b_id].completedMatches++;
            teamPoints[match.team_b_id].matchDetails.push({
              match: match.game_number,
              result: 'WIN',
              points: matchPoints.win,
              type: `${match.match_type} ${match.session}`
            });
            teamPoints[match.team_a_id].completedMatches++;
            teamPoints[match.team_a_id].matchDetails.push({
              match: match.game_number,
              result: 'LOSS',
              points: 0,
              type: `${match.match_type} ${match.session}`
            });
            console.log(`   Result: Team ${match.team_b_id} wins (${teamBHolesWon}-${teamAHolesWon})`);
          } else {
            // Tie
            teamPoints[match.team_a_id].totalPoints += matchPoints.tie;
            teamPoints[match.team_b_id].totalPoints += matchPoints.tie;
            teamPoints[match.team_a_id].completedMatches++;
            teamPoints[match.team_b_id].completedMatches++;
            teamPoints[match.team_a_id].matchDetails.push({
              match: match.game_number,
              result: 'TIE',
              points: matchPoints.tie,
              type: `${match.match_type} ${match.session}`
            });
            teamPoints[match.team_b_id].matchDetails.push({
              match: match.game_number,
              result: 'TIE',
              points: matchPoints.tie,
              type: `${match.match_type} ${match.session}`
            });
            console.log(`   Result: Tie (${teamAHolesWon}-${teamBHolesWon})`);
          }
        }
      } else if (match.status === 'in-progress') {
        // For in-progress matches, award points based on current status
        const teamsInMatch = [match.team_a_id, match.team_b_id];
        if (match.team_c_id) teamsInMatch.push(match.team_c_id);

        teamsInMatch.forEach(teamId => {
          teamPoints[teamId].inProgressMatches++;
          teamPoints[teamId].totalPoints += matchPoints.win; // Award full points for in-progress
          teamPoints[teamId].matchDetails.push({
            match: match.game_number,
            result: 'IN-PROGRESS',
            points: matchPoints.win,
            type: `${match.match_type} ${match.session}`
          });
        });
        console.log(`   Status: In-progress - awarding ${matchPoints.win} points to each team`);
      }
    });

    // Display final results
    console.log('\n🏆 FINAL CUMULATIVE POINTS:');
    Object.values(teamPoints).forEach(team => {
      console.log(`\n${team.name}:`);
      console.log(`  Total Points: ${team.totalPoints}`);
      console.log(`  Completed Matches: ${team.completedMatches}`);
      console.log(`  In-Progress Matches: ${team.inProgressMatches}`);
      console.log(`  Match Details:`);
      team.matchDetails.forEach(detail => {
        console.log(`    Match ${detail.match} (${detail.type}): ${detail.result} = ${detail.points} points`);
      });
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugPointsCalculation();
