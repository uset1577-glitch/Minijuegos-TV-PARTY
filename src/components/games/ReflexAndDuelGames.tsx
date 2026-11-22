import {useEffect, useRef, useState} from 'react';
import {Calculator, EyeOff, Hand, Trophy, Zap} from 'lucide-react';
import {Player, getPlayerColor} from '../../types/game';
import {soundFX} from '../../utils/sound';

interface BaseGameProps {
  players: Player[];
  onAwardPoints: (playerId: string, delta: number) => void;
  onExit: () => void;
}

/* -------------------------------------------------------------------------- */
/* 10. LUZ VERDE (REFLEJOS EN MILISEGUNDOS)                                   */
/* -------------------------------------------------------------------------- */

export function ReactionGame({players, onAwardPoints, onExit}: BaseGameProps) {
  const [turnIdx, setTurnIdx] = useState(0);
  const [state, setState] = useState<'READY' | 'WAITING' | 'GO' | 'RESULT' | 'SUMMARY'>('READY');
  const [results, setResults] = useState<Array<{playerId: string; name: string; ms: number}>>([]);
  const [lastMs, setLastMs] = useState<number | null>(null);
  const [falseStart, setFalseStart] = useState(false);

  const timerRef = useRef<number | null>(null);
  const goTimeRef = useRef<number>(0);

  const activePlayer = players[turnIdx] ?? players[0];

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const startAttempt = () => {
    soundFX.confirm();
    setFalseStart(false);
    setLastMs(null);
    setState('WAITING');
    const waitMs = 1500 + Math.floor(Math.random() * 2800);
    timerRef.current = window.setTimeout(() => {
      goTimeRef.current = performance.now();
      setState('GO');
      soundFX.timerBeep(true);
    }, waitMs);
  };

  const handleTrigger = () => {
    if (state === 'WAITING') {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      setFalseStart(true);
      setState('RESULT');
      soundFX.fail();
      setResults((prev) => [
        ...prev,
        {playerId: activePlayer.id, name: activePlayer.name, ms: 9999},
      ]);
      return;
    }

    if (state === 'GO') {
      const elapsed = Math.round(performance.now() - goTimeRef.current);
      setLastMs(elapsed);
      setState('RESULT');
      soundFX.success();
      setResults((prev) => [
        ...prev,
        {playerId: activePlayer.id, name: activePlayer.name, ms: elapsed},
      ]);
    }
  };

  const nextStep = () => {
    soundFX.confirm();
    if (turnIdx + 1 < players.length) {
      setTurnIdx((i) => i + 1);
      setState('READY');
    } else {
      const valid = results.filter((r) => r.ms < 9999).sort((a, b) => a.ms - b.ms);
      if (valid[0]) {
        onAwardPoints(valid[0].playerId, 150);
      }
      setState('SUMMARY');
    }
  };

  const resetAll = () => {
    soundFX.confirm();
    setTurnIdx(0);
    setResults([]);
    setLastMs(null);
    setFalseStart(false);
    setState('READY');
  };

  return (
    <section className="max-w-4xl mx-auto w-full px-6 lg:px-10 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-sky-400">Luz Verde · Reflejos</p>
          <h1 className="text-3xl font-bold text-white">Pulsa OK al cambiar a verde</h1>
        </div>
        <button
          type="button"
          data-tv-focusable="true"
          onClick={() => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
            soundFX.back();
            onExit();
          }}
          className="tv-focusable px-4 py-2 rounded-lg text-sm font-semibold bg-[#161922] text-slate-200 border border-white/10"
        >
          Salir
        </button>
      </div>

      {state === 'READY' && (
        <div className="rounded-2xl p-10 bg-[#161922] border border-white/8 text-center space-y-5">
          <Zap className="w-10 h-10 text-sky-400 mx-auto" aria-hidden="true" />
          <h2 className="text-3xl font-bold text-white">Turno de {activePlayer.name}</h2>
          <p className="text-slate-400">
            Pulsa OK para comenzar. Luego espera en silencio hasta que la pantalla se ponga verde y pulsa OK lo más rápido posible.
          </p>
          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={startAttempt}
            className="tv-focusable px-8 py-4 rounded-xl bg-white text-slate-950 font-bold text-lg"
          >
            Preparado
          </button>
        </div>
      )}

      {(state === 'WAITING' || state === 'GO') && (
        <button
          type="button"
          data-tv-focusable="true"
          data-tv-autofocus="true"
          onClick={handleTrigger}
          className={`tv-focusable w-full rounded-2xl p-16 text-center space-y-3 border transition-colors ${
            state === 'GO'
              ? 'bg-emerald-500 border-emerald-300 text-slate-950'
              : 'bg-[#161922] border-rose-500/40 text-white'
          }`}
        >
          <p className="text-4xl font-extrabold">
            {state === 'GO' ? '¡PULSA OK AHORA!' : 'Espera la señal...'}
          </p>
          <p className={state === 'GO' ? 'text-slate-900 font-semibold' : 'text-slate-400'}>
            {activePlayer.name}
          </p>
        </button>
      )}

      {state === 'RESULT' && (
        <div className="rounded-2xl p-10 bg-[#161922] border border-white/8 text-center space-y-5">
          {falseStart ? (
            <>
              <h2 className="text-3xl font-bold text-rose-400">¡Salida en falso!</h2>
              <p className="text-slate-400">Pulsaste antes de que cambiara a verde.</p>
            </>
          ) : (
            <>
              <p className="text-sm text-sky-400 font-medium">{activePlayer.name}</p>
              <h2 className="font-mono text-5xl font-bold text-white tabular-nums">
                {lastMs} ms
              </h2>
            </>
          )}
          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={nextStep}
            className="tv-focusable px-7 py-3.5 rounded-xl bg-white text-slate-950 font-bold"
          >
            {turnIdx + 1 < players.length ? 'Siguiente jugador' : 'Ver ganador'}
          </button>
        </div>
      )}

      {state === 'SUMMARY' && (
        <div className="rounded-2xl p-8 bg-[#161922] border border-white/8 space-y-5">
          <div className="flex items-center gap-3 text-sky-400">
            <Trophy className="w-6 h-6" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-white">Resultados de reflejos</h2>
          </div>
          <div className="divide-y divide-white/8 rounded-xl bg-[#0D0F14] border border-white/8">
            {[...results]
              .sort((a, b) => a.ms - b.ms)
              .map((r, i) => (
                <div key={r.playerId} className="flex items-center justify-between px-5 py-3.5">
                  <span className="font-semibold text-white">
                    {i + 1}. {r.name}
                  </span>
                  <span className="font-mono text-sm text-sky-300 tabular-nums">
                    {r.ms >= 9999 ? 'Salida falsa' : `${r.ms} ms`}
                  </span>
                </div>
              ))}
          </div>
          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={resetAll}
            className="tv-focusable px-6 py-3 rounded-xl bg-white text-slate-950 font-bold"
          >
            Jugar otra ronda
          </button>
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 11. RELOJ CIEGO (5.00 SEGUNDOS)                                            */
/* -------------------------------------------------------------------------- */

export function BlindTimerGame({players, onAwardPoints, onExit}: BaseGameProps) {
  const TARGET_SEC = 5.0;
  const [turnIdx, setTurnIdx] = useState(0);
  const [phase, setPhase] = useState<'READY' | 'RUNNING' | 'RESULT' | 'SUMMARY'>('READY');
  const [elapsedLive, setElapsedLive] = useState(0);
  const [finalSec, setFinalSec] = useState<number | null>(null);
  const [scores, setScores] = useState<Array<{playerId: string; name: string; sec: number; diff: number}>>([]);

  const startMsRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const activePlayer = players[turnIdx] ?? players[0];

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const startClock = () => {
    soundFX.confirm();
    startMsRef.current = performance.now();
    setPhase('RUNNING');
    const tick = () => {
      const sec = (performance.now() - startMsRef.current) / 1000;
      setElapsedLive(sec);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const stopClock = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const sec = Number(((performance.now() - startMsRef.current) / 1000).toFixed(2));
    const diff = Number(Math.abs(sec - TARGET_SEC).toFixed(2));
    setFinalSec(sec);
    setScores((prev) => [...prev, {playerId: activePlayer.id, name: activePlayer.name, sec, diff}]);
    setPhase('RESULT');
    if (diff <= 0.35) soundFX.success();
    else soundFX.confirm();
  };

  const next = () => {
    soundFX.confirm();
    if (turnIdx + 1 < players.length) {
      setTurnIdx((i) => i + 1);
      setPhase('READY');
    } else {
      const sorted = [...scores].sort((a, b) => a.diff - b.diff);
      if (sorted[0]) onAwardPoints(sorted[0].playerId, 150);
      setPhase('SUMMARY');
    }
  };

  return (
    <section className="max-w-4xl mx-auto w-full px-6 lg:px-10 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-sky-400">Reloj Ciego · Precisión</p>
          <h1 className="text-3xl font-bold text-white">Detén el reloj en 5.00 s</h1>
        </div>
        <button
          type="button"
          data-tv-focusable="true"
          onClick={() => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            soundFX.back();
            onExit();
          }}
          className="tv-focusable px-4 py-2 rounded-lg text-sm font-semibold bg-[#161922] text-slate-200 border border-white/10"
        >
          Salir
        </button>
      </div>

      {phase === 'READY' && (
        <div className="rounded-2xl p-10 bg-[#161922] border border-white/8 text-center space-y-5">
          <EyeOff className="w-10 h-10 text-sky-400 mx-auto" aria-hidden="true" />
          <h2 className="text-3xl font-bold text-white">Turno de {activePlayer.name}</h2>
          <p className="text-slate-400">
            El reloj se ocultará después de 1.5 segundos. Cuenta mentalmente y pulsa OK justo a los 5.00 segundos.
          </p>
          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={startClock}
            className="tv-focusable px-8 py-4 rounded-xl bg-white text-slate-950 font-bold text-lg"
          >
            Iniciar reloj
          </button>
        </div>
      )}

      {phase === 'RUNNING' && (
        <div className="rounded-2xl p-12 bg-[#161922] border border-sky-400/40 text-center space-y-6">
          <p className="font-mono text-6xl font-bold text-white tabular-nums">
            {elapsedLive < 1.5 ? elapsedLive.toFixed(2) : '?.??'}
          </p>
          <p className="text-sm text-slate-400">
            {elapsedLive < 1.5 ? 'Memoriza el ritmo...' : 'Reloj oculto — calcula 5.00 s'}
          </p>
          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={stopClock}
            className="tv-focusable px-10 py-4 rounded-xl bg-sky-400 text-slate-950 font-bold text-lg"
          >
            Detener ahora
          </button>
        </div>
      )}

      {phase === 'RESULT' && finalSec !== null && (
        <div className="rounded-2xl p-10 bg-[#161922] border border-white/8 text-center space-y-5">
          <p className="text-sm text-sky-400">{activePlayer.name}</p>
          <h2 className="font-mono text-5xl font-bold text-white tabular-nums">
            {finalSec.toFixed(2)} s
          </h2>
          <p className="text-slate-400">
            Diferencia: {Math.abs(finalSec - TARGET_SEC).toFixed(2)} s
          </p>
          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={next}
            className="tv-focusable px-7 py-3.5 rounded-xl bg-white text-slate-950 font-bold"
          >
            {turnIdx + 1 < players.length ? 'Siguiente jugador' : 'Ver ganador'}
          </button>
        </div>
      )}

      {phase === 'SUMMARY' && (
        <div className="rounded-2xl p-8 bg-[#161922] border border-white/8 space-y-5">
          <h2 className="text-2xl font-bold text-white">Clasificación (meta: 5.00 s)</h2>
          <div className="divide-y divide-white/8 rounded-xl bg-[#0D0F14] border border-white/8">
            {[...scores]
              .sort((a, b) => a.diff - b.diff)
              .map((s, i) => (
                <div key={s.playerId} className="flex items-center justify-between px-5 py-3.5">
                  <span className="font-semibold text-white">
                    {i + 1}. {s.name}
                  </span>
                  <span className="font-mono text-sm text-sky-300 tabular-nums">
                    {s.sec.toFixed(2)} s (±{s.diff.toFixed(2)})
                  </span>
                </div>
              ))}
          </div>
          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={() => {
              soundFX.confirm();
              setTurnIdx(0);
              setScores([]);
              setPhase('READY');
            }}
            className="tv-focusable px-6 py-3 rounded-xl bg-white text-slate-950 font-bold"
          >
            Otra ronda
          </button>
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 12. CÁLCULO EXPRÉS                                                         */
/* -------------------------------------------------------------------------- */

interface MathProblem {
  prompt: string;
  options: number[];
  answer: number;
}

function makeMathProblem(): MathProblem {
  const ops = ['+', '-', '×'] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];
  const a = op === '×' ? 3 + Math.floor(Math.random() * 10) : 12 + Math.floor(Math.random() * 45);
  const b = op === '×' ? 3 + Math.floor(Math.random() * 9) : 6 + Math.floor(Math.random() * 30);
  const ans = op === '+' ? a + b : op === '-' ? a - b : a * b;
  const set = new Set<number>([ans]);
  while (set.size < 4) {
    const offset = (Math.floor(Math.random() * 9) + 1) * (Math.random() > 0.5 ? 1 : -1);
    set.add(ans + offset);
  }
  const options = Array.from(set).sort(() => Math.random() - 0.5);
  return {prompt: `${a} ${op} ${b}`, options, answer: ans};
}

export function MathDuelGame({players, onAwardPoints, onExit}: BaseGameProps) {
  const TOTAL = 6;
  const [roundIdx, setRoundIdx] = useState(0);
  const [problem, setProblem] = useState<MathProblem>(() => makeMathProblem());
  const [timeLeft, setTimeLeft] = useState(8);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const activePlayer = players[roundIdx % players.length] ?? players[0];

  useEffect(() => {
    if (done || feedback !== null) return;
    if (timeLeft <= 0) {
      setFeedback(`Tiempo agotado. Era ${problem.answer}`);
      soundFX.fail();
      return;
    }
    const id = window.setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => window.clearTimeout(id);
  }, [done, feedback, timeLeft, problem.answer]);

  const pick = (val: number) => {
    if (feedback !== null) return;
    if (val === problem.answer) {
      const pts = 80 + timeLeft * 10;
      onAwardPoints(activePlayer.id, pts);
      setFeedback(`¡Correcto! +${pts} pts`);
      soundFX.success();
    } else {
      setFeedback(`Incorrecto. Era ${problem.answer}`);
      soundFX.fail();
    }
  };

  const next = () => {
    soundFX.confirm();
    if (roundIdx + 1 >= TOTAL) {
      setDone(true);
    } else {
      setRoundIdx((r) => r + 1);
      setProblem(makeMathProblem());
      setTimeLeft(8);
      setFeedback(null);
    }
  };

  return (
    <section className="max-w-4xl mx-auto w-full px-6 lg:px-10 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-sky-400">Cálculo Exprés</p>
          <h1 className="text-3xl font-bold text-white">Agilidad numérica</h1>
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

      {!done ? (
        <div className="rounded-2xl p-8 bg-[#161922] border border-white/8 space-y-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-sky-400">
              {activePlayer.name} · Operación {roundIdx + 1}/{TOTAL}
            </span>
            <span className="font-mono font-bold text-white tabular-nums">{timeLeft}s</span>
          </div>

          <div className="py-6 text-center">
            <Calculator className="w-6 h-6 text-slate-500 mx-auto mb-2" aria-hidden="true" />
            <p className="font-mono text-5xl font-bold text-white tabular-nums">
              {problem.prompt}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {problem.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                disabled={feedback !== null}
                data-tv-focusable={feedback === null ? 'true' : undefined}
                data-tv-autofocus={feedback === null && i === 0 ? 'true' : undefined}
                onClick={() => pick(opt)}
                className="tv-focusable py-4 rounded-xl bg-[#0D0F14] border border-white/10 font-mono text-2xl font-bold text-white hover:border-sky-400"
              >
                {opt}
              </button>
            ))}
          </div>

          {feedback && (
            <div className="flex items-center justify-between pt-3 border-t border-white/8">
              <p className="font-semibold text-sky-300">{feedback}</p>
              <button
                type="button"
                data-tv-focusable="true"
                data-tv-autofocus="true"
                onClick={next}
                className="tv-focusable px-6 py-3 rounded-xl bg-white text-slate-950 font-bold"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl p-8 bg-[#161922] border border-white/8 text-center space-y-5">
          <h2 className="text-2xl font-bold text-white">Serie completada</h2>
          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={() => {
              soundFX.confirm();
              setRoundIdx(0);
              setProblem(makeMathProblem());
              setTimeLeft(8);
              setFeedback(null);
              setDone(false);
            }}
            className="tv-focusable px-6 py-3 rounded-xl bg-white text-slate-950 font-bold"
          >
            Otra serie
          </button>
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 13. DUELO SECRETO (PIEDRA, PAPEL O TIJERA)                                 */
/* -------------------------------------------------------------------------- */

type RpsMove = 'Piedra' | 'Papel' | 'Tijera';
const MOVES: RpsMove[] = ['Piedra', 'Papel', 'Tijera'];

function rpsWinner(a: RpsMove, b: RpsMove): 'A' | 'B' | 'TIE' {
  if (a === b) return 'TIE';
  if (
    (a === 'Piedra' && b === 'Tijera') ||
    (a === 'Papel' && b === 'Piedra') ||
    (a === 'Tijera' && b === 'Papel')
  ) {
    return 'A';
  }
  return 'B';
}

export function RpsGame({players, onAwardPoints, onExit}: BaseGameProps) {
  const [p1Idx, setP1Idx] = useState(0);
  const [step, setStep] = useState<'P1_PICK' | 'PASS' | 'P2_PICK' | 'RESULT'>('P1_PICK');
  const [move1, setMove1] = useState<RpsMove | null>(null);
  const [move2, setMove2] = useState<RpsMove | null>(null);

  const isSolo = players.length === 1;
  const p1 = players[p1Idx % players.length] ?? players[0];
  const p2 = players[(p1Idx + 1) % players.length] ?? players[0];
  const p1Color = getPlayerColor(p1.colorId);

  const pickP1 = (m: RpsMove) => {
    soundFX.confirm();
    setMove1(m);
    if (isSolo) {
      const cpu = MOVES[Math.floor(Math.random() * 3)];
      setMove2(cpu);
      const w = rpsWinner(m, cpu);
      if (w === 'A') {
        onAwardPoints(p1.id, 100);
        soundFX.success();
      } else if (w === 'B') {
        soundFX.fail();
      }
      setStep('RESULT');
    } else {
      setStep('PASS');
    }
  };

  const pickP2 = (m: RpsMove) => {
    setMove2(m);
    if (move1) {
      const w = rpsWinner(move1, m);
      if (w === 'A') {
        onAwardPoints(p1.id, 100);
        soundFX.success();
      } else if (w === 'B') {
        onAwardPoints(p2.id, 100);
        soundFX.success();
      } else {
        soundFX.confirm();
      }
    }
    setStep('RESULT');
  };

  return (
    <section className="max-w-4xl mx-auto w-full px-6 lg:px-10 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-sky-400">Duelo Secreto</p>
          <h1 className="text-3xl font-bold text-white">Piedra, Papel o Tijera</h1>
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

      {step === 'P1_PICK' && (
        <div className="rounded-2xl p-8 bg-[#161922] border border-white/8 space-y-6">
          <div className="flex items-center gap-3">
            <Hand className={`w-6 h-6 ${p1Color.textClass}`} aria-hidden="true" />
            <h2 className="text-2xl font-bold text-white">
              {isSolo ? `${p1.name} contra la TV` : `Elige en secreto: ${p1.name}`}
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {MOVES.map((m, i) => (
              <button
                key={m}
                type="button"
                data-tv-focusable="true"
                data-tv-autofocus={i === 0 ? 'true' : undefined}
                onClick={() => pickP1(m)}
                className="tv-focusable py-6 rounded-xl bg-[#0D0F14] border border-white/10 text-xl font-bold text-white hover:border-sky-400"
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'PASS' && (
        <div className="rounded-2xl p-10 bg-[#161922] border border-white/8 text-center space-y-5">
          <h2 className="text-2xl font-bold text-white">
            Elección guardada · Pasa el control a {p2.name}
          </h2>
          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={() => {
              soundFX.confirm();
              setStep('P2_PICK');
            }}
            className="tv-focusable px-7 py-3.5 rounded-xl bg-white text-slate-950 font-bold"
          >
            Soy {p2.name}, elegir
          </button>
        </div>
      )}

      {step === 'P2_PICK' && (
        <div className="rounded-2xl p-8 bg-[#161922] border border-white/8 space-y-6">
          <h2 className="text-2xl font-bold text-white">Elige en secreto: {p2.name}</h2>
          <div className="grid grid-cols-3 gap-4">
            {MOVES.map((m, i) => (
              <button
                key={m}
                type="button"
                data-tv-focusable="true"
                data-tv-autofocus={i === 0 ? 'true' : undefined}
                onClick={() => pickP2(m)}
                className="tv-focusable py-6 rounded-xl bg-[#0D0F14] border border-white/10 text-xl font-bold text-white hover:border-sky-400"
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'RESULT' && move1 && move2 && (
        <div className="rounded-2xl p-8 bg-[#161922] border border-white/8 text-center space-y-5">
          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
            <div className="p-4 rounded-xl bg-[#0D0F14] border border-white/8">
              <p className="text-xs text-slate-400">{p1.name}</p>
              <p className="text-2xl font-bold text-white mt-1">{move1}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0D0F14] border border-white/8">
              <p className="text-xs text-slate-400">{isSolo ? 'TV' : p2.name}</p>
              <p className="text-2xl font-bold text-white mt-1">{move2}</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-sky-300">
            {rpsWinner(move1, move2) === 'TIE'
              ? '¡Empate!'
              : rpsWinner(move1, move2) === 'A'
                ? `¡Gana ${p1.name} (+100 pts)!`
                : isSolo
                  ? 'Gana la TV'
                  : `¡Gana ${p2.name} (+100 pts)!`}
          </h2>

          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={() => {
              soundFX.confirm();
              setP1Idx((i) => (i + 1) % players.length);
              setMove1(null);
              setMove2(null);
              setStep('P1_PICK');
            }}
            className="tv-focusable px-7 py-3.5 rounded-xl bg-white text-slate-950 font-bold"
          >
            Siguiente duelo
          </button>
        </div>
      )}
    </section>
  );
}
