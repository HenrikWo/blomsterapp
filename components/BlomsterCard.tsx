'use client';

import { useState } from 'react';
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

  const handleClick = () => {
    setVisInfo(!visInfo);
    onClick?.();
  };

  const handleBildeFeil = () => {
    setBildeFeil(true);
    console.warn(`Kunne ikke laste bilde for ${blomst.artNorsk}:`, blomst.bildeUrl);
  };

  if (!blomst.bildeUrl || blomst.bildeStatus !== 'FUNNET') {
    return (
      <div className="relative w-full h-96 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center cursor-pointer group transition-all duration-300"
           onClick={handleClick}>
        <div className="text-center p-6">
          <div className="text-6xl mb-4">🌸</div>
          <h3 className="text-xl font-bold text-green-800">{blomst.artNorsk}</h3>
          <p className="text-green-600 italic">{blomst.vitenskapeligNavn}</p>
          <p className="text-sm text-green-500 mt-2">Ingen bilde tilgjengelig</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 cursor-pointer group transition-all duration-300"
         onClick={handleClick}>
      
      {/* Hovedbilde */}
      <div className="relative w-full h-full rounded-xl overflow-hidden bg-gray-100">
        {!bildeFeil ? (
          <Image
            src={blomst.bildeUrl}
            alt={blomst.artNorsk}
            fill
            className={`transition-opacity duration-500 ${bildeLastet ? 'opacity-100' : 'opacity-0'}`}
            style={{ objectFit: 'contain' }} // Endret fra 'cover' til 'contain'
            onLoad={() => setBildeLastet(true)}
            onError={handleBildeFeil}
            unoptimized // Siden vi bruker eksterne URLs
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🌸</div>
              <p className="text-green-600">Kunne ikke laste bilde</p>
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

      {/* Info overlay */}
      {visInfo && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-2xl flex items-center justify-center p-8 transition-all duration-300">
          <div className="text-center text-white max-w-sm">
            <h2 className="text-3xl font-bold mb-3">{blomst.artNorsk}</h2>
            <p className="text-xl italic text-emerald-300 mb-6">{blomst.vitenskapeligNavn}</p>
            
            <div className="space-y-3 text-left bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex justify-between">
                <span className="font-semibold text-emerald-300">Familie:</span> 
                <span>{blomst.familienavn}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-emerald-300">Type:</span> 
                <span>{blomst.type}</span>
              </div>
            </div>

            {blomst.norskfloraUrl && (
              <a 
                href={blomst.norskfloraUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-6 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                🌿 Les mer på Norsk Flora
              </a>
            )}
            
            <p className="text-xs text-gray-300 mt-6">
              Trykk igjen for å skjule info
            </p>
          </div>
        </div>
      )}

      {/* Subtil indikator for at man kan trykke - synlig på mobil, hover på desktop */}
      <div className="absolute top-4 right-4 opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      {/* Rapporter feil knapp - synlig på mobil, hover på desktop */}
      <div className="absolute bottom-3 left-3">
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