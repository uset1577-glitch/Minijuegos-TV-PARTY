import {useEffect, useState} from 'react';
import {CheckCircle2, RefreshCw, Timer, Trophy, XCircle} from 'lucide-react';
import {Player, TriviaQuestion, getPlayerColor} from '../../types/game';
import {apiUrl} from '../../utils/api';
import {soundFX} from '../../utils/sound';

interface TriviaDuelGameProps {
  players: Player[];
  onAwardPoints: (playerId: string, delta: number) => void;
  onExit: () => void;
}

const TOPICS = [
  'Mix Aleatorio',
  'Cine y Series',
  'Videojuegos',
  'Ciencia Curiosa',
  'Música Latina y Global',
  'Deportes',
];

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export function TriviaDuelGame({
  players,
  onAwardPoints,
  onExit,
}: TriviaDuelGameProps) {
  const [phase, setPhase] = useState<'SETUP' | 'LOADING' | 'QUESTION' | 'REVEAL' | 'SUMMARY'>('SETUP');
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const [difficulty, setDifficulty] = useState<'Fácil' | 'Media' | 'Retadora'>('Media');
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [turnOffset, setTurnOffset] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [roundPoints, setRoundPoints] = useState<Record<string, number>>({});
  const [recentQuestions, setRecentQuestions] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentQ = questions[qIndex] ?? null;
  const activePlayer = players[(qIndex + turnOffset) % players.length] ?? players[0];
  const playerColor = getPlayerColor(activePlayer.colorId);

  useEffect(() => {
    if (phase !== 'QUESTION') return;
    if (timeLeft <= 0) {
      setSelectedOpt(-1);
      setPhase('REVEAL');
      soundFX.fail();
      return;
    }
    const id = window.setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
      if (timeLeft <= 5) soundFX.timerBeep(true);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [phase, timeLeft]);

  const startRound = async () => {
    soundFX.confirm();
    setPhase('LOADING');
    setErrorMsg(null);
    setRoundPoints({});
    setQIndex(0);
    setSelectedOpt(null);
    try {
      const res = await fetch(apiUrl('/api/ai/trivia'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          topic,
          difficulty,
          recentQuestions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudieron generar las preguntas.');
      const list = Array.isArray(data.questions) ? (data.questions as TriviaQuestion[]) : [];
      if (list.length === 0) throw new Error('La IA no devolvió preguntas válidas.');
      setQuestions(list);
      setRecentQuestions((prev) => [...prev.slice(-12), ...list.map((q) => q.question)]);
      setTimeLeft(15);
      setPhase('QUESTION');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error inesperado.');
      setPhase('SETUP');
      soundFX.fail();
    }
  };

  const handleSelectOption = (idx: number) => {
    if (phase !== 'QUESTION' || !currentQ) return;
    setSelectedOpt(idx);
    setPhase('REVEAL');
    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) {
      const earned = 100 + timeLeft * 10;
      onAwardPoints(activePlayer.id, earned);
      setRoundPoints((prev) => ({
        ...prev,
        [activePlayer.id]: (prev[activePlayer.id] ?? 0) + earned,
      }));
      soundFX.success();
    } else {
      soundFX.fail();
    }
  };

  const handleNextQuestion = () => {
    soundFX.confirm();
    if (qIndex + 1 < questions.length) {
      setQIndex((prev) => prev + 1);
      setSelectedOpt(null);
      setTimeLeft(15);
      setPhase('QUESTION');
    } else {
      setTurnOffset((prev) => (prev + 1) % players.length);
      setPhase('SUMMARY');
      soundFX.success();
    }
  };

  return (
    <section className="max-w-5xl mx-auto w-full px-6 lg:px-10 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-sky-400">
            Trivia Relámpago IA · 5 preguntas
          </p>
          <h1 className="text-3xl font-bold text-white">Duelo de preguntas</h1>
        </div>
        <button
          type="button"
          data-tv-focusable="true"
          onClick={() => {
            soundFX.back();
            onExit();
          }}
          className="tv-focusable px-4 py-2 rounded-lg text-sm font-semibold bg-[#161922] text-slate-200 border border-white/10"
        >
          Salir
        </button>
      </div>

      {phase === 'SETUP' && (
        <div className="rounded-2xl p-7 bg-[#161922] border border-white/8 space-y-7">
          {errorMsg && (
            <div className="rounded-xl p-4 bg-rose-500/15 border border-rose-500/40 text-rose-200 text-sm">
              {errorMsg}
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-base font-bold text-white">1. Tema</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  data-tv-focusable="true"
                  onClick={() => {
                    soundFX.confirm();
                    setTopic(t);
                  }}
                  className={`tv-focusable px-4 py-3 rounded-xl text-left text-sm font-semibold border ${
                    topic === t
                      ? 'bg-sky-400 text-slate-950 border-sky-300'
                      : 'bg-[#0D0F14] text-slate-200 border-white/8 hover:border-white/25'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-base font-bold text-white">2. Dificultad</h2>
            <div className="grid grid-cols-3 gap-3 max-w-md">
              {(['Fácil', 'Media', 'Retadora'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  data-tv-focusable="true"
                  onClick={() => {
                    soundFX.confirm();
                    setDifficulty(lvl);
                  }}
                  className={`tv-focusable px-4 py-2.5 rounded-xl text-sm font-semibold border ${
                    difficulty === lvl
                      ? 'bg-white text-slate-950 border-white'
                      : 'bg-[#0D0F14] text-slate-200 border-white/8'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={() => void startRound()}
            className="tv-focusable px-8 py-3.5 rounded-xl bg-white text-slate-950 font-bold text-base hover:bg-slate-200"
          >
            Comenzar ronda
          </button>
        </div>
      )}

      {phase === 'LOADING' && (
        <div className="rounded-2xl p-14 bg-[#161922] border border-white/8 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto" aria-hidden="true" />
          <h2 className="text-xl font-bold text-white">Preparando preguntas de {topic}...</h2>
        </div>
      )}

      {(phase === 'QUESTION' || phase === 'REVEAL') && currentQ && (
        <div className="rounded-2xl p-7 bg-[#161922] border border-white/8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/8">
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-lg font-mono font-bold text-sm border ${playerColor.bgClass} ${playerColor.borderClass} ${playerColor.textClass}`}
              >
                {activePlayer.name}
              </span>
              <span className="text-sm text-slate-400 tabular-nums">
                {qIndex + 1} / {questions.length}
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-lg font-bold tabular-nums">
              <Timer
                className={`w-5 h-5 ${timeLeft <= 5 ? 'text-rose-400' : 'text-sky-400'}`}
                aria-hidden="true"
              />
              <span className={timeLeft <= 5 ? 'text-rose-400' : 'text-white'}>
                {timeLeft}s
              </span>
            </div>
          </div>

          <h2 className="text-2xl lg:text-3xl font-bold text-white leading-snug">
            {currentQ.question}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentQ.options.map((opt, idx) => {
              const isCorrect = idx === currentQ.correctIndex;
              const isPicked = idx === selectedOpt;

              let cardStyle =
                'bg-[#0D0F14] border-white/10 text-slate-100 hover:border-white/30';
              if (phase === 'REVEAL') {
                if (isCorrect) {
                  cardStyle = 'bg-emerald-500/20 border-emerald-400 text-emerald-100';
                } else if (isPicked && !isCorrect) {
                  cardStyle = 'bg-rose-500/20 border-rose-400 text-rose-100';
                } else {
                  cardStyle = 'bg-[#0D0F14]/60 border-white/5 text-slate-500';
                }
              }

              return (
                <button
                  key={`${qIndex}-${idx}`}
                  type="button"
                  disabled={phase === 'REVEAL'}
                  data-tv-focusable={phase === 'QUESTION' ? 'true' : undefined}
                  data-tv-autofocus={phase === 'QUESTION' && idx === 0 ? 'true' : undefined}
                  onClick={() => handleSelectOption(idx)}
                  className={`tv-focusable flex items-center gap-4 p-4 rounded-xl border text-left ${cardStyle}`}
                >
                  <span className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center font-mono font-bold text-sm shrink-0">
                    {OPTION_LETTERS[idx]}
                  </span>
                  <span className="text-base font-semibold flex-1">{opt}</span>
                  {phase === 'REVEAL' && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />
                  )}
                  {phase === 'REVEAL' && isPicked && !isCorrect && (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>

          {phase === 'REVEAL' && (
            <div className="pt-4 border-t border-white/8 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <p
                  className={`text-sm font-bold ${
                    selectedOpt === currentQ.correctIndex
                      ? 'text-emerald-300'
                      : 'text-rose-300'
                  }`}
                >
                  {selectedOpt === currentQ.correctIndex
                    ? `¡Correcto! +${100 + timeLeft * 10} pts`
                    : selectedOpt === -1
                      ? 'Tiempo agotado'
                      : 'Respuesta incorrecta'}
                </p>
                <p className="text-sm text-slate-300">{currentQ.explanation}</p>
              </div>

              <button
                type="button"
                data-tv-focusable="true"
                data-tv-autofocus="true"
                onClick={handleNextQuestion}
                className="tv-focusable px-6 py-3 rounded-xl bg-white text-slate-950 font-bold text-sm hover:bg-slate-200 whitespace-nowrap shrink-0"
              >
                {qIndex + 1 < questions.length ? 'Siguiente' : 'Ver resumen'}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 'SUMMARY' && (
        <div className="rounded-2xl p-8 bg-[#161922] border border-white/8 space-y-6">
          <div className="flex items-center gap-3 text-sky-400">
            <Trophy className="w-6 h-6" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-white">Ronda completada</h2>
          </div>

          <div className="divide-y divide-white/8 rounded-xl bg-[#0D0F14] border border-white/8">
            {players.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                <span className="font-semibold text-white">{p.name}</span>
                <span className="font-mono text-sm text-emerald-300 tabular-nums">
                  +{roundPoints[p.id] ?? 0} pts · Total {p.score}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              data-tv-focusable="true"
              data-tv-autofocus="true"
              onClick={() => void startRound()}
              className="tv-focusable px-6 py-3 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-200"
            >
              Otra ronda
            </button>
            <button
              type="button"
              data-tv-focusable="true"
              onClick={() => {
                soundFX.confirm();
                setPhase('SETUP');
              }}
              className="tv-focusable px-6 py-3 rounded-xl bg-[#0D0F14] text-slate-200 border border-white/10 font-medium"
            >
              Cambiar tema
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
