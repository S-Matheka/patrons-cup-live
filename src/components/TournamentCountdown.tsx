'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

interface TournamentCountdownProps {
  startDate?: string;
  className?: string;
}

export default function TournamentCountdown({ 
  startDate = '2025-08-22T07:00:00+03:00', // First game starts at 7:00 AM EAT
  className = '' 
}: TournamentCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const tournamentStart = new Date(startDate).getTime();
      const difference = tournamentStart - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
        setIsStarted(false);
      } else {
        setTimeLeft(null);
        setIsStarted(true);
      }
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [startDate]);

  // Don't render if tournament has started
  if (isStarted || !timeLeft) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg p-6 ${className}`}>
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Calendar className="w-6 h-6 mr-2" />
          <h3 className="text-xl font-bold">Tournament Starts In</h3>
        </div>
        
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
          <span className="text-sm">
            4th Edition Patron's Cup • Friday, August 22nd, 2025 at 7:00 AM
          </span>
        </div>
      </div>
    </div>
  );
}
