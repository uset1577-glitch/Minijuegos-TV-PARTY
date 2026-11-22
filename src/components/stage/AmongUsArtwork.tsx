import React from 'react';

export interface CrewColorMeta {
  id: string;
  label: string;
  body: string;
  shade: string;
}

export const AMONG_US_COLORS: CrewColorMeta[] = [
  {id: 'red', label: 'Rojo', body: '#dc2626', shade: '#991b1b'},
  {id: 'blue', label: 'Azul', body: '#2563eb', shade: '#1d4ed8'},
  {id: 'lime', label: 'Verde', body: '#16a34a', shade: '#166534'},
  {id: 'yellow', label: 'Amarillo', body: '#eab308', shade: '#a16207'},
  {id: 'cyan', label: 'Cian', body: '#06b6d4', shade: '#0e7490'},
  {id: 'purple', label: 'Morado', body: '#9333ea', shade: '#6b21a8'},
];

// Orden alineado con PLAYER_STAGE_COLORS (J1=Rojo, J2=Azul, J3=Verde, J4=Amarillo, J5=Morado, J6=Cian)
export const CREW_PLAYER_COLORS: CrewColorMeta[] = [
  AMONG_US_COLORS[0],
  AMONG_US_COLORS[1],
  AMONG_US_COLORS[2],
  AMONG_US_COLORS[3],
  AMONG_US_COLORS[5],
  AMONG_US_COLORS[4],
];

export function CrewmateSvg({
  bodyColor = '#dc2626',
  shadeColor = '#991b1b',
  state = 'alive',
  facing = 'right',
  className = 'w-16 h-16',
}: {
  bodyColor?: string;
  shadeColor?: string;
  state?: 'alive' | 'impostor' | 'ghost' | 'ejected';
  facing?: 'left' | 'right';
  className?: string;
}) {
  const isGhost = state === 'ghost';
  const isImpostor = state === 'impostor';
  const flipTransform = facing === 'left' ? 'translate(100,0) scale(-1,1)' : undefined;

  return (
    <svg
      viewBox="0 0 100 112"
      className={className}
      style={{opacity: isGhost ? 0.65 : 1}}
      aria-hidden="true"
    >
      <g transform={flipTransform}>
        {/* Mochila espacial */}
        <rect
          x="10"
          y="36"
          width="18"
          height="42"
          rx="8"
          fill={shadeColor}
          stroke="#090d14"
          strokeWidth="4.5"
        />
        {/* Cuerpo */}
        {isGhost ? (
          <path
            d="M24 44 C24 18, 76 18, 76 44 L76 92 L64 84 L50 95 L36 84 L24 92 Z"
            fill={bodyColor}
            stroke="#090d14"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M24 44 C24 16, 76 16, 76 44 L76 94 C76 101, 58 101, 58 94 L58 80 L44 80 L44 94 C44 101, 24 101, 24 94 Z"
            fill={bodyColor}
            stroke="#090d14"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
        )}
        {/* Sombra inferior */}
        <path
          d="M28 56 C38 72, 62 72, 72 56 L72 78 L28 78 Z"
          fill={shadeColor}
          opacity="0.45"
        />
        {/* Visor */}
        <rect
          x="42"
          y="28"
          width="38"
          height="24"
          rx="11"
          fill="#67e8f9"
          stroke="#090d14"
          strokeWidth="4.2"
        />
        <rect x="46" y="32" width="28" height="10" rx="5" fill="#cffafe" opacity="0.7" />
        <ellipse cx="67" cy="34" rx="5.5" ry="2.5" fill="#ffffff" />

        {/* Brillo impostor si está revelado */}
        {isImpostor && (
          <>
            <circle cx="55" cy="40" r="3.2" fill="#ef4444" />
            <circle cx="69" cy="40" r="3.2" fill="#ef4444" />
            <path d="M40 66 L48 72 L56 66 L64 72 L72 66" stroke="#ffffff" strokeWidth="2.8" fill="none" />
          </>
        )}
      </g>
    </svg>
  );
}

export function AdminCrewIconSvg({
  color = '#facc15',
  className = 'w-6 h-7',
}: {
  color?: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 64 76" className={className} aria-hidden="true">
      <rect x="6" y="24" width="12" height="26" rx="5" fill={color} stroke="#0f172a" strokeWidth="3.5" />
      <path
        d="M16 28 C16 10, 52 10, 52 28 L52 62 C52 68, 39 68, 39 62 L39 53 L29 53 L29 62 C29 68, 16 68, 16 62 Z"
        fill={color}
        stroke="#0f172a"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <rect x="28" y="18" width="24" height="15" rx="7" fill="#fef08a" stroke="#0f172a" strokeWidth="3" />
    </svg>
  );
}

