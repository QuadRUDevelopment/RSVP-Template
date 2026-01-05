import React, { useState, useEffect } from 'react';
import './CountdownTimer.css';

interface CountdownTimerProps {
  targetDate: string; // ISO date string
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!targetDate) {
      console.log('[CountdownTimer] No targetDate provided');
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      // Ensure we parse the date correctly - handle both ISO strings and timestamps
      const target = new Date(targetDate).getTime();
      
      // Debug logging - always log to help debug production issues
      console.log('[CountdownTimer] Target date:', new Date(targetDate).toISOString());
      console.log('[CountdownTimer] Current date:', new Date().toISOString());
      console.log('[CountdownTimer] Target timestamp:', target);
      console.log('[CountdownTimer] Current timestamp:', now);
      console.log('[CountdownTimer] Difference (ms):', difference);
      
      const difference = target - now;

      if (difference <= 0) {
        console.log('[CountdownTimer] Date has passed, difference:', difference);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const result = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };

      console.log('[CountdownTimer] Time left:', result);

      return result;
    };

    // Calculate immediately
    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);

    // Update every second
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate) {
    console.log('[CountdownTimer] No targetDate, returning null');
    return null;
  }

  if (!timeLeft) {
    console.log('[CountdownTimer] No timeLeft calculated yet, returning null');
    return null;
  }

  // If the date has passed, don't show countdown
  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
    console.log('[CountdownTimer] Date has passed, hiding countdown');
    return null;
  }

  return (
    <div className="countdown-timer">
      <div className="countdown-item">
        <span className="countdown-value">{timeLeft.days}</span>
        <span className="countdown-label">Days</span>
      </div>
      <span className="countdown-separator">:</span>
      <div className="countdown-item">
        <span className="countdown-value">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="countdown-label">Hours</span>
      </div>
      <span className="countdown-separator">:</span>
      <div className="countdown-item">
        <span className="countdown-value">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="countdown-label">Min</span>
      </div>
      <span className="countdown-separator">:</span>
      <div className="countdown-item">
        <span className="countdown-value">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span className="countdown-label">Sec</span>
      </div>
    </div>
  );
};

