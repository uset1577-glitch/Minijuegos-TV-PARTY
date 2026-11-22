import {useEffect, useRef, useState} from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Circle,
  Diamond,
  Hexagon,
  KeyRound,
  Square,
  Star,
  Triangle,
} from 'lucide-react';
import {Player} from '../../types/game';
import {soundFX} from '../../utils/sound';

interface BaseGameProps {
  players: Player[];
  onAwardPoints: (playerId: string, delta: number) => void;
  onExit: () => void;
}

/* -------------------------------------------------------------------------- */
/* 14. SECUENCIA SIMÓN TV                                                     */
/* -------------------------------------------------------------------------- */

const SIMON_DIRS = [
  {id: 0, label: 'Arriba', Icon: ArrowUp, color: 'border-sky-400/50 text-sky-300', active: 'bg-sky-400 text-slate-950'},
  {id: 1, label: 'Derecha', Icon: ArrowRight, color: 'border-emerald-400/50 text-emerald-300', active: 'bg-emerald-400 text-slate-950'},
  {id: 2, label: 'Abajo', Icon: ArrowDown, color: 'border-indigo-400/50 text-indigo-300', active: 'bg-indigo-400 text-slate-950'},
  {id: 3, label: 'Izquierda', Icon: ArrowLeft, color: 'border-rose-400/50 text-rose-300', active: 'bg-rose-400 text-slate-950'},
];

