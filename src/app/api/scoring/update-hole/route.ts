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
        // 3-way match play logic - treat as individual head-to-head matches
        let teamAvsB = { teamAWins: 0, teamBWins: 0, holesPlayed: 0 };
        let teamAvsC = { teamAWins: 0, teamCWins: 0, holesPlayed: 0 };
        let teamBvsC = { teamBWins: 0, teamCWins: 0, holesPlayed: 0 };

        matchHoles.forEach(hole => {
          // Team A vs Team B
          if (hole.team_a_score && hole.team_b_score && hole.team_a_score > 0 && hole.team_b_score > 0) {
            teamAvsB.holesPlayed++;
            if (hole.team_a_score < hole.team_b_score) {
              teamAvsB.teamAWins++;
            } else if (hole.team_b_score < hole.team_a_score) {
              teamAvsB.teamBWins++;
            }
          }

          // Team A vs Team C
          if (hole.team_a_score && hole.team_c_score && hole.team_a_score > 0 && hole.team_c_score > 0) {
            teamAvsC.holesPlayed++;
            if (hole.team_a_score < hole.team_c_score) {
              teamAvsC.teamAWins++;
            } else if (hole.team_c_score < hole.team_a_score) {
              teamAvsC.teamCWins++;
            }
          }

          // Team B vs Team C
          if (hole.team_b_score && hole.team_c_score && hole.team_b_score > 0 && hole.team_c_score > 0) {
            teamBvsC.holesPlayed++;
            if (hole.team_b_score < hole.team_c_score) {
              teamBvsC.teamBWins++;
            } else if (hole.team_c_score < hole.team_b_score) {
              teamBvsC.teamCWins++;
            }
          }
        });

        // Calculate individual match results
        const teamAWins = (teamAvsB.teamAWins > teamAvsB.teamBWins ? 1 : 0) + 
                         (teamAvsC.teamAWins > teamAvsC.teamCWins ? 1 : 0);
        const teamBWins = (teamAvsB.teamBWins > teamAvsB.teamAWins ? 1 : 0) + 
                         (teamBvsC.teamBWins > teamBvsC.teamCWins ? 1 : 0);
        const teamCWins = (teamAvsC.teamCWins > teamAvsC.teamAWins ? 1 : 0) + 
                         (teamBvsC.teamCWins > teamBvsC.teamBWins ? 1 : 0);

        // Match is complete when all individual matches are complete
        const maxHolesPlayed = Math.max(teamAvsB.holesPlayed, teamAvsC.holesPlayed, teamBvsC.holesPlayed);
        isMatchComplete = maxHolesPlayed === 18;
        
        console.log(`3-way match completion check: maxHolesPlayed=${maxHolesPlayed}, teamA=${teamAWins} wins, teamB=${teamBWins} wins, teamC=${teamCWins} wins, complete=${isMatchComplete}`);
        
      } else {
        // 2-way match play logic (4BBB, Singles) - using the same validation logic
        const holesData = matchHoles.map(hole => ({
          holeNumber: hole.hole_number,
          par: hole.par || 4,
          teamAStrokes: hole.team_a_score ?? 0,
          teamBStrokes: hole.team_b_score ?? 0
        }));
        
        // Import the validation logic (this will be handled by the calculateMatchPlayResult function)
        // The function will use the exact VALID_RESULTS validation we implemented
        const matchPlayResult = {
          status: 'in-progress' as const,
          winner: null as any,
          result: '',
          teamAHolesWon: 0,
          teamBHolesWon: 0,
          holesPlayed: 0
        };
        
        // Calculate match completion using the same logic as the frontend
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
