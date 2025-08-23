'use client';

import React, { useState, useEffect, useContext } from 'react';
import { TournamentProvider as LocalStorageProvider, useTournament as useLocalStorageTournament } from './TournamentContext';
import { TournamentProvider as SupabaseProvider, useTournament as useSupabaseTournament } from './SupabaseTournamentContext';
import { TournamentContextType } from '@/types';

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
  useSupabase = true  // Default to true to always use Supabase
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if Supabase is configured
  const supabaseConfigured = typeof window !== 'undefined' && 
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url_here';

  // Use Supabase if configured and requested, otherwise fallback to localStorage
  const shouldUseSupabase = useSupabase && supabaseConfigured;

  // Always provide a context, but switch the implementation consistently
  if (shouldUseSupabase) {
    console.log('Using Supabase provider for tournament data');
    return <SupabaseProvider>{children}</SupabaseProvider>;
  }

  // Default to localStorage provider (works for SSR and fallback)
  console.log('Using localStorage provider for tournament data (fallback)');
  return <LocalStorageProvider>{children}</LocalStorageProvider>;
};
