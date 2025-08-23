import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for scoring updates');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, holeNumber, teamAScore, teamBScore, teamCScore, status } = body;

    console.log('🔄 Updating hole score:', {
      matchId,
      holeNumber,
      teamAScore,
      teamBScore,
      teamCScore,
      status
    });

    // Get the current hole to preserve the par value
    const { data: currentHole } = await supabase
      .from('holes')
      .select('par')
      .eq('match_id', matchId)
      .eq('hole_number', holeNumber)
      .single();

    const parValue = currentHole?.par || 4; // Default to par 4 if not found

    // Update the hole score
    const { data, error } = await supabase
      .from('holes')
      .upsert({
        match_id: matchId,
        hole_number: holeNumber,
        par: parValue, // Include the par value
        team_a_score: teamAScore,
        team_b_score: teamBScore,
        team_c_score: teamCScore,
        status: status || 'completed',
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'match_id,hole_number'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating hole:', error);
      return NextResponse.json(
        { error: 'Failed to update hole score', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Hole score updated successfully:', data);

    // Check if match should be completed
    const { data: matchHoles } = await supabase
      .from('holes')
      .select('*')
      .eq('match_id', matchId)
      .order('hole_number');

    if (matchHoles && matchHoles.length > 0) {
      // Get match info to determine if it's 3-way
      const { data: matchInfo } = await supabase
        .from('matches')
        .select('is_three_way, team_c_id')
        .eq('id', matchId)
        .single();

      const isThreeWay = matchInfo?.is_three_way || matchInfo?.team_c_id !== null;
      
      let isMatchComplete = false;

      if (isThreeWay) {
        // 3-way match play logic
        let teamAHolesWon = 0;
        let teamBHolesWon = 0;
        let teamCHolesWon = 0;
        let holesPlayed = 0;

        matchHoles.forEach(hole => {
          // Only count holes where at least 2 teams have valid scores
          const validScores = [
            hole.team_a_score, 
            hole.team_b_score, 
            hole.team_c_score
          ].filter(score => score !== null && score > 0);
          
          if (validScores.length >= 2) {
            holesPlayed++;
            
            // Find the lowest score (winner of the hole)
            const scores = [
              { team: 'teamA', score: hole.team_a_score },
              { team: 'teamB', score: hole.team_b_score },
              { team: 'teamC', score: hole.team_c_score }
            ].filter(s => s.score !== null && s.score > 0);
            
            scores.sort((a, b) => (a.score || 0) - (b.score || 0));
            
            const lowestScore = scores[0].score;
            const winners = scores.filter(s => s.score === lowestScore);
            
            if (winners.length === 1) {
              // Single winner
              if (winners[0].team === 'teamA') teamAHolesWon++;
              else if (winners[0].team === 'teamB') teamBHolesWon++;
              else if (winners[0].team === 'teamC') teamCHolesWon++;
            }
            // If multiple teams tie for lowest score, no one wins the hole (halved)
          }
        });

        const holesRemaining = 18 - holesPlayed;
        
        // Find the leading team and margin
        const scores = [
          { team: 'teamA', holesWon: teamAHolesWon },
          { team: 'teamB', holesWon: teamBHolesWon },
          { team: 'teamC', holesWon: teamCHolesWon }
        ];
        
        scores.sort((a, b) => b.holesWon - a.holesWon);
        
        const leaderHolesWon = scores[0].holesWon;
        const secondPlaceHolesWon = scores[1].holesWon;
        
        // Check if match is completed
        // Match ends when: 1) All 18 holes played, OR 2) Team is up by more holes than remain
        const holesDifference = leaderHolesWon - secondPlaceHolesWon;
        isMatchComplete = holesPlayed === 18 || holesDifference > holesRemaining;
        
        console.log(`3-way match completion check: holesPlayed=${holesPlayed}, leader=${scores[0].team} (${leaderHolesWon}), second=${scores[1].team} (${secondPlaceHolesWon}), difference=${holesDifference}, remaining=${holesRemaining}, complete=${isMatchComplete}`);
        
      } else {
        // 2-way match play logic (existing code)
        let teamAHolesWon = 0;
        let teamBHolesWon = 0;
        let holesPlayed = 0;

        matchHoles.forEach(hole => {
          if (hole.team_a_score && hole.team_b_score) {
            holesPlayed++;
            if (hole.team_a_score < hole.team_b_score) {
              teamAHolesWon++;
            } else if (hole.team_b_score < hole.team_a_score) {
              teamBHolesWon++;
            }
          }
        });

        const holesRemaining = 18 - holesPlayed;
        const holesDifference = Math.abs(teamAHolesWon - teamBHolesWon);
        isMatchComplete = holesPlayed === 18 || holesDifference > holesRemaining;
      }

      if (isMatchComplete) {
        // Update match status to completed
        const { error: matchError } = await supabase
          .from('matches')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', matchId);

        if (matchError) {
          console.error('❌ Error updating match status:', matchError);
        } else {
          console.log('✅ Match marked as completed');
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Hole score updated successfully'
    });

  } catch (error) {
    console.error('❌ Error in update-hole API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