export function SkeldVentSvg({
  open = false,
  className = 'w-20 h-14',
}: {
  open?: boolean;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 120 80" className={className} aria-hidden="true">
      <rect
        x="6"
        y="8"
        width="108"
        height="64"
        rx="10"
        fill={open ? '#090d16' : '#334155'}
        stroke="#94a3b8"
        strokeWidth="4"
      />
      <rect x="14" y="16" width="92" height="48" rx="6" fill={open ? '#020617' : '#1e293b'} />
      {open ? (
        <>
          <circle cx="48" cy="39" r="5" fill="#ef4444" />
          <circle cx="72" cy="39" r="5" fill="#ef4444" />
          <path d="M14 16 L104 6" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <rect x="22" y="23" width="76" height="6" rx="3" fill="#0f172a" />
          <rect x="22" y="37" width="76" height="6" rx="3" fill="#0f172a" />
          <rect x="22" y="51" width="76" height="6" rx="3" fill="#0f172a" />
        </>
      )}
      <circle cx="14" cy="15" r="2.6" fill="#cbd5e1" />
      <circle cx="106" cy="15" r="2.6" fill="#cbd5e1" />
      <circle cx="14" cy="65" r="2.6" fill="#cbd5e1" />
      <circle cx="106" cy="65" r="2.6" fill="#cbd5e1" />
    </svg>
  );
}

export function EmergencyButtonSvg({
  pressed = false,
  className = 'w-20 h-20',
}: {
  pressed?: boolean;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 120 110" className={className} aria-hidden="true">
      {/* Base metálica */}
      <rect x="14" y="58" width="92" height="38" rx="10" fill="#334155" stroke="#0f172a" strokeWidth="4" />
      <rect x="20" y="64" width="80" height="10" rx="4" fill="#facc15" />
      <path d="M26 64 L34 74 M44 64 L52 74 M62 64 L70 74 M80 64 L88 74" stroke="#111827" strokeWidth="5" />
      {/* Botón rojo */}
      <ellipse cx="60" cy={pressed ? 54 : 44} rx="32" ry="18" fill="#b91c1c" stroke="#090d14" strokeWidth="4" />
      <ellipse cx="60" cy={pressed ? 49 : 37} rx="30" ry="16" fill="#ef4444" stroke="#090d14" strokeWidth="3.5" />
      <ellipse cx="52" cy={pressed ? 45 : 33} rx="12" ry="5" fill="#fca5a5" opacity="0.7" />
    </svg>
  );
}

export function CommsWaveBadgeSvg({className = 'w-14 h-10'}: {className?: string}) {
  return (
    <svg viewBox="0 0 120 80" className={className} aria-hidden="true">
      <rect x="4" y="6" width="112" height="68" rx="10" fill="#062118" stroke="#34d399" strokeWidth="4" />
      <path
        d="M14 40 Q 28 16, 42 40 T 70 40 T 98 40 T 106 40"
        fill="none"
        stroke="#ef4444"
        strokeWidth="4"
        opacity="0.75"
      />
      <path
        d="M14 40 Q 28 18, 42 40 T 70 40 T 98 40 T 106 40"
        fill="none"
        stroke="#34d399"
        strokeWidth="3.5"
      />
    </svg>
  );
}

export function DistributorRingBadgeSvg({className = 'w-12 h-12'}: {className?: string}) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="40" fill="#0f172a" stroke="#64748b" strokeWidth="5" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="#eab308" strokeWidth="6" strokeDasharray="135 55" />
      <circle cx="50" cy="50" r="18" fill="none" stroke="#38bdf8" strokeWidth="6" strokeDasharray="78 36" />
      <rect x="78" y="44" width="18" height="12" rx="3" fill="#22c55e" />
    </svg>
  );
}

