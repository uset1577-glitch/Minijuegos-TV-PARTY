import {AppLanguage, GameDifficulty, ThemeMode} from './stageAudio';
import {AchievementId} from './achievements';

export const LANG_KEY = 'mj_lang_v1';

export interface LanguageOption {
  code: AppLanguage;
  flag: string;
  short: string;
  nativeName: string;
  subtitle: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: 'es',
    flag: '🇪🇸',
    short: 'ES',
    nativeName: 'Español',
    subtitle: 'Menús, copas y controles en español',
  },
  {
    code: 'en',
    flag: '🇺🇸',
    short: 'EN',
    nativeName: 'English',
    subtitle: 'Menus, cups and controls in English',
  },
  {
    code: 'pt',
    flag: '🇧🇷',
    short: 'PT',
    nativeName: 'Português',
    subtitle: 'Menus, copas e controles em português',
  },
  {
    code: 'fr',
    flag: '🇫🇷',
    short: 'FR',
    nativeName: 'Français',
    subtitle: 'Menus, coupes et commandes en français',
  },
];

export function loadInitialLanguage(): AppLanguage {
  try {
    const raw = localStorage.getItem(LANG_KEY);
    if (raw === 'es' || raw === 'en' || raw === 'pt' || raw === 'fr') return raw;
  } catch {
    // ignore
  }
  return 'es';
}

export function saveLanguage(lang: AppLanguage): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // ignore
  }
}

export function getPlayerLabel(idx: number, lang: AppLanguage): string {
  switch (lang) {
    case 'en':
      return `Player ${idx + 1}`;
    case 'pt':
      return `Jogador ${idx + 1}`;
    case 'fr':
      return `Joueur ${idx + 1}`;
    default:
      return `Jugador ${idx + 1}`;
  }
}

export function getDifficultyLabel(diff: GameDifficulty, lang: AppLanguage): string {
  const labels: Record<AppLanguage, Record<GameDifficulty, string>> = {
    es: {easy: 'Fácil', normal: 'Normal', hard: 'Difícil'},
    en: {easy: 'Easy', normal: 'Normal', hard: 'Hard'},
    pt: {easy: 'Fácil', normal: 'Normal', hard: 'Difícil'},
    fr: {easy: 'Facile', normal: 'Normal', hard: 'Difficile'},
  };
  return labels[lang][diff];
}

export interface UiStrings {
  introClassic: string;
  introFnaf: string;
  introAmongUs: string;
  introSkip: string;
  minigamesLabel: string;
  exclusivesFnaf: string;
  exclusivesAmongUs: string;
  playerSingular: string;
  playerPlural: string;
  freeModeTag: string;
  musicOn: string;
  musicOff: string;
  modeClassicBtn: string;
  modeFnafBtn: string;
  modeAmongUsBtn: string;
  diffPrefix: string;
  langPrefix: string;
  achievementsBtn: string;
  updateBtn: string;
  answerPhone: string;
  answerShapeshifter: string;
  legendDefault: string;
  legendPhone: (sec: number) => string;
  legendAuAlert: (sec: number) => string;
  exclusiveTag: string;
  shipTag: string;
  playersClassic: (n: number) => string;
  playersFnaf: (n: number) => string;
  playersAmongUs: (n: number) => string;
  tournamentCardTitle: string;
  tournamentCardDesc: string;
  resetCardTitle: string;
  resetCardDesc: string;
  modeModalTitle: string;
  modeModalSub: string;
  modeClassicTitle: string;
  modeClassicDesc: string;
  modeFnafTitle: string;
  modeFnafDesc: string;
  modeAmongUsTitle: string;
  modeAmongUsDesc: string;
  modeActiveNow: string;
  modeActivateHint: string;
  modeLockedFnaf: (time: string) => string;
  modeLockedAu: (time: string) => string;
  modeHint: string;
  langModalTitle: string;
  langModalSub: string;
  langHint: string;
  achModalTitle: (unlocked: number, total: number) => string;
  achModalStats: (matches: number, streak: number, cups: number) => string;
  achUnlockedKicker: string;
  achModalHint: string;
  toastRestricted: string;
  toastMissedAlert: string;
  updateTitleAvailable: string;
  updateTitleDownloading: string;
  updateTitlePermission: string;
  updateTitleChecking: string;
  updateTitleDefault: string;
  updateInstalled: (v: string) => string;
  updateCheckingMsg: string;
  updateReadyMsg: string;
  updateNowBtn: string;
  updatePermissionBtn: string;
  updateUnderstoodBtn: string;
  updateRetryBtn: string;
  updateLaterBtn: string;
  updateWaitHint: string;
  updateHint: string;
  podiumHint: string;
  passTo: string;
  pressOkReady: string;
  difficultyWord: string;
  // Tournament Cup (234 Player Mini Games style)
  cupTitle: string;
  cupSubtitle: string;
  cupPlayersLabel: string;
  cupRoundsLabel: string;
  cupRoundsUnit: string;
  cupLineupLabel: string;
  cupShuffleBtn: string;
  cupStartBtn: string;
  cupBackBtn: string;
  cupSetupHint: string;
  cupRoundHeader: (cur: number, total: number) => string;
  cupTrophyLabel: string;
  cupNextMatch: string;
  cupPlayRound: (cur: number) => string;
  cupSwapGame: string;
  cupQuitBtn: string;
  cupHubHint: string;
  cupWinnerBanner: string;
  cupTieBanner: string;
  cupPointsUnit: string;
  cupNewBtn: string;
  cupMenuBtn: string;
  cupChampionHint: string;
  cupNextTag: string;
  cupDoneTag: string;
}

