'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BlomsterCard from '@/components/BlomsterCard';
import { loadBlomsterData, getTilfeldigBlomst } from '@/lib/blomsterData';
import type { Blomst, BlomsterData } from '@/lib/types';

export default function Home() {
  const [blomsterData, setBlomsterData] = useState<BlomsterData | null>(null);
  const [gjeldendeBlomt, setGjeldendeBlomt] = useState<Blomst | null>(null);
  const [laster, setLaster] = useState(true);
  const [feil, setFeil] = useState<string | null>(null);

  // Last blomsterdata ved oppstart
  useEffect(() => {
    async function initApp() {
      try {
        setLaster(true);
        const data = await loadBlomsterData();
        setBlomsterData(data);
        
        // Vis første tilfeldige blomst
        const førsteBlomt = getTilfeldigBlomst(data.blomster);
        setGjeldendeBlomt(førsteBlomt);
        
      } catch (error) {
        console.error('Feil ved lasting:', error);
        setFeil('Kunne ikke laste blomsterdata. Sjekk at blomster.csv ligger i public/data/');
      } finally {
        setLaster(false);
      }
    }

    initApp();
  }, []);

  const visNyBlomt = () => {
    if (!blomsterData) return;
    
    const nyBlomt = getTilfeldigBlomst(blomsterData.blomster);
    setGjeldendeBlomt(nyBlomt);
  };

  // Loading state
  if (laster) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-lg text-green-700">Laster blomsterdata...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (feil) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-red-800 mb-4">Oops!</h1>
          <p className="text-red-600 mb-4">{feil}</p>
          <div className="text-sm text-red-500 bg-red-100 rounded-lg p-3">
            <p><strong>Slik fikser du det:</strong></p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Kopier <code>blomster_med_bilder.csv</code> til <code>public/data/blomster.csv</code></li>
              <li>Refresh siden</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // No data
  if (!blomsterData || blomsterData.blomster.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🌸</div>
          <h1 className="text-2xl font-bold text-orange-800 mb-4">Ingen blomster funnet</h1>
          <p className="text-orange-600">CSV-filen ser ut til å være tom.</p>
        </div>
      </div>
    );
  }

  // Main app
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md border-b border-emerald-200/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-3">
                🌿 BlomsterApp
              </h1>
              <p className="text-sm text-emerald-700/80 mt-1">
                {blomsterData.medBilder} av {blomsterData.totalAntall} blomster med bilder
              </p>
            </div>
            
            <Link
              href="/test_deg_selv"
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 shadow-md"
            >
              🧠 Test deg selv
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-12">
        {gjeldendeBlomt ? (
          <div className="space-y-8">
            <BlomsterCard 
              blomst={gjeldendeBlomt}
              onClick={() => {/* Info vises i kortet selv */}}
            />
            
            {/* Ny blomst knapp under bildet */}
            <div className="text-center">
              <button
                onClick={visNyBlomt}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 shadow-md"
              >
                🎲 Ny blomst
              </button>
            </div>
            
            {/* Instructions */}
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-100/50 shadow-sm">
              <p className="text-emerald-800 font-medium text-lg">
                💡 Trykk på bildet for å se informasjon
              </p>
              <p className="text-emerald-600 mt-2">
                Eller trykk "Ny blomst" for en tilfeldig art
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center p-12 bg-white/60 backdrop-blur-sm rounded-2xl">
            <div className="text-6xl mb-6">🤔</div>
            <h2 className="text-xl font-bold text-gray-700 mb-3">
              Ingen blomster med bilder funnet
            </h2>
            <p className="text-gray-600">
              Det ser ut som ingen av blomstene har fungerende bildelinker.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-emerald-700/80">
        <p className="text-lg font-medium">🎓 Til deg som prøver å bestå PHG113, fra Henrik</p>
      </footer>
    </div>
  );
}