export function ShapeshifterBadgeSvg({className = 'w-7 h-7'}: {className?: string}) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <clipPath id="au-ss-left">
          <rect x="0" y="0" width="50" height="100" />
        </clipPath>
        <clipPath id="au-ss-right">
          <rect x="50" y="0" width="50" height="100" />
        </clipPath>
      </defs>
      {/* Mitad izquierda: tripulante cian */}
      <g clipPath="url(#au-ss-left)">
        <path
          d="M24 40 C24 16, 76 16, 76 40 L76 86 C76 92, 58 92, 58 86 L58 74 L42 74 L42 86 C42 92, 24 92, 24 86 Z"
          fill="#06b6d4"
          stroke="#090d14"
          strokeWidth="5"
        />
        <rect x="42" y="28" width="34" height="20" rx="9" fill="#a5f3fc" stroke="#090d14" strokeWidth="4" />
      </g>
      {/* Mitad derecha: shapeshifter magenta/rojo */}
      <g clipPath="url(#au-ss-right)">
        <path
          d="M24 40 C24 16, 76 16, 76 40 L76 86 C76 92, 58 92, 58 86 L58 74 L42 74 L42 86 C42 92, 24 92, 24 86 Z"
          fill="#db2777"
          stroke="#090d14"
          strokeWidth="5"
        />
        <rect x="42" y="28" width="34" height="20" rx="9" fill="#fda4af" stroke="#090d14" strokeWidth="4" />
        <circle cx="64" cy="38" r="4" fill="#dc2626" />
      </g>
      {/* Línea central de mutación */}
      <path d="M50 10 L46 34 L54 50 L46 70 L50 94" stroke="#facc15" strokeWidth="4" fill="none" />
    </svg>
  );
}

const EJECT_STARS = Array.from({length: 76}, (_, i) => {
  const x = (i * 47 + 13) % 120;
  const y = (i * 73 + 9) % 100;
  const size = i % 7 === 0 ? 3.2 : i % 3 === 0 ? 2.1 : 1.3;
  const opacity = i % 5 === 0 ? 0.95 : i % 2 === 0 ? 0.65 : 0.4;
  return {id: i, x, y, size, opacity};
});

