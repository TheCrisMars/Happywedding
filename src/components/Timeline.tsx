"use client";

import React from "react";

interface TimelineEvent {
  title: string;
  time: string;
  side: "left" | "right";
  icon: React.ReactNode;
}

export default function Timeline() {
  const events: TimelineEvent[] = [
    {
      title: "CEREMONIA",
      time: "18:00 horas",
      side: "right",
      icon: (
        <svg viewBox="0 0 64 64" className="w-11 h-11 md:w-14 md:h-14 stroke-gold-700 fill-none" strokeWidth="1.5">
          <path d="M12 56V32L32 16L52 32V56H12Z" strokeLinejoin="round" />
          <path d="M32 16V4M28 8H36" />
          <path d="M26 56V44C26 40.7 28.7 38 32 38C35.3 38 38 40.7 38 44V56" />
          <path d="M22 28H26V32H22V28ZM38 28H42V32H38V28Z" />
          <circle cx="32" cy="24" r="3" />
        </svg>
      ),
    },
    {
      title: "RECEPCIÓN",
      time: "19:00 horas",
      side: "left",
      icon: (
        <svg viewBox="0 0 64 64" className="w-11 h-11 md:w-14 md:h-14 stroke-gold-700 fill-none" strokeWidth="1.5">
          <path d="M14 44H50V48H14V44Z" />
          <path d="M22 44L20 56M42 44L44 56" strokeLinecap="round" />
          <path d="M12 36C12 36 12 44 14 44M52 36C52 36 52 44 50 44" />
          <path d="M10 56V32C10 32 12 30 14 32V44M54 56V32C54 32 52 30 50 32V44" />
          <path d="M28 36H36V44H28V36Z" />
          <circle cx="32" cy="30" r="1.5" className="fill-gold-700" />
        </svg>
      ),
    },
    {
      title: "BRINDIS",
      time: "20:00 horas",
      side: "right",
      icon: (
        <svg viewBox="0 0 64 64" className="w-11 h-11 md:w-14 md:h-14 stroke-gold-700 fill-none" strokeWidth="1.5">
          <path d="M18 16L32 36L46 16H18Z" strokeLinejoin="round" />
          <path d="M32 36V52M22 52H42" strokeLinecap="round" />
          <path d="M32 26L42 12" />
          <circle cx="35" cy="22" r="1.5" className="fill-gold-700" />
        </svg>
      ),
    },
    {
      title: "HORA LOCA",
      time: "22:00 horas",
      side: "left",
      icon: (
        <svg viewBox="0 0 64 64" className="w-11 h-11 md:w-14 md:h-14 stroke-gold-700 fill-none" strokeWidth="1.5">
          <circle cx="32" cy="32" r="18" />
          <path d="M32 6V14" />
          <path d="M14 32H50M32 14V50" />
          <path d="M18 24C22 28 42 28 46 24M18 40C22 36 42 36 46 40" />
          <path d="M24 18C28 22 28 42 24 46M40 18C36 22 36 42 40 46" />
          <path d="M12 12L15 15M12 15L15 12" strokeWidth="1" />
          <path d="M49 14L52 17M49 17L52 14" strokeWidth="1" />
        </svg>
      ),
    },
    {
      title: "BANQUETE",
      time: "23:00 horas",
      side: "right",
      icon: (
        <svg viewBox="0 0 64 64" className="w-11 h-11 md:w-14 md:h-14 stroke-gold-700 fill-none" strokeWidth="1.5">
          <path d="M10 48H54V50H10V48Z" strokeLinecap="round" />
          <path d="M16 48C16 35.8 23.2 26 32 26C40.8 26 48 35.8 48 48H16Z" strokeLinejoin="round" />
          <circle cx="32" cy="22" r="3.5" />
          <path d="M12 50C12 52.2 21 54 32 54C43 54 52 52.2 52 50" />
        </svg>
      ),
    },
    {
      title: "DESPEDIDA",
      time: "02:00 horas",
      side: "left",
      icon: (
        <svg viewBox="0 0 64 64" className="w-11 h-11 md:w-14 md:h-14 stroke-gold-700 fill-none" strokeWidth="1.5">
          <circle cx="22" cy="32" r="10" />
          <circle cx="22" cy="32" r="4" />
          <path d="M32 32H54" strokeLinecap="round" />
          <path d="M44 32V40M50 32V40" strokeLinecap="round" />
          <path d="M19 25C20.5 24 23.5 24 25 25" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full relative py-3 md:py-6">
      {/* 1. DESKTOP LAYOUT (Horizontal timeline, visible on medium screens and up) */}
      <div className="hidden md:block w-full relative px-6">
        {/* Horizontal timeline line */}
        <div className="absolute left-10 right-10 top-[44px] h-[2px] bg-[#c5a059] opacity-45"></div>
        
        {/* Endpoint dots */}
        <div className="absolute left-[36px] top-[40px] w-3 h-3 rounded-full bg-[#c5a059]"></div>
        <div className="absolute right-[36px] top-[40px] w-3 h-3 rounded-full bg-[#c5a059]"></div>

        <div className="grid grid-cols-6 gap-2 relative z-10 w-full">
          {events.map((event, idx) => (
            <div key={idx} className="flex flex-col items-center text-center group">
              {/* Icon Container with active styling on hover */}
              <div className="p-2 mb-2 bg-[#FAF6F0] rounded-full border border-gold-300/40 shadow-sm flex items-center justify-center relative transition-transform duration-300 hover:scale-110 z-20">
                {event.icon}
              </div>
              
              {/* Timeline Connector node dot */}
              <div className="w-2.5 h-2.5 rounded-full bg-[#c5a059] border-2 border-[#FAF6F0] -mt-[21px] mb-3 shadow-sm z-30 transition-colors duration-300 group-hover:bg-gold-500"></div>

              {/* Event Title (Larger font) */}
              <h4 className="font-serif text-[#3D3526] text-sm md:text-base font-bold tracking-wider leading-tight">
                {event.title}
              </h4>
              
              {/* Event Time (Larger font) */}
              <p className="font-sans text-xs md:text-sm text-gold-700 tracking-wider font-semibold mt-0.5">
                {event.time}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. MOBILE LAYOUT (Alternating vertical timeline, visible on small screens) */}
      <div className="block md:hidden relative w-full max-w-md mx-auto px-2">
        {/* Central vertical line of the timeline */}
        <div className="absolute left-1/2 top-4 bottom-4 w-[1.5px] bg-[#c5a059] opacity-40 -translate-x-1/2"></div>
        
        {/* Endpoint dots */}
        <div className="absolute left-1/2 top-4 w-2 h-2 rounded-full bg-[#c5a059] -translate-x-1/2 shadow-sm"></div>
        <div className="absolute left-1/2 bottom-4 w-2 h-2 rounded-full bg-[#c5a059] -translate-x-1/2 shadow-sm"></div>

        <div className="flex flex-col gap-6 relative z-10">
          {events.map((event, idx) => (
            <div
              key={idx}
              className={`flex w-full items-center justify-between ${
                event.side === "left" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Balance spacer */}
              <div className="w-[42%]"></div>

              {/* Connecting line */}
              <div className="w-[6%] relative flex items-center justify-center">
                <div className="w-full h-[1px] bg-[#c5a059] opacity-40"></div>
                <div className="absolute w-2 h-2 rounded-full bg-[#c5a059] border border-[#FAF6F0] z-20"></div>
              </div>

              {/* Event Card */}
              <div className="w-[42%] flex flex-col items-center text-center">
                <div className="p-1.5 mb-1.5 bg-[#FAF6F0] rounded-full border border-gold-300/20 shadow-sm flex items-center justify-center">
                  {event.icon}
                </div>
                
                <h4 className="font-serif text-[#3D3526] text-xs font-bold tracking-wider leading-tight">
                  {event.title}
                </h4>
                
                <p className="font-sans text-xs text-gold-700 tracking-wider font-semibold mt-0.5">
                  {event.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
