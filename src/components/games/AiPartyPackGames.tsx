import {useEffect, useState} from 'react';
import {
  BookOpen,
  CheckCircle2,
  Eye,
  Film,
  Lightbulb,
  RefreshCw,
  Scale,
  Timer,
  Trophy,
  XCircle,
} from 'lucide-react';
import {
  ClueCard,
  DilemmaItem,
  EmojiPuzzle,
  Player,
  TrueFalseStatement,
  getPlayerColor,
} from '../../types/game';
import {apiUrl} from '../../utils/api';
import {soundFX} from '../../utils/sound';

interface BaseGameProps {
  players: Player[];
  onAwardPoints: (playerId: string, delta: number) => void;
  onExit: () => void;
}

/* -------------------------------------------------------------------------- */
/* 5. DILEMA DEL SOFÁ IA                                                      */
/* -------------------------------------------------------------------------- */

const DILEMMA_VIBES = ['Ingenioso', 'Fiesta', 'Superpoderes absurdos', 'Vida diaria'];

export function DilemmaGame({players, onAwardPoints, onExit}: BaseGameProps) {
  const [phase, setPhase] = useState<'SETUP' | 'LOADING' | 'VOTE' | 'REVEAL'>('SETUP');
  const [vibe, setVibe] = useState(DILEMMA_VIBES[0]);
  const [items, setItems] = useState<DilemmaItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [voterIdx, setVoterIdx] = useState(0);
  const [votes, setVotes] = useState<Record<string, 'A' | 'B'>>({});
  const [recent, setRecent] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const current = items[idx] ?? null;
  const activeVoter = players[voterIdx] ?? players[0];

  const loadDilemmas = async () => {
    soundFX.confirm();
    setPhase('LOADING');
    setErrorMsg(null);
    try {
      const res = await fetch(apiUrl('/api/ai/dilemma'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({vibe, recentDilemmas: recent}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar dilemas.');
      const list = Array.isArray(data.dilemmas) ? (data.dilemmas as DilemmaItem[]) : [];
      if (list.length === 0) throw new Error('Sin dilemas disponibles.');
      setItems(list);
      setIdx(0);
      setVoterIdx(0);
      setVotes({});
      setRecent((prev) => [...prev.slice(-12), ...list.map((d) => d.scenario)]);
      setPhase('VOTE');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error de conexión.');
      setPhase('SETUP');
      soundFX.fail();
    }
  };

  const castVote = (choice: 'A' | 'B') => {
    soundFX.confirm();
    const nextVotes = {...votes, [activeVoter.id]: choice};
    setVotes(nextVotes);
    if (voterIdx + 1 < players.length) {
      setVoterIdx((p) => p + 1);
    } else {
      setPhase('REVEAL');
      soundFX.success();
      const countA = Object.values(nextVotes).filter((v) => v === 'A').length;
      const countB = Object.values(nextVotes).filter((v) => v === 'B').length;
      players.forEach((p) => {
        const picked = nextVotes[p.id];
        const isMajority =
          (picked === 'A' && countA >= countB) || (picked === 'B' && countB >= countA);
        onAwardPoints(p.id, players.length === 1 ? 50 : isMajority ? 100 : 50);
      });
    }
  };

  const nextDilemma = () => {
    soundFX.confirm();
    if (idx + 1 < items.length) {
      setIdx((i) => i + 1);
      setVoterIdx(0);
      setVotes({});
      setPhase('VOTE');
    } else {
      void loadDilemmas();
    }
  };

  return (
    <section className="max-w-5xl mx-auto w-full px-6 lg:px-10 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-sky-400">Dilema del Sofá IA</p>
          <h1 className="text-3xl font-bold text-white">¿Qué prefieres?</h1>
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
        <div className="rounded-2xl p-7 bg-[#161922] border border-white/8 space-y-6">
          {errorMsg && (
            <div className="rounded-xl p-4 bg-rose-500/15 border border-rose-500/40 text-rose-200 text-sm">
              {errorMsg}
            </div>
          )}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-white">Tono de los dilemas</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DILEMMA_VIBES.map((v) => (
                <button
                  key={v}
                  type="button"
                  data-tv-focusable="true"
                  onClick={() => {
                    soundFX.confirm();
                    setVibe(v);
                  }}
                  className={`tv-focusable px-4 py-3 rounded-xl text-sm font-semibold border ${
                    vibe === v
                      ? 'bg-sky-400 text-slate-950 border-sky-300'
                      : 'bg-[#0D0F14] text-slate-200 border-white/8'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={() => void loadDilemmas()}
            className="tv-focusable px-7 py-3.5 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-200"
          >
            Generar dilemas
          </button>
        </div>
      )}

      {phase === 'LOADING' && (
        <div className="rounded-2xl p-14 bg-[#161922] border border-white/8 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto" aria-hidden="true" />
          <p className="text-lg font-semibold text-white">Creando decisiones difíciles...</p>
        </div>
      )}

      {phase === 'VOTE' && current && (
        <div className="rounded-2xl p-7 bg-[#161922] border border-white/8 space-y-6">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/8">
            <span className="text-sm font-semibold text-sky-400">
              Vota {activeVoter.name} ({voterIdx + 1}/{players.length})
            </span>
            <span className="text-xs text-slate-400 tabular-nums">
              Dilema {idx + 1} de {items.length}
            </span>
          </div>

          <div className="flex items-start gap-3">
            <Scale className="w-6 h-6 text-sky-400 shrink-0 mt-1" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-white">{current.scenario}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              data-tv-focusable="true"
              data-tv-autofocus="true"
              onClick={() => castVote('A')}
              className="tv-focusable p-6 rounded-xl bg-[#0D0F14] border border-white/10 hover:border-sky-400 text-left space-y-2"
            >
              <span className="font-mono text-xs font-bold text-sky-400">Opción A</span>
              <p className="text-lg font-semibold text-white">{current.optionA}</p>
            </button>

            <button
              type="button"
              data-tv-focusable="true"
              onClick={() => castVote('B')}
              className="tv-focusable p-6 rounded-xl bg-[#0D0F14] border border-white/10 hover:border-emerald-400 text-left space-y-2"
            >
              <span className="font-mono text-xs font-bold text-emerald-400">Opción B</span>
              <p className="text-lg font-semibold text-white">{current.optionB}</p>
            </button>
          </div>
        </div>
      )}

      {phase === 'REVEAL' && current && (
        <div className="rounded-2xl p-7 bg-[#161922] border border-white/8 space-y-6">
          <h2 className="text-2xl font-bold text-white">{current.scenario}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(['A', 'B'] as const).map((opt) => {
              const voters = players.filter((p) => votes[p.id] === opt);
              return (
                <div key={opt} className="rounded-xl p-5 bg-[#0D0F14] border border-white/8 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-sky-400">Opción {opt}</span>
                    <span className="font-mono text-sm font-bold text-white tabular-nums">
                      {voters.length} {voters.length === 1 ? 'voto' : 'votos'}
                    </span>
                  </div>
                  <p className="font-semibold text-white">
                    {opt === 'A' ? current.optionA : current.optionB}
                  </p>
                  <p className="text-xs text-slate-400">
                    {voters.length > 0 ? voters.map((v) => v.name).join(', ') : 'Nadie eligió esta opción'}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="text-sm text-slate-300">Para debatir: {current.debateTip}</p>

          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={nextDilemma}
            className="tv-focusable px-6 py-3 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-200"
          >
            Siguiente dilema
          </button>
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 6. CINE Y CULTURA EN EMOJIS IA                                             */
/* -------------------------------------------------------------------------- */

const EMOJI_CATS = ['Películas famosas', 'Series de TV', 'Canciones conocidas', 'Videojuegos'];

export function EmojiMovieGame({players, onAwardPoints, onExit}: BaseGameProps) {
  const [phase, setPhase] = useState<'SETUP' | 'LOADING' | 'PLAY' | 'REVEAL' | 'DONE'>('SETUP');
  const [category, setCategory] = useState(EMOJI_CATS[0]);
  const [puzzles, setPuzzles] = useState<EmojiPuzzle[]>([]);
  const [idx, setIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [recentTitles, setRecentTitles] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const current = puzzles[idx] ?? null;
  const activePlayer = players[idx % players.length] ?? players[0];

  const loadPuzzles = async () => {
    soundFX.confirm();
    setPhase('LOADING');
    setErrorMsg(null);
    try {
      const res = await fetch(apiUrl('/api/ai/emoji-quiz'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({category, recentTitles}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar acertijos.');
      const list = Array.isArray(data.puzzles) ? (data.puzzles as EmojiPuzzle[]) : [];
      if (list.length === 0) throw new Error('Sin acertijos.');
      setPuzzles(list);
      setIdx(0);
      setPicked(null);
      setShowHint(false);
      setRecentTitles((prev) => [
        ...prev.slice(-12),
        ...list.map((p) => p.options[p.correctIndex] ?? ''),
      ]);
      setPhase('PLAY');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error de conexión.');
      setPhase('SETUP');
      soundFX.fail();
    }
  };

  const choose = (optIdx: number) => {
    if (!current || phase !== 'PLAY') return;
    setPicked(optIdx);
    setPhase('REVEAL');
    if (optIdx === current.correctIndex) {
      onAwardPoints(activePlayer.id, showHint ? 75 : 120);
      soundFX.success();
    } else {
      soundFX.fail();
    }
  };

  return (
    <section className="max-w-5xl mx-auto w-full px-6 lg:px-10 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-sky-400">Cine y Cultura en Emojis IA</p>
          <h1 className="text-3xl font-bold text-white">Descifra la secuencia</h1>
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
        <div className="rounded-2xl p-7 bg-[#161922] border border-white/8 space-y-6">
          {errorMsg && (
            <div className="rounded-xl p-4 bg-rose-500/15 border border-rose-500/40 text-rose-200 text-sm">
              {errorMsg}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {EMOJI_CATS.map((c) => (
              <button
                key={c}
                type="button"
                data-tv-focusable="true"
                onClick={() => {
                  soundFX.confirm();
                  setCategory(c);
                }}
                className={`tv-focusable px-4 py-3 rounded-xl text-sm font-semibold border ${
                  category === c
                    ? 'bg-sky-400 text-slate-950 border-sky-300'
                    : 'bg-[#0D0F14] text-slate-200 border-white/8'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={() => void loadPuzzles()}
            className="tv-focusable inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-200"
          >
            <Film className="w-4 h-4" aria-hidden="true" />
            <span>Generar 5 acertijos</span>
          </button>
        </div>
      )}

      {phase === 'LOADING' && (
        <div className="rounded-2xl p-14 bg-[#161922] border border-white/8 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto" aria-hidden="true" />
          <p className="text-lg font-semibold text-white">Combinando emojis...</p>
        </div>
      )}

      {(phase === 'PLAY' || phase === 'REVEAL') && current && (
        <div className="rounded-2xl p-7 bg-[#161922] border border-white/8 space-y-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-sky-400">Turno de {activePlayer.name}</span>
            <span className="text-slate-400 tabular-nums">
              {idx + 1} / {puzzles.length}
            </span>
          </div>

          <div className="py-6 rounded-xl bg-[#0D0F14] border border-white/8 text-center space-y-3">
            <p className="text-5xl sm:text-6xl tracking-widest">{current.emojis}</p>
            {showHint && <p className="text-sm text-sky-300">Pista: {current.hint}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {current.options.map((opt, oIdx) => {
              const isCorrect = oIdx === current.correctIndex;
              const isPicked = oIdx === picked;
              let cls = 'bg-[#0D0F14] border-white/10 text-white';
              if (phase === 'REVEAL') {
                if (isCorrect) cls = 'bg-emerald-500/20 border-emerald-400 text-emerald-100';
                else if (isPicked) cls = 'bg-rose-500/20 border-rose-400 text-rose-100';
                else cls = 'bg-[#0D0F14]/50 border-white/5 text-slate-500';
              }
              return (
                <button
                  key={oIdx}
                  type="button"
                  disabled={phase === 'REVEAL'}
                  data-tv-focusable={phase === 'PLAY' ? 'true' : undefined}
                  data-tv-autofocus={phase === 'PLAY' && oIdx === 0 ? 'true' : undefined}
                  onClick={() => choose(oIdx)}
                  className={`tv-focusable p-4 rounded-xl border text-left font-semibold flex items-center justify-between ${cls}`}
                >
                  <span>{opt}</span>
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

          {phase === 'PLAY' && !showHint && (
            <button
              type="button"
              data-tv-focusable="true"
              onClick={() => {
                soundFX.confirm();
                setShowHint(true);
              }}
              className="tv-focusable px-4 py-2 rounded-lg bg-[#0D0F14] text-slate-300 border border-white/10 text-xs font-medium"
            >
              Ver pista (da menos puntos)
            </button>
          )}

          {phase === 'REVEAL' && (
            <button
              type="button"
              data-tv-focusable="true"
              data-tv-autofocus="true"
              onClick={() => {
                soundFX.confirm();
                if (idx + 1 < puzzles.length) {
                  setIdx((i) => i + 1);
                  setPicked(null);
                  setShowHint(false);
                  setPhase('PLAY');
                } else {
                  setPhase('DONE');
                }
              }}
              className="tv-focusable px-6 py-3 rounded-xl bg-white text-slate-950 font-bold"
            >
              {idx + 1 < puzzles.length ? 'Siguiente' : 'Finalizar ronda'}
            </button>
          )}
        </div>
      )}

      {phase === 'DONE' && (
        <div className="rounded-2xl p-8 bg-[#161922] border border-white/8 space-y-5 text-center">
          <Trophy className="w-10 h-10 text-sky-400 mx-auto" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-white">Ronda completada</h2>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              data-tv-focusable="true"
              data-tv-autofocus="true"
              onClick={() => void loadPuzzles()}
              className="tv-focusable px-6 py-3 rounded-xl bg-white text-slate-950 font-bold"
            >
              Jugar otra vez
            </button>
            <button
              type="button"
              data-tv-focusable="true"
              onClick={() => setPhase('SETUP')}
              className="tv-focusable px-6 py-3 rounded-xl bg-[#0D0F14] text-slate-200 border border-white/10"
            >
              Cambiar categoría
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 7. TRES PISTAS / TABÚ IA                                                   */
/* -------------------------------------------------------------------------- */

export function CluesTabooGame({players, onAwardPoints, onExit}: BaseGameProps) {
  const [phase, setPhase] = useState<'SETUP' | 'LOADING' | 'PLAY' | 'REVEAL' | 'DONE'>('SETUP');
  const [vibe, setVibe] = useState('De todo un poco');
  const [cards, setCards] = useState<ClueCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [cluesShown, setCluesShown] = useState(1);
  const [picked, setPicked] = useState<string | null>(null);
  const [recentAnswers, setRecentAnswers] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const current = cards[idx] ?? null;
  const activePlayer = players[idx % players.length] ?? players[0];

  const loadCards = async () => {
    soundFX.confirm();
    setPhase('LOADING');
    setErrorMsg(null);
    try {
      const res = await fetch(apiUrl('/api/ai/clues'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({vibe, recentAnswers}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar tarjetas.');
      const list = Array.isArray(data.cards) ? (data.cards as ClueCard[]) : [];
      if (list.length === 0) throw new Error('Sin tarjetas.');
      setCards(list);
      setIdx(0);
      setCluesShown(1);
      setPicked(null);
      setRecentAnswers((prev) => [...prev.slice(-12), ...list.map((c) => c.answer)]);
      setPhase('PLAY');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error de conexión.');
      setPhase('SETUP');
      soundFX.fail();
    }
  };

  const guess = (option: string) => {
    if (!current || phase !== 'PLAY') return;
    setPicked(option);
    setPhase('REVEAL');
    if (option === current.answer) {
      const pts = cluesShown === 1 ? 150 : cluesShown === 2 ? 100 : 60;
      onAwardPoints(activePlayer.id, pts);
      soundFX.success();
    } else {
      soundFX.fail();
    }
  };

  return (
    <section className="max-w-5xl mx-auto w-full px-6 lg:px-10 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-sky-400">Tres Pistas IA</p>
          <h1 className="text-3xl font-bold text-white">Adivina con menos pistas</h1>
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
        <div className="rounded-2xl p-7 bg-[#161922] border border-white/8 space-y-6">
          {errorMsg && (
            <div className="rounded-xl p-4 bg-rose-500/15 border border-rose-500/40 text-rose-200 text-sm">
              {errorMsg}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['De todo un poco', 'Personajes e historia', 'Objetos de casa', 'Animales y naturaleza'].map(
              (v) => (
                <button
                  key={v}
                  type="button"
                  data-tv-focusable="true"
                  onClick={() => {
                    soundFX.confirm();
                    setVibe(v);
                  }}
                  className={`tv-focusable px-4 py-3 rounded-xl text-sm font-semibold border ${
                    vibe === v
                      ? 'bg-sky-400 text-slate-950 border-sky-300'
                      : 'bg-[#0D0F14] text-slate-200 border-white/8'
                  }`}
                >
                  {v}
                </button>
              ),
            )}
          </div>
          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={() => void loadCards()}
            className="tv-focusable inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-slate-950 font-bold"
          >
            <Lightbulb className="w-4 h-4" aria-hidden="true" />
            <span>Generar tarjetas</span>
          </button>
        </div>
      )}

      {phase === 'LOADING' && (
        <div className="rounded-2xl p-14 bg-[#161922] border border-white/8 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto" aria-hidden="true" />
          <p className="text-lg font-semibold text-white">Escribiendo pistas inteligentes...</p>
        </div>
      )}

      {(phase === 'PLAY' || phase === 'REVEAL') && current && (
        <div className="rounded-2xl p-7 bg-[#161922] border border-white/8 space-y-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-sky-400">
              {activePlayer.name} · Categoría: {current.category}
            </span>
            <span className="text-slate-400 tabular-nums">
              {idx + 1} / {cards.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {current.clues.slice(0, cluesShown).map((clue, cIdx) => (
              <div
                key={cIdx}
                className="p-4 rounded-xl bg-[#0D0F14] border border-white/8 flex items-start gap-3"
              >
                <span className="font-mono text-xs font-bold text-sky-400 pt-1">
                  Pista {cIdx + 1}
                </span>
                <p className="text-base text-white font-medium">{clue}</p>
              </div>
            ))}
          </div>

          {phase === 'PLAY' && cluesShown < 3 && (
            <button
              type="button"
              data-tv-focusable="true"
              onClick={() => {
                soundFX.confirm();
                setCluesShown((c) => Math.min(3, c + 1));
              }}
              className="tv-focusable inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0D0F14] text-sky-300 border border-white/10 text-xs font-semibold"
            >
              <Eye className="w-4 h-4" aria-hidden="true" />
              <span>Mostrar pista {cluesShown + 1}</span>
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {current.options.map((opt, oIdx) => {
              const isCorrect = opt === current.answer;
              const isPicked = opt === picked;
              let cls = 'bg-[#0D0F14] border-white/10 text-white';
              if (phase === 'REVEAL') {
                if (isCorrect) cls = 'bg-emerald-500/20 border-emerald-400 text-emerald-100';
                else if (isPicked) cls = 'bg-rose-500/20 border-rose-400 text-rose-100';
                else cls = 'bg-[#0D0F14]/50 border-white/5 text-slate-500';
              }
              return (
                <button
                  key={oIdx}
                  type="button"
                  disabled={phase === 'REVEAL'}
                  data-tv-focusable={phase === 'PLAY' ? 'true' : undefined}
                  data-tv-autofocus={phase === 'PLAY' && oIdx === 0 ? 'true' : undefined}
                  onClick={() => guess(opt)}
                  className={`tv-focusable p-4 rounded-xl border text-left font-semibold ${cls}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {phase === 'REVEAL' && (
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/8">
              <p className="text-xs text-slate-400">
                Palabras tabú de esta tarjeta: {current.forbiddenWords.join(', ')}
              </p>
              <button
                type="button"
                data-tv-focusable="true"
                data-tv-autofocus="true"
                onClick={() => {
                  soundFX.confirm();
                  if (idx + 1 < cards.length) {
                    setIdx((i) => i + 1);
                    setCluesShown(1);
                    setPicked(null);
                    setPhase('PLAY');
                  } else {
                    setPhase('DONE');
                  }
                }}
                className="tv-focusable px-6 py-3 rounded-xl bg-white text-slate-950 font-bold"
              >
                {idx + 1 < cards.length ? 'Siguiente tarjeta' : 'Terminar'}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 'DONE' && (
        <div className="rounded-2xl p-8 bg-[#161922] border border-white/8 text-center space-y-5">
          <h2 className="text-2xl font-bold text-white">Tarjetas completadas</h2>
          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={() => void loadCards()}
            className="tv-focusable px-6 py-3 rounded-xl bg-white text-slate-950 font-bold"
          >
            Generar nuevas tarjetas
          </button>
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 8. ¿VERDAD O MITO? IA                                                      */
/* -------------------------------------------------------------------------- */

export function TrueFalseGame({players, onAwardPoints, onExit}: BaseGameProps) {
  const [phase, setPhase] = useState<'SETUP' | 'LOADING' | 'PLAY' | 'REVEAL' | 'DONE'>('SETUP');
  const [topic, setTopic] = useState('Curiosidades del mundo');
  const [items, setItems] = useState<TrueFalseStatement[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [recentStatements, setRecentStatements] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const current = items[idx] ?? null;
  const activePlayer = players[idx % players.length] ?? players[0];

  useEffect(() => {
    if (phase !== 'PLAY') return;
    if (timeLeft <= 0) {
      setPicked(null);
      setPhase('REVEAL');
      soundFX.fail();
      return;
    }
    const id = window.setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => window.clearTimeout(id);
  }, [phase, timeLeft]);

  const loadBatch = async () => {
    soundFX.confirm();
    setPhase('LOADING');
    setErrorMsg(null);
    try {
      const res = await fetch(apiUrl('/api/ai/true-false'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({topic, recentStatements}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar afirmaciones.');
      const list = Array.isArray(data.statements) ? (data.statements as TrueFalseStatement[]) : [];
      if (list.length === 0) throw new Error('Sin afirmaciones.');
      setItems(list);
      setIdx(0);
      setPicked(null);
      setTimeLeft(10);
      setRecentStatements((prev) => [...prev.slice(-12), ...list.map((s) => s.statement)]);
      setPhase('PLAY');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error de conexión.');
      setPhase('SETUP');
      soundFX.fail();
    }
  };

  const answer = (choice: boolean) => {
    if (!current || phase !== 'PLAY') return;
    setPicked(choice);
    setPhase('REVEAL');
    if (choice === current.isTrue) {
      onAwardPoints(activePlayer.id, 100);
      soundFX.success();
    } else {
      soundFX.fail();
    }
  };

  return (
    <section className="max-w-4xl mx-auto w-full px-6 lg:px-10 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-sky-400">Verdad o Mito IA</p>
          <h1 className="text-3xl font-bold text-white">Detector de mitos</h1>
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
        <div className="rounded-2xl p-7 bg-[#161922] border border-white/8 space-y-6">
          {errorMsg && (
            <div className="rounded-xl p-4 bg-rose-500/15 border border-rose-500/40 text-rose-200 text-sm">
              {errorMsg}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {['Curiosidades del mundo', 'Ciencia y espacio', 'Historia y cultura', 'Cuerpo humano y comida'].map(
              (t) => (
                <button
                  key={t}
                  type="button"
                  data-tv-focusable="true"
                  onClick={() => {
                    soundFX.confirm();
                    setTopic(t);
                  }}
                  className={`tv-focusable px-4 py-3 rounded-xl text-sm font-semibold border ${
                    topic === t
                      ? 'bg-sky-400 text-slate-950 border-sky-300'
                      : 'bg-[#0D0F14] text-slate-200 border-white/8'
                  }`}
                >
                  {t}
                </button>
              ),
            )}
          </div>
          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={() => void loadBatch()}
            className="tv-focusable px-7 py-3.5 rounded-xl bg-white text-slate-950 font-bold"
          >
            Empezar (6 rondas)
          </button>
        </div>
      )}

      {phase === 'LOADING' && (
        <div className="rounded-2xl p-14 bg-[#161922] border border-white/8 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto" aria-hidden="true" />
          <p className="text-lg font-semibold text-white">Buscando datos sorprendentes...</p>
        </div>
      )}

      {(phase === 'PLAY' || phase === 'REVEAL') && current && (
        <div className="rounded-2xl p-8 bg-[#161922] border border-white/8 space-y-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-sky-400">
              {activePlayer.name} · {idx + 1}/{items.length}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono font-bold text-white tabular-nums">
              <Timer className="w-4 h-4 text-sky-400" aria-hidden="true" />
              {timeLeft}s
            </span>
          </div>

          <h2 className="text-2xl lg:text-3xl font-bold text-white leading-snug">
            “{current.statement}”
          </h2>

          {phase === 'PLAY' ? (
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                data-tv-focusable="true"
                data-tv-autofocus="true"
                onClick={() => answer(true)}
                className="tv-focusable py-5 rounded-xl bg-emerald-500/15 border border-emerald-400/50 text-emerald-200 font-bold text-xl hover:bg-emerald-500/25"
              >
                Verdadero
              </button>
              <button
                type="button"
                data-tv-focusable="true"
                onClick={() => answer(false)}
                className="tv-focusable py-5 rounded-xl bg-rose-500/15 border border-rose-400/50 text-rose-200 font-bold text-xl hover:bg-rose-500/25"
              >
                Mito falso
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-3 border-t border-white/8">
              <p
                className={`text-lg font-bold ${
                  picked === current.isTrue ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {current.isTrue ? 'Es VERDADERO' : 'Es un MITO FALSO'} ·{' '}
                {picked === current.isTrue ? '+100 pts' : '0 pts'}
              </p>
              <p className="text-slate-300">{current.explanation}</p>
              <button
                type="button"
                data-tv-focusable="true"
                data-tv-autofocus="true"
                onClick={() => {
                  soundFX.confirm();
                  if (idx + 1 < items.length) {
                    setIdx((i) => i + 1);
                    setPicked(null);
                    setTimeLeft(10);
                    setPhase('PLAY');
                  } else {
                    setPhase('DONE');
                  }
                }}
                className="tv-focusable px-6 py-3 rounded-xl bg-white text-slate-950 font-bold"
              >
                {idx + 1 < items.length ? 'Siguiente' : 'Finalizar'}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 'DONE' && (
        <div className="rounded-2xl p-8 bg-[#161922] border border-white/8 text-center space-y-5">
          <h2 className="text-2xl font-bold text-white">Ronda finalizada</h2>
          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={() => void loadBatch()}
            className="tv-focusable px-6 py-3 rounded-xl bg-white text-slate-950 font-bold"
          >
            Jugar otra tanda
          </button>
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 9. HISTORIA EN CADENA IA                                                   */
/* -------------------------------------------------------------------------- */

const STORY_GENRES = ['Comedia absurda', 'Misterio en casa', 'Aventura espacial', 'Superhéroes torpes'];

export function StoryChainGame({players, onAwardPoints, onExit}: BaseGameProps) {
  const [phase, setPhase] = useState<'SETUP' | 'LOADING' | 'CHOICE' | 'FINALE'>('SETUP');
  const [genre, setGenre] = useState(STORY_GENRES[0]);
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [chapter, setChapter] = useState(1);
  const [finale, setFinale] = useState<{
    ending: string;
    episodeTitle: string;
    ratingOutOf10: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activePlayer = players[(chapter - 1) % players.length] ?? players[0];

  const startStory = async () => {
    soundFX.confirm();
    setPhase('LOADING');
    setErrorMsg(null);
    setParagraphs([]);
    setFinale(null);
    setChapter(1);
    try {
      const res = await fetch(apiUrl('/api/ai/story'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          step: 'START',
          genre,
          playerNames: players.map((p) => p.name),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo iniciar la historia.');
      setParagraphs([String(data.paragraph || '')]);
      setChoices(Array.isArray(data.choices) ? data.choices : []);
      setPhase('CHOICE');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error de conexión.');
      setPhase('SETUP');
      soundFX.fail();
    }
  };

  const pickTwist = async (twist: string) => {
    soundFX.confirm();
    setPhase('LOADING');
    const historySoFar = paragraphs.join(' ');
    const isLast = chapter >= 3;
    try {
      const res = await fetch(apiUrl('/api/ai/story'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          step: isLast ? 'FINISH' : 'NEXT',
          genre,
          historySoFar,
          chosenTwist: twist,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al continuar historia.');
      if (isLast) {
        setFinale({
          ending: String(data.ending || ''),
          episodeTitle: String(data.episodeTitle || 'Episodio final'),
          ratingOutOf10: Number(data.ratingOutOf10 || 8),
        });
        players.forEach((p) => onAwardPoints(p.id, Number(data.ratingOutOf10 || 8) * 15));
        soundFX.success();
        setPhase('FINALE');
      } else {
        setParagraphs((prev) => [...prev, String(data.paragraph || '')]);
        setChoices(Array.isArray(data.choices) ? data.choices : []);
        setChapter((c) => c + 1);
        setPhase('CHOICE');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error de conexión.');
      setPhase('CHOICE');
      soundFX.fail();
    }
  };

  return (
    <section className="max-w-5xl mx-auto w-full px-6 lg:px-10 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-sky-400">Historia en Cadena IA</p>
          <h1 className="text-3xl font-bold text-white">Cuento interactivo grupal</h1>
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
        <div className="rounded-2xl p-7 bg-[#161922] border border-white/8 space-y-6">
          {errorMsg && (
            <div className="rounded-xl p-4 bg-rose-500/15 border border-rose-500/40 text-rose-200 text-sm">
              {errorMsg}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STORY_GENRES.map((g) => (
              <button
                key={g}
                type="button"
                data-tv-focusable="true"
                onClick={() => {
                  soundFX.confirm();
                  setGenre(g);
                }}
                className={`tv-focusable px-4 py-3 rounded-xl text-sm font-semibold border ${
                  genre === g
                    ? 'bg-sky-400 text-slate-950 border-sky-300'
                    : 'bg-[#0D0F14] text-slate-200 border-white/8'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={() => void startStory()}
            className="tv-focusable inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-slate-950 font-bold"
          >
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            <span>Crear capítulo 1</span>
          </button>
        </div>
      )}

      {phase === 'LOADING' && (
        <div className="rounded-2xl p-14 bg-[#161922] border border-white/8 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto" aria-hidden="true" />
          <p className="text-lg font-semibold text-white">La IA está escribiendo la escena...</p>
        </div>
      )}

      {phase === 'CHOICE' && (
        <div className="rounded-2xl p-7 bg-[#161922] border border-white/8 space-y-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-sky-400">
              Decide {activePlayer.name} · Capítulo {chapter} de 3
            </span>
          </div>

          <p className="text-xl text-white leading-relaxed">
            {paragraphs[paragraphs.length - 1]}
          </p>

          <div className="space-y-3">
            <p className="text-xs font-medium text-slate-400">Elige el siguiente giro:</p>
            {choices.map((ch, cIdx) => (
              <button
                key={cIdx}
                type="button"
                data-tv-focusable="true"
                data-tv-autofocus={cIdx === 0 ? 'true' : undefined}
                onClick={() => void pickTwist(ch)}
                className="tv-focusable w-full p-4 rounded-xl bg-[#0D0F14] border border-white/10 hover:border-sky-400 text-left text-white font-medium"
              >
                {ch}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'FINALE' && finale && (
        <div className="rounded-2xl p-8 bg-[#161922] border border-white/8 space-y-5">
          <p className="text-xs font-semibold text-sky-400">
            Episodio completado · Nota {finale.ratingOutOf10}/10
          </p>
          <h2 className="text-3xl font-bold text-white">{finale.episodeTitle}</h2>
          <p className="text-lg text-slate-200 leading-relaxed">{finale.ending}</p>
          <p className="text-sm text-emerald-400">
            +{finale.ratingOutOf10 * 15} pts para todo el grupo por la historia.
          </p>
          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={() => void startStory()}
            className="tv-focusable px-6 py-3 rounded-xl bg-white text-slate-950 font-bold"
          >
            Nueva historia
          </button>
        </div>
      )}
    </section>
  );
}