export const UI_TEXT: Record<AppLanguage, UiStrings> = {
  es: {
    introClassic: '20 minijuegos · 1 solo control · en familia',
    introFnaf: '27 minijuegos · Modo FNAF',
    introAmongUs: '26 minijuegos · Modo Among Us',
    introSkip: 'Presiona OK para entrar',
    minigamesLabel: 'minijuegos',
    exclusivesFnaf: '7 exclusivos FNAF',
    exclusivesAmongUs: '6 exclusivos Among Us',
    playerSingular: 'jugador',
    playerPlural: 'jugadores',
    freeModeTag: 'Juego libre',
    musicOn: '♪ Música: SÍ',
    musicOff: '🔇 Música: NO',
    modeClassicBtn: '🎨 Modo: Clásico',
    modeFnafBtn: '🐻 Modo: FNAF',
    modeAmongUsBtn: '🚀 Modo: Among Us',
    diffPrefix: 'Dif',
    langPrefix: 'Idioma',
    achievementsBtn: 'Logros',
    updateBtn: 'Actualizar',
    answerPhone: '¡Contestar!',
    answerShapeshifter: '¡Shapeshifter!',
    legendDefault: '◀▶▲▼ Mover · OK Seleccionar · Atrás Volver',
    legendPhone: (s) => `¡Suena el teléfono (${s}s)! Contesta con ▲ + OK o todos pierden -2 pts`,
    legendAuAlert: (s) =>
      `¡Shapeshifter detectado (${s}s)! Entra con ▲ + OK o todos pierden -2 pts`,
    exclusiveTag: 'EXCLUSIVO',
    shipTag: 'NAVE',
    playersClassic: (n) => `Jugadores: ${n}`,
    playersFnaf: (n) => `Guardias: ${n}`,
    playersAmongUs: (n) => `Tripulantes: ${n}`,
    tournamentCardTitle: 'Copa Torneo',
    tournamentCardDesc: 'OK: abrir pantalla copa',
    resetCardTitle: 'Reiniciar puntos',
    resetCardDesc: 'Todos en cero',
    modeModalTitle: '🎨 ELEGIR MODO DE JUEGO',
    modeModalSub: 'Cada modo cambia colores, ambientación y agrega juegos exclusivos',
    modeClassicTitle: '📺 Clásico TV Party',
    modeClassicDesc:
      '20 minijuegos originales para toda la familia con estética limpia minimalista.',
    modeFnafTitle: '🐻 Pizzería FNAF',
    modeFnafDesc:
      '20 minijuegos tematizados + 7 exclusivos de FNAF (Oficina, Cámaras, Puppet y más).',
    modeAmongUsTitle: '🚀 Nave Among Us',
    modeAmongUsDesc:
      '20 minijuegos tematizados + 6 tareas exclusivas de Skeld (Reunión, Mapa Admin, Luces y más).',
    modeActiveNow: '✓ Activo actualmente',
    modeActivateHint: 'OK para activar',
    modeLockedFnaf: (t) => `🔒 Bloqueado por Balloon Boy (${t})`,
    modeLockedAu: (t) => `🔒 Bloqueado por Shapeshifter (${t})`,
    modeHint: '◀▶ Elegir modo · OK Aplicar · Atrás Cancelar',
    langModalTitle: '🌐 ELEGIR IDIOMA',
    langModalSub: 'Cambia el idioma de los menús, copa torneo y controles',
    langHint: '◀▶▲▼ Elegir idioma · OK Aplicar · Atrás Cerrar',
    achModalTitle: (u, t) => `🏅 LOGROS DE LA CASA (${u}/${t})`,
    achModalStats: (m, s, c) =>
      `Partidas jugadas: ${m} · Mejor racha: ${s} · Copas ganadas: ${c}`,
    achUnlockedKicker: 'Logro desbloqueado',
    achModalHint: 'Presiona OK o Atrás para volver al menú',
    toastRestricted: 'Acceso restringido',
    toastMissedAlert: 'Alerta sin respuesta',
    updateTitleAvailable: '¡ACTUALIZACIÓN DISPONIBLE!',
    updateTitleDownloading: 'DESCARGANDO ACTUALIZACIÓN',
    updateTitlePermission: 'PERMISO EN ANDROID TV',
    updateTitleChecking: 'BUSCANDO ACTUALIZACIONES',
    updateTitleDefault: 'ACTUALIZADOR TV',
    updateInstalled: (v) => `Versión instalada: v${v}`,
    updateCheckingMsg: 'Revisando si hay una versión más nueva...',
    updateReadyMsg: 'Listo para comprobar actualizaciones.',
    updateNowBtn: 'Actualizar ahora',
    updatePermissionBtn: 'Instalar / Dar permiso',
    updateUnderstoodBtn: 'Entendido',
    updateRetryBtn: 'Buscar de nuevo',
    updateLaterBtn: 'Más tarde',
    updateWaitHint: 'Espera un momento mientras se descarga directo al TV...',
    updateHint: '◀▶ Elegir · OK Confirmar · Atrás Cerrar',
    podiumHint: 'OK: menú · ▲: jugar otra vez',
    passTo: 'Pásale el control a',
    pressOkReady: 'Presiona OK cuando lo tengas',
    difficultyWord: 'Dificultad',
    cupTitle: 'COPA TORNEO',
    cupSubtitle: 'Elige jugadores y rondas · Gana puntos en cada minijuego para levantar la copa',
    cupPlayersLabel: 'JUGADORES',
    cupRoundsLabel: 'RONDAS DE LA COPA',
    cupRoundsUnit: 'rondas',
    cupLineupLabel: 'CIRCUITO DE MINIJUEGOS',
    cupShuffleBtn: '🎲 Cambiar juegos',
    cupStartBtn: '▶ INICIAR COPA',
    cupBackBtn: '⬅ Volver al menú',
    cupSetupHint: '◀▶ Ajustar · ▲▼ Navegar · OK Confirmar · Atrás Menú',
    cupRoundHeader: (cur, tot) => `RONDA ${cur} DE ${tot}`,
    cupTrophyLabel: 'COPA FINAL',
    cupNextMatch: 'SIGUIENTE MINIJUEGO',
    cupPlayRound: (cur) => `▶ JUGAR RONDA ${cur}`,
    cupSwapGame: '🎲 Otro juego',
    cupQuitBtn: '✖ Salir de la copa',
    cupHubHint: '◀▶ Elegir acción · OK Jugar ronda · Atrás Salir',
    cupWinnerBanner: '¡CAMPEÓN DE LA COPA!',
    cupTieBanner: '¡EMPATE EN LA CIMA!',
    cupPointsUnit: 'pts',
    cupNewBtn: '🔄 Nueva Copa',
    cupMenuBtn: '🏠 Menú Principal',
    cupChampionHint: '◀▶ Elegir · OK Confirmar · Atrás Menú',
    cupNextTag: 'SIGUIENTE',
    cupDoneTag: 'LISTO',
  },
  en: {
    introClassic: '20 minigames · 1 remote · family party',
    introFnaf: '27 minigames · FNAF Mode',
    introAmongUs: '26 minigames · Among Us Mode',
    introSkip: 'Press OK to enter',
    minigamesLabel: 'minigames',
    exclusivesFnaf: '7 FNAF exclusives',
    exclusivesAmongUs: '6 Among Us exclusives',
    playerSingular: 'player',
    playerPlural: 'players',
    freeModeTag: 'Free Play',
    musicOn: '♪ Music: ON',
    musicOff: '🔇 Music: OFF',
    modeClassicBtn: '🎨 Mode: Classic',
    modeFnafBtn: '🐻 Mode: FNAF',
    modeAmongUsBtn: '🚀 Mode: Among Us',
    diffPrefix: 'Diff',
    langPrefix: 'Lang',
    achievementsBtn: 'Trophies',
    updateBtn: 'Update',
    answerPhone: 'Answer!',
    answerShapeshifter: 'Shapeshifter!',
    legendDefault: '◀▶▲▼ Move · OK Select · Back Return',
    legendPhone: (s) => `Phone ringing (${s}s)! Press ▲ + OK or everyone loses -2 pts`,
    legendAuAlert: (s) => `Shapeshifter spotted (${s}s)! Press ▲ + OK or everyone loses -2 pts`,
    exclusiveTag: 'EXCLUSIVE',
    shipTag: 'SHIP',
    playersClassic: (n) => `Players: ${n}`,
    playersFnaf: (n) => `Guards: ${n}`,
    playersAmongUs: (n) => `Crewmates: ${n}`,
    tournamentCardTitle: 'Cup Tournament',
    tournamentCardDesc: 'OK: open cup screen',
    resetCardTitle: 'Reset scores',
    resetCardDesc: 'Back to zero',
    modeModalTitle: '🎨 CHOOSE GAME MODE',
    modeModalSub: 'Each mode changes colors, music, and unlocks exclusive minigames',
    modeClassicTitle: '📺 Classic TV Party',
    modeClassicDesc: '20 original family party minigames with a clean arcade look.',
    modeFnafTitle: '🐻 Fazbear Pizzeria',
    modeFnafDesc: '20 themed minigames + 7 FNAF exclusives (Office, Cameras, Puppet & more).',
    modeAmongUsTitle: '🚀 Among Us Skeld',
    modeAmongUsDesc:
      '20 themed minigames + 6 Skeld exclusives (Meeting, Admin Map, Lights & more).',
    modeActiveNow: '✓ Currently active',
    modeActivateHint: 'OK to activate',
    modeLockedFnaf: (t) => `🔒 Locked by Balloon Boy (${t})`,
    modeLockedAu: (t) => `🔒 Locked by Shapeshifter (${t})`,
    modeHint: '◀▶ Choose mode · OK Apply · Back Cancel',
    langModalTitle: '🌐 SELECT LANGUAGE',
    langModalSub: 'Change the language of menus, tournament cup and controls',
    langHint: '◀▶▲▼ Select language · OK Apply · Back Close',
    achModalTitle: (u, t) => `🏅 HOUSE TROPHIES (${u}/${t})`,
    achModalStats: (m, s, c) => `Matches played: ${m} · Best streak: ${s} · Cups won: ${c}`,
    achUnlockedKicker: 'Achievement unlocked',
    achModalHint: 'Press OK or Back to return to the menu',
    toastRestricted: 'Access restricted',
    toastMissedAlert: 'Missed alert',
    updateTitleAvailable: 'UPDATE AVAILABLE!',
    updateTitleDownloading: 'DOWNLOADING UPDATE',
    updateTitlePermission: 'ANDROID TV PERMISSION',
    updateTitleChecking: 'CHECKING FOR UPDATES',
    updateTitleDefault: 'TV UPDATER',
    updateInstalled: (v) => `Installed version: v${v}`,
    updateCheckingMsg: 'Checking for a newer version...',
    updateReadyMsg: 'Ready to check for updates.',
    updateNowBtn: 'Update now',
    updatePermissionBtn: 'Install / Grant permission',
    updateUnderstoodBtn: 'Got it',
    updateRetryBtn: 'Check again',
    updateLaterBtn: 'Later',
    updateWaitHint: 'Please wait while downloading directly to your TV...',
    updateHint: '◀▶ Choose · OK Confirm · Back Close',
    podiumHint: 'OK: menu · ▲: play again',
    passTo: 'Pass the remote to',
    pressOkReady: 'Press OK when ready',
    difficultyWord: 'Difficulty',
    cupTitle: 'TOURNAMENT CUP',
    cupSubtitle: 'Pick players and rounds · Earn points every round to win the trophy',
    cupPlayersLabel: 'PLAYERS',
    cupRoundsLabel: 'CUP ROUNDS',
    cupRoundsUnit: 'rounds',
    cupLineupLabel: 'MINIGAME CIRCUIT',
    cupShuffleBtn: '🎲 Shuffle games',
    cupStartBtn: '▶ START CUP',
    cupBackBtn: '⬅ Back to menu',
    cupSetupHint: '◀▶ Adjust · ▲▼ Navigate · OK Confirm · Back Menu',
    cupRoundHeader: (cur, tot) => `ROUND ${cur} OF ${tot}`,
    cupTrophyLabel: 'FINAL CUP',
    cupNextMatch: 'NEXT MINIGAME',
    cupPlayRound: (cur) => `▶ PLAY ROUND ${cur}`,
    cupSwapGame: '🎲 Swap game',
    cupQuitBtn: '✖ Leave cup',
    cupHubHint: '◀▶ Choose action · OK Play round · Back Exit',
    cupWinnerBanner: 'TOURNAMENT CHAMPION!',
    cupTieBanner: 'TIE AT THE TOP!',
    cupPointsUnit: 'pts',
    cupNewBtn: '🔄 New Cup',
    cupMenuBtn: '🏠 Main Menu',
    cupChampionHint: '◀▶ Choose · OK Confirm · Back Menu',
    cupNextTag: 'NEXT',
    cupDoneTag: 'DONE',
  },
  pt: {
    introClassic: '20 minijogos · 1 controle · em família',
    introFnaf: '27 minijogos · Modo FNAF',
    introAmongUs: '26 minijogos · Modo Among Us',
    introSkip: 'Pressione OK para entrar',
    minigamesLabel: 'minijogos',
    exclusivesFnaf: '7 exclusivos FNAF',
    exclusivesAmongUs: '6 exclusivos Among Us',
    playerSingular: 'jogador',
    playerPlural: 'jogadores',
    freeModeTag: 'Jogo livre',
    musicOn: '♪ Música: SIM',
    musicOff: '🔇 Música: NÃO',
    modeClassicBtn: '🎨 Modo: Clássico',
    modeFnafBtn: '🐻 Modo: FNAF',
    modeAmongUsBtn: '🚀 Modo: Among Us',
    diffPrefix: 'Dif',
    langPrefix: 'Idioma',
    achievementsBtn: 'Conquistas',
    updateBtn: 'Atualizar',
    answerPhone: 'Atender!',
    answerShapeshifter: 'Shapeshifter!',
    legendDefault: '◀▶▲▼ Mover · OK Selecionar · Voltar Sair',
    legendPhone: (s) => `Telefone tocando (${s}s)! Aperte ▲ + OK ou todos perdem -2 pts`,
    legendAuAlert: (s) =>
      `Shapeshifter detectado (${s}s)! Aperte ▲ + OK ou todos perdem -2 pts`,
    exclusiveTag: 'EXCLUSIVO',
    shipTag: 'NAVE',
    playersClassic: (n) => `Jogadores: ${n}`,
    playersFnaf: (n) => `Guardas: ${n}`,
    playersAmongUs: (n) => `Tripulantes: ${n}`,
    tournamentCardTitle: 'Copa Torneio',
    tournamentCardDesc: 'OK: abrir tela da copa',
    resetCardTitle: 'Zerar pontos',
    resetCardDesc: 'Todos em zero',
    modeModalTitle: '🎨 ESCOLHER MODO DE JOGO',
    modeModalSub: 'Cada modo muda cores, música e libera minijogos exclusivos',
    modeClassicTitle: '📺 Clássico TV Party',
    modeClassicDesc: '20 minijogos originais para toda a família com visual limpo.',
    modeFnafTitle: '🐻 Pizzaria FNAF',
    modeFnafDesc:
      '20 minijogos temáticos + 7 exclusivos de FNAF (Escritório, Câmeras, Puppet e mais).',
    modeAmongUsTitle: '🚀 Nave Among Us',
    modeAmongUsDesc:
      '20 minijogos temáticos + 6 tarefas exclusivas de Skeld (Reunião, Mapa Admin e mais).',
    modeActiveNow: '✓ Ativo agora',
    modeActivateHint: 'OK para ativar',
    modeLockedFnaf: (t) => `🔒 Bloqueado por Balloon Boy (${t})`,
    modeLockedAu: (t) => `🔒 Bloqueado por Shapeshifter (${t})`,
    modeHint: '◀▶ Escolher modo · OK Aplicar · Voltar Cancelar',
    langModalTitle: '🌐 ESCOLHER IDIOMA',
    langModalSub: 'Mude o idioma dos menus, copa torneio e controles',
    langHint: '◀▶▲▼ Escolher idioma · OK Aplicar · Voltar Fechar',
    achModalTitle: (u, t) => `🏅 CONQUISTAS DA CASA (${u}/${t})`,
    achModalStats: (m, s, c) =>
      `Partidas jogadas: ${m} · Melhor sequência: ${s} · Copas vencidas: ${c}`,
    achUnlockedKicker: 'Conquista desbloqueada',
    achModalHint: 'Pressione OK ou Voltar para retornar ao menu',
    toastRestricted: 'Acesso restrito',
    toastMissedAlert: 'Alerta perdido',
    updateTitleAvailable: 'ATUALIZAÇÃO DISPONÍVEL!',
    updateTitleDownloading: 'BAIXANDO ATUALIZAÇÃO',
    updateTitlePermission: 'PERMISSÃO NA ANDROID TV',
    updateTitleChecking: 'BUSCANDO ATUALIZAÇÕES',
    updateTitleDefault: 'ATUALIZADOR TV',
    updateInstalled: (v) => `Versão instalada: v${v}`,
    updateCheckingMsg: 'Verificando se há uma nova versão...',
    updateReadyMsg: 'Pronto para verificar atualizações.',
    updateNowBtn: 'Atualizar agora',
    updatePermissionBtn: 'Instalar / Dar permissão',
    updateUnderstoodBtn: 'Entendi',
    updateRetryBtn: 'Buscar de novo',
    updateLaterBtn: 'Mais tarde',
    updateWaitHint: 'Aguarde enquanto baixamos direto para sua TV...',
    updateHint: '◀▶ Escolher · OK Confirmar · Voltar Fechar',
    podiumHint: 'OK: menu · ▲: jogar de novo',
    passTo: 'Passe o controle para',
    pressOkReady: 'Pressione OK quando estiver pronto',
    difficultyWord: 'Dificuldade',
    cupTitle: 'COPA TORNEIO',
    cupSubtitle: 'Escolha jogadores e rodadas · Ganhe pontos em cada jogo para levar o troféu',
    cupPlayersLabel: 'JOGADORES',
    cupRoundsLabel: 'RODADAS DA COPA',
    cupRoundsUnit: 'rodadas',
    cupLineupLabel: 'CIRCUITO DE MINIJOGOS',
    cupShuffleBtn: '🎲 Trocar jogos',
    cupStartBtn: '▶ INICIAR COPA',
    cupBackBtn: '⬅ Voltar ao menu',
    cupSetupHint: '◀▶ Ajustar · ▲▼ Navegar · OK Confirmar · Voltar Menu',
    cupRoundHeader: (cur, tot) => `RODADA ${cur} DE ${tot}`,
    cupTrophyLabel: 'COPA FINAL',
    cupNextMatch: 'PRÓXIMO MINIJOGO',
    cupPlayRound: (cur) => `▶ JOGAR RODADA ${cur}`,
    cupSwapGame: '🎲 Outro jogo',
    cupQuitBtn: '✖ Sair da copa',
    cupHubHint: '◀▶ Escolher ação · OK Jogar rodada · Voltar Sair',
    cupWinnerBanner: 'CAMPEÃO DA COPA!',
    cupTieBanner: 'EMPATE NO TOPO!',
    cupPointsUnit: 'pts',
    cupNewBtn: '🔄 Nova Copa',
    cupMenuBtn: '🏠 Menu Principal',
    cupChampionHint: '◀▶ Escolher · OK Confirmar · Voltar Menu',
    cupNextTag: 'PRÓXIMO',
    cupDoneTag: 'FEITO',
  },
  fr: {
    introClassic: '20 mini-jeux · 1 télécommande · en famille',
    introFnaf: '27 mini-jeux · Mode FNAF',
    introAmongUs: '26 mini-jeux · Mode Among Us',
    introSkip: 'Appuyez sur OK pour entrer',
    minigamesLabel: 'mini-jeux',
    exclusivesFnaf: '7 exclusifs FNAF',
    exclusivesAmongUs: '6 exclusifs Among Us',
    playerSingular: 'joueur',
    playerPlural: 'joueurs',
    freeModeTag: 'Jeu libre',
    musicOn: '♪ Musique : OUI',
    musicOff: '🔇 Musique : NON',
    modeClassicBtn: '🎨 Mode : Classique',
    modeFnafBtn: '🐻 Mode : FNAF',
    modeAmongUsBtn: '🚀 Mode : Among Us',
    diffPrefix: 'Dif',
    langPrefix: 'Langue',
    achievementsBtn: 'Succès',
    updateBtn: 'Mettre à jour',
    answerPhone: 'Répondre !',
    answerShapeshifter: 'Shapeshifter !',
    legendDefault: '◀▶▲▼ Déplacer · OK Choisir · Retour Quitter',
    legendPhone: (s) => `Téléphone (${s}s) ! Appuyez sur ▲ + OK sinon -2 pts pour tous`,
    legendAuAlert: (s) =>
      `Shapeshifter repéré (${s}s) ! Appuyez sur ▲ + OK sinon -2 pts pour tous`,
    exclusiveTag: 'EXCLUSIF',
    shipTag: 'VAISSEAU',
    playersClassic: (n) => `Joueurs : ${n}`,
    playersFnaf: (n) => `Gardes : ${n}`,
    playersAmongUs: (n) => `Équipage : ${n}`,
    tournamentCardTitle: 'Coupe Tournoi',
    tournamentCardDesc: 'OK : ouvrir écran coupe',
    resetCardTitle: 'Remettre à zéro',
    resetCardDesc: 'Tous les scores à 0',
    modeModalTitle: '🎨 CHOISIR UN MODE DE JEU',
    modeModalSub: 'Chaque mode change les couleurs, la musique et ajoute des jeux exclusifs',
    modeClassicTitle: '📺 Classique TV Party',
    modeClassicDesc: '20 mini-jeux originaux pour toute la famille au style épuré.',
    modeFnafTitle: '🐻 Pizzeria FNAF',
    modeFnafDesc: '20 mini-jeux thématisés + 7 exclusivités FNAF (Bureau, Caméras, Puppet…).',
    modeAmongUsTitle: '🚀 Vaisseau Among Us',
    modeAmongUsDesc:
      '20 mini-jeux thématisés + 6 tâches exclusives Skeld (Réunion, Carte Admin, Lumières…).',
    modeActiveNow: '✓ Actif actuellement',
    modeActivateHint: 'OK pour activer',
    modeLockedFnaf: (t) => `🔒 Bloqué par Balloon Boy (${t})`,
    modeLockedAu: (t) => `🔒 Bloqué par Shapeshifter (${t})`,
    modeHint: '◀▶ Choisir · OK Appliquer · Retour Annuler',
    langModalTitle: '🌐 CHOISIR LA LANGUE',
    langModalSub: 'Modifiez la langue des menus, du tournoi et des contrôles',
    langHint: '◀▶▲▼ Choisir une langue · OK Appliquer · Retour Fermer',
    achModalTitle: (u, t) => `🏅 SUCCÈS DE LA MAISON (${u}/${t})`,
    achModalStats: (m, s, c) => `Parties jouées : ${m} · Meilleure série : ${s} · Coupes : ${c}`,
    achUnlockedKicker: 'Succès débloqué',
    achModalHint: 'Appuyez sur OK ou Retour pour revenir au menu',
    toastRestricted: 'Accès restreint',
    toastMissedAlert: 'Alerte manquée',
    updateTitleAvailable: 'MISE À JOUR DISPONIBLE !',
    updateTitleDownloading: 'TÉLÉCHARGEMENT EN COURS',
    updateTitlePermission: 'AUTORISATION ANDROID TV',
    updateTitleChecking: 'RECHERCHE DE MISES À JOUR',
    updateTitleDefault: 'MISE À JOUR TV',
    updateInstalled: (v) => `Version installée : v${v}`,
    updateCheckingMsg: 'Vérification d’une nouvelle version...',
    updateReadyMsg: 'Prêt à vérifier les mises à jour.',
    updateNowBtn: 'Mettre à jour',
    updatePermissionBtn: 'Installer / Autoriser',
    updateUnderstoodBtn: 'Compris',
    updateRetryBtn: 'Vérifier encore',
    updateLaterBtn: 'Plus tard',
    updateWaitHint: 'Veuillez patienter pendant le téléchargement sur la TV...',
    updateHint: '◀▶ Choisir · OK Confirmer · Retour Fermer',
    podiumHint: 'OK : menu · ▲ : rejouer',
    passTo: 'Passez la télécommande à',
    pressOkReady: 'Appuyez sur OK quand prêt',
    difficultyWord: 'Difficulté',
    cupTitle: 'COUPE TOURNOI',
    cupSubtitle: 'Choisissez joueurs et manches · Marquez des points à chaque jeu pour le trophée',
    cupPlayersLabel: 'JOUEURS',
    cupRoundsLabel: 'MANCHES DE LA COUPE',
    cupRoundsUnit: 'manches',
    cupLineupLabel: 'CIRCUIT DES MINI-JEUX',
    cupShuffleBtn: '🎲 Mélanger les jeux',
    cupStartBtn: '▶ LANCER LA COUPE',
    cupBackBtn: '⬅ Retour au menu',
    cupSetupHint: '◀▶ Régler · ▲▼ Naviguer · OK Confirmer · Retour Menu',
    cupRoundHeader: (cur, tot) => `MANCHE ${cur} SUR ${tot}`,
    cupTrophyLabel: 'COUPE FINALE',
    cupNextMatch: 'PROCHAIN MINI-JEU',
    cupPlayRound: (cur) => `▶ JOUER MANCHE ${cur}`,
    cupSwapGame: '🎲 Changer jeu',
    cupQuitBtn: '✖ Quitter la coupe',
    cupHubHint: '◀▶ Choisir · OK Jouer · Retour Quitter',
    cupWinnerBanner: 'CHAMPION DE LA COUPE !',
    cupTieBanner: 'ÉGALITÉ EN TÊTE !',
    cupPointsUnit: 'pts',
    cupNewBtn: '🔄 Nouvelle Coupe',
    cupMenuBtn: '🏠 Menu Principal',
    cupChampionHint: '◀▶ Choisir · OK Confirmer · Retour Menu',
    cupNextTag: 'SUIVANT',
    cupDoneTag: 'FINI',
  },
};

