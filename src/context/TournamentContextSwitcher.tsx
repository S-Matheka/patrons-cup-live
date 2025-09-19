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
    const supabaseContext = useSupabaseTournament();
    // Check if the context has tournament functionality
    if (supabaseContext.currentTournament !== undefined) {
      return supabaseContext;
    }
    // If no tournament functionality, fall back to localStorage
    return useLocalStorageTournament();
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
  const shouldUseSupabase = useSupabase && isClient;

  // Force Supabase usage when client is ready
  if (shouldUseSupabase) {
    return <SupabaseProvider>{children}</SupabaseProvider>;
  }

  // Fallback to localStorage only during SSR or when not ready
  return <LocalStorageProvider>{children}</LocalStorageProvider>;
};