export function EjectSpaceBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden bg-black">
      <div className="au-eject-stars absolute inset-y-0 left-0 w-[130vw]">
        {EJECT_STARS.map((s) => (
          <span
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.x}vw`,
              top: `${s.y}vh`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              opacity: s.opacity,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export interface VictoryStandingRow {
  idx: number;
  name: string;
  pts: number;
}

interface VictorySlot {
  row: VictoryStandingRow;
  rank: number;
  isTop: boolean;
  facing: 'left' | 'right';
  sizeClass: string;
  delayMs: number;
}

function buildVictoryLineup(standings: VictoryStandingRow[]): VictorySlot[] {
  const topPts = standings[0]?.pts ?? 0;
  const left: VictorySlot[] = [];
  const right: VictorySlot[] = [];
  let center: VictorySlot | null = null;

  standings.forEach((row, rank) => {
    const isTop = row.pts === topPts;
    const sizeClass =
      rank === 0
        ? 'w-[15vh] h-[17vh] max-w-[19vw] max-h-[19vw]'
        : rank <= 2
          ? 'w-[12.2vh] h-[13.8vh] max-w-[15vw] max-h-[15vw]'
          : 'w-[10.4vh] h-[11.8vh] max-w-[13vw] max-h-[13vw]';

    if (rank === 0) {
      center = {
        row,
        rank,
        isTop,
        facing: 'right',
        sizeClass,
        delayMs: 80,
      };
    } else if (rank % 2 === 1) {
      left.unshift({
        row,
        rank,
        isTop,
        facing: 'right',
        sizeClass,
        delayMs: 120 + rank * 55,
      });
    } else {
      right.push({
        row,
        rank,
        isTop,
        facing: 'left',
        sizeClass,
        delayMs: 120 + rank * 55,
      });
    }
  });

  return center ? [...left, center, ...right] : [];
}

export function AmongUsVictoryScreen({
  goal,
  winnerNames,
  standings,
  lockRemainingSec = 0,
  onStartNewTournament,
}: {
  goal: number;
  winnerNames: string[];
  standings: VictoryStandingRow[];
  lockRemainingSec?: number;
  onStartNewTournament: () => void;
}) {
  const locked = lockRemainingSec > 0;
  const slots = buildVictoryLineup(standings);
  const subtitleText =
    winnerNames.length > 1
      ? `EMPATE CAMPEÓN: ${winnerNames.join(' Y ').toUpperCase()}`
      : `CAMPEÓN: ${(winnerNames[0] ?? 'TRIPULANTE').toUpperCase()}`;

  return (
    <div
      className={`fixed inset-0 z-30 flex flex-col items-center justify-between overflow-hidden bg-black px-[3vw] py-[4vh] text-center select-none ${
        locked ? 'cursor-default' : 'cursor-pointer'
      }`}
      onClick={() => {
        if (!locked) onStartNewTournament();
      }}
    >
      <EjectSpaceBackdrop />

      {/* Resplandor azul eléctrico característico de la pantalla Victory */}
      <div
        className="pointer-events-none absolute inset-x-0 top-[26vh] h-[52vh]"
        style={{
          background:
            'radial-gradient(ellipse 68% 48% at 50% 52%, rgba(37, 99, 235, 0.72), rgba(14, 165, 233, 0.34) 46%, rgba(0, 0, 0, 0) 78%)',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-[8vw] top-[52vh] h-[0.35vh]"
        style={{
          background:
            'linear-gradient(90deg, rgba(56,189,248,0) 0%, rgba(56,189,248,0.8) 50%, rgba(56,189,248,0) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Encabezado principal estilo VICTORIA */}
      <div className="au-victory-title relative z-10 flex flex-col items-center pt-[1vh]">
        <div
          className="font-black uppercase tracking-[0.06em] leading-none"
          style={{
            fontSize: 'clamp(44px, 11.5vh, 128px)',
            color: '#38bdf8',
            textShadow:
              '0 0.55vh 0 #075985, 0 0 2.6vh rgba(56, 189, 248, 0.75), 0 0.9vh 2.4vh rgba(0,0,0,0.9)',
            WebkitTextStroke: '0.25vh #082f49',
          }}
        >
          ¡VICTORIA!
        </div>
        <div
          className="mt-[1.4vh] font-black tracking-[0.05em] text-white"
          style={{
            fontSize: 'clamp(18px, 3.8vh, 42px)',
            textShadow: '0 0.3vh 1vh rgba(0, 0, 0, 0.9)',
          }}
        >
          {subtitleText}
        </div>
        <div className="mt-[0.6vh] font-semibold text-sky-200/85 text-[2.2vh] tabular-nums">
          Meta de {goal} puntos alcanzada
        </div>
      </div>

      {/* Tripulantes que jugaron + nombre y puntaje debajo */}
      <div className="relative z-10 flex w-full max-w-[94vw] items-end justify-center gap-[2vw] pb-[1vh]">
        {slots.map((slot) => {
          const palette = CREW_PLAYER_COLORS[slot.row.idx % CREW_PLAYER_COLORS.length];
          return (
            <div
              key={`au-vic-${slot.row.idx}`}
              className="au-victory-crew flex flex-col items-center"
              style={{animationDelay: `${slot.delayMs}ms`}}
            >
              {slot.isTop ? (
                <div
                  className="mb-[0.6vh] text-[3.4vh] leading-none"
                  style={{filter: 'drop-shadow(0 0 0.8vh rgba(250, 204, 21, 0.8))'}}
                >
                  👑
                </div>
              ) : (
                <div className="mb-[0.6vh] text-[2vh] font-bold text-slate-300/80 tabular-nums">
                  {slot.rank + 1}.º
                </div>
              )}

              <CrewmateSvg
                bodyColor={palette.body}
                shadeColor={palette.shade}
                facing={slot.facing}
                className={slot.sizeClass}
              />

              <div
                className="mt-[1.1vh] font-black leading-tight"
                style={{
                  fontSize: slot.isTop ? '3.3vh' : '2.7vh',
                  color: slot.isTop ? '#fde047' : '#ffffff',
                  textShadow: '0 0.25vh 0.8vh rgba(0,0,0,0.95)',
                }}
              >
                {slot.row.name}
              </div>

              <div
                className="mt-[0.25vh] font-extrabold tabular-nums leading-tight"
                style={{
                  fontSize: slot.isTop ? '3.1vh' : '2.4vh',
                  color: slot.isTop ? '#fef08a' : '#7dd3fc',
                  textShadow: '0 0.2vh 0.7vh rgba(0,0,0,0.95)',
                }}
              >
                {slot.row.pts} pts
              </div>
            </div>
          );
        })}
      </div>

      {/* Pie de navegación consistente con el resto de pantallas */}
      <div className="relative z-10 text-sky-100/75 font-semibold text-[2.1vh] tabular-nums">
        {locked
          ? `Espera ${lockRemainingSec} s…`
          : 'OK: nuevo torneo (reiniciar puntos) · ▲: seguir jugando sin borrar puntos'}
      </div>
    </div>
  );
}

