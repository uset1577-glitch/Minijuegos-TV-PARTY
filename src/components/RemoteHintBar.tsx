import {Player} from '../types/game';

interface RemoteHintBarProps {
  players: Player[];
  canGoBack: boolean;
}

export function RemoteHintBar({players, canGoBack}: RemoteHintBarProps) {
  return (
    <footer className="relative z-20 flex flex-wrap items-center justify-between gap-4 px-6 lg:px-12 py-3 border-t border-white/8 bg-[#0D0F14] text-xs text-slate-500">
      <div className="flex items-center gap-3">
        <span className="font-medium text-slate-300">Control único</span>
        <span aria-hidden="true">·</span>
        <span>↑ ↓ ← → Mover</span>
        <span aria-hidden="true">·</span>
        <span>OK Seleccionar</span>
        {canGoBack && (
          <>
            <span aria-hidden="true">·</span>
            <span>Esc Atrás</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 tabular-nums">
        <span>{players.length} {players.length === 1 ? 'jugador' : 'jugadores'}</span>
        <span aria-hidden="true">·</span>
        <span>16 minijuegos disponibles</span>
      </div>
    </footer>
  );
}
