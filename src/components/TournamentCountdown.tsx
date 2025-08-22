'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar, Sun, Moon } from 'lucide-react';
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getNextCountdownTarget = (): CountdownTarget | null => {
    const now = getCurrentEAT();
    
    // Tournament dates and times (all in EAT)
    const fridayStart = new Date('2025-08-22T07:30:00+03:00'); // Friday first match
    const saturdayStart = new Date('2025-08-23T07:30:00+03:00'); // Saturday first match
    const sundayEvening = new Date('2025-08-24T18:00:00+03:00'); // Sunday evening matches (6 PM)
    
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
    
    // If Saturday has started but before Sunday evening, count down to Sunday evening
    if (now >= saturdayStart && now < sundayEvening) {
      return {
        date: '2025-08-24T18:00:00+03:00',
        label: 'Final Day Evening',
        description: 'Sunday evening matches at 6:00 PM',
        icon: <Moon className="w-5 h-5 text-purple-500" />
      };
    }
    
    // After Sunday evening, no more countdowns
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

  return (
    <div className={`bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg p-6 ${className}`}>
      <div className="text-center">
        <div className="flex items-center justify-center mb-2">
          {currentTarget.icon}
          <h3 className="text-xl font-bold ml-2">{currentTarget.label}</h3>
        </div>
        
        <p className="text-sm text-green-100 mb-4">{currentTarget.description}</p>
        
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold">{timeLeft.days}</div>
            <div className="text-sm text-green-100">Days</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold">{timeLeft.hours}</div>
            <div className="text-sm text-green-100">Hours</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold">{timeLeft.minutes}</div>
            <div className="text-sm text-green-100">Minutes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold">{timeLeft.seconds}</div>
            <div className="text-sm text-green-100">Seconds</div>
          </div>
        </div>
        
        <div className="flex items-center justify-center text-green-100">
          <Clock className="w-4 h-4 mr-2" />
          <span className="text-sm">4th Edition Patron's Cup 2025</span>
        </div>
      </div>
    </div>
  );
}
