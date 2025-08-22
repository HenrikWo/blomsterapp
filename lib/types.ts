// Type-definisjoner for blomsterdata
export interface Blomst {
    artNorsk: string;           // Fra "norsk_navn"
    vitenskapeligNavn: string;  // Fra "latinsk_navn" 
    familienavn: string;        // Fra "familie"
    type: string;               // Fra "type"
    bildeUrl: string;           // Fra "wikipedia_image_url" (primærbilde)
    bildeUrls: string[];        // Array med alle tilgjengelige bilder
    norskfloraUrl: string;      // Fra "norskflora_url"
    wikipediaUrl: string;       // Fra "wikipedia_url"
    bildeStatus: 'FUNNET' | 'IKKE_FUNNET' | 'MANGLER_NAVN';
    
    // Deprecated fields (for bakoverkompatibilitet)
    slektNorsk?: string;        // Kan settes til samme som type eller fjernes
    sjikt?: string;             // Kan settes til samme som type eller fjernes
}

export interface BlomsterData {
    blomster: Blomst[];
    totalAntall: number;
    medBilder: number;
    utenBilder: number;
}

export interface QuizSpørsmål {
  blomst: Blomst;
  alternativer: string[];
  riktigSvar: string;
}

export interface QuizSvar {
  spørsmålIndex: number;
  valgtSvar: string;
  riktigSvar: string;
  erRiktig: boolean;
}

export interface QuizResultat {
  totalSpørsmål: number;
  riktigeSvar: number;
  poengsum: number;
  svar: QuizSvar[];
  karakter: string;
  beskrivelse: string;
}