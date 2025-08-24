'use client';

import React, { useState, useEffect, useContext } from 'react';
import { TournamentProvider as LocalStorageProvider, useTournament as useLocalStorageTournament } from './TournamentContext';
import { TournamentProvider as SupabaseProvider, useTournament as useSupabaseTournament } from './SupabaseTournamentContext';
import { TournamentContextType } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';

interface TournamentContextSwitcherProps {
  children: React.ReactNode;
  useSupabase?: boolean;
}

// Create a unified useTournament hook that works with both contexts
export const useTournament = (): TournamentContextType => {
  // Try Supabase context first
  try {
    return useSupabaseTournament();
  } catch (error) {
    // If Supabase context is not available, try localStorage context
    try {
      return useLocalStorageTournament();
    } catch (error) {
      throw new Error('useTournament must be used within a TournamentProvider');
    }
  }
};

export const TournamentContextSwitcher: React.FC<TournamentContextSwitcherProps> = ({ 
  children, 
  useSupabase = true  // Force Supabase usage
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Force Supabase usage when client is ready
  const supabaseConfigured = typeof window !== 'undefined' && isSupabaseConfigured();
  const shouldUseSupabase = useSupabase && (isClient || supabaseConfigured);
  
  console.log('🔧 TournamentContextSwitcher Debug:');
  console.log('  isClient:', isClient);
  console.log('  useSupabase:', useSupabase);
  console.log('  supabaseConfigured:', supabaseConfigured);
  console.log('  shouldUseSupabase:', shouldUseSupabase);

  // Force Supabase usage when client is ready
  if (isClient && useSupabase) {
    console.log('✅ Using Supabase provider for tournament data (forced)');
    return <SupabaseProvider>{children}</SupabaseProvider>;
  }

  // Fallback to localStorage only during SSR or when not ready
  console.log('⚠️ Using localStorage provider for tournament data (fallback)');
  return <LocalStorageProvider>{children}</LocalStorageProvider>;
};
