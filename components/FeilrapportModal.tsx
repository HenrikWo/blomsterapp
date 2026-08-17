'use client';

import { useState } from 'react';
import type { Blomst } from '@/lib/types';

interface FeilrapportModalProps {
  blomst: Blomst;
  erÅpen: boolean;
  onLukk: () => void;
}

const FEIL_TYPER = [
  { id: 'feil_bilde', tekst: 'Feil blomst på bildet' },
  { id: 'feil_navn', tekst: 'Feil norsk navn' },
  { id: 'feil_latin', tekst: 'Feil latinsk navn' },
  { id: 'feil_familie', tekst: 'Feil familie/type' },
  { id: 'dårlig_bilde', tekst: 'Dårlig bildekvalitet' },
  { id: 'ødelagt_link', tekst: 'Bildet laster ikke' },
  { id: 'annet', tekst: 'Annet' }
];

export default function FeilrapportModal({ blomst, erÅpen, onLukk }: FeilrapportModalProps) {
  const [valgteFeilen, setValgteFeilen] = useState<string[]>([]);
  const [kommentar, setKommentar] = useState('');

  const handleFeilToggle = (feilId: string) => {
    setValgteFeilen(prev => 
      prev.includes(feilId) 
        ? prev.filter(id => id !== feilId)
        : [...prev, feilId]
    );
  };

  const handleSend = () => {
    if (valgteFeilen.length === 0) return;
    
    // Bygg feilrapport
    const feilTyper = valgteFeilen.map(id => 
      FEIL_TYPER.find(type => type.id === id)?.tekst
    ).join(', ');
    
    // Åpne e-post direkte
    const subject = encodeURIComponent(`Plantepugger feilrapport: ${blomst.artNorsk}`);
    const body = encodeURIComponent(
      `FEILRAPPORT FOR PLANTEPUGGER\n\n` +
      `Blomst: ${blomst.artNorsk}\n` +
      `Latinsk: ${blomst.vitenskapeligNavn}\n` +
      `Familie: ${blomst.familienavn}\n` +
      `Type: ${blomst.type}\n` +
      `Bilde: ${blomst.bildeUrl}\n` +
      `Norsk Flora: ${blomst.norskfloraUrl}\n\n` +
      `FEIL FUNNET:\n${feilTyper}\n\n` +
      `KOMMENTAR:\n${kommentar}\n\n` +
      `Rapportert: ${new Date().toLocaleString('no-NO')}`
    );
    
    // Åpne e-post
    window.open(`mailto:henrik@example.com?subject=${subject}&body=${body}`);
    
    // Reset og lukk
    setValgteFeilen([]);
    setKommentar('');
    onLukk();
  };

  const handleLukk = () => {
    setValgteFeilen([]);
    setKommentar('');
    onLukk();
  };

  if (!erÅpen) return null;

  return (
    <div className="fixed inset-0 bg-sand-900/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded max-w-md w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-4 border-b border-sand-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-skog-800">Rapporter feil</h2>
            <button 
              onClick={handleLukk}
              className="text-sand-500 hover:text-sand-800 text-xl"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-sand-600 mt-1">
            <strong>{blomst.artNorsk}</strong> ({blomst.vitenskapeligNavn})
          </p>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Feiltyper */}
          <div className="mb-6">
            <h3 className="font-semibold text-sand-800 mb-3">Hva er feil?</h3>
            <div className="space-y-2">
              {FEIL_TYPER.map(feilType => (
                <label key={feilType.id} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={valgteFeilen.includes(feilType.id)}
                    onChange={() => handleFeilToggle(feilType.id)}
                    className="mr-3 w-4 h-4 accent-skog-600 cursor-pointer"
                  />
                  <span className="text-sand-700">{feilType.tekst}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Kommentar */}
          <div className="mb-6">
            <label htmlFor="kommentar" className="block font-semibold text-sand-800 mb-2">
              Tilleggsinformasjon (valgfritt)
            </label>
            <textarea
              id="kommentar"
              value={kommentar}
              onChange={(e) => setKommentar(e.target.value)}
              placeholder="Forklar gjerne mer detaljert hva som er feil..."
              className="w-full p-3 border border-sand-300 rounded resize-none h-20 focus:outline-none focus:border-skog-500 focus:ring-1 focus:ring-skog-500"
            />
          </div>

          {/* Info boks */}
          <div className="mb-6 p-3 bg-sand-100 border border-sand-200 rounded">
            <p className="text-sm text-sand-700">
              Dette åpner e-postappen din med ferdig utfylt rapport som sendes til utvikleren.
            </p>
          </div>

          {/* Knapper */}
          <div className="flex gap-3">
            <button
              onClick={handleLukk}
              className="flex-1 px-4 py-2 border border-sand-300 text-sand-700 rounded hover:bg-sand-100 transition-colors"
            >
              Avbryt
            </button>
            <button
              onClick={handleSend}
              disabled={valgteFeilen.length === 0}
              className="flex-1 px-4 py-2 bg-skog-600 text-white rounded hover:bg-skog-700 disabled:bg-sand-300 disabled:cursor-not-allowed transition-colors"
            >
              Send e-post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}