export function getAchievementText(
  id: AchievementId,
  lang: AppLanguage,
): {title: string; desc: string} {
  const dict: Record<AppLanguage, Record<AchievementId, {title: string; desc: string}>> = {
    es: {
      first_win: {
        title: 'Primera victoria',
        desc: 'Gana tu primera partida en cualquier minijuego',
      },
      streak_3: {title: 'Racha de 3 partidas', desc: 'Un mismo jugador gana 3 partidas seguidas'},
      streak_5: {title: 'Imparable', desc: 'Un mismo jugador gana 5 partidas seguidas'},
      tournament_win: {title: 'Copa completada', desc: 'Gana una Copa Torneo completa'},
      games_5: {title: 'Explorador', desc: 'Prueba 5 minijuegos distintos'},
      games_10: {title: 'Todoterreno', desc: 'Prueba 10 minijuegos distintos'},
      family_full: {title: 'Casa llena', desc: 'Completa una partida con 4 o más jugadores'},
      matches_10: {title: 'Alma de la fiesta', desc: 'Completa 10 partidas en total'},
    },
    en: {
      first_win: {title: 'First Victory', desc: 'Win your first match in any minigame'},
      streak_3: {title: '3-Win Streak', desc: 'The same player wins 3 matches in a row'},
      streak_5: {title: 'Unstoppable', desc: 'The same player wins 5 matches in a row'},
      tournament_win: {title: 'Cup Champion', desc: 'Win a complete Tournament Cup'},
      games_5: {title: 'Explorer', desc: 'Play 5 different minigames'},
      games_10: {title: 'All-Rounder', desc: 'Play 10 different minigames'},
      family_full: {title: 'Full House', desc: 'Finish a match with 4 or more players'},
      matches_10: {title: 'Life of the Party', desc: 'Complete 10 matches in total'},
    },
    pt: {
      first_win: {title: 'Primeira vitória', desc: 'Vença sua primeira partida em qualquer jogo'},
      streak_3: {title: 'Sequência de 3', desc: 'Um mesmo jogador vence 3 partidas seguidas'},
      streak_5: {title: 'Imparável', desc: 'Um mesmo jogador vence 5 partidas seguidas'},
      tournament_win: {title: 'Copa completa', desc: 'Vença uma Copa Torneio completa'},
      games_5: {title: 'Explorador', desc: 'Jogue 5 minijogos diferentes'},
      games_10: {title: 'Versátil', desc: 'Jogue 10 minijogos diferentes'},
      family_full: {title: 'Casa cheia', desc: 'Complete uma partida com 4 ou mais jogadores'},
      matches_10: {title: 'Alma da festa', desc: 'Complete 10 partidas no total'},
    },
    fr: {
      first_win: {title: 'Première victoire', desc: 'Gagnez votre première partie de mini-jeu'},
      streak_3: {title: 'Série de 3', desc: 'Le même joueur gagne 3 parties de suite'},
      streak_5: {title: 'Inarrêtable', desc: 'Le même joueur gagne 5 parties de suite'},
      tournament_win: {title: 'Coupe remportée', desc: 'Remportez une Coupe Tournoi complète'},
      games_5: {title: 'Explorateur', desc: 'Essayez 5 mini-jeux différents'},
      games_10: {title: 'Polyvalent', desc: 'Essayez 10 mini-jeux différents'},
      family_full: {title: 'Maison pleine', desc: 'Terminez une partie à 4 joueurs ou plus'},
      matches_10: {title: 'Âme de la fête', desc: 'Terminez 10 parties au total'},
    },
  };
  return dict[lang][id];
}