export function SimonGame({players, onAwardPoints, onExit}: BaseGameProps) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [phase, setPhase] = useState<'IDLE' | 'SHOWING' | 'INPUT' | 'GAMEOVER'>('IDLE');
  const [litPad, setLitPad] = useState<number | null>(null);
  const [inputIdx, setInputIdx] = useState(0);
  const [turnIdx, setTurnIdx] = useState(0);

  const timersRef = useRef<number[]>([]);
  const activePlayer = players[turnIdx % players.length] ?? players[0];

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => {
    return clearTimers;
  }, []);

  const playSequence = (seq: number[]) => {
    clearTimers();
    setPhase('SHOWING');
    setLitPad(null);
    seq.forEach((pad, idx) => {
      const t1 = window.setTimeout(() => {
        setLitPad(pad);
        soundFX.timerBeep(pad === 0 || pad === 2);
      }, idx * 650 + 250);
      const t2 = window.setTimeout(() => {
        setLitPad(null);
      }, idx * 650 + 540);
      timersRef.current.push(t1, t2);
    });
    const endTimer = window.setTimeout(() => {
      setInputIdx(0);
      setPhase('INPUT');
    }, seq.length * 650 + 300);
    timersRef.current.push(endTimer);
  };

  const startNewGame = () => {
    soundFX.confirm();
    const first = [Math.floor(Math.random() * 4)];
    setSequence(first);
    playSequence(first);
  };

  const handlePadPress = (padId: number) => {
    if (phase !== 'INPUT') return;
    setLitPad(padId);
    window.setTimeout(() => setLitPad(null), 160);

    if (padId !== sequence[inputIdx]) {
      soundFX.fail();
      setPhase('GAMEOVER');
      return;
    }

    soundFX.confirm();
    if (inputIdx + 1 === sequence.length) {
      onAwardPoints(activePlayer.id, sequence.length * 25);
      soundFX.success();
      const nextSeq = [...sequence, Math.floor(Math.random() * 4)];
      setSequence(nextSeq);
      setTurnIdx((t) => (t + 1) % players.length);
      const id = window.setTimeout(() => playSequence(nextSeq), 600);
      timersRef.current.push(id);
    } else {
      setInputIdx((i) => i + 1);
    }
  };

  return (
    <section className="max-w-4xl mx-auto w-full px-6 lg:px-10 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-sky-400">Secuencia Simón · Memoria</p>
          <h1 className="text-3xl font-bold text-white">Repite el patrón</h1>
        </div>
        <button
          type="button"
          data-tv-focusable="true"
          onClick={() => {
            clearTimers();
            soundFX.back();
            onExit();
          }}
          className="tv-focusable px-4 py-2 rounded-lg text-sm font-semibold bg-[#161922] text-slate-200 border border-white/10"
        >
          Salir
        </button>
      </div>

      <div className="rounded-2xl p-8 bg-[#161922] border border-white/8 space-y-6 text-center">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-sky-400">Turno: {activePlayer.name}</span>
          <span className="font-mono text-slate-300 tabular-nums">
            Nivel {Math.max(1, sequence.length)}
          </span>
        </div>

        {phase === 'IDLE' && (
          <div className="py-6 space-y-4">
            <p className="text-slate-400">
              Observa el orden en que se iluminan las direcciones y repítelo con el control. Cada nivel suma un paso nuevo y pasa el turno.
            </p>
            <button
              type="button"
              data-tv-focusable="true"
              data-tv-autofocus="true"
              onClick={startNewGame}
              className="tv-focusable px-8 py-4 rounded-xl bg-white text-slate-950 font-bold"
            >
              Comenzar secuencia
            </button>
          </div>
        )}

        {(phase === 'SHOWING' || phase === 'INPUT') && (
          <>
            <p className="text-sm font-medium text-slate-300">
              {phase === 'SHOWING'
                ? 'Observa la secuencia...'
                : `Tu turno (${inputIdx}/${sequence.length})`}
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {SIMON_DIRS.map((dir, i) => {
                const isLit = litPad === dir.id;
                const Icon = dir.Icon;
                return (
                  <button
                    key={dir.id}
                    type="button"
                    disabled={phase !== 'INPUT'}
                    data-tv-focusable={phase === 'INPUT' ? 'true' : undefined}
                    data-tv-autofocus={phase === 'INPUT' && i === 0 ? 'true' : undefined}
                    onClick={() => handlePadPress(dir.id)}
                    className={`tv-focusable py-6 rounded-xl border font-bold flex flex-col items-center gap-2 transition-colors ${
                      isLit ? dir.active : `bg-[#0D0F14] ${dir.color}`
                    }`}
                  >
                    <Icon className="w-7 h-7" aria-hidden="true" />
                    <span className="text-sm">{dir.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {phase === 'GAMEOVER' && (
          <div className="py-6 space-y-4">
            <h2 className="text-3xl font-bold text-rose-400">
              ¡Falló {activePlayer.name} en el nivel {sequence.length}!
            </h2>
            <button
              type="button"
              data-tv-focusable="true"
              data-tv-autofocus="true"
              onClick={startNewGame}
              className="tv-focusable px-7 py-3.5 rounded-xl bg-white text-slate-950 font-bold"
            >
              Volver a empezar
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 15. CÓDIGO OCULTO (ADIVINA EL NÚMERO 1–99)                                 */
/* -------------------------------------------------------------------------- */

export function CodebreakGame({players, onAwardPoints, onExit}: BaseGameProps) {
  const [target, setTarget] = useState(() => 1 + Math.floor(Math.random() * 99));
  const [guess, setGuess] = useState(50);
  const [lowBound, setLowBound] = useState(1);
  const [highBound, setHighBound] = useState(99);
  const [turnIdx, setTurnIdx] = useState(0);
  const [hint, setHint] = useState('El número secreto está entre 1 y 99.');
  const [wonBy, setWonBy] = useState<string | null>(null);

  const activePlayer = players[turnIdx % players.length] ?? players[0];

  const adjust = (delta: number) => {
    soundFX.navTick();
    setGuess((g) => Math.max(lowBound, Math.min(highBound, g + delta)));
  };

  const submitGuess = () => {
    if (wonBy) return;
    if (guess === target) {
      soundFX.success();
      onAwardPoints(activePlayer.id, 150);
      setWonBy(activePlayer.name);
      setHint(`¡Exacto! El número era ${target}.`);
      return;
    }

    soundFX.confirm();
    if (guess < target) {
      const nextLow = Math.max(lowBound, guess + 1);
      setLowBound(nextLow);
      setGuess(Math.round((nextLow + highBound) / 2));
      setHint(`${guess} es muy bajo. Sube (entre ${nextLow} y ${highBound}).`);
    } else {
      const nextHigh = Math.min(highBound, guess - 1);
      setHighBound(nextHigh);
      setGuess(Math.round((lowBound + nextHigh) / 2));
      setHint(`${guess} es muy alto. Baja (entre ${lowBound} y ${nextHigh}).`);
    }
    setTurnIdx((t) => (t + 1) % players.length);
  };

  const reset = () => {
    soundFX.confirm();
    setTarget(1 + Math.floor(Math.random() * 99));
    setLowBound(1);
    setHighBound(99);
    setGuess(50);
    setWonBy(null);
    setHint('Nuevo código entre 1 y 99.');
  };

  return (
    <section className="max-w-4xl mx-auto w-full px-6 lg:px-10 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-sky-400">Código Oculto · Lógica</p>
          <h1 className="text-3xl font-bold text-white">Encuentra el número secreto</h1>
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

      <div className="rounded-2xl p-8 bg-[#161922] border border-white/8 text-center space-y-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-sky-400">
            {wonBy ? `Ganador: ${wonBy}` : `Turno de ${activePlayer.name}`}
          </span>
          <span className="font-mono text-slate-400 tabular-nums">
            Rango: {lowBound} – {highBound}
          </span>
        </div>

        <p className="text-lg text-slate-200">{hint}</p>

        {!wonBy ? (
          <>
            <div className="py-2 flex items-center justify-center gap-3">
              <KeyRound className="w-6 h-6 text-sky-400" aria-hidden="true" />
              <span className="font-mono text-6xl font-bold text-white tabular-nums">
                {guess}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {[-10, -1, 1, 10].map((d) => (
                <button
                  key={d}
                  type="button"
                  data-tv-focusable="true"
                  onClick={() => adjust(d)}
                  className="tv-focusable px-5 py-3 rounded-xl bg-[#0D0F14] border border-white/10 font-mono font-bold text-white hover:border-sky-400"
                >
                  {d > 0 ? `+${d}` : d}
                </button>
              ))}
            </div>

            <button
              type="button"
              data-tv-focusable="true"
              data-tv-autofocus="true"
              onClick={submitGuess}
              className="tv-focusable px-8 py-4 rounded-xl bg-white text-slate-950 font-bold text-lg"
            >
              Probar {guess}
            </button>
          </>
        ) : (
          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={reset}
            className="tv-focusable px-8 py-4 rounded-xl bg-white text-slate-950 font-bold"
          >
            Jugar otro número (+150 pts)
          </button>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 16. PARES EN MESA (MEMORIA DE 12 FICHAS)                                   */
/* -------------------------------------------------------------------------- */

const CARD_SYMBOLS = [
  {id: 'circle', label: 'Círculo', Icon: Circle},
  {id: 'triangle', label: 'Triángulo', Icon: Triangle},
  {id: 'square', label: 'Cuadro', Icon: Square},
  {id: 'star', label: 'Estrella', Icon: Star},
  {id: 'diamond', label: 'Rombo', Icon: Diamond},
  {id: 'hex', label: 'Hexágono', Icon: Hexagon},
];

interface DeckCard {
  uid: number;
  symbolId: string;
  matched: boolean;
}

function buildDeck(): DeckCard[] {
  const doubled = [...CARD_SYMBOLS, ...CARD_SYMBOLS].map((s, idx) => ({
    uid: idx,
    symbolId: s.id,
    matched: false,
  }));
  return doubled.sort(() => Math.random() - 0.5);
}

export function MemoryPairsGame({players, onAwardPoints, onExit}: BaseGameProps) {
  const [deck, setDeck] = useState<DeckCard[]>(() => buildDeck());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const [turnIdx, setTurnIdx] = useState(0);

  const activePlayer = players[turnIdx % players.length] ?? players[0];
  const allMatched = deck.every((c) => c.matched);

  const handleFlip = (index: number) => {
    if (locked || deck[index].matched || flipped.includes(index)) return;
    soundFX.confirm();
    const nextFlipped = [...flipped, index];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      setLocked(true);
      const [a, b] = nextFlipped;
      if (deck[a].symbolId === deck[b].symbolId) {
        window.setTimeout(() => {
          soundFX.success();
          onAwardPoints(activePlayer.id, 60);
          setDeck((prev) =>
            prev.map((c, idx) => (idx === a || idx === b ? {...c, matched: true} : c)),
          );
          setFlipped([]);
          setLocked(false);
        }, 420);
      } else {
        window.setTimeout(() => {
          soundFX.back();
          setFlipped([]);
          setTurnIdx((t) => (t + 1) % players.length);
          setLocked(false);
        }, 780);
      }
    }
  };

  const resetDeck = () => {
    soundFX.confirm();
    setDeck(buildDeck());
    setFlipped([]);
    setLocked(false);
  };

  return (
    <section className="max-w-4xl mx-auto w-full px-6 lg:px-10 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-sky-400">Pares en Mesa · Memoria</p>
          <h1 className="text-3xl font-bold text-white">Encuentra las 6 parejas</h1>
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

      <div className="rounded-2xl p-7 bg-[#161922] border border-white/8 space-y-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-sky-400">
            {allMatched ? '¡Tablero completado!' : `Turno de ${activePlayer.name}`}
          </span>
          <span className="text-slate-400 tabular-nums">
            Parejas: {deck.filter((c) => c.matched).length / 2} / 6
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3.5">
          {deck.map((card, idx) => {
            const isOpen = card.matched || flipped.includes(idx);
            const sym = CARD_SYMBOLS.find((s) => s.id === card.symbolId) ?? CARD_SYMBOLS[0];
            const Icon = sym.Icon;
            return (
              <button
                key={card.uid}
                type="button"
                disabled={card.matched || locked}
                data-tv-focusable={!card.matched ? 'true' : undefined}
                data-tv-autofocus={idx === 0 ? 'true' : undefined}
                onClick={() => handleFlip(idx)}
                className={`tv-focusable h-24 rounded-xl border flex flex-col items-center justify-center gap-1.5 ${
                  card.matched
                    ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
                    : isOpen
                      ? 'bg-sky-400/20 border-sky-400 text-white'
                      : 'bg-[#0D0F14] border-white/10 text-slate-600 hover:border-white/30'
                }`}
              >
                {isOpen ? (
                  <>
                    <Icon className="w-7 h-7" aria-hidden="true" />
                    <span className="text-[11px] font-medium">{sym.label}</span>
                  </>
                ) : (
                  <span className="font-mono text-lg font-bold text-slate-600">·</span>
                )}
              </button>
            );
          })}
        </div>

        {allMatched && (
          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={resetDeck}
            className="tv-focusable px-6 py-3 rounded-xl bg-white text-slate-950 font-bold"
          >
            Nuevo tablero
          </button>
        )}
      </div>
    </section>
  );
}
