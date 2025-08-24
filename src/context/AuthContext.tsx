'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isOfficial: boolean;
  isAdmin: boolean;
  isScorer: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Tournament Official Credentials (in production, this would be in a secure backend)
const OFFICIAL_CREDENTIALS = {
  'admin': 'MuthaigaTournament#Director$2025',
  'scorer': '1234567890'
};

const getRoleDisplayName = (username: string): string => {
  switch (username) {
    case 'admin':
      return 'Administrator';
    case 'scorer':
      return 'Official Scorer';
    default:
      return 'Official';
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOfficial, setIsOfficial] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isScorer, setIsScorer] = useState(false);

  useEffect(() => {
    // Only run on client side to avoid hydration mismatch
    if (typeof window === 'undefined') return;
    
    // Check if user is already authenticated on app load
    const authStatus = localStorage.getItem('tournament-auth');
    const authTimestamp = localStorage.getItem('tournament-auth-time');
    const officialRole = localStorage.getItem('tournament-official-role');
    
    if (authStatus === 'authenticated' && authTimestamp && officialRole) {
      const loginTime = parseInt(authTimestamp);
      const currentTime = Date.now();
      const sessionDuration = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
      
      // Check if session is still valid
      if (currentTime - loginTime < sessionDuration) {
        setIsAuthenticated(true);
        setIsOfficial(true);
        setIsAdmin(officialRole === 'admin');
        setIsScorer(officialRole === 'scorer');
        setUser({
          username: officialRole,
          role: getRoleDisplayName(officialRole)
        });
      } else {
        // Session expired
        localStorage.removeItem('tournament-auth');
        localStorage.removeItem('tournament-auth-time');
        localStorage.removeItem('tournament-official-role');
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check credentials
    if (OFFICIAL_CREDENTIALS[username as keyof typeof OFFICIAL_CREDENTIALS] === password) {
      setIsAuthenticated(true);
      setIsOfficial(true);
      setIsAdmin(username === 'admin');
      setIsScorer(username === 'scorer');
      setUser({
        username,
        role: getRoleDisplayName(username)
      });
      
      // Store authentication state
      localStorage.setItem('tournament-auth', 'authenticated');
      localStorage.setItem('tournament-auth-time', Date.now().toString());
      localStorage.setItem('tournament-official-role', username);
      
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsOfficial(false);
    setIsAdmin(false);
    setIsScorer(false);
    setUser(null);
    
    // Clear authentication state
    localStorage.removeItem('tournament-auth');
    localStorage.removeItem('tournament-auth-time');
    localStorage.removeItem('tournament-official-role');
  };

  const checkAuth = (): boolean => {
    return isAuthenticated && isOfficial;
  };

  const value = {
    user,
    isAuthenticated,
    isOfficial,
    isAdmin,
    isScorer,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
