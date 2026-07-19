"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface GeneratedGuest {
  id: string;
  name: string;
  limit: number;
  url: string;
  timestamp: string;
}

export default function NoviosPage() {
  const [guestName, setGuestName] = useState("");
  const [companionLimit, setCompanionLimit] = useState(0);
  const [history, setHistory] = useState<GeneratedGuest[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [justGenerated, setJustGenerated] = useState<string | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("wedding_guest_links");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse guest links history", e);
      }
    }
  }, []);

  const saveHistory = (newHistory: GeneratedGuest[]) => {
    setHistory(newHistory);
    localStorage.setItem("wedding_guest_links", JSON.stringify(newHistory));
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const encodedName = encodeURIComponent(guestName.trim());
    const generatedUrl = `${origin}?to=${encodedName}&limit=${companionLimit}`;

    const newGuest: GeneratedGuest = {
      id: Math.random().toString(36).substr(2, 9),
      name: guestName.trim(),
      limit: companionLimit,
      url: generatedUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [newGuest, ...history];
    saveHistory(updatedHistory);

    // Auto-copy generated URL to clipboard
    navigator.clipboard.writeText(generatedUrl);
    setJustGenerated(generatedUrl);
    setCopiedId(newGuest.id);
    
    // Reset form inputs
    setGuestName("");
    setCompanionLimit(0);

    setTimeout(() => {
      setCopiedId(null);
      setJustGenerated(null);
    }, 3000);
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    saveHistory(updated);
  };

  const handleClearHistory = () => {
    if (window.confirm("¿Estás seguro de que deseas borrar todo el historial de enlaces?")) {
      saveHistory([]);
    }
  };

  return (
    <div className="w-full min-h-screen py-8 px-4 md:px-8 flex flex-col items-center justify-center bg-[#FAF6F0]">
      {/* Container Frame */}
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-gold-300/20 p-6 md:p-10 flex flex-col gap-6">
        
        {/* Header */}
        <div className="text-center">
          <h2 className="font-serif text-gold-500 text-sm tracking-[0.3em] font-semibold uppercase mb-1">
            Panel de Novios
          </h2>
          <h1 className="font-cursive text-gold-700 text-5xl md:text-6xl leading-none mt-1">
            Generador de Enlaces
          </h1>
          <div className="w-24 h-[1px] bg-gold-500 mx-auto my-3 opacity-60"></div>
          <p className="font-sans text-xs text-[#7A7160] max-w-md mx-auto">
            Crea links personalizados para tus invitados. Podrás asignar pases específicos para acompañantes y la invitación cargará automáticamente sus datos.
          </p>
        </div>

        {/* Generator Form */}
        <form onSubmit={handleGenerate} className="w-full flex flex-col gap-4 bg-[#FAF6F0] p-5 rounded-2xl border border-gold-300/10">
          <div className="flex flex-col gap-1">
            <label className="font-serif text-[11px] text-[#3D3526] uppercase font-bold tracking-wider">
              Nombre del Invitado / Familia
            </label>
            <input
              type="text"
              required
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Ej: Tía María y Familia, Juan Pérez, etc."
              className="w-full px-4 py-2.5 border border-gold-300/40 rounded-xl text-sm font-sans bg-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-serif text-[11px] text-[#3D3526] uppercase font-bold tracking-wider">
              Límite de Acompañantes Adicionales
            </label>
            <select
              value={companionLimit}
              onChange={(e) => setCompanionLimit(parseInt(e.target.value, 10))}
              className="w-full px-4 py-2.5 border border-gold-300/40 rounded-xl text-sm font-sans bg-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
            >
              <option value="0">0 (Pase Individual - Solo el invitado principal)</option>
              <option value="1">1 Acompañante (+ Invitado = 2 personas en total)</option>
              <option value="2">2 Acompañantes (+ Invitado = 3 personas en total)</option>
              <option value="3">3 Acompañantes (+ Invitado = 4 personas en total)</option>
              <option value="4">4 Acompañantes (+ Invitado = 5 personas en total)</option>
              <option value="5">5 Acompañantes (+ Invitado = 6 personas en total)</option>
              <option value="6">6 Acompañantes (+ Invitado = 7 personas en total)</option>
              <option value="7">7 Acompañantes (+ Invitado = 8 personas en total)</option>
              <option value="8">8 Acompañantes (+ Invitado = 9 personas en total)</option>
              <option value="9">9 Acompañantes (+ Invitado = 10 personas en total)</option>
              <option value="10">10 Acompañantes (+ Invitado = 11 personas en total)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-2 bg-gradient-to-r from-gold-600 to-gold-500 text-white rounded-xl text-xs md:text-sm font-bold uppercase tracking-[0.15em] shadow-md hover:from-gold-700 hover:to-gold-600 transition-all duration-300 transform active:scale-[0.98]"
          >
            Generar y Copiar Enlace
          </button>
        </form>

        {/* Dynamic Success Alert */}
        {justGenerated && (
          <div className="w-full p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs md:text-sm font-sans flex flex-col gap-1 transition-all animate-fade-in-up">
            <span className="font-semibold flex items-center gap-1.5">
              ✓ ¡Enlace copiado al portapapeles con éxito!
            </span>
            <span className="font-mono text-[10px] text-green-700 select-all overflow-x-auto whitespace-nowrap">
              {justGenerated}
            </span>
          </div>
        )}

        {/* History Table */}
        <div className="w-full flex flex-col gap-3">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <h3 className="font-serif text-[#3D3526] text-xs font-bold tracking-[0.15em] uppercase">
              Enlaces Generados ({history.length})
            </h3>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-[10px] text-red-600 hover:text-red-700 font-bold uppercase tracking-wider transition-colors"
              >
                Limpiar Todo
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="text-center py-6 text-xs font-sans text-gray-400">
              Aún no has generado ningún enlace. Escribe los datos arriba para comenzar.
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto pr-1 flex flex-col gap-2.5">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-gold-300/30 transition-all flex flex-col gap-1.5 relative group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-serif text-[#3D3526] text-sm font-bold leading-tight">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-gold-700 font-semibold tracking-wider uppercase mt-0.5">
                        Límite: {item.limit} acompañante(s) (máx: {item.limit + 1} personas)
                      </p>
                    </div>
                    <span className="text-[9px] text-gray-400 font-mono self-start mt-0.5">
                      {item.timestamp}
                    </span>
                  </div>

                  <div className="flex gap-2 w-full mt-1.5 items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-mono truncate max-w-[70%] select-all">
                      {item.url}
                    </span>

                    <div className="flex gap-2.5">
                      <button
                        onClick={() => handleCopy(item.url, item.id)}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded transition-colors ${
                          copiedId === item.id
                            ? "bg-green-100 text-green-700"
                            : "bg-gold-50 text-gold-700 hover:bg-gold-100"
                        }`}
                      >
                        {copiedId === item.id ? "¡Copiado!" : "Copiar"}
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back link */}
        <div className="text-center pt-2 border-t border-gray-100">
          <Link
            href="/"
            className="text-xs font-serif text-gold-600 hover:text-gold-700 font-semibold uppercase tracking-[0.25em]"
          >
            ← Volver a la Invitación
          </Link>
        </div>

      </div>
    </div>
  );
}
