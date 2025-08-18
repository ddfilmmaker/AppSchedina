import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate: string;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(targetDate);
      const now = new Date();
      const difference = target.getTime() - now.getTime();

      if (difference <= 0) {
        return null;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <div className="text-red-600 font-semibold">
        Tempo scaduto
      </div>
    );
  }

  return (
    <div className="flex gap-2 text-sm font-mono">
      {timeLeft.days > 0 && (
        <div className="bg-white px-2 py-1 rounded border">
          <div className="text-lg font-bold">{timeLeft.days}</div>
          <div className="text-xs">giorni</div>
        </div>
      )}
      <div className="bg-white px-2 py-1 rounded border">
        <div className="text-lg font-bold">{timeLeft.hours.toString().padStart(2, '0')}</div>
        <div className="text-xs">ore</div>
      </div>
      <div className="bg-white px-2 py-1 rounded border">
        <div className="text-lg font-bold">{timeLeft.minutes.toString().padStart(2, '0')}</div>
        <div className="text-xs">min</div>
      </div>
      <div className="bg-white px-2 py-1 rounded border">
        <div className="text-lg font-bold">{timeLeft.seconds.toString().padStart(2, '0')}</div>
        <div className="text-xs">sec</div>
      </div>
    </div>
  );
}