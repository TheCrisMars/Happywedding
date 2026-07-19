"use client";

import React, { useState, useEffect } from "react";

export default function Carousel() {
  const images = [
    {
      src: "/images/image1.jpeg",
      alt: "Momento romántico de la pareja 1",
    },
    {
      src: "/images/imagen6.jpeg",
      alt: "Momento romántico de la pareja 2",
    },
    {
      src: "/images/imagen3.jpeg",
      alt: "Momento romántico de la pareja 3",
    },
    {
      src: "/images/imagen5.jpeg",
      alt: "Momento romántico de la pareja 4",
    },
    {
      src: "/images/imagen1.jpeg",
      alt: "Momento romántico de la pareja 5",
    },
    {
      src: "/images/imagen8.jpeg",
      alt: "Momento romántico de la pareja 6",
    },
    {
      src: "/images/imagen9.jpeg",
      alt: "Momento romántico de la pareja 7",
    },
    {
      src: "/images/imagen10.jpeg",
      alt: "Momento romántico de la pareja 8",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // Autoplay effect
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 1500);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const setSlide = (idx: number) => {
    setCurrentIndex(idx);
  };

  return (
    <div className="w-full relative rounded-3xl overflow-hidden shadow-xl border border-gold-300/10 bg-white group select-none">

      {/* Slides Container (Aspect Ratio: 3/2 on desktop, 3/4 on mobile) */}
      <div className="relative w-full aspect-[3/4] md:aspect-[3/2] max-h-[500px] overflow-hidden">
        {images.map((img, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
          >
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover"
            />
            {/* Soft gold/dark gradient vignette overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10"></div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        aria-label="Imagen anterior"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/70 hover:bg-white text-gold-700 hover:text-gold-900 border border-gold-300/10 flex items-center justify-center shadow-md active:scale-95 transition-all duration-200 opacity-0 group-hover:opacity-100"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2.5">
          <path d="M15 18L9 12L15 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <button
        onClick={handleNext}
        aria-label="Siguiente imagen"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/70 hover:bg-white text-gold-700 hover:text-gold-900 border border-gold-300/10 flex items-center justify-center shadow-md active:scale-95 transition-all duration-200 opacity-0 group-hover:opacity-100"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2.5">
          <path d="M9 18L15 12L9 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setSlide(idx)}
            aria-label={`Ir a la imagen ${idx + 1}`}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === currentIndex
              ? "bg-[#c5a059] scale-125 shadow-sm"
              : "bg-white/50 hover:bg-white/80"
              }`}
          ></button>
        ))}
      </div>
    </div>
  );
}
