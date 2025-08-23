'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar, Sun, Moon, Trophy, Star } from 'lucide-react';
import { getCurrentEAT, TOURNAMENT_CONFIG } from '@/utils/timezone';

interface TournamentCountdownProps {
  className?: string;
}

type CountdownTarget = {
  date: string;
  label: string;
  description: string;
  icon: React.ReactNode;
};

export default function TournamentCountdown({ 
  className = '' 
}: TournamentCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [currentTarget, setCurrentTarget] = useState<CountdownTarget | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getNextCountdownTarget = (): CountdownTarget | null => {
    const now = getCurrentEAT();
    
    // Tournament dates and times (all in EAT)
    const fridayStart = new Date('2025-08-22T07:30:00+03:00'); // Friday first match
    const saturdayStart = new Date('2025-08-23T07:30:00+03:00'); // Saturday first match
    const sundayStart = new Date('2025-08-24T07:30:00+03:00'); // Sunday first match (Singles)
    
    // If before Friday start, count down to Friday
    if (now < fridayStart) {
      return {
        date: '2025-08-22T07:30:00+03:00',
        label: 'Tournament Begins',
        description: 'First matches start Friday morning',
        icon: <Sun className="w-5 h-5 text-yellow-500" />
      };
    }
    
    // If Friday has started but before Saturday, count down to Saturday
    if (now >= fridayStart && now < saturdayStart) {
      return {
        date: '2025-08-23T07:30:00+03:00',
        label: 'Day 2 Begins',
        description: 'Saturday morning matches',
        icon: <Sun className="w-5 h-5 text-blue-500" />
      };
    }
    
    // If Saturday has started but before Sunday, count down to Sunday (Final Day)
    if (now >= saturdayStart && now < sundayStart) {
      return {
        date: '2025-08-24T07:30:00+03:00',
        label: '🏆 FINAL DAY 🏆',
        description: 'Sunday Singles matches at 7:30 AM',
        icon: <Sun className="w-5 h-5 text-yellow-500" />
      };
    }
    
    // After Sunday start, no more countdowns
    return null;
  };

  useEffect(() => {
    if (!isMounted) return; // Only run on client side after mount
    
    const calculateTimeLeft = () => {
      const target = getNextCountdownTarget();
      setCurrentTarget(target);
      
      if (!target) {
        setTimeLeft(null);
        return;
      }

      // Get current time in EAT (Nairobi, Kenya - UTC+3)
      const now = getCurrentEAT().getTime();
      const targetTime = new Date(target.date).getTime();
      const difference = targetTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft(null);
      }
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [isMounted]);

  // Show confetti for final day countdown
  useEffect(() => {
    if (currentTarget?.label.includes('FINAL DAY')) {
      setShowConfetti(true);
      // Hide confetti after 5 seconds
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [currentTarget]);

  // Don't render if no target or time has passed
  if (!currentTarget || !timeLeft) {
    return null;
  }

  // Show loading state during SSR to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className={`bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg ${className}`}>
        <div className="px-6 py-4 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Tournament Countdown</h3>
          <div className="text-white opacity-75">Loading...</div>
        </div>
      </div>
    );
  }

  const isFinalDay = currentTarget?.label.includes('FINAL DAY');

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Confetti Animation for Final Day */}
      {showConfetti && isFinalDay && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`
              }}
            >
              <div className={`w-2 h-2 rounded-full ${
                ['bg-yellow-400', 'bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400'][Math.floor(Math.random() * 5)]
              }`} />
            </div>
          ))}
        </div>
      )}

      {/* Golf Ball Animation */}
      {isFinalDay && (
        <div className="absolute top-2 right-2 animate-bounce">
          <div className="w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
          </div>
        </div>
      )}

      <div className={`bg-gradient-to-r ${
        isFinalDay 
          ? 'from-yellow-500 via-orange-500 to-red-500 animate-pulse' 
          : 'from-green-600 to-blue-600'
      } text-white rounded-lg p-6 relative z-10`}>
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            {isFinalDay ? (
              <div className="flex items-center space-x-2">
                <Trophy className="w-6 h-6 text-yellow-300 animate-pulse" />
                <h3 className="text-2xl font-bold text-yellow-100 animate-pulse">{currentTarget.label}</h3>
                <Trophy className="w-6 h-6 text-yellow-300 animate-pulse" />
              </div>
            ) : (
              <>
                {currentTarget.icon}
                <h3 className="text-xl font-bold ml-2">{currentTarget.label}</h3>
              </>
            )}
          </div>
          
          <p className={`text-sm mb-4 ${
            isFinalDay ? 'text-yellow-100 font-semibold' : 'text-green-100'
          }`}>
            {currentTarget.description}
            {isFinalDay && (
              <span className="block mt-1 text-xs">
                🎯 The ultimate challenge awaits! 🎯
              </span>
            )}
          </p>
          
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className={`text-3xl md:text-4xl font-bold ${
                isFinalDay ? 'text-yellow-100 animate-pulse' : ''
              }`}>{timeLeft.days}</div>
              <div className={`text-sm ${
                isFinalDay ? 'text-yellow-200' : 'text-green-100'
              }`}>Days</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl md:text-4xl font-bold ${
                isFinalDay ? 'text-yellow-100 animate-pulse' : ''
              }`}>{timeLeft.hours}</div>
              <div className={`text-sm ${
                isFinalDay ? 'text-yellow-200' : 'text-green-100'
              }`}>Hours</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl md:text-4xl font-bold ${
                isFinalDay ? 'text-yellow-100 animate-pulse' : ''
              }`}>{timeLeft.minutes}</div>
              <div className={`text-sm ${
                isFinalDay ? 'text-yellow-200' : 'text-green-100'
              }`}>Minutes</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl md:text-4xl font-bold ${
                isFinalDay ? 'text-yellow-100 animate-pulse' : ''
              }`}>{timeLeft.seconds}</div>
              <div className={`text-sm ${
                isFinalDay ? 'text-yellow-200' : 'text-green-100'
              }`}>Seconds</div>
            </div>
          </div>
          
          <div className={`flex items-center justify-center ${
            isFinalDay ? 'text-yellow-200' : 'text-green-100'
          }`}>
            {isFinalDay ? (
              <>
                <Star className="w-4 h-4 mr-2 animate-spin" />
                <span className="text-sm font-semibold">🏆 FINAL DAY - SINGLES CHAMPIONSHIP 🏆</span>
                <Star className="w-4 h-4 ml-2 animate-spin" />
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 mr-2" />
                <span className="text-sm">4th Edition Patron's Cup 2025</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
