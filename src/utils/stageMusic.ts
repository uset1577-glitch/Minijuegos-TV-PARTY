// Motor de música 8-bit / chiptune en Web Audio API (sin archivos externos, 100% compatible con TV y APK)

export type MusicTrackId =
  | 'menu'
  | 'menu_fnaf'
  | 'menu_amongus'
  | 'bomba'
  | 'reflejos'
  | 'simon'
  | 'simon_fnaf'
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
  | 'probable'
  | 'yonunca'
  | 'emoji'
  | 'pistas'
  | 'verdad'
  | 'historia'
  | 'fnaf_oficina'
  | 'fnaf_pirate'
  | 'fnaf_puppet'
  | 'fnaf_springtrap'
  | 'fnaf_closet'
  | 'fnaf_salvage'
  | 'fnaf_camaras'
  | 'au_admin'
  | 'au_falsa'
  | 'au_luces'
  | 'au_distribuidor'
  | 'au_expulsion'
  | 'au_comms'
  | 'au_alarma'
  | 'au_shapeshifter'
  | 'podium'
  | 'champion'
  | 'champion_amongus'
  | 'none';

interface TrackDef {
  bpm: number;
  leadWave: OscillatorType;
  bassWave: OscillatorType;
  filterHz: number;
  drumStyle: 'bossa' | 'pulse' | 'arcade' | 'soft' | 'march';
  volume: number;
  // 16 o 32 pasos en corcheas/semicorcheas; 0 = silencio, número = frecuencia Hz
  lead: number[];
  bass: number[];
  chords?: number[][]; // acordes opcionales por paso
}

// Notas útiles (Hz)
const N = {
  _: 0,
  G2: 98.0,
  A2: 110.0,
  Bb2: 116.54,
  B2: 123.47,
  C3: 130.81,
  Cs3: 138.59,
  D3: 146.83,
  Eb3: 155.56,
  E3: 164.81,
  F3: 174.61,
  Fs3: 185.0,
  G3: 196.0,
  Ab3: 207.65,
  A3: 220.0,
  Bb3: 233.08,
  B3: 246.94,
  C4: 261.63,
  Cs4: 277.18,
  D4: 293.66,
  Eb4: 311.13,
  E4: 329.63,
  F4: 349.23,
  Fs4: 369.99,
  G4: 392.0,
  Ab4: 415.3,
  A4: 440.0,
  Bb4: 466.16,
  B4: 493.88,
  C5: 523.25,
  Cs5: 554.37,
  D5: 587.33,
  Eb5: 622.25,
  E5: 659.25,
  F5: 698.46,
  Fs5: 739.99,
  G5: 783.99,
  A5: 880.0,
  Bb5: 932.33,
  B5: 987.77,
};

// "Elevator Jam" (estilo Bossa-Lounge 8-bit inspirado en música de elevador)
// Progresión clásica de elevador Dm9 -> G13 -> Cmaj9 -> A7 en clave bossa de 32 pasos
const ELEVATOR_JAM: TrackDef = {
  bpm: 136,
  leadWave: 'triangle',
  bassWave: 'triangle',
  filterHz: 2100,
  drumStyle: 'bossa',
  volume: 0.72,
  bass: [
    N.D3, N._, N._, N.A3, N.D3, N._, N.A3, N._,
    N.G3, N._, N._, N.D3, N.G3, N._, N.D3, N._,
    N.C3, N._, N._, N.G3, N.C3, N._, N.G3, N._,
    N.A2, N._, N._, N.E3, N.A2, N._, N.Cs3, N._,
  ],
  lead: [
    N.F5, N._, N.E5, N.D5, N._, N.C5, N.A4, N._,
    N.B4, N._, N.D5, N.F5, N._, N.E5, N.D5, N._,
    N.E5, N._, N.D5, N.C5, N._, N.B4, N.G4, N._,
    N.A4, N.C5, N.E5, N._, N.G5, N._, N.E5, N._,
  ],
  chords: [
    [N.F4, N.A4, N.C5, N.E5], [], [], [N.F4, N.A4, N.C5], [], [], [N.F4, N.A4, N.C5], [],
    [N.F4, N.B4, N.D5, N.E5], [], [], [N.F4, N.B4, N.D5], [], [], [N.F4, N.B4, N.D5], [],
    [N.E4, N.G4, N.B4, N.D5], [], [], [N.E4, N.G4, N.B4], [], [], [N.E4, N.G4, N.B4], [],
    [N.G4, N.Cs5, N.E5], [], [], [N.G4, N.Bb4, N.Cs5], [], [], [N.G4, N.Cs5, N.E5], [],
  ],
};

const TRACKS: Record<
  Exclude<MusicTrackId, 'none' | 'simon_fnaf' | 'au_alarma' | 'champion_amongus'>,
  TrackDef
