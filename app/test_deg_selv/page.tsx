'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import UtvalgModal from '@/components/UtvalgModal';
import { loadBlomsterData } from '@/lib/blomsterData';
import { genererQuiz, beregnKarakter } from '@/lib/quizTypes';
import { lesFravalgte, skrivFravalgte, brukbareBlomster, MIN_FOR_QUIZ } from '@/lib/utvalg';
import type { BlomsterData } from '@/lib/types';
import type { QuizSpørsmål, QuizSvar, QuizResultat } from '@/lib/quizTypes';

/** Bildelenker vi faktisk kan vise. Sidene og kortet bruker samme regel. */
function bildeneTil(spørsmål?: QuizSpørsmål): string[] {
  return (
    spørsmål?.blomst.bildeUrls?.filter(
      (url) =>
        url &&
        url.trim() !== '' &&
        (url.includes('.jpg') ||
          url.includes('.png') ||
          url.includes('.jpeg') ||
          url.includes('.webp') ||
          url.includes('.gif') ||
          url.includes('wikimedia.org'))
    ) || []
  );
}

export default function TestDegSelv() {
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
  const [fravalgte, setFravalgte] = useState<Set<string>>(new Set());
  const [visUtvalg, setVisUtvalg] = useState(false);

  // Swipe-relaterte states
  const [aktivtBildeIndex, setAktivtBildeIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 30;

  // Last data og generer quiz
  useEffect(() => {
    async function initQuiz() {
      try {
        setLaster(true);
        const lagret = lesFravalgte();
        setFravalgte(lagret);

        const data = await loadBlomsterData();
        setBlomsterData(data);

        const utvalg = brukbareBlomster(data.blomster, lagret);
        if (utvalg.length < MIN_FOR_QUIZ) {
          setFeil(`Du har bare ${utvalg.length} arter i utvalget. Quizen trenger minst ${MIN_FOR_QUIZ}.`);
          return;
        }
        setQuiz(genererQuiz(utvalg, 10));
      } catch (error) {
        console.error('Feil ved lasting av quiz:', error);
        setFeil('Kunne ikke laste quiz-data');
      } finally {
        setLaster(false);
      }
    }

    initQuiz();
  }, []);

  // Reset bilde-loading og swipe state når nytt spørsmål
  useEffect(() => {
    setBildeLastet(false);
    setAktivtBildeIndex(0);
    setDragOffset(0);
    setIsDragging(false);
  }, [gjeldendespørsmål]);

  // Swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    if (bildeneTil(quiz[gjeldendespørsmål]).length <= 1) return;

    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const gyldigeBilder = bildeneTil(quiz[gjeldendespørsmål]);
    if (gyldigeBilder.length <= 1 || !touchStart) return;

    e.preventDefault();

    const currentTouch = e.targetTouches[0].clientX;
    const diff = currentTouch - touchStart;
    setTouchEnd(currentTouch);

    const maxDrag = 150;
    const limitedDiff = Math.max(-maxDrag, Math.min(maxDrag, diff));

    let finalOffset = limitedDiff;
    if (
      (aktivtBildeIndex === 0 && diff > 0) ||
      (aktivtBildeIndex === gyldigeBilder.length - 1 && diff < 0)
    ) {
      finalOffset = limitedDiff * 0.3;
    }

    setDragOffset(finalOffset);
  };

  const onTouchEnd = () => {
    const gyldigeBilder = bildeneTil(quiz[gjeldendespørsmål]);

    if (gyldigeBilder.length <= 1 || !touchStart || !touchEnd) {
      setDragOffset(0);
      setIsDragging(false);
      return;
    }

    const distance = touchStart - touchEnd;
    const velocity = Math.abs(distance) / 100;
    const isLeftSwipe = distance > minSwipeDistance || (distance > 10 && velocity > 0.5);
    const isRightSwipe = distance < -minSwipeDistance || (distance < -10 && velocity > 0.5);

    if (isLeftSwipe && aktivtBildeIndex < gyldigeBilder.length - 1) {
      setAktivtBildeIndex((prev) => prev + 1);
      setBildeLastet(false);
    } else if (isRightSwipe && aktivtBildeIndex > 0) {
      setAktivtBildeIndex((prev) => prev - 1);
      setBildeLastet(false);
    }

    setDragOffset(0);
    setIsDragging(false);
  };

  const navigerTilBilde = (index: number, e?: React.MouseEvent) => {
    const gyldigeBilder = bildeneTil(quiz[gjeldendespørsmål]);

    if (index !== aktivtBildeIndex && index >= 0 && index < gyldigeBilder.length) {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      setAktivtBildeIndex(index);
      setBildeLastet(false);
    }
  };

  const getBildeLabel = (url: string) =>
    url.includes('wikimedia.org') ? 'Wikipedia' : 'Norsk Flora';

  const handleSvar = (valgtAlternativ: string) => {
    if (valgtSvar) return; // Allerede svart

    setValgtSvar(valgtAlternativ);

    // Fjern focus fra alle knapper for å resette hover/focus-states
    if (document.activeElement && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const gjeldende = quiz[gjeldendespørsmål];
    const nyttSvar: QuizSvar = {
      spørsmålIndex: gjeldendespørsmål,
      valgtSvar: valgtAlternativ,
      riktigSvar: gjeldende.riktigSvar,
      erRiktig: valgtAlternativ === gjeldende.riktigSvar,
    };

    setSvar((prev) => [...prev, nyttSvar]);

    setTimeout(() => {
      if (gjeldendespørsmål < quiz.length - 1) {
        setValgtSvar(null);
        setTimeout(() => {
          setGjeldendespørsmål((prev) => prev + 1);
          setTimeout(() => {
            if (document.activeElement && document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
          }, 50);
        }, 100);
      } else {
        avsluttQuiz([...svar, nyttSvar]);
      }
    }, 1500);
  };

  const avsluttQuiz = (alleSvar: QuizSvar[]) => {
    const riktigeSvar = alleSvar.filter((s) => s.erRiktig).length;
    const { karakter, beskrivelse } = beregnKarakter(riktigeSvar, quiz.length);

    setQuizResultat({
      totalSpørsmål: quiz.length,
      riktigeSvar,
      poengsum: Math.round((riktigeSvar / quiz.length) * 100),
      svar: alleSvar,
      karakter,
      beskrivelse,
    });
    setVisResultat(true);
  };

  const startNyttQuiz = (nyeFravalgte: Set<string> = fravalgte) => {
    if (!blomsterData) return;
    const utvalg = brukbareBlomster(blomsterData.blomster, nyeFravalgte);
    if (utvalg.length < MIN_FOR_QUIZ) {
      setFeil(`Du har bare ${utvalg.length} arter i utvalget. Quizen trenger minst ${MIN_FOR_QUIZ}.`);
      setQuiz([]);
      return;
    }
    setFeil(null);
    setQuiz(genererQuiz(utvalg, 10));
    setGjeldendespørsmål(0);
    setSvar([]);
    setValgtSvar(null);
    setVisResultat(false);
    setQuizResultat(null);
    setAktivtBildeIndex(0);
    setDragOffset(0);
    setIsDragging(false);
  };

  const lagreUtvalg = (nyeFravalgte: Set<string>) => {
    setFravalgte(nyeFravalgte);
    skrivFravalgte(nyeFravalgte);
    setVisUtvalg(false);
    startNyttQuiz(nyeFravalgte);
  };

  const utvalgModal = blomsterData ? (
    <UtvalgModal
      blomster={blomsterData.blomster}
      fravalgte={fravalgte}
      erÅpen={visUtvalg}
      onLukk={() => setVisUtvalg(false)}
      onLagre={lagreUtvalg}
    />
  ) : null;

  // Loading state
  if (laster) {
    return (
      <div className="min-h-screen bg-sand-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-sand-300 border-t-skog-600 mx-auto mb-4"></div>
          <p className="text-sand-600">Forbereder quiz…</p>
        </div>
      </div>
    );
  }

  // Error state
  if (feil || quiz.length === 0) {
    return (
      <div className="min-h-screen bg-sand-100 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold text-sand-800 mb-3">Quiz ikke tilgjengelig</h1>
          <p className="text-sand-600 mb-6">
            {feil || 'For få arter med bilder til å lage quiz'}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setVisUtvalg(true)}
              className="px-5 py-2.5 bg-skog-600 hover:bg-skog-700 text-white rounded font-semibold transition-colors"
            >
              Velg arter
            </button>
            <Link
              href="/"
              className="px-5 py-2.5 border border-sand-300 text-sand-700 rounded font-medium hover:bg-sand-200 transition-colors"
            >
              Tilbake
            </Link>
          </div>
        </div>
        {utvalgModal}
      </div>
    );
  }

  // Resultat screen
  if (visResultat && quizResultat) {
    return (
      <div className="min-h-screen bg-sand-100 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white border border-sand-200 rounded p-8 mb-6">
            <div className="text-center mb-6">
              <p className="text-sm uppercase tracking-wider text-sand-500 mb-3">Quiz fullført</p>
              <h1 className="text-3xl font-semibold text-skog-800 mb-1 tabular-nums">
                {quizResultat.riktigeSvar} av {quizResultat.totalSpørsmål} riktige
              </h1>
              <p className="text-2xl font-semibold text-skog-600 tabular-nums mb-3">
                {quizResultat.poengsum}%
              </p>
              <p className="text-sand-700">{quizResultat.beskrivelse}</p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-sand-200 rounded-full h-2 mb-7">
              <div
                className="bg-skog-600 h-2 rounded-full transition-all duration-700"
                style={{ width: `${quizResultat.poengsum}%` }}
              ></div>
            </div>

            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => startNyttQuiz()}
                className="px-6 py-2.5 bg-skog-600 hover:bg-skog-700 text-white rounded font-semibold transition-colors"
              >
                Ny quiz
              </button>
              <button
                onClick={() => setVisUtvalg(true)}
                className="px-6 py-2.5 border border-skog-300 text-skog-700 rounded font-medium hover:bg-skog-50 transition-colors"
              >
                Velg arter
              </button>
              <Link
                href="/"
                className="px-6 py-2.5 border border-sand-300 text-sand-700 rounded font-medium hover:bg-sand-200 transition-colors"
              >
                Tilbake
              </Link>
            </div>
          </div>

          {/* Detaljert oversikt */}
          <div className="bg-white border border-sand-200 rounded p-6">
            <h2 className="font-semibold text-skog-800 mb-4">Gjennomgang</h2>
            <ul className="divide-y divide-sand-200">
              {quizResultat.svar.map((s, index) => (
                <li key={index} className="flex items-center justify-between gap-4 py-2.5">
                  <div className="min-w-0">
                    <span className="text-sm text-sand-500 tabular-nums mr-2">{index + 1}.</span>
                    <span className="font-medium text-sand-900">{s.riktigSvar}</span>
                    {!s.erRiktig && (
                      <span className="block ml-6 text-sm text-galt-tekst">
                        Du svarte: {s.valgtSvar}
                      </span>
                    )}
                  </div>
                  <span
                    className={`shrink-0 text-xs font-semibold px-2 py-1 rounded ${
                      s.erRiktig
                        ? 'bg-riktig-bg text-riktig-tekst'
                        : 'bg-galt-bg text-galt-tekst'
                    }`}
                  >
                    {s.erRiktig ? 'Riktig' : 'Feil'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {utvalgModal}
      </div>
    );
  }

  // Quiz screen
  const gjeldende = quiz[gjeldendespørsmål];
  const gyldigeBilder = bildeneTil(gjeldende);
  const harFlereBilder = gyldigeBilder.length > 1;
  const aktivtBilde = gyldigeBilder[aktivtBildeIndex] || gjeldende.blomst.bildeUrl;

  return (
    <div className="min-h-screen bg-sand-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header med progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <Link
              href="/"
              className="text-sm text-skog-600 hover:text-skog-800 transition-colors"
            >
              ← Tilbake
            </Link>
            <button
              onClick={() => setVisUtvalg(true)}
              className="text-sm text-skog-600 hover:text-skog-800 transition-colors"
            >
              Velg arter
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-sand-600 tabular-nums whitespace-nowrap">
              {gjeldendespørsmål + 1} / {quiz.length}
            </span>
            <div className="flex-1 bg-sand-200 rounded-full h-1.5">
              <div
                className="bg-skog-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((gjeldendespørsmål + 1) / quiz.length) * 100}%` }}
              ></div>
            </div>
            <span className="text-sm text-sand-600 tabular-nums whitespace-nowrap">
              {svar.filter((s) => s.erRiktig).length} rette
            </span>
          </div>
        </div>

        {/* Spørsmål */}
        <div className="bg-white border border-sand-200 rounded overflow-hidden mb-6">
          {/* Bilde med swipe-funksjonalitet */}
          <div
            ref={containerRef}
            className="relative h-80 bg-sand-100"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ touchAction: harFlereBilder ? 'none' : 'auto' }}
          >
            <div
              className={`relative w-full h-full transition-all duration-300 ${
                isDragging ? 'duration-0' : 'ease-out'
              }`}
              style={{
                transform: `translateX(${dragOffset}px)`,
                opacity: isDragging ? 0.9 : 1,
              }}
            >
              <Image
                key={`quiz-${gjeldendespørsmål}-${aktivtBildeIndex}`}
                src={aktivtBilde}
                alt="Gjett blomsten"
                fill
                className={`transition-opacity duration-500 ${
                  bildeLastet ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ objectFit: 'contain' }}
                onLoad={() => setBildeLastet(true)}
                unoptimized
                priority
              />
            </div>

            {!bildeLastet && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-sand-300 border-t-skog-600"></div>
              </div>
            )}

            {/* Navigasjonspiler for flere bilder */}
            {harFlereBilder && bildeLastet && (
              <>
                {aktivtBildeIndex > 0 && (
                  <button
                    onClick={(e) => navigerTilBilde(aktivtBildeIndex - 1, e)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-sand-900/60 hover:bg-sand-900/80 text-white rounded-full p-2 transition-colors z-10"
                    aria-label="Forrige bilde"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                {aktivtBildeIndex < gyldigeBilder.length - 1 && (
                  <button
                    onClick={(e) => navigerTilBilde(aktivtBildeIndex + 1, e)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-sand-900/60 hover:bg-sand-900/80 text-white rounded-full p-2 transition-colors z-10"
                    aria-label="Neste bilde"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </>
            )}

            {/* Bildeindikatorer */}
            {harFlereBilder && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {gyldigeBilder.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      navigerTilBilde(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === aktivtBildeIndex ? 'bg-skog-600' : 'bg-sand-400 hover:bg-sand-500'
                    }`}
                    aria-label={`Gå til bilde ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Kildemerking */}
            {harFlereBilder && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 md:hidden z-10">
                <div className="bg-sand-900/60 text-white text-xs px-2.5 py-1 rounded-full tabular-nums">
                  {getBildeLabel(aktivtBilde)} ({aktivtBildeIndex + 1}/{gyldigeBilder.length})
                </div>
              </div>
            )}
          </div>

          {/* Spørsmål og svar */}
          <div className="p-5">
            <h2 className="font-semibold text-skog-800 text-center mb-5">
              Hvilken art er dette?
            </h2>

            <div className="grid grid-cols-1 gap-2.5">
              {gjeldende.alternativer.map((alternativ, index) => {
                let klasser =
                  'w-full p-3.5 text-left border rounded font-medium transition-colors ';

                if (valgtSvar) {
                  if (alternativ === gjeldende.riktigSvar) {
                    klasser += 'bg-riktig-bg border-riktig-kant text-riktig-tekst cursor-default';
                  } else if (alternativ === valgtSvar) {
                    klasser += 'bg-galt-bg border-galt-kant text-galt-tekst cursor-default';
                  } else {
                    klasser += 'bg-sand-50 border-sand-200 text-sand-400 cursor-default';
                  }
                } else {
                  klasser +=
                    'bg-white border-sand-300 text-sand-900 hover:border-skog-500 hover:bg-skog-50 cursor-pointer';
                }

                return (
                  <button
                    key={`q${gjeldendespørsmål}-opt${index}`}
                    onClick={() => handleSvar(alternativ)}
                    disabled={valgtSvar !== null}
                    className={klasser}
                    style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
                  >
                    <span className="font-semibold text-sand-500 mr-3">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {alternativ}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {utvalgModal}
    </div>
  );
}
