let audioCtx: AudioContext | null = null;
let clickBuffer: AudioBuffer | null = null;
let clickLoading = false;
let clickPool: HTMLAudioElement[] = [];
let clickPoolIdx = 0;

const MINECRAFT_CLICK_SRC = '/assets/aistudio/minecraft_click_a1dac909.mp3';

function getAudioCtx(): AudioContext | null {
  try {
    const AudioCtor =
      window.AudioContext ||
      (window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
    if (!AudioCtor) return null;
    audioCtx = audioCtx ?? new AudioCtor();
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function preloadControlClick() {
  if (typeof window === 'undefined') return;
  if (clickPool.length === 0) {
    clickPool = Array.from({length: 4}, () => {
      const a = new Audio(MINECRAFT_CLICK_SRC);
      a.preload = 'auto';
      a.volume = 0.75;
      return a;
    });
  }
  const ctx = getAudioCtx();
  if (!ctx || clickBuffer || clickLoading) return;
  clickLoading = true;
  fetch(MINECRAFT_CLICK_SRC)
    .then((r) => r.arrayBuffer())
    .then((buf) => ctx.decodeAudioData(buf))
    .then((decoded) => {
      clickBuffer = decoded;
    })
    .catch(() => {
      clickLoading = false;
    });
}

export function playControlClick() {
  try {
    const ctx = getAudioCtx();
    if (ctx && clickBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = clickBuffer;
      const g = ctx.createGain();
      g.gain.value = 0.85;
      src.connect(g);
      g.connect(ctx.destination);
      src.start(0);
      return;
    }
    preloadControlClick();
    const audio = clickPool[clickPoolIdx % Math.max(1, clickPool.length)];
    clickPoolIdx++;
    if (audio) {
      audio.currentTime = 0;
      void audio.play().catch(() => {});
    }
  } catch {
    // ignore audio restrictions
  }
}

export function tone(
  freq: number,
  durationSec = 0.15,
  type: OscillatorType = 'square',
  volume = 0.08,
) {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationSec);
  } catch {
    // ignore audio restrictions
  }
}

export const PLAYER_STAGE_COLORS = [
  '#ef4444', // Rojo
  '#3b82f6', // Azul
  '#16a34a', // Verde
  '#d97706', // Ámbar
  '#7c3aed', // Violeta
  '#0891b2', // Cian
];

export type RemoteKey = 'up' | 'down' | 'left' | 'right' | 'ok' | 'back';

export interface StagePlayer {
  id: number;
  name: string;
  pts: number;
}

export type ThemeMode = 'classic' | 'fnaf' | 'amongus';

export interface StageGameProps {
  players: StagePlayer[];
  onFinish: (
    title: string,
    rankIndices: number[],
    lines: string[],
    onAgain: () => void,
    customPtsGiven?: number[],
  ) => void;
  onExit: () => void;
  registerKeyHandler: (handler: ((k: RemoteKey) => void) | null) => void;
  setBg: (bg: string) => void;
  themeMode?: ThemeMode;
}