> = {
  menu: ELEVATOR_JAM,
  menu_fnaf: ELEVATOR_JAM,
  menu_amongus: {
    // Pulso espacial misterioso estilo nave Skeld
    bpm: 112,
    leadWave: 'sine',
    bassWave: 'triangle',
    filterHz: 1150,
    drumStyle: 'soft',
    volume: 0.42,
    bass: [
      N.C3, N._, N._, N.G3, N._, N._, N.Eb3, N._,
      N.C3, N._, N._, N.G3, N._, N._, N.B2, N._,
    ],
    lead: [
      N.G4, N._, N.Eb4, N._, N.C5, N._, N.B4, N._,
      N.G4, N._, N.F4, N._, N.Eb4, N._, N.D4, N._,
    ],
    chords: [
      [N.C4, N.Eb4, N.G4], [], [], [], [N.Ab3, N.C4, N.Eb4], [], [], [],
      [N.F3, N.Ab3, N.C4], [], [], [], [N.G3, N.B3, N.D4], [], [], [],
    ],
  },

  bomba: {
    bpm: 150,
    leadWave: 'square',
    bassWave: 'sawtooth',
    filterHz: 1500,
    drumStyle: 'pulse',
    volume: 0.55,
    bass: [N.E3, N.E3, N.G3, N.E3, N.A3, N.E3, N.B3, N.G3, N.E3, N.E3, N.G3, N.E3, N.C4, N.B3, N.A3, N.G3],
    lead: [N.E5, N._, N.G5, N._, N.Fs5, N._, N.E5, N._, N.D5, N._, N.E5, N.G5, N.A5, N._, N.G5, N._],
  },

  reflejos: {
    bpm: 146,
    leadWave: 'square',
    bassWave: 'triangle',
    filterHz: 1700,
    drumStyle: 'arcade',
    volume: 0.5,
    bass: [N.C3, N._, N.C4, N._, N.G3, N._, N.C3, N._, N.F3, N._, N.G3, N._, N.C3, N._, N.G3, N._],
    lead: [N.C5, N.E5, N.G5, N._, N.A5, N.G5, N.E5, N._, N.F5, N.D5, N.B4, N.D5, N.C5, N._, N.G4, N._],
  },

  simon: {
    // Suave para no interferir con los tonos del juego Simón
    bpm: 108,
    leadWave: 'sine',
    bassWave: 'triangle',
    filterHz: 1100,
    drumStyle: 'soft',
    volume: 0.25,
    bass: [N.C3, N._, N._, N._, N.G3, N._, N._, N._, N.A3, N._, N._, N._, N.F3, N._, N.G3, N._],
    lead: [N.E4, N._, N._, N.G4, N._, N._, N.C5, N._, N.A4, N._, N._, N.E4, N._, N._, N.D4, N._],
  },

  machaca: {
    bpm: 172,
    leadWave: 'square',
    bassWave: 'square',
    filterHz: 1850,
    drumStyle: 'arcade',
    volume: 0.56,
    bass: [N.A2, N.A3, N.A2, N.A3, N.C3, N.C4, N.C3, N.C4, N.D3, N.D4, N.D3, N.D4, N.E3, N.E4, N.G3, N.E3],
    lead: [N.A4, N.C5, N.E5, N.A5, N.G5, N.E5, N.C5, N.E5, N.D5, N.F5, N.A5, N.F5, N.E5, N.D5, N.B4, N.G4],
  },

  punteria: {
    bpm: 138,
    leadWave: 'triangle',
    bassWave: 'triangle',
    filterHz: 1800,
    drumStyle: 'march',
    volume: 0.56,
    bass: [N.G3, N._, N.D3, N._, N.G3, N._, N.B3, N._, N.C4, N._, N.G3, N._, N.D3, N._, N.Fs3, N._],
    lead: [N.G4, N.B4, N.D5, N._, N.G5, N._, N.D5, N._, N.E5, N.C5, N.A4, N.C5, N.B4, N._, N.G4, N._],
  },

  reloj: {
    bpm: 120,
    leadWave: 'sine',
    bassWave: 'triangle',
    filterHz: 1300,
    drumStyle: 'soft',
    volume: 0.42,
    bass: [N.F3, N._, N.C3, N._, N.F3, N._, N.C3, N._, N.Bb2, N._, N.F3, N._, N.C3, N._, N.G3, N._],
    lead: [N.A4, N._, N.C5, N._, N.F5, N._, N.C5, N._, N.D5, N._, N.Bb4, N._, N.C5, N._, N.G4, N._],
  },

  memoria: {
    bpm: 122,
    leadWave: 'triangle',
    bassWave: 'sine',
    filterHz: 2000,
    drumStyle: 'bossa',
    volume: 0.55,
    bass: [N.C3, N._, N.G3, N._, N.A2, N._, N.E3, N._, N.F3, N._, N.C3, N._, N.G3, N._, N.D3, N._],
    lead: [N.E5, N.G5, N.C5, N._, N.A4, N.C5, N.E5, N._, N.F5, N.D5, N.A4, N._, N.B4, N.D5, N.G5, N._],
  },

  semaforo: {
    bpm: 154,
    leadWave: 'square',
    bassWave: 'sawtooth',
    filterHz: 1750,
    drumStyle: 'pulse',
    volume: 0.54,
    bass: [N.G3, N.G3, N.Bb3, N.G3, N.C4, N.G3, N.D4, N.C4, N.G3, N.G3, N.F3, N.G3, N.Eb3, N.F3, N.D3, N._],
    lead: [N.G5, N._, N.Bb5, N.G5, N.C5, N.D5, N.F5, N._, N.G5, N.F5, N.D5, N.Bb4, N.C5, N._, N.G4, N._],
  },

  colores: {
    bpm: 140,
    leadWave: 'triangle',
    bassWave: 'square',
    filterHz: 1900,
    drumStyle: 'arcade',
    volume: 0.54,
    bass: [N.F3, N._, N.C4, N._, N.D3, N._, N.A3, N._, N.Bb2, N._, N.F3, N._, N.C3, N._, N.G3, N._],
    lead: [N.F5, N.A5, N.C5, N.F5, N.D5, N.F5, N.A4, N.D5, N.Bb4, N.D5, N.F5, N.D5, N.C5, N.E5, N.G5, N._],
  },

  flechas: {
    bpm: 164,
    leadWave: 'square',
    bassWave: 'sawtooth',
    filterHz: 2000,
    drumStyle: 'arcade',
    volume: 0.56,
    bass: [N.E3, N.E4, N.E3, N.E4, N.C3, N.C4, N.C3, N.C4, N.D3, N.D4, N.D3, N.D4, N.B2, N.B3, N.D3, N.B2],
    lead: [N.E5, N.G5, N.B5, N.G5, N.E5, N.C5, N.G5, N.E5, N.D5, N.Fs5, N.A5, N.Fs5, N.B4, N.D5, N.Fs5, N._],
  },

  ruleta: {
    bpm: 132,
    leadWave: 'triangle',
    bassWave: 'triangle',
    filterHz: 2100,
    drumStyle: 'bossa',
    volume: 0.58,
    bass: [N.C3, N._, N.G3, N._, N.E3, N._, N.B3, N._, N.A2, N._, N.E3, N._, N.G3, N._, N.D3, N._],
    lead: [N.G5, N.E5, N.C5, N.E5, N.G5, N._, N.B5, N._, N.A5, N.E5, N.C5, N.A4, N.G4, N.B4, N.D5, N.G5],
  },

  trivia: {
    bpm: 126,
    leadWave: 'triangle',
    bassWave: 'triangle',
    filterHz: 1850,
    drumStyle: 'march',
    volume: 0.52,
    bass: [N.A2, N._, N.E3, N._, N.D3, N._, N.A3, N._, N.E3, N._, N.B3, N._, N.A2, N._, N.E3, N._],
    lead: [N.A4, N.C5, N.E5, N._, N.D5, N.F5, N.A5, N._, N.E5, N.Ab4, N.B4, N.E5, N.A4, N._, N.E4, N._],
  },

  impostor: {
    bpm: 118,
    leadWave: 'sine',
    bassWave: 'triangle',
    filterHz: 1200,
    drumStyle: 'pulse',
    volume: 0.5,
    bass: [N.C3, N._, N.Eb3, N._, N.F3, N._, N.Fs3, N._, N.G3, N._, N.Eb3, N._, N.D3, N._, N.B2, N._],
    lead: [N.G4, N._, N.Ab4, N.G4, N._, N.Eb4, N.C4, N._, N.G4, N._, N.Fs4, N.G4, N._, N.D4, N.B3, N._],
  },

  dilema: {
    bpm: 124,
    leadWave: 'triangle',
    bassWave: 'sine',
    filterHz: 1750,
    drumStyle: 'bossa',
    volume: 0.52,
    bass: [N.G3, N._, N.D3, N._, N.E3, N._, N.B2, N._, N.C3, N._, N.G3, N._, N.D3, N._, N.A2, N._],
    lead: [N.B4, N.D5, N.G5, N._, N.E5, N.B4, N.G4, N._, N.C5, N.E5, N.G5, N._, N.Fs5, N.D5, N.A4, N._],
  },

  probable: {
    bpm: 132,
    leadWave: 'triangle',
    bassWave: 'triangle',
    filterHz: 1950,
    drumStyle: 'bossa',
    volume: 0.55,
    bass: [N.F3, N._, N.C3, N._, N.G3, N._, N.D3, N._, N.A2, N._, N.E3, N._, N.Bb2, N._, N.C3, N._],
    lead: [N.A4, N.C5, N.F5, N._, N.G4, N.B4, N.D5, N._, N.C5, N.E5, N.A5, N._, N.G5, N.F5, N.E5, N._],
  },

  yonunca: {
    bpm: 128,
    leadWave: 'triangle',
    bassWave: 'triangle',
    filterHz: 1900,
    drumStyle: 'bossa',
    volume: 0.54,
    bass: [N.C3, N._, N.G3, N._, N.F3, N._, N.C3, N._, N.G3, N._, N.D3, N._, N.C3, N._, N.G3, N._],
    lead: [N.G4, N.A4, N.C5, N.E5, N.F5, N.D5, N.A4, N._, N.B4, N.D5, N.G5, N.F5, N.E5, N.C5, N.G4, N._],
  },

  emoji: {
    bpm: 134,
    leadWave: 'square',
    bassWave: 'triangle',
    filterHz: 1700,
    drumStyle: 'arcade',
    volume: 0.5,
    bass: [N.Bb2, N._, N.F3, N._, N.G3, N._, N.D3, N._, N.Eb3, N._, N.Bb2, N._, N.F3, N._, N.C3, N._],
    lead: [N.D5, N.F5, N.Bb5, N._, N.G5, N.D5, N.Bb4, N._, N.Eb5, N.G5, N.Bb5, N._, N.A5, N.F5, N.C5, N._],
  },

  pistas: {
    bpm: 122,
    leadWave: 'triangle',
    bassWave: 'triangle',
    filterHz: 1650,
    drumStyle: 'bossa',
    volume: 0.5,
    bass: [N.A2, N._, N.E3, N._, N.C3, N._, N.G3, N._, N.F3, N._, N.C3, N._, N.E3, N._, N.B2, N._],
    lead: [N.E5, N._, N.C5, N.A4, N.G4, N._, N.E4, N._, N.F4, N.A4, N.C5, N.E5, N.D5, N.B4, N.Ab4, N._],
  },

  verdad: {
    bpm: 130,
    leadWave: 'sine',
    bassWave: 'triangle',
    filterHz: 1750,
    drumStyle: 'pulse',
    volume: 0.5,
    bass: [N.D3, N._, N.A3, N._, N.G3, N._, N.D3, N._, N.C3, N._, N.G3, N._, N.A2, N._, N.E3, N._],
    lead: [N.D5, N.A4, N.F5, N.D5, N.B4, N.G4, N.D5, N.B4, N.C5, N.G4, N.E5, N.C5, N.A4, N._, N.Cs5, N._],
  },

  historia: {
    bpm: 114,
    leadWave: 'triangle',
    bassWave: 'triangle',
    filterHz: 1850,
    drumStyle: 'march',
    volume: 0.52,
    bass: [N.G3, N._, N.D3, N._, N.C3, N._, N.G3, N._, N.D3, N._, N.A2, N._, N.G3, N._, N.D3, N._],
    lead: [N.D5, N.G5, N.B5, N.G5, N.E5, N.C5, N.G4, N._, N.Fs4, N.A4, N.D5, N.Fs5, N.G5, N._, N.D5, N._],
  },

  fnaf_oficina: {
    bpm: 126,
    leadWave: 'sine',
    bassWave: 'triangle',
    filterHz: 1150,
    drumStyle: 'pulse',
    volume: 0.48,
    bass: [N.E3, N._, N.G3, N._, N.B2, N._, N.E3, N._, N.C3, N._, N.G3, N._, N.B2, N._, N.Eb3, N._],
    lead: [N.E4, N._, N.G4, N.B4, N._, N.C5, N.B4, N._, N.G4, N._, N.E4, N._, N.Fs4, N._, N.Eb4, N._],
  },

  fnaf_pirate: {
    bpm: 158,
    leadWave: 'square',
    bassWave: 'sawtooth',
    filterHz: 1650,
    drumStyle: 'arcade',
    volume: 0.52,
    bass: [N.D3, N.D4, N.F3, N.D3, N.A2, N.A3, N.C3, N.A2, N.Bb2, N.F3, N.G3, N.D3, N.A2, N.Cs3, N.E3, N._],
    lead: [N.D5, N.F5, N.A5, N.F5, N.E5, N.C5, N.A4, N._, N.Bb4, N.D5, N.G5, N.F5, N.E5, N.Cs5, N.A4, N._],
  },

  fnaf_puppet: {
    // Caja musical estilo Puppet (suave y misteriosa)
    bpm: 116,
    leadWave: 'triangle',
    bassWave: 'sine',
    filterHz: 1800,
    drumStyle: 'soft',
    volume: 0.44,
    bass: [N.A3, N._, N._, N.E3, N._, N._, N.F3, N._, N.C3, N._, N._, N.G3, N._, N._, N.E3, N._],
    lead: [N.E5, N._, N.C5, N.A4, N._, N.E5, N.D5, N._, N.C5, N._, N.A4, N.B4, N._, N.G4, N.E4, N._],
  },

  fnaf_springtrap: {
    bpm: 132,
    leadWave: 'sine',
    bassWave: 'sawtooth',
    filterHz: 1050,
    drumStyle: 'pulse',
    volume: 0.46,
    bass: [N.C3, N._, N.Cs3, N._, N.G2, N._, N.C3, N._, N.F3, N._, N.E3, N._, N.Eb3, N._, N.B2, N._],
    lead: [N.G4, N._, N.Ab4, N.G4, N._, N.Eb4, N.D4, N._, N.F4, N._, N.E4, N.D4, N._, N.B3, N.C4, N._],
  },

  fnaf_closet: {
    // Muy tenue para que el jugador note las alertas de respiración y pasos
    bpm: 108,
    leadWave: 'sine',
    bassWave: 'triangle',
    filterHz: 900,
    drumStyle: 'soft',
    volume: 0.25,
    bass: [N.D3, N._, N._, N._, N.A2, N._, N._, N._, N.Bb2, N._, N._, N._, N.A2, N._, N.Cs3, N._],
    lead: [N.A4, N._, N._, N._, N.F4, N._, N._, N._, N.G4, N._, N._, N._, N.E4, N._, N._, N._],
  },

  fnaf_salvage: {
    bpm: 112,
    leadWave: 'triangle',
    bassWave: 'sine',
    filterHz: 1200,
    drumStyle: 'soft',
    volume: 0.42,
    bass: [N.G3, N._, N.D3, N._, N.Eb3, N._, N.Bb2, N._, N.C3, N._, N.G3, N._, N.D3, N._, N.Fs3, N._],
    lead: [N.D5, N._, N.Bb4, N.G4, N._, N.Eb4, N.G4, N._, N.C5, N._, N.A4, N.Fs4, N._, N.D4, N._, N._],
  },

  fnaf_camaras: {
    bpm: 124,
    leadWave: 'sine',
    bassWave: 'triangle',
    filterHz: 1100,
    drumStyle: 'pulse',
    volume: 0.42,
    bass: [N.A2, N._, N.C3, N._, N.E3, N._, N.A2, N._, N.F3, N._, N.E3, N._, N.D3, N._, N.E3, N._],
    lead: [N.E4, N._, N.A4, N._, N.C5, N.B4, N.A4, N._, N.F4, N._, N.E4, N._, N.D4, N._, N.E4, N._],
  },

  au_admin: {
    bpm: 122,
    leadWave: 'sine',
    bassWave: 'triangle',
    filterHz: 1450,
    drumStyle: 'pulse',
    volume: 0.45,
    bass: [N.D3, N._, N.A3, N._, N.F3, N._, N.C3, N._, N.G3, N._, N.D3, N._, N.A2, N._, N.E3, N._],
    lead: [N.D5, N._, N.F5, N.A5, N._, N.G5, N.E5, N._, N.D5, N._, N.Bb4, N.G4, N._, N.A4, N.Cs5, N._],
  },

  au_falsa: {
    bpm: 118,
    leadWave: 'triangle',
    bassWave: 'triangle',
    filterHz: 1350,
    drumStyle: 'soft',
    volume: 0.44,
    bass: [N.F3, N._, N.C3, N._, N.D3, N._, N.A2, N._, N.Bb2, N._, N.F3, N._, N.C3, N._, N.G3, N._],
    lead: [N.A4, N._, N.C5, N.F5, N._, N.E5, N.D5, N._, N.Bb4, N.D5, N.F5, N._, N.E5, N._, N.C5, N._],
  },

  au_luces: {
    bpm: 134,
    leadWave: 'sine',
    bassWave: 'sawtooth',
    filterHz: 1150,
    drumStyle: 'pulse',
    volume: 0.44,
    bass: [N.E3, N._, N.G3, N._, N.C3, N._, N.B2, N._, N.E3, N._, N.G3, N._, N.D3, N._, N.B2, N._],
    lead: [N.E5, N._, N.B4, N._, N.C5, N.E5, N.B4, N._, N.G4, N._, N.Fs4, N.G4, N._, N.B4, N._, N._],
  },

  au_distribuidor: {
    bpm: 146,
    leadWave: 'square',
    bassWave: 'triangle',
    filterHz: 1750,
    drumStyle: 'arcade',
    volume: 0.48,
    bass: [N.C3, N.C3, N.Eb3, N.C3, N.F3, N.F3, N.Ab3, N.F3, N.G3, N.G3, N.B2, N.G3, N.C3, N.Eb3, N.G3, N._],
    lead: [N.C5, N._, N.Eb5, N.G5, N._, N.F5, N.Eb5, N._, N.D5, N.G5, N.B4, N._, N.C5, N._, N.G4, N._],
  },

  au_expulsion: {
    bpm: 122,
    leadWave: 'sine',
    bassWave: 'triangle',
    filterHz: 1250,
    drumStyle: 'pulse',
    volume: 0.48,
    bass: [N.A2, N._, N.C3, N._, N.E3, N._, N.Eb3, N._, N.D3, N._, N.C3, N._, N.B2, N._, N.E3, N._],
    lead: [N.A4, N._, N.C5, N.E5, N._, N.Eb5, N.C5, N._, N.D5, N._, N.B4, N._, N.A4, N._, N.E4, N._],
  },

  au_comms: {
    bpm: 128,
    leadWave: 'triangle',
    bassWave: 'sine',
    filterHz: 1500,
    drumStyle: 'pulse',
    volume: 0.44,
    bass: [N.G3, N._, N.D3, N._, N.Eb3, N._, N.Bb2, N._, N.C3, N._, N.G3, N._, N.D3, N._, N.Fs3, N._],
    lead: [N.G4, N.Bb4, N.D5, N._, N.Eb5, N.C5, N.G4, N._, N.C5, N.G4, N.Eb4, N._, N.D4, N.Fs4, N.A4, N._],
  },

  au_shapeshifter: {
    bpm: 144,
    leadWave: 'sine',
    bassWave: 'sawtooth',
    filterHz: 1300,
    drumStyle: 'pulse',
    volume: 0.42,
    bass: [N.C3, N._, N.Eb3, N._, N.Fs3, N._, N.G3, N._, N.C3, N._, N.B2, N._, N.Bb2, N._, N.G2, N._],
    lead: [N.G4, N._, N.C5, N.B4, N._, N.Eb5, N.D5, N._, N.G4, N._, N.Fs4, N.G4, N._, N.Eb4, N.D4, N._],
  },

  podium: {
    bpm: 136,
    leadWave: 'triangle',
    bassWave: 'triangle',
    filterHz: 2100,
    drumStyle: 'bossa',
    volume: 0.55,
    bass: [N.C3, N._, N.G3, N._, N.F3, N._, N.C3, N._, N.G3, N._, N.D3, N._, N.C3, N._, N.G3, N._],
    lead: [N.C5, N.E5, N.G5, N.C5, N.F5, N.A5, N.G5, N._, N.D5, N.G5, N.B5, N.G5, N.C5, N._, N.G4, N._],
  },

  champion: {
    bpm: 148,
    leadWave: 'square',
    bassWave: 'triangle',
    filterHz: 2300,
    drumStyle: 'march',
    volume: 0.65,
    bass: [N.C3, N.C3, N.G3, N.C3, N.F3, N.F3, N.C3, N.F3, N.G3, N.G3, N.D3, N.G3, N.C3, N.G3, N.C4, N._],
    lead: [N.C5, N._, N.E5, N.G5, N.A5, N._, N.G5, N.F5, N.G5, N._, N.B5, N.D5, N.C5, N.E5, N.G5, N.C5],
  },
};

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

