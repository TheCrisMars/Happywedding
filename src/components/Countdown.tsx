"use client";

import React, { useState, useEffect } from "react";

export default function Countdown() {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  useEffect(() => {
    setMounted(true);
    
    const calculateTimeLeft = () => {
      // Target date: August 7, 2026 at 19:00 (7:00 PM) UTC-5
      const targetDate = new Date("2026-08-07T19:00:00-05:00");
      const difference = +targetDate - +new Date();
      
      let time = {
        days: "00",
        hours: "00",
        minutes: "00",
        seconds: "00",
      };

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        time = {
          days: days.toString().padStart(2, "0"),
          hours: hours.toString().padStart(2, "0"),
          minutes: minutes.toString().padStart(2, "0"),
          seconds: seconds.toString().padStart(2, "0"),
        };
      }

      return time;
    };

    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="flex gap-4 items-center justify-center min-h-[70px]">
        <span className="text-gold-500 font-sans tracking-widest text-xs uppercase animate-[pulseSoft_1.5s_infinite]">
          Cargando cuenta regresiva...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center py-5 px-3 rounded-xl border border-gold-300/10 bg-[#f9f5ed]/30 backdrop-blur-[2px] shadow-sm">
      <h3 className="font-serif text-[#3D3526] text-xs uppercase tracking-[0.2em] font-semibold mb-4">
        Faltan
      </h3>
      
      <div className="flex gap-1.5 sm:gap-3 md:gap-4 items-center justify-center select-none w-full">
        {/* Days Box */}
        <div className="flex flex-col items-center bg-[#FAF6F0] border border-gold-300/20 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-[0_1px_4px_rgba(0,0,0,0.02)] min-w-[52px] sm:min-w-[64px]">
          <span className="led-number text-2xl sm:text-4xl md:text-5xl font-mono font-medium leading-none">
            {timeLeft.days}
          </span>
          <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-gold-700 font-medium mt-1.5">
            Días
          </span>
        </div>

        <span className="led-number text-lg sm:text-2xl md:text-3xl font-mono leading-none opacity-40 -mt-4">:</span>

        {/* Hours Box */}
        <div className="flex flex-col items-center bg-[#FAF6F0] border border-gold-300/20 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-[0_1px_4px_rgba(0,0,0,0.02)] min-w-[52px] sm:min-w-[64px]">
          <span className="led-number text-2xl sm:text-4xl md:text-5xl font-mono font-medium leading-none">
            {timeLeft.hours}
          </span>
          <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-gold-700 font-medium mt-1.5">
            Horas
          </span>
        </div>

        <span className="led-number text-lg sm:text-2xl md:text-3xl font-mono leading-none opacity-40 -mt-4">:</span>

        {/* Minutes Box */}
        <div className="flex flex-col items-center bg-[#FAF6F0] border border-gold-300/20 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-[0_1px_4px_rgba(0,0,0,0.02)] min-w-[52px] sm:min-w-[64px]">
          <span className="led-number text-2xl sm:text-4xl md:text-5xl font-mono font-medium leading-none">
            {timeLeft.minutes}
          </span>
          <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-gold-700 font-medium mt-1.5">
            Minutos
          </span>
        </div>

        <span className="led-number text-lg sm:text-2xl md:text-3xl font-mono leading-none opacity-40 -mt-4">:</span>

        {/* Seconds Box */}
        <div className="flex flex-col items-center bg-[#FAF6F0] border border-gold-300/20 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-[0_1px_4px_rgba(0,0,0,0.02)] min-w-[52px] sm:min-w-[64px]">
          <span className="led-number text-2xl sm:text-4xl md:text-5xl font-mono font-medium leading-none text-gold-600 animate-[pulseSoft_1s_infinite]">
            {timeLeft.seconds}
          </span>
          <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-gold-700 font-medium mt-1.5">
            Segundos
          </span>
        </div>
      </div>
    </div>
  );
}
