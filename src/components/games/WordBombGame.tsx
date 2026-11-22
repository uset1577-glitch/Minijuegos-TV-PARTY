import {useEffect, useRef, useState} from 'react';
import {ArrowRight, Flame, RefreshCw, Timer} from 'lucide-react';
import {BombPrompt, Player, getPlayerColor} from '../../types/game';
import {apiUrl} from '../../utils/api';
import {soundFX} from '../../utils/sound';

interface WordBombGameProps {
  players: Player[];
  onAwardPoints: (playerId: string, delta: number) => void;
  onExit: () => void;
}

const BOMB_VIBES = [
  'Vida cotidiana',
  'Fiesta y humor',
  'Cine, series y música',
  'Viajes y comida',
];

export function WordBombGame({
  players,
  onAwardPoints,
  onExit,
}: WordBombGameProps) {
  const [phase, setPhase] = useState<'SETUP' | 'LOADING' | 'ACTIVE' | 'EXPLODED'>('SETUP');
  const [vibe, setVibe] = useState(BOMB_VIBES[0]);
  const [prompts, setPrompts] = useState<BombPrompt[]>([]);
  const [promptIdx, setPromptIdx] = useState(0);
  const [holderIndex, setHolderIndex] = useState(0);
  const [passesCount, setPassesCount] = useState(0);
  const [recentPrompts, setRecentPrompts] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fuseEndRef = useRef<number>(0);
  const tickTimerRef = useRef<number | null>(null);

  const isSolo = players.length === 1;
  const currentPrompt = prompts[promptIdx] ?? null;
  const holder = players[holderIndex % players.length] ?? players[0];
  const holderColor = getPlayerColor(holder.colorId);

  useEffect(() => {
    return () => {
      if (tickTimerRef.current) window.clearTimeout(tickTimerRef.current);
    };
  }, []);

  const scheduleTick = () => {
    if (tickTimerRef.current) window.clearTimeout(tickTimerRef.current);
    const remaining = fuseEndRef.current - Date.now();
    if (remaining <= 0) {
      soundFX.bombBoom();
      setPhase('EXPLODED');
      if (isSolo) {
        if (passesCount >= 6) {
          onAwardPoints(players[0].id, 150);
        }
      } else {
        players.forEach((p, idx) => {
          onAwardPoints(p.id, idx === holderIndex ? -50 : 50);
        });
      }
      return;
    }

    const urgent = remaining < 6000;
    soundFX.timerBeep(urgent);
    const nextDelay = remaining < 4000 ? 280 : remaining < 9000 ? 520 : 850;
    tickTimerRef.current = window.setTimeout(scheduleTick, nextDelay);
  };

  const launchFuse = (idx: number) => {
    setPromptIdx(idx);
    setPassesCount(0);
    const fuseMs = 16000 + Math.floor(Math.random() * 11000);
    fuseEndRef.current = Date.now() + fuseMs;
    setPhase('ACTIVE');
    scheduleTick();
  };

  const loadBatch = async () => {
    soundFX.confirm();
    setPhase('LOADING');
    setErrorMsg(null);
    try {
      const res = await fetch(apiUrl('/api/ai/bomb-prompt'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({vibe, recentPrompts}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudieron crear consignas.');
      const list = Array.isArray(data.prompts) ? (data.prompts as BombPrompt[]) : [];
      if (list.length === 0) throw new Error('Sin consignas disponibles.');
      setPrompts(list);
      setRecentPrompts((prev) => [...prev.slice(-16), ...list.map((p) => p.prompt)]);
      launchFuse(0);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error de conexión.');
      setPhase('SETUP');
      soundFX.fail();
    }
  };

  const handlePassBomb = () => {
    if (phase !== 'ACTIVE') return;
    soundFX.confirm();
    setPassesCount((c) => c + 1);
    if (!isSolo) {
      setHolderIndex((prev) => (prev + 1) % players.length);
    }
  };

  const handleNextBomb = () => {
    soundFX.confirm();
    if (promptIdx + 1 < prompts.length) {
      setHolderIndex((prev) => (prev + 1) % players.length);
      launchFuse(promptIdx + 1);
    } else {
      void loadBatch();
    }
  };

  return (
    <section className="max-w-5xl mx-auto w-full px-6 lg:px-10 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-sky-400">
            Papa Caliente IA · Tiempo oculto
          </p>
          <h1 className="text-3xl font-bold text-white">Di una palabra y pasa el control</h1>
        </div>
        <button
          type="button"
          data-tv-focusable="true"
          onClick={() => {
            if (tickTimerRef.current) window.clearTimeout(tickTimerRef.current);
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
            <h2 className="text-base font-bold text-white">Estilo de consignas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BOMB_VIBES.map((item) => (
                <button
                  key={item}
                  type="button"
                  data-tv-focusable="true"
                  onClick={() => {
                    soundFX.confirm();
                    setVibe(item);
                  }}
                  className={`tv-focusable px-4 py-3.5 rounded-xl text-left text-sm font-semibold border ${
                    vibe === item
                      ? 'bg-sky-400 text-slate-950 border-sky-300'
                      : 'bg-[#0D0F14] text-slate-200 border-white/8'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={() => void loadBatch()}
            className="tv-focusable px-7 py-3.5 rounded-xl bg-white text-slate-950 font-bold text-base hover:bg-slate-200"
          >
            Comenzar
          </button>
        </div>
      )}

      {phase === 'LOADING' && (
        <div className="rounded-2xl p-14 bg-[#161922] border border-white/8 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto" aria-hidden="true" />
          <h2 className="text-xl font-bold text-white">Creando consignas rápidas...</h2>
        </div>
      )}

      {phase === 'ACTIVE' && currentPrompt && (
        <div className="rounded-2xl p-8 lg:p-10 bg-[#161922] border border-sky-400/40 text-center space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span
              className={`px-4 py-1.5 rounded-lg font-bold text-base border ${holderColor.bgClass} ${holderColor.borderClass} ${holderColor.textClass}`}
            >
              {isSolo ? `Respuestas: ${passesCount} / 6` : `Control en manos de: ${holder.name}`}
            </span>
            <span className="font-mono text-sm text-slate-400 tabular-nums">
              Pases: {passesCount}
            </span>
          </div>

          <div className="py-2 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-[#0D0F14] border border-white/15 flex items-center justify-center animate-bomb-shake">
              <Timer className="w-10 h-10 text-sky-400" aria-hidden="true" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white">
              {currentPrompt.prompt}
            </h2>
            <p className="text-sm text-slate-400">
              Ejemplo: {currentPrompt.example}
            </p>
          </div>

          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={handlePassBomb}
            className="tv-focusable w-full sm:w-auto inline-flex items-center justify-center gap-3 px-9 py-4 rounded-xl bg-white text-slate-950 font-bold text-lg hover:bg-slate-200"
          >
            <span>{isSolo ? '¡Dije una! (+1)' : '¡Listo! Pasar control'}</span>
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {phase === 'EXPLODED' && (
        <div className="rounded-2xl p-10 bg-[#161922] border border-rose-500/40 text-center space-y-5">
          <Flame className="w-12 h-12 text-rose-400 mx-auto" aria-hidden="true" />
          {isSolo ? (
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">
                {passesCount >= 6 ? '¡Objetivo cumplido!' : '¡Se acabó el tiempo!'}
              </h2>
              <p className="text-slate-300">
                {passesCount >= 6
                  ? `Lograste ${passesCount} respuestas a tiempo (+150 pts).`
                  : `Llegaste a ${passesCount} de 6 respuestas.`}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-white">
                ¡Terminó en manos de {holder.name}!
              </h2>
              <p className="text-slate-300">
                {holder.name} pierde 50 pts. Los demás ganan +50 pts.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              data-tv-focusable="true"
              data-tv-autofocus="true"
              onClick={handleNextBomb}
              className="tv-focusable px-6 py-3 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-200"
            >
              Siguiente ronda
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
              Cambiar estilo
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