type LocalizedPair = {name: string; desc: string};

const GAME_TEXT_EN: Record<string, LocalizedPair> = {
  bomba: {name: 'Hot Potato', desc: '2 burns · reverse pass'},
  reflejos: {name: 'Quick Reflexes', desc: 'Fakeouts + 950 ms'},
  simon: {name: 'Simon Says', desc: '3-step start + timer'},
  machaca: {name: 'Mash OK', desc: '11s · overheat risk'},
  punteria: {name: 'Target Lock', desc: '4 shots · moving zone'},
  reloj: {name: 'Blind Clock', desc: 'Hides at 0.80 s'},
  memoria: {name: 'Memory Match', desc: '16 cards · combo streak'},
  semaforo: {name: 'Crazy Traffic', desc: 'Yellow fakeouts'},
  colores: {name: 'Trick Color', desc: '6 colors · dual rule'},
  flechas: {name: 'Arrow Duel', desc: '16 arrows + reverse'},
  ruleta: {name: 'Challenge Wheel', desc: 'Family party dares'},
  trivia: {name: 'Quick Trivia', desc: 'Fun facts & quiz'},
  impostor: {name: 'The Impostor', desc: '3–6 players'},
  dilema: {name: 'Extreme Dilemma', desc: 'Would you rather?'},
  probable: {name: 'Most Likely', desc: 'Who would do it?'},
  yonunca: {name: 'Never Have I', desc: 'Family confessions'},
  emoji: {name: 'Emoji Cinema', desc: 'Guess the title'},
  pistas: {name: 'Three Clues', desc: 'Fewer clues = more pts'},
  verdad: {name: 'Fact or Myth', desc: 'Test your brain'},
  historia: {name: 'Story Quest', desc: 'Family adventure'},
  fnaf_oficina: {name: 'Office Shift 1', desc: 'Double attacks · power'},
  fnaf_pirate: {name: 'Pirate Cove 1C', desc: 'Fast Foxy (1.1s)'},
  fnaf_puppet: {name: 'Puppet Box', desc: '8 stops · OK x4'},
  fnaf_springtrap: {name: 'Audio Lure 3', desc: 'Behind lure · Reboot x2'},
  fnaf_closet: {name: 'Breathing 4', desc: '8 timed waves'},
  fnaf_salvage: {name: 'Salvage 6', desc: '7 tapes in 22s'},
  fnaf_camaras: {name: 'Security Cams', desc: '4 animatronics · 25s'},
  au_expulsion: {name: 'Emergency Meet', desc: '2 decoys · Skeld eject'},
  au_admin: {name: 'Skeld Admin Map', desc: 'Spot vent jumps'},
  au_falsa: {name: 'Real or Fake Task', desc: '4 suspects · 5 rounds'},
  au_luces: {name: 'Fix Lights', desc: '4 panels · crossed wires'},
  au_distribuidor: {name: 'Calibrate Spin', desc: '3 rings · reverse spin'},
  au_comms: {name: 'Fix Comms', desc: '4 channels · ≥93% signal'},
};

