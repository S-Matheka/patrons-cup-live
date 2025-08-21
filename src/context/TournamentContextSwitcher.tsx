'use client';

import React, { useState, useEffect } from 'react';
import { TournamentProvider as LocalStorageProvider } from './TournamentContext';
import { TournamentProvider as SupabaseProvider } from './SupabaseTournamentContext';

interface TournamentContextSwitcherProps {
  children: React.ReactNode;
  useSupabase?: boolean;
}

export const TournamentContextSwitcher: React.FC<TournamentContextSwitcherProps> = ({ 
  children, 
  useSupabase = false 
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if Supabase is configured (only on client side)
  const supabaseConfigured = isClient && 
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url_here';

  // Use Supabase if configured and requested, otherwise fallback to localStorage
  const shouldUseSupabase = useSupabase && supabaseConfigured;

  // Always provide a context, but switch the implementation
  if (shouldUseSupabase && isClient) {
    return <SupabaseProvider>{children}</SupabaseProvider>;
  }

  // Default to localStorage provider (works for SSR and fallback)
  return <LocalStorageProvider>{children}</LocalStorageProvider>;
};
