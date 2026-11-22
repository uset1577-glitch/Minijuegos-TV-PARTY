import {CSSProperties, useCallback, useEffect, useRef, useState} from 'react';
import amongusPanelImg from './assets/images/amongus_deck_panel_1795362189235.jpg';
import amongusBgImg from './assets/images/amongus_space_bg_1795362188021.jpg';
import amongusTileImg from './assets/images/amongus_cafeteria_tile_1795362188904.jpg';
import fnafPanelImg from './assets/images/fnaf_metal_panel_1795311383152.jpg';
import fnafBgImg from './assets/images/fnaf_pizzeria_bg_1795311383114.jpg';
import puppetCardImg from './assets/images/fnaf_puppet_box_peeking_1795317909553.jpg';
import fnafTileImg from './assets/images/fnaf_tile_texture_1795311382664.jpg';
import {
  AdminCrewIconSvg,
  AmongUsVictoryScreen,
  CommsWaveBadgeSvg,
  CrewmateSvg,
  DistributorRingBadgeSvg,
  EmergencyButtonSvg,
  ShapeshifterBadgeSvg,
} from './components/stage/AmongUsArtwork';
import {ConfettiBurst} from './components/stage/ConfettiBurst';
import {
  DilemaIaStage,
  EmojiIaStage,
  HistoriaIaStage,
  ImpostorIaStage,
  MasProbableIaStage,
  PistasIaStage,
  RuletaIaStage,
  TriviaIaStage,
  VerdadMitoIaStage,
  YoNuncaIaStage,
} from './components/stage/StageGamesAi';
import {
  AuAdminStage,
  AuCommsStage,
  AuDistribuidorStage,
  AuExpulsionStage,
  AuFalsaStage,
  AuLucesStage,
  AuShapeshifterStage,
} from './components/stage/StageGamesAmongUs';
import {
  BombaStage,
  ColoresStage,
  FlechasStage,
  MachacaStage,
  MemoriaStage,
  PunteriaStage,
  ReflejosStage,
  RelojCiegoStage,
  SemaforoStage,
  SimonStage,
} from './components/stage/StageGamesArcade';
import {
  FnafBalloonBoyStage,
  FnafCamarasStage,
  FnafClosetStage,
  FnafOficinaStage,
  FnafPirateCoveStage,
  FnafPuppetStage,
  FnafSalvageStage,
  FnafSpringtrapStage,
} from './components/stage/StageGamesExtra';
import {FnafCamSceneSvg, FnafPhoneSvg} from './components/stage/FnafExtrasArtwork';
import {
  PLAYER_STAGE_COLORS,
  RemoteKey,
  StagePlayer,
  ThemeMode,
  playControlClick,
  preloadControlClick,
  tone,
} from './utils/stageAudio';
import {
  MusicTrackId,
  bindGlobalMusicUnlock,
  isMusicEnabled,
  setMusicDucked,
  setMusicEnabled,
  setMusicTrack,
} from './utils/stageMusic';
import {
  ACHIEVEMENTS_LIST,
  AchievementDef,
  AchievementsStore,
  loadAchievements,
  recordMatchAchievement,
  recordSinglePointAchievement,
  recordTournamentWinAchievement,
} from './utils/achievements';
import {
  TvInstalledVersion,
  TvRemoteRelease,
  checkForTvUpdate,
  downloadAndInstallTvUpdate,
  getInstalledTvVersion,
  installDownloadedTvUpdate,
  openTvInstallPermissionSettings,
} from './utils/tvUpdater';

type MenuGameId =
  | 'bomba'
  | 'reflejos'
  | 'simon'
  | 'machaca'
  | 'punteria'
  | 'reloj'
  | 'memoria'
  | 'semaforo'
  | 'colores'
  | 'flechas'
  | 'ruleta'
  | 'trivia'
  | 'impostor'
  | 'dilema'
  | 'emoji'
  | 'pistas'
  | 'verdad'
  | 'historia'
  | 'probable'
  | 'yonunca'
  | 'fnaf_oficina'
  | 'fnaf_pirate'
  | 'fnaf_puppet'
  | 'fnaf_springtrap'
  | 'fnaf_closet'
  | 'fnaf_salvage'
  | 'fnaf_camaras'
  | 'fnaf_balloon_boy'
  | 'au_admin'
  | 'au_falsa'
  | 'au_luces'
  | 'au_distribuidor'
  | 'au_expulsion'
  | 'au_comms'
  | 'au_shapeshifter';

interface MenuItem {
  id: MenuGameId | 'players' | 'tournament' | 'reset';
  name: string;
  emoji: string;
  desc: string;
  fnafExclusive?: boolean;
  amongusExclusive?: boolean;
}

const CLASSIC_GAME_ITEMS: MenuItem[] = [
  // Juegos rápidos sin IA (instantáneos)
  {id: 'bomba', name: 'Patata caliente', emoji: '💣', desc: '2 quemaduras · giros'},
  {id: 'reflejos', name: 'Reflejos', emoji: '⚡', desc: 'Con amagos + 950 ms'},
  {id: 'simon', name: 'Simón', emoji: '🧠', desc: 'Inicio x3 + reloj'},
  {id: 'machaca', name: 'Machaca OK', emoji: '👆', desc: '11 s + sobrecalienta'},
  {id: 'punteria', name: 'Puntería', emoji: '🎯', desc: '4 tiros · zona móvil'},
  {id: 'reloj', name: 'Reloj ciego', emoji: '⏱️', desc: 'Oculta en 0.80 s'},
  {id: 'memoria', name: 'Memoria', emoji: '🃏', desc: '16 cartas · racha'},
  {id: 'semaforo', name: 'Semáforo loco', emoji: '🚦', desc: 'Con amago amarillo'},
  {id: 'colores', name: 'Color tramposo', emoji: '🎨', desc: '6 colores · regla dual'},
  {id: 'flechas', name: 'Duelo flechas', emoji: '🏹', desc: '16 flechas + inversas'},
  // Juegos familiares con IA
  {id: 'ruleta', name: 'Ruleta IA', emoji: '🎡', desc: 'Retos en familia'},
  {id: 'trivia', name: 'Trivia IA', emoji: '❓', desc: 'Preguntas al vuelo'},
  {id: 'impostor', name: 'Impostor IA', emoji: '🎭', desc: '3–6 jugadores'},
  {id: 'dilema', name: 'Dilema IA', emoji: '⚖️', desc: '¿Qué prefieres?'},
  {id: 'probable', name: 'Más probable IA', emoji: '👉', desc: '¿Quién de todos?'},
  {id: 'yonunca', name: 'Yo nunca IA', emoji: '🙋', desc: 'Versión familiar'},
  {id: 'emoji', name: 'Cine Emojis IA', emoji: '🎬', desc: 'Adivina el título'},
  {id: 'pistas', name: 'Tres Pistas IA', emoji: '💡', desc: 'Menos pistas = más'},
  {id: 'verdad', name: 'Verdad o Mito', emoji: '✅', desc: 'Datos reales IA'},
  {id: 'historia', name: 'Historia IA', emoji: '📖', desc: 'Cuento en familia'},
];

const THEMED_HIDDEN_AI_GAMES = new Set<MenuGameId>([
  'ruleta',
  'dilema',
  'probable',
  'yonunca',
  'historia',
]);

const FNAF_EXCLUSIVE_ITEMS: MenuItem[] = [
  {
    id: 'fnaf_oficina',
    name: 'Turno Oficina 1',
    emoji: '🌙',
    desc: 'Ataques dobles · batería',
    fnafExclusive: true,
  },
  {
    id: 'fnaf_pirate',
    name: 'Pirate Cove 1C',
    emoji: '🦊',
    desc: 'Foxy veloz (1.1 s)',
    fnafExclusive: true,
  },
  {
    id: 'fnaf_puppet',
    name: 'Caja de Puppet',
    emoji: '🎁',
    desc: '8 paradas · OK x4',
    fnafExclusive: true,
  },
  {
    id: 'fnaf_springtrap',
    name: 'Señuelo Audio 3',
    emoji: '🔊',
    desc: 'Audio atrás · Reboot x2',
    fnafExclusive: true,
  },
  {
    id: 'fnaf_closet',
    name: 'Respiración 4',
    emoji: '🔦',
    desc: '8 oleadas contrarreloj',
    fnafExclusive: true,
  },
  {
    id: 'fnaf_salvage',
    name: 'Salvamento 6',
    emoji: '📋',
    desc: '7 cintas en 22 s',
    fnafExclusive: true,
  },
  {
    id: 'fnaf_camaras',
    name: 'Cámaras Seguridad',
    emoji: '📹',
    desc: '4 animatrónicos · 25 s',
    fnafExclusive: true,
  },
];

const AMONGUS_EXCLUSIVE_ITEMS: MenuItem[] = [
  {
    id: 'au_expulsion',
    name: 'Reunión Emergencia',
    emoji: '🚨',
    desc: '2 señuelos · expulsión Skeld',
    amongusExclusive: true,
  },
  {
    id: 'au_admin',
    name: 'Mapa Admin Skeld',
    emoji: '🗺️',
    desc: 'Detecta saltos sin tubo',
    amongusExclusive: true,
  },
  {
    id: 'au_falsa',
    name: '¿Tarea Real o Falsa?',
    emoji: '🩺',
    desc: '4 sospechosos · 5 rondas',
    amongusExclusive: true,
  },
  {
    id: 'au_luces',
    name: 'Apagón Electricidad',
    emoji: '💡',
    desc: '4 paneles · cables cruzados',
    amongusExclusive: true,
  },
  {
    id: 'au_distribuidor',
    name: 'Calibrar Distribuidor',
    emoji: '⚙️',
    desc: '3 paneles · giro inverso',
    amongusExclusive: true,
  },
  {
    id: 'au_comms',
    name: 'Sabotaje de Comms',
    emoji: '📡',
    desc: '4 canales · ≥93% señal',
    amongusExclusive: true,
  },
];

const SESSION_MENU_ITEMS: MenuItem[] = [
  {id: 'players', name: 'Jugadores', emoji: '👥', desc: 'OK: cambiar (1–6)'},
  {id: 'tournament', name: 'Torneo', emoji: '🏆', desc: 'OK: cambiar meta'},
  {id: 'reset', name: 'Reiniciar puntos', emoji: '🔄', desc: 'Todos en cero'},
];