const GAME_TEXT_PT: Record<string, LocalizedPair> = {
  bomba: {name: 'Batata Quente', desc: '2 queimaduras · giro'},
  reflejos: {name: 'Reflexos', desc: 'Fintas + 950 ms'},
  simon: {name: 'Genius', desc: 'Início x3 + relógio'},
  machaca: {name: 'Aperte OK', desc: '11 s + superaquece'},
  punteria: {name: 'Pontaria', desc: '4 tiros · alvo móvel'},
  reloj: {name: 'Relógio Cego', desc: 'Oculta em 0.80 s'},
  memoria: {name: 'Memória', desc: '16 cartas · sequência'},
  semaforo: {name: 'Semáforo Louco', desc: 'Finta amarela'},
  colores: {name: 'Cor Traiçoeira', desc: '6 cores · regra dupla'},
  flechas: {name: 'Duelo de Setas', desc: '16 setas + inversas'},
  ruleta: {name: 'Roleta de Desafios', desc: 'Desafios em família'},
  trivia: {name: 'Trivia Rápida', desc: 'Cultura e quiz'},
  impostor: {name: 'O Impostor', desc: '3–6 jogadores'},
  dilema: {name: 'Dilema Extremo', desc: 'O que você prefere?'},
  probable: {name: 'Mais Provável', desc: 'Quem faria isso?'},
  yonunca: {name: 'Eu Nunca', desc: 'Versão família'},
  emoji: {name: 'Cinema em Emojis', desc: 'Adivinhe o título'},
  pistas: {name: 'Três Dicas', desc: 'Menos dicas = mais pts'},
  verdad: {name: 'Verdade ou Mito', desc: 'Teste sua mente'},
  historia: {name: 'Conto Interativo', desc: 'Aventura em família'},
  fnaf_oficina: {name: 'Turno Escritório 1', desc: 'Ataques duplos · energia'},
  fnaf_pirate: {name: 'Pirate Cove 1C', desc: 'Foxy veloz (1.1 s)'},
  fnaf_puppet: {name: 'Caixa do Puppet', desc: '8 paradas · OK x4'},
  fnaf_springtrap: {name: 'Isca de Áudio 3', desc: 'Áudio atrás · Reboot x2'},
  fnaf_closet: {name: 'Respiração 4', desc: '8 ondas cronometradas'},
  fnaf_salvage: {name: 'Salvamento 6', desc: '7 fitas em 22 s'},
  fnaf_camaras: {name: 'Câmeras FNAF', desc: '4 animatrônicos · 25 s'},
  au_expulsion: {name: 'Reunião Emergência', desc: '2 iscas · ejeção Skeld'},
  au_admin: {name: 'Mapa Admin Skeld', desc: 'Detecte saltos de duto'},
  au_falsa: {name: 'Tarefa Real ou Falsa', desc: '4 suspeitos · 5 rodadas'},
  au_luces: {name: 'Luzes Elétrica', desc: '4 painéis · fios cruzados'},
  au_distribuidor: {name: 'Calibrar Distribuidor', desc: '3 painéis · giro inverso'},
  au_comms: {name: 'Sabotagem Comms', desc: '4 canais · ≥93% sinal'},
};

