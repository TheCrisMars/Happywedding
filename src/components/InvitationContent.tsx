"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import Countdown from "./Countdown";
import Timeline from "./Timeline";
import Carousel from "./Carousel";
import BackgroundMusic from "./BackgroundMusic";

export default function InvitationContent() {
  const searchParams = useSearchParams();

  // Local states for loaded guest data
  const [guestId, setGuestId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [companionLimit, setCompanionLimit] = useState(0);
  const [companionsCount, setCompanionsCount] = useState(0);

  // Attendance states
  const [isAttending, setIsAttending] = useState<boolean | null>(null); // null = pending, true = yes, false = no
  const [dbLoading, setDbLoading] = useState(true);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setGuestId(id);
      fetchGuestFromDb(id);
    } else {
      // Fallback to URL search parameters for static links
      const name = searchParams.get("to") || searchParams.get("name") || searchParams.get("invitado") || "";
      const limit = Math.max(0, parseInt(searchParams.get("limit") || "0", 10));
      setGuestName(name);
      setCompanionLimit(limit);
      setDbLoading(false);
    }
  }, [searchParams]);

  const fetchGuestFromDb = async (id: string) => {
    setDbLoading(true);
    setIsDeleted(false);
    try {
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error loading guest details:", error);
        if (error.code === "PGRST116") {
          setIsDeleted(true);
        } else {
          // General connection error fallback to query params
          const name = searchParams.get("to") || searchParams.get("name") || searchParams.get("invitado") || "";
          const limit = Math.max(0, parseInt(searchParams.get("limit") || "0", 10));
          if (name) {
            setGuestName(name);
            setCompanionLimit(limit);
          } else {
            setIsDeleted(true);
          }
        }
      } else if (data) {
        setGuestName(data.name);
        setCompanionLimit(data.max_companions);
        if (data.is_attending !== null) {
          setIsAttending(data.is_attending);
          setCompanionsCount(data.confirmed_companions || 0);
          setHasConfirmed(true);
        }
      }
    } catch (e) {
      console.error("Failed to load guest data:", e);
      setIsDeleted(true);
    } finally {
      setDbLoading(false);
    }
  };

  // WhatsApp confirmation pre-filled message
  const getWhatsAppUrl = () => {
    const defaultNum = "593987654321"; // Editable phone number
    let message = "";
    if (guestName) {
      if (isAttending === true) {
        if (companionLimit > 0) {
          if (companionsCount === 0) {
            message = `Hola! Confirmo mi asistencia a la boda de José Andrés y Daviushka. Soy ${guestName.trim()} e iré solo/a (total: 1 persona).`;
          } else {
            message = `Hola! Confirmo mi asistencia a la boda de José Andrés y Daviushka. Soy ${guestName.trim()} e iré con ${companionsCount} acompañante(s) (total: ${companionsCount + 1} personas).`;
          }
        } else {
          message = `Hola! Confirmo mi asistencia a la boda de José Andrés y Daviushka. Soy ${guestName.trim()} (total: 1 persona).`;
        }
      } else if (isAttending === false) {
        message = `Hola! Agradezco mucho la invitación, pero lamentablemente no podré asistir a la boda de José Andrés y Daviushka. Les deseo todo lo mejor.`;
      } else {
        message = `Hola! Quería ponerme en contacto por la boda de José Andrés y Daviushka. Soy ${guestName.trim()}.`;
      }
    } else {
      message = `Hola! Quería ponerme en contacto por la boda de José Andrés y Daviushka.`;
    }
    return `https://wa.me/${defaultNum}?text=${encodeURIComponent(message)}`;
  };

  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isAttending === null) return;

    setConfirming(true);
    try {
      if (guestId) {
        // Update existing guest record in Supabase
        const { error } = await supabase
          .from("guests")
          .update({
            is_attending: isAttending,
            confirmed_companions: isAttending === true ? companionsCount : 0,
            confirmed_at: new Date().toISOString()
          })
          .eq("id", guestId);

        if (error) {
          console.error("Error updating RSVP status:", error);
          alert("Hubo un problema al guardar tu confirmación en la base de datos.");
        } else {
          setHasConfirmed(true);
        }
      } else {
        // Insert new guest record (for static fallback links without pre-registration)
        const { error } = await supabase
          .from("guests")
          .insert([
            {
              name: guestName || "Invitado sin nombre",
              max_companions: companionLimit,
              is_attending: isAttending,
              confirmed_companions: isAttending === true ? companionsCount : 0,
              confirmed_at: new Date().toISOString()
            }
          ]);

        if (error) {
          console.error("Error inserting RSVP status:", error);
          alert("Hubo un problema al guardar tu confirmación en la base de datos.");
        } else {
          setHasConfirmed(true);
        }
      }
    } catch (err) {
      console.error("Failed to confirm attendance:", err);
      alert("Error al conectar con la base de datos.");
    } finally {
      setConfirming(false);
    }
  };

  if (isDeleted) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center p-4 bg-[#FAF6F0]">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-lg border border-gold-200/20 text-center flex flex-col items-center gap-5 animate-scale-up">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center border border-red-100 text-red-600 animate-pulse-soft">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>

          <div>
            <h3 className="font-serif text-[#3D3526] text-xl font-bold tracking-wider uppercase mb-1.5 text-center">
              Invitación Inactiva
            </h3>
            <p className="font-cursive text-gold-700 text-3xl leading-none my-2 text-center">
              Lo Sentimos
            </p>
            <p className="font-sans text-xs text-gray-500 leading-relaxed mt-3 max-w-[280px] mx-auto text-center">
              Esta invitación ha sido desactivada o eliminada. Si crees que se trata de un error, por favor ponte en contacto con los novios.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="animate-fade-in-up w-full min-h-screen py-4 md:py-8 px-4 md:px-6 lg:px-12 flex flex-col items-center">
      {/* Seamless Wide Container with Tight Spacing */}
      <div className="w-full max-w-5xl flex flex-col gap-6 md:gap-8">

        {/* ==================== PAGE 2: WELCOME ==================== */}
        <section className="relative w-full py-1 flex flex-col items-center">
          {/* Top Decorative Leaves */}
          <div className="absolute top-0 left-0 w-16 h-16 opacity-30 hidden md:block">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full stroke-gold-500" strokeWidth="1.5">
              <path d="M10,90 Q40,50 80,20 M80,20 Q60,30 40,60" />
            </svg>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 opacity-30 scale-x-[-1] hidden md:block">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full stroke-gold-500" strokeWidth="1.5">
              <path d="M10,90 Q40,50 80,20 M80,20 Q60,30 40,60" />
            </svg>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-center w-full">
            {/* Left side: Couple Photo */}
            <div className="md:col-span-5 flex justify-center w-full">
              <div className="relative w-full max-w-[260px] md:max-w-none aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border-[6px] border-white group">
                <img
                  src="/images/Imageprincipal.jpeg"
                  alt="José Andrés y Daviushka"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>

            {/* Right side: Text details */}
            <div className="md:col-span-7 flex flex-col items-center md:items-start text-center md:text-left">
              <h1 className="font-serif text-gold-700 text-3xl md:text-4xl font-bold tracking-[0.15em] uppercase leading-tight">
                Nuestra Boda
              </h1>
              <h2 className="font-serif text-gold-500 text-xl md:text-2xl font-medium tracking-[0.2em] uppercase mt-0.5 mb-2">
                Eclesiástica
              </h2>

              <div className="flex flex-col items-center md:items-start mb-2 w-full">
                <span className="font-serif text-gold-700 text-3xl md:text-4xl font-light tracking-[0.08em]">
                  07 / 08 / 2026
                </span>
                <div className="w-20 h-[1.5px] bg-gold-500 my-1.5 opacity-60"></div>
              </div>

              <h3 className="font-serif text-[#3D3526] text-2xl md:text-3xl font-bold tracking-[0.12em] uppercase leading-none">
                José Andrés Y
              </h3>
              <h3 className="font-serif text-[#3D3526] text-2xl md:text-3xl font-bold tracking-[0.12em] uppercase leading-none mt-1.5 mb-3">
                Daviushka
              </h3>

              <div className="inline-block px-3.5 py-1 border border-gold-300/30 rounded-full bg-gold-50 mb-2.5">
                <span className="font-serif text-gold-600 text-xs tracking-[0.25em] font-semibold uppercase">
                  Estás Invitado
                </span>
              </div>

              {/* Personalized Guest Welcome */}
              {guestName && (
                <div className="mb-3 font-serif text-[#3D3526] text-xl md:text-2xl font-bold tracking-wider border-b border-gold-300/40 pb-1 animate-pulse-soft">
                  {guestName.toUpperCase()}
                </div>
              )}

              <p className="font-cursive text-gold-700 text-4xl md:text-5xl leading-[1.1] max-w-[450px] mt-0.5">
                “Dos celebraciones, un mismo amor”
              </p>
            </div>
          </div>
        </section>

        {/* Elegant full-width divider */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-gold-500/20 to-transparent"></div>

        {/* ==================== PAGE 3: CALENDAR & COUNTDOWN ==================== */}
        <section className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center w-full">
            {/* Left Column: Calendar & Quote */}
            <div className="md:col-span-7 flex flex-col items-center w-full">
              <h3 className="font-serif text-[#3D3526] text-[16px] text-sm uppercase tracking-[0.25em] font-bold mb-3">
                El Gran Día
              </h3>

              <div className="w-full max-w-[300px] bg-[#c5a059] text-white rounded-xl shadow-lg p-4 flex flex-col items-center border border-gold-400 relative">
                <div className="absolute -top-3 -right-3 w-10 h-10 text-gold-200 opacity-80 pointer-events-none">
                  <svg viewBox="0 0 100 100" fill="none" className="w-full h-full stroke-current" strokeWidth="2.5">
                    <path d="M10,90 Q40,50 80,20 M80,20 Q60,30 40,60" />
                  </svg>
                </div>

                <div className="font-serif text-sm uppercase tracking-[0.3em] font-semibold mb-2">
                  Agosto 2026
                </div>

                {/* Days of Week */}
                <div className="grid grid-cols-7 w-full gap-y-2 text-center text-[10px] font-sans font-bold tracking-widest opacity-95 border-b border-white/20 pb-1 mb-2">
                  <span>LUN</span>
                  <span>MAR</span>
                  <span>MIE</span>
                  <span>JUE</span>
                  <span>VIE</span>
                  <span>SAB</span>
                  <span>DOM</span>
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 w-full gap-y-2 text-center text-xs font-sans font-medium">
                  <span className="opacity-0"></span>
                  <span className="opacity-0"></span>
                  <span className="opacity-0"></span>
                  <span className="opacity-0"></span>
                  <span className="opacity-0"></span>
                  <span className="flex items-center justify-center h-5 w-5 mx-auto">1</span>
                  <span className="flex items-center justify-center h-5 w-5 mx-auto">2</span>

                  <span className="flex items-center justify-center h-5 w-5 mx-auto">3</span>
                  <span className="flex items-center justify-center h-5 w-5 mx-auto">4</span>
                  <span className="flex items-center justify-center h-5 w-5 mx-auto">5</span>
                  <span className="flex items-center justify-center h-5 w-5 mx-auto">6</span>

                  {/* Day 7 Highlighted */}
                  <span className="relative flex items-center justify-center h-5 w-5 mx-auto font-bold text-[#c5a059]">
                    <span className="absolute inset-0 flex items-center justify-center scale-[1.3] text-white">
                      <svg viewBox="0 0 24 24" className="w-full h-full fill-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </span>
                    <span className="relative z-10 text-[9px] -mt-[1px]">7</span>
                  </span>

                  <span className="flex items-center justify-center h-5 w-5 mx-auto">8</span>
                  <span className="flex items-center justify-center h-5 w-5 mx-auto">9</span>

                  <span className="flex items-center justify-center h-5 w-5 mx-auto">10</span>
                  <span className="flex items-center justify-center h-5 w-5 mx-auto">11</span>
                  <span className="flex items-center justify-center h-5 w-5 mx-auto">12</span>
                  <span className="flex items-center justify-center h-5 w-5 mx-auto">13</span>
                  <span className="flex items-center justify-center h-5 w-5 mx-auto">14</span>
                  <span className="flex items-center justify-center h-5 w-5 mx-auto">15</span>
                  <span className="flex items-center justify-center h-5 w-5 mx-auto">16</span>

                  <span className="flex items-center justify-center h-5 w-5 mx-auto">17</span>
                  <span className="flex items-center justify-center h-5 w-5 mx-auto">18</span>
                  <span className="flex items-center justify-center h-5 w-5 mx-auto">19</span>
                  <span className="flex items-center justify-center h-5 w-5 mx-auto">20</span>
                  <span className="flex items-center justify-center h-5 w-5 mx-auto">21</span>
                  <span className="flex items-center justify-center h-5 w-5 mx-auto">22</span>
                  <span className="flex items-center justify-center h-5 w-5 mx-auto">23</span>

                  <span className="flex items-center justify-center h-5 w-5 mx-auto">24</span>
                  <span className="flex items-center justify-center h-5 w-5 mx-auto">25</span>
                  <span className="flex items-center justify-center h-5 w-5 mx-auto">26</span>
                  <span className="flex items-center justify-center h-5 w-5 mx-auto">27</span>
                  <span className="flex items-center justify-center h-5 w-5 mx-auto">28</span>
                  <span className="flex items-center justify-center h-5 w-5 mx-auto">29</span>
                  <span className="flex items-center justify-center h-5 w-5 mx-auto">30</span>

                  <span className="flex items-center justify-center h-5 w-5 mx-auto">31</span>
                </div>
              </div>

              {/* Responsive Elegant Cursive Text Size (Not overly large, tightly spaced) */}
              <p className="font-cursive text-[22px] text-gold-700 text-2.5xl md:text-3.5xl text-center leading-normal max-w-[360px] mt-3">
                Con la bendición y el amor de Dios. Él escribió nuestra historia, y queremos que seas parte de este hermoso día.
              </p>
            </div>

            {/* Right Column: Rings & Countdown */}
            <div className="md:col-span-5 flex flex-col items-center w-full gap-3">
              <div className="w-full max-w-[320px] md:max-w-none aspect-[16/10] rounded-xl overflow-hidden border border-gold-300/10 shadow-lg">
                <img
                  src="/images/rings.png"
                  alt="Anillos de boda"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="w-full">
                <Countdown />
              </div>
            </div>
          </div>
        </section>

        {/* Elegant full-width divider */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-gold-500/20 to-transparent"></div>

        {/* ==================== PAGE 4: DRESS CODE & LOCATIONS ==================== */}
        <section className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start w-full">

            {/* Left side: Dress Code (5 columns) */}
            <div className="md:col-span-5 flex flex-col items-center w-full text-center">
              <h3 className="font-serif text-gold-700 text-xl font-bold tracking-[0.2em] uppercase mb-1">
                Código de vestimenta
              </h3>
              <h4 className="font-serif text-gold-500 text-sm tracking-[0.3em] font-semibold uppercase mb-3">
                Formal
              </h4>

              <div className="w-full flex justify-center mb-3">
                <img
                  src="/images/dress-code.png"
                  alt="Código de vestimenta y colores prohibidos"
                  className="w-full max-w-[260px] md:max-w-[290px] h-auto object-contain rounded-xl shadow-sm border border-gold-300/10"
                />
              </div>

              {/* Description */}
              <div className="text-center font-sans text-sm md:text-base text-[#4E4739] leading-relaxed w-full flex flex-col gap-1 max-w-[290px] mx-auto">
                <p>
                  <strong className="text-[#3D3526]">Mujeres:</strong> Evitar los colores blanco, beige y dorado.
                </p>
                <p>
                  <strong className="text-[#3D3526]">Hombre:</strong> Evitar el color blanco, beige y dorado.
                </p>
              </div>
            </div>

            {/* Right side: Locations (7 columns) */}
            <div className="md:col-span-7 w-full flex flex-col gap-4 md:border-l md:border-gold-300/20 md:pl-8">

              <div className="w-full flex items-center justify-center md:hidden my-1 select-none">
                <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-[#c5a059] opacity-35"></div>
                <span className="text-gold-500 mx-2 text-xs">♥</span>
                <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-[#c5a059] opacity-35"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                {/* Location 1: Ceremonia */}
                <div className="flex flex-col items-center text-center w-full">
                  <div className="w-8 h-8 mb-1 opacity-85">
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-gold-700" strokeWidth="1.5">
                      <path d="M30,85 C30,60 50,55 50,55 M70,85 C70,60 50,55 50,55 M50,55 V40" />
                      <circle cx="50" cy="30" r="10" />
                      <path d="M45,28 Q50,22 55,28" strokeWidth="1" />
                    </svg>
                  </div>

                  <h4 className="font-cursive text-gold-700 text-4xl md:text-5xl leading-none">
                    Ceremonia Religiosa
                  </h4>
                  <span className="font-sans text-[12px] md:text-[13px] text-gold-600 font-bold uppercase tracking-widest mt-0.5 mb-0.5">
                    18:00 pm
                  </span>
                  <h5 className="font-serif text-[#3D3526] text-sm md:text-base font-bold tracking-wider uppercase mb-2">
                    IGLESIA DOLOROSA
                  </h5>

                  <a
                    href="https://maps.app.goo.gl/TsCMUCir4UooshzLA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-1 rounded-full border border-gold-500 text-gold-700 text-[10px] md:text-xs font-semibold uppercase tracking-widest hover:bg-gold-500 hover:text-white transition-colors duration-300 shadow-sm"
                  >
                    Ver Ubicación
                  </a>
                </div>

                {/* Location 2: Recepción */}
                <div className="flex flex-col items-center text-center w-full">
                  <div className="w-8 h-8 mb-1 opacity-85">
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-gold-700" strokeWidth="1.5">
                      <path d="M40,55 L48,25 M60,55 L52,25" />
                      <path d="M35,28 L45,45 L45,65 M65,28 L55,45 L55,65" />
                      <path d="M40,65 H60" strokeLinecap="round" />
                      <circle cx="48" cy="20" r="1.5" className="fill-gold-600 stroke-none" />
                      <circle cx="52" cy="18" r="1" className="fill-gold-600 stroke-none" />
                    </svg>
                  </div>

                  <h4 className="font-cursive text-gold-700 text-4xl md:text-5xl leading-none">
                    Recepción
                  </h4>
                  <span className="font-sans text-[12px] md:text-[13px] text-gold-600 font-bold uppercase tracking-widest mt-0.5 mb-0.5">
                    19:00 pm
                  </span>
                  <h5 className="font-serif text-[#3D3526] text-sm md:text-base font-bold tracking-wider uppercase mb-0.5">
                    SALA DE EVENTOS "MAGIC MOMENTS"
                  </h5>
                  <p className="font-sans text-[11px] md:text-xs text-[#625B4C] tracking-wide leading-relaxed mb-2 max-w-[220px]">
                    Av. Las Acacias entre calles de 10 de Agosto y 7 de Mayo
                  </p>

                  <a
                    href="https://maps.app.goo.gl/KPGi1rnihxczdK6X8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-1 rounded-full border border-gold-500 text-gold-700 text-[10px] md:text-xs font-semibold uppercase tracking-widest hover:bg-gold-500 hover:text-white transition-colors duration-300 shadow-sm"
                  >
                    Ver Ubicación
                  </a>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Elegant full-width divider */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-gold-500/20 to-transparent"></div>

        {/* ==================== PAGE 5: ITINERARY ==================== */}
        <section className="w-full flex flex-col items-center">
          <h3 className="font-serif text-gold-700 text-xl font-bold tracking-[0.2em] text-center uppercase mb-3">
            Itinerario de Actividades
          </h3>
          <div className="w-full max-w-4xl">
            <Timeline />
          </div>
        </section>

        {/* Elegant full-width divider */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-gold-500/20 to-transparent"></div>

        {/* ==================== PAGE 6: GIFTS & CONFIRMATION ==================== */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">

          {/* Sugerencia de regalo card */}
          <div className="bg-[#FCFBF9] border border-gold-300/10 rounded-2xl shadow-lg p-4 md:p-6 flex flex-col items-center text-center">
            <div className="w-8 h-8 mb-1.5 text-gold-700">
              <svg viewBox="0 0 64 64" fill="none" className="w-full h-full stroke-current" strokeWidth="1.5">
                <rect x="12" y="24" width="40" height="32" rx="2" />
                <path d="M8 16H56V24H8V16Z" />
                <path d="M32 16V56" />
                <path d="M32 16C32 16 26 8 22 8C18 8 16 11 18 14C20 17 32 16 32 16Z" />
                <path d="M32 16C32 16 38 8 42 8C46 8 48 11 46 14C44 17 32 16 32 16Z" />
              </svg>
            </div>

            <h3 className="font-cursive text-gold-700 text-4xl leading-none mb-1.5">
              Sugerencia de regalo
            </h3>

            <p className="font-sans text-sm md:text-base text-[#4E4739] leading-relaxed mb-3 max-w-[260px]">
              El mejor regalo es tu presencia, pero si deseas tener un detalle con nosotros, les dejamos esta opción:
            </p>

            <div className="flex flex-col items-center">
              <svg viewBox="0 0 64 64" className="w-8 h-8 stroke-gold-700 fill-none mb-1" strokeWidth="1.5">
                <rect x="10" y="20" width="44" height="28" rx="2" />
                <path d="M10 20L32 36L54 20" />
                <circle cx="32" cy="28" r="4" className="fill-gold-100" />
                <path d="M32 26V30" />
              </svg>
              <h4 className="font-serif text-[#3D3526] text-[14px] text-xs font-bold tracking-[0.2em] uppercase">
                LLUVIA DE SOBRES
              </h4>
            </div>
          </div>

          {/* RSVP Confirmation card */}
          <div className="bg-[#FCFBF9] border border-gold-300/10 rounded-2xl shadow-lg p-4 md:p-6 flex flex-col items-center text-center">
            <div className="w-8 h-8 mb-1.5 text-gold-700">
              <svg viewBox="0 0 64 64" fill="none" className="w-full h-full stroke-current" strokeWidth="1.5">
                <path d="M18 48C18 41.3 24.3 36 32 36C39.7 36 46 41.3 46 48" strokeLinecap="round" />
                <circle cx="32" cy="22" r="8" />
                <path d="M48 24L52 28L60 20" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h3 className="font-cursive text-gold-700 text-4xl leading-none mb-1.5">
              Confirmación
            </h3>

            {hasConfirmed ? (
              // Beautiful Direct Success Screen (Direct on-page confirmation)
              <div className="flex flex-col items-center gap-4 text-center py-4 w-full animate-fade-in-up">
                {/* Heart/Check icon */}
                <div className="w-16 h-16 rounded-full bg-gold-50 flex items-center justify-center border border-gold-200 shadow-inner animate-pulse-soft">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-gold-600">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>

                <div>
                  <h4 className="font-serif text-[#3D3526] text-xs tracking-[0.2em] font-semibold uppercase mb-0.5">
                    {guestName || "¡Muchas Gracias!"}
                  </h4>
                  <h3 className="font-cursive text-gold-700 text-3xl leading-none my-2">
                    {isAttending ? "¡Nos vemos en la boda!" : "Confirmación Recibida"}
                  </h3>
                  <p className="font-sans text-xs text-[#7A7160] leading-relaxed max-w-[260px] mx-auto mt-2">
                    {isAttending
                      ? `Tu respuesta ha sido guardada en la base de datos. Esperamos compartir este día contigo el 7 de Agosto del 2026.`
                      : `Lamentamos mucho que no puedas asistir. Tu respuesta ha sido guardada en nuestra lista de invitados.`}
                  </p>
                </div>

                <button
                  onClick={() => setHasConfirmed(false)}
                  className="mt-2 text-[9px] font-sans font-bold text-gold-600 hover:text-gold-700 uppercase tracking-widest cursor-pointer border-b border-dashed border-gold-400"
                >
                  ¿Deseas modificar tu respuesta?
                </button>
              </div>
            ) : (
              // RSVP Selection Form
              <>
                {/* Personalized RSVP Text & Companion Info */}
                <div className="font-sans text-sm md:text-base text-[#4E4739] leading-relaxed mb-3 max-w-[280px] flex flex-col items-center gap-2">
                  <p>
                    {guestName ? (
                      <>Agradecemos que confirmes tu asistencia, <strong className="text-[#3D3526]">{guestName}</strong>, hasta el Miércoles 22 de Julio.</>
                    ) : (
                      "Agradecemos que confirmes tu asistencia hasta el Miércoles 22 de Julio."
                    )}
                  </p>
                  {guestName && (
                    <span className="text-[11px] font-semibold text-gold-700 uppercase tracking-wider bg-gold-50 px-2.5 py-0.5 rounded-full border border-gold-300/20">
                      {companionLimit > 0 ? `Pase para ti y hasta ${companionLimit} acompañante(s)` : "Pase Individual (1 Persona)"}
                    </span>
                  )}
                </div>

                {/* Combined Attendance & Companion Dropdown */}
                {guestName && (
                  <div className="flex flex-col items-center gap-1.5 w-full max-w-[280px] mb-3.5 animate-fade-in-up">
                    <label className="font-serif text-[10px] text-[#7A7160] uppercase font-bold tracking-widest leading-none">
                      ¿Cómo confirmarás tu asistencia?
                    </label>
                    <select
                      value={
                        isAttending === null
                          ? ""
                          : isAttending === false
                            ? "no"
                            : `yes_${companionsCount}`
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setIsAttending(null);
                          setCompanionsCount(0);
                        } else if (val === "no") {
                          setIsAttending(false);
                          setCompanionsCount(0);
                        } else if (val.startsWith("yes_")) {
                          setIsAttending(true);
                          const count = parseInt(val.replace("yes_", ""), 10);
                          setCompanionsCount(count);
                        }
                      }}
                      className="w-full px-3.5 py-2 border border-gold-300/40 rounded-xl text-xs font-sans bg-white focus:outline-none focus:border-gold-500 text-[#4E4739] text-center cursor-pointer shadow-sm focus:ring-1 focus:ring-gold-500"
                    >
                      <option value="">Elige una opción...</option>

                      {companionLimit === 0 ? (
                        // Individual pass
                        <>
                          <option value="yes_0">Sí, asistiré</option>
                        </>
                      ) : (
                        // Pass with companions
                        <>
                          <option value="yes_0">Sí, asistiré solo/a</option>
                          {Array.from({ length: companionLimit }, (_, i) => {
                            const count = i + 1;
                            return (
                              <option key={count} value={`yes_${count}`}>
                                Sí, asistiré con {count} acompañante{count > 1 ? "s" : ""}
                              </option>
                            );
                          })}
                        </>
                      )}

                      <option value="no">No podré asistir</option>
                    </select>
                  </div>
                )}

                <button
                  onClick={handleConfirm}
                  disabled={isAttending === null || confirming}
                  className={`w-full max-w-[280px] py-3 text-center text-white rounded-lg text-xs md:text-sm font-bold uppercase tracking-[0.15em] shadow-md transition-all duration-300 transform active:scale-[0.98] ${isAttending === null || confirming
                    ? "bg-gray-300 cursor-not-allowed opacity-70 pointer-events-none"
                    : "bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-700 hover:to-gold-600 animate-[pulseSoft_3s_infinite] cursor-pointer"
                    }`}
                >
                  {confirming ? "Guardando..." : "Confirmar asistencia"}
                </button>
              </>
            )}

            <span className="font-serif text-[#3D3526] text-[18px] font-bold tracking-[0.2em] uppercase mt-3">
              INVITACIÓN NO TRANSFERIBLE
            </span>
          </div>

        </section>

        {/* Elegant full-width divider */}
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-gold-500/20 to-transparent"></div>

        {/* ==================== PAGE 7: RECOMMENDATIONS & SIN NIÑOS ==================== */}
        <section className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full items-start">

            {/* Recommendations List */}
            <div className="flex flex-col items-center md:items-start w-full">
              <div className="w-full flex items-center justify-center mb-3 select-none">
                <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-gold-500 opacity-65"></div>
                <span className="text-gold-500 mx-3 text-xs">♥</span>
                <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-gold-500 opacity-65"></div>
              </div>
              <h3 className="font-serif text-gold-700 text-xl font-bold tracking-[0.15em] uppercase mb-4 text-center md:text-left w-full">
                Recomendaciones
              </h3>

              <ol className="font-sans text-sm md:text-base text-[#4E4739] text-left leading-relaxed flex flex-col gap-2.5 list-decimal pl-5 w-full">
                <li>
                  Al ingresar, le invitamos a acercarse a recepción, donde se le indicará el número de mesa asignado.
                </li>
                <li>
                  Que esta noche sea tan inolvidable para ti como lo será para nosotros.
                </li>
                <li>
                  Ser Puntuales.
                </li>
              </ol>
            </div>

            {/* Sin Niños and Gracias */}
            <div className="flex flex-col items-center w-full md:border-l md:border-gold-300/20 md:pl-8">
              <div className="w-full flex items-center justify-center mb-3 select-none">
                <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-gold-500 opacity-65"></div>
                <span className="text-gold-500 mx-3 text-xs">♥</span>
                <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-gold-500 opacity-65"></div>
              </div>
              <h3 className="font-serif text-gold-700 text-xl font-bold tracking-[0.15em] uppercase mb-4 text-center">
                Sin Niños
              </h3>

              <p className="font-sans text-sm md:text-base text-[#4E4739] text-center leading-relaxed mb-3 max-w-[320px]">
                Es nuestro día especial, y aunque amamos a los niños, nuestra boda será solo adultos, queremos que estén sin preocupaciones.
                <span className="font-bold text-gold-700 mt-1 block">¡Tómense un descanso y disfruten con nosotros!</span>
              </p>

              <h4 className="font-serif text-gold-500 text-sm font-semibold uppercase tracking-[0.2em] text-center mb-0.5">
                Esperamos Contar Con Su Presencia
              </h4>

              <h3 className="font-cursive text-gold-700 text-5xl md:text-6xl text-center leading-none mt-1">
                ¡Muchas Gracias!
              </h3>
            </div>

          </div>
        </section>

        {/* ==================== BOTTOM INTERACTIVE GALLERY CAROUSEL ==================== */}
        <section className="w-full">
          <Carousel />
        </section>

      </div>
      </div>
      <BackgroundMusic />
    </>
  );
}
