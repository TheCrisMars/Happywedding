"use client";

import React, { useState, Suspense } from "react";
import Envelope from "@/components/Envelope";
import InvitationContent from "@/components/InvitationContent";
import BackgroundMusic from "@/components/BackgroundMusic";

export default function Home() {
  const [opened, setOpened] = useState(true); // Envelope starts open

  return (
    <main className="w-full min-h-screen bg-[#FAF6F0] relative overflow-x-hidden">
      {!opened ? (
        <Envelope onOpen={() => setOpened(true)} />
      ) : (
        <>
          <div className="animate-fade-in-up w-full min-h-screen">
            <Suspense fallback={<div className="text-center py-20 text-gold-500 font-serif tracking-widest">Cargando Invitación...</div>}>
              <InvitationContent />
            </Suspense>
          </div>
          <BackgroundMusic />
        </>
      )}
    </main>
  );
}

