"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { supabase } from "@/utils/supabase";

interface Guest {
  id: string;
  name: string;
  max_companions: number;
  confirmed_companions: number;
  is_attending: boolean | null; // null = pending, true = attending, false = declined
  confirmed_at: string | null;
  created_at: string;
}

export default function NoviosPage() {
  const [guestName, setGuestName] = useState("");
  const [companionLimit, setCompanionLimit] = useState(0);
  const [guestsList, setGuestsList] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [justGenerated, setJustGenerated] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorState, setErrorState] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Autocomplete states
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [autocompleteInput, setAutocompleteInput] = useState("");

  // Admin RSVP manual editing states
  const [editingRsvpGuest, setEditingRsvpGuest] = useState<Guest | null>(null);
  const [editingAttending, setEditingAttending] = useState<boolean | null>(null);
  const [editingCompanions, setEditingCompanions] = useState<number>(0);

  // Custom alert/confirm dialog states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>("");
  const [customAlert, setCustomAlert] = useState<{ message: string; title?: string } | null>(null);

  // Load guests from Supabase on mount and subscribe to realtime changes
  useEffect(() => {
    fetchGuests();

    // Subscribe to realtime database changes on the 'guests' table
    const channel = supabase
      .channel("guests-realtime-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "guests"
        },
        () => {
          fetchGuests(); // Refresh table and stats automatically
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchGuests = async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching guests:", error);
        setErrorState(error.message || "Error al conectar con Supabase");
      } else if (data) {
        setGuestsList(data);
      }
    } catch (e: any) {
      console.error("Failed to load guests:", e);
      setErrorState(e.message || "No se pudo conectar a la base de datos de Supabase.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    try {
      // Insert new guest into Supabase
      const { data, error } = await supabase
        .from("guests")
        .insert([
          {
            name: guestName.trim(),
            max_companions: companionLimit,
            is_attending: null, // Starts as pending
            confirmed_companions: 0
          }
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating guest in Supabase:", error);
        setCustomAlert({
          title: "Error al guardar",
          message: "Hubo un problema al registrar la invitación en la base de datos."
        });
        return;
      }

      if (data) {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const generatedUrl = `${origin}?id=${data.id}`;

        // Auto-copy generated URL to clipboard
        navigator.clipboard.writeText(generatedUrl);
        setJustGenerated(generatedUrl);
        setCopiedId(data.id);
        
        // Reset form inputs
        setGuestName("");
        setCompanionLimit(0);

        // Refresh list
        fetchGuests();

        setTimeout(() => {
          setCopiedId(null);
          setJustGenerated(null);
        }, 4000);
      }
    } catch (err) {
      console.error("Failed to handle generate link:", err);
    }
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const triggerDeleteConfirm = (id: string, name: string) => {
    setDeleteConfirmId(id);
    setDeleteConfirmName(name);
  };

  // Calculate stats
  const totalInvitations = guestsList.length;
  const totalAttending = guestsList.filter((g) => g.is_attending === true).length;
  const totalDeclined = guestsList.filter((g) => g.is_attending === false).length;
  const totalPending = guestsList.filter((g) => g.is_attending === null).length;

  // Sum: 1 (main guest) + companions confirmed, for all who confirmed attendance
  const totalConfirmedPeople = guestsList.reduce((acc, curr) => {
    if (curr.is_attending === true) {
      return acc + 1 + (curr.confirmed_companions || 0);
    }
    return acc;
  }, 0);

  // Filter list by search term
  const filteredGuests = guestsList.filter((guest) =>
    guest.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredGuests.length / itemsPerPage);
  const indexOfLastGuest = currentPage * itemsPerPage;
  const indexOfFirstGuest = indexOfLastGuest - itemsPerPage;
  const currentGuests = filteredGuests.slice(indexOfFirstGuest, indexOfLastGuest);

  // Helper to generate page numbers with ellipses (Shadcn style)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }
      if (start > 2) {
        pages.push("ellipsis-1");
      }
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (end < totalPages - 1) {
        pages.push("ellipsis-2");
      }
      pages.push(totalPages);
    }
    return pages;
  };

  const downloadExcel = () => {
    // 1. Prepare data rows (without Fecha de Respuesta)
    const data = guestsList.map((guest) => ({
      "Invitado / Familia": guest.name,
      "Cupos Asignados (Pases)": guest.max_companions + 1,
      "Estado Asistencia": guest.is_attending === null
        ? "Pendiente"
        : guest.is_attending
        ? "Confirmado (Asistirá)"
        : "Rechazado (No Asistirá)",
      "Acompañantes Confirmados": guest.is_attending === true ? guest.confirmed_companions : 0,
      "Total Asistentes": guest.is_attending === true ? guest.confirmed_companions + 1 : guest.is_attending === false ? 0 : 0
    }));

    // 2. Create worksheet from JSON
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 3. Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invitados");

    // 4. Generate buffer and download native xlsx file
    XLSX.writeFile(workbook, `lista_invitados_boda_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="w-full min-h-screen py-8 px-4 md:px-8 flex flex-col items-center justify-start bg-[#FAF6F0] gap-6">
      
      {/* 1. Header (Navbar back link) */}
      <div className="w-full max-w-6xl flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white px-6 py-4 rounded-3xl shadow-sm border border-gold-200/20 gap-4">
        <div>
          <h1 className="font-serif text-[#3D3526] text-xl font-bold tracking-wider uppercase">
            Panel de Novios
          </h1>
          <p className="font-sans text-[11px] text-[#7A7160] mt-0.5">
            Control de asistencia y generación de enlaces de invitación en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <button
            onClick={downloadExcel}
            className="w-full sm:w-auto text-center px-4 py-2 bg-white border border-green-600/30 hover:bg-green-50 text-green-700 rounded-xl text-xs font-serif font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
              <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z" />
            </svg>
            Descargar Excel
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto text-center px-4 py-2 border border-gold-300/40 hover:bg-gold-50/50 text-gold-700 rounded-xl text-xs font-serif font-bold uppercase tracking-wider transition-colors"
          >
            ← Volver a la Invitación
          </Link>
        </div>
      </div>

      {/* Error state card */}
      {errorState && (
        <div className="w-full max-w-6xl bg-yellow-50 border border-yellow-300 text-yellow-800 p-5 rounded-2xl flex flex-col gap-2.5 font-sans text-xs shadow-sm animate-fade-in-up">
          <span className="font-bold uppercase tracking-wider text-yellow-900 flex items-center gap-1.5">
            ⚠️ CONFIGURACIÓN DE SUPABASE REQUERIDA
          </span>
          <p>
            No se pudo establecer conexión con tu base de datos de Supabase. Sigue estos pasos para configurarla localmente:
          </p>
          <ol className="list-decimal pl-5 flex flex-col gap-1.5 text-yellow-900 font-medium">
            <li>Crea un archivo de texto llamado <strong>.env.local</strong> en la carpeta raíz del proyecto.</li>
            <li>Copia y pega la estructura provista en <strong>.env.local.example</strong> en ese nuevo archivo.</li>
            <li>Ingresa a tu cuenta de Supabase, copia el <strong>Project URL</strong> y el <strong>Anon Public Key</strong> (desde Settings ➔ API) y colócalos en el archivo.</li>
            <li>Reinicia el servidor de desarrollo deteniendo la terminal actual con <code>Ctrl + C</code> y ejecutando nuevamente <code>npm run dev</code> o <code>pnpm dev</code>.</li>
          </ol>
        </div>
      )}

      {/* 2. Stats Grid */}
      <div className="w-full max-w-6xl grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Total Invites */}
        <div className="bg-white rounded-2xl p-4 border border-gold-200/20 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[9px] font-sans font-bold text-gray-400 uppercase tracking-widest">
            Invitaciones
          </span>
          <span className="text-2xl font-serif font-bold text-[#3D3526] mt-1">
            {totalInvitations}
          </span>
        </div>

        {/* Confirmed Invites (Attending) */}
        <div className="bg-white rounded-2xl p-4 border border-gold-200/20 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[9px] font-sans font-bold text-green-600 uppercase tracking-widest">
            Aceptaron (Sí)
          </span>
          <span className="text-2xl font-serif font-bold text-green-700 mt-1">
            {totalAttending}
          </span>
        </div>

        {/* Total People Attending */}
        <div className="bg-white rounded-2xl p-4 border border-gold-400/40 shadow-sm flex flex-col items-center justify-center text-center col-span-2 md:col-span-1">
          <span className="text-[9px] font-sans font-bold text-gold-700 uppercase tracking-widest">
            Total Asistentes
          </span>
          <span className="text-2xl font-serif font-bold text-gold-700 mt-1">
            {totalConfirmedPeople}
          </span>
        </div>

        {/* Declined */}
        <div className="bg-white rounded-2xl p-4 border border-gold-200/20 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[9px] font-sans font-bold text-red-600 uppercase tracking-widest">
            Rechazaron (No)
          </span>
          <span className="text-2xl font-serif font-bold text-red-700 mt-1">
            {totalDeclined}
          </span>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-2xl p-4 border border-gold-200/20 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[9px] font-sans font-bold text-yellow-600 uppercase tracking-widest">
            Pendientes
          </span>
          <span className="text-2xl font-serif font-bold text-yellow-700 mt-1">
            {totalPending}
          </span>
        </div>
      </div>

      {/* 3. Horizontal Link Generator */}
      <div className="w-full max-w-6xl bg-white p-5 md:p-6 rounded-3xl border border-gold-200/20 shadow-sm flex flex-col gap-4">
        <h3 className="font-serif text-[#3D3526] text-xs font-bold tracking-widest uppercase">
          Crear Nuevo Pase de Invitación
        </h3>
        
        <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4 items-end w-full">
          <div className="flex-1 flex flex-col gap-1.5 w-full">
            <label className="font-serif text-[9px] text-[#7A7160] uppercase font-bold tracking-wider leading-none">
              Invitado / Familia
            </label>
            <input
              type="text"
              required
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Ej: Tía María y Familia"
              className="w-full px-3.5 py-2 border border-gray-200 rounded-md text-xs font-sans bg-white focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 h-9 transition-colors text-gray-700 shadow-sm"
            />
          </div>

          <div className="w-full md:w-64 flex flex-col gap-1.5">
            <label className="font-serif text-[9px] text-[#7A7160] uppercase font-bold tracking-wider leading-none">
              Límite de Acompañantes
            </label>
            <select
              value={companionLimit}
              onChange={(e) => setCompanionLimit(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs font-sans bg-white focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 cursor-pointer h-9 text-gray-700 transition-colors shadow-sm"
            >
              <option value="0">Pase Individual (Sin acompañantes)</option>
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Permitir {i + 1} acompañante{i > 0 ? "s" : ""} adicional{i > 0 ? "es" : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full md:w-52 bg-gold-600 hover:bg-gold-700 text-white rounded-md text-xs font-medium shadow transition-colors cursor-pointer h-9 flex items-center justify-center"
          >
            Generar Invitación
          </button>
        </form>

        {/* Success Alert */}
        {justGenerated && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-[11px] font-sans flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in-up">
            <span className="font-semibold flex items-center gap-1">
              ✓ ¡Enlace copiado al portapapeles!
            </span>
            <span className="font-mono text-[9.5px] text-green-700 select-all overflow-x-auto whitespace-nowrap bg-white px-2.5 py-1 rounded border border-green-200 w-full sm:w-auto sm:flex-1 sm:text-right max-w-xl">
              {justGenerated}
            </span>
          </div>
        )}
      </div>

      {/* 4. Table Section */}
      <div className="w-full max-w-6xl bg-white rounded-3xl border border-gold-200/20 shadow-sm p-5 md:p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-4">
          <div>
            <h3 className="font-serif text-[#3D3526] text-sm font-bold tracking-wider uppercase">
              Lista General de Invitados
            </h3>
            <p className="font-sans text-[10px] text-gray-400 mt-0.5">
              Administración de respuestas y enlaces individuales.
            </p>
          </div>
          
          <div className="relative w-full sm:w-64 z-30">
            {/* Autocomplete Input */}
            <div className="relative flex items-center w-full">
              <input
                type="text"
                value={autocompleteInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setAutocompleteInput(val);
                  setSearchTerm(val);
                  setCurrentPage(1);
                  setIsAutocompleteOpen(true);
                }}
                onFocus={() => setIsAutocompleteOpen(true)}
                placeholder="Buscar invitado..."
                className="px-3 py-1.5 pr-8 border border-gray-200 rounded-xl text-xs font-sans bg-[#FAF6F0]/40 focus:outline-none focus:border-gold-500 w-full h-8 text-[#4E4739]"
              />
              
              {autocompleteInput && (
                <button
                  type="button"
                  onClick={() => {
                    setAutocompleteInput("");
                    setSearchTerm("");
                    setCurrentPage(1);
                    setIsAutocompleteOpen(false);
                  }}
                  className="absolute right-2.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {isAutocompleteOpen && (
              <>
                {/* Click-away overlay */}
                <div className="fixed inset-0 z-20" onClick={() => setIsAutocompleteOpen(false)} />
                
                {/* Suggestions list popup */}
                <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-lg z-30 py-1 animate-fade-in divide-y divide-gray-50">
                  {autocompleteInput && (
                    <div
                      onClick={() => {
                        setAutocompleteInput("");
                        setSearchTerm("");
                        setCurrentPage(1);
                        setIsAutocompleteOpen(false);
                      }}
                      className="px-3 py-2 text-[10px] font-sans text-gray-400 hover:bg-[#FAF6F0]/40 cursor-pointer font-bold uppercase tracking-wider transition-colors text-left"
                    >
                      Mostrar Todos
                    </div>
                  )}

                  {/* Suggestion items */}
                  {guestsList
                    .filter((g) => g.name.toLowerCase().includes(autocompleteInput.toLowerCase()))
                    .slice(0, 10)
                    .map((guest) => (
                      <div
                        key={guest.id}
                        onClick={() => {
                          setAutocompleteInput(guest.name);
                          setSearchTerm(guest.name);
                          setCurrentPage(1);
                          setIsAutocompleteOpen(false);
                        }}
                        className="px-3 py-2 text-xs font-sans text-gray-700 hover:bg-gold-50 hover:text-gold-900 cursor-pointer transition-colors text-left font-semibold"
                      >
                        {guest.name}
                      </div>
                    ))}

                  {/* Empty Suggestions state */}
                  {guestsList.filter((g) => g.name.toLowerCase().includes(autocompleteInput.toLowerCase())).length === 0 && (
                    <div className="px-3 py-2 text-xs font-sans text-gray-400 text-center select-none">
                      Sin resultados
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs font-sans text-gold-600 font-semibold uppercase tracking-widest animate-pulse">
            Cargando lista desde Supabase...
          </div>
        ) : filteredGuests.length === 0 ? (
          <div className="text-center py-12 text-xs font-sans text-gray-400">
            {searchTerm ? "No se encontraron invitados con ese nombre." : "No hay invitaciones registradas en Supabase."}
          </div>
        ) : (
          <>
            {/* Desktop Table View (hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto w-full max-h-[600px] overflow-y-auto pr-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-serif uppercase tracking-wider text-[10px] sticky top-0 bg-white z-10">
                  <th className="py-3 font-bold bg-white">Invitado</th>
                  <th className="py-3 text-center font-bold bg-white">Pase Permitido</th>
                  <th className="py-3 text-center font-bold bg-white">Respuesta</th>
                  <th className="py-3 text-center font-bold bg-white">Acompañantes Confirmados</th>
                  <th className="py-3 text-center font-bold bg-white">Total Asistentes</th>
                  <th className="py-3 text-center font-bold bg-white">Confirmación</th>
                  <th className="py-3 bg-white"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentGuests.map((guest) => {
                  const guestLink = typeof window !== "undefined" ? `${window.location.origin}?id=${guest.id}` : "";
                  
                  return (
                    <tr key={guest.id} className="hover:bg-[#FAF6F0]/25 transition-colors">
                      <td className="py-3.5 pr-2">
                        <div className="font-serif font-bold text-[#3D3526] text-sm">
                          {guest.name}
                        </div>
                      </td>
                      <td className="py-3.5 text-center text-gray-500 font-sans">
                        {guest.max_companions === 0 ? "Individual" : `Individual + ${guest.max_companions} Acomp.`}
                      </td>
                      <td className="py-3.5 text-center">
                        {guest.is_attending === null && (
                          <span className="inline-block px-2.5 py-1 text-[10px] font-sans font-bold text-yellow-700 bg-yellow-50 border border-yellow-200/50 rounded-full">
                            Pendiente
                          </span>
                        )}
                        {guest.is_attending === true && (
                          <span className="inline-block px-2.5 py-1 text-[10px] font-sans font-bold text-green-700 bg-green-50 border border-green-200/50 rounded-full">
                            Asistirá
                          </span>
                        )}
                        {guest.is_attending === false && (
                          <span className="inline-block px-2.5 py-1 text-[10px] font-sans font-bold text-red-700 bg-red-50 border border-red-200/50 rounded-full">
                            No Asistirá
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-center text-gray-500 font-sans font-semibold">
                        {guest.is_attending === true ? `${guest.confirmed_companions} acompañante(s)` : guest.is_attending === false ? 0 : "-"}
                      </td>
                      <td className="py-3.5 text-center text-[#3D3526] font-sans font-bold text-sm">
                        {guest.is_attending === true ? guest.confirmed_companions + 1 : guest.is_attending === false ? 0 : "-"}
                      </td>
                      <td className="py-3.5 text-center text-gray-400 font-sans text-[10px]">
                        {guest.confirmed_at ? new Date(guest.confirmed_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        }) : "-"}
                      </td>
                        <td className="py-3.5 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                setEditingRsvpGuest(guest);
                                setEditingAttending(guest.is_attending);
                                setEditingCompanions(guest.confirmed_companions || 0);
                              }}
                              className="px-3 py-1.5 rounded-xl border border-gold-300/30 text-gold-700 hover:bg-gold-50 font-sans text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleCopy(guestLink, guest.id)}
                              className={`px-3 py-1.5 rounded-xl font-sans text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                copiedId === guest.id
                                  ? "bg-green-50 border-green-300 text-green-700"
                                  : "bg-[#FAF6F0] border-gold-300/30 text-gold-700 hover:bg-gold-50"
                              }`}
                            >
                              {copiedId === guest.id ? "¡Copiado!" : "Copiar Enlace"}
                            </button>
                            <button
                              onClick={() => triggerDeleteConfirm(guest.id, guest.name)}
                              className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200/50 text-red-600 hover:bg-red-100 font-sans text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (hidden on desktop) */}
            <div className="block md:hidden space-y-3.5 w-full max-h-[500px] overflow-y-auto pr-1">
              {currentGuests.map((guest) => {
                const guestLink = typeof window !== "undefined" ? `${window.location.origin}?id=${guest.id}` : "";
                
                return (
                  <div 
                    key={guest.id} 
                    className="bg-[#FAF6F0]/20 border border-gold-200/10 rounded-2xl p-4 flex flex-col gap-3 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]"
                  >
                    {/* Header: Name & Badge */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="font-serif font-bold text-[#3D3526] text-sm leading-snug">
                        {guest.name}
                      </div>
                      <div>
                        {guest.is_attending === null && (
                          <span className="inline-block px-2 py-0.5 text-[9px] font-sans font-bold text-yellow-700 bg-yellow-50 border border-yellow-200/30 rounded-full">
                            Pendiente
                          </span>
                        )}
                        {guest.is_attending === true && (
                          <span className="inline-block px-2.5 py-0.5 text-[9px] font-sans font-bold text-green-700 bg-green-50 border border-green-200/30 rounded-full">
                            Confirmado
                          </span>
                        )}
                        {guest.is_attending === false && (
                          <span className="inline-block px-2.5 py-0.5 text-[9px] font-sans font-bold text-red-700 bg-red-50 border border-red-200/30 rounded-full">
                            Rechazado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats columns */}
                    <div className="grid grid-cols-3 gap-2 border-y border-gray-100 py-2.5 text-center text-[10px] font-sans text-gray-500">
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Pase Asignado</span>
                        <span className="text-[#3D3526] font-semibold">
                          {guest.max_companions === 0 ? "Individual" : `+ ${guest.max_companions} Acomp.`}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Acompañantes</span>
                        <span className="text-[#3D3526] font-semibold">
                          {guest.is_attending === true ? guest.confirmed_companions : guest.is_attending === false ? 0 : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">Total Asistirán</span>
                        <span className="text-gold-700 font-bold">
                          {guest.is_attending === true ? guest.confirmed_companions + 1 : guest.is_attending === false ? 0 : "-"}
                        </span>
                      </div>
                    </div>

                    {/* Footer: Date & Actions */}
                    <div className="flex items-center justify-between gap-3 mt-1">
                      <span className="text-[9px] text-gray-400 font-sans">
                        {guest.confirmed_at ? new Date(guest.confirmed_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        }) : "Sin respuesta"}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingRsvpGuest(guest);
                            setEditingAttending(guest.is_attending);
                            setEditingCompanions(guest.confirmed_companions || 0);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-white border border-gold-300/30 text-gold-700 hover:bg-gold-50 font-sans text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => handleCopy(guestLink, guest.id)}
                          className={`px-2.5 py-1.5 rounded-xl font-sans text-[9px] font-bold uppercase tracking-wider transition-all border ${
                            copiedId === guest.id
                              ? "bg-green-50 border-green-300 text-green-700"
                              : "bg-white border-gold-300/30 text-gold-700 hover:bg-gold-50"
                          }`}
                        >
                          {copiedId === guest.id ? "¡Copiado!" : "Enlace"}
                        </button>
                        <button
                          onClick={() => triggerDeleteConfirm(guest.id, guest.name)}
                          className="px-2.5 py-1.5 rounded-xl bg-red-50 border border-red-200/50 text-red-600 hover:bg-red-100 font-sans text-[9px] font-bold uppercase tracking-wider transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Shadcn-Style Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 pt-4 mt-2 px-2 gap-3">
                <span className="text-[10px] font-sans text-gray-500">
                  Mostrando {indexOfFirstGuest + 1}-{Math.min(indexOfLastGuest, filteredGuests.length)} de {filteredGuests.length} invitados
                </span>
                
                <nav className="flex items-center gap-1" aria-label="Pagination">
                  {/* Previous page button */}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`inline-flex items-center justify-center gap-1 h-8 px-3 rounded-lg border text-[10px] font-sans font-bold uppercase tracking-wider transition-colors ${
                      currentPage === 1
                        ? "bg-transparent border-transparent text-gray-300 cursor-not-allowed"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                    </svg>
                    <span>Anterior</span>
                  </button>

                  {/* Page index selectors */}
                  {getPageNumbers().map((page, idx) => {
                    if (page === "ellipsis-1" || page === "ellipsis-2") {
                      return (
                        <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs select-none">
                          •••
                        </span>
                      );
                    }
                    
                    const isPageActive = currentPage === page;
                    return (
                      <button
                        key={`page-${page}`}
                        onClick={() => setCurrentPage(page as number)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-sans font-bold transition-all border ${
                          isPageActive
                            ? "bg-gold-600 border-gold-600 text-white font-semibold"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  {/* Next page button */}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`inline-flex items-center justify-center gap-1 h-8 px-3 rounded-lg border text-[10px] font-sans font-bold uppercase tracking-wider transition-colors ${
                      currentPage === totalPages
                        ? "bg-transparent border-transparent text-gray-300 cursor-not-allowed"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer"
                    }`}
                  >
                    <span>Siguiente</span>
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                    </svg>
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>

      {/* Custom Deletion Alert Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gold-200/10 flex flex-col gap-4 animate-scale-up">
            <div className="flex gap-3 items-start">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center border border-red-100 text-red-600 flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-serif font-bold text-[#3D3526] text-sm uppercase tracking-wider text-left">
                  ¿Eliminar invitado?
                </h4>
                <p className="font-sans text-xs text-gray-500 mt-1.5 leading-relaxed text-left">
                  ¿Estás seguro de que deseas eliminar a <strong className="text-gray-700">{deleteConfirmName}</strong> de la lista de invitados? Esta acción no se puede deshacer y su enlace personalizado dejará de funcionar.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-2">
              <button
                onClick={() => {
                  setDeleteConfirmId(null);
                  setDeleteConfirmName("");
                }}
                className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-sans font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const id = deleteConfirmId;
                  setDeleteConfirmId(null);
                  setDeleteConfirmName("");
                  try {
                    const { error } = await supabase.from("guests").delete().eq("id", id);
                    if (error) {
                      console.error("Error deleting guest:", error);
                      setCustomAlert({
                        title: "Error al eliminar",
                        message: "Hubo un problema al eliminar el registro de la base de datos."
                      });
                    } else {
                      fetchGuests();
                    }
                  } catch (err) {
                    console.error("Failed to delete guest:", err);
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-sans font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Dialog */}
      {customAlert && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gold-200/10 flex flex-col gap-4 animate-scale-up">
            <div className="flex gap-3 items-start">
              <div className="w-10 h-10 rounded-full bg-gold-50 flex items-center justify-center border border-gold-100 text-gold-600 flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-serif font-bold text-[#3D3526] text-sm uppercase tracking-wider text-left">
                  {customAlert.title || "Aviso"}
                </h4>
                <p className="font-sans text-xs text-gray-500 mt-1.5 leading-relaxed text-left">
                  {customAlert.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <button
                onClick={() => setCustomAlert(null)}
                className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-white rounded-xl text-xs font-sans font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Manual RSVP Editing Modal */}
      {editingRsvpGuest && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gold-200/10 flex flex-col gap-4 animate-scale-up">
            <div className="flex gap-3 items-start">
              <div className="w-10 h-10 rounded-full bg-gold-50 flex items-center justify-center border border-gold-100 text-gold-600 flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-serif font-bold text-[#3D3526] text-sm uppercase tracking-wider text-left">
                  Modificar Asistencia (RSVP)
                </h4>
                <p className="font-sans text-xs text-gray-500 mt-1.5 leading-relaxed text-left">
                  Registra manualmente la respuesta para <strong className="text-gray-700">{editingRsvpGuest.name}</strong>.
                </p>
              </div>
            </div>

            {/* Attendance selector */}
            <div className="flex flex-col gap-3 mt-1.5 text-left">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">
                  Estado de Asistencia
                </label>
                <select
                  value={editingAttending === null ? "pending" : editingAttending ? "attending" : "declined"}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "pending") {
                      setEditingAttending(null);
                    } else if (val === "attending") {
                      setEditingAttending(true);
                    } else {
                      setEditingAttending(false);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs font-sans bg-white hover:bg-gray-50/50 focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 h-9 text-gray-700 shadow-sm cursor-pointer transition-colors"
                >
                  <option value="pending">Pendiente</option>
                  <option value="attending">Confirmado (Sí Asistirá)</option>
                  <option value="declined">Rechazado (No Asistirá)</option>
                </select>
              </div>

              {/* Companion selector (only if confirmed attending and companion limit > 0) */}
              {editingAttending === true && editingRsvpGuest.max_companions > 0 && (
                <div className="animate-fade-in">
                  <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">
                    Número de Acompañantes Confirmados
                  </label>
                  <select
                    value={editingCompanions}
                    onChange={(e) => setEditingCompanions(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-xs font-sans bg-white hover:bg-gray-50/50 focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 h-9 text-gray-700 shadow-sm cursor-pointer transition-colors"
                  >
                    {Array.from({ length: editingRsvpGuest.max_companions + 1 }, (_, i) => (
                      <option key={i} value={i}>
                        {i === 0 ? "Ningún acompañante (Irá solo/a)" : `${i} acompañante${i > 1 ? "s" : ""} adicional${i > 1 ? "es" : ""}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 mt-2">
              <button
                onClick={() => setEditingRsvpGuest(null)}
                className="px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-100/80 rounded-md text-xs font-medium transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const guest = editingRsvpGuest;
                  const attending = editingAttending;
                  const companions = attending === true ? editingCompanions : 0;
                  setEditingRsvpGuest(null);
                  try {
                    const { error } = await supabase
                      .from("guests")
                      .update({
                        is_attending: attending,
                        confirmed_companions: companions,
                        confirmed_at: attending !== null ? new Date().toISOString() : null
                      })
                      .eq("id", guest.id);

                    if (error) {
                      console.error("Error updating manual RSVP:", error);
                      setCustomAlert({
                        title: "Error al actualizar",
                        message: "Hubo un problema al guardar la confirmación en la base de datos."
                      });
                    } else {
                      fetchGuests();
                    }
                  } catch (err) {
                    console.error("Failed to update guest manual RSVP:", err);
                  }
                }}
                className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-white rounded-md text-xs font-medium transition-colors shadow-sm cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
