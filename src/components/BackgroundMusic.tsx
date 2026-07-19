"use client";

import React, { useState, useEffect, useRef } from "react";

// ID de la canción de YouTube provista por el usuario.
const YOUTUBE_VIDEO_ID = "7HfabBDl_-o";

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export default function BackgroundMusic() {
  const [mounted, setMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const playerRef = useRef<any>(null);
  const isReadyRef = useRef<boolean>(false);

  // Evitar warnings de hidratación en Next.js forzando montaje en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // 1. Cargar la API de YouTube Iframe dinámicamente si no existe en window
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }

      window.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };
    } else {
      initializePlayer();
    }

    function initializePlayer() {
      if (playerRef.current) return; // Ya inicializado

      try {
        playerRef.current = new window.YT.Player("youtube-player-element", {
          height: "0",
          width: "0",
          videoId: YOUTUBE_VIDEO_ID,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            loop: 1,
            playlist: YOUTUBE_VIDEO_ID, // Necesario para bucles en YT
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
          },
          events: {
            onReady: () => {
              isReadyRef.current = true;
              playerRef.current.setVolume(10); // Volumen moderado al 30%
            },
            onStateChange: (event: any) => {
              // Si el video termina y el loop de YT falla, forzar play de nuevo
              if (event.data === 0) {
                playerRef.current.playVideo();
              }
            },
          },
        });
      } catch (err) {
        console.error("Error creating YT.Player:", err);
      }
    }

    return () => {
      // Limpieza
      if (window.onYouTubeIframeAPIReady) {
        delete window.onYouTubeIframeAPIReady;
      }
    };
  }, [mounted]);

  const handlePlayMusic = () => {
    setShowPrompt(false);
    if (playerRef.current && isReadyRef.current) {
      try {
        playerRef.current.playVideo();
        setIsPlaying(true);
      } catch (err) {
        console.error("Failed to play YouTube audio:", err);
      }
    } else {
      // Si la API aún no está lista, esperar brevemente y reproducir
      const checkAndPlay = setInterval(() => {
        if (playerRef.current && isReadyRef.current) {
          playerRef.current.playVideo();
          setIsPlaying(true);
          clearInterval(checkAndPlay);
        }
      }, 200);
      // Cancelación por seguridad a los 4 segundos
      setTimeout(() => clearInterval(checkAndPlay), 4000);
    }
  };

  const handleDeclineMusic = () => {
    setShowPrompt(false);
  };

  const togglePlay = () => {
    if (!playerRef.current || !isReadyRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  if (!mounted) return null;

  return (
    <>
      {/* Contenedor invisible para cargar el reproductor de YouTube */}
      <div className="absolute top-0 left-0 w-0 h-0 overflow-hidden opacity-0 pointer-events-none">
        <div id="youtube-player-element"></div>
      </div>

      {/* Autoplay Music Prompt Overlay (Modal centrado, con z-index alto) */}
      {showPrompt && (
        <div className="fixed inset-0 z-[9999] bg-[#110f0a]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full text-center border-2 border-gold-500 shadow-2xl flex flex-col items-center gap-5 animate-fade-in-up">

            {/* Elegant Golden Heart Icon */}
            <div className="w-14 h-14 rounded-full bg-gold-50 flex items-center justify-center border border-gold-200 shadow-inner">
              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-gold-600 animate-pulse-soft">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>

            <div>
              <h2 className="font-serif text-[#3D3526] text-xs tracking-[0.25em] font-semibold uppercase mb-1">
                José Andrés & Daviushka
              </h2>
              <h3 className="font-cursive text-gold-700 text-3xl leading-none mt-2 mb-3">
                ¿Deseas escuchar la música?
              </h3>
              <p className="font-sans text-xs text-[#7A7160] leading-relaxed max-w-[240px] mx-auto">
                Te invitamos a activar la música de fondo para acompañar tu lectura de nuestra invitación de bodas.
              </p>
            </div>

            {/* Vertical Stacked Gold Buttons */}
            <div className="flex flex-col gap-2.5 w-full mt-2">
              <button
                onClick={handlePlayMusic}
                className="w-full py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-700 hover:to-gold-600 text-white rounded-xl text-xs font-bold uppercase tracking-[0.15em] shadow-md hover:shadow-lg transition-all duration-300 transform active:scale-95 cursor-pointer"
              >
                SÍ, ESCUCHAR MÚSICA
              </button>
              <button
                onClick={handleDeclineMusic}
                className="w-full py-2.5 border border-gold-400/50 text-gold-700 hover:bg-gold-50 rounded-xl text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 transform active:scale-95 cursor-pointer"
              >
                NO, SILENCIAR
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Control Button */}
      {!showPrompt && (
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Silenciar música" : "Escuchar música"}
          className={`fixed bottom-6 left-6 z-[9990] w-12 h-12 rounded-full flex items-center justify-center shadow-lg border border-gold-400/20 backdrop-blur transition-all duration-300 hover:scale-110 active:scale-90 ${isPlaying
              ? "bg-gold-600 text-white animate-[spin_8s_linear_infinite]"
              : "bg-white text-gold-600"
            }`}
        >
          {isPlaying ? (
            // Spinning Music Note Icon
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          ) : (
            // Muted Speaker Icon
            <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )}
        </button>
      )}
    </>
  );
}
