import {useCallback, useEffect, useMemo, useState} from 'react';
import {CrewmateSvg} from './AmongUsArtwork';
import {ConfettiBurst} from './ConfettiBurst';
import {
  AppLanguage,
  DIFFICULTY_META,
  GameDifficulty,
  PLAYER_STAGE_COLORS,
  RemoteKey,
  ThemeMode,
  playControlClick,
  tone,
} from '../../utils/stageAudio';
import {UI_TEXT, getDifficultyLabel, getPlayerLabel} from '../../utils/i18n';

export interface CupGameDef {
  id: string;
  name: string;
  emoji: string;
  desc: string;
}

export interface CupRoundResult {
  gameId: string;
  winnerIdx: number;
  deltas: number[];
}

export interface CupTournamentState {
  phase: 'SETUP' | 'HUB' | 'CHAMPION';
  playerCount: number;
  totalRounds: number;
  currentRound: number; // 0-indexed next round to play
  lineup: CupGameDef[];
  scores: number[];
  lastDeltas: number[];
  medals: Array<{gold: number; silver: number; bronze: number}>;
  history: CupRoundResult[];
}

const CUP_ROUND_OPTIONS = [3, 5, 7, 10];
const CUP_PLAYER_OPTIONS = [2, 3, 4, 5, 6];

