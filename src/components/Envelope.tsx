"use client";

import React, { useState } from "react";

interface EnvelopeProps {
  onOpen: () => void;
}

export default function Envelope({ onOpen }: EnvelopeProps) {
  const [isOpening, setIsOpening] = useState(false);

  const handleOpen = () => {
    setIsOpening(true);
    // Trigger parent callback after transition completes
    setTimeout(() => {
      onOpen();
    }, 1000);
  };

  return (
    <div
      onClick={handleOpen}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#FAF6F0] bg-watercolor transition-all duration-1000 cubic-bezier(0.76, 0, 0.24, 1) cursor-pointer select-none overflow-hidden ${
        isOpening ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      {/* Decorative Gold Ribbon (Vertical Center) */}
      <div className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-gold-600 via-gold-200 to-gold-700 shadow-md flex items-center justify-center">
        {/* Soft center line */}
        <div className="w-[1px] h-full bg-gold-400 opacity-60"></div>
      </div>

      {/* Decorative Watercolor Leaf Branches (Right Side) */}
      <div className="absolute right-0 bottom-0 w-[45%] h-[80%] opacity-20 pointer-events-none select-none">
        <svg
          viewBox="0 0 200 400"
          className="w-full h-full object-contain object-bottom-right"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main branch stem */}
          <path
            d="M 180,380 C 150,300 120,200 150,50"
            stroke="#c5a059"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.8"
          />
          {/* Leaf 1 */}
          <path
            d="M 155,300 C 130,290 100,270 95,250 C 120,260 145,285 152,295 Z"
            fill="url(#goldGradient)"
            opacity="0.9"
          />
          {/* Leaf 2 */}
          <path
            d="M 148,240 C 120,220 90,210 80,180 C 105,190 135,215 142,232 Z"
            fill="url(#goldGradient)"
            opacity="0.75"
          />
          {/* Leaf 3 */}
          <path
            d="M 142,170 C 110,150 90,140 85,110 C 105,120 130,145 137,162 Z"
            fill="url(#goldGradient)"
            opacity="0.85"
          />
          {/* Leaf 4 (Right side branch) */}
          <path
            d="M 148,320 C 170,300 195,290 205,275 C 190,295 170,310 152,318 Z"
            fill="url(#goldGradient)"
            opacity="0.7"
          />
          {/* Leaf 5 (Right side branch) */}
          <path
            d="M 143,260 C 170,240 185,220 190,200 C 178,220 160,240 145,252 Z"
            fill="url(#goldGradient)"
            opacity="0.8"
          />
          {/* Leaf 6 (Top) */}
          <path
            d="M 150,90 C 140,60 120,40 110,20 C 130,30 145,60 149,80 Z"
            fill="url(#goldGradient)"
            opacity="0.9"
          />

          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c5a059" />
              <stop offset="50%" stopColor="#f3e7c4" />
              <stop offset="100%" stopColor="#896532" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Decorative Gold Leaf Branches (Left Side - Soft Accent) */}
      <div className="absolute left-0 top-0 w-[30%] h-[50%] opacity-10 pointer-events-none select-none scale-x-[-1] scale-y-[-1]">
        <svg
          viewBox="0 0 200 400"
          className="w-full h-full object-contain"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 180,380 C 150,300 120,200 150,50"
            stroke="#c5a059"
            strokeWidth="1"
          />
          <path
            d="M 155,300 C 130,290 100,270 95,250 C 120,260 145,285 152,295 Z"
            fill="#c5a059"
          />
          <path
            d="M 148,240 C 120,220 90,210 80,180 C 105,190 135,215 142,232 Z"
            fill="#c5a059"
          />
          <path
            d="M 142,170 C 110,150 90,140 85,110 C 105,120 130,145 137,162 Z"
            fill="#c5a059"
          />
        </svg>
      </div>

      {/* Center Interactive Seal Area */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Animated Curved Text: "HAZ CLICK PARA ABRIR" */}
        <div className="absolute w-72 h-72 -top-36 flex items-center justify-center pointer-events-none">
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full animate-[pulseSoft_3s_infinite_ease-in-out]"
          >
            {/* The arch path over the top half of the circle */}
            <path
              id="curvePath"
              d="M 25,100 A 75,75 0 0,1 175,100"
              fill="transparent"
            />
            <text className="font-serif text-[10px] tracking-[0.3em] font-medium fill-[#3D3526]">
              <textPath href="#curvePath" startOffset="50%" textAnchor="middle">
                HAZ CLICK PARA ABRIR
              </textPath>
            </text>
          </svg>
        </div>

        {/* Outer Wax Seal Shadow Ring */}
        <div className="absolute w-36 h-36 rounded-full bg-black/10 blur-md pointer-events-none"></div>

        {/* 3D Wax Seal Button */}
        <button
          onClick={handleOpen}
          aria-label="Abrir invitación"
          className="relative z-10 w-32 h-32 rounded-full wax-seal flex items-center justify-center active:scale-95 transition-transform duration-200 select-none group"
          style={{
            borderRadius: "48% 52% 50% 50% / 50% 48% 52% 50%", // irregular wax look
          }}
        >
          {/* Inner embossed ring */}
          <div
            className="absolute inset-2 border border-gold-300/40 rounded-full flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_1px_2px_rgba(255,255,255,0.4)]"
            style={{
              borderRadius: "49% 51% 48% 52% / 51% 49% 51% 49%",
            }}
          >
            {/* Monogram Letters */}
            <span
              className="font-serif text-5xl font-medium tracking-tighter select-none"
              style={{
                background: "linear-gradient(to bottom, #fdeebc 0%, #c5a059 60%, #563f17 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0px -1px 1px rgba(0,0,0,0.4)) drop-shadow(0px 1px 1px rgba(255,255,255,0.3))",
              }}
            >
              JD
            </span>

            {/* Faint gold leaf inside seal */}
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 30,70 C 35,50 40,40 50,30 C 45,45 35,55 30,70 Z"
                fill="#fff"
              />
              <path
                d="M 70,70 C 65,50 60,40 50,30 C 55,45 65,55 70,70 Z"
                fill="#fff"
              />
            </svg>
          </div>
        </button>

        {/* Small pointer hand prompt */}
        <div className="absolute top-40 text-gold-700/60 text-xs animate-[pulseSoft_1.5s_infinite] pointer-events-none uppercase tracking-widest font-sans font-semibold">
          Toca para abrir
        </div>
      </div>
    </div>
  );
}