const FNAF_MENU_OVERRIDES: Partial<Record<MenuGameId, {name: string; emoji: string; desc: string}>> = {
  bomba: {name: 'Pasa el Cupcake', emoji: '🧁', desc: '2 quemaduras · giros'},
  reflejos: {name: 'Cierra la Puerta', emoji: '🚪', desc: 'Con amagos + 950 ms'},
  simon: {name: 'Melodía Puppet', emoji: '🎵', desc: 'Inicio x3 + reloj'},
  machaca: {name: 'Recarga Linterna', emoji: '🔦', desc: '11 s + sobrecalienta'},
  punteria: {name: 'Puerta Blindada', emoji: '🛡️', desc: '4 tiros · zona móvil'},
  reloj: {name: 'Turno 6:00 AM', emoji: '🕰️', desc: 'Oculta en 0.80 s'},
  memoria: {name: 'Cámaras Fazbear', emoji: '📹', desc: '16 cartas · racha'},
  semaforo: {name: 'Luz de Foxy', emoji: '🦊', desc: 'Con amago amarillo'},
  colores: {name: 'Cables Fazbear', emoji: '🔌', desc: '6 colores · regla dual'},
  flechas: {name: 'Ronda Cámaras', emoji: '📡', desc: '16 flechas + inversas'},
  trivia: {name: 'Trivia FNAF IA', emoji: '🐻', desc: '¿Cuánto sabes?'},
  impostor: {name: 'Impostor Pizzería', emoji: '🎭', desc: '3–6 guardias'},
  emoji: {name: 'FNAF en Emojis', emoji: '🎬', desc: 'Personajes y salas'},
  pistas: {name: '3 Pistas Fazbear', emoji: '💡', desc: 'Menos pistas = más'},
  verdad: {name: 'Mito o Realidad', emoji: '📋', desc: 'Curiosidades FNAF'},
};

const AMONGUS_MENU_OVERRIDES: Partial<Record<MenuGameId, {name: string; emoji: string; desc: string}>> = {
  bomba: {name: 'Núcleo Inestable', emoji: '☢️', desc: '2 sobrecargas · solo OK'},
  reflejos: {name: 'Botón Emergencia', emoji: '🚨', desc: 'Con amagos + 950 ms'},
  simon: {name: 'Escáner Medbay', emoji: '🧬', desc: 'Inicio x3 + reloj'},
  machaca: {name: 'Carga de Escudos', emoji: '🛡️', desc: '11 s + sobrecalienta'},
  punteria: {name: 'Calibrar Motor', emoji: '⚙️', desc: '4 tiros · zona móvil'},
  reloj: {name: 'Salto Hiperespacial', emoji: '🚀', desc: 'Oculta en 0.80 s'},
  memoria: {name: 'Monitor Skeld', emoji: '🖥️', desc: '16 cartas · racha'},
  semaforo: {name: 'Luz de Cafetería', emoji: '🚨', desc: 'Con amago amarillo'},
  colores: {name: 'Cables de Admin', emoji: '🔌', desc: '6 colores · regla dual'},
  flechas: {name: 'Ruta por Skeld', emoji: '🧭', desc: '16 flechas + inversas'},
  trivia: {name: 'Trivia Skeld IA', emoji: '👽', desc: 'Ciencia y espacio'},
  impostor: {name: 'El Impostor IA', emoji: '🚀', desc: '3–6 tripulantes'},
  emoji: {name: 'Tareas en Emojis', emoji: '🎬', desc: 'Adivina la misión'},
  pistas: {name: '3 Pistas de Nave', emoji: '💡', desc: 'Radar de pistas'},
  verdad: {name: 'Dato o Sabotaje', emoji: '📋', desc: 'Mitos del cosmos'},
};

const TOURNAMENT_GOALS = [15, 25, 50, 75, 100, 0];
const NP_KEY = 'mj_np_v2';
const PTS_KEY = 'mj_pts_v2';
const GOAL_KEY = 'mj_goal_v1';
const THEME_KEY = 'mj_theme_v1';
const FNAF_LOCK_UNTIL_KEY = 'mj_fnaf_lock_until_v1';
const AMONGUS_LOCK_UNTIL_KEY = 'mj_au_lock_until_v1';
const FNAF_RING_MP3 = '/assets/aistudio/fnaf_ring_bab7c794.mp3';

function loadInitialLockUntil(key: string): number {
  try {
    const raw = Number(localStorage.getItem(key) || 0);
    if (Number.isFinite(raw) && raw > Date.now()) {
      return Math.min(raw, Date.now() + 60 * 1000);
    }
  } catch {
    // ignore
  }
  return 0;
}

function formatLockTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function loadInitialTheme(): ThemeMode {
  const fnafLocked = loadInitialLockUntil(FNAF_LOCK_UNTIL_KEY) > Date.now();
  const auLocked = loadInitialLockUntil(AMONGUS_LOCK_UNTIL_KEY) > Date.now();
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === 'amongus') return auLocked ? 'classic' : 'amongus';
    if (raw === 'fnaf') return fnafLocked ? 'classic' : 'fnaf';
    if (raw === 'classic') return 'classic';
  } catch {
    // ignore
  }
  return 'classic';
}

function themeToModeSel(t: ThemeMode): 0 | 1 | 2 {
  if (t === 'fnaf') return 1;
  if (t === 'amongus') return 2;
  return 0;
}

function modeSelToTheme(m: 0 | 1 | 2): ThemeMode {
  if (m === 1) return 'fnaf';
  if (m === 2) return 'amongus';
  return 'classic';
}

function loadInitialCount(): number {
  try {
    const val = Number(localStorage.getItem(NP_KEY) || 4);
    if (val >= 1 && val <= 6) return val;
  } catch {
    // ignore
  }
  return 4;
}

function loadInitialGoal(): number {
  try {
    const raw = localStorage.getItem(GOAL_KEY);
    if (raw !== null) {
      const val = Number(raw);
      if (TOURNAMENT_GOALS.includes(val)) return val;
    }
  } catch {
    // ignore
  }
  return 50;
}

function loadInitialPlayers(): StagePlayer[] {
  const base: StagePlayer[] = [0, 1, 2, 3, 4, 5].map((i) => ({
    id: i,
    name: `Jugador ${i + 1}`,
    pts: 0,
  }));
  try {
    const raw = localStorage.getItem(PTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        base.forEach((p, idx) => {
          if (typeof parsed[idx] === 'number') p.pts = parsed[idx];
        });
      }
    }
  } catch {
    // ignore
  }
  return base;
}

interface PodiumState {
  title: string;
  rankIndices: number[];
  lines: string[];
  ptsGiven: number[];
  tournamentReached: boolean;
  onAgain: () => void;
}

