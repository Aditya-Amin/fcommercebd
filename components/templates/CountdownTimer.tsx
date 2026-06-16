"use client";

import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(endDate: string): TimeLeft | null {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

const UNITS = ["Days", "Hours", "Minutes", "Seconds"] as const;

export function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    if (!endDate) return;
    setTimeLeft(calcTimeLeft(endDate));
    const id = setInterval(() => setTimeLeft(calcTimeLeft(endDate)), 1000);
    return () => clearInterval(id);
  }, [endDate]);

  if (!endDate) return null;

  if (!timeLeft) {
    return (
      <p className="text-center text-20 font-bold text-green-700">অফার শেষ হয়ে গেছে!</p>
    );
  }

  const values = [timeLeft.days, timeLeft.hours, timeLeft.minutes, timeLeft.seconds];

  return (
    <div className="flex justify-center gap-3">
      {UNITS.map((unit, i) => (
        <div
          key={unit}
          className="flex min-w-[180px] min-h-[180px] flex-col justify-center items-center rounded-xl bg-green-600 px-3 py-3 text-white shadow"
        >
          <span className="text-5xl font-bold leading-none">{pad(values[i])}</span>
          <span className="mt-1 text-[20px] font-medium">{unit}</span>
        </div>
      ))}
    </div>
  );
}
