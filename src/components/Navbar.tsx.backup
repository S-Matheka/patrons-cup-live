'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Calendar, Zap, BarChart3, TrendingUp, Menu } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Live Scoring', href: '/live', icon: Zap },
    { name: 'Standings', href: '/standings', icon: TrendingUp },
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
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center mr-3">
                <Trophy className="w-5 h-5 text-green-800" />
              </div>
              <div className="text-white">
                <h1 className="text-xl font-bold">Patrons Cup</h1>
                <p className="text-xs text-green-200">Live Tournament</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-green-600 text-white'
                      : 'text-green-100 hover:bg-green-600 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
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
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
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