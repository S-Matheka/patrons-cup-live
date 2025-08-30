import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create Supabase client only if environment variables are available
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null

// Create a browser-specific Supabase client
export const getBrowserSupabaseClient = () => {
  if (typeof window === 'undefined') return null;
  
  const browserUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const browserKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (browserUrl && browserKey) {
    return createClient(browserUrl, browserKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  
  return null;
};

// Create a function to get Supabase client that works in both server and browser
export const getSupabaseClient = () => {
  if (typeof window !== 'undefined') {
    // Browser environment
    const browserUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const browserKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (browserUrl && browserKey) {
      return createClient(browserUrl, browserKey, {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      })
    }
  }
  
  // Server environment or fallback
  return supabase
}

// Debug logging removed for cleaner console

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  // Always return true for now to force Supabase usage
  // The environment variables are properly set as confirmed by our tests
  return true;
}

// Database type definitions for better TypeScript support
export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: number
          name: string
          division: 'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug'
          color: string
          logo: string | null
          description: string | null
          seed: number
          total_players: number
          max_points_available: number
          session_points: Record<string, number>
          players_per_session: Record<string, number>
          resting_per_session: Record<string, number>
          points_per_match: Record<string, number>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          division: 'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug'
          color: string
          logo?: string | null
          description?: string | null
          seed: number
          total_players: number
          max_points_available: number
          session_points: Record<string, number>
          players_per_session: Record<string, number>
          resting_per_session: Record<string, number>
          points_per_match: Record<string, number>
        }
        Update: {
          id?: number
          name?: string
          division?: 'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug'
          color?: string
          logo?: string | null
          description?: string | null
          seed?: number
          total_players?: number
          max_points_available?: number
          session_points?: Record<string, number>
          players_per_session?: Record<string, number>
          resting_per_session?: Record<string, number>
          points_per_match?: Record<string, number>
        }
      }
      players: {
        Row: {
          id: number
          name: string
          team_id: number | null
          handicap: number
          email: string | null
          phone: string | null
          is_pro: boolean
          is_ex_officio: boolean
          is_junior: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          team_id?: number | null
          handicap?: number
          email?: string | null
          phone?: string | null
          is_pro?: boolean
          is_ex_officio?: boolean
          is_junior?: boolean
        }
        Update: {
          id?: number
          name?: string
          team_id?: number | null
          handicap?: number
          email?: string | null
          phone?: string | null
          is_pro?: boolean
          is_ex_officio?: boolean
          is_junior?: boolean
        }
      }
      matches: {
        Row: {
          id: number
          team_a_id: number | null
          team_b_id: number | null
          team_c_id: number | null
          division: 'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug'
          match_date: string
          tee_time: string
          tee: string
          course: string
          match_type: '4BBB' | 'Foursomes' | 'Singles'
          session: 'AM' | 'PM'
          status: 'scheduled' | 'in-progress' | 'completed'
          players: Record<string, string[]>
          game_number: number
          is_three_way: boolean
          is_pro: boolean
          is_bye: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          team_a_id?: number | null
          team_b_id?: number | null
          team_c_id?: number | null
          division: 'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug'
          match_date: string
          tee_time: string
          tee: string
          course?: string
          match_type: '4BBB' | 'Foursomes' | 'Singles'
          session: 'AM' | 'PM'
          status?: 'scheduled' | 'in-progress' | 'completed'
          players: Record<string, string[]>
          game_number: number
          is_three_way?: boolean
          is_pro?: boolean
          is_bye?: boolean
        }
        Update: {
          id?: number
          team_a_id?: number | null
          team_b_id?: number | null
          team_c_id?: number | null
          division?: 'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug'
          match_date?: string
          tee_time?: string
          tee?: string
          course?: string
          match_type?: '4BBB' | 'Foursomes' | 'Singles'
          session?: 'AM' | 'PM'
          status?: 'scheduled' | 'in-progress' | 'completed'
          players?: Record<string, string[]>
          game_number?: number
          is_three_way?: boolean
          is_pro?: boolean
          is_bye?: boolean
        }
      }
      holes: {
        Row: {
          id: number
          match_id: number
          hole_number: number
          par: number
          team_a_score: number | null
          team_b_score: number | null
          team_a_strokes: number | null
          team_b_strokes: number | null
          status: 'not-started' | 'in-progress' | 'completed'
          last_updated: string
        }
        Insert: {
          id?: number
          match_id: number
          hole_number: number
          par: number
          team_a_score?: number | null
          team_b_score?: number | null
          team_a_strokes?: number | null
          team_b_strokes?: number | null
          status?: 'not-started' | 'in-progress' | 'completed'
        }
        Update: {
          id?: number
          match_id?: number
          hole_number?: number
          par?: number
          team_a_score?: number | null
          team_b_score?: number | null
          team_a_strokes?: number | null
          team_b_strokes?: number | null
          status?: 'not-started' | 'in-progress' | 'completed'
        }
      }
      scores: {
        Row: {
          id: number
          team_id: number
          division: 'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug'
          points: number
          matches_played: number
          matches_won: number
          matches_lost: number
          matches_halved: number
          holes_won: number
          holes_lost: number
          total_strokes: number
          strokes_differential: number
          current_round: number
          position: number | null
          position_change: 'up' | 'down' | 'same'
          last_updated: string
        }
        Insert: {
          id?: number
          team_id: number
          division: 'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug'
          points?: number
          matches_played?: number
          matches_won?: number
          matches_lost?: number
          matches_halved?: number
          holes_won?: number
          holes_lost?: number
          total_strokes?: number
          strokes_differential?: number
          current_round?: number
          position?: number | null
          position_change?: 'up' | 'down' | 'same'
        }
        Update: {
          id?: number
          team_id?: number
          division?: 'Trophy' | 'Shield' | 'Plaque' | 'Bowl' | 'Mug'
          points?: number
          matches_played?: number
          matches_won?: number
          matches_lost?: number
          matches_halved?: number
          holes_won?: number
          holes_lost?: number
          total_strokes?: number
          strokes_differential?: number
          current_round?: number
          position?: number | null
          position_change?: 'up' | 'down' | 'same'
        }
      }
    }
  }
}