const ELEVATOR_JAM_MP3 = '/assets/aistudio/elevator_jam_75620cc1.mp3';
const FNAF_MOVIE_MP3 = '/assets/aistudio/fnaf_movie_061132ec.mp3';
const AMONGUS_MENU_MP3 = '/assets/aistudio/among_us_menu_cce6ef59.mp3';
const AMONGUS_ALARMA_MP3 = '/assets/aistudio/among_us_alarma_0087d9c2.mp3';
const AMONGUS_ENDING_MP3 = '/assets/aistudio/among_us_ending_84ff3997.mp3';
const TRILLIUM_HARDTEKK_MP3 = '/assets/aistudio/trillium_hardtekk_00d22fd3.mp3';
const PUPPET_SONG_MP3 = '/assets/aistudio/puppet_808dc018.mp3';

let musicCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let menuAudioEl: HTMLAudioElement | null = null;
let fnafMenuAudioEl: HTMLAudioElement | null = null;
let auMenuAudioEl: HTMLAudioElement | null = null;
let auAlarmaAudioEl: HTMLAudioElement | null = null;
let auEndingAudioEl: HTMLAudioElement | null = null;
let championAudioEl: HTMLAudioElement | null = null;
let puppetAudioEl: HTMLAudioElement | null = null;
let currentTrack: MusicTrackId = 'none';
let musicEnabled = true;
let musicDucked = false;
let stepIdx = 0;
let nextNoteTime = 0;
let timerId: number | null = null;
let unlockBound = false;

