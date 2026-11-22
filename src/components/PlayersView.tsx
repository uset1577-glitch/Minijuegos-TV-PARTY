import {useState} from 'react';
import {Check, Plus, RotateCcw, Trash2, UserPlus} from 'lucide-react';
import {
  PLAYER_COLORS,
  Player,
  QUICK_PLAYER_NAMES,
  getPlayerColor,
} from '../types/game';
import {soundFX} from '../utils/sound';

interface PlayersViewProps {
  players: Player[];
  onAddPlayer: () => void;
  onRemovePlayer: (id: string) => void;
  onUpdatePlayer: (id: string, patch: Partial<Player>) => void;
  onResetScores: () => void;
  onStartArcade: () => void;
}

export function PlayersView({
  players,
  onAddPlayer,
  onRemovePlayer,
  onUpdatePlayer,
  onResetScores,
  onStartArcade,
}: PlayersViewProps) {
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(
    players[0]?.id ?? null,
  );

  const selectedPlayer =
    players.find((p) => p.id === editingPlayerId) ?? players[0] ?? null;

  return (
    <section className="max-w-6xl mx-auto w-full px-6 lg:px-10 py-8 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-sky-400">
            Sala local · 1 a 6 jugadores
          </p>
          <h1 className="text-3xl font-bold text-white">Jugadores</h1>
          <p className="text-slate-400 max-w-xl text-sm">
            Configura los perfiles del sofá usando los nombres rápidos del control o el teclado.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {players.length < 6 && (
            <button
              type="button"
              data-tv-focusable="true"
              onClick={() => {
                soundFX.confirm();
                onAddPlayer();
              }}
              className="tv-focusable inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-950 font-semibold hover:bg-slate-200 whitespace-nowrap shrink-0"
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              <span>Agregar</span>
            </button>
          )}
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
            <span>Reiniciar puntos</span>
          </button>
          <button
            type="button"
            data-tv-focusable="true"
            data-tv-autofocus="true"
            onClick={() => {
              soundFX.confirm();
              onStartArcade();
            }}
            className="tv-focusable inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-400 text-slate-950 font-bold hover:bg-sky-300 whitespace-nowrap shrink-0"
          >
            <Check className="w-4 h-4" aria-hidden="true" />
            <span>Volver a juegos</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {players.map((player, index) => {
            const color = getPlayerColor(player.colorId);
            const isSelected = selectedPlayer?.id === player.id;
            return (
              <div
                key={player.id}
                className={`rounded-2xl p-4 bg-[#161922] border transition-colors ${
                  isSelected ? 'border-sky-400' : 'border-white/8'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    data-tv-focusable="true"
                    onClick={() => {
                      soundFX.confirm();
                      setEditingPlayerId(player.id);
                    }}
                    className="tv-focusable text-left flex-1 rounded-xl p-1 -m-1"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm border ${color.bgClass} ${color.borderClass} ${color.textClass}`}
                      >
                        J{index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-base font-semibold text-white truncate">
                          {player.name}
                        </div>
                        <div className="text-xs text-slate-400 tabular-nums">
                          {player.score} pts · {color.name}
                        </div>
                      </div>
                    </div>
                  </button>

                  {players.length > 1 && (
                    <button
                      type="button"
                      data-tv-focusable="true"
                      aria-label={`Eliminar a ${player.name}`}
                      onClick={() => {
                        soundFX.back();
                        onRemovePlayer(player.id);
                      }}
                      className="tv-focusable p-2 rounded-lg bg-[#0D0F14] text-slate-400 hover:text-rose-400 border border-white/10 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {players.length < 6 && (
            <button
              type="button"
              data-tv-focusable="true"
              onClick={() => {
                soundFX.confirm();
                onAddPlayer();
              }}
              className="tv-focusable rounded-2xl p-4 border border-dashed border-white/15 bg-transparent hover:border-white/35 flex items-center justify-center gap-2.5 text-slate-300 hover:text-white min-h-[82px]"
            >
              <Plus className="w-4 h-4 text-sky-400" aria-hidden="true" />
              <span className="text-sm font-medium">Añadir ({players.length}/6)</span>
            </button>
          )}
        </div>

        {selectedPlayer && (
          <div className="lg:col-span-5 rounded-2xl p-6 bg-[#161922] border border-white/8 space-y-5">
            <div>
              <p className="text-xs font-medium text-sky-400">Editando perfil</p>
              <h2 className="text-xl font-bold text-white">{selectedPlayer.name}</h2>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="player-name-input"
                className="block text-xs font-medium text-slate-400"
              >
                Nombre personalizado
              </label>
              <input
                id="player-name-input"
                type="text"
                maxLength={16}
                value={selectedPlayer.name}
                onChange={(e) =>
                  onUpdatePlayer(selectedPlayer.id, {name: e.target.value})
                }
                placeholder="Escribe un nombre"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0F14] border border-white/10 text-white text-sm focus:outline-none focus:border-sky-400"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400">
                Nombres rápidos
              </p>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_PLAYER_NAMES.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    data-tv-focusable="true"
                    onClick={() => {
                      soundFX.confirm();
                      onUpdatePlayer(selectedPlayer.id, {name: preset});
                    }}
                    className={`tv-focusable px-2.5 py-2 rounded-lg text-xs font-medium truncate border ${
                      selectedPlayer.name === preset
                        ? 'bg-sky-400 text-slate-950 border-sky-300 font-bold'
                        : 'bg-[#0D0F14] text-slate-300 border-white/8 hover:border-white/25'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400">Color</p>
              <div className="grid grid-cols-3 gap-2">
                {PLAYER_COLORS.map((c) => {
                  const active = selectedPlayer.colorId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      data-tv-focusable="true"
                      onClick={() => {
                        soundFX.confirm();
                        onUpdatePlayer(selectedPlayer.id, {colorId: c.id});
                      }}
                      className={`tv-focusable flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium border ${
                        active
                          ? 'bg-white/10 border-sky-400 text-white'
                          : 'bg-[#0D0F14] border-white/8 text-slate-300'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{backgroundColor: c.hex}}
                        aria-hidden="true"
                      />
                      <span className="truncate">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