const GAME_TEXT_FR: Record<string, LocalizedPair> = {
  bomba: {name: 'Patate Chaude', desc: '2 brûlures · inversion'},
  reflejos: {name: 'Réflexes', desc: 'Feintes + 950 ms'},
  simon: {name: 'Simon', desc: 'Départ x3 + chrono'},
  machaca: {name: 'Mitraille OK', desc: '11 s + surchauffe'},
  punteria: {name: 'Tir Précis', desc: '4 tirs · cible mobile'},
  reloj: {name: 'Horloge Aveugle', desc: 'Masquée à 0.80 s'},
  memoria: {name: 'Mémoire', desc: '16 cartes · série'},
  semaforo: {name: 'Feu Fou', desc: 'Feintes orange'},
  colores: {name: 'Couleur Piège', desc: '6 couleurs · double règle'},
  flechas: {name: 'Duel de Flèches', desc: '16 flèches + inverses'},
  ruleta: {name: 'Roue des Défis', desc: 'Défis en famille'},
  trivia: {name: 'Quiz Rapide', desc: 'Culture et questions'},
  impostor: {name: "L'Imposteur", desc: '3–6 joueurs'},
  dilema: {name: 'Dilemme Extrême', desc: 'Que préfères-tu ?'},
  probable: {name: 'Le Plus Probable', desc: 'Qui ferait ça ?'},
  yonunca: {name: "Je N'ai Jamais", desc: 'Version familiale'},
  emoji: {name: 'Ciné en Emojis', desc: 'Devinez le titre'},
  pistas: {name: 'Trois Indices', desc: "Moins d'indices = +pts"},
  verdad: {name: 'Vrai ou Mythe', desc: 'Testez vos savoirs'},
  historia: {name: 'Conte Interactif', desc: 'Aventure en famille'},
  fnaf_oficina: {name: 'Bureau Nuit 1', desc: 'Doubles attaques · batterie'},
  fnaf_pirate: {name: 'Pirate Cove 1C', desc: 'Foxy rapide (1.1 s)'},
  fnaf_puppet: {name: 'Boîte de Puppet', desc: '8 arrêts · OK x4'},
  fnaf_springtrap: {name: 'Leurre Audio 3', desc: 'Audio dos · Reboot x2'},
  fnaf_closet: {name: 'Souffle 4', desc: '8 vagues chrono'},
  fnaf_salvage: {name: 'Récupération 6', desc: '7 bandes en 22 s'},
  fnaf_camaras: {name: 'Caméras Sécurité', desc: '4 animatroniques · 25 s'},
  au_expulsion: {name: "Réunion d'Urgence", desc: '2 leurres · éjection'},
  au_admin: {name: 'Carte Admin Skeld', desc: 'Repérez les conduits'},
  au_falsa: {name: 'Vraie ou Fausse Tâche', desc: '4 suspects · 5 tours'},
  au_luces: {name: 'Panne Électrique', desc: '4 panneaux · fils croisés'},
  au_distribuidor: {name: 'Calibrer Moteur', desc: '3 anneaux · sens inverse'},
  au_comms: {name: 'Sabotage Comms', desc: '4 canaux · ≥93% signal'},
};

