'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Calendar, Zap, BarChart3, TrendingUp, Menu, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useTournament } from '@/context/TournamentContextSwitcher';
import TournamentSelector from './TournamentSelector';

const Navbar = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Safely get tournament context with fallbacks
  let tournaments, currentTournament, switchTournament, isSwitching;
  try {
    const context = useTournament();
    tournaments = context.tournaments || [];
    currentTournament = context.currentTournament || null;
    switchTournament = context.switchTournament || (() => {});
    isSwitching = context.isSwitching || false;
    
  } catch (error) {
    // Fallback values if context is not available
    console.log('❌ Navbar context error:', error);
    tournaments = [];
    currentTournament = null;
    switchTournament = () => {};
    isSwitching = false;
  }

  const navigation = [
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Live Scoring', href: '/live', icon: Zap },
    { name: 'Standings', href: '/standings', icon: TrendingUp },
    { name: 'Nancy Millar Trophy', href: '/karen-stableford', icon: BarChart3 },
    { name: 'My Golf Hub', href: 'https://mygolfhub.africa/', icon: ExternalLink, external: true },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-gradient-to-r from-green-800 to-green-700 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
                        <Link href="/" className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity">
              <img
                src="/patrons-cup-logo.png"
                alt="Patrons Cup Logo"
                className="h-16 w-auto"
                onError={(e) => {
                  // Fallback to trophy icon if logo fails to load
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling;
                  if (fallback) {
                    fallback.style.display = 'flex';
                  }
                }}
              />
              <div className="hidden w-8 h-8 bg-yellow-400 rounded-full items-center justify-center">
                <Trophy className="w-5 h-5 text-green-800" />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Tournament Selector */}
            {tournaments && tournaments.length > 0 ? (
              <div className="ml-6 mr-2">
                <TournamentSelector
                  tournaments={tournaments}
                  currentTournament={currentTournament}
                  onTournamentChange={switchTournament}
                  isLoading={isSwitching}
                  className="min-w-[160px] max-w-[200px]"
                />
              </div>
            ) : null}
            
            {navigation.map((item) => {
              const Icon = item.icon;
              if (item.external) {
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors text-green-100 hover:bg-green-600 hover:text-white whitespace-nowrap"
                  >
                    <Icon className="w-4 h-4 mr-1.5" />
                    {item.name}
                  </a>
                );
              }
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive(item.href)
                      ? 'bg-green-600 text-white'
                      : 'text-green-100 hover:bg-green-600 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-1.5" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-green-100 hover:text-white p-2"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-green-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Tournament Selector for Mobile */}
            {tournaments && tournaments.length > 0 ? (
              <div className="px-3 py-2">
                <TournamentSelector
                  tournaments={tournaments}
                  currentTournament={currentTournament}
                  onTournamentChange={switchTournament}
                  isLoading={isSwitching}
                  className="w-full"
                />
              </div>
            ) : null}
            
            {navigation.map((item) => {
              const Icon = item.icon;
              if (item.external) {
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors text-green-100 hover:bg-green-600 hover:text-white whitespace-nowrap"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </a>
                );
              }
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors whitespace-nowrap ${
                    isActive(item.href)
                      ? 'bg-green-600 text-white'
                      : 'text-green-100 hover:bg-green-600 hover:text-white'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