export function buildCupLineup(pool: CupGameDef[], count: number): CupGameDef[] {
  if (pool.length === 0) return [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const res: CupGameDef[] = [];
  for (let i = 0; i < count; i++) {
    res.push(shuffled[i % shuffled.length]);
    if ((i + 1) % shuffled.length === 0 && i + 1 < count) {
      shuffled.sort(() => Math.random() - 0.5);
    }
  }
  return res;
}

export function createInitialCupState(
  initialPlayers: number,
  pool: CupGameDef[],
): CupTournamentState {
  const playerCount = Math.max(2, Math.min(6, initialPlayers));
  const totalRounds = 5;
  return {
    phase: 'SETUP',
    playerCount,
    totalRounds,
    currentRound: 0,
    lineup: buildCupLineup(pool, totalRounds),
    scores: Array(playerCount).fill(0),
    lastDeltas: Array(playerCount).fill(0),
    medals: Array.from({length: playerCount}, () => ({gold: 0, silver: 0, bronze: 0})),
    history: [],
  };
}

interface TournamentCupScreenProps {
  state: CupTournamentState;
  pool: CupGameDef[];
  themeMode: ThemeMode;
  difficulty: GameDifficulty;
  lang: AppLanguage;
  onUpdateState: (updater: (prev: CupTournamentState) => CupTournamentState) => void;
  onLaunchRound: (gameId: string) => void;
  onExit: () => void;
  registerKeyHandler: (handler: ((k: RemoteKey) => void) | null) => void;
}

export function TournamentCupScreen({
  state,
  pool,
  themeMode,
  difficulty,
  lang,
  onUpdateState,
  onLaunchRound,
  onExit,
  registerKeyHandler,
}: TournamentCupScreenProps) {
  const t = UI_TEXT[lang];
  const [setupRow, setSetupRow] = useState<0 | 1 | 2>(2);
  const [setupBtn, setSetupBtn] = useState<0 | 1 | 2>(1); // 0 shuffle, 1 start, 2 back
  const [hubBtn, setHubBtn] = useState<0 | 1 | 2>(0); // 0 play round, 1 swap game, 2 quit
  const [champBtn, setChampBtn] = useState<0 | 1>(0); // 0 new cup, 1 menu

  useEffect(() => {
    if (state.phase === 'HUB') setHubBtn(0);
    if (state.phase === 'CHAMPION') setChampBtn(0);
    if (state.phase === 'SETUP') {
      setSetupRow(2);
      setSetupBtn(1);
    }
  }, [state.phase, state.currentRound]);

  const setPlayerCount = useCallback(
    (delta: number) => {
      playControlClick();
      onUpdateState((prev) => {
        const curIdx = CUP_PLAYER_OPTIONS.indexOf(prev.playerCount);
        const nextIdx = (curIdx + delta + CUP_PLAYER_OPTIONS.length) % CUP_PLAYER_OPTIONS.length;
        const playerCount = CUP_PLAYER_OPTIONS[nextIdx];
        return {
          ...prev,
          playerCount,
          scores: Array(playerCount).fill(0),
          lastDeltas: Array(playerCount).fill(0),
          medals: Array.from({length: playerCount}, () => ({gold: 0, silver: 0, bronze: 0})),
        };
      });
    },
    [onUpdateState],
  );

  const setRoundsCount = useCallback(
    (delta: number) => {
      playControlClick();
      onUpdateState((prev) => {
        const curIdx = CUP_ROUND_OPTIONS.indexOf(prev.totalRounds);
        const nextIdx = (curIdx + delta + CUP_ROUND_OPTIONS.length) % CUP_ROUND_OPTIONS.length;
        const totalRounds = CUP_ROUND_OPTIONS[nextIdx];
        return {
          ...prev,
          totalRounds,
          lineup: buildCupLineup(pool, totalRounds),
        };
      });
    },
    [onUpdateState, pool],
  );

  const shuffleLineup = useCallback(() => {
    playControlClick();
    onUpdateState((prev) => ({
      ...prev,
      lineup: buildCupLineup(pool, prev.totalRounds),
    }));
  }, [onUpdateState, pool]);

  const startCup = useCallback(() => {
    playControlClick();
    tone(523.25, 0.12, 'triangle', 0.08);
    window.setTimeout(() => tone(659.25, 0.16, 'triangle', 0.08), 90);
    onUpdateState((prev) => ({
      ...prev,
      phase: 'HUB',
      currentRound: 0,
      scores: Array(prev.playerCount).fill(0),
      lastDeltas: Array(prev.playerCount).fill(0),
      medals: Array.from({length: prev.playerCount}, () => ({gold: 0, silver: 0, bronze: 0})),
      history: [],
    }));
  }, [onUpdateState]);

  const swapNextGame = useCallback(() => {
    if (pool.length <= 1) return;
    playControlClick();
    onUpdateState((prev) => {
      const idx = prev.currentRound;
      const current = prev.lineup[idx];
      const usedRecently = new Set(prev.lineup.map((g) => g.id));
      const candidates = pool.filter((g) => g.id !== current?.id && !usedRecently.has(g.id));
      const fallback = pool.filter((g) => g.id !== current?.id);
      const pickFrom = candidates.length > 0 ? candidates : fallback;
      const replacement = pickFrom[Math.floor(Math.random() * pickFrom.length)];
      if (!replacement) return prev;
      const nextLineup = [...prev.lineup];
      nextLineup[idx] = replacement;
      return {...prev, lineup: nextLineup};
    });
  }, [onUpdateState, pool]);

  const resetToSetup = useCallback(() => {
    playControlClick();
    onUpdateState((prev) => createInitialCupState(prev.playerCount, pool));
  }, [onUpdateState, pool]);

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (state.phase === 'SETUP') {
        if (k === 'back') {
          playControlClick();
          onExit();
          return;
        }
        if (k === 'up') {
          playControlClick();
          setSetupRow((r) => ((r + 2) % 3) as 0 | 1 | 2);
          return;
        }
        if (k === 'down') {
          playControlClick();
          setSetupRow((r) => ((r + 1) % 3) as 0 | 1 | 2);
          return;
        }
        if (setupRow === 0) {
          if (k === 'left') setPlayerCount(-1);
          else if (k === 'right' || k === 'ok') setPlayerCount(1);
        } else if (setupRow === 1) {
          if (k === 'left') setRoundsCount(-1);
          else if (k === 'right' || k === 'ok') setRoundsCount(1);
        } else {
          if (k === 'left') {
            playControlClick();
            setSetupBtn((b) => ((b + 2) % 3) as 0 | 1 | 2);
          } else if (k === 'right') {
            playControlClick();
            setSetupBtn((b) => ((b + 1) % 3) as 0 | 1 | 2);
          } else if (k === 'ok') {
            if (setupBtn === 0) shuffleLineup();
            else if (setupBtn === 1) startCup();
            else {
              playControlClick();
              onExit();
            }
          }
        }
        return;
      }

      if (state.phase === 'HUB') {
        if (k === 'back') {
          playControlClick();
          onExit();
          return;
        }
        if (k === 'left') {
          playControlClick();
          setHubBtn((b) => ((b + 2) % 3) as 0 | 1 | 2);
        } else if (k === 'right') {
          playControlClick();
          setHubBtn((b) => ((b + 1) % 3) as 0 | 1 | 2);
        } else if (k === 'ok') {
          if (hubBtn === 0) {
            const nextGame = state.lineup[state.currentRound];
            if (nextGame) {
              playControlClick();
              onLaunchRound(nextGame.id);
            }
          } else if (hubBtn === 1) {
            swapNextGame();
          } else {
            playControlClick();
            onExit();
          }
        }
        return;
      }

      if (state.phase === 'CHAMPION') {
        if (k === 'back') {
          playControlClick();
          onExit();
          return;
        }
        if (k === 'left' || k === 'right' || k === 'up' || k === 'down') {
          playControlClick();
          setChampBtn((b) => (b === 0 ? 1 : 0));
        } else if (k === 'ok') {
          if (champBtn === 0) resetToSetup();
          else {
            playControlClick();
            onExit();
          }
        }
      }
    },
    [
      state.phase,
      state.lineup,
      state.currentRound,
      setupRow,
      setupBtn,
      hubBtn,
      champBtn,
      setPlayerCount,
      setRoundsCount,
      shuffleLineup,
      startCup,
      swapNextGame,
      resetToSetup,
      onLaunchRound,
      onExit,
    ],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  const rankedIndices = useMemo(() => {
    return Array.from({length: state.playerCount}, (_, i) => i).sort(
      (a, b) => (state.scores[b] ?? 0) - (state.scores[a] ?? 0),
    );
  }, [state.playerCount, state.scores]);

  const maxScore = useMemo(() => {
    return Math.max(1, ...state.scores);
  }, [state.scores]);

  const topScore = useMemo(() => {
    return Math.max(0, ...state.scores);
  }, [state.scores]);

  const rankOfPlayer = useMemo(() => {
    const ranks = Array(state.playerCount).fill(1);
    for (let i = 0; i < rankedIndices.length; i++) {
      const pIdx = rankedIndices[i];
      if (i > 0 && state.scores[pIdx] === state.scores[rankedIndices[i - 1]]) {
        ranks[pIdx] = ranks[rankedIndices[i - 1]];
      } else {
        ranks[pIdx] = i + 1;
      }
    }
    return ranks;
  }, [rankedIndices, state.playerCount, state.scores]);

  const accentColor =
    themeMode === 'fnaf' ? '#f59e0b' : themeMode === 'amongus' ? '#22d3ee' : '#fbbf24';

  /* ------------------------------------------------------------------------ */
  /* SETUP SCREEN                                                             */
  /* ------------------------------------------------------------------------ */
  if (state.phase === 'SETUP') {
    return (
      <div className="cup-screen">
        <div className="cup-header">
          <div className="cup-title-row">
            <span className="cup-trophy-icon">🏆</span>
            <h1 className="cup-title" style={{color: accentColor}}>
              {t.cupTitle}
            </h1>
            <span className="cup-diff-tag" style={{color: DIFFICULTY_META[difficulty].accent}}>
              {DIFFICULTY_META[difficulty].emoji} {getDifficultyLabel(difficulty, lang)}
            </span>
          </div>
          <p className="cup-sub">{t.cupSubtitle}</p>
        </div>

        <div className="cup-setup-controls">
          <div
            className={`cup-setup-row ${setupRow === 0 ? 'sel' : ''}`}
            onClick={() => {
              setSetupRow(0);
              setPlayerCount(1);
            }}
          >
            <div className="cup-setup-label">{t.cupPlayersLabel}</div>
            <div className="cup-setup-picker">
              <button
                type="button"
                className="cup-arrow-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSetupRow(0);
                  setPlayerCount(-1);
                }}
              >
                ◀
              </button>
              <div className="cup-player-dots">
                {Array.from({length: state.playerCount}, (_, i) => (
                  <span
                    key={i}
                    className="cup-player-dot"
                    style={{backgroundColor: PLAYER_STAGE_COLORS[i % PLAYER_STAGE_COLORS.length]}}
                  >
                    {i + 1}
                  </span>
                ))}
              </div>
              <button
                type="button"
                className="cup-arrow-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSetupRow(0);
                  setPlayerCount(1);
                }}
              >
                ▶
              </button>
            </div>
          </div>

          <div
            className={`cup-setup-row ${setupRow === 1 ? 'sel' : ''}`}
            onClick={() => {
              setSetupRow(1);
              setRoundsCount(1);
            }}
          >
            <div className="cup-setup-label">{t.cupRoundsLabel}</div>
            <div className="cup-setup-picker">
              <button
                type="button"
                className="cup-arrow-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSetupRow(1);
                  setRoundsCount(-1);
                }}
              >
                ◀
              </button>
              <span className="cup-rounds-val">
                {state.totalRounds} {t.cupRoundsUnit}
              </span>
              <button
                type="button"
                className="cup-arrow-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSetupRow(1);
                  setRoundsCount(1);
                }}
              >
                ▶
              </button>
            </div>
          </div>
        </div>

        <div className="cup-lineup-box">
          <div className="cup-lineup-heading">{t.cupLineupLabel}</div>
          <div className="cup-track">
            {state.lineup.map((g, i) => (
              <div key={`${g.id}-${i}`} className="cup-node">
                <span className="cup-node-num">{i + 1}</span>
                <span className="cup-node-emoji">{g.emoji}</span>
                <span className="cup-node-name">{g.name}</span>
              </div>
            ))}
            <div className="cup-node cup-node-trophy">
              <span className="cup-node-emoji">🏆</span>
              <span className="cup-node-name">{t.cupTrophyLabel}</span>
            </div>
          </div>
        </div>

        <div className="cup-actions">
          <button
            type="button"
            onClick={() => {
              setSetupRow(2);
              setSetupBtn(0);
              shuffleLineup();
            }}
            className={`cup-btn secondary ${setupRow === 2 && setupBtn === 0 ? 'sel' : ''}`}
          >
            {t.cupShuffleBtn}
          </button>
          <button
            type="button"
            onClick={() => {
              setSetupRow(2);
              setSetupBtn(1);
              startCup();
            }}
            className={`cup-btn primary ${setupRow === 2 && setupBtn === 1 ? 'sel' : ''}`}
          >
            {t.cupStartBtn}
          </button>
          <button
            type="button"
            onClick={() => {
              playControlClick();
              onExit();
            }}
            className={`cup-btn secondary ${setupRow === 2 && setupBtn === 2 ? 'sel' : ''}`}
          >
            {t.cupBackBtn}
          </button>
        </div>

        <div className="stage-legend">{t.cupSetupHint}</div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* CHAMPION CEREMONY SCREEN                                                 */
  /* ------------------------------------------------------------------------ */
  if (state.phase === 'CHAMPION') {
    const winners = rankedIndices.filter((i) => state.scores[i] === topScore);
    const isTie = winners.length > 1;
    const winnerText = winners.map((i) => getPlayerLabel(i, lang)).join(' & ');

    return (
      <div className="cup-screen">
        <ConfettiBurst intense />
        <div className="cup-champ-hero">
          <div className="cup-champ-trophy">🏆</div>
          <div className="cup-champ-kicker" style={{color: accentColor}}>
            {isTie ? t.cupTieBanner : t.cupWinnerBanner}
          </div>
          <div className="cup-champ-name">{winnerText}</div>
        </div>

        <div className="cup-columns">
          {rankedIndices.map((pIdx) => {
            const pts = state.scores[pIdx] ?? 0;
            const rank = rankOfPlayer[pIdx];
            const color = PLAYER_STAGE_COLORS[pIdx % PLAYER_STAGE_COLORS.length];
            const barPct = Math.max(18, Math.round((pts / maxScore) * 100));
            const med = state.medals[pIdx];
            return (
              <div
                key={pIdx}
                className={`cup-col ${rank === 1 ? 'leader' : ''}`}
                style={{borderColor: rank === 1 ? '#fde047' : color}}
              >
                <div className="cup-col-rank">
                  {rank === 1 ? '👑 #1' : `#${rank}`}
                </div>
                <div className="cup-col-avatar">
                  {themeMode === 'amongus' ? (
                    <CrewmateSvg
                      bodyColor={color}
                      shadeColor={color}
                      className="h-[5.4vh] w-[5.4vh]"
                    />
                  ) : (
                    <span className="cup-col-badge" style={{backgroundColor: color}}>
                      P{pIdx + 1}
                    </span>
                  )}
                </div>
                <div className="cup-col-bar-wrap">
                  <div
                    className="cup-col-bar"
                    style={{height: `${barPct}%`, backgroundColor: color}}
                  >
                    <span className="cup-col-pts">{pts}</span>
                  </div>
                </div>
                <div className="cup-col-name">{getPlayerLabel(pIdx, lang)}</div>
                <div className="cup-col-medals">
                  <span>🥇{med?.gold ?? 0}</span>
                  <span>🥈{med?.silver ?? 0}</span>
                  <span>🥉{med?.bronze ?? 0}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="cup-actions">
          <button
            type="button"
            onClick={() => {
              setChampBtn(0);
              resetToSetup();
            }}
            className={`cup-btn primary ${champBtn === 0 ? 'sel' : ''}`}
          >
            {t.cupNewBtn}
          </button>
          <button
            type="button"
            onClick={() => {
              playControlClick();
              onExit();
            }}
            className={`cup-btn secondary ${champBtn === 1 ? 'sel' : ''}`}
          >
            {t.cupMenuBtn}
          </button>
        </div>
        <div className="stage-legend">{t.cupChampionHint}</div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* HUB / ACTIVE SCOREBOARD (234 PLAYER MINI GAMES CUP SCREEN)               */
  /* ------------------------------------------------------------------------ */
  const nextGame = state.lineup[state.currentRound] ?? state.lineup[0];

  return (
    <div className="cup-screen">
      <div className="cup-header">
        <div className="cup-title-row">
          <span className="cup-trophy-icon">🏆</span>
          <h1 className="cup-title" style={{color: accentColor}}>
            {t.cupRoundHeader(state.currentRound + 1, state.totalRounds)}
          </h1>
          <span className="cup-diff-tag" style={{color: DIFFICULTY_META[difficulty].accent}}>
            {DIFFICULTY_META[difficulty].emoji} {getDifficultyLabel(difficulty, lang)}
          </span>
        </div>

        {/* CUP PROGRESS TRACK (exact 234 Player Mini Games style chain) */}
        <div className="cup-track">
          {state.lineup.map((g, i) => {
            const done = i < state.currentRound;
            const current = i === state.currentRound;
            const winnerColor =
              done && state.history[i]
                ? PLAYER_STAGE_COLORS[state.history[i].winnerIdx % PLAYER_STAGE_COLORS.length]
                : undefined;
            return (
              <div
                key={`${g.id}-${i}`}
                className={`cup-node ${done ? 'done' : ''} ${current ? 'current' : ''}`}
              >
                <span className="cup-node-num">
                  {done ? '✓' : current ? t.cupNextTag : String(i + 1)}
                </span>
                <span className="cup-node-emoji">{g.emoji}</span>
                <span className="cup-node-name">{g.name}</span>
                {done && winnerColor && (
                  <span className="cup-node-winner-dot" style={{backgroundColor: winnerColor}} />
                )}
              </div>
            );
          })}
          <div className="cup-node cup-node-trophy">
            <span className="cup-node-emoji">🏆</span>
            <span className="cup-node-name">{t.cupTrophyLabel}</span>
          </div>
        </div>
      </div>

      {/* VERTICAL SCOREBOARD COLUMNS (2 3 4 Player Mini Games iconic columns) */}
      <div className="cup-columns">
        {Array.from({length: state.playerCount}, (_, pIdx) => {
          const pts = state.scores[pIdx] ?? 0;
          const delta = state.lastDeltas[pIdx] ?? 0;
          const rank = rankOfPlayer[pIdx];
          const isLeader = topScore > 0 && pts === topScore;
          const color = PLAYER_STAGE_COLORS[pIdx % PLAYER_STAGE_COLORS.length];
          const barPct = topScore === 0 ? 18 : Math.max(18, Math.round((pts / maxScore) * 100));
          const med = state.medals[pIdx];

          return (
            <div
              key={pIdx}
              className={`cup-col ${isLeader ? 'leader' : ''}`}
              style={{borderColor: isLeader ? '#fde047' : color}}
            >
              <div className="cup-col-rank">
                {isLeader ? '👑 ' : ''}#{rank}
              </div>
              <div className="cup-col-avatar">
                {themeMode === 'amongus' ? (
                  <CrewmateSvg
                    bodyColor={color}
                    shadeColor={color}
                    className="h-[5vh] w-[5vh]"
                  />
                ) : (
                  <span className="cup-col-badge" style={{backgroundColor: color}}>
                    P{pIdx + 1}
                  </span>
                )}
              </div>
              <div className="cup-col-bar-wrap">
                <div
                  className="cup-col-bar"
                  style={{height: `${barPct}%`, backgroundColor: color}}
                >
                  <span className="cup-col-pts">{pts}</span>
                </div>
                {delta > 0 && <span className="cup-col-delta">+{delta}</span>}
              </div>
              <div className="cup-col-name">{getPlayerLabel(pIdx, lang)}</div>
              <div className="cup-col-medals">
                <span>🥇{med?.gold ?? 0}</span>
                <span>🥈{med?.silver ?? 0}</span>
                <span>🥉{med?.bronze ?? 0}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* NEXT MATCH CARD + ACTIONS */}
      {nextGame && (
        <div className="cup-next-banner">
          <div className="cup-next-emoji">{nextGame.emoji}</div>
          <div className="cup-next-info">
            <div className="cup-next-kicker">{t.cupNextMatch}</div>
            <div className="cup-next-title">{nextGame.name}</div>
            <div className="cup-next-desc">{nextGame.desc}</div>
          </div>
          <div className="cup-actions inline">
            <button
              type="button"
              onClick={() => {
                playControlClick();
                onLaunchRound(nextGame.id);
              }}
              className={`cup-btn primary ${hubBtn === 0 ? 'sel' : ''}`}
            >
              {t.cupPlayRound(state.currentRound + 1)}
            </button>
            <button
              type="button"
              onClick={() => {
                setHubBtn(1);
                swapNextGame();
              }}
              className={`cup-btn secondary ${hubBtn === 1 ? 'sel' : ''}`}
            >
              {t.cupSwapGame}
            </button>
            <button
              type="button"
              onClick={() => {
                playControlClick();
                onExit();
              }}
              className={`cup-btn secondary ${hubBtn === 2 ? 'sel' : ''}`}
            >
              {t.cupQuitBtn}
            </button>
          </div>
        </div>
      )}

      <div className="stage-legend">{t.cupHubHint}</div>
    </div>
  );
}