const FNAF_OVERRIDE_EN: Record<string, LocalizedPair> = {
  bomba: {name: 'Pass the Cupcake', desc: '2 burns · reverse pass'},
  reflejos: {name: 'Shut the Door', desc: 'Fakeouts + 950 ms'},
  simon: {name: 'Puppet Melody', desc: '3-step start + timer'},
  machaca: {name: 'Charge Flashlight', desc: '11s · overheat risk'},
  punteria: {name: 'Armored Door', desc: '4 shots · moving zone'},
  reloj: {name: '6:00 AM Shift', desc: 'Hides at 0.80 s'},
  memoria: {name: 'Fazbear Cameras', desc: '16 cards · combo streak'},
  semaforo: {name: "Foxy's Light", desc: 'Yellow fakeouts'},
  colores: {name: 'Fazbear Wires', desc: '6 colors · dual rule'},
  flechas: {name: 'Cam Patrol', desc: '16 arrows + reverse'},
  ruleta: {name: 'Fazbear Wheel', desc: 'Night guard dares'},
  trivia: {name: 'Fazbear Trivia', desc: 'How well you know FNAF'},
  impostor: {name: 'Pizzeria Impostor', desc: '3–6 night guards'},
  dilema: {name: 'Night Dilemma', desc: 'Would you rather?'},
  probable: {name: 'Suspect Guard', desc: 'Who would do it?'},
  yonunca: {name: 'Night Shift Never', desc: 'Fazbear confessions'},
  emoji: {name: 'FNAF in Emojis', desc: 'Characters & rooms'},
  pistas: {name: '3 Fazbear Clues', desc: 'Fewer clues = more pts'},
  verdad: {name: 'Myth or Reality', desc: 'FNAF lore & facts'},
  historia: {name: 'Shift Logbook', desc: 'Night at the pizzeria'},
};

