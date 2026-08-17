'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Blomst } from '@/lib/types';
import { blomstId } from '@/lib/utvalg';

interface UtvalgModalProps {
  blomster: Blomst[];
  fravalgte: Set<string>;
  erÅpen: boolean;
  onLukk: () => void;
  onLagre: (fravalgte: Set<string>) => void;
}

export default function UtvalgModal({
  blomster,
  fravalgte,
  erÅpen,
  onLukk,
  onLagre,
}: UtvalgModalProps) {
  // Jobb på en kopi, så «Avbryt» faktisk angrer
  const [kladd, setKladd] = useState<Set<string>>(new Set(fravalgte));
  const [søk, setSøk] = useState('');

  useEffect(() => {
    if (erÅpen) {
      setKladd(new Set(fravalgte));
      setSøk('');
    }
  }, [erÅpen, fravalgte]);

  useEffect(() => {
    if (!erÅpen) return;
    const påEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onLukk();
    };
    window.addEventListener('keydown', påEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', påEsc);
      document.body.style.overflow = '';
    };
  }, [erÅpen, onLukk]);

  const medBilde = useMemo(
    () => blomster.filter((b) => b.bildeStatus === 'FUNNET' && b.bildeUrls.length > 0),
    [blomster]
  );

  const familier = useMemo(() => {
    const term = søk.trim().toLowerCase();
    const treff = term
      ? medBilde.filter(
          (b) =>
            b.artNorsk.toLowerCase().includes(term) ||
            b.vitenskapeligNavn.toLowerCase().includes(term) ||
            b.familienavn.toLowerCase().includes(term)
        )
      : medBilde;

    const grupper = new Map<string, Blomst[]>();
    for (const b of treff) {
      const fam = b.familienavn || 'Uten familie';
      if (!grupper.has(fam)) grupper.set(fam, []);
      grupper.get(fam)!.push(b);
    }
    return [...grupper.entries()]
      .map(([navn, arter]) => ({
        navn,
        arter: arter.sort((a, b) => a.artNorsk.localeCompare(b.artNorsk, 'no')),
      }))
      .sort((a, b) => a.navn.localeCompare(b.navn, 'no'));
  }, [medBilde, søk]);

  const antallValgt = medBilde.length - medBilde.filter((b) => kladd.has(blomstId(b))).length;

  const vipp = (b: Blomst) => {
    const id = blomstId(b);
    setKladd((forrige) => {
      const ny = new Set(forrige);
      if (ny.has(id)) ny.delete(id);
      else ny.add(id);
      return ny;
    });
  };

  const settFamilie = (arter: Blomst[], på: boolean) => {
    setKladd((forrige) => {
      const ny = new Set(forrige);
      for (const b of arter) {
        if (på) ny.delete(blomstId(b));
        else ny.add(blomstId(b));
      }
      return ny;
    });
  };

  const alle = () => setKladd(new Set());
  const ingen = () => setKladd(new Set(medBilde.map(blomstId)));

  if (!erÅpen) return null;

  const forFå = antallValgt < 4;

  return (
    <div
      className="fixed inset-0 bg-sand-900/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={onLukk}
    >
      <div
        className="bg-sand-50 w-full sm:max-w-2xl h-[92vh] sm:h-[85vh] sm:rounded-lg shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Velg hvilke arter som er med"
      >
        {/* Topp */}
        <div className="px-5 py-4 border-b border-sand-200 bg-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-skog-800">Hvilke arter vil du øve på?</h2>
              <p className="text-sm text-sand-600 mt-0.5">
                Gjelder både kortene og quizen. Hak av de du vil hoppe over.
              </p>
            </div>
            <button
              onClick={onLukk}
              className="text-sand-500 hover:text-sand-800 text-xl leading-none p-1 -m-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-skog-500"
              aria-label="Lukk"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <input
              type="search"
              value={søk}
              onChange={(e) => setSøk(e.target.value)}
              placeholder="Søk etter art eller familie…"
              className="flex-1 min-w-[180px] px-3 py-2 bg-sand-50 border border-sand-300 rounded text-sm text-sand-900 placeholder:text-sand-400 focus:outline-none focus:border-skog-500 focus:ring-1 focus:ring-skog-500"
            />
            <button
              onClick={alle}
              className="px-3 py-2 text-sm font-medium text-skog-700 bg-skog-50 border border-skog-200 rounded hover:bg-skog-100 transition-colors"
            >
              Velg alle
            </button>
            <button
              onClick={ingen}
              className="px-3 py-2 text-sm font-medium text-sand-700 bg-sand-100 border border-sand-300 rounded hover:bg-sand-200 transition-colors"
            >
              Fjern alle
            </button>
          </div>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {familier.length === 0 ? (
            <p className="text-center text-sand-500 py-12">
              Ingen arter matcher «{søk}».
            </p>
          ) : (
            <div className="space-y-6">
              {familier.map(({ navn, arter }) => {
                const påIFam = arter.filter((b) => !kladd.has(blomstId(b))).length;
                return (
                  <section key={navn}>
                    <div className="flex items-baseline justify-between gap-3 mb-2 pb-1.5 border-b border-sand-200">
                      <h3 className="text-sm font-semibold text-skog-700">{navn}</h3>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-sand-500 tabular-nums">
                          {påIFam}/{arter.length}
                        </span>
                        <button
                          onClick={() => settFamilie(arter, påIFam < arter.length)}
                          className="text-skog-600 hover:text-skog-800 font-medium"
                        >
                          {påIFam < arter.length ? 'Ta med alle' : 'Fjern alle'}
                        </button>
                      </div>
                    </div>
                    <ul className="grid sm:grid-cols-2 gap-x-4">
                      {arter.map((b) => {
                        const av = kladd.has(blomstId(b));
                        return (
                          <li key={blomstId(b)}>
                            <label className="flex items-start gap-2.5 py-1.5 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={!av}
                                onChange={() => vipp(b)}
                                className="mt-0.5 w-4 h-4 shrink-0 accent-skog-600 cursor-pointer"
                              />
                              <span className="min-w-0">
                                <span
                                  className={`block text-sm truncate ${
                                    av ? 'text-sand-400 line-through' : 'text-sand-900'
                                  }`}
                                >
                                  {b.artNorsk}
                                </span>
                                <span
                                  className={`block text-xs italic truncate ${
                                    av ? 'text-sand-300' : 'text-sand-500'
                                  }`}
                                >
                                  {b.vitenskapeligNavn}
                                </span>
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {/* Bunn */}
        <div className="px-5 py-4 border-t border-sand-200 bg-white">
          {forFå && (
            <p className="text-sm text-galt-tekst bg-galt-bg border border-galt-kant rounded px-3 py-2 mb-3">
              Velg minst 4 arter — quizen trenger ett riktig svar og tre alternativer.
            </p>
          )}
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-sand-600 tabular-nums">
              <strong className="text-skog-700 font-semibold">{antallValgt}</strong> av{' '}
              {medBilde.length} arter med
            </span>
            <div className="flex gap-2">
              <button
                onClick={onLukk}
                className="px-4 py-2 text-sm font-medium text-sand-700 border border-sand-300 rounded hover:bg-sand-100 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={() => onLagre(kladd)}
                disabled={forFå}
                className="px-5 py-2 text-sm font-semibold text-white bg-skog-600 rounded hover:bg-skog-700 transition-colors disabled:bg-sand-300 disabled:cursor-not-allowed"
              >
                Bruk utvalget
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
