import Papa from 'papaparse';
import type { Blomst, BlomsterData } from './types';

// Cache for å unngå å lese CSV flere ganger
let cachedData: BlomsterData | null = null;

export async function loadBlomsterData(): Promise<BlomsterData> {
  if (cachedData) {
    return cachedData;
  }

  try {
    // Last CSV fra public/data
    const response = await fetch('/data/blomster.csv');
    const csvText = await response.text();
    
    // Parse CSV
    const parseResult = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false // Behold alt som strings
    });

    if (parseResult.errors.length > 0) {
      console.warn('CSV parsing errors:', parseResult.errors);
    }

    // Konverter til vårt format
    const blomster: Blomst[] = parseResult.data
      .map((row: any) => ({
        familienavn: row['Familienavn'] || '',
        vitenskapeligNavn: row['Vitenskapelig navn'] || '',
        slektNorsk: row['Slekt - Norsk'] || '',
        artNorsk: row['Art - Norsk'] || '',
        sjikt: row['Sjikt'] || '',
        bildeUrl: row['bilde_url'] || '',
        wikipediaUrl: row['wikipedia_url'] || '',
        bildeStatus: row['bilde_status'] as 'FUNNET' | 'IKKE_FUNNET' | 'MANGLER_NAVN' || 'IKKE_FUNNET'
      }))
      .filter((blomst: Blomst) => blomst.artNorsk.trim() !== ''); // Fjern tomme rader

    // Statistikk
    const medBilder = blomster.filter(b => b.bildeStatus === 'FUNNET').length;
    const utenBilder = blomster.length - medBilder;

    cachedData = {
      blomster,
      totalAntall: blomster.length,
      medBilder,
      utenBilder
    };

    console.log(`📊 Lastet ${blomster.length} blomster (${medBilder} med bilder)`);
    return cachedData;

  } catch (error) {
    console.error('Feil ved lasting av blomsterdata:', error);
    throw new Error('Kunne ikke laste blomsterdata');
  }
}

// Hjelpefunksjoner
export function getTilfeldigBlomst(blomster: Blomst[]): Blomst | null {
  const blomsterMedBilder = blomster.filter(b => b.bildeStatus === 'FUNNET');
  
  if (blomsterMedBilder.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * blomsterMedBilder.length);
  return blomsterMedBilder[randomIndex];
}

export function getTilfeldigeBlomster(blomster: Blomst[], antall: number = 5): Blomst[] {
  const blomsterMedBilder = blomster.filter(b => b.bildeStatus === 'FUNNET');
  
  if (blomsterMedBilder.length <= antall) {
    return blomsterMedBilder;
  }
  
  // Shuffle array og ta de første
  const shuffled = [...blomsterMedBilder].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, antall);
}

export function søkBlomster(blomster: Blomst[], søketerm: string): Blomst[] {
  const term = søketerm.toLowerCase().trim();
  
  if (!term) return blomster;
  
  return blomster.filter(blomst => 
    blomst.artNorsk.toLowerCase().includes(term) ||
    blomst.vitenskapeligNavn.toLowerCase().includes(term) ||
    blomst.familienavn.toLowerCase().includes(term) ||
    blomst.slektNorsk.toLowerCase().includes(term)
  );
}