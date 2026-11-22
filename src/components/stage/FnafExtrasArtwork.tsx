interface PhoneSvgProps {
  className?: string;
}

export function FnafPhoneSvg({className = 'w-7 h-7'}: PhoneSvgProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      {/* Cuerpo del teléfono retro */}
      <path
        d="M14 34 L20 22 H44 L50 34 V50 C50 52.2 48.2 54 46 54 H18 C15.8 54 14 52.2 14 50 V34 Z"
        fill="#991b1b"
        stroke="#fde68a"
        strokeWidth="2.5"
      />
      <rect x="21" y="34" width="22" height="14" rx="7" fill="#1e1b24" stroke="#fca5a5" strokeWidth="1.8" />
      <circle cx="32" cy="41" r="3" fill="#fbbf24" />
      {/* Soportes del auricular */}
      <rect x="21" y="18" width="5" height="6" rx="1.5" fill="#d97706" />
      <rect x="38" y="18" width="5" height="6" rx="1.5" fill="#d97706" />
      {/* Auricular clásico */}
      <path
        d="M9 17 C9 10.5 20 8 32 8 C44 8 55 10.5 55 17 C55 20.5 52 22 48 22 C45 22 43 20 42 17.5 C39 16 25 16 22 17.5 C21 20 19 22 16 22 C12 22 9 20.5 9 17 Z"
        fill="#dc2626"
        stroke="#fef08a"
        strokeWidth="2.4"
      />
      {/* Ondas de timbre */}
      <path d="M5 12 C3 15 3 19 5 22" stroke="#fde047" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M59 12 C61 15 61 19 59 22" stroke="#fde047" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

interface BalloonBoySvgProps {
  mood: 'normal' | 'hit' | 'jumpscare';
  className?: string;
}

export function BalloonBoySvg({mood, className = 'w-full h-full'}: BalloonBoySvgProps) {
  const isJumpscare = mood === 'jumpscare';
  const isHit = mood === 'hit';

  return (
    <svg viewBox="0 0 220 240" fill="none" className={className} role="img" aria-label="Balloon Boy">
      {/* Fondo ambiental */}
      <defs>
        <radialGradient id="bbGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={isJumpscare ? '#dc2626' : isHit ? '#f59e0b' : '#1d4ed8'} stopOpacity="0.4" />
          <stop offset="100%" stopColor="#05070a" stopOpacity="0.95" />
        </radialGradient>
      </defs>
      <rect width="220" height="240" rx="18" fill="url(#bbGlow)" />

      {/* Hélice de la gorra */}
      <line x1="110" y1="16" x2="110" y2="27" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="96" cy="15" rx="14" ry="4" fill="#ef4444" stroke="#111827" strokeWidth="2" />
      <ellipse cx="124" cy="15" rx="14" ry="4" fill="#3b82f6" stroke="#111827" strokeWidth="2" />
      <circle cx="110" cy="15" r="4" fill="#facc15" />

      {/* Gorra roja y azul */}
      <path d="M68 62 C68 35 152 35 152 62 Z" fill="#dc2626" stroke="#111827" strokeWidth="3" />
      <path d="M90 38 C104 34 116 34 130 38 L125 62 H95 Z" fill="#2563eb" stroke="#111827" strokeWidth="2.5" />
      {/* Visera azul */}
      <path d="M62 62 Q110 52 158 62 Q110 72 62 62 Z" fill="#1d4ed8" stroke="#111827" strokeWidth="3" />

      {/* Cabeza */}
      <ellipse
        cx="110"
        cy="98"
        rx={isJumpscare ? 48 : 42}
        ry={isJumpscare ? 44 : 40}
        fill="#f6cbb1"
        stroke="#1f2937"
        strokeWidth="3.5"
      />

      {/* Ojos */}
      {isHit ? (
        <>
          <path d="M84 85 L98 93 L84 101" stroke="#111827" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M136 85 L122 93 L136 101" stroke="#111827" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : isJumpscare ? (
        <>
          <circle cx="91" cy="91" r="11" fill="#09090b" />
          <circle cx="129" cy="91" r="11" fill="#09090b" />
          <circle cx="91" cy="91" r="3" fill="#ffffff" />
          <circle cx="129" cy="91" r="3" fill="#ffffff" />
        </>
      ) : (
        <>
          <ellipse cx="92" cy="91" rx="9" ry="10" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />
          <ellipse cx="128" cy="91" rx="9" ry="10" fill="#ffffff" stroke="#111827" strokeWidth="2.5" />
          <circle cx="93" cy="92" r="5" fill="#2563eb" />
          <circle cx="127" cy="92" r="5" fill="#2563eb" />
          <circle cx="93" cy="92" r="2.2" fill="#09090b" />
          <circle cx="127" cy="92" r="2.2" fill="#09090b" />
          <circle cx="95" cy="90" r="1.4" fill="#ffffff" />
          <circle cx="129" cy="90" r="1.4" fill="#ffffff" />
        </>
      )}

      {/* Mejillas rojas y nariz */}
      <circle cx="77" cy="105" r="7.5" fill="#ef4444" opacity="0.88" />
      <circle cx="143" cy="105" r="7.5" fill="#ef4444" opacity="0.88" />
      <polygon points="110,94 103,107 117,107" fill="#e11d48" stroke="#111827" strokeWidth="2" />

      {/* Boca */}
      {isJumpscare ? (
        <path
          d="M83 116 Q110 107 137 116 Q134 139 110 139 Q86 139 83 116 Z"
          fill="#18060a"
          stroke="#111827"
          strokeWidth="3"
        />
      ) : (
        <path
          d="M89 116 Q110 132 131 116 Q128 128 110 129 Q92 128 89 116 Z"
          fill="#271216"
          stroke="#111827"
          strokeWidth="2.5"
        />
      )}

      {/* Torso rayado rojo y azul */}
      <path
        d="M72 140 C72 135 148 135 148 140 L154 206 C154 214 66 214 66 206 Z"
        fill="#dc2626"
        stroke="#111827"
        strokeWidth="3.5"
      />
      <path d="M88 139 H132 L137 209 H83 Z" fill="#2563eb" stroke="#111827" strokeWidth="2.5" />
      {/* 2 botones negros */}
      <circle cx="110" cy="162" r="5" fill="#111827" />
      <circle cx="110" cy="184" r="5" fill="#111827" />

      {/* Brazo izquierdo + Globo */}
      <path d="M72 145 L44 166" stroke="#dc2626" strokeWidth="14" strokeLinecap="round" />
      <circle cx="42" cy="168" r="8" fill="#f6cbb1" stroke="#111827" strokeWidth="2.5" />
      <line x1="40" y1="162" x2="32" y2="112" stroke="#e5e7eb" strokeWidth="2" />
      <ellipse cx="30" cy="86" rx="21" ry="26" fill="#dc2626" stroke="#111827" strokeWidth="3" />
      <path d="M18 67 Q30 62 42 67 Q46 86 42 105 Q30 110 18 105 Z" fill="#facc15" opacity="0.45" />
      <ellipse cx="22" cy="76" rx="4" ry="7" fill="#ffffff" opacity="0.55" />

      {/* Brazo derecho + Cartel */}
      <path d="M148 145 L176 164" stroke="#2563eb" strokeWidth="14" strokeLinecap="round" />
      <circle cx="178" cy="166" r="8" fill="#f6cbb1" stroke="#111827" strokeWidth="2.5" />
      <rect x="164" y="114" width="44" height="30" rx="4" fill="#d97706" stroke="#111827" strokeWidth="2.8" />
      <rect x="169" y="119" width="34" height="20" rx="2" fill="#fde68a" />
      <line x1="175" y1="126" x2="197" y2="126" stroke="#78350f" strokeWidth="2.6" strokeLinecap="round" />
      <line x1="178" y1="133" x2="194" y2="133" stroke="#78350f" strokeWidth="2.6" strokeLinecap="round" />
      <line x1="186" y1="144" x2="186" y2="162" stroke="#92400e" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

export type FnafCamId = 'CAM 1A' | 'CAM 1B' | 'CAM 2' | 'CAM 4';
export type FnafCamActor = 'freddy' | 'bonnie' | 'chica' | 'foxy';

interface CamSceneSvgProps {
  camId: FnafCamId;
  actor: FnafCamActor | null;
  threatPct: number;
  flashed: boolean;
}

export function FnafCamSceneSvg({camId, actor, threatPct, flashed}: CamSceneSvgProps) {
  const isDanger = threatPct >= 66;
  const scale = actor ? (threatPct >= 66 ? 1.24 : threatPct >= 33 ? 1.04 : 0.86) : 1;
  const bgTint = flashed ? '#312e81' : isDanger && actor ? '#2b0b0e' : '#090b10';

  return (
    <svg viewBox="0 0 420 210" fill="none" className="h-full w-full" role="img" aria-label={camId}>
      <rect width="420" height="210" fill={bgTint} />

      {/* Arquitectura según cámara */}
      {camId === 'CAM 1A' && (
        <>
          <path d="M0 0 H110 L90 165 H0 Z" fill="#3b0764" opacity="0.55" />
          <path d="M420 0 H310 L330 165 H420 Z" fill="#3b0764" opacity="0.55" />
          <rect x="35" y="160" width="350" height="50" fill="#1f1b24" stroke="#334155" strokeWidth="2" />
          <circle cx="210" cy="44" r="22" fill="#fde047" opacity={flashed ? 0.45 : 0.14} />
        </>
      )}

      {camId === 'CAM 1B' && (
        <>
          <rect x="0" y="145" width="420" height="65" fill="#111827" />
          <rect x="45" y="122" width="130" height="14" rx="3" fill="#334155" />
          <rect x="245" y="122" width="130" height="14" rx="3" fill="#334155" />
          <path d="M55 122 L75 104 H145 L165 122 Z" fill="#e2e8f0" opacity="0.16" />
          <path d="M255 122 L275 104 H345 L365 122 Z" fill="#e2e8f0" opacity="0.16" />
        </>
      )}

      {camId === 'CAM 2' && (
        <>
          <polygon points="0,0 135,45 135,165 0,210" fill="#1e293b" opacity="0.72" />
          <polygon points="420,0 285,45 285,165 420,210" fill="#0f172a" opacity="0.88" />
          <rect x="135" y="45" width="150" height="120" fill="#05070a" stroke="#334155" strokeWidth="2" />
          <line x1="0" y1="185" x2="420" y2="185" stroke="#475569" strokeWidth="2" strokeDasharray="16 14" />
        </>
      )}

      {camId === 'CAM 4' && (
        <>
          <polygon points="0,0 120,40 120,165 0,210" fill="#0f172a" opacity="0.88" />
          <polygon points="420,0 300,40 300,165 420,210" fill="#1e293b" opacity="0.75" />
          <rect x="320" y="60" width="38" height="52" rx="3" fill="#78350f" opacity="0.65" />
          <rect x="120" y="40" width="180" height="125" fill="#05070a" stroke="#334155" strokeWidth="2" />
        </>
      )}

      {/* Silueta de animatrónico si está en esta cámara */}
      {actor && (
        <g transform={`translate(210, 128) scale(${scale}) translate(-210, -128)`}>
          {actor === 'freddy' && (
            <g>
              <rect x="195" y="26" width="30" height="22" rx="2" fill="#09090b" stroke="#78350f" strokeWidth="2" />
              <rect x="186" y="46" width="48" height="7" rx="3" fill="#09090b" stroke="#78350f" strokeWidth="1.5" />
              <circle cx="176" cy="64" r="10" fill={flashed ? '#92400e' : '#27170d'} />
              <circle cx="244" cy="64" r="10" fill={flashed ? '#92400e' : '#27170d'} />
              <ellipse cx="210" cy="88" rx="36" ry="33" fill={flashed ? '#78350f' : '#1f120b'} stroke="#451a03" strokeWidth="2.5" />
              <path d="M168 124 C168 112 252 112 252 124 L262 195 H158 Z" fill={flashed ? '#713f12' : '#1a100a'} />
              <polygon points="210,126 196,118 196,134" fill="#09090b" />
              <polygon points="210,126 224,118 224,134" fill="#09090b" />
              <circle cx="195" cy="82" r="6" fill="#020617" />
              <circle cx="225" cy="82" r="6" fill="#020617" />
              <circle cx="195" cy="82" r="2.3" fill={isDanger ? '#ef4444' : '#ffffff'} />
              <circle cx="225" cy="82" r="2.3" fill={isDanger ? '#ef4444' : '#ffffff'} />
            </g>
          )}

          {actor === 'bonnie' && (
            <g>
              <ellipse cx="190" cy="36" rx="9" ry="26" fill={flashed ? '#4338ca' : '#1e1b4b'} />
              <ellipse cx="230" cy="36" rx="9" ry="26" fill={flashed ? '#4338ca' : '#1e1b4b'} />
              <ellipse cx="210" cy="88" rx="34" ry="33" fill={flashed ? '#3730a3' : '#17153b'} stroke="#312e81" strokeWidth="2.5" />
              <path d="M168 125 C168 113 252 113 252 125 L260 195 H160 Z" fill={flashed ? '#312e81' : '#13112e'} />
              <polygon points="210,127 195,119 195,135" fill="#dc2626" />
              <polygon points="210,127 225,119 225,135" fill="#dc2626" />
              <circle cx="196" cy="82" r="6" fill="#020617" />
              <circle cx="224" cy="82" r="6" fill="#020617" />
              <circle cx="196" cy="82" r="2.4" fill={isDanger ? '#ef4444' : '#e0e7ff'} />
              <circle cx="224" cy="82" r="2.4" fill={isDanger ? '#ef4444' : '#e0e7ff'} />
            </g>
          )}

          {actor === 'chica' && (
            <g>
              <polygon points="210,44 202,58 218,58" fill={flashed ? '#eab308' : '#713f12'} />
              <ellipse cx="210" cy="88" rx="34" ry="32" fill={flashed ? '#ca8a04' : '#422006'} stroke="#854d0e" strokeWidth="2.5" />
              <polygon points="210,92 197,104 223,104" fill="#ea580c" />
              <path d="M168 124 C168 112 252 112 252 124 L260 195 H160 Z" fill={flashed ? '#a16207' : '#361b05'} />
              <path d="M182 122 H238 L230 156 Q210 165 190 156 Z" fill="#f8fafc" opacity={flashed ? 0.9 : 0.45} />
              <circle cx="196" cy="80" r="6.5" fill="#020617" />
              <circle cx="224" cy="80" r="6.5" fill="#020617" />
              <circle cx="196" cy="80" r="2.5" fill={isDanger ? '#ef4444' : '#fef08a'} />
              <circle cx="224" cy="80" r="2.5" fill={isDanger ? '#ef4444' : '#fef08a'} />
            </g>
          )}

          {actor === 'foxy' && (
            <g>
              <polygon points="175,70 166,35 196,56" fill={flashed ? '#b91c1c' : '#450a0a'} />
              <polygon points="245,70 254,35 224,56" fill={flashed ? '#b91c1c' : '#450a0a'} />
              <ellipse cx="210" cy="88" rx="35" ry="31" fill={flashed ? '#991b1b' : '#3b0a0a'} stroke="#7f1d1d" strokeWidth="2.5" />
              <polygon points="210,94 190,108 230,108" fill={flashed ? '#b91c1c' : '#5c1212'} />
              <circle cx="210" cy="95" r="4" fill="#09090b" />
              <path d="M168 125 C168 113 252 113 252 125 L260 195 H160 Z" fill={flashed ? '#7f1d1d' : '#2a0707'} />
              {/* Parche en ojo derecho */}
              <line x1="210" y1="68" x2="244" y2="92" stroke="#09090b" strokeWidth="3.5" />
              <circle cx="226" cy="80" r="8" fill="#09090b" />
              {/* Ojo izquierdo brillante */}
              <circle cx="194" cy="80" r="6.5" fill="#020617" />
              <circle cx="194" cy="80" r="2.6" fill={isDanger ? '#ef4444' : '#facc15'} />
              {/* Garfio metálico */}
              <path d="M150 154 C136 148 136 126 153 122 C160 120 163 126 158 132" stroke="#cbd5e1" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            </g>
          )}
        </g>
      )}

      {/* Líneas de cámara CRT */}
      <g opacity="0.14">
        <line x1="0" y1="35" x2="420" y2="35" stroke="#ffffff" strokeWidth="1" />
        <line x1="0" y1="75" x2="420" y2="75" stroke="#ffffff" strokeWidth="1" />
        <line x1="0" y1="115" x2="420" y2="115" stroke="#ffffff" strokeWidth="1" />
        <line x1="0" y1="155" x2="420" y2="155" stroke="#ffffff" strokeWidth="1" />
      </g>

      {/* Marco esquina cámara */}
      <path d="M14 28 V14 H34" stroke="#cbd5e1" strokeWidth="2" opacity="0.65" />
      <path d="M406 28 V14 H386" stroke="#cbd5e1" strokeWidth="2" opacity="0.65" />
      <path d="M14 182 V196 H34" stroke="#cbd5e1" strokeWidth="2" opacity="0.65" />
      <path d="M406 182 V196 H386" stroke="#cbd5e1" strokeWidth="2" opacity="0.65" />
    </svg>
  );
}

