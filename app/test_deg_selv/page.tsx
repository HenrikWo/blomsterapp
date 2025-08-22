'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { loadBlomsterData } from '@/lib/blomsterData';
import { genererQuiz, beregnKarakter } from '@/lib/quizTypes';
import type { BlomsterData, Blomst } from '@/lib/types';
import type { QuizSpørsmål, QuizSvar, QuizResultat } from '@/lib/quizTypes';

export default function TestDegSelv() {
  const router = useRouter();
  const [blomsterData, setBlomsterData] = useState<BlomsterData | null>(null);
  const [quiz, setQuiz] = useState<QuizSpørsmål[]>([]);
  const [gjeldendespørsmål, setGjeldendespørsmål] = useState(0);
  const [svar, setSvar] = useState<QuizSvar[]>([]);
  const [valgtSvar, setValgtSvar] = useState<string | null>(null);
  const [visResultat, setVisResultat] = useState(false);
  const [quizResultat, setQuizResultat] = useState<QuizResultat | null>(null);
  const [laster, setLaster] = useState(true);
  const [feil, setFeil] = useState<string | null>(null);
  const [bildeLastet, setBildeLastet] = useState(false);

  // Last data og generer quiz
  useEffect(() => {
    async function initQuiz() {
      try {
        setLaster(true);
        const data = await loadBlomsterData();
        setBlomsterData(data);
        
        const nyttQuiz = genererQuiz(data.blomster, 10);
        setQuiz(nyttQuiz);
        
      } catch (error) {
        console.error('Feil ved lasting av quiz:', error);
        setFeil('Kunne ikke laste quiz-data');
      } finally {
        setLaster(false);
      }
    }

    initQuiz();
  }, []);

  // Reset bilde-loading når nytt spørsmål
  useEffect(() => {
    setBildeLastet(false);
  }, [gjeldendespørsmål]);

  const handleSvar = (valgtAlternativ: string) => {
    if (valgtSvar) return; // Allerede svart
    
    setValgtSvar(valgtAlternativ);
    
    const gjeldende = quiz[gjeldendespørsmål];
    const nyttSvar: QuizSvar = {
      spørsmålIndex: gjeldendespørsmål,
      valgtSvar: valgtAlternativ,
      riktigSvar: gjeldende.riktigSvar,
      erRiktig: valgtAlternativ === gjeldende.riktigSvar
    };
    
    setSvar(prev => [...prev, nyttSvar]);
    
    // Gå videre etter 1.5 sekunder
    setTimeout(() => {
      if (gjeldendespørsmål < quiz.length - 1) {
        setGjeldendespørsmål(prev => prev + 1);
        setValgtSvar(null);
      } else {
        // Quiz ferdig
        avsluttQuiz([...svar, nyttSvar]);
      }
    }, 1500);
  };

  const avsluttQuiz = (alleSvar: QuizSvar[]) => {
    const riktigeSvar = alleSvar.filter(s => s.erRiktig).length;
    const { karakter, beskrivelse } = beregnKarakter(riktigeSvar, quiz.length);
    
    const resultat: QuizResultat = {
      totalSpørsmål: quiz.length,
      riktigeSvar,
      poengsum: Math.round((riktigeSvar / quiz.length) * 100),
      svar: alleSvar,
      karakter,
      beskrivelse
    };
    
    setQuizResultat(resultat);
    setVisResultat(true);
  };

  const startNyttQuiz = () => {
    if (blomsterData) {
      const nyttQuiz = genererQuiz(blomsterData.blomster, 10);
      setQuiz(nyttQuiz);
      setGjeldendespørsmål(0);
      setSvar([]);
      setValgtSvar(null);
      setVisResultat(false);
      setQuizResultat(null);
    }
  };

  // Loading state
  if (laster) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-lg text-emerald-700">Forbereder quiz...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (feil || quiz.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-800 mb-4">Quiz ikke tilgjengelig</h1>
          <p className="text-red-600 mb-6">{feil || 'For få blomster med bilder for å lage quiz'}</p>
          <Link href="/" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors">
            Tilbake til hovedsiden
          </Link>
        </div>
      </div>
    );
  }

  // Resultat screen
  if (visResultat && quizResultat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
              🎉 Quiz fullført!
            </h1>
            <p className="text-emerald-600">Her er ditt resultat:</p>
          </div>

          {/* Resultat kort */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 shadow-lg mb-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-emerald-800 mb-4">
                {quizResultat.riktigeSvar} av {quizResultat.totalSpørsmål} riktige
              </h2>
              <div className="text-2xl font-bold text-emerald-600 mb-4">
                {quizResultat.poengsum}%
              </div>
              <p className="text-lg text-emerald-700">{quizResultat.beskrivelse}</p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-4 rounded-full transition-all duration-1000"
                style={{ width: `${quizResultat.poengsum}%` }}
              ></div>
            </div>

            {/* Knapper */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={startNyttQuiz}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-md"
              >
                🔄 Nytt quiz
              </button>
              <Link
                href="/"
                className="px-8 py-3 bg-white/80 hover:bg-white text-emerald-600 border border-emerald-300 rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-md"
              >
                🏠 Tilbake hjem
              </Link>
            </div>
          </div>

          {/* Detaljert oversikt */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6">
            <h3 className="text-lg font-bold text-emerald-800 mb-4">📊 Detaljert oversikt:</h3>
            <div className="space-y-3">
              {quizResultat.svar.map((svar, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-xl ${svar.erRiktig ? 'bg-green-100' : 'bg-red-100'}`}>
                  <div>
                    <span className="font-medium">Spørsmål {index + 1}:</span>
                    <span className="ml-2">{svar.riktigSvar}</span>
                  </div>
                  <div className="text-2xl">
                    {svar.erRiktig ? '✅' : '❌'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz screen
  const gjeldende = quiz[gjeldendespørsmål];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        
        {/* Header med progress */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4 text-emerald-600 hover:text-emerald-800 transition-colors">
            ← Tilbake til hovedsiden
          </Link>
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            🧠 Test deg selv
          </h1>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-emerald-600 font-medium">
              Spørsmål {gjeldendespørsmål + 1} av {quiz.length}
            </span>
            <div className="flex-1 max-w-xs bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((gjeldendespørsmål + 1) / quiz.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Spørsmål */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden mb-8">
          
          {/* Bilde */}
          <div className="relative h-80 bg-gradient-to-br from-emerald-50 to-teal-50">
            <Image
              src={gjeldende.blomst.bildeUrl}
              alt="Gjett blomsten"
              fill
              className={`transition-opacity duration-500 ${bildeLastet ? 'opacity-100' : 'opacity-0'}`}
              style={{ objectFit: 'contain' }}
              onLoad={() => setBildeLastet(true)}
              unoptimized
              priority
            />
            
            {!bildeLastet && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
              </div>
            )}
          </div>

          {/* Spørsmål og svar */}
          <div className="p-6">
            <h2 className="text-xl font-bold text-emerald-800 text-center mb-6">
              Hvilken blomst er dette?
            </h2>

            <div className="grid grid-cols-1 gap-3">
              {gjeldende.alternativer.map((alternativ, index) => {
                let buttonClass = "w-full p-4 text-left border-2 rounded-xl font-medium transition-all duration-200 ";
                
                if (valgtSvar) {
                  // Quiz er besvart
                  if (alternativ === gjeldende.riktigSvar) {
                    buttonClass += "border-green-500 bg-green-100 text-green-800"; // Riktig svar
                  } else if (alternativ === valgtSvar) {
                    buttonClass += "border-red-500 bg-red-100 text-red-800"; // Feil valg
                  } else {
                    buttonClass += "border-gray-300 bg-gray-50 text-gray-500"; // Andre alternativer
                  }
                } else {
                  // Kan fortsatt svare
                  buttonClass += "border-emerald-300 bg-white hover:border-emerald-500 hover:bg-emerald-50 text-emerald-800 hover:scale-102 cursor-pointer";
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleSvar(alternativ)}
                    disabled={valgtSvar !== null}
                    className={buttonClass}
                  >
                    <span className="font-bold mr-3">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {alternativ}
                    
                    {valgtSvar && alternativ === gjeldende.riktigSvar && (
                      <span className="float-right text-green-600">✅</span>
                    )}
                    {valgtSvar && alternativ === valgtSvar && alternativ !== gjeldende.riktigSvar && (
                      <span className="float-right text-red-600">❌</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Poengsum så langt */}
        <div className="text-center text-emerald-600">
          <span className="font-medium">
            Poeng så langt: {svar.filter(s => s.erRiktig).length} av {svar.length}
          </span>
        </div>
      </div>
    </div>
  );
}