import type { Blomst } from './types';

const NØKKEL = 'plantepugger:fravalgte';

/**
 * Vi lagrer hvilke arter brukeren har huket AV, ikke hvilke som er på.
 * Da blir nye arter som legges til i CSV-en automatisk med, i stedet for
 * å bli usynlige for alle som har lagret et utvalg tidligere.
 */

/** Stabil id for en art. Latinsk navn er unikt i datasettet. */
export function blomstId(blomst: Blomst): string {
  return blomst.vitenskapeligNavn.trim().toLowerCase();
}

export function lesFravalgte(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const rå = window.localStorage.getItem(NØKKEL);
    if (!rå) return new Set();
    const liste = JSON.parse(rå);
    return Array.isArray(liste) ? new Set(liste as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function skrivFravalgte(fravalgte: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(NØKKEL, JSON.stringify([...fravalgte]));
  } catch {
    // Full localStorage eller privat modus - utvalget gjelder da bare denne økten
  }
}

/** Artene som er med etter brukerens utvalg. */
export function filtrerValgte(blomster: Blomst[], fravalgte: Set<string>): Blomst[] {
  if (fravalgte.size === 0) return blomster;
  return blomster.filter((b) => !fravalgte.has(blomstId(b)));
}

/** Arter som faktisk kan vises - har bilde og er ikke huket av. */
export function brukbareBlomster(blomster: Blomst[], fravalgte: Set<string>): Blomst[] {
  return filtrerValgte(blomster, fravalgte).filter(
    (b) => b.bildeStatus === 'FUNNET' && b.bildeUrls.length > 0
  );
}

/** Færreste arter en quiz gir mening med: fasit + tre alternativer. */
export const MIN_FOR_QUIZ = 4;
