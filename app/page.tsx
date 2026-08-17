'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import BlomsterCard from '@/components/BlomsterCard';
import UtvalgModal from '@/components/UtvalgModal';
import { loadBlomsterData, getTilfeldigBlomst } from '@/lib/blomsterData';
import { lesFravalgte, skrivFravalgte, brukbareBlomster } from '@/lib/utvalg';
import type { Blomst, BlomsterData } from '@/lib/types';

export default function Home() {
  const [blomsterData, setBlomsterData] = useState<BlomsterData | null>(null);
  const [gjeldendeBlomt, setGjeldendeBlomt] = useState<Blomst | null>(null);
  const [laster, setLaster] = useState(true);
  const [feil, setFeil] = useState<string | null>(null);
  const [fravalgte, setFravalgte] = useState<Set<string>>(new Set());
  const [visUtvalg, setVisUtvalg] = useState(false);

  // Last blomsterdata ved oppstart
  useEffect(() => {
    async function initApp() {
      try {
        setLaster(true);
        const lagret = lesFravalgte();
        setFravalgte(lagret);

        const data = await loadBlomsterData();
        setBlomsterData(data);

        // Vis første tilfeldige blomst fra utvalget
        setGjeldendeBlomt(getTilfeldigBlomst(brukbareBlomster(data.blomster, lagret)));
      } catch (error) {
        console.error('Feil ved lasting:', error);
        setFeil('Kunne ikke laste blomsterdata. Sjekk at blomster.csv ligger i public/data/');
      } finally {
        setLaster(false);
      }
    }

    initApp();
  }, []);

  const valgte = useMemo(
    () => (blomsterData ? brukbareBlomster(blomsterData.blomster, fravalgte) : []),
    [blomsterData, fravalgte]
  );

  const visNyBlomt = () => {
    if (valgte.length === 0) return;
    // Unngå å trekke samme art to ganger på rad når det er nok å velge i
    let ny = getTilfeldigBlomst(valgte);
    if (valgte.length > 1) {
      for (let i = 0; i < 5 && ny?.artNorsk === gjeldendeBlomt?.artNorsk; i++) {
        ny = getTilfeldigBlomst(valgte);
      }
    }
    setGjeldendeBlomt(ny);
  };

  const lagreUtvalg = (nyeFravalgte: Set<string>) => {
    setFravalgte(nyeFravalgte);
    skrivFravalgte(nyeFravalgte);
    setVisUtvalg(false);

    if (blomsterData) {
      const nyttUtvalg = brukbareBlomster(blomsterData.blomster, nyeFravalgte);
      // Står vi på en art som nettopp ble huket av, bytt til en som er med
      const fortsattMed = nyttUtvalg.some((b) => b.artNorsk === gjeldendeBlomt?.artNorsk);
      if (!fortsattMed) setGjeldendeBlomt(getTilfeldigBlomst(nyttUtvalg));
    }
  };

  // Loading state
  if (laster) {
    return (
      <div className="min-h-screen bg-sand-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-sand-300 border-t-skog-600 mx-auto mb-4"></div>
          <p className="text-sand-600">Laster blomsterdata…</p>
        </div>
      </div>
    );
  }

  // Error state
  if (feil) {
    return (
      <div className="min-h-screen bg-sand-100 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <h1 className="text-2xl font-semibold text-galt-tekst mb-3">Noe gikk galt</h1>
          <p className="text-sand-700 mb-4">{feil}</p>
          <div className="text-sm text-sand-700 bg-galt-bg border border-galt-kant rounded p-4 text-left">
            <p className="font-semibold mb-2">Slik fikser du det:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                Kopier <code className="bg-white px-1 rounded">blomster_med_bilder.csv</code> til{' '}
                <code className="bg-white px-1 rounded">public/data/blomster.csv</code>
              </li>
              <li>Last siden på nytt</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // No data
  if (!blomsterData || blomsterData.blomster.length === 0) {
    return (
      <div className="min-h-screen bg-sand-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-sand-800 mb-2">Ingen blomster funnet</h1>
          <p className="text-sand-600">CSV-filen ser ut til å være tom.</p>
        </div>
      </div>
    );
  }

  const totaltMedBilde = blomsterData.medBilder;
  const harFiltrert = valgte.length !== totaltMedBilde;

  return (
    <div className="min-h-screen bg-sand-100">
      {/* Header */}
      <header className="bg-white border-b border-sand-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-skog-800 tracking-tight flex items-center gap-2">
                <span aria-hidden="true">🌿</span>
                PlantePugger
              </h1>
              <p className="text-sm text-sand-600 mt-0.5 tabular-nums">
                {harFiltrert ? (
                  <>
                    {valgte.length} av {totaltMedBilde} arter valgt
                  </>
                ) : (
                  <>{totaltMedBilde} arter</>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setVisUtvalg(true)}
                className="px-3 py-2.5 text-sm font-medium text-skog-700 bg-white border border-skog-300 rounded hover:bg-skog-50 transition-colors tabular-nums"
              >
                Velg arter
                {harFiltrert && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-skog-600 text-white rounded">
                    {valgte.length}
                  </span>
                )}
              </button>

              <Link
                href="/test_deg_selv"
                className="px-4 py-2.5 bg-skog-600 hover:bg-skog-700 text-white rounded text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Test deg selv
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-10">
        {gjeldendeBlomt ? (
          <div className="space-y-6">
            <BlomsterCard blomst={gjeldendeBlomt} onClick={() => {}} />

            <button
              onClick={visNyBlomt}
              className="w-full px-8 py-3.5 bg-skog-600 hover:bg-skog-700 text-white rounded font-semibold transition-colors"
            >
              Ny blomst
            </button>

            <p className="text-center text-sm text-sand-600">
              Trykk på bildet for å se navn og familie.
            </p>
          </div>
        ) : (
          <div className="text-center p-10 bg-white border border-sand-200 rounded">
            <h2 className="text-lg font-semibold text-sand-800 mb-2">Ingen arter i utvalget</h2>
            <p className="text-sand-600 mb-5">
              Du har huket av alle artene. Legg til noen for å komme i gang.
            </p>
            <button
              onClick={() => setVisUtvalg(true)}
              className="px-5 py-2.5 bg-skog-600 hover:bg-skog-700 text-white rounded font-semibold transition-colors"
            >
              Velg arter
            </button>
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-sm text-sand-500">
        Til deg som prøver å bestå PHG113, fra Henrik
      </footer>

      <UtvalgModal
        blomster={blomsterData.blomster}
        fravalgte={fravalgte}
        erÅpen={visUtvalg}
        onLukk={() => setVisUtvalg(false)}
        onLagre={lagreUtvalg}
      />
    </div>
  );
}
