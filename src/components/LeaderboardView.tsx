import {RotateCcw, Trophy} from 'lucide-react';
import {Player, getPlayerColor} from '../types/game';
import {soundFX} from '../utils/sound';

interface LeaderboardViewProps {
  players: Player[];
  onResetScores: () => void;
  onGoArcade: () => void;
}

export function LeaderboardView({
  players,
  onResetScores,
  onGoArcade,
}: LeaderboardViewProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const topScore = sorted[0]?.score ?? 0;

  return (
    <section className="max-w-4xl mx-auto w-full px-6 lg:px-10 py-8 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-sky-400">Sesión actual</p>
          <h1 className="text-3xl font-bold text-white">Marcador general</h1>
          <p className="text-sm text-slate-400">
            Puntos acumulados entre los 16 minijuegos de la sala.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            data-tv-focusable="true"
            onClick={() => {
              soundFX.confirm();
              onResetScores();
            }}
            className="tv-focusable inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#161922] text-slate-200 border border-white/10 font-medium whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Poner a cero</span>
          </button>
          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={() => {
              soundFX.confirm();
              onGoArcade();
            }}
            className="tv-focusable inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-400 text-slate-950 font-bold hover:bg-sky-300 whitespace-nowrap shrink-0"
          >
            <span>Seguir jugando</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-[#161922] border border-white/8 divide-y divide-white/8 overflow-hidden">
        {sorted.map((player, idx) => {
          const color = getPlayerColor(player.colorId);
          const isLeader = idx === 0 && topScore > 0;
          return (
            <div
              key={player.id}
              className={`flex items-center justify-between gap-6 px-6 py-4 ${
                isLeader ? 'bg-sky-400/8' : ''
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="font-mono text-xl font-bold text-slate-500 w-6 tabular-nums">
                  {idx + 1}
                </span>
                <span
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm border ${color.bgClass} ${color.borderClass} ${color.textClass} shrink-0`}
                >
                  {player.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg font-semibold text-white truncate">
                      {player.name}
                    </span>
                    {isLeader && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-300">
                        <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Líder</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{color.name}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono text-2xl font-bold text-white tabular-nums">
                  {player.score}
                </span>
                <span className="ml-1.5 text-xs text-slate-400">pts</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
