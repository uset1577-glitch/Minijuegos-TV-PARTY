export type GameScreenId =
  | 'GAME_WHEEL'
  | 'GAME_TRIVIA'
  | 'GAME_IMPOSTOR'
  | 'GAME_BOMB'
  | 'GAME_DILEMMA'
  | 'GAME_EMOJI_MOVIE'
  | 'GAME_CHARADES'
  | 'GAME_TRUE_FALSE'
  | 'GAME_STORY'
  | 'GAME_REACTION'
  | 'GAME_BLIND_TIMER'
  | 'GAME_MATH'
  | 'GAME_RPS'
  | 'GAME_SIMON'
  | 'GAME_CODEBREAK'
  | 'GAME_MEMORY';

export type AppScreen =
  | 'HOME'
  | 'PLAYERS'
  | 'LEADERBOARD'
  | 'APK_GUIDE'
  | GameScreenId;

export type GameCategory = 'Todos' | 'Con IA' | 'Reflejos' | 'Grupo' | 'Mente';

export interface PlayerColor {
  id: string;
  name: string;
  hex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

export interface Player {
  id: string;
  name: string;
  colorId: string;
  score: number;
}

export interface ChallengeResult {
  title: string;
  challenge: string;
  twist: string;
  points: number;
  durationSec: number;
  category: string;
}

export interface TriviaQuestion {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export interface ImpostorRound {
  category: string;
  secretWord: string;
  impostorHint: string;
  starterQuestion: string;
}

export interface BombPrompt {
  prompt: string;
  example: string;
}

export interface DilemmaItem {
  scenario: string;
  optionA: string;
  optionB: string;
  debateTip: string;
}

export interface EmojiPuzzle {
  emojis: string;
  options: [string, string, string, string];
  correctIndex: number;
  hint: string;
}

export interface ClueCard {
  answer: string;
  category: string;
  clues: [string, string, string];
  forbiddenWords: [string, string, string];
  options: [string, string, string, string];
}

export interface TrueFalseStatement {
  statement: string;
  isTrue: boolean;
  explanation: string;
}

export interface MostLikelyPrompt {
  question: string;
  funComment: string;
}

export interface NeverHaveIStatement {
  statement: string;
  category: string;
  followUp: string;
}

export const PLAYER_COLORS: PlayerColor[] = [
  {
    id: 'sky',
    name: 'Azul',
    hex: '#38BDF8',
    bgClass: 'bg-sky-500/15',
    borderClass: 'border-sky-400/50',
    textClass: 'text-sky-300',
  },
  {
    id: 'emerald',
    name: 'Menta',
    hex: '#34D399',
    bgClass: 'bg-emerald-500/15',
    borderClass: 'border-emerald-400/50',
    textClass: 'text-emerald-300',
  },
  {
    id: 'indigo',
    name: 'Índigo',
    hex: '#818CF8',
    bgClass: 'bg-indigo-500/15',
    borderClass: 'border-indigo-400/50',
    textClass: 'text-indigo-300',
  },
  {
    id: 'rose',
    name: 'Coral',
    hex: '#FB7185',
    bgClass: 'bg-rose-500/15',
    borderClass: 'border-rose-400/50',
    textClass: 'text-rose-300',
  },
  {
    id: 'teal',
    name: 'Turquesa',
    hex: '#2DD4BF',
    bgClass: 'bg-teal-500/15',
    borderClass: 'border-teal-400/50',
    textClass: 'text-teal-300',
  },
  {
    id: 'slate',
    name: 'Plata',
    hex: '#CBD5E1',
    bgClass: 'bg-slate-400/15',
    borderClass: 'border-slate-300/50',
    textClass: 'text-slate-200',
  },
];

export const QUICK_PLAYER_NAMES = [
  'Jugador 1',
  'Jugador 2',
  'Sofía',
  'Mateo',
  'Valen',
  'Leo',
  'Camila',
  'Lucas',
  'Capitán',
  'Chef',
  'Ninja',
  'Invitado',
];

export interface MinigameCardInfo {
  id: GameScreenId;
  title: string;
  subtitle: string;
  playersRange: string;
  category: Exclude<GameCategory, 'Todos'>;
  usesAi: boolean;
  iconName:
    | 'Disc3'
    | 'HelpCircle'
    | 'UserX'
    | 'Timer'
    | 'Scale'
    | 'Film'
    | 'Lightbulb'
    | 'CheckSquare'
    | 'BookOpen'
    | 'Zap'
    | 'EyeOff'
    | 'Calculator'
    | 'Hand'
    | 'Grid2x2'
    | 'KeyRound'
    | 'Layers';
}

export const MINIGAMES: MinigameCardInfo[] = [
  {
    id: 'GAME_WHEEL',
    title: 'Ruleta de Retos',
    subtitle: 'Gira el selector y cumple retos inéditos creados por IA.',
    playersRange: '1–6 jug.',
    category: 'Con IA',
    usesAi: true,
    iconName: 'Disc3',
  },
  {
    id: 'GAME_TRIVIA',
    title: 'Trivia Relámpago',
    subtitle: 'Preguntas contrarreloj sobre cualquier tema al instante.',
    playersRange: '1–6 jug.',
    category: 'Con IA',
    usesAi: true,
    iconName: 'HelpCircle',
  },
  {
    id: 'GAME_IMPOSTOR',
    title: 'El Impostor',
    subtitle: 'Pasa el control para ver tu palabra y descubre quién miente.',
    playersRange: '3–6 jug.',
    category: 'Grupo',
    usesAi: true,
    iconName: 'UserX',
  },
  {
    id: 'GAME_BOMB',
    title: 'Papa Caliente',
    subtitle: 'Di una palabra válida y presiona OK para pasar el mando.',
    playersRange: '1–6 jug.',
    category: 'Grupo',
    usesAi: true,
    iconName: 'Timer',
  },
  {
    id: 'GAME_DILEMMA',
    title: 'Dilema del Sofá',
    subtitle: '¿Qué prefieres? Decisiones imposibles para debatir en grupo.',
    playersRange: '1–6 jug.',
    category: 'Grupo',
    usesAi: true,
    iconName: 'Scale',
  },
  {
    id: 'GAME_EMOJI_MOVIE',
    title: 'Cine en Emojis',
    subtitle: 'Descifra películas, series o canciones solo con emojis.',
    playersRange: '1–6 jug.',
    category: 'Con IA',
    usesAi: true,
    iconName: 'Film',
  },
  {
    id: 'GAME_CHARADES',
    title: 'Tres Pistas',
    subtitle: 'Adivina el concepto secreto usando pistas progresivas o Tabú.',
    playersRange: '1–6 jug.',
    category: 'Con IA',
    usesAi: true,
    iconName: 'Lightbulb',
  },
  {
    id: 'GAME_TRUE_FALSE',
    title: 'Verdad o Mito',
    subtitle: 'Distingue hechos reales asombrosos de mentiras creíbles.',
    playersRange: '1–6 jug.',
    category: 'Con IA',
    usesAi: true,
    iconName: 'CheckSquare',
  },
  {
    id: 'GAME_STORY',
    title: 'Historia en Cadena',
    subtitle: 'Elijan giros absurdos por turnos y lean el final de la IA.',
    playersRange: '1–6 jug.',
    category: 'Grupo',
    usesAi: true,
    iconName: 'BookOpen',
  },
  {
    id: 'GAME_REACTION',
    title: 'Luz Verde',
    subtitle: 'Mide tus reflejos en milisegundos al aparecer la señal.',
    playersRange: '1–6 jug.',
    category: 'Reflejos',
    usesAi: false,
    iconName: 'Zap',
  },
  {
    id: 'GAME_BLIND_TIMER',
    title: 'Reloj Ciego',
    subtitle: 'Detén el cronómetro oculto lo más cerca posible de 5.00 s.',
    playersRange: '1–6 jug.',
    category: 'Reflejos',
    usesAi: false,
    iconName: 'EyeOff',
  },
  {
    id: 'GAME_MATH',
    title: 'Cálculo Exprés',
    subtitle: 'Resuelve operaciones rápidas antes de que baje el tiempo.',
    playersRange: '1–6 jug.',
    category: 'Mente',
    usesAi: false,
    iconName: 'Calculator',
  },
  {
    id: 'GAME_RPS',
    title: 'Duelo Secreto',
    subtitle: 'Piedra, papel o tijera pasando el control sin que nadie vea.',
    playersRange: '1–6 jug.',
    category: 'Reflejos',
    usesAi: false,
    iconName: 'Hand',
  },
  {
    id: 'GAME_SIMON',
    title: 'Secuencia Simón',
    subtitle: 'Memoriza y repite el orden con las flechas del control.',
    playersRange: '1–6 jug.',
    category: 'Mente',
    usesAi: false,
    iconName: 'Grid2x2',
  },
  {
    id: 'GAME_CODEBREAK',
    title: 'Código Oculto',
    subtitle: 'Encuentra el número secreto usando pistas de mayor o menor.',
    playersRange: '1–6 jug.',
    category: 'Mente',
    usesAi: false,
    iconName: 'KeyRound',
  },
  {
    id: 'GAME_MEMORY',
    title: 'Pares en Mesa',
    subtitle: 'Tablero de 12 fichas para encontrar parejas por turnos.',
    playersRange: '1–6 jug.',
    category: 'Mente',
    usesAi: false,
    iconName: 'Layers',
  },
];

export function getPlayerColor(colorId: string): PlayerColor {
  return PLAYER_COLORS.find((c) => c.id === colorId) ?? PLAYER_COLORS[0];
}
