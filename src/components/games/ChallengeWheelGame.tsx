import {useEffect, useRef, useState} from 'react';
import {Check, RefreshCw, RotateCw, SkipForward, Timer, X} from 'lucide-react';
import {ChallengeResult, Player, getPlayerColor} from '../../types/game';
import {apiUrl} from '../../utils/api';
import {soundFX} from '../../utils/sound';

interface ChallengeWheelGameProps {
  players: Player[];
  onAwardPoints: (playerId: string, delta: number) => void;
  onExit: () => void;
}

const SEGMENTS = [
  {label: 'Mímica', color: '#1E293B'},
  {label: 'Verdad', color: '#0F172A'},
  {label: 'Improvisa', color: '#1E3A5F'},
  {label: 'Físico', color: '#172554'},
  {label: 'Votación', color: '#1F2937'},
  {label: 'Memoria', color: '#134E4A'},
  {label: 'Talento', color: '#312E81'},
  {label: 'Comodín IA', color: '#0C4A6E'},
];

const VIBES = [
  'Familiar',
  'Fiesta con amigos',
  'Picante suave',
  'Caos creativo',
  'Cine y cultura pop',
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function wedgePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export function ChallengeWheelGame({
  players,
  onAwardPoints,
  onExit,
}: ChallengeWheelGameProps) {
  const [vibe, setVibe] = useState<string>(VIBES[1]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<ChallengeResult | null>(null);
  const [recentPrompts, setRecentPrompts] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);

  const rotationRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  const activePlayer = players[turnIndex % players.length] ?? players[0];
  const playerColor = getPlayerColor(activePlayer.colorId);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  useEffect(() => {
    if (!timerRunning || countdown === null) return;
    if (countdown <= 0) {
      setTimerRunning(false);
      soundFX.bombBoom();
      return;
    }
    const id = window.setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
      soundFX.timerBeep(countdown <= 6);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [timerRunning, countdown]);

  const fetchChallenge = async (category: string) => {
    setLoadingAi(true);
    setErrorMsg(null);
    setTimerRunning(false);
    try {
      const res = await fetch(apiUrl('/api/ai/challenge'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          category,
          vibe,
          playerName: activePlayer.name,
          playerCount: players.length,
          recentPrompts,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo generar el reto con IA.');
      }
      const nextChallenge: ChallengeResult = {
        title: String(data.title || category),
        challenge: String(data.challenge || ''),
        twist: String(data.twist || ''),
        points: Number(data.points || 100),
        durationSec: Number(data.durationSec || 30),
        category,
      };
      setCurrentChallenge(nextChallenge);
      setCountdown(nextChallenge.durationSec);
      setRecentPrompts((prev) => [...prev.slice(-14), nextChallenge.title]);
      soundFX.success();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al conectar con la IA.');
      soundFX.fail();
    } finally {
      setLoadingAi(false);
    }
  };

  const spinWheel = () => {
    if (spinning || loadingAi) return;
    soundFX.confirm();
    setCurrentChallenge(null);
    setErrorMsg(null);
    setTimerRunning(false);
    setCountdown(null);
    setSpinning(true);

    const startRot = rotationRef.current;
    const extraSpins = 5 * 360 + Math.random() * 360;
    const targetRot = startRot + extraSpins;
    const duration = 3000;
    const startTime = performance.now();
    let lastSegment = Math.floor((startRot % 360) / 45);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = startRot + (targetRot - startRot) * eased;
      rotationRef.current = current;
      setRotation(current);

      const segIndex = Math.floor((((current % 360) + 360) % 360) / 45);
      if (segIndex !== lastSegment) {
        lastSegment = segIndex;
        soundFX.wheelPeg();
      }

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        setSpinning(false);
        const normalized = ((360 - (current % 360)) + 360) % 360;
        const landedIdx = Math.floor(normalized / 45) % SEGMENTS.length;
        const landedCategory = SEGMENTS[landedIdx].label;
        void fetchChallenge(landedCategory);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  };

  const resolveTurn = (delta: number) => {
    if (delta > 0) soundFX.success();
    else soundFX.back();
    onAwardPoints(activePlayer.id, delta);
    setCurrentChallenge(null);
    setTimerRunning(false);
    setCountdown(null);
    setTurnIndex((prev) => (prev + 1) % players.length);
  };

  const segAngle = 360 / SEGMENTS.length;

  return (
    <section className="max-w-7xl mx-auto w-full px-6 lg:px-10 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-sky-400">
            Ruleta de Retos IA · {players.length} {players.length === 1 ? 'jugador' : 'jugadores'}
          </p>
          <h1 className="text-3xl font-bold text-white">Selector de retos</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {VIBES.map((item) => (
            <button
              key={item}
              type="button"
              data-tv-focusable="true"
              onClick={() => {
                soundFX.confirm();
                setVibe(item);
              }}
              className={`tv-focusable px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap border ${
                vibe === item
                  ? 'bg-sky-400 text-slate-950 border-sky-300 font-bold'
                  : 'bg-[#161922] text-slate-300 border-white/10 hover:text-white'
              }`}
            >
              {item}
            </button>
          ))}
          <button
            type="button"
            data-tv-focusable="true"
            onClick={() => {
              soundFX.back();
              onExit();
            }}
            className="tv-focusable px-4 py-2 rounded-lg text-xs font-semibold bg-[#161922] text-slate-200 border border-white/15 ml-1"
          >
            Salir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Clean Minimalist Geometric SVG Selector Wheel */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative py-2">
          <div className="relative w-[300px] h-[300px] sm:w-[370px] sm:h-[370px]">
            <div
              className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-sky-400"
              aria-hidden="true"
            />
            <svg
              viewBox="0 0 400 400"
              className="w-full h-full"
              style={{
                transform: `rotate(${rotation}deg)`,
                willChange: 'transform',
              }}
            >
              <circle cx="200" cy="200" r="194" fill="#0D0F14" stroke="#334155" strokeWidth="2" />
              {SEGMENTS.map((seg, idx) => {
                const start = idx * segAngle;
                const end = start + segAngle;
                const midAngle = start + segAngle / 2;
                const textPos = polarToCartesian(200, 200, 126, midAngle);
                return (
                  <g key={seg.label}>
                    <path
                      d={wedgePath(200, 200, 186, start, end)}
                      fill={seg.color}
                      stroke="#0D0F14"
                      strokeWidth="3"
                    />
                    <text
                      x={textPos.x}
                      y={textPos.y}
                      fill="#E2E8F0"
                      fontSize="14"
                      fontWeight="600"
                      fontFamily="Outfit, sans-serif"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${midAngle - 90}, ${textPos.x}, ${textPos.y})`}
                    >
                      {seg.label}
                    </text>
                  </g>
                );
              })}
              <circle cx="200" cy="200" r="32" fill="#0D0F14" stroke="#38BDF8" strokeWidth="3" />
              <circle cx="200" cy="200" r="7" fill="#38BDF8" />
            </svg>
          </div>
        </div>

        {/* Turno & Reto IA */}
        <div className="lg:col-span-6 rounded-2xl p-7 bg-[#161922] border border-white/8 space-y-6">
          <div className="flex items-center justify-between gap-4 pb-5 border-b border-white/8">
            <div className="flex items-center gap-3.5 min-w-0">
              <span
                className={`w-11 h-11 rounded-xl flex items-center justify-center font-mono font-bold text-base border ${playerColor.bgClass} ${playerColor.borderClass} ${playerColor.textClass} shrink-0`}
              >
                {activePlayer.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">Turno actual</p>
                <h2 className="text-2xl font-bold text-white truncate">
                  {activePlayer.name}
                </h2>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-slate-400">Puntos</p>
              <p className="font-mono text-2xl font-bold text-white tabular-nums">
                {activePlayer.score}
              </p>
            </div>
          </div>

          {!currentChallenge && !loadingAi && !errorMsg && (
            <div className="space-y-5 py-2">
              <p className="text-base text-slate-300 leading-relaxed">
                Presiona <span className="font-semibold text-white">Girar selector</span> con OK. La IA creará un reto único para la categoría elegida.
              </p>
              <button
                type="button"
                data-tv-focusable="true"
                data-tv-autofocus="true"
                disabled={spinning}
                onClick={spinWheel}
                className="tv-focusable w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-white text-slate-950 font-bold text-lg hover:bg-slate-200 disabled:opacity-60"
              >
                <RotateCw className={`w-5 h-5 ${spinning ? 'animate-spin' : ''}`} aria-hidden="true" />
                <span>{spinning ? 'Girando...' : 'Girar selector'}</span>
              </button>
            </div>
          )}

          {loadingAi && (
            <div className="py-10 text-center space-y-3">
              <RefreshCw className="w-7 h-7 text-sky-400 animate-spin mx-auto" aria-hidden="true" />
              <p className="text-lg font-semibold text-white">
                Creando reto para {activePlayer.name}...
              </p>
              <p className="text-xs text-slate-400">Ambiente: {vibe}</p>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl p-5 bg-rose-500/10 border border-rose-500/30 space-y-4">
              <p className="text-rose-200 text-sm font-medium">{errorMsg}</p>
              <button
                type="button"
                data-tv-focusable="true"
                data-tv-autofocus="true"
                onClick={() => void fetchChallenge('Comodín IA')}
                className="tv-focusable px-5 py-2.5 rounded-lg bg-sky-400 text-slate-950 font-bold text-sm"
              >
                Reintentar
              </button>
            </div>
          )}

          {currentChallenge && !loadingAi && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-sky-400">
                  {currentChallenge.category} · +{currentChallenge.points} pts
                </span>
                {countdown !== null && (
                  <span className="inline-flex items-center gap-1.5 font-mono font-bold text-slate-200 tabular-nums">
                    <Timer className="w-4 h-4 text-sky-400" aria-hidden="true" />
                    <span>{countdown}s</span>
                  </span>
                )}
              </div>

              <div className="space-y-2.5">
                <h3 className="text-2xl font-bold text-white">
                  {currentChallenge.title}
                </h3>
                <p className="text-lg text-slate-200 leading-relaxed">
                  {currentChallenge.challenge}
                </p>
                {currentChallenge.twist && (
                  <p className="text-xs text-slate-400 pt-1">
                    Bonus: {currentChallenge.twist}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  data-tv-focusable="true"
                  data-tv-autofocus="true"
                  onClick={() => resolveTurn(currentChallenge.points)}
                  className="tv-focusable inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400"
                >
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>Cumplido (+{currentChallenge.points})</span>
                </button>

                <button
                  type="button"
                  data-tv-focusable="true"
                  onClick={() => resolveTurn(-50)}
                  className="tv-focusable inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-[#0D0F14] text-rose-300 border border-rose-500/30 font-semibold text-sm hover:bg-rose-500/10"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                  <span>Paso (-50 pts)</span>
                </button>

                <button
                  type="button"
                  data-tv-focusable="true"
                  onClick={() => {
                    soundFX.confirm();
                    setTimerRunning((prev) => !prev);
                  }}
                  className="tv-focusable inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0D0F14] text-slate-200 border border-white/10 font-medium text-xs"
                >
                  <Timer className="w-4 h-4 text-sky-400" aria-hidden="true" />
                  <span>{timerRunning ? 'Pausar reloj' : 'Iniciar reloj'}</span>
                </button>

                <button
                  type="button"
                  data-tv-focusable="true"
                  onClick={() => {
                    soundFX.confirm();
                    void fetchChallenge(currentChallenge.category);
                  }}
                  className="tv-focusable inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0D0F14] text-slate-200 border border-white/10 font-medium text-xs"
                >
                  <SkipForward className="w-4 h-4 text-sky-400" aria-hidden="true" />
                  <span>Otro reto IA</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