interface ChampionState {
  goal: number;
  standings: {idx: number; name: string; pts: number}[];
  winnerNames: string[];
  topPlayerIdx: number;
}

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [introLeaving, setIntroLeaving] = useState(false);
  const [np, setNp] = useState<number>(loadInitialCount);
  const [tournamentGoal, setTournamentGoal] = useState<number>(loadInitialGoal);
  const [players, setPlayers] = useState<StagePlayer[]>(loadInitialPlayers);
  const [menuSel, setMenuSel] = useState(0);
  const [menuFocusZone, setMenuFocusZone] = useState<'grid' | 'top'>('grid');
  const [topSel, setTopSel] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [themeMode, setThemeMode] = useState<ThemeMode>(loadInitialTheme);
  const [fnafLockUntil, setFnafLockUntil] = useState<number>(() =>
    loadInitialLockUntil(FNAF_LOCK_UNTIL_KEY),
  );
  const [auLockUntil, setAuLockUntil] = useState<number>(() =>
    loadInitialLockUntil(AMONGUS_LOCK_UNTIL_KEY),
  );
  const [lockNowMs, setLockNowMs] = useState<number>(() => Date.now());
  const [phoneRinging, setPhoneRinging] = useState(false);
  const [phoneSecondsLeft, setPhoneSecondsLeft] = useState(14);
  const [auAlertActive, setAuAlertActive] = useState(false);
  const [auAlertSecondsLeft, setAuAlertSecondsLeft] = useState(14);
  const [lockNotice, setLockNotice] = useState<{title: string; desc: string} | null>(null);
  const [missedCallNotice, setMissedCallNotice] = useState<{title: string; desc: string} | null>(
    null,
  );
  const [showModeModal, setShowModeModal] = useState(false);
  const [modeSel, setModeSel] = useState<0 | 1 | 2>(() => themeToModeSel(loadInitialTheme()));
  const [activeGame, setActiveGame] = useState<MenuGameId | null>(null);
  const [gameRunKey, setGameRunKey] = useState(0);
  const [podium, setPodium] = useState<PodiumState | null>(null);
  const [champion, setChampion] = useState<ChampionState | null>(null);
  const [championLockSec, setChampionLockSec] = useState(0);
  const [bg, setBg] = useState('#05070a');
  const [musicOn, setMusicOn] = useState<boolean>(() => isMusicEnabled());
  const [achievements, setAchievements] = useState<AchievementsStore>(loadAchievements);
  const [toastQueue, setToastQueue] = useState<AchievementDef[]>([]);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateBtnSel, setUpdateBtnSel] = useState<0 | 1>(0);
  const [tvVersionInfo, setTvVersionInfo] = useState<TvInstalledVersion | null>(null);
  const [availableUpdate, setAvailableUpdate] = useState<TvRemoteRelease | null>(null);
  const [updatePhase, setUpdatePhase] = useState<
    | 'idle'
    | 'checking'
    | 'available'
    | 'downloading'
    | 'needs_permission'
    | 'up_to_date'
    | 'web_only'
    | 'error'
  >('idle');
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateMessage, setUpdateMessage] = useState('');
  const autoCheckedUpdateRef = useRef(false);

  const gameKeyHandlerRef = useRef<((k: RemoteKey) => void) | null>(null);
  const activeGameRef = useRef<MenuGameId | null>(null);
  activeGameRef.current = activeGame;
  const playersRef = useRef(players);
  playersRef.current = players;
  const championTimerRef = useRef<number | null>(null);
  const championUnlockAtRef = useRef(0);
  const introTimerRef = useRef<number | null>(null);
  const introLeaveTimerRef = useRef<number | null>(null);
  const phoneRingAudioRef = useRef<HTMLAudioElement | null>(null);

  const registerKeyHandler = useCallback((handler: ((k: RemoteKey) => void) | null) => {
    gameKeyHandlerRef.current = handler;
  }, []);

  const dismissIntro = useCallback((withClick = false) => {
    if (introTimerRef.current) window.clearTimeout(introTimerRef.current);
    if (introLeaveTimerRef.current) window.clearTimeout(introLeaveTimerRef.current);
    if (withClick) playControlClick();
    setIntroLeaving(true);
    introLeaveTimerRef.current = window.setTimeout(() => {
      setShowIntro(false);
    }, 300);
  }, []);

  useEffect(() => {
    bindGlobalMusicUnlock();
    preloadControlClick();

    const ringEl = new Audio(FNAF_RING_MP3);
    ringEl.loop = true;
    ringEl.preload = 'auto';
    ringEl.volume = 0.8;
    phoneRingAudioRef.current = ringEl;

    // Acorde de bienvenida suave (si el navegador ya permite audio)
    const jingleTimers = [
      window.setTimeout(() => tone(523.25, 0.14, 'triangle', 0.07), 260),
      window.setTimeout(() => tone(659.25, 0.14, 'triangle', 0.07), 380),
      window.setTimeout(() => tone(783.99, 0.28, 'triangle', 0.08), 500),
    ];

    introTimerRef.current = window.setTimeout(() => {
      dismissIntro(false);
    }, 3200);

    return () => {
      jingleTimers.forEach((id) => window.clearTimeout(id));
      if (championTimerRef.current) window.clearTimeout(championTimerRef.current);
      if (introTimerRef.current) window.clearTimeout(introTimerRef.current);
      if (introLeaveTimerRef.current) window.clearTimeout(introLeaveTimerRef.current);
      ringEl.pause();
      ringEl.src = '';
      phoneRingAudioRef.current = null;
    };
  }, [dismissIntro]);

  // Música por pantalla / juego
  useEffect(() => {
    let track: MusicTrackId =
      themeMode === 'fnaf' ? 'menu_fnaf' : themeMode === 'amongus' ? 'menu_amongus' : 'menu';
    if (showIntro) track = 'none';
    else if (champion) track = themeMode === 'amongus' ? 'champion_amongus' : 'champion';
    else if (podium) track = 'podium';
    else if (activeGame === 'fnaf_puppet' || activeGame === 'fnaf_balloon_boy') track = 'none';
    else if (activeGame === 'simon' && themeMode === 'fnaf') track = 'simon_fnaf';
    else if (activeGame === 'bomba' && themeMode === 'amongus') track = 'au_alarma';
    else if (activeGame) track = activeGame;
    setMusicTrack(track);
  }, [showIntro, activeGame, podium, champion, themeMode]);

  useEffect(() => {
    try {
      localStorage.setItem(NP_KEY, String(np));
    } catch {
      // ignore
    }
  }, [np]);

  useEffect(() => {
    try {
      localStorage.setItem(GOAL_KEY, String(tournamentGoal));
    } catch {
      // ignore
    }
  }, [tournamentGoal]);

  useEffect(() => {
    try {
      localStorage.setItem(PTS_KEY, JSON.stringify(players.map((p) => p.pts)));
    } catch {
      // ignore
    }
  }, [players]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, themeMode);
    } catch {
      // ignore
    }
  }, [themeMode]);

  const fnafLockRemainingSec =
    fnafLockUntil > lockNowMs ? Math.max(0, Math.ceil((fnafLockUntil - lockNowMs) / 1000)) : 0;
  const isFnafLocked = fnafLockRemainingSec > 0;

  const auLockRemainingSec =
    auLockUntil > lockNowMs ? Math.max(0, Math.ceil((auLockUntil - lockNowMs) / 1000)) : 0;
  const isAuLocked = auLockRemainingSec > 0;

  useEffect(() => {
    if (fnafLockUntil <= 0 && auLockUntil <= 0) return;
    const iv = window.setInterval(() => {
      const now = Date.now();
      setLockNowMs(now);
      if (fnafLockUntil > 0 && now >= fnafLockUntil) {
        setFnafLockUntil(0);
        try {
          localStorage.removeItem(FNAF_LOCK_UNTIL_KEY);
        } catch {
          // ignore
        }
      }
      if (auLockUntil > 0 && now >= auLockUntil) {
        setAuLockUntil(0);
        try {
          localStorage.removeItem(AMONGUS_LOCK_UNTIL_KEY);
        } catch {
          // ignore
        }
      }
    }, 1000);
    return () => window.clearInterval(iv);
  }, [fnafLockUntil, auLockUntil]);

  useEffect(() => {
    if (isFnafLocked && themeMode === 'fnaf') {
      setThemeMode('classic');
    } else if (isAuLocked && themeMode === 'amongus') {
      setThemeMode('classic');
    }
  }, [isFnafLocked, isAuLocked, themeMode]);

  useEffect(() => {
    if (!lockNotice) return;
    const t = window.setTimeout(() => setLockNotice(null), 6500);
    return () => window.clearTimeout(t);
  }, [lockNotice]);

  useEffect(() => {
    if (!missedCallNotice) return;
    const t = window.setTimeout(() => setMissedCallNotice(null), 5500);
    return () => window.clearTimeout(t);
  }, [missedCallNotice]);

  const activePlayers = players.slice(0, np);
  const topScore = activePlayers.reduce((max, p) => Math.max(max, p.pts), 0);

  const isMainMenu = !showIntro && activeGame === null && podium === null && champion === null;
  const currentToast = isMainMenu && toastQueue.length > 0 ? toastQueue[0] : null;
  const unlockedCount = Object.keys(achievements.unlocked).length;

  // Teléfono aleatorio en el menú FNAF hasta que lo contesten
  useEffect(() => {
    if (!isMainMenu || themeMode !== 'fnaf' || isFnafLocked) {
      setPhoneRinging(false);
      return;
    }
    if (showModeModal || showAchievementsModal || showUpdateModal || phoneRinging) return;

    const delayMs = 15000 + Math.floor(Math.random() * 10000);
    const t = window.setTimeout(() => {
      setPhoneSecondsLeft(14);
      setPhoneRinging(true);
    }, delayMs);
    return () => window.clearTimeout(t);
  }, [
    isMainMenu,
    themeMode,
    isFnafLocked,
    showModeModal,
    showAchievementsModal,
    showUpdateModal,
    phoneRinging,
  ]);

  // Alerta aleatoria de Shapeshifter en el menú Among Us
  useEffect(() => {
    if (!isMainMenu || themeMode !== 'amongus' || isAuLocked) {
      setAuAlertActive(false);
      return;
    }
    if (showModeModal || showAchievementsModal || showUpdateModal || auAlertActive) return;

    const delayMs = 15000 + Math.floor(Math.random() * 10000);
    const t = window.setTimeout(() => {
      setAuAlertSecondsLeft(14);
      setAuAlertActive(true);
    }, delayMs);
    return () => window.clearTimeout(t);
  }, [
    isMainMenu,
    themeMode,
    isAuLocked,
    showModeModal,
    showAchievementsModal,
    showUpdateModal,
    auAlertActive,
  ]);

  // Cuenta regresiva del teléfono FNAF
  useEffect(() => {
    if (!phoneRinging || !isMainMenu || themeMode !== 'fnaf' || isFnafLocked) return;

    const iv = window.setInterval(() => {
      setPhoneSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(iv);
  }, [phoneRinging, isMainMenu, themeMode, isFnafLocked]);

  // Cuenta regresiva de alerta Shapeshifter Among Us
  useEffect(() => {
    if (!auAlertActive || !isMainMenu || themeMode !== 'amongus' || isAuLocked) return;

    const iv = window.setInterval(() => {
      setAuAlertSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(iv);
  }, [auAlertActive, isMainMenu, themeMode, isAuLocked]);

  useEffect(() => {
    if (!phoneRinging || phoneSecondsLeft > 0 || !isMainMenu || themeMode !== 'fnaf' || isFnafLocked) {
      return;
    }
    setPhoneRinging(false);
    tone(130, 0.35, 'sawtooth', 0.16);
    setPlayers((prevPlayers) =>
      prevPlayers.map((p, idx) => (idx < np ? {...p, pts: Math.max(0, p.pts - 2)} : p)),
    );
    setMissedCallNotice({
      title: 'Llamada perdida',
      desc: '¡Nadie contestó el teléfono! Todos los concursantes pierden -2 pts.',
    });
  }, [phoneRinging, phoneSecondsLeft, isMainMenu, themeMode, isFnafLocked, np]);

  useEffect(() => {
    if (!auAlertActive || auAlertSecondsLeft > 0 || !isMainMenu || themeMode !== 'amongus' || isAuLocked) {
      return;
    }
    setAuAlertActive(false);
    tone(130, 0.35, 'sawtooth', 0.16);
    setPlayers((prevPlayers) =>
      prevPlayers.map((p, idx) => (idx < np ? {...p, pts: Math.max(0, p.pts - 2)} : p)),
    );
    setMissedCallNotice({
      title: 'Sabotaje sin respuesta',
      desc: '¡Nadie detuvo al Shapeshifter! Todos los tripulantes pierden -2 pts.',
    });
  }, [auAlertActive, auAlertSecondsLeft, isMainMenu, themeMode, isAuLocked, np]);

  // Reproducción continua de fnaf_ring o radar de Shapeshifter hasta contestar
  useEffect(() => {
    const ringEl = phoneRingAudioRef.current;
    const shouldRing = phoneRinging && isMainMenu && themeMode === 'fnaf' && !isFnafLocked;
    const shouldAuPing = auAlertActive && isMainMenu && themeMode === 'amongus' && !isAuLocked;
    setMusicDucked(shouldRing || shouldAuPing);
    if (ringEl) {
      if (shouldRing) {
        if (ringEl.paused) {
          void ringEl.play().catch(() => {});
        }
      } else {
        ringEl.pause();
        ringEl.currentTime = 0;
      }
    }
    if (!shouldAuPing) return;
    const ping = () => {
      tone(740, 0.1, 'triangle', 0.12);
      window.setTimeout(() => tone(520, 0.12, 'triangle', 0.1), 120);
    };
    ping();
    const iv = window.setInterval(ping, 1250);
    return () => window.clearInterval(iv);
  }, [phoneRinging, auAlertActive, isMainMenu, themeMode, isFnafLocked, isAuLocked]);

  useEffect(() => {
    if (!phoneRinging && !auAlertActive && topSel === 4) {
      setTopSel(3);
    }
  }, [phoneRinging, auAlertActive, topSel]);

  const runTvUpdateCheck = useCallback(async (openIfFoundOnly: boolean) => {
    if (!openIfFoundOnly) {
      setUpdatePhase('checking');
      setUpdateMessage('');
      setUpdateBtnSel(0);
    }
    const res = await checkForTvUpdate();
    setTvVersionInfo(res.local);

    if (res.status === 'update_available') {
      setAvailableUpdate(res.remote);
      setUpdatePhase('available');
      setUpdateMessage(res.remote.notes || 'Nueva versión lista para descargar directo en tu TV.');
      setUpdateBtnSel(0);
      setShowUpdateModal(true);
      return;
    }

    if (openIfFoundOnly) return;

    if (res.status === 'web_only') {
      setUpdatePhase('web_only');
      setUpdateMessage(
        'En navegador web siempre usas la última versión. En Android TV, la app descarga e instala las actualizaciones directo aquí sin USB.',
      );
    } else if (res.status === 'no_feed') {
      setUpdatePhase('up_to_date');
      setUpdateMessage(
        `Versión actual: v${res.local.versionName}. Las actualizaciones automáticas se activan al compilar el APK desde GitHub.`,
      );
    } else if (res.status === 'up_to_date') {
      setAvailableUpdate(null);
      setUpdatePhase('up_to_date');
      setUpdateMessage(`Ya tienes instalada la última versión (v${res.local.versionName}).`);
    } else {
      setUpdatePhase('error');
      setUpdateMessage(res.message);
    }
  }, []);

  const handleOpenUpdateModal = useCallback(() => {
    playControlClick();
    setShowUpdateModal(true);
    setUpdateBtnSel(0);
    if (updatePhase !== 'downloading') {
      void runTvUpdateCheck(false);
    }
  }, [runTvUpdateCheck, updatePhase]);

  const handleStartTvUpdate = useCallback(async () => {
    if (!availableUpdate) {
      await runTvUpdateCheck(false);
      return;
    }
    playControlClick();
    setUpdatePhase('downloading');
    setUpdateProgress(0);
    setUpdateMessage('Descargando actualización en el televisor...');
    try {
      const res = await downloadAndInstallTvUpdate(availableUpdate.apkUrl, (pct) => {
        setUpdateProgress(pct);
      });
      if (res.status === 'needs_permission') {
        setUpdatePhase('needs_permission');
        setUpdateMessage(
          'Activa "Permitir de esta fuente" en la siguiente pantalla de Android TV y luego presiona Instalar.',
        );
        setUpdateBtnSel(0);
      } else {
        setUpdatePhase('available');
        setUpdateMessage('Instalador abierto en Android TV. Presiona "Instalar" en tu control.');
      }
    } catch (err) {
      setUpdatePhase('error');
      setUpdateMessage(
        err instanceof Error ? err.message : 'No se pudo descargar la actualización.',
      );
      setUpdateBtnSel(0);
    }
  }, [availableUpdate, runTvUpdateCheck]);

  const handlePrimaryUpdateAction = useCallback(async () => {
    if (updatePhase === 'downloading') return;
    if (updatePhase === 'available') {
      await handleStartTvUpdate();
      return;
    }
    if (updatePhase === 'needs_permission') {
      playControlClick();
      const installed = await installDownloadedTvUpdate();
      if (installed === 'needs_permission') {
        await openTvInstallPermissionSettings();
      } else if (installed === 'missing' && availableUpdate) {
        await handleStartTvUpdate();
      }
      return;
    }
    if (updatePhase === 'web_only') {
      playControlClick();
      setShowUpdateModal(false);
      return;
    }
    playControlClick();
    await runTvUpdateCheck(false);
  }, [availableUpdate, handleStartTvUpdate, runTvUpdateCheck, updatePhase]);

  useEffect(() => {
    void getInstalledTvVersion().then((info) => setTvVersionInfo(info));
  }, []);

  useEffect(() => {
    if (!isMainMenu || autoCheckedUpdateRef.current) return;
    autoCheckedUpdateRef.current = true;
    const t = window.setTimeout(() => {
      void runTvUpdateCheck(true);
    }, 900);
    return () => window.clearTimeout(t);
  }, [isMainMenu, runTvUpdateCheck]);

  useEffect(() => {
    if (!currentToast) return;
    tone(880, 0.08, 'triangle', 0.06);
    const chimeTimer = window.setTimeout(() => tone(1174.66, 0.16, 'triangle', 0.06), 90);
    const hideTimer = window.setTimeout(() => {
      setToastQueue((prev) => prev.slice(1));
    }, 3800);
    return () => {
      window.clearTimeout(chimeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [currentToast]);

  const queueUnlockedToasts = useCallback((unlockedNow: AchievementDef[]) => {
    if (unlockedNow.length === 0) return;
    setToastQueue((prev) => {
      const seen = new Set(prev.map((a) => a.id));
      const added = unlockedNow.filter((a) => !seen.has(a.id));
      return added.length > 0 ? [...prev, ...added] : prev;
    });
  }, []);

  const toggleMusic = useCallback(() => {
    const next = !musicOn;
    setMusicOn(next);
    setMusicEnabled(next);
  }, [musicOn]);

  const buildChampionState = useCallback(
    (snapshot: StagePlayer[], goal: number): ChampionState => {
      const slice = snapshot
        .slice(0, np)
        .map((p, idx) => ({idx, name: p.name, pts: p.pts}))
        .sort((a, b) => b.pts - a.pts);
      const topPts = slice[0]?.pts ?? 0;
      const winners = slice.filter((p) => p.pts === topPts);
      return {
        goal,
        standings: slice,
        winnerNames: winners.map((w) => w.name),
        topPlayerIdx: slice[0]?.idx ?? 0,
      };
    },
    [np],
  );

  useEffect(() => {
    if (champion === null || championLockSec <= 0) return;
    const iv = window.setInterval(() => {
      const rem = Math.max(0, Math.ceil((championUnlockAtRef.current - Date.now()) / 1000));
      setChampionLockSec(rem);
    }, 200);
    return () => window.clearInterval(iv);
  }, [champion, championLockSec]);

  const openChampionScreen = useCallback(
    (snapshot: StagePlayer[], goal: number) => {
      const champ = buildChampionState(snapshot, goal);
      const achRes = recordTournamentWinAchievement();
      setAchievements(achRes.store);
      queueUnlockedToasts(achRes.unlockedNow);
      gameKeyHandlerRef.current = null;
      setActiveGame(null);
      setPodium(null);
      if (themeMode === 'amongus') {
        championUnlockAtRef.current = Date.now() + 3000;
        setChampionLockSec(3);
      } else {
        championUnlockAtRef.current = 0;
        setChampionLockSec(0);
      }
      setChampion(champ);
      setBg(
        themeMode === 'amongus'
          ? '#000000'
          : PLAYER_STAGE_COLORS[champ.topPlayerIdx % PLAYER_STAGE_COLORS.length],
      );
    },
    [buildChampionState, queueUnlockedToasts, themeMode],
  );

  const goMenu = useCallback(() => {
    if (championTimerRef.current) window.clearTimeout(championTimerRef.current);
    championUnlockAtRef.current = 0;
    setChampionLockSec(0);
    gameKeyHandlerRef.current = null;
    setActiveGame(null);
    setPodium(null);
    setChampion(null);
    setBg('#05070a');
  }, []);

  const answerPhone = useCallback(() => {
    playControlClick();
    setPhoneRinging(false);
    if (phoneRingAudioRef.current) {
      phoneRingAudioRef.current.pause();
      phoneRingAudioRef.current.currentTime = 0;
    }
    setPodium(null);
    setChampion(null);
    setGameRunKey((k) => k + 1);
    setActiveGame('fnaf_balloon_boy');
  }, []);

  const answerAuAlert = useCallback(() => {
    playControlClick();
    setAuAlertActive(false);
    setPodium(null);
    setChampion(null);
    setGameRunKey((k) => k + 1);
    setActiveGame('au_shapeshifter');
  }, []);

  const handleFnafLockout = useCallback(() => {
    const until = Date.now() + 60 * 1000;
    setFnafLockUntil(until);
    setLockNowMs(Date.now());
    try {
      localStorage.setItem(FNAF_LOCK_UNTIL_KEY, String(until));
    } catch {
      // ignore
    }
    setPhoneRinging(false);
    setThemeMode('classic');
    setModeSel(0);
    goMenu();
    setLockNotice({
      title: 'Modo FNAF cerrado',
      desc: 'Balloon Boy te atrapó: modo FNAF bloqueado 1 minuto.',
    });
  }, [goMenu]);

  const handleAuLockout = useCallback(() => {
    const until = Date.now() + 60 * 1000;
    setAuLockUntil(until);
    setLockNowMs(Date.now());
    try {
      localStorage.setItem(AMONGUS_LOCK_UNTIL_KEY, String(until));
    } catch {
      // ignore
    }
    setAuAlertActive(false);
    setThemeMode('classic');
    setModeSel(0);
    goMenu();
    setLockNotice({
      title: 'Modo Among Us cerrado',
      desc: 'El Shapeshifter tomó la nave: modo Among Us bloqueado 1 minuto.',
    });
  }, [goMenu]);

  const startNewTournament = useCallback(() => {
    if (Date.now() < championUnlockAtRef.current) return;
    setPlayers((prev) => prev.map((p) => ({...p, pts: 0})));
    tone(520, 0.12);
    goMenu();
  }, [goMenu]);

  const continueFreePlay = useCallback(() => {
    if (Date.now() < championUnlockAtRef.current) return;
    setTournamentGoal(0);
    tone(440, 0.1);
    goMenu();
  }, [goMenu]);

  const classicForThemed = CLASSIC_GAME_ITEMS.filter(
    (item) => !THEMED_HIDDEN_AI_GAMES.has(item.id as MenuGameId),
  );

  const visibleMenuItems =
    themeMode === 'fnaf'
      ? [...classicForThemed, ...FNAF_EXCLUSIVE_ITEMS, ...SESSION_MENU_ITEMS]
      : themeMode === 'amongus'
        ? [...classicForThemed, ...AMONGUS_EXCLUSIVE_ITEMS, ...SESSION_MENU_ITEMS]
        : [...CLASSIC_GAME_ITEMS, ...SESSION_MENU_ITEMS];

  useEffect(() => {
    setMenuSel((prev) => Math.min(prev, visibleMenuItems.length - 1));
  }, [visibleMenuItems.length]);

  const activateMenuItem = useCallback(
    (index: number) => {
      const item = visibleMenuItems[index];
      if (!item) return;
      if (item.id === 'players') {
        playControlClick();
        setNp((prev) => (prev >= 6 ? 1 : prev + 1));
        return;
      }
      if (item.id === 'tournament') {
        playControlClick();
        setTournamentGoal((prev) => {
          const i = TOURNAMENT_GOALS.indexOf(prev);
          return TOURNAMENT_GOALS[(i + 1) % TOURNAMENT_GOALS.length];
        });
        return;
      }
      if (item.id === 'reset') {
        playControlClick();
        setPlayers((prev) => prev.map((p) => ({...p, pts: 0})));
        return;
      }
      playControlClick();
      setPodium(null);
      setChampion(null);
      setGameRunKey((k) => k + 1);
      setActiveGame(item.id);
    },
    [visibleMenuItems],
  );

  const handleFinish = useCallback(
    (
      title: string,
      rankIndices: number[],
      lines: string[],
      onAgain: () => void,
      customPtsGiven?: number[],
    ) => {
      const rewardScale = [3, 2, 1, 0, 0, 0];
      const ptsGiven = rankIndices.map((_, r) =>
        customPtsGiven ? (customPtsGiven[r] ?? 0) : rewardScale[Math.min(r, 5)],
      );
      const nextPlayers = playersRef.current.map((p) => ({...p}));
      rankIndices.forEach((playerIdx, rankPos) => {
        if (nextPlayers[playerIdx]) {
          nextPlayers[playerIdx].pts += ptsGiven[rankPos] ?? 0;
        }
      });
      playersRef.current = nextPlayers;
      setPlayers(nextPlayers);

      const tournamentReached =
        tournamentGoal > 0 &&
        nextPlayers.slice(0, np).some((p) => p.pts >= tournamentGoal);

      const achRes = recordMatchAchievement({
        gameId: activeGameRef.current,
        winnerIdx: rankIndices[0],
        playerCount: np,
      });
      setAchievements(achRes.store);
      queueUnlockedToasts(achRes.unlockedNow);

      tone(523, 0.14);
      window.setTimeout(() => tone(784, 0.32), 160);
      setBg('#05070a');
      setPodium({title, rankIndices, lines, ptsGiven, tournamentReached, onAgain});
    },
    [np, tournamentGoal, queueUnlockedToasts],
  );

  const handleAwardSingle = useCallback(
    (playerIdx: number, pts: number) => {
      const nextPlayers = playersRef.current.map((p, i) =>
        i === playerIdx ? {...p, pts: p.pts + pts} : p,
      );
      playersRef.current = nextPlayers;
      setPlayers(nextPlayers);

      const achRes = recordSinglePointAchievement({
        gameId: activeGameRef.current,
        playerIdx,
        playerCount: np,
      });
      setAchievements(achRes.store);
      queueUnlockedToasts(achRes.unlockedNow);

      if (tournamentGoal > 0 && (nextPlayers[playerIdx]?.pts ?? 0) >= tournamentGoal) {
        if (championTimerRef.current) window.clearTimeout(championTimerRef.current);
        championTimerRef.current = window.setTimeout(() => {
          openChampionScreen(nextPlayers, tournamentGoal);
        }, 550);
      }
    },
    [np, tournamentGoal, openChampionScreen, queueUnlockedToasts],
  );

  // Global TV Remote / Keyboard listener
  useEffect(() => {
    const KEY_MAP: Record<string, RemoteKey> = {
      ArrowUp: 'up',
      Up: 'up',
      DPadUp: 'up',
      ArrowDown: 'down',
      Down: 'down',
      DPadDown: 'down',
      ArrowLeft: 'left',
      Left: 'left',
      DPadLeft: 'left',
      ArrowRight: 'right',
      Right: 'right',
      DPadRight: 'right',
      Enter: 'ok',
      ' ': 'ok',
      Select: 'ok',
      DPadCenter: 'ok',
      Accept: 'ok',
      Escape: 'back',
      Backspace: 'back',
      GoBack: 'back',
      BrowserBack: 'back',
      Back: 'back',
    };

    const resolveRemoteKey = (e: KeyboardEvent): RemoteKey | null => {
      if (KEY_MAP[e.key]) return KEY_MAP[e.key];
      const code = e.keyCode || e.which;
      if (code === 38 || code === 19) return 'up';
      if (code === 40 || code === 20) return 'down';
      if (code === 37 || code === 21) return 'left';
      if (code === 39 || code === 22) return 'right';
      if (code === 13 || code === 23 || code === 66) return 'ok';
      if (code === 27 || code === 8 || code === 4 || code === 461 || code === 10009) return 'back';
      return null;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const k = resolveRemoteKey(e);

      if (showIntro) {
        if (k) {
          e.preventDefault();
          dismissIntro(true);
        }
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMusic();
        return;
      }

      if ((e.key === 'l' || e.key === 'L') && isMainMenu) {
        e.preventDefault();
        playControlClick();
        setShowAchievementsModal((prev) => !prev);
        return;
      }

      if (!k) return;
      e.preventDefault();
      if (k === 'ok' && e.repeat) return;

      if (showModeModal && isMainMenu) {
        if (k === 'right' || k === 'down') {
          playControlClick();
          setModeSel((m) => ((m + 1) % 3) as 0 | 1 | 2);
        } else if (k === 'left' || k === 'up') {
          playControlClick();
          setModeSel((m) => ((m + 2) % 3) as 0 | 1 | 2);
        } else if (k === 'ok') {
          if ((modeSel === 1 && isFnafLocked) || (modeSel === 2 && isAuLocked)) {
            tone(160, 0.14, 'sawtooth', 0.1);
            return;
          }
          playControlClick();
          setThemeMode(modeSelToTheme(modeSel));
          setShowModeModal(false);
        } else if (k === 'back') {
          playControlClick();
          setShowModeModal(false);
        }
        return;
      }

      if (showUpdateModal && isMainMenu) {
        const hasTwoBtns =
          updatePhase !== 'web_only' && updatePhase !== 'checking' && updatePhase !== 'downloading';
        if (k === 'left' || k === 'right' || k === 'up' || k === 'down') {
          if (hasTwoBtns) {
            playControlClick();
            setUpdateBtnSel((s) => (s === 0 ? 1 : 0));
          }
        } else if (k === 'ok') {
          if (updatePhase === 'downloading' || updatePhase === 'checking') return;
          if (!hasTwoBtns || updateBtnSel === 0) {
            void handlePrimaryUpdateAction();
          } else {
            playControlClick();
            setShowUpdateModal(false);
          }
        } else if (k === 'back') {
          if (updatePhase === 'downloading') return;
          playControlClick();
          setShowUpdateModal(false);
        }
        return;
      }

      if (showAchievementsModal && isMainMenu) {
        if (k === 'ok' || k === 'back') {
          playControlClick();
          setShowAchievementsModal(false);
        }
        return;
      }

      if (k === 'back') {
        if (champion !== null) {
          if (Date.now() < championUnlockAtRef.current) return;
          tone(300, 0.08);
          startNewTournament();
          return;
        }
        if (activeGame !== null || podium !== null) {
          tone(300, 0.08);
          goMenu();
        }
        return;
      }

      if (champion !== null) {
        if (Date.now() < championUnlockAtRef.current) return;
        if (k === 'ok') {
          startNewTournament();
        } else if (k === 'up') {
          continueFreePlay();
        }
        return;
      }

      if (podium) {
        if (k === 'ok') {
          if (podium.tournamentReached && tournamentGoal > 0) {
            openChampionScreen(playersRef.current, tournamentGoal);
          } else {
            tone(380, 0.05);
            goMenu();
          }
        } else if (k === 'up' && !podium.tournamentReached) {
          tone(520, 0.08);
          const replay = podium.onAgain;
          setPodium(null);
          setGameRunKey((n) => n + 1);
          replay();
        }
        return;
      }

      if (activeGame !== null) {
        gameKeyHandlerRef.current?.(k);
        return;
      }

      // Navegación TV en menú principal (barra superior + cuadrícula 6x4 o 6x5)
      const total = visibleMenuItems.length;
      const cols = window.innerWidth <= 900 ? 3 : 6;
      const hasPhoneBtn = phoneRinging && themeMode === 'fnaf';
      const hasAuAlertBtn = auAlertActive && themeMode === 'amongus';
      const hasEventBtn = hasPhoneBtn || hasAuAlertBtn;
      const topCount = hasEventBtn ? 5 : 4;
      const mapColToTop = (col: number): 0 | 1 | 2 | 3 | 4 => {
        if (cols <= 3) {
          if (hasEventBtn && col >= 2) return 4;
          return col === 0 ? 0 : col === 1 ? 1 : 2;
        }
        if (hasEventBtn && col >= 5) return 4;
        if (col === 0) return 0;
        if (col <= 2) return 1;
        if (col === 3) return 2;
        return 3;
      };

      if (menuFocusZone === 'top') {
        if (k === 'right') {
          setTopSel((t) => ((t + 1) % topCount) as 0 | 1 | 2 | 3 | 4);
          playControlClick();
        } else if (k === 'left') {
          setTopSel((t) => ((t + topCount - 1) % topCount) as 0 | 1 | 2 | 3 | 4);
          playControlClick();
        } else if (k === 'down') {
          setMenuFocusZone('grid');
          setMenuSel((s) => s % cols);
          playControlClick();
        } else if (k === 'up') {
          const lastRowStart = Math.floor((total - 1) / cols) * cols;
          setMenuFocusZone('grid');
          setMenuSel((s) => Math.min(total - 1, lastRowStart + (s % cols)));
          playControlClick();
        } else if (k === 'ok') {
          if (topSel === 4 && hasPhoneBtn) {
            answerPhone();
          } else if (topSel === 4 && hasAuAlertBtn) {
            answerAuAlert();
          } else if (topSel === 0) {
            playControlClick();
            toggleMusic();
          } else if (topSel === 1) {
            playControlClick();
            setModeSel(themeToModeSel(themeMode));
            setShowModeModal(true);
          } else if (topSel === 2) {
            playControlClick();
            setShowAchievementsModal(true);
          } else {
            handleOpenUpdateModal();
          }
        }
        return;
      }

      if (k === 'right') {
        setMenuSel((s) => (s + 1) % total);
        playControlClick();
      } else if (k === 'left') {
        setMenuSel((s) => (s + total - 1) % total);
        playControlClick();
      } else if (k === 'down') {
        if (menuSel + cols >= total) {
          setMenuFocusZone('top');
          setTopSel(mapColToTop(menuSel % cols));
        } else {
          setMenuSel((s) => s + cols);
        }
        playControlClick();
      } else if (k === 'up') {
        if (menuSel < cols) {
          setMenuFocusZone('top');
          setTopSel(mapColToTop(menuSel % cols));
        } else {
          setMenuSel((s) => s - cols);
        }
        playControlClick();
      } else if (k === 'ok') {
        activateMenuItem(menuSel);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    showIntro,
    isMainMenu,
    showAchievementsModal,
    showUpdateModal,
    updatePhase,
    updateBtnSel,
    handlePrimaryUpdateAction,
    handleOpenUpdateModal,
    showModeModal,
    modeSel,
    themeMode,
    isFnafLocked,
    isAuLocked,
    phoneRinging,
    auAlertActive,
    answerPhone,
    answerAuAlert,
    visibleMenuItems.length,
    dismissIntro,
    activeGame,
    podium,
    champion,
    menuSel,
    menuFocusZone,
    topSel,
    tournamentGoal,
    goMenu,
    activateMenuItem,
    openChampionScreen,
    startNewTournament,
    continueFreePlay,
    toggleMusic,
  ]);

  const commonProps = {
    players: activePlayers,
    onFinish: handleFinish,
    onExit: goMenu,
    registerKeyHandler,
    setBg,
    themeMode,
  };

  const stageStyle = {
    backgroundColor: bg,
    '--fnaf-bg': `url(${fnafBgImg})`,
    '--fnaf-tile': `url(${fnafTileImg})`,
    '--fnaf-panel': `url(${fnafPanelImg})`,
    '--amongus-bg': `url(${amongusBgImg})`,
    '--amongus-tile': `url(${amongusTileImg})`,
    '--amongus-panel': `url(${amongusPanelImg})`,
  } as CSSProperties;

  return (
    <div
      id="stage"
      className={`stage-root ${
        themeMode === 'fnaf' ? 'theme-fnaf' : themeMode === 'amongus' ? 'theme-amongus' : ''
      }`}
      data-game-bg={bg === '#05070a' ? 'default' : 'active'}
      style={stageStyle}
    >
      {themeMode === 'fnaf' && (
        <>
          <div className="fnaf-crt-overlay" aria-hidden="true" />
          <div className="fnaf-cam-corners" aria-hidden="true" />
        </>
      )}
      {themeMode === 'amongus' && <div className="amongus-star-overlay" aria-hidden="true" />}

      {/* INTRO AL ABRIR LA APP */}
      {showIntro && (
        <div
          className={`stage-intro cursor-pointer ${introLeaving ? 'leaving' : ''}`}
          onClick={() => dismissIntro(true)}
        >
          <div className="intro-dots">
            {PLAYER_STAGE_COLORS.map((c, idx) => (
              <span
                key={c}
                className="intro-dot"
                style={{background: c, animationDelay: `${idx * 75}ms`}}
              />
            ))}
          </div>
          <div className="intro-logo">
            MINIJUEGOS{' '}
            <span
              className={
                themeMode === 'fnaf'
                  ? 'text-[#f59e0b]'
                  : themeMode === 'amongus'
                    ? 'text-[#22d3ee]'
                    : 'text-[#93c5fd]'
              }
            >
              TV PARTY
            </span>
          </div>
          <div className="intro-tagline">
            {themeMode === 'fnaf'
              ? '22 minijuegos · Modo FNAF'
              : themeMode === 'amongus'
                ? '21 minijuegos · Modo Among Us'
                : '20 minijuegos · 1 solo control · en familia'}
          </div>
          <div className="intro-bar-track">
            <div className="intro-bar-fill" />
          </div>
          <div className="intro-skip">Presiona OK para entrar</div>
        </div>
      )}

      {/* NOTIFICACIÓN DE LOGRO DESBLOQUEADO, ALERTA PERDIDA O BLOQUEO EN MENÚ */}
      {isMainMenu && (lockNotice || missedCallNotice) && (
        <div
          className="stage-toast"
          style={{borderColor: 'rgba(239, 68, 68, 0.85)'}}
          role="status"
          aria-live="polite"
        >
          <div>
            <div className="stage-toast-kicker" style={{color: '#fca5a5'}}>
              {lockNotice ? 'Acceso restringido' : 'Alerta sin respuesta'}
            </div>
            <div className="stage-toast-title">
              {(lockNotice ?? missedCallNotice)?.title}
            </div>
            <div className="stage-toast-desc">{(lockNotice ?? missedCallNotice)?.desc}</div>
          </div>
        </div>
      )}

      {currentToast && !lockNotice && !missedCallNotice && (
        <div key={currentToast.id} className="stage-toast" role="status" aria-live="polite">
          <div className="stage-toast-emoji">{currentToast.emoji}</div>
          <div>
            <div className="stage-toast-kicker">Logro desbloqueado</div>
            <div className="stage-toast-title">{currentToast.title}</div>
            <div className="stage-toast-desc">{currentToast.desc}</div>
          </div>
        </div>
      )}

      {/* MENU PRINCIPAL */}
      {isMainMenu && (
        <div className="stage-menu">
          <div className="stage-title">
            MINIJUEGOS{' '}
            <b
              className={
                themeMode === 'fnaf'
                  ? 'text-[#f59e0b]'
                  : themeMode === 'amongus'
                    ? 'text-[#22d3ee]'
                    : 'text-[#93c5fd]'
              }
            >
              TV PARTY
            </b>
          </div>
          <div className="stage-subt">
            <span>
              {themeMode === 'fnaf'
                ? '22 minijuegos (7 exclusivos FNAF)'
                : themeMode === 'amongus'
                  ? '21 minijuegos (6 exclusivos Among Us)'
                  : '20 minijuegos'}{' '}
              · {np} {np === 1 ? 'jugador' : 'jugadores'} ·{' '}
              {tournamentGoal > 0 ? `Torneo a ${tournamentGoal} pts` : 'Modo libre'}
            </span>
            <button
              type="button"
              onClick={() => {
                playControlClick();
                setMenuFocusZone('top');
                setTopSel(0);
                toggleMusic();
              }}
              className={`stage-top-btn ${menuFocusZone === 'top' && topSel === 0 ? 'sel' : ''}`}
            >
              {musicOn ? '♪ Música: SÍ' : '🔇 Música: NO'}
            </button>
            <button
              type="button"
              onClick={() => {
                playControlClick();
                setMenuFocusZone('top');
                setTopSel(1);
                setModeSel(themeToModeSel(themeMode));
                setShowModeModal(true);
              }}
              className={`stage-top-btn ${menuFocusZone === 'top' && topSel === 1 ? 'sel' : ''}`}
            >
              {themeMode === 'fnaf'
                ? '🐻 Modo: FNAF'
                : themeMode === 'amongus'
                  ? '🚀 Modo: Among Us'
                  : '🎨 Modo: Clásico'}
            </button>
            <button
              type="button"
              onClick={() => {
                playControlClick();
                setMenuFocusZone('top');
                setTopSel(2);
                setShowAchievementsModal(true);
              }}
              className={`stage-top-btn ach ${menuFocusZone === 'top' && topSel === 2 ? 'sel' : ''}`}
            >
              🏅 Logros: {unlockedCount}/{ACHIEVEMENTS_LIST.length}
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuFocusZone('top');
                setTopSel(3);
                handleOpenUpdateModal();
              }}
              className={`stage-top-btn ${availableUpdate ? 'border-emerald-400/70 text-emerald-300' : ''} ${
                menuFocusZone === 'top' && topSel === 3 ? 'sel' : ''
              }`}
            >
              {availableUpdate
                ? `⬇️ Actualizar v${availableUpdate.versionName}`
                : `🔄 v${tvVersionInfo?.versionName || '1.0.0'}`}
            </button>
            {phoneRinging && themeMode === 'fnaf' && (
              <button
                type="button"
                onClick={answerPhone}
                className={`stage-top-btn phone ${menuFocusZone === 'top' && topSel === 4 ? 'sel' : ''}`}
              >
                <FnafPhoneSvg className="h-[2.6vh] w-[2.6vh]" />
                <span>¡Contestar! ({phoneSecondsLeft}s)</span>
              </button>
            )}
            {auAlertActive && themeMode === 'amongus' && (
              <button
                type="button"
                onClick={answerAuAlert}
                className={`stage-top-btn phone ${menuFocusZone === 'top' && topSel === 4 ? 'sel' : ''}`}
              >
                <ShapeshifterBadgeSvg className="h-[2.6vh] w-[2.6vh]" />
                <span>¡Shapeshifter! ({auAlertSecondsLeft}s)</span>
              </button>
            )}
          </div>

          {themeMode === 'fnaf' && <div className="fnaf-checker-bar" aria-hidden="true" />}
          {themeMode === 'amongus' && <div className="amongus-hazard-bar" aria-hidden="true" />}

          <div className="stage-grid">
            {visibleMenuItems.map((item, idx) => {
              const override =
                themeMode === 'fnaf' && item.id in FNAF_MENU_OVERRIDES
                  ? FNAF_MENU_OVERRIDES[item.id as MenuGameId]
                  : themeMode === 'amongus' && item.id in AMONGUS_MENU_OVERRIDES
                    ? AMONGUS_MENU_OVERRIDES[item.id as MenuGameId]
                    : null;
              const emoji = override ? override.emoji : item.emoji;
              let label = override ? override.name : item.name;
              let sub = override ? override.desc : item.desc;
              if (item.id === 'players') {
                label =
                  themeMode === 'fnaf'
                    ? `Guardias: ${np}`
                    : themeMode === 'amongus'
                      ? `Tripulantes: ${np}`
                      : `Jugadores: ${np}`;
              }
              if (item.id === 'tournament') {
                label = tournamentGoal > 0 ? `Meta: ${tournamentGoal} pts` : 'Modo: Libre';
                sub = tournamentGoal > 0 ? 'Torneo activo' : 'Sin límite';
              }
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setMenuFocusZone('grid');
                    setMenuSel(idx);
                    activateMenuItem(idx);
                  }}
                  className={`stage-card ${item.fnafExclusive ? 'fnaf-exclusive' : ''} ${
                    item.amongusExclusive ? 'amongus-exclusive' : ''
                  } ${menuFocusZone === 'grid' && menuSel === idx ? 'sel' : ''}`}
                >
                  {item.fnafExclusive && <span className="fnaf-ex-tag">EXCLUSIVO</span>}
                  {item.amongusExclusive && <span className="amongus-ex-tag">NAVE</span>}
                  <div className="e">
                    {item.id === 'fnaf_puppet' ? (
                      <img
                        src={puppetCardImg}
                        alt="Caja de Puppet"
                        referrerPolicy="no-referrer"
                        className="mx-auto h-[4.1vh] w-[4.1vh] rounded-[0.75vh] border border-amber-400/50 object-cover shadow-sm"
                      />
                    ) : item.id === 'fnaf_camaras' ? (
                      <div className="mx-auto h-[4.1vh] w-[6.4vh] overflow-hidden rounded-[0.65vh] border border-amber-400/50 bg-black">
                        <FnafCamSceneSvg camId="CAM 1A" actor="freddy" threatPct={25} flashed={false} />
                      </div>
                    ) : item.id === 'au_expulsion' ? (
                      <CrewmateSvg
                        bodyColor="#dc2626"
                        shadeColor="#991b1b"
                        className="mx-auto h-[4.1vh] w-[4.1vh]"
                      />
                    ) : item.id === 'au_admin' ? (
                      <AdminCrewIconSvg className="mx-auto h-[4.1vh] w-[3.6vh]" />
                    ) : item.id === 'au_distribuidor' ? (
                      <DistributorRingBadgeSvg className="mx-auto h-[4.1vh] w-[4.1vh]" />
                    ) : item.id === 'au_comms' ? (
                      <CommsWaveBadgeSvg className="mx-auto h-[3.9vh] w-[5.8vh]" />
                    ) : (
                      emoji
                    )}
                  </div>
                  <div className="t">{label}</div>
                  <div className="d">{sub}</div>
                </div>
              );
            })}
          </div>

          <div className="stage-chips">
            {activePlayers.map((p, i) => {
              const isLeader = topScore > 0 && p.pts === topScore;
              const pct = tournamentGoal > 0 ? Math.min(100, Math.round((p.pts / tournamentGoal) * 100)) : 0;
              return (
                <span
                  key={p.id}
                  className="stage-chip"
                  style={{background: PLAYER_STAGE_COLORS[i % PLAYER_STAGE_COLORS.length]}}
                >
                  {isLeader ? '👑 ' : ''}
                  {p.name}: {p.pts}
                  {tournamentGoal > 0 ? `/${tournamentGoal}` : ''}
                  {tournamentGoal > 0 && <span className="stage-chip-bar" style={{width: `${pct}%`}} />}
                </span>
              );
            })}
          </div>
          <div className="stage-legend">
            {phoneRinging && themeMode === 'fnaf'
              ? `¡Suena el teléfono (${phoneSecondsLeft}s)! Contesta con ▲ + OK o todos pierden -2 pts`
              : auAlertActive && themeMode === 'amongus'
                ? `¡Shapeshifter detectado (${auAlertSecondsLeft}s)! Entra con ▲ + OK o todos pierden -2 pts`
                : '◀▶▲▼ Mover · OK Seleccionar · Atrás Volver'}
          </div>
        </div>
      )}

      {/* APARTADO SELECTOR DE MODO / TEMÁTICA */}
      {isMainMenu && showModeModal && (
        <div
          className="stage-ach-overlay cursor-pointer"
          onClick={() => {
            playControlClick();
            setShowModeModal(false);
          }}
        >
          <div className="stage-mode-panel" onClick={(e) => e.stopPropagation()}>
            <div className="stage-title" style={{fontSize: 'clamp(1.5rem, 4.2vh, 2.5rem)'}}>
              🎨 ELEGIR MODO DE JUEGO
            </div>
            <div className="stage-subt" style={{marginBottom: 0}}>
              Cada modo cambia texturas, temática y agrega juegos exclusivos
            </div>
            <div className="stage-mode-grid">
              <button
                type="button"
                onClick={() => {
                  playControlClick();
                  setModeSel(0);
                  setThemeMode('classic');
                  setShowModeModal(false);
                }}
                className={`stage-mode-card ${modeSel === 0 ? 'sel' : ''}`}
              >
                <div
                  className="stage-mode-preview"
                  style={{
                    background:
                      'radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.35), #0f172a 70%)',
                  }}
                />
                <div className="stage-mode-body">
                  <div className="font-bold text-white text-[2.5vh] leading-tight">
                    📺 Clásico TV Party
                  </div>
                  <div className="text-slate-300 mt-1.5 text-[1.7vh] leading-snug">
                    20 minijuegos originales para toda la familia con estética limpia minimalista.
                  </div>
                  <div className="stage-mode-badge">
                    {themeMode === 'classic' ? '✓ Activo actualmente' : 'OK para activar'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isFnafLocked) {
                    tone(160, 0.14, 'sawtooth', 0.1);
                    return;
                  }
                  playControlClick();
                  setModeSel(1);
                  setThemeMode('fnaf');
                  setShowModeModal(false);
                }}
                className={`stage-mode-card fnaf ${modeSel === 1 ? 'sel' : ''} ${
                  isFnafLocked ? 'opacity-65' : ''
                }`}
              >
                <div
                  className="stage-mode-preview"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(10,8,12,0.2), rgba(10,8,12,0.55)), url(${fnafBgImg})`,
                  }}
                >
                  <div
                    className="absolute bottom-0 inset-x-0 h-[3vh]"
                    style={{
                      backgroundImage: `url(${fnafTileImg})`,
                      backgroundSize: 'auto 6vh',
                      backgroundRepeat: 'repeat-x',
                      borderTop: '0.2vh solid rgba(245, 158, 11, 0.45)',
                    }}
                  />
                </div>
                <div className="stage-mode-body">
                  <div className="font-bold text-white text-[2.5vh] leading-tight">
                    🐻 Pizzería FNAF
                  </div>
                  <div className="text-slate-300 mt-1.5 text-[1.7vh] leading-snug">
                    Texturas CRT, 15 minijuegos clásicos/IA tematizados + 7 juegos EXCLUSIVOS de FNAF (Cámaras, Puppet y más).
                  </div>
                  <div className="stage-mode-badge">
                    {isFnafLocked
                      ? `🔒 Bloqueado por Balloon Boy (${formatLockTime(fnafLockRemainingSec)})`
                      : themeMode === 'fnaf'
                        ? '✓ Activo actualmente'
                        : 'OK para activar'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isAuLocked) {
                    tone(160, 0.14, 'sawtooth', 0.1);
                    return;
                  }
                  playControlClick();
                  setModeSel(2);
                  setThemeMode('amongus');
                  setShowModeModal(false);
                }}
                className={`stage-mode-card amongus ${modeSel === 2 ? 'sel' : ''} ${
                  isAuLocked ? 'opacity-65' : ''
                }`}
              >
                <div
                  className="stage-mode-preview"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(4,12,24,0.18), rgba(4,12,24,0.58)), url(${amongusBgImg})`,
                  }}
                >
                  <div className="absolute right-[1vw] top-[1.2vh] flex items-center gap-[0.6vw]">
                    <CrewmateSvg bodyColor="#dc2626" shadeColor="#991b1b" className="h-[6.2vh] w-[6.2vh]" />
                    <EmergencyButtonSvg className="h-[5.4vh] w-[5.4vh]" />
                  </div>
                  <div
                    className="absolute bottom-0 inset-x-0 h-[3vh]"
                    style={{
                      backgroundImage: `url(${amongusTileImg})`,
                      backgroundSize: 'auto 6vh',
                      backgroundRepeat: 'repeat-x',
                      borderTop: '0.2vh solid rgba(34, 211, 238, 0.45)',
                    }}
                  />
                </div>
                <div className="stage-mode-body">
                  <div className="font-bold text-white text-[2.4vh] leading-tight">
                    🚀 Nave Among Us
                  </div>
                  <div className="text-slate-300 mt-1.5 text-[1.65vh] leading-snug">
                    Estación espacial Skeld, 15 minijuegos tematizados + 6 tareas EXCLUSIVAS (Reunión, Mapa Admin, Tareas Falsas, Luces y más).
                  </div>
                  <div className="stage-mode-badge">
                    {isAuLocked
                      ? `🔒 Bloqueado por Shapeshifter (${formatLockTime(auLockRemainingSec)})`
                      : themeMode === 'amongus'
                        ? '✓ Activo actualmente'
                        : 'OK para activar'}
                  </div>
                </div>
              </button>
            </div>
            <div className="stage-hint" style={{marginTop: '2.4vh'}}>
              ◀▶ Elegir modo · OK Aplicar · Atrás Cancelar
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE LOGROS */}
      {isMainMenu && showAchievementsModal && (
        <div
          className="stage-ach-overlay cursor-pointer"
          onClick={() => {
            playControlClick();
            setShowAchievementsModal(false);
          }}
        >
          <div className="stage-ach-panel" onClick={(e) => e.stopPropagation()}>
            <div className="stage-title" style={{fontSize: 'clamp(1.5rem, 4.2vh, 2.5rem)'}}>
              🏅 LOGROS DE LA CASA ({unlockedCount}/{ACHIEVEMENTS_LIST.length})
            </div>
            <div className="stage-subt" style={{marginBottom: 0}}>
              Partidas jugadas: {achievements.totalMatches} · Mejor racha: {achievements.bestStreak} ·
              Torneos ganados: {achievements.tournamentsWon}
            </div>
            <div className="stage-ach-grid">
              {ACHIEVEMENTS_LIST.map((ach) => {
                const isUnlocked = Boolean(achievements.unlocked[ach.id]);
                return (
                  <div
                    key={ach.id}
                    className={`stage-ach-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                  >
                    <div className="text-[4.2vh] leading-none">{isUnlocked ? ach.emoji : '🔒'}</div>
                    <div className="font-bold text-white mt-2 text-[2.1vh] leading-tight">
                      {ach.title}
                    </div>
                    <div className="text-slate-300 mt-1 text-[1.5vh] leading-snug">{ach.desc}</div>
                  </div>
                );
              })}
            </div>
            <div className="stage-hint" style={{marginTop: '2.4vh'}}>
              Presiona OK o Atrás para volver al menú
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ACTUALIZACIÓN DIRECTA EN EL TV (ESTILO XUPER TV) */}
      {isMainMenu && showUpdateModal && (
        <div
          className="stage-ach-overlay cursor-pointer"
          onClick={() => {
            if (updatePhase === 'downloading') return;
            playControlClick();
            setShowUpdateModal(false);
          }}
        >
          <div
            className="stage-mode-panel max-w-[42rem]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[6.2vh] leading-none">
              {updatePhase === 'available'
                ? '🚀'
                : updatePhase === 'downloading'
                  ? '⬇️'
                  : updatePhase === 'needs_permission'
                    ? '🔐'
                    : updatePhase === 'error'
                      ? '⚠️'
                      : '📺'}
            </div>
            <div className="stage-title mt-2" style={{fontSize: 'clamp(1.5rem, 4vh, 2.35rem)'}}>
              {updatePhase === 'available'
                ? '¡ACTUALIZACIÓN DISPONIBLE!'
                : updatePhase === 'downloading'
                  ? 'DESCARGANDO ACTUALIZACIÓN'
                  : updatePhase === 'needs_permission'
                    ? 'PERMISO EN ANDROID TV'
                    : updatePhase === 'checking'
                      ? 'BUSCANDO ACTUALIZACIONES'
                      : 'ACTUALIZADOR TV'}
            </div>

            <div className="mt-2 text-[2.2vh] font-bold text-cyan-300">
              {availableUpdate
                ? `v${tvVersionInfo?.versionName || '1.0.0'}  →  v${availableUpdate.versionName}`
                : `Versión instalada: v${tvVersionInfo?.versionName || '1.0.0'}`}
            </div>

            <div className="mt-3 rounded-[1.4vh] border border-white/10 bg-slate-900/80 px-5 py-4 text-[2vh] leading-snug text-slate-200">
              {updatePhase === 'checking'
                ? 'Revisando si hay una versión más nueva...'
                : updateMessage || 'Listo para comprobar actualizaciones.'}
            </div>

            {updatePhase === 'downloading' && (
              <div className="mt-4">
                <div className="h-[2.4vh] w-full overflow-hidden rounded-[0.8vh] border border-cyan-400/40 bg-slate-950">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-150"
                    style={{width: `${updateProgress}%`}}
                  />
                </div>
                <div className="mt-1.5 text-[2.2vh] font-extrabold text-emerald-300">
                  {updateProgress}%
                </div>
              </div>
            )}

            {updatePhase !== 'downloading' && updatePhase !== 'checking' && (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => void handlePrimaryUpdateAction()}
                  className={`rounded-[1.2vh] border-2 px-6 py-2.5 text-[2.2vh] font-extrabold transition ${
                    updateBtnSel === 0
                      ? 'scale-105 border-white bg-emerald-500 text-slate-950 shadow-[0_0_2vh_rgba(16,185,129,0.55)]'
                      : 'border-emerald-400/40 bg-emerald-950/70 text-emerald-200'
                  }`}
                >
                  {updatePhase === 'available'
                    ? 'Actualizar ahora'
                    : updatePhase === 'needs_permission'
                      ? 'Instalar / Dar permiso'
                      : updatePhase === 'web_only'
                        ? 'Entendido'
                        : 'Buscar de nuevo'}
                </button>
                {updatePhase !== 'web_only' && (
                  <button
                    type="button"
                    onClick={() => {
                      playControlClick();
                      setShowUpdateModal(false);
                    }}
                    className={`rounded-[1.2vh] border-2 px-6 py-2.5 text-[2.2vh] font-bold transition ${
                      updateBtnSel === 1
                        ? 'scale-105 border-white bg-slate-700 text-white shadow-[0_0_1.6vh_rgba(255,255,255,0.25)]'
                        : 'border-white/15 bg-slate-900/80 text-slate-300'
                    }`}
                  >
                    Más tarde
                  </button>
                )}
              </div>
            )}

            <div className="stage-hint" style={{marginTop: '2.2vh'}}>
              {updatePhase === 'downloading'
                ? 'Espera un momento mientras se descarga directo al TV...'
                : '◀▶ Elegir · OK Confirmar · Atrás Cerrar'}
            </div>
          </div>
        </div>
      )}

      {/* CAMPEÓN FINAL DEL TORNEO */}
      {champion !== null && themeMode === 'amongus' && (
        <AmongUsVictoryScreen
          goal={champion.goal}
          winnerNames={champion.winnerNames}
          standings={champion.standings}
          lockRemainingSec={championLockSec}
          onStartNewTournament={startNewTournament}
        />
      )}
      {champion !== null && themeMode !== 'amongus' && (
        <div className="stage-c cursor-pointer" onClick={startNewTournament}>
          <ConfettiBurst intense />
          <div className="text-[18vh] leading-none">🏆</div>
          <div className="stage-sub" style={{opacity: 0.9}}>
            Meta de {champion.goal} puntos alcanzada
          </div>
          <div className="stage-big" style={{fontSize: '8.5vh', marginTop: '1vh'}}>
            {champion.winnerNames.length > 1
              ? `¡EMPATE CAMPEÓN: ${champion.winnerNames.join(' y ')}!`
              : `¡CAMPEÓN: ${champion.winnerNames[0]}!`}
          </div>
          <div className="space-y-1.5 mt-4">
            {champion.standings.map((row, idx) => (
              <div
                key={`champ-${idx}-${row.idx}`}
                className="font-bold"
                style={{fontSize: idx === 0 ? '4.5vh' : '3.3vh', opacity: idx === 0 ? 1 : 0.85}}
              >
                {idx + 1}. {row.name} — {row.pts} pts
              </div>
            ))}
          </div>
          <div className="stage-hint">
            OK: nuevo torneo (reiniciar puntos) · ▲: seguir jugando sin borrar puntos
          </div>
        </div>
      )}

      {/* PODIO DE PARTIDA */}
      {podium !== null && champion === null && (
        <div
          className="stage-c cursor-pointer"
          onClick={() => {
            if (podium.tournamentReached && tournamentGoal > 0) {
              openChampionScreen(playersRef.current, tournamentGoal);
            } else {
              tone(380, 0.05);
              goMenu();
            }
          }}
        >
          <ConfettiBurst />
          <div className="stage-big" style={{fontSize: '8.5vh', marginBottom: '2vh'}}>
            {podium.title}
          </div>
          <div className="space-y-2">
            {podium.rankIndices.map((pIdx, rankPos) => (
              <div
                key={`podium-${rankPos}-${pIdx}`}
                className="font-bold"
                style={{
                  fontSize: '4.8vh',
                  color: PLAYER_STAGE_COLORS[pIdx % PLAYER_STAGE_COLORS.length],
                }}
              >
                {rankPos + 1}. {activePlayers[pIdx]?.name} — {podium.lines[rankPos]}{' '}
                <small className="text-white/85 text-[3vh]">
                  +{podium.ptsGiven[rankPos]}
                </small>
              </div>
            ))}
          </div>
          {podium.tournamentReached ? (
            <>
              <div className="stage-sub text-[#fde047]" style={{marginTop: '3vh'}}>
                🏆 ¡Alguien alcanzó la meta de {tournamentGoal} puntos!
              </div>
              <div className="stage-hint">OK: ver ganador final del torneo</div>
            </>
          ) : (
            <div className="stage-hint">OK: menú · ▲: jugar otra vez</div>
          )}
        </div>
      )}

      {/* JUEGOS ACTIVOS */}
      {podium === null && champion === null && activeGame === 'bomba' && (
        <BombaStage key={`bomba-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'reflejos' && (
        <ReflejosStage key={`reflejos-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'simon' && (
        <SimonStage key={`simon-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'machaca' && (
        <MachacaStage key={`machaca-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'punteria' && (
        <PunteriaStage key={`punteria-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'reloj' && (
        <RelojCiegoStage key={`reloj-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'memoria' && (
        <MemoriaStage key={`memoria-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'semaforo' && (
        <SemaforoStage key={`semaforo-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'colores' && (
        <ColoresStage key={`colores-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'flechas' && (
        <FlechasStage key={`flechas-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'fnaf_oficina' && (
        <FnafOficinaStage key={`fnaf_oficina-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'fnaf_pirate' && (
        <FnafPirateCoveStage key={`fnaf_pirate-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'fnaf_puppet' && (
        <FnafPuppetStage key={`fnaf_puppet-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'fnaf_springtrap' && (
        <FnafSpringtrapStage key={`fnaf_springtrap-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'fnaf_closet' && (
        <FnafClosetStage key={`fnaf_closet-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'fnaf_salvage' && (
        <FnafSalvageStage key={`fnaf_salvage-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'fnaf_camaras' && (
        <FnafCamarasStage key={`fnaf_camaras-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'fnaf_balloon_boy' && (
        <FnafBalloonBoyStage
          key={`fnaf_balloon_boy-${gameRunKey}`}
          {...commonProps}
          onFnafLockout={handleFnafLockout}
        />
      )}
      {podium === null && champion === null && activeGame === 'au_expulsion' && (
        <AuExpulsionStage key={`au_expulsion-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'au_admin' && (
        <AuAdminStage key={`au_admin-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'au_falsa' && (
        <AuFalsaStage key={`au_falsa-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'au_luces' && (
        <AuLucesStage key={`au_luces-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'au_distribuidor' && (
        <AuDistribuidorStage key={`au_distribuidor-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'au_comms' && (
        <AuCommsStage key={`au_comms-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'au_shapeshifter' && (
        <AuShapeshifterStage
          key={`au_shapeshifter-${gameRunKey}`}
          {...commonProps}
          onAuLockout={handleAuLockout}
        />
      )}
      {podium === null && champion === null && activeGame === 'ruleta' && (
        <RuletaIaStage
          key={`ruleta-${gameRunKey}`}
          {...commonProps}
          onAwardSingle={handleAwardSingle}
        />
      )}
      {podium === null && champion === null && activeGame === 'trivia' && (
        <TriviaIaStage key={`trivia-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'impostor' && (
        <ImpostorIaStage key={`impostor-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'dilema' && (
        <DilemaIaStage key={`dilema-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'probable' && (
        <MasProbableIaStage key={`probable-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'yonunca' && (
        <YoNuncaIaStage key={`yonunca-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'emoji' && (
        <EmojiIaStage key={`emoji-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'pistas' && (
        <PistasIaStage key={`pistas-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'verdad' && (
        <VerdadMitoIaStage key={`verdad-${gameRunKey}`} {...commonProps} />
      )}
      {podium === null && champion === null && activeGame === 'historia' && (
        <HistoriaIaStage key={`historia-${gameRunKey}`} {...commonProps} />
      )}
    </div>
  );
}
