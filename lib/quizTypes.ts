import type { Blomst } from './types';

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

export function genererQuiz(blomster: Blomst[], antallSpørsmål: number = 10): QuizSpørsmål[] {
  const blomsterMedBilder = blomster.filter(b => b.bildeStatus === 'FUNNET');

  // Fasit + tre alternativer krever minst fire arter
  if (blomsterMedBilder.length < 4) {
    throw new Error('Velg minst 4 arter for å ta quiz');
  }

  // Har brukeren valgt færre arter enn 10, blir quizen tilsvarende kortere
  const lengde = Math.min(antallSpørsmål, blomsterMedBilder.length);

  // Shuffle og velg tilfeldige blomster
  const shuffled = [...blomsterMedBilder].sort(() => 0.5 - Math.random());
  const valgteBlomseter = shuffled.slice(0, lengde);

  return valgteBlomseter.map(blomst => {
    // Finn andre blomster for feil-alternativer
    const andreBlomseter = blomsterMedBilder
      .filter(b => b.artNorsk !== blomst.artNorsk)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    // Lag alternativer
    const alternativer = [
      blomst.artNorsk,
      ...andreBlomseter.map(b => b.artNorsk)
    ].sort(() => 0.5 - Math.random()); // Shuffle rekkefølgen

    return {
      blomst,
      alternativer,
      riktigSvar: blomst.artNorsk
    };
  });
}

export function beregnKarakter(riktigeSvar: number, totalSpørsmål: number): { karakter: string; beskrivelse: string } {
  const prosent = (riktigeSvar / totalSpørsmål) * 100;
  
  if (prosent >= 90) {
    return { karakter: '', beskrivelse: '🌟 Eksepsjonelt! Du er en blomsterekspert!' };
  } else if (prosent >= 80) {
    return { karakter: '', beskrivelse: '🌸 Meget bra! Du kjenner blomstene godt!' };
  } else if (prosent >= 70) {
    return { karakter: '', beskrivelse: '🌱 Bra jobbet! Du er på god vei!' };
  } else if (prosent >= 60) {
    return { karakter: '', beskrivelse: '🌿 Greit! Litt mer trening så blir du ekspert!' };
  } else if (prosent >= 50) {
    return { karakter: '', beskrivelse: '🍃 Bra forsøk! Øv litt mer så kommer du dit!' };
  } else if (prosent >= 30) {
    return { karakter: '', beskrivelse: '🌺 Nesten der! Lykke til neste gang!' };
  } else {
    return { karakter: '', beskrivelse: '🌷 Godt forsøk! Det blir bare bedre fremover!' };
  }
}