const ENABLED_KEY = 'mj_music_v1';

try {
  const saved = localStorage.getItem(ENABLED_KEY);
  if (saved === '0') musicEnabled = false;
} catch {
  // ignore
}

function getMp3Elements() {
  if (typeof window === 'undefined') {
    return {
      menu: null,
      fnafMenu: null,
      auMenu: null,
      auAlarma: null,
      auEnding: null,
      champion: null,
      puppet: null,
    };
  }
  if (!menuAudioEl) {
    menuAudioEl = new Audio(ELEVATOR_JAM_MP3);
    menuAudioEl.loop = true;
    menuAudioEl.preload = 'auto';
    menuAudioEl.volume = 0.45;
  }
  if (!fnafMenuAudioEl) {
    fnafMenuAudioEl = new Audio(FNAF_MOVIE_MP3);
    fnafMenuAudioEl.loop = true;
    fnafMenuAudioEl.preload = 'auto';
    fnafMenuAudioEl.volume = 0.5;
  }
  if (!auMenuAudioEl) {
    auMenuAudioEl = new Audio(AMONGUS_MENU_MP3);
    auMenuAudioEl.loop = true;
    auMenuAudioEl.preload = 'auto';
    auMenuAudioEl.volume = 0.5;
  }
  if (!auAlarmaAudioEl) {
    auAlarmaAudioEl = new Audio(AMONGUS_ALARMA_MP3);
    auAlarmaAudioEl.loop = true;
    auAlarmaAudioEl.preload = 'auto';
    auAlarmaAudioEl.volume = 0.48;
  }
  if (!auEndingAudioEl) {
    auEndingAudioEl = new Audio(AMONGUS_ENDING_MP3);
    auEndingAudioEl.loop = false;
    auEndingAudioEl.preload = 'auto';
    auEndingAudioEl.volume = 0.65;
  }
  if (!championAudioEl) {
    championAudioEl = new Audio(TRILLIUM_HARDTEKK_MP3);
    championAudioEl.loop = true;
    championAudioEl.preload = 'auto';
    championAudioEl.volume = 0.62;
  }
  if (!puppetAudioEl) {
    puppetAudioEl = new Audio(PUPPET_SONG_MP3);
    puppetAudioEl.loop = true;
    puppetAudioEl.preload = 'auto';
    puppetAudioEl.volume = 0.55;
  }
  return {
    menu: menuAudioEl,
    fnafMenu: fnafMenuAudioEl,
    auMenu: auMenuAudioEl,
    auAlarma: auAlarmaAudioEl,
    auEnding: auEndingAudioEl,
    champion: championAudioEl,
    puppet: puppetAudioEl,
  };
}

type Mp3TrackId =
  | 'menu'
  | 'menu_fnaf'
  | 'menu_amongus'
  | 'champion'
  | 'champion_amongus'
  | 'simon_fnaf'
  | 'au_alarma';

function isMp3Track(track: MusicTrackId): track is Mp3TrackId {
  return (
    track === 'menu' ||
    track === 'menu_fnaf' ||
    track === 'menu_amongus' ||
    track === 'champion' ||
    track === 'champion_amongus' ||
    track === 'simon_fnaf' ||
    track === 'au_alarma'
  );
}

function syncMp3Playback(resetTrack = false) {
  const {menu, fnafMenu, auMenu, auAlarma, auEnding, champion, puppet} = getMp3Elements();
  if (!menu || !fnafMenu || !auMenu || !auAlarma || !auEnding || !champion || !puppet) return;

  if (!musicEnabled) {
    menu.pause();
    fnafMenu.pause();
    auMenu.pause();
    auAlarma.pause();
    auEnding.pause();
    champion.pause();
    puppet.pause();
    return;
  }

  const pauseAndReset = (el: HTMLAudioElement) => {
    el.pause();
    el.currentTime = 0;
  };

  if (currentTrack === 'menu') {
    fnafMenu.pause();
    auMenu.pause();
    pauseAndReset(auAlarma);
    pauseAndReset(auEnding);
    pauseAndReset(champion);
    pauseAndReset(puppet);
    menu.volume = musicDucked ? 0.14 : 0.45;
    if (menu.paused) void menu.play().catch(() => {});
  } else if (currentTrack === 'menu_fnaf') {
    menu.pause();
    auMenu.pause();
    pauseAndReset(auAlarma);
    pauseAndReset(auEnding);
    pauseAndReset(champion);
    pauseAndReset(puppet);
    fnafMenu.volume = musicDucked ? 0.14 : 0.52;
    if (fnafMenu.paused) void fnafMenu.play().catch(() => {});
  } else if (currentTrack === 'menu_amongus') {
    menu.pause();
    fnafMenu.pause();
    pauseAndReset(auAlarma);
    pauseAndReset(auEnding);
    pauseAndReset(champion);
    pauseAndReset(puppet);
    auMenu.volume = musicDucked ? 0.14 : 0.5;
    if (auMenu.paused) void auMenu.play().catch(() => {});
  } else if (currentTrack === 'au_alarma') {
    menu.pause();
    fnafMenu.pause();
    auMenu.pause();
    pauseAndReset(auEnding);
    pauseAndReset(champion);
    pauseAndReset(puppet);
    if (resetTrack) auAlarma.currentTime = 0;
    auAlarma.volume = musicDucked ? 0.15 : 0.48;
    if (auAlarma.paused) void auAlarma.play().catch(() => {});
  } else if (currentTrack === 'champion_amongus') {
    menu.pause();
    fnafMenu.pause();
    auMenu.pause();
    pauseAndReset(auAlarma);
    pauseAndReset(champion);
    pauseAndReset(puppet);
    if (resetTrack) auEnding.currentTime = 0;
    auEnding.volume = musicDucked ? 0.18 : 0.65;
    if (resetTrack || (auEnding.paused && !auEnding.ended)) {
      void auEnding.play().catch(() => {});
    }
  } else if (currentTrack === 'champion') {
    menu.pause();
    fnafMenu.pause();
    auMenu.pause();
    pauseAndReset(auAlarma);
    pauseAndReset(auEnding);
    pauseAndReset(puppet);
    if (resetTrack) champion.currentTime = 0;
    champion.volume = musicDucked ? 0.18 : 0.62;
    if (champion.paused) void champion.play().catch(() => {});
  } else if (currentTrack === 'simon_fnaf') {
    menu.pause();
    fnafMenu.pause();
    auMenu.pause();
    pauseAndReset(auAlarma);
    pauseAndReset(auEnding);
    pauseAndReset(champion);
    if (resetTrack) puppet.currentTime = 0;
    puppet.volume = musicDucked ? 0.16 : 0.55;
    if (puppet.paused) void puppet.play().catch(() => {});
  } else {
    menu.pause();
    fnafMenu.pause();
    auMenu.pause();
    pauseAndReset(auAlarma);
    pauseAndReset(auEnding);
    pauseAndReset(champion);
    pauseAndReset(puppet);
  }
}

