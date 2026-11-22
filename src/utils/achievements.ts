export type AchievementId =
  | 'first_win'
  | 'streak_3'
  | 'streak_5'
  | 'tournament_win'
  | 'games_5'
  | 'games_10'
  | 'family_full'
  | 'matches_10';

export interface AchievementDef {
  id: AchievementId;
  emoji: string;
  title: string;
  desc: string;
}

export interface AchievementsStore {
  unlocked: Partial<Record<AchievementId, string>>;
  totalMatches: number;
  gamesPlayed: string[];
  lastWinnerIdx: number | null;
  currentStreak: number;
  bestStreak: number;
  tournamentsWon: number;
}

export const ACHIEVEMENTS_LIST: AchievementDef[] = [
  {
    id: 'first_win',
    emoji: '🏆',
    title: 'Primera victoria',
    desc: 'Gana tu primera partida en cualquier minijuego',
  },
  {
    id: 'streak_3',
    emoji: '🔥',
    title: 'Racha de 3 partidas',
    desc: 'Un mismo jugador gana 3 partidas seguidas',
  },
  {
    id: 'streak_5',
    emoji: '⚡',
    title: 'Imparable',
    desc: 'Un mismo jugador gana 5 partidas seguidas',
  },
  {
    id: 'tournament_win',
    emoji: '👑',
    title: 'Torneo completado',
    desc: 'Alcanza la meta de puntos en modo torneo',
  },
  {
    id: 'games_5',
    emoji: '🎮',
    title: 'Explorador',
    desc: 'Prueba 5 minijuegos distintos',
  },
  {
    id: 'games_10',
    emoji: '🌟',
    title: 'Todoterreno',
    desc: 'Prueba 10 minijuegos distintos',
  },
  {
    id: 'family_full',
    emoji: '👨‍👩‍👧‍👦',
    title: 'Casa llena',
    desc: 'Completa una partida con 4 o más jugadores',
  },
  {
    id: 'matches_10',
    emoji: '🎉',
    title: 'Alma de la fiesta',
    desc: 'Completa 10 partidas en total',
  },
];

const STORAGE_KEY = 'mj_achievements_v1';

const DEFAULT_STORE: AchievementsStore = {
  unlocked: {},
  totalMatches: 0,
  gamesPlayed: [],
  lastWinnerIdx: null,
  currentStreak: 0,
  bestStreak: 0,
  tournamentsWon: 0,
};

export function loadAchievements(): AchievementsStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {...DEFAULT_STORE, unlocked: {}, gamesPlayed: []};
    const parsed = JSON.parse(raw) as Partial<AchievementsStore>;
    return {
      unlocked: parsed.unlocked && typeof parsed.unlocked === 'object' ? {...parsed.unlocked} : {},
      totalMatches: typeof parsed.totalMatches === 'number' ? parsed.totalMatches : 0,
      gamesPlayed: Array.isArray(parsed.gamesPlayed)
        ? parsed.gamesPlayed.filter((g): g is string => typeof g === 'string')
        : [],
      lastWinnerIdx: typeof parsed.lastWinnerIdx === 'number' ? parsed.lastWinnerIdx : null,
      currentStreak: typeof parsed.currentStreak === 'number' ? parsed.currentStreak : 0,
      bestStreak: typeof parsed.bestStreak === 'number' ? parsed.bestStreak : 0,
      tournamentsWon: typeof parsed.tournamentsWon === 'number' ? parsed.tournamentsWon : 0,
    };
  } catch {
    return {...DEFAULT_STORE, unlocked: {}, gamesPlayed: []};
  }
}

export function saveAchievements(store: AchievementsStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore storage quota errors
  }
}

function tryUnlock(
  store: AchievementsStore,
  id: AchievementId,
  newlyUnlocked: AchievementDef[],
): void {
  if (store.unlocked[id]) return;
  store.unlocked[id] = new Date().toISOString();
  const def = ACHIEVEMENTS_LIST.find((a) => a.id === id);
  if (def) newlyUnlocked.push(def);
}

export function recordMatchAchievement(params: {
  gameId: string | null;
  winnerIdx: number | undefined;
  playerCount: number;
}): {store: AchievementsStore; unlockedNow: AchievementDef[]} {
  const store = loadAchievements();
  const newlyUnlocked: AchievementDef[] = [];

  store.totalMatches += 1;

  if (params.gameId && !store.gamesPlayed.includes(params.gameId)) {
    store.gamesPlayed.push(params.gameId);
  }

  if (typeof params.winnerIdx === 'number') {
    if (store.lastWinnerIdx === params.winnerIdx) {
      store.currentStreak += 1;
    } else {
      store.lastWinnerIdx = params.winnerIdx;
      store.currentStreak = 1;
    }
    if (store.currentStreak > store.bestStreak) {
      store.bestStreak = store.currentStreak;
    }
    tryUnlock(store, 'first_win', newlyUnlocked);
    if (store.currentStreak >= 3) tryUnlock(store, 'streak_3', newlyUnlocked);
    if (store.currentStreak >= 5) tryUnlock(store, 'streak_5', newlyUnlocked);
  }

  if (store.gamesPlayed.length >= 5) tryUnlock(store, 'games_5', newlyUnlocked);
  if (store.gamesPlayed.length >= 10) tryUnlock(store, 'games_10', newlyUnlocked);
  if (params.playerCount >= 4) tryUnlock(store, 'family_full', newlyUnlocked);
  if (store.totalMatches >= 10) tryUnlock(store, 'matches_10', newlyUnlocked);

  saveAchievements(store);
  return {store, unlockedNow: newlyUnlocked};
}

export function recordSinglePointAchievement(params: {
  gameId: string | null;
  playerIdx: number;
  playerCount: number;
}): {store: AchievementsStore; unlockedNow: AchievementDef[]} {
  const store = loadAchievements();
  const newlyUnlocked: AchievementDef[] = [];

  if (params.gameId && !store.gamesPlayed.includes(params.gameId)) {
    store.gamesPlayed.push(params.gameId);
  }
  tryUnlock(store, 'first_win', newlyUnlocked);
  if (store.gamesPlayed.length >= 5) tryUnlock(store, 'games_5', newlyUnlocked);
  if (store.gamesPlayed.length >= 10) tryUnlock(store, 'games_10', newlyUnlocked);
  if (params.playerCount >= 4) tryUnlock(store, 'family_full', newlyUnlocked);

  saveAchievements(store);
  return {store, unlockedNow: newlyUnlocked};
}

export function recordTournamentWinAchievement(): {
  store: AchievementsStore;
  unlockedNow: AchievementDef[];
} {
  const store = loadAchievements();
  const newlyUnlocked: AchievementDef[] = [];
  store.tournamentsWon += 1;
  tryUnlock(store, 'tournament_win', newlyUnlocked);
  saveAchievements(store);
  return {store, unlockedNow: newlyUnlocked};
}
