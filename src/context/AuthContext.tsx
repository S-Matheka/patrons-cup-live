'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isOfficial: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Tournament Official Credentials (in production, this would be in a secure backend)
const OFFICIAL_CREDENTIALS = {
  'tournament-director': 'PatronsCup2025!',
  'head-official': 'Muthaiga2025@',
  'scoring-official': 'LiveScore#2025',
  'course-marshal': 'GolfCourse$2025'
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOfficial, setIsOfficial] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated on app load
    const authStatus = localStorage.getItem('tournament-auth');
    const authTimestamp = localStorage.getItem('tournament-auth-time');
    
    if (authStatus === 'authenticated' && authTimestamp) {
      const loginTime = parseInt(authTimestamp);
      const currentTime = Date.now();
      const sessionDuration = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
      
      // Check if session is still valid
      if (currentTime - loginTime < sessionDuration) {
        setIsAuthenticated(true);
        setIsOfficial(true);
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
    
    // Clear authentication state
    localStorage.removeItem('tournament-auth');
    localStorage.removeItem('tournament-auth-time');
    localStorage.removeItem('tournament-official-role');
  };

  const checkAuth = (): boolean => {
    return isAuthenticated && isOfficial;
  };

  const value = {
    isAuthenticated,
    isOfficial,
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