function getMusicCtx(): AudioContext | null {
  try {
    if (!musicCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      musicCtx = new Ctx();
      masterGain = musicCtx.createGain();
      masterGain.gain.value = musicEnabled ? (musicDucked ? 0.04 : 0.14) : 0;
      masterGain.connect(musicCtx.destination);

      // Buffer corto de ruido blanco para percusión ligera
      const len = Math.floor(musicCtx.sampleRate * 0.08);
      noiseBuffer = musicCtx.createBuffer(1, len, musicCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return musicCtx;
  } catch {
    return null;
  }
}

function updateMasterGain() {
  if (!masterGain || !musicCtx) return;
  const target = !musicEnabled || isMp3Track(currentTrack) ? 0 : musicDucked ? 0.03 : 0.14;
  masterGain.gain.setTargetAtTime(target, musicCtx.currentTime, 0.05);
}

function playSynthNote(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  startTime: number,
  dur: number,
  wave: OscillatorType,
  gainPeak: number,
  filterHz: number,
) {
  if (!freq || freq <= 0) return;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const g = ctx.createGain();

  osc.type = wave;
  osc.frequency.setValueAtTime(freq, startTime);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(filterHz, startTime);

  g.gain.setValueAtTime(0.0001, startTime);
  g.gain.linearRampToValueAtTime(gainPeak, startTime + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.max(0.04, dur));

  osc.connect(filter);
  filter.connect(g);
  g.connect(dest);

  osc.start(startTime);
  osc.stop(startTime + dur + 0.02);
}

function playDrumHit(
  ctx: AudioContext,
  dest: AudioNode,
  time: number,
  style: TrackDef['drumStyle'],
  step: number,
  vol: number,
) {
  if (style === 'soft') {
    if (step % 4 === 0 && noiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 5000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.025 * vol, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
      src.connect(hp);
      hp.connect(g);
      g.connect(dest);
      src.start(time);
    }
    return;
  }

  // Bombo suave en beats fuertes
  const kickSteps =
    style === 'bossa'
      ? step % 8 === 0 || step % 8 === 3
      : style === 'pulse'
        ? step % 2 === 0
        : step % 4 === 0;
  if (kickSteps) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(125, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.08);
    g.gain.setValueAtTime(0.22 * vol, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);
    osc.connect(g);
    g.connect(dest);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  // Rimshot / Shaker bossa o hi-hat arcade
  if (noiseBuffer) {
    const hatStep =
      style === 'bossa'
        ? true
        : style === 'arcade'
          ? step % 2 === 1
          : step % 2 === 0;
    if (hatStep) {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = style === 'bossa' ? 5800 : 4200;
      const g = ctx.createGain();
      const accent = style === 'bossa' && [0, 3, 6, 10, 12].includes(step % 16) ? 0.085 : 0.032;
      g.gain.setValueAtTime(accent * vol, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);
      src.connect(hp);
      hp.connect(g);
      g.connect(dest);
      src.start(time);
    }
  }
}

function scheduleStep(time: number) {
  if (currentTrack === 'none' || isMp3Track(currentTrack) || !musicEnabled) return;
  const ctx = getMusicCtx();
  const dest = masterGain;
  if (!ctx || !dest || ctx.state !== 'running') return;

  const def = TRACKS[currentTrack];
  const stepDur = 60 / def.bpm / 2; // corchea
  const len = def.lead.length;
  const i = stepIdx % len;

  const bassFreq = def.bass[i % def.bass.length];
  if (bassFreq) {
    playSynthNote(ctx, dest, bassFreq, time, stepDur * 1.4, def.bassWave, 0.28 * def.volume, def.filterHz);
  }

  const leadFreq = def.lead[i];
  if (leadFreq) {
    playSynthNote(ctx, dest, leadFreq, time, stepDur * 0.9, def.leadWave, 0.22 * def.volume, def.filterHz + 500);
  }

  if (def.chords) {
    const chord = def.chords[i % def.chords.length];
    if (chord && chord.length > 0) {
      chord.forEach((f) => {
        playSynthNote(ctx, dest, f, time, stepDur * 1.1, 'triangle', 0.075 * def.volume, def.filterHz);
      });
    }
  }

  playDrumHit(ctx, dest, time, def.drumStyle, stepIdx, def.volume);
  stepIdx++;
}

function schedulerTick() {
  const ctx = getMusicCtx();
  if (
    !ctx ||
    ctx.state !== 'running' ||
    currentTrack === 'none' ||
    isMp3Track(currentTrack) ||
    !musicEnabled
  ) {
    return;
  }
  const def = TRACKS[currentTrack];
  const stepDur = 60 / def.bpm / 2;
  if (nextNoteTime < ctx.currentTime) {
    nextNoteTime = ctx.currentTime + 0.02;
  }
  while (nextNoteTime < ctx.currentTime + 0.16) {
    scheduleStep(nextNoteTime);
    nextNoteTime += stepDur;
  }
}

function ensureSchedulerRunning() {
  if (timerId !== null) return;
  timerId = window.setInterval(schedulerTick, 60);
}

export function unlockMusicAudio() {
  const ctx = getMusicCtx();
  if (ctx) {
    if (ctx.state === 'suspended') {
      void ctx.resume().then(() => {
        updateMasterGain();
        nextNoteTime = ctx.currentTime + 0.03;
        ensureSchedulerRunning();
      });
    } else {
      updateMasterGain();
      ensureSchedulerRunning();
    }
  }
  syncMp3Playback(false);
}

export function bindGlobalMusicUnlock() {
  if (unlockBound || typeof window === 'undefined') return;
  unlockBound = true;
  getMp3Elements();
  const onInteract = () => {
    unlockMusicAudio();
  };
  window.addEventListener('keydown', onInteract, {passive: true});
  window.addEventListener('pointerdown', onInteract, {passive: true});
}

export function setMusicTrack(track: MusicTrackId) {
  const changed = currentTrack !== track;
  currentTrack = track;
  if (changed) stepIdx = 0;
  const ctx = getMusicCtx();
  if (ctx) {
    nextNoteTime = ctx.currentTime + 0.03;
  }
  updateMasterGain();
  syncMp3Playback(
    changed &&
      (track === 'champion' ||
        track === 'champion_amongus' ||
        track === 'simon_fnaf' ||
        track === 'au_alarma'),
  );
  ensureSchedulerRunning();
}

export function setMusicEnabled(enabled: boolean) {
  musicEnabled = enabled;
  try {
    localStorage.setItem(ENABLED_KEY, enabled ? '1' : '0');
  } catch {
    // ignore
  }
  if (enabled) unlockMusicAudio();
  updateMasterGain();
  syncMp3Playback(false);
}

export function isMusicEnabled(): boolean {
  return musicEnabled;
}

export function setMusicDucked(ducked: boolean) {
  musicDucked = ducked;
  updateMasterGain();
  syncMp3Playback(false);
}
