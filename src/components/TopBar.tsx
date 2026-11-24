import {Volume2, VolumeX} from 'lucide-react';
import {AppScreen} from '../types/game';
import {soundFX} from '../utils/sound';

interface TopBarProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  muted: boolean;
  onToggleMute: () => void;
}

export function TopBar({currentScreen, onNavigate, muted, onToggleMute}: TopBarProps) {
  const navItems: Array<{id: AppScreen; label: string}> = [
    {id: 'HOME', label: 'Juegos'},
    {id: 'PLAYERS', label: 'Jugadores'},
    {id: 'LEADERBOARD', label: 'Marcador'},
    {id: 'APK_GUIDE', label: 'APK TV'},
  ];

  const handleNav = (id: AppScreen) => {
    soundFX.confirm();
    onNavigate(id);
  };

  return (
    <header className="relative z-20 flex items-center justify-between gap-8 px-6 lg:px-12 py-4 border-b border-white/8 bg-[#0D0F14]/95 backdrop-blur-md">
      <button
        type="button"
        data-tv-focusable="true"
        onClick={() => handleNav('HOME')}
        className="tv-focusable text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0 rounded-lg px-2 py-1 text-left"
      >
        CgamesTVPARTY
      </button>

      <nav aria-label="Navegación principal" className="flex items-center gap-6 lg:gap-8">
        {navItems.map((item) => {
          const isActive =
            currentScreen === item.id ||
            (item.id === 'HOME' && currentScreen.startsWith('GAME_'));
          return (
            <button
              key={item.id}
              type="button"
              data-tv-focusable="true"
              onClick={() => handleNav(item.id)}
              className={`tv-focusable text-sm lg:text-base font-medium whitespace-nowrap shrink-0 px-2.5 py-1.5 rounded-lg border-b-2 ${
                isActive
                  ? 'text-white border-sky-400'
                  : 'text-slate-400 border-transparent hover:text-slate-100 hover:border-white/25'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="shrink-0">
        <button
          type="button"
          data-tv-focusable="true"
          onClick={onToggleMute}
          className="tv-focusable inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#161922] text-slate-200 border border-white/10 hover:border-white/30 whitespace-nowrap shrink-0"
        >
          {muted ? (
            <>
              <VolumeX className="w-4 h-4 text-rose-400" aria-hidden="true" />
              <span>Silenciado</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-sky-400" aria-hidden="true" />
              <span>Sonido</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
