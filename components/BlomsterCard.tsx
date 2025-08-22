'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import FeilrapportModal from './FeilrapportModal';
import type { Blomst } from '@/lib/types';

interface BlomsterCardProps {
  blomst: Blomst;
  onClick?: () => void;
}

export default function BlomsterCard({ blomst, onClick }: BlomsterCardProps) {
  const [bildeLastet, setBildeLastet] = useState(false);
  const [bildeFeil, setBildeFeil] = useState(false);
  const [visInfo, setVisInfo] = useState(false);
  const [visFeilrapport, setVisFeilrapport] = useState(false);
  const [aktivtBildeIndex, setAktivtBildeIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sjekk om brukeren har swiped før (globalt)
  useEffect(() => {
    const hasSwipedBefore = localStorage.getItem('hasSwipedBlomster') === 'true';
    setShowSwipeHint(!hasSwipedBefore);
  }, []);

  // Sjekk om blomsten har bilder og filtrer ut tomme/ugyldige
  const gyldigeBilder = blomst.bildeUrls ? blomst.bildeUrls.filter(url => 
    url && 
    url.trim() !== '' && 
    (url.includes('.jpg') || url.includes('.png') || url.includes('.jpeg') || 
     url.includes('.webp') || url.includes('.gif') || url.includes('wikimedia.org') || 
     url.includes('wikipedia.org'))
  ) : [];
  
  const harBilder = gyldigeBilder.length > 0;
  const harFlereBilder = gyldigeBilder.length > 1;
  const aktivtBilde = harBilder ? gyldigeBilder[aktivtBildeIndex] : blomst.bildeUrl;
  
  // Analyser hvilket type innhold det aktive bildet er
  const getBildeType = (url: string) => {
    if (!url) return 'ukjent';
    
    // Norsk Flora direktebilde
    if (url.includes('norskflora.no') && (url.includes('.jpg') || url.includes('.png') || url.includes('.jpeg'))) {
      return 'norskflora-bilde';
    }
    
    // Wikipedia/Wikimedia bilder
    if (url.includes('wikipedia.org') || url.includes('wikimedia.org')) {
      return 'wikipedia-bilde';
    }
    
    // Andre direktebilder
    if (url.includes('.jpg') || url.includes('.png') || url.includes('.jpeg') || url.includes('.webp') || url.includes('.gif')) {
      return 'direktebilde';
    }
    
    return 'ukjent';
  };

  const getBildeLabel = (url: string) => {
    const type = getBildeType(url);
    switch (type) {
      case 'norskflora-bilde': return 'Norsk Flora bilde';
      case 'wikipedia-bilde': return 'Wikipedia bilde';
      case 'direktebilde': return 'Bilde';
      default: return 'Bilde';
    }
  };

  const aktivBildeType = getBildeType(aktivtBilde);
  const erDirekteBilde = ['norskflora-bilde', 'wikipedia-bilde', 'direktebilde'].includes(aktivBildeType);

  // Minimum swipe distance (i piksler) - redusert for lettere swipe
  const minSwipeDistance = 30;

  const onTouchStart = (e: React.TouchEvent) => {
    if (!harFlereBilder) return;
    
    // Forhindre default scroll-oppførsel på mobil
    e.preventDefault();
    
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
    setDragOffset(0);
    
    // Marker at brukeren har swiped (globalt)
    localStorage.setItem('hasSwipedBlomster', 'true');
    setShowSwipeHint(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!harFlereBilder || !touchStart || isAnimating) return;
    
    // Forhindre default scroll-oppførsel på mobil
    e.preventDefault();
    
    const currentTouch = e.targetTouches[0].clientX;
    const diff = currentTouch - touchStart;
    setTouchEnd(currentTouch);
    
    // Økt maksimal drag-avstand og mer responsiv følelse
    const maxDrag = 150;
    const limitedDiff = Math.max(-maxDrag, Math.min(maxDrag, diff));
    
    // Legg til litt motstand når man drar forbi grensene
    let finalOffset = limitedDiff;
    if ((aktivtBildeIndex === 0 && diff > 0) || 
        (aktivtBildeIndex === gyldigeBilder.length - 1 && diff < 0)) {
      finalOffset = limitedDiff * 0.3; // Reduser drag-følsomhet ved grensene
    }
    
    setDragOffset(finalOffset);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || !harFlereBilder || isAnimating) {
      setDragOffset(0);
      setIsDragging(false);
      return;
    }
    
    setIsAnimating(true);
    
    const distance = touchStart - touchEnd;
    const velocity = Math.abs(distance) / 100; // Enkel velocity-beregning
    const isLeftSwipe = distance > minSwipeDistance || (distance > 10 && velocity > 0.5);
    const isRightSwipe = distance < -minSwipeDistance || (distance < -10 && velocity > 0.5);

    if (isLeftSwipe && aktivtBildeIndex < gyldigeBilder.length - 1) {
      setAktivtBildeIndex(prev => prev + 1);
      setBildeLastet(false);
    } else if (isRightSwipe && aktivtBildeIndex > 0) {
      setAktivtBildeIndex(prev => prev - 1);
      setBildeLastet(false);
    }
    
    // Reset drag state med forsinkelse for smooth animasjon
    setDragOffset(0);
    setIsDragging(false);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const handleClick = () => {
    setVisInfo(!visInfo);
    onClick?.();
  };

  const handleBildeFeil = () => {
    setBildeFeil(true);
    console.warn(`Kunne ikke laste bilde for ${blomst.artNorsk}:`, aktivtBilde);
  };

  const navigerTilBilde = (index: number) => {
    if (index !== aktivtBildeIndex && index >= 0 && index < gyldigeBilder.length && !isAnimating) {
      setIsAnimating(true);
      setAktivtBildeIndex(index);
      setBildeLastet(false);
      
      // Marker at brukeren har interagert med bilder (globalt)
      localStorage.setItem('hasSwipedBlomster', 'true');
      setShowSwipeHint(false);
      
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }
  };

  // Reset til første bilde når blomst endres
  useEffect(() => {
    setAktivtBildeIndex(0);
    setBildeLastet(false);
    setBildeFeil(false);
    setDragOffset(0);
    setIsDragging(false);
    setIsAnimating(false);
    // IKKE reset showSwipeHint - det er globalt
  }, [blomst.artNorsk]);

  // Hvis ingen bilder tilgjengelig
  if (!harBilder || blomst.bildeStatus !== 'FUNNET') {
    return (
      <div className="relative w-full h-96 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center cursor-pointer group transition-all duration-300"
           onClick={handleClick}>
        <div className="text-center p-6">
          <div className="text-6xl mb-4">🌸</div>
          <h3 className="text-xl font-bold text-green-800">{blomst.artNorsk}</h3>
          <p className="text-green-600 italic">{blomst.vitenskapeligNavn}</p>
          <p className="text-sm text-green-500 mt-2">Ingen bilde tilgjengelig</p>
        </div>
        
        {/* Info overlay for blomster uten bilder */}
        {visInfo && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-2xl flex items-center justify-center p-8 transition-all duration-300">
            <div className="text-center text-white max-w-sm">
              <h2 className="text-3xl font-bold mb-3">{blomst.artNorsk}</h2>
              <p className="text-xl italic text-emerald-300 mb-6">{blomst.vitenskapeligNavn}</p>
              
              <div className="space-y-3 text-left bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex justify-between items-start gap-4">
                  <span className="font-semibold text-emerald-300 flex-shrink-0">Familie:</span> 
                  <span className="text-right">{blomst.familienavn}</span>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <span className="font-semibold text-emerald-300 flex-shrink-0">Type:</span> 
                  <span className="text-right">{blomst.type}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                {blomst.norskfloraUrl && (
                  <a 
                    href={blomst.norskfloraUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg text-sm font-medium flex items-center justify-center whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    🌿 Norsk Flora
                  </a>
                )}
                
                {blomst.wikipediaUrl && (
                  <a 
                    href={blomst.wikipediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg text-sm font-medium flex items-center justify-center whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    📖 Wikipedia
                  </a>
                )}
              </div>
              
              <p className="text-xs text-gray-300 mt-6">
                Trykk igjen for å skjule info
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-96 cursor-pointer group transition-all duration-300"
      onClick={handleClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: harFlereBilder ? 'none' : 'auto' }}
    >
      
      {/* Hovedbilde med drag-effekt */}
      <div className="relative w-full h-full rounded-xl overflow-hidden bg-gray-100">
        <div 
          className={`relative w-full h-full transition-all duration-300 ${isDragging ? 'duration-0' : 'ease-out'}`}
          style={{ 
            transform: `translateX(${dragOffset}px)`,
            opacity: isDragging ? 0.9 : 1
          }}
        >
        {!bildeFeil ? (
          <Image
            key={`${blomst.artNorsk}-${aktivtBildeIndex}`}
            src={aktivtBilde}
            alt={`${blomst.artNorsk} - bilde ${aktivtBildeIndex + 1}`}
            fill
            className={`transition-opacity duration-500 ${bildeLastet ? 'opacity-100' : 'opacity-0'}`}
            style={{ objectFit: 'contain' }}
            onLoad={() => setBildeLastet(true)}
            onError={handleBildeFeil}
            unoptimized
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🌸</div>
              <p className="text-green-600">Kunne ikke laste innhold</p>
            </div>
          </div>
        )}
        
        {/* Loading spinner */}
        {!bildeLastet && !bildeFeil && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        )}
        </div>

        {/* Navigasjonspiler for flere bilder */}
        {harFlereBilder && bildeLastet && !bildeFeil && (
          <>
            {/* Venstre pil */}
            {aktivtBildeIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigerTilBilde(aktivtBildeIndex - 1);
                }}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
                aria-label="Forrige bilde"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Høyre pil */}
            {aktivtBildeIndex < gyldigeBilder.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigerTilBilde(aktivtBildeIndex + 1);
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
                aria-label="Neste bilde"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </>
        )}

        {/* Bildeindikatorer */}
        {harFlereBilder && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1 z-10">
            {gyldigeBilder.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  navigerTilBilde(index);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === aktivtBildeIndex 
                    ? 'bg-white scale-125' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Gå til bilde ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Swipe-indikator for mobile */}
        {harFlereBilder && (
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 md:hidden z-10">
            <div className={`bg-black/50 text-white text-xs px-2 py-1 rounded-full transition-all duration-200 ${isDragging ? 'scale-110 bg-black/70' : ''}`}>
              {getBildeLabel(aktivtBilde)} ({aktivtBildeIndex + 1}/{gyldigeBilder.length})
              {isDragging && (
                <span className="ml-1">
                  {dragOffset > 0 ? '👈' : dragOffset < 0 ? '👉' : ''}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Drag-hint - kun til brukeren har swiped første gang (globalt) */}
        {harFlereBilder && !isDragging && showSwipeHint && bildeLastet && !bildeFeil && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 md:hidden z-10 animate-pulse">
            <div className="bg-black/30 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
              <span>👈</span>
              <span>Dra for å bytte</span>
              <span>👉</span>
            </div>
          </div>
        )}
      </div>

      {/* Info overlay */}
      {visInfo && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-2xl flex items-center justify-center p-8 transition-all duration-300 z-20">
          <div className="text-center text-white max-w-sm">
            <h2 className="text-3xl font-bold mb-3">{blomst.artNorsk}</h2>
            <p className="text-xl italic text-emerald-300 mb-6">{blomst.vitenskapeligNavn}</p>
            
            <div className="space-y-3 text-left bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex justify-between items-start gap-4">
                <span className="font-semibold text-emerald-300 flex-shrink-0">Familie:</span> 
                <span className="text-right">{blomst.familienavn}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="font-semibold text-emerald-300 flex-shrink-0">Type:</span> 
                <span className="text-right">{blomst.type}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {blomst.norskfloraUrl && (
                <a 
                  href={blomst.norskfloraUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg text-sm font-medium flex items-center justify-center whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  🌿 Norsk Flora
                </a>
              )}
              
              {blomst.wikipediaUrl && (
                <a 
                  href={blomst.wikipediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg text-sm font-medium flex items-center justify-center whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  📖 Wikipedia
                </a>
              )}
            </div>
            
            <p className="text-xs text-gray-300 mt-6">
              Trykk igjen for å skjule info
            </p>
          </div>
        </div>
      )}

      {/* Subtil indikator for at man kan trykke - synlig på mobil, hover på desktop */}
      <div className="absolute top-4 right-4 opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      {/* Rapporter feil knapp - synlig på mobil, hover på desktop */}
      <div className="absolute bottom-3 left-3 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setVisFeilrapport(true);
          }}
          className="px-3 py-1.5 bg-orange-500/90 hover:bg-orange-600 text-white text-xs font-medium rounded-full transition-all duration-200 opacity-70 md:opacity-0 md:group-hover:opacity-100 hover:scale-110 shadow-lg backdrop-blur-sm"
          title="Rapporter feil med dette bildet eller informasjonen"
        >
          🚨 Feil?
        </button>
      </div>

      {/* Feilrapport Modal */}
      <FeilrapportModal 
        blomst={blomst}
        erÅpen={visFeilrapport}
        onLukk={() => setVisFeilrapport(false)}
      />
    </div>
  );
}