import {useEffect, useState} from 'react';
import {Eye, EyeOff, RefreshCw, ShieldAlert, UserPlus, Vote} from 'lucide-react';
import {ImpostorRound, Player, getPlayerColor} from '../../types/game';
import {apiUrl} from '../../utils/api';
import {soundFX} from '../../utils/sound';

interface ImpostorGameProps {
  players: Player[];
  onAwardPoints: (playerId: string, delta: number) => void;
  onQuickAddPlayers: (targetCount: number) => void;
  onExit: () => void;
}

const IMPOSTOR_VIBES = [
  'Lugares y objetos cotidianos',
  'Comida y bebida',
  'Películas y series famosas',
  'Profesiones y hobbies',
];

export function ImpostorGame({
  players,
  onAwardPoints,
  onQuickAddPlayers,
  onExit,
}: ImpostorGameProps) {
  const [phase, setPhase] = useState<
    'SETUP' | 'LOADING' | 'PASS_LOCKED' | 'PASS_REVEAL' | 'DEBATE' | 'VOTE' | 'RESULT'
  >('SETUP');
  const [vibe, setVibe] = useState(IMPOSTOR_VIBES[0]);
  const [round, setRound] = useState<ImpostorRound | null>(null);
  const [impostorIndex, setImpostorIndex] = useState(0);
  const [inspectIndex, setInspectIndex] = useState(0);
  const [debateSec, setDebateSec] = useState(90);
  const [accusedIndex, setAccusedIndex] = useState<number | null>(null);
  const [recentWords, setRecentWords] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (phase !== 'DEBATE' || debateSec <= 0) return;
    const id = window.setTimeout(() => {
      setDebateSec((prev) => prev - 1);
      if (debateSec <= 6) soundFX.timerBeep(true);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [phase, debateSec]);

  if (players.length < 3) {
    return (
      <section className="max-w-3xl mx-auto w-full px-6 py-12">
        <div className="rounded-2xl p-8 bg-[#161922] border border-white/8 space-y-6 text-center">
          <ShieldAlert className="w-10 h-10 text-sky-400 mx-auto" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-white">
            El Impostor requiere 3 o más jugadores
          </h1>
          <p className="text-slate-400">
            Actualmente hay {players.length} {players.length === 1 ? 'jugador' : 'jugadores'}. Completa la sala a 3 jugadores para iniciar.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              data-tv-focusable="true"
              data-tv-autofocus="true"
              onClick={() => {
                soundFX.confirm();
                onQuickAddPlayers(3);
              }}
              className="tv-focusable inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-200"
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              <span>Completar a 3 jugadores</span>
            </button>
            <button
              type="button"
              data-tv-focusable="true"
              onClick={() => {
                soundFX.back();
                onExit();
              }}
              className="tv-focusable px-6 py-3 rounded-xl bg-[#0D0F14] text-slate-200 border border-white/10 font-medium"
            >
              Volver
            </button>
          </div>
        </div>
      </section>
    );
  }

  const startRound = async () => {
    soundFX.confirm();
    setPhase('LOADING');
    setErrorMsg(null);
    setAccusedIndex(null);
    try {
      const res = await fetch(apiUrl('/api/ai/impostor'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({vibe, recentWords}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo iniciar la ronda.');
      const nextRound: ImpostorRound = {
        category: String(data.category || 'General'),
        secretWord: String(data.secretWord || ''),
        impostorHint: String(data.impostorHint || ''),
        starterQuestion: String(data.starterQuestion || ''),
      };
      setRound(nextRound);
      setRecentWords((prev) => [...prev.slice(-18), nextRound.secretWord]);
      setImpostorIndex(Math.floor(Math.random() * players.length));
      setInspectIndex(0);
      setDebateSec(90);
      setPhase('PASS_LOCKED');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al conectar con la IA.');
      setPhase('SETUP');
      soundFX.fail();
    }
  };

  const currentInspectPlayer = players[inspectIndex] ?? players[0];
  const isCurrentImpostor = inspectIndex === impostorIndex;

  const handleNextInspect = () => {
    soundFX.confirm();
    if (inspectIndex + 1 < players.length) {
      setInspectIndex((prev) => prev + 1);
      setPhase('PASS_LOCKED');
    } else {
      setPhase('DEBATE');
    }
  };

  const handleVote = (idx: number) => {
    setAccusedIndex(idx);
    setPhase('RESULT');
    if (idx === impostorIndex) {
      soundFX.success();
      players.forEach((p, pIdx) => {
        if (pIdx !== impostorIndex) onAwardPoints(p.id, 100);
      });
    } else {
      soundFX.fail();
      onAwardPoints(players[impostorIndex].id, 200);
    }
  };

  return (
    <section className="max-w-5xl mx-auto w-full px-6 lg:px-10 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-sky-400">
            El Impostor IA · {players.length} jugadores
          </p>
          <h1 className="text-3xl font-bold text-white">Descubre al infiltrado</h1>
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
            <h2 className="text-base font-bold text-white">Temática de palabras</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {IMPOSTOR_VIBES.map((item) => (
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
            onClick={() => void startRound()}
            className="tv-focusable px-7 py-3.5 rounded-xl bg-white text-slate-950 font-bold text-base hover:bg-slate-200"
          >
            Repartir roles
          </button>
        </div>
      )}

      {phase === 'LOADING' && (
        <div className="rounded-2xl p-14 bg-[#161922] border border-white/8 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto" aria-hidden="true" />
          <h2 className="text-xl font-bold text-white">Eligiendo palabra secreta...</h2>
        </div>
      )}

      {phase === 'PASS_LOCKED' && (
        <div className="rounded-2xl p-10 bg-[#161922] border border-white/8 text-center space-y-5">
          <p className="text-xs font-medium text-sky-400">
            Jugador {inspectIndex + 1} de {players.length}
          </p>
          <h2 className="text-3xl font-bold text-white">
            Turno de {currentInspectPlayer.name}
          </h2>
          <p className="text-base text-slate-400 max-w-md mx-auto">
            Asegúrate de que nadie más mire la pantalla y pulsa OK para ver tu tarjeta.
          </p>
          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={() => {
              soundFX.confirm();
              setPhase('PASS_REVEAL');
            }}
            className="tv-focusable inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-200"
          >
            <Eye className="w-5 h-5" aria-hidden="true" />
            <span>Ver mi rol</span>
          </button>
        </div>
      )}

      {phase === 'PASS_REVEAL' && round && (
        <div className="rounded-2xl p-10 bg-[#161922] border border-sky-400/40 text-center space-y-5">
          <p className="text-xs font-medium text-slate-400">
            Solo para {currentInspectPlayer.name}
          </p>

          {isCurrentImpostor ? (
            <div className="space-y-2.5">
              <h2 className="text-3xl font-bold text-rose-400">Eres el IMPOSTOR</h2>
              <p className="text-slate-300">Pista general para disimular:</p>
              <p className="text-2xl font-bold text-sky-300">{round.impostorHint}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <h2 className="text-lg font-semibold text-emerald-400">
                Ciudadano · {round.category}
              </h2>
              <p className="text-4xl font-bold text-white">{round.secretWord}</p>
            </div>
          )}

          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={handleNextInspect}
            className="tv-focusable inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400"
          >
            <EyeOff className="w-5 h-5" aria-hidden="true" />
            <span>
              {inspectIndex + 1 < players.length ? 'Ocultar y pasar' : 'Comenzar debate'}
            </span>
          </button>
        </div>
      )}

      {phase === 'DEBATE' && round && (
        <div className="rounded-2xl p-8 bg-[#161922] border border-white/8 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-sky-400">
              Categoría: {round.category}
            </span>
            <span className="font-mono text-2xl font-bold text-white tabular-nums">
              {debateSec}s
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Ronda de pistas</h2>
            <p className="text-slate-300">
              Pregunta sugerida: “{round.starterQuestion}”
            </p>
          </div>

          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={() => {
              soundFX.confirm();
              setPhase('VOTE');
            }}
            className="tv-focusable inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-200"
          >
            <Vote className="w-5 h-5" aria-hidden="true" />
            <span>Votar sospechoso</span>
          </button>
        </div>
      )}

      {phase === 'VOTE' && (
        <div className="rounded-2xl p-8 bg-[#161922] border border-white/8 space-y-5">
          <h2 className="text-2xl font-bold text-white">¿Quién es el impostor?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((p, idx) => {
              const color = getPlayerColor(p.colorId);
              return (
                <button
                  key={p.id}
                  type="button"
                  data-tv-focusable="true"
                  data-tv-autofocus={idx === 0 ? 'true' : undefined}
                  onClick={() => handleVote(idx)}
                  className="tv-focusable flex items-center gap-3.5 p-4 rounded-xl bg-[#0D0F14] border border-white/10 hover:border-white/30 text-left"
                >
                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm border ${color.bgClass} ${color.borderClass} ${color.textClass}`}
                  >
                    {p.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="text-lg font-semibold text-white">{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === 'RESULT' && round && accusedIndex !== null && (
        <div className="rounded-2xl p-8 bg-[#161922] border border-white/8 space-y-6">
          {accusedIndex === impostorIndex ? (
            <div className="space-y-2">
              <p className="text-sm font-bold text-emerald-400">¡Descubierto!</p>
              <h2 className="text-3xl font-bold text-white">
                {players[impostorIndex].name} era el Impostor
              </h2>
              <p className="text-slate-300">
                +100 pts para cada ciudadano. La palabra era “{round.secretWord}”.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-bold text-rose-400">¡Escapó!</p>
              <h2 className="text-3xl font-bold text-white">
                El Impostor era {players[impostorIndex].name}
              </h2>
              <p className="text-slate-300">
                +200 pts para {players[impostorIndex].name}. La palabra era “{round.secretWord}”.
              </p>
            </div>
          )}

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
              Cambiar temática
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
