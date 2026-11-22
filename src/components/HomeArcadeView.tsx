import {useState} from 'react';
import {
  BookOpen,
  Calculator,
  CheckSquare,
  Disc3,
  EyeOff,
  Film,
  Grid2x2,
  Hand,
  HelpCircle,
  KeyRound,
  Layers,
  Lightbulb,
  Play,
  Scale,
  Timer,
  UserX,
  Users,
  Zap,
} from 'lucide-react';
import {
  AppScreen,
  GameCategory,
  MINIGAMES,
  MinigameCardInfo,
  Player,
  getPlayerColor,
} from '../types/game';
import {soundFX} from '../utils/sound';

interface HomeArcadeViewProps {
  players: Player[];
  onSelectScreen: (screen: AppScreen) => void;
  onQuickSetPlayerCount: (count: number) => void;
}

const CATEGORIES: GameCategory[] = ['Todos', 'Con IA', 'Grupo', 'Reflejos', 'Mente'];

const ICON_MAP: Record<MinigameCardInfo['iconName'], typeof Disc3> = {
  Disc3,
  HelpCircle,
  UserX,
  Timer,
  Scale,
  Film,
  Lightbulb,
  CheckSquare,
  BookOpen,
  Zap,
  EyeOff,
  Calculator,
  Hand,
  Grid2x2,
  KeyRound,
  Layers,
};

export function HomeArcadeView({
  players,
  onSelectScreen,
  onQuickSetPlayerCount,
}: HomeArcadeViewProps) {
  const [filter, setFilter] = useState<GameCategory>('Todos');

  const visibleGames =
    filter === 'Todos'
      ? MINIGAMES
      : MINIGAMES.filter((g) => g.category === filter);

  return (
    <div className="max-w-7xl mx-auto w-full px-6 lg:px-10 py-8 space-y-8">
      {/* Clean Minimalist Hero */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-white/8">
        <div className="space-y-2.5 max-w-2xl">
          <p className="text-sm font-medium text-sky-400">
            1 a 6 jugadores · Un solo control remoto · Google TV
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            16 minijuegos minimalistas para el sofá
          </h1>
          <p className="text-base text-slate-400 leading-relaxed">
            Juegos con inteligencia artificial para que nunca se repitan, junto con duelos rápidos de reflejos, lógica y memoria.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={() => {
              soundFX.confirm();
              onSelectScreen('GAME_WHEEL');
            }}
            className="tv-focusable inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-white text-slate-950 font-bold text-base hover:bg-slate-200 whitespace-nowrap shrink-0"
          >
            <Play className="w-4 h-4 fill-current" aria-hidden="true" />
            <span>Ruleta de Retos IA</span>
          </button>

          <button
            type="button"
            data-tv-focusable="true"
            onClick={() => {
              soundFX.confirm();
              onSelectScreen('PLAYERS');
            }}
            className="tv-focusable inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#161922] text-slate-100 border border-white/10 font-semibold text-base hover:border-white/30 whitespace-nowrap shrink-0"
          >
            <Users className="w-4 h-4 text-sky-400" aria-hidden="true" />
            <span>Jugadores ({players.length})</span>
          </button>
        </div>
      </div>

      {/* Quick Player Strip + Category Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const count =
              cat === 'Todos'
                ? MINIGAMES.length
                : MINIGAMES.filter((g) => g.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                data-tv-focusable="true"
                onClick={() => {
                  soundFX.confirm();
                  setFilter(cat);
                }}
                className={`tv-focusable px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap border ${
                  filter === cat
                    ? 'bg-sky-400 text-slate-950 border-sky-300 font-bold'
                    : 'bg-[#161922] text-slate-300 border-white/8 hover:text-white'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400 mr-1">
            Sala:
          </span>
          {[1, 2, 3, 4, 5, 6].map((count) => (
            <button
              key={count}
              type="button"
              data-tv-focusable="true"
              onClick={() => {
                soundFX.confirm();
                onQuickSetPlayerCount(count);
              }}
              className={`tv-focusable w-9 h-9 rounded-lg font-mono font-bold text-sm border ${
                players.length === count
                  ? 'bg-white text-slate-950 border-white'
                  : 'bg-[#161922] text-slate-300 border-white/8 hover:border-white/25'
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Active Players Quiet Summary */}
      <div className="flex flex-wrap items-center gap-5 text-xs text-slate-400">
        {players.map((p) => {
          const c = getPlayerColor(p.colorId);
          return (
            <div key={p.id} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-sm shrink-0"
                style={{backgroundColor: c.hex}}
                aria-hidden="true"
              />
              <span className="font-medium text-slate-200">{p.name}</span>
              <span className="font-mono tabular-nums">{p.score}</span>
            </div>
          );
        })}
      </div>

      {/* 16 Minimalist Game Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleGames.map((game) => {
          const Icon = ICON_MAP[game.iconName];
          return (
            <button
              key={game.id}
              type="button"
              data-tv-focusable="true"
              onClick={() => {
                soundFX.confirm();
                onSelectScreen(game.id);
              }}
              className="tv-focusable group rounded-2xl p-5 bg-[#161922] border border-white/8 hover:border-white/25 text-left flex flex-col justify-between gap-4 min-h-[168px]"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#0D0F14] border border-white/8 flex items-center justify-center text-sky-400 group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-white">
                    {game.title}
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {game.subtitle}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/6 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  {game.playersRange} · {game.usesAi ? 'Generado con IA' : game.category}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
