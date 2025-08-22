// Type-definisjoner for blomsterdata
export interface Blomst {
  familienavn: string;
  vitenskapeligNavn: string;
  slektNorsk: string;
  artNorsk: string;
  sjikt: string;
  bildeUrl: string;
  wikipediaUrl: string;
  bildeStatus: 'FUNNET' | 'IKKE_FUNNET' | 'MANGLER_NAVN';
}

export interface BlomsterData {
  blomster: Blomst[];
  totalAntall: number;
  medBilder: number;
  utenBilder: number;
}
