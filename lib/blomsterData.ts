// Cache for å unngå å lese CSV flere ganger
let cachedData: BlomsterData | null = null;import Papa from 'papaparse';
import type { Blomst, BlomsterData } from './types';

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

    // Konverter til vårt format - eksakt matching til ditt CSV format
    const blomster: Blomst[] = parseResult.data
      .map((row: any) => {
        const norskNavn = row['norsk_navn']?.trim() || '';
        const latinskNavn = row['latinsk_navn']?.trim() || '';
        const familie = row['familie']?.trim() || '';
        const type = row['type']?.trim() || '';
        const norskfloraUrl = row['norskflora_url']?.trim() || '';
        const wikipediaUrl = row['wikipedia_url']?.trim() || '';

        // Samle alle tilgjengelige bilder fra alle kilder
        const bildeUrls: string[] = [];
        
        // 1. Legg til originale Norsk Flora bilder (hvis de fortsatt finnes i en kolonne)
        if (row['bilde_url'] && row['bilde_url'].trim() !== '') {
          bildeUrls.push(row['bilde_url'].trim());
        }
        
        // 2. Legg til wikipedia_image_url hvis den finnes og ikke er tom
        if (row['wikipedia_image_url'] && row['wikipedia_image_url'].trim() !== '') {
          bildeUrls.push(row['wikipedia_image_url'].trim());
        }
        
        // 3. Legg til wikipedia_image_file hvis den finnes, ikke er tom, og er forskjellig fra url
        if (row['wikipedia_image_file'] && 
            row['wikipedia_image_file'].trim() !== '' && 
            row['wikipedia_image_file'].trim() !== row['wikipedia_image_url']) {
          bildeUrls.push(row['wikipedia_image_file'].trim());
        }

        // 4. Legg til norskflora_url som et visbart innhold (for informasjon)
        if (row['norskflora_url'] && 
            row['norskflora_url'].trim() !== '' && 
            row['norskflora_url'].includes('norskflora.no')) {
          bildeUrls.push(row['norskflora_url'].trim());
        }

        // Bestem bildeStatus
        let bildeStatus: 'FUNNET' | 'IKKE_FUNNET' | 'MANGLER_NAVN' = 'IKKE_FUNNET';
        
        if (!row['norsk_navn'] || row['norsk_navn'].trim() === '') {
          bildeStatus = 'MANGLER_NAVN';
        } else if ((row['wikipedia_status'] === 'SUCCESS' || row['wikipedia_status'] === 'FUNNET') && bildeUrls.length > 0) {
          bildeStatus = 'FUNNET';
        }

        return {
          artNorsk: norskNavn,
          vitenskapeligNavn: latinskNavn,
          familienavn: familie,
          type: type,
          bildeUrl: bildeUrls[0] || '', // Første bilde som primærbilde
          bildeUrls: bildeUrls,
          norskfloraUrl: norskfloraUrl,
          wikipediaUrl: wikipediaUrl,
          bildeStatus,
          
          // For bakoverkompatibilitet - sett deprecated fields
          slektNorsk: type,
          sjikt: type,
        };
      })
      .filter((blomst: Blomst) => blomst.artNorsk.trim() !== ''); // Fjern rader uten navn

    // Statistikk
    const medBilder = blomster.filter(b => b.bildeStatus === 'FUNNET').length;
    const utenBilder = blomster.length - medBilder;
    const flereBilder = blomster.filter(b => b.bildeUrls.length > 1).length;

    cachedData = {
      blomster,
      totalAntall: blomster.length,
      medBilder,
      utenBilder
    };

    console.log(`📊 Lastet ${blomster.length} blomster`);
    console.log(`   ✅ ${medBilder} med bilder`);
    console.log(`   ❌ ${utenBilder} uten bilder`);
    console.log(`   🖼️ ${flereBilder} med flere bilder`);
    
    // Vis noen eksempler
    const eksempelMedBilde = blomster.find(b => b.bildeStatus === 'FUNNET');
    if (eksempelMedBilde) {
      console.log('✅ Eksempel med bilder:', {
        navn: eksempelMedBilde.artNorsk,
        antallBilder: eksempelMedBilde.bildeUrls.length,
        bilder: eksempelMedBilde.bildeUrls.map((url, i) => `${i+1}: ${url.substring(0, 60)}...`)
      });
    }

    return cachedData;

  } catch (error) {
    console.error('Feil ved lasting av blomsterdata:', error);
    throw new Error('Kunne ikke laste blomsterdata');
  }
}

// Hjelpefunksjoner
export function getTilfeldigBlomst(blomster: Blomst[]): Blomst | null {
  const blomsterMedBilder = blomster.filter(b => b.bildeStatus === 'FUNNET' && b.bildeUrls.length > 0);
  
  if (blomsterMedBilder.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * blomsterMedBilder.length);
  return blomsterMedBilder[randomIndex];
}

export function getTilfeldigeBlomster(blomster: Blomst[], antall: number = 5): Blomst[] {
  const blomsterMedBilder = blomster.filter(b => b.bildeStatus === 'FUNNET' && b.bildeUrls.length > 0);
  
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
    blomst.type.toLowerCase().includes(term)
  );
}