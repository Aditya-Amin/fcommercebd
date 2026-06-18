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
      <p className="text-center text-base font-bold text-green-700 sm:text-xl">অফার শেষ হয়ে গেছে!</p>
    );
  }

  const values = [timeLeft.days, timeLeft.hours, timeLeft.minutes, timeLeft.seconds];

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {UNITS.map((unit, i) => (
        <div
          key={unit}
          className="flex w-[72px] flex-col items-center justify-center rounded-xl bg-green-600 py-3 text-white shadow sm:w-[100px] sm:py-4 md:w-[130px] md:py-5"
        >
          <span className="text-2xl font-bold leading-none sm:text-3xl md:text-4xl lg:text-5xl">{pad(values[i])}</span>
          <span className="mt-1 text-[10px] font-medium sm:text-xs md:text-sm lg:text-base">{unit}</span>
        </div>
      ))}
    </div>
  );
}
