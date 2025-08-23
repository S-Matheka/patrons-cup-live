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
      // Calculate if match is complete based on match play rules
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
      const isMatchComplete = holesPlayed === 18 || holesDifference > holesRemaining;

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
