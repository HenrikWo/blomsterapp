// Type-definisjoner for blomsterdata
export interface Blomst {
    artNorsk: string;           // Fra "Norsk navn"
    vitenskapeligNavn: string;  // Fra "Latinsk navn" 
    familienavn: string;        // Fra "Familie"
    type: string;               // Fra "Type" (erstatter slektNorsk og sjikt)
    bildeUrl: string;           // Fra "bilde_url"
    norskfloraUrl: string;      // Fra "norskflora_url" (erstatter wikipediaUrl)
    bildeStatus: 'FUNNET' | 'IKKE_FUNNET' | 'MANGLER_NAVN';
    
    // Deprecated fields (for bakoverkompatibilitet)
    slektNorsk?: string;        // Kan settes til samme som type eller fjernes
    sjikt?: string;             // Kan settes til samme som type eller fjernes  
    wikipediaUrl?: string;      // Kan settes til samme som norskfloraUrl eller fjernes
}

export interface BlomsterData {
    blomster: Blomst[];
    totalAntall: number;
    medBilder: number;
    utenBilder: number;
}