const AMONGUS_OVERRIDE_EN: Record<string, LocalizedPair> = {
  bomba: {name: 'Unstable Reactor', desc: '2 overloads · OK only'},
  reflejos: {name: 'Emergency Button', desc: 'Fakeouts + 950 ms'},
  simon: {name: 'Medbay Scanner', desc: '3-step start + timer'},
  machaca: {name: 'Charge Shields', desc: '11s · overheat risk'},
  punteria: {name: 'Align Engine', desc: '4 shots · moving zone'},
  reloj: {name: 'Hyperspace Jump', desc: 'Hides at 0.80 s'},
  memoria: {name: 'Skeld Monitor', desc: '16 cards · combo streak'},
  semaforo: {name: 'Cafeteria Light', desc: 'Yellow fakeouts'},
  colores: {name: 'Admin Wires', desc: '6 colors · dual rule'},
  flechas: {name: 'Skeld Route', desc: '16 arrows + reverse'},
  ruleta: {name: 'Cafeteria Wheel', desc: 'Spaceship dares'},
  trivia: {name: 'Among Us Trivia', desc: 'Maps, roles & tasks'},
  impostor: {name: 'Who is Impostor?', desc: '3–6 crewmates'},
  dilema: {name: 'Space Dilemma', desc: 'Would you rather?'},
  probable: {name: 'Most Sus Crew', desc: 'Cafeteria voting'},
  yonunca: {name: 'Never on Skeld', desc: 'Crew confessions'},
  emoji: {name: 'Ship in Emojis', desc: 'Guess the mission'},
  pistas: {name: '3 Ship Clues', desc: 'Clue radar'},
  verdad: {name: 'Fact or Sabotage', desc: 'Game rules quiz'},
  historia: {name: 'Skeld Chronicle', desc: 'Survive the mission'},
};

export function getLocalizedGameOverride(
  id: string,
  themeMode: ThemeMode,
  lang: AppLanguage,
  fallbackName: string,
  fallbackDesc: string,
): LocalizedPair {
  if (lang === 'es') return {name: fallbackName, desc: fallbackDesc};
  if (lang === 'en') {
    if (themeMode === 'fnaf' && FNAF_OVERRIDE_EN[id]) return FNAF_OVERRIDE_EN[id];
    if (themeMode === 'amongus' && AMONGUS_OVERRIDE_EN[id]) return AMONGUS_OVERRIDE_EN[id];
    return GAME_TEXT_EN[id] ?? {name: fallbackName, desc: fallbackDesc};
  }
  if (lang === 'pt') {
    return GAME_TEXT_PT[id] ?? {name: fallbackName, desc: fallbackDesc};
  }
  if (lang === 'fr') {
    return GAME_TEXT_FR[id] ?? {name: fallbackName, desc: fallbackDesc};
  }
  return {name: fallbackName, desc: fallbackDesc};
}
