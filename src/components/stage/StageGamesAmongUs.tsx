import {useCallback, useEffect, useRef, useState} from 'react';
import {
  RemoteKey,
  StageGameProps,
  playControlClick,
  tone,
} from '../../utils/stageAudio';
import {setMusicDucked} from '../../utils/stageMusic';
import {PassScreen} from './StageGamesArcade';
import {
  AMONG_US_COLORS,
  AdminCrewIconSvg,
  CrewColorMeta,
  CrewmateSvg,
  EjectSpaceBackdrop,
  EmergencyButtonSvg,
  ShapeshifterBadgeSvg,
  SkeldVentSvg,
} from './AmongUsArtwork';

function shuffleIndices(len: number): number[] {
  const arr = Array.from({length: len}, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickDistinctColors(count: number): CrewColorMeta[] {
  return shuffleIndices(AMONG_US_COLORS.length)
    .slice(0, count)
    .map((idx) => AMONG_US_COLORS[idx]);
}

/* -------------------------------------------------------------------------- */
/* 1. REUNIÓN DE EMERGENCIA (DIFÍCIL: 2 SEÑUELOS + 8s VOTO + EXPULSIÓN SKELD) */
/* -------------------------------------------------------------------------- */

const SKELD_MEETING_ROOMS = [
  'Cafetería',
  'Electricidad',
  'Ala Médica',
  'Navegación',
  'Reactor',
  'Armería',
];

export function AuExpulsionStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
}: StageGameProps) {
  const np = players.length;
  const ROUNDS = 4;
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<'WATCH' | 'MEETING' | 'VOTE' | 'EJECT'>('WATCH');
  const [suspects] = useState(() => AMONG_US_COLORS);
  const [positions, setPositions] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const [impostorIdx, setImpostorIdx] = useState(0);
  const [blackout, setBlackout] = useState(false);
  const [ventOpen, setVentOpen] = useState(false);
  const [ventRoom, setVentRoom] = useState(1);
  const [decoyVentRooms, setDecoyVentRooms] = useState<[number, number]>([3, 4]);
  const [voterIdx, setVoterIdx] = useState(0);
  const [voteTimeLeft, setVoteTimeLeft] = useState(8);
  const [cursor, setCursor] = useState(0); // 0..5 suspects, 6 = Skip
  const [votes, setVotes] = useState<(number | null)[]>(() => Array(np).fill(null));
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));

  // Ejection cutscene state
  const [ejectedIdx, setEjectedIdx] = useState<number | null>(null);
  const [ejectReason, setEjectReason] = useState<'voted' | 'tie' | 'skip'>('voted');
  const [typedLine1, setTypedLine1] = useState('');
  const [typedLine2, setTypedLine2] = useState('');
  const [ejectReady, setEjectReady] = useState(false);
  const [ejectRunId, setEjectRunId] = useState(0);

  const timersRef = useRef<number[]>([]);
  const ejectTimersRef = useRef<number[]>([]);
  const voteIvRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    if (voteIvRef.current) {
      window.clearInterval(voteIvRef.current);
      voteIvRef.current = null;
    }
  }, []);

  const clearEjectTimers = useCallback(() => {
    ejectTimersRef.current.forEach((id) => window.clearTimeout(id));
    ejectTimersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
      clearEjectTimers();
      setMusicDucked(false);
    };
  }, [clearTimers, clearEjectTimers]);

  useEffect(() => {
    setMusicDucked(phase === 'EJECT');
    if (phase === 'MEETING') setBg('#7f1d1d');
    else if (phase === 'EJECT') setBg('#000000');
    else setBg('#08101c');
  }, [phase, setBg]);

  const startEjectionCutscene = useCallback(
    (
      targetIdx: number | null,
      reason: 'voted' | 'tie' | 'skip',
      impIdx: number,
    ) => {
      clearEjectTimers();
      setEjectedIdx(targetIdx);
      setEjectReason(reason);
      setTypedLine1('');
      setTypedLine2('');
      setEjectReady(false);
      setEjectRunId((id) => id + 1);
      setPhase('EJECT');

      // Sonido inicial de escotilla / vacío espacial
      tone(92, 0.36, 'triangle', 0.14);

      const caught = reason === 'voted' && targetIdx === impIdx;
      const line1Full =
        reason === 'voted' && targetIdx !== null
          ? `${suspects[targetIdx].label} ${caught ? 'era El Impostor.' : 'no era El Impostor.'}`
          : reason === 'tie'
            ? 'Nadie fue expulsado. (Empate)'
            : 'Nadie fue expulsado. (Omitido)';
      const line2Full = caught ? 'Quedan 0 Impostores.' : 'Queda 1 Impostor.';

      const startDelay = 520;
      const charMs = 58;

      for (let i = 1; i <= line1Full.length; i++) {
        const t = window.setTimeout(() => {
          setTypedLine1(line1Full.slice(0, i));
          const ch = line1Full[i - 1];
          if (ch && ch !== ' ') {
            tone(880 + (i % 3) * 45, 0.025, 'square', 0.035);
          }
        }, startDelay + i * charMs);
        ejectTimersRef.current.push(t);
      }

      const line1End = startDelay + line1Full.length * charMs;
      const line2Start = line1End + 540;

      // Golpe dramático al revelar si era o no El Impostor
      ejectTimersRef.current.push(
        window.setTimeout(() => {
          tone(caught ? 523 : 118, 0.35, caught ? 'triangle' : 'sawtooth', 0.16);
        }, line1End + 110),
      );

      for (let j = 1; j <= line2Full.length; j++) {
        const t = window.setTimeout(() => {
          setTypedLine2(line2Full.slice(0, j));
          const ch = line2Full[j - 1];
          if (ch && ch !== ' ') {
            tone(640 + (j % 2) * 35, 0.02, 'triangle', 0.028);
          }
        }, line2Start + j * 48);
        ejectTimersRef.current.push(t);
      }

      const readyAt = Math.max(3300, line2Start + line2Full.length * 48 + 380);
      ejectTimersRef.current.push(
        window.setTimeout(() => {
          setEjectReady(true);
        }, readyAt),
      );
    },
    [clearEjectTimers, suspects],
  );

  const finalizeVotes = useCallback(
    (finalVotes: (number | null)[], impIdx: number) => {
      if (voteIvRef.current) {
        window.clearInterval(voteIvRef.current);
        voteIvRef.current = null;
      }
      const counts = Array(6).fill(0);
      let skipVotes = 0;
      finalVotes.forEach((v) => {
        if (v === null || v === 6) skipVotes += 1;
        else if (counts[v] !== undefined) counts[v] += 1;
      });

      const maxColorVotes = Math.max(...counts);
      const topCandidates = counts
        .map((c, idx) => ({c, idx}))
        .filter((item) => item.c === maxColorVotes);

      let chosenIdx: number | null = null;
      let reason: 'voted' | 'tie' | 'skip' = 'skip';

      if (maxColorVotes === 0 || skipVotes >= maxColorVotes) {
        chosenIdx = null;
        reason = skipVotes > maxColorVotes ? 'skip' : 'tie';
      } else if (topCandidates.length > 1) {
        chosenIdx = null;
        reason = 'tie';
      } else {
        chosenIdx = topCandidates[0].idx;
        reason = 'voted';
      }

      setScores((prev) =>
        prev.map((s, pIdx) => (finalVotes[pIdx] === impIdx ? s + 1 : s)),
      );
      startEjectionCutscene(chosenIdx, reason, impIdx);
    },
    [startEjectionCutscene],
  );

  const startWatchRound = useCallback(() => {
    clearTimers();
    clearEjectTimers();
    const imp = Math.floor(Math.random() * 6);
    const shuffledRooms = shuffleIndices(6);
    const vRoom = shuffledRooms[0];
    const d1 = shuffledRooms[1];
    const d2 = shuffledRooms[2];

    setImpostorIdx(imp);
    setVentRoom(vRoom);
    setDecoyVentRooms([d1, d2]);
    setVentOpen(false);
    setBlackout(false);
    setPositions(shuffleIndices(6));
    setVoterIdx(0);
    setCursor(0);
    setVotes(Array(np).fill(null));
    setPhase('WATCH');

    timersRef.current.push(
      window.setTimeout(() => {
        setPositions(shuffleIndices(6));
        tone(340, 0.06);
      }, 550),
      window.setTimeout(() => {
        setPositions(shuffleIndices(6));
        tone(370, 0.06);
      }, 1050),
      window.setTimeout(() => {
        setBlackout(true);
        tone(145, 0.14, 'square');
      }, 1500),
      window.setTimeout(() => {
        setBlackout(false);
        const shuffled = shuffleIndices(6);
        shuffled[imp] = vRoom;
        setPositions(shuffled);
        setVentOpen(true);
        tone(175, 0.22, 'sawtooth');
      }, 1980),
      window.setTimeout(() => {
        setVentOpen(false);
        setPhase('MEETING');
        tone(660, 0.16);
      }, 2880),
      window.setTimeout(() => {
        setPhase('VOTE');
      }, 3900),
    );
  }, [clearTimers, clearEjectTimers, np]);

  useEffect(() => {
    startWatchRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Límite de 8 s por turno de voto
  useEffect(() => {
    if (phase !== 'VOTE') return;
    if (voteIvRef.current) window.clearInterval(voteIvRef.current);
    let left = 8;
    setVoteTimeLeft(8);
    voteIvRef.current = window.setInterval(() => {
      left -= 1;
      setVoteTimeLeft(Math.max(0, left));
      if (left <= 0) {
        if (voteIvRef.current) window.clearInterval(voteIvRef.current);
        tone(160, 0.2, 'sawtooth');
        const nextVotes = [...votes];
        nextVotes[voterIdx] = 6;
        setVotes(nextVotes);
        if (voterIdx + 1 < np) {
          setVoterIdx((v) => v + 1);
          setCursor(0);
        } else {
          finalizeVotes(nextVotes, impostorIdx);
        }
      }
    }, 1000);
    return () => {
      if (voteIvRef.current) {
        window.clearInterval(voteIvRef.current);
        voteIvRef.current = null;
      }
    };
  }, [phase, voterIdx, np, votes, impostorIdx, finalizeVotes]);

  const submitVote = useCallback(
    (choiceIdx: number) => {
      tone(520, 0.08);
      const nextVotes = [...votes];
      nextVotes[voterIdx] = choiceIdx;
      setVotes(nextVotes);

      if (voterIdx + 1 < np) {
        setVoterIdx((v) => v + 1);
        setCursor(0);
      } else {
        finalizeVotes(nextVotes, impostorIdx);
      }
    },
    [votes, voterIdx, np, impostorIdx, finalizeVotes],
  );

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'VOTE') {
        if (k === 'right') {
          setCursor((c) => (c + 1) % 7);
          playControlClick();
        } else if (k === 'left') {
          setCursor((c) => (c + 6) % 7);
          playControlClick();
        } else if (k === 'down') {
          setCursor((c) => (c < 3 ? c + 3 : 6));
          playControlClick();
        } else if (k === 'up') {
          setCursor((c) => (c === 6 ? 4 : c >= 3 ? c - 3 : 6));
          playControlClick();
        } else if (k === 'ok') {
          submitVote(cursor);
        }
      } else if (phase === 'EJECT' && k === 'ok' && ejectReady) {
        if (round < ROUNDS) {
          setRound((r) => r + 1);
          startWatchRound();
        } else {
          const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => scores[b] - scores[a]);
          onFinish(
            'Reunión de Emergencia',
            rank,
            rank.map((p) => `${scores[p]}/${ROUNDS} impostores descubiertos`),
            () => {
              setScores(Array(np).fill(0));
              setRound(1);
              startWatchRound();
            },
          );
        }
      }
    },
    [phase, cursor, ejectReady, round, np, scores, submitVote, startWatchRound, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'MEETING') {
    return (
      <div className="stage-c">
        <EmergencyButtonSvg pressed className="mx-auto h-[22vh] w-[22vh]" />
        <div className="stage-big text-red-400 mt-3">¡REUNIÓN DE EMERGENCIA!</div>
        <div className="stage-sub">
          Sabotaje reportado cerca de {SKELD_MEETING_ROOMS[ventRoom]}
        </div>
      </div>
    );
  }

  if (phase === 'EJECT') {
    const ejected = ejectedIdx !== null ? suspects[ejectedIdx] : null;
    return (
      <div
        className="stage-c relative overflow-hidden cursor-pointer"
        onClick={() => {
          if (ejectReady) handleKey('ok');
        }}
      >
        <EjectSpaceBackdrop />

        {ejectReason === 'voted' && ejected && (
          <div
            key={`eject-fly-${ejectRunId}`}
            className="au-eject-crew pointer-events-none relative z-10 mx-auto my-0"
          >
            <CrewmateSvg
              bodyColor={ejected.body}
              shadeColor={ejected.shade}
              state="alive"
              className="mx-auto h-[17vh] w-[17vh]"
            />
          </div>
        )}

        <div className="relative z-20 mx-auto max-w-[82vw] text-center">
          <div
            className="min-h-[8vh] font-bold tracking-wide text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
            style={{fontSize: 'clamp(1.7rem, 5.4vh, 3.6rem)'}}
          >
            {typedLine1}
          </div>
          <div
            className="mt-[1.4vh] min-h-[4.5vh] font-medium text-slate-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
            style={{fontSize: 'clamp(1.1rem, 3.1vh, 2.1rem)'}}
          >
            {typedLine2}
          </div>
        </div>

        <div className="relative z-20 mt-[4vh] text-[2vh] text-slate-400">
          {ejectReady
            ? `El impostor era ${suspects[impostorIdx].label} · OK: ${
                round < ROUNDS ? 'siguiente ronda' : 'ver resultados'
              }`
            : 'Expulsión en curso…'}
        </div>
      </div>
    );
  }

  if (phase === 'VOTE') {
    return (
      <div className="stage-c">
        <div className="stage-sub" style={{marginTop: 0}}>
          Ronda {round}/{ROUNDS} · Vota {players[voterIdx].name} ·{' '}
          <span className={voteTimeLeft <= 3 ? 'text-red-400 font-black' : 'text-cyan-300'}>
            {voteTimeLeft}s
          </span>
        </div>

        <div className="mx-auto mt-[2vh] max-w-[80vw] rounded-[2.2vh] border-[0.4vh] border-slate-500/70 bg-slate-800/85 p-[2vh_2vw] shadow-2xl">
          <div className="mb-[1.6vh] text-[3vh] font-black tracking-wide text-white">
            ¿QUIÉN ES EL IMPOSTOR?
          </div>

          <div className="grid grid-cols-3 gap-[1.4vh_1.5vw]">
            {suspects.map((crew, idx) => (
              <button
                key={crew.id}
                type="button"
                onClick={() => submitVote(idx)}
                className={`flex items-center gap-[1vw] rounded-[1.5vh] border-[0.35vh] px-[1.3vw] py-[1.4vh] transition-transform cursor-pointer ${
                  cursor === idx
                    ? 'border-white bg-cyan-900/80 scale-105 shadow-xl'
                    : 'border-slate-600/80 bg-slate-900/90'
                }`}
              >
                <CrewmateSvg
                  bodyColor={crew.body}
                  shadeColor={crew.shade}
                  className="h-[8.5vh] w-[8.5vh] shrink-0"
                />
                <div className="text-left">
                  <div className="text-[2.4vh] font-extrabold text-white">{crew.label}</div>
                  <div className="text-[1.5vh] text-slate-300">
                    {cursor === idx ? 'OK: Expulsar' : 'Sospechoso'}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => submitVote(6)}
            className={`mt-[1.6vh] w-full rounded-[1.3vh] border-[0.35vh] py-[1.1vh] text-[2.2vh] font-extrabold transition-transform cursor-pointer ${
              cursor === 6
                ? 'border-white bg-slate-600 text-white scale-[1.02]'
                : 'border-slate-600 bg-slate-900/90 text-slate-300'
            }`}
          >
            Omitir voto (Skip)
          </button>
        </div>

        <div className="stage-hint">▲▼◀▶ Elegir sospechoso u omitir · OK Confirmar voto</div>
      </div>
    );
  }

  return (
    <div className="stage-c">
      <div className="stage-sub" style={{marginTop: 0}}>
        Cámaras Skeld · Ronda {round}/{ROUNDS} ·{' '}
        {blackout ? '⚡ ¡SABOTAJE DE LUCES!' : '¡Observa rápido qué color desapareció tras el apagón!'}
      </div>

      <div className="mx-auto mt-[2vh] grid w-[min(88vw,960px)] grid-cols-3 gap-[1.4vh_1.3vw]">
        {SKELD_MEETING_ROOMS.map((roomName, rIdx) => {
          const crewHere = blackout
            ? []
            : suspects
                .map((c, cIdx) => ({...c, cIdx}))
                .filter(({cIdx}) => positions[cIdx] === rIdx && !(ventOpen && cIdx === impostorIdx));
          const isVentingHere =
            !blackout &&
            ventOpen &&
            (ventRoom === rIdx || decoyVentRooms[0] === rIdx || decoyVentRooms[1] === rIdx);
          return (
            <div
              key={roomName}
              className={`flex h-[21vh] flex-col justify-between rounded-[1.6vh] border-[0.3vh] p-[1.3vh_1vw] ${
                blackout
                  ? 'border-red-500/45 bg-black/95'
                  : 'border-cyan-400/35 bg-slate-900/90'
              }`}
            >
              <div className="flex items-center justify-between text-[1.9vh] font-bold text-cyan-200">
                <span>{roomName}</span>
                <SkeldVentSvg open={isVentingHere} className="h-[4.6vh] w-[7vh]" />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 min-h-[10vh]">
                {blackout ? (
                  <span className="text-[2vh] font-bold text-red-400/75">SIN SEÑAL</span>
                ) : (
                  crewHere.map((c) => (
                    <CrewmateSvg
                      key={c.id}
                      bodyColor={c.body}
                      shadeColor={c.shade}
                      className="h-[8.6vh] w-[8.6vh]"
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="stage-hint">
        2 alcantarillas son señuelo — ¡descubre qué color desapareció en 0.9 s!
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. MAPA ADMIN SKELD (PASILLOS VISIBLES · REPORTE EN VIVO CONTRA EL RELOJ)  */
/* -------------------------------------------------------------------------- */

interface AdminRoomDef {
  id: number;
  name: string;
  adj: number[]; // conectadas por pasillo visible (arriba/abajo/lados)
  ventTargets: number[]; // salas sin pasillo conectado (salto ilegal)
}

const ADMIN_SKELD_ROOMS: AdminRoomDef[] = [
  {id: 0, name: 'Motor Sup.', adj: [1, 3], ventTargets: [2, 4, 5, 6, 7, 8]},
  {id: 1, name: 'Cafetería', adj: [0, 2, 4], ventTargets: [3, 5, 6, 7, 8]},
  {id: 2, name: 'Armería', adj: [1, 5], ventTargets: [0, 3, 4, 6, 7, 8]},
  {id: 3, name: 'Ala Médica', adj: [0, 4, 6], ventTargets: [1, 2, 5, 7, 8]},
  {id: 4, name: 'Admin', adj: [1, 3, 5, 7], ventTargets: [0, 2, 6, 8]},
  {id: 5, name: 'O2', adj: [2, 4, 8], ventTargets: [0, 1, 3, 6, 7]},
  {id: 6, name: 'Seguridad', adj: [3, 7], ventTargets: [0, 1, 2, 4, 5, 8]},
  {id: 7, name: 'Electricidad', adj: [4, 6, 8], ventTargets: [0, 1, 2, 3, 5]},
  {id: 8, name: 'Navegación', adj: [5, 7], ventTargets: [0, 1, 2, 3, 4, 6]},
];

export function AuAdminStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
}: StageGameProps) {
  const np = players.length;
  const ROUNDS = 5;

  const [ti, setTi] = useState(0);
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<'PASS' | 'LIVE' | 'FEEDBACK'>('PASS');
  const [counts, setCounts] = useState<number[]>(() => Array(9).fill(0));
  const [lastMove, setLastMove] = useState<{from: number; to: number; isVent: boolean} | null>(null);
  const [ventActive, setVentActive] = useState(false);
  const [cursor, setCursor] = useState(4);
  const [timePct, setTimePct] = useState(100);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [lastPts, setLastPts] = useState(0);
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));

  const stepTimerRef = useRef<number | null>(null);
  const barIvRef = useRef<number | null>(null);
  const ventAtRef = useRef(0);
  const ventPairRef = useRef<{from: number; to: number} | null>(null);
  const crewPosRef = useRef<number[]>([]);
  const phaseRef = useRef<'PASS' | 'LIVE' | 'FEEDBACK'>('PASS');
  phaseRef.current = phase;

  const clearTimers = useCallback(() => {
    if (stepTimerRef.current) {
      window.clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    if (barIvRef.current) {
      window.clearInterval(barIvRef.current);
      barIvRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    setBg(phase === 'FEEDBACK' && lastPts === 0 ? '#7f1d1d' : '#031712');
  }, [phase, lastPts, setBg]);

  const countsFromPositions = (pos: number[]) => {
    const c = Array(9).fill(0);
    pos.forEach((r) => {
      c[r] += 1;
    });
    return c;
  };

  const startRound = useCallback(
    (rnd: number) => {
      clearTimers();
      setRound(rnd);
      setLastMove(null);
      setVentActive(false);
      setTimePct(100);
      setCursor(4);
      ventPairRef.current = null;

      // 6 tripulantes repartidos en The Skeld
      const initial = [0, 1, 2, 3, 5, 6].map((r) => r);
      const shuffledStart = shuffleIndices(9).slice(0, 6);
      crewPosRef.current = shuffledStart.length === 6 ? shuffledStart : initial;
      setCounts(countsFromPositions(crewPosRef.current));
      setPhase('LIVE');

      // Entre 2 y 4 caminatas legales por pasillo antes del salto por alcantarilla
      const walksBeforeVent = 2 + Math.floor(Math.random() * 3);
      const beatMs = Math.max(680, 980 - rnd * 55);
      const reactionLimitMs = Math.max(2400, 3400 - rnd * 200);
      let stepCount = 0;

      const scheduleNextBeat = () => {
        stepTimerRef.current = window.setTimeout(() => {
          if (phaseRef.current !== 'LIVE') return;
          stepCount += 1;

          if (stepCount <= walksBeforeVent) {
            const mover = Math.floor(Math.random() * crewPosRef.current.length);
            const from = crewPosRef.current[mover];
            const adjs = ADMIN_SKELD_ROOMS[from].adj;
            const to = adjs[Math.floor(Math.random() * adjs.length)];
            crewPosRef.current[mover] = to;
            setCounts(countsFromPositions(crewPosRef.current));
            setLastMove({from, to, isVent: false});
            tone(390, 0.045, 'triangle', 0.05);
            scheduleNextBeat();
            return;
          }

          // ¡Salto imposible sin pasillo!
          const impMover = Math.floor(Math.random() * crewPosRef.current.length);
          const from = crewPosRef.current[impMover];
          const vents = ADMIN_SKELD_ROOMS[from].ventTargets;
          const to = vents[Math.floor(Math.random() * vents.length)];
          crewPosRef.current[impMover] = to;
          ventPairRef.current = {from, to};
          ventAtRef.current = performance.now();
          setCounts(countsFromPositions(crewPosRef.current));
          setLastMove({from, to, isVent: true});
          setVentActive(true);
          tone(210, 0.14, 'sawtooth', 0.09);

          barIvRef.current = window.setInterval(() => {
            const elapsed = performance.now() - ventAtRef.current;
            const pct = Math.max(0, 100 - (elapsed / reactionLimitMs) * 100);
            setTimePct(pct);
            if (elapsed >= reactionLimitMs) {
              clearTimers();
              tone(125, 0.32, 'sawtooth');
              setLastPts(0);
              setFeedbackMsg(
                `¡Muy lento! El salto fue ${ADMIN_SKELD_ROOMS[from].name} ➔ ${ADMIN_SKELD_ROOMS[to].name} (sin pasillo)`,
              );
              setPhase('FEEDBACK');
            }
          }, 40);
        }, beatMs);
      };

      scheduleNextBeat();
    },
    [clearTimers],
  );

  const reportRoom = useCallback(
    (roomIdx: number) => {
      if (phase !== 'LIVE') return;
      clearTimers();

      if (!ventActive || !ventPairRef.current) {
        tone(125, 0.32, 'sawtooth');
        setLastPts(0);
        setFeedbackMsg('¡Falsa alarma! Ese último movimiento sí cruzó por un pasillo conectado.');
        setPhase('FEEDBACK');
        return;
      }

      const {from, to} = ventPairRef.current;
      if (roomIdx === to) {
        const elapsed = performance.now() - ventAtRef.current;
        const pts = Math.max(7, Math.round(18 - elapsed / 260));
        setLastPts(pts);
        setScores((prev) => {
          const n = [...prev];
          n[ti] += pts;
          return n;
        });
        tone(840, 0.2);
        setFeedbackMsg(
          `¡Cazado en ${ADMIN_SKELD_ROOMS[to].name}! No hay pasillo directo desde ${ADMIN_SKELD_ROOMS[from].name}.`,
        );
      } else {
        tone(125, 0.32, 'sawtooth');
        setLastPts(0);
        setFeedbackMsg(
          `¡Sala equivocada! Apareció en ${ADMIN_SKELD_ROOMS[to].name} desde ${ADMIN_SKELD_ROOMS[from].name}.`,
        );
      }
      setPhase('FEEDBACK');
    },
    [phase, clearTimers, ventActive, ti],
  );

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'PASS' && k === 'ok') {
        playControlClick();
        startRound(1);
      } else if (phase === 'LIVE') {
        if (k === 'left') {
          setCursor((c) => (c % 3 === 0 ? c + 2 : c - 1));
          playControlClick();
        } else if (k === 'right') {
          setCursor((c) => (c % 3 === 2 ? c - 2 : c + 1));
          playControlClick();
        } else if (k === 'up') {
          setCursor((c) => (c + 6) % 9);
          playControlClick();
        } else if (k === 'down') {
          setCursor((c) => (c + 3) % 9);
          playControlClick();
        } else if (k === 'ok') {
          reportRoom(cursor);
        }
      } else if (phase === 'FEEDBACK' && k === 'ok') {
        if (round < ROUNDS) {
          startRound(round + 1);
        } else if (ti + 1 < np) {
          setTi((i) => i + 1);
          setRound(1);
          setPhase('PASS');
        } else {
          const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => scores[b] - scores[a]);
          onFinish(
            'Mapa Admin Skeld',
            rank,
            rank.map((p) => `${scores[p]} pts de radar`),
            () => {
              setScores(Array(np).fill(0));
              setTi(0);
              setRound(1);
              setPhase('PASS');
            },
          );
        }
      }
    },
    [phase, cursor, round, ti, np, scores, startRound, reportRoom, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'PASS') {
    return (
      <PassScreen
        playerName={players[ti].name}
        subtitle="Mapa Admin: las salas están unidas por tubos verdes (pasillos). Cuando veas SALIÓ ➔ ENTRÓ entre dos salas SIN tubo entre ellas, marca ENTRÓ rápido con OK."
        onReady={() => handleKey('ok')}
      />
    );
  }

  if (phase === 'FEEDBACK') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-big" style={{fontSize: 'clamp(1.7rem, 6.2vh, 3.8rem)'}}>
          {lastPts > 0 ? `+${lastPts} pts · ¡IMPOSTOR CAZADO!` : '¡FALLO EN ADMIN!'}
        </div>
        <div className="stage-sub">{feedbackMsg}</div>
        <div className="stage-hint">OK: continuar</div>
      </div>
    );
  }

  return (
    <div className="stage-c">
      <div className="mx-auto flex w-[min(86vw,840px)] items-center justify-between text-[2.2vh] font-bold">
        <span>
          {players[ti].name} · Ronda {round}/{ROUNDS}
        </span>
        <span className="text-emerald-300">
          {lastMove
            ? `Último cambio: ${ADMIN_SKELD_ROOMS[lastMove.from].name} ➔ ${ADMIN_SKELD_ROOMS[lastMove.to].name}`
            : 'Escaneando The Skeld…'}
        </span>
      </div>

      {ventActive && (
        <div className="stage-barw" style={{height: '1.2vh', marginTop: '0.9vh', width: 'min(62vw,520px)'}}>
          <div
            className="stage-barf"
            style={{width: `${timePct}%`, background: timePct < 40 ? '#ef4444' : '#fbbf24'}}
          />
        </div>
      )}

      <div className="relative mx-auto mt-[1.6vh] w-[min(86vw,840px)] rounded-[2vh] border-[0.35vh] border-emerald-400/55 bg-[#031a14]/95 p-[2vh_2.2vw] shadow-2xl">
        {/* Tubos verdes visibles que representan los pasillos reales entre salas vecinas */}
        <div className="pointer-events-none absolute inset-[2vh_2.2vw] grid grid-cols-3 grid-rows-3">
          {/* Conectores horizontales */}
          <div className="col-start-1 row-start-1 flex items-center justify-end pr-0">
            <span className="h-[1.2vh] w-[2vw] translate-x-[1vw] bg-emerald-400/65 rounded" />
          </div>
          <div className="col-start-2 row-start-1 flex items-center justify-end pr-0">
            <span className="h-[1.2vh] w-[2vw] translate-x-[1vw] bg-emerald-400/65 rounded" />
          </div>
          <div className="col-start-1 row-start-2 flex items-center justify-end pr-0">
            <span className="h-[1.2vh] w-[2vw] translate-x-[1vw] bg-emerald-400/65 rounded" />
          </div>
          <div className="col-start-2 row-start-2 flex items-center justify-end pr-0">
            <span className="h-[1.2vh] w-[2vw] translate-x-[1vw] bg-emerald-400/65 rounded" />
          </div>
          <div className="col-start-1 row-start-3 flex items-center justify-end pr-0">
            <span className="h-[1.2vh] w-[2vw] translate-x-[1vw] bg-emerald-400/65 rounded" />
          </div>
          <div className="col-start-2 row-start-3 flex items-center justify-end pr-0">
            <span className="h-[1.2vh] w-[2vw] translate-x-[1vw] bg-emerald-400/65 rounded" />
          </div>
          {/* Conectores verticales */}
          {[1, 2, 3].map((col) =>
            [1, 2].map((row) => (
              <div
                key={`vpipe-${col}-${row}`}
                className="flex items-end justify-center"
                style={{gridColumnStart: col, gridRowStart: row}}
              >
                <span className="h-[2vh] w-[1.2vh] translate-y-[1vh] bg-emerald-400/65 rounded" />
              </div>
            )),
          )}
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-[1.8vh_1.8vw]">
          {ADMIN_SKELD_ROOMS.map((room) => {
            const cnt = counts[room.id] ?? 0;
            const isSel = cursor === room.id;
            const isFrom = lastMove?.from === room.id;
            const isTo = lastMove?.to === room.id;

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => {
                  setCursor(room.id);
                  reportRoom(room.id);
                }}
                className={`relative flex h-[15vh] flex-col justify-between rounded-[1.4vh] border-[0.35vh] p-[1vh_1vw] transition-transform cursor-pointer ${
                  isSel
                    ? 'border-white bg-emerald-800/75 scale-105 shadow-[0_0_2.2vh_rgba(52,211,153,0.55)]'
                    : isTo
                      ? 'border-cyan-300 bg-cyan-950/85'
                      : isFrom
                        ? 'border-amber-400/80 bg-amber-950/60'
                        : 'border-emerald-500/40 bg-slate-950/90'
                }`}
              >
                <div className="flex items-center justify-between text-[1.75vh] font-extrabold text-emerald-100">
                  <span>{room.name}</span>
                  <span
                    className={`text-[1.5vh] font-black ${
                      isTo ? 'text-cyan-300' : isFrom ? 'text-amber-300' : 'text-emerald-400/70'
                    }`}
                  >
                    {isTo ? 'ENTRÓ +1' : isFrom ? 'SALIÓ -1' : `${cnt}`}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-1 min-h-[6.5vh]">
                  {Array.from({length: cnt}, (_, iconIdx) => (
                    <AdminCrewIconSvg key={`adm-${room.id}-${iconIdx}`} className="h-[5vh] w-[4.4vh]" />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="stage-hint">
        Solo reporta con OK sobre ENTRÓ +1 cuando SALIÓ y ENTRÓ NO estén unidos por un tubo verde
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. ¿TAREA REAL O FALSA? (DIFÍCIL: 4 SOSPECHOSOS · 5 RONDAS · FALLOS SUTILES)*/
/* -------------------------------------------------------------------------- */

type CanonicalTaskKind = 'medbay' | 'weapons' | 'trash' | 'shields' | 'upload';

const CANONICAL_TASKS: {kind: CanonicalTaskKind; room: string; label: string; hint: string}[] = [
  {kind: 'medbay', room: 'Ala Médica', label: 'Escáner Médico', hint: 'rayo verde continuo'},
  {kind: 'weapons', room: 'Armería', label: 'Destruir Asteroides', hint: 'dispara láser verde'},
  {kind: 'trash', room: 'Almacén', label: 'Vaciar Basura', hint: 'expulsa desechos al espacio'},
  {kind: 'shields', room: 'Escudos', label: 'Preparar Escudos', hint: 'ilumina borde blanco/cian'},
  {kind: 'upload', room: 'Admin', label: 'Subir Datos', hint: 'barra verde sube al llegar a 100%'},
];

interface SuspectTaskSlot {
  crew: CrewColorMeta;
  task: (typeof CANONICAL_TASKS)[number];
  isFaker: boolean;
}

export function AuFalsaStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
}: StageGameProps) {
  const np = players.length;
  const ROUNDS = 5;

  const [ti, setTi] = useState(0);
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<'PASS' | 'OBSERVE' | 'FEEDBACK'>('PASS');
  const [slots, setSlots] = useState<SuspectTaskSlot[]>([]);
  const [fakerIdx, setFakerIdx] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [animTick, setAnimTick] = useState(0);
  const [taskBarPct, setTaskBarPct] = useState(32);
  const [slotProgress, setSlotProgress] = useState<number[]>([20, 20, 20, 20]);
  const [timeLeft, setTimeLeft] = useState(8);
  const [lastPts, setLastPts] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));

  const ivRef = useRef<number | null>(null);
  const roundStartRef = useRef(0);

  const stopLoops = useCallback(() => {
    if (ivRef.current) {
      window.clearInterval(ivRef.current);
      ivRef.current = null;
    }
  }, []);

  useEffect(() => stopLoops, [stopLoops]);

  useEffect(() => {
    setBg(phase === 'FEEDBACK' && lastPts === 0 ? '#7f1d1d' : '#071220');
  }, [phase, lastPts, setBg]);

  const startRound = useCallback(
    (rnd: number) => {
      stopLoops();
      setRound(rnd);
      const chosenColors = pickDistinctColors(4);
      const pickedTasks = shuffleIndices(CANONICAL_TASKS.length)
        .slice(0, 4)
        .map((i) => CANONICAL_TASKS[i]);
      const fakeSlot = Math.floor(Math.random() * 4);

      const nextSlots: SuspectTaskSlot[] = chosenColors.map((crew, idx) => ({
        crew,
        task: pickedTasks[idx],
        isFaker: idx === fakeSlot,
      }));

      setSlots(nextSlots);
      setFakerIdx(fakeSlot);
      setCursor(0);
      setAnimTick(0);
      setTaskBarPct(32);
      setSlotProgress([25, 45, 65, 35]);
      const limitSec = Math.max(7, 10 - Math.floor((rnd - 1) / 2));
      setTimeLeft(limitSec);
      setPhase('OBSERVE');
      roundStartRef.current = performance.now();

      let tick = 0;
      const endAt = Date.now() + limitSec * 1000;
      let currentProgs = [25, 45, 65, 35];

      ivRef.current = window.setInterval(() => {
        tick += 1;
        setAnimTick(tick);

        // Actualizar progreso individual; cuando un tripulante real llega a 100%, sube la Barra de Tareas
        let completedReal = 0;
        currentProgs = currentProgs.map((val, idx) => {
          const next = val + 12;
          if (next >= 100) {
            if (!nextSlots[idx]?.isFaker) {
              completedReal += 1;
            }
            return 10;
          }
          return next;
        });
        setSlotProgress([...currentProgs]);
        if (completedReal > 0) {
          setTaskBarPct((p) => (p >= 90 ? 32 : Math.min(96, p + completedReal * 8)));
        }

        const rem = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
        setTimeLeft(rem);
        if (Date.now() >= endAt) {
          stopLoops();
          tone(130, 0.3, 'sawtooth');
          setLastPts(0);
          setFeedbackText(
            `¡Tiempo! ${nextSlots[fakeSlot].crew.label} fingía ${nextSlots[fakeSlot].task.label}`,
          );
          setPhase('FEEDBACK');
        }
      }, 210);
    },
    [stopLoops],
  );

  const accuse = useCallback(
    (slotIdx: number) => {
      if (phase !== 'OBSERVE') return;
      stopLoops();
      const target = slots[slotIdx];
      const realFaker = slots[fakerIdx];
      if (!target || !realFaker) return;

      if (slotIdx === fakerIdx) {
        const elapsed = performance.now() - roundStartRef.current;
        const pts = Math.max(6, Math.round(16 - elapsed / 750));
        setLastPts(pts);
        setScores((prev) => {
          const n = [...prev];
          n[ti] += pts;
          return n;
        });
        tone(840, 0.2);
        setFeedbackText(
          `¡Acertaste! ${realFaker.crew.label} fingía ${realFaker.task.label} (${realFaker.task.hint})`,
        );
      } else {
        setLastPts(0);
        tone(130, 0.3, 'sawtooth');
        setFeedbackText(
          `¡Inocente! ${target.crew.label} sí completaba ${target.task.label} · Fingía ${realFaker.crew.label}`,
        );
      }
      setPhase('FEEDBACK');
    },
    [phase, stopLoops, slots, fakerIdx, ti],
  );

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'PASS' && k === 'ok') {
        playControlClick();
        startRound(1);
      } else if (phase === 'OBSERVE') {
        if (k === 'left' || k === 'right') {
          setCursor((c) => c ^ 1);
          playControlClick();
        } else if (k === 'up' || k === 'down') {
          setCursor((c) => c ^ 2);
          playControlClick();
        } else if (k === 'ok') {
          accuse(cursor);
        }
      } else if (phase === 'FEEDBACK' && k === 'ok') {
        if (round < ROUNDS) {
          startRound(round + 1);
        } else if (ti + 1 < np) {
          setTi((i) => i + 1);
          setRound(1);
          setPhase('PASS');
        } else {
          const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => scores[b] - scores[a]);
          onFinish(
            '¿Tarea Real o Falsa?',
            rank,
            rank.map((p) => `${scores[p]} pts de detective`),
            () => {
              setScores(Array(np).fill(0));
              setTi(0);
              setRound(1);
              setPhase('PASS');
            },
          );
        }
      }
    },
    [phase, cursor, round, ti, np, scores, startRound, accuse, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'PASS') {
    return (
      <PassScreen
        playerName={players[ti].name}
        subtitle="4 sospechosos (5 rondas): detecta errores sutiles en Escáner, Láser, Basura, Escudos o si la Barra Global no sube al 100%."
        onReady={() => handleKey('ok')}
      />
    );
  }

  if (phase === 'FEEDBACK') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-big" style={{fontSize: 'clamp(1.7rem, 6.2vh, 3.8rem)'}}>
          {lastPts > 0 ? `+${lastPts} pts · ¡IMPOSTOR EXPUESTO!` : '¡ACUSACIÓN FALLIDA!'}
        </div>
        <div className="stage-sub">{feedbackText}</div>
        <div className="stage-hint">OK: continuar</div>
      </div>
    );
  }

  return (
    <div className="stage-c">
      <div className="mx-auto flex w-[min(88vw,920px)] items-center justify-between gap-4">
        <div className="flex-1 rounded-xl border-2 border-emerald-400/50 bg-slate-950/90 p-2">
          <div className="mb-1 flex justify-between text-[1.45vh] font-extrabold text-emerald-300">
            <span>BARRA DE TAREAS TOTALES</span>
            <span>{taskBarPct}%</span>
          </div>
          <div className="h-[1.5vh] w-full overflow-hidden rounded bg-slate-800">
            <div
              className="h-full bg-emerald-400 transition-all duration-200"
              style={{width: `${taskBarPct}%`}}
            />
          </div>
        </div>
        <div className="text-right text-[2.2vh] font-bold text-white">
          {players[ti].name} · Ronda {round}/{ROUNDS} ·{' '}
          <span className={timeLeft <= 3 ? 'text-red-400' : 'text-cyan-300'}>{timeLeft}s</span>
        </div>
      </div>

      <div className="mx-auto mt-[1.6vh] grid w-[min(88vw,920px)] grid-cols-2 gap-[1.5vh_1.6vw]">
        {slots.map((slot, idx) => {
          const isSel = cursor === idx;
          const pulseOn = animTick % 2 === 0;
          const isReal = !slot.isFaker;
          const prog = slotProgress[idx] ?? 0;

          return (
            <button
              key={`${slot.crew.id}-${idx}`}
              type="button"
              onClick={() => accuse(idx)}
              className={`flex h-[24vh] items-center justify-between gap-[1.2vw] rounded-[1.8vh] border-[0.4vh] p-[1.4vh_1.4vw] transition-transform cursor-pointer ${
                isSel
                  ? 'border-amber-300 bg-slate-900/95 scale-[1.03] shadow-[0_0_2.5vh_rgba(251,191,36,0.45)]'
                  : 'border-cyan-400/30 bg-slate-950/88'
              }`}
            >
              {/* Escena visual */}
              <div className="relative flex h-full w-[46%] items-center justify-center overflow-hidden rounded-xl border border-slate-700/80 bg-slate-950">
                <CrewmateSvg
                  bodyColor={slot.crew.body}
                  shadeColor={slot.crew.shade}
                  className="relative z-10 h-[10.5vh] w-[10.5vh]"
                />

                {/* Medbay: real tiene rayo verde constante; falso falla o parpadea ámbar/rojo */}
                {slot.task.kind === 'medbay' && (
                  <div
                    className={`pointer-events-none absolute inset-x-3 h-[1.2vh] rounded-full transition-all duration-150 ${
                      isReal
                        ? 'bg-emerald-400/85 shadow-[0_0_1.6vh_#34d399]'
                        : pulseOn
                          ? 'bg-amber-400/65'
                          : 'opacity-0'
                    }`}
                    style={{top: `${20 + (animTick % 5) * 14}%`}}
                  />
                )}

                {/* Armería: real dispara haces verdes; falso solo muestra puntos apagados en el cañón */}
                {slot.task.kind === 'weapons' && (
                  <svg viewBox="0 0 120 80" className="pointer-events-none absolute inset-0 h-full w-full">
                    {isReal ? (
                      <>
                        <line
                          x1="12"
                          y1={pulseOn ? '16' : '64'}
                          x2="112"
                          y2={pulseOn ? '34' : '22'}
                          stroke="#4ade80"
                          strokeWidth="4"
                        />
                        <line
                          x1="12"
                          y1={pulseOn ? '64' : '16'}
                          x2="112"
                          y2={pulseOn ? '52' : '40'}
                          stroke="#22c55e"
                          strokeWidth="3"
                        />
                      </>
                    ) : (
                      <>
                        <circle cx="104" cy="24" r="3" fill="#64748b" />
                        <circle cx="104" cy="54" r="3" fill="#64748b" />
                      </>
                    )}
                  </svg>
                )}

                {/* Basura: real expulsa latas/hojas; falso solo tiembla la compuerta vacía */}
                {slot.task.kind === 'trash' && (
                  <div className="pointer-events-none absolute bottom-1 inset-x-0 flex justify-center gap-3 text-[2.2vh]">
                    {isReal ? (
                      <>
                        <span style={{transform: `translateY(${(animTick % 3) * 5}px)`}}>🥫</span>
                        <span style={{transform: `translateY(${((animTick + 1) % 3) * 5}px)`}}>🍂</span>
                      </>
                    ) : (
                      <span className="text-[1.6vh] font-mono text-slate-500">═══</span>
                    )}
                  </div>
                )}

                {/* Escudos: real brilla blanco/cian; falso parpadea rojo apagado */}
                {slot.task.kind === 'shields' && (
                  <div
                    className={`pointer-events-none absolute inset-1.5 rounded-xl border-[0.45vh] transition-opacity duration-150 ${
                      isReal
                        ? pulseOn
                          ? 'border-cyan-300 bg-cyan-400/20 opacity-100'
                          : 'border-white/60 opacity-65'
                        : 'border-slate-700 opacity-50'
                    }`}
                  />
                )}

                {/* Subir Datos: ambos muestran barra cargando, pero el impostor NO sube la Barra Global */}
                {slot.task.kind === 'upload' && (
                  <div className="pointer-events-none absolute bottom-1.5 inset-x-2 rounded bg-black/75 px-1.5 py-0.5">
                    <div className="h-[0.8vh] w-full rounded bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 transition-all duration-150"
                        style={{width: `${prog}%`}}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Etiqueta */}
              <div className="flex flex-1 flex-col items-start justify-between h-full py-1 text-left">
                <div>
                  <div className="text-[2vh] font-extrabold text-cyan-200">{slot.task.room}</div>
                  <div className="text-[1.7vh] text-slate-300">{slot.task.label}</div>
                </div>
                <div
                  className={`w-full rounded-lg py-[0.7vh] text-center text-[2vh] font-extrabold ${
                    isSel ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-white'
                  }`}
                >
                  {slot.crew.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="stage-hint">
        ▲▼◀▶ Elegir sospechoso · OK Acusar al que falla su efecto visual o no sube la barra al 100%
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. APAGÓN EN ELECTRICIDAD (4 PANELES · CABLES CRUZADOS + VENT MÁS RÁPIDO)  */
/* -------------------------------------------------------------------------- */

export function AuLucesStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
}: StageGameProps) {
  const np = players.length;
  const WAVES = 4;
  const TIME_LIMIT = 22;

  const [ti, setTi] = useState(0);
  const [wave, setWave] = useState(1);
  const [phase, setPhase] = useState<'PASS' | 'PLAY' | 'DONE'>('PASS');
  const [switches, setSwitches] = useState<boolean[]>([false, true, false, false, true]);
  const [cursor, setCursor] = useState(0);
  const [ventState, setVentState] = useState<'closed' | 'rattle' | 'open'>('closed');
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [caughtMsg, setCaughtMsg] = useState<string | null>(null);
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));

  const ventStateRef = useRef<'closed' | 'rattle' | 'open'>('closed');
  const waveRef = useRef(1);
  const timerRef = useRef<number | null>(null);
  const ventLoopRef = useRef<number | null>(null);
  const ventSubRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (ventLoopRef.current) window.clearTimeout(ventLoopRef.current);
    if (ventSubRef.current) window.clearTimeout(ventSubRef.current);
    timerRef.current = null;
    ventLoopRef.current = null;
    ventSubRef.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (ventState === 'open' && phase === 'PLAY') setBg('#450a0a');
    else if (caughtMsg) setBg('#7f1d1d');
    else setBg('#080d16');
  }, [ventState, phase, caughtMsg, setBg]);

  const makeWaveSwitches = (w: number): boolean[] => {
    if (w === 1) return [false, true, false, false, true];
    if (w === 2) return [false, false, true, false, false];
    if (w === 3) return [true, false, false, true, false];
    return [false, false, false, false, false];
  };

  const scheduleVentCycle = useCallback(() => {
    if (ventLoopRef.current) window.clearTimeout(ventLoopRef.current);
    if (ventSubRef.current) window.clearTimeout(ventSubRef.current);
    ventStateRef.current = 'closed';
    setVentState('closed');

    const waitMs = 1450 + Math.floor(Math.random() * 950);
    ventLoopRef.current = window.setTimeout(() => {
      ventStateRef.current = 'rattle';
      setVentState('rattle');
      tone(220, 0.08, 'triangle', 0.09);

      ventSubRef.current = window.setTimeout(() => {
        ventStateRef.current = 'open';
        setVentState('open');
        tone(140, 0.2, 'sawtooth', 0.14);

        ventSubRef.current = window.setTimeout(() => {
          scheduleVentCycle();
        }, 1400);
      }, 500);
    }, waitMs);
  }, []);

  const startShift = useCallback(() => {
    clearTimers();
    waveRef.current = 1;
    setWave(1);
    setSwitches(makeWaveSwitches(1));
    setCursor(0);
    setCaughtMsg(null);
    setTimeLeft(TIME_LIMIT);
    setPhase('PLAY');
    scheduleVentCycle();

    const endAt = Date.now() + TIME_LIMIT * 1000;
    timerRef.current = window.setInterval(() => {
      const rem = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setTimeLeft(rem);
      if (Date.now() >= endAt) {
        clearTimers();
        tone(120, 0.45, 'sawtooth');
        const pts = (waveRef.current - 1) * 7;
        setCaughtMsg('⏰ Se agotó el tiempo en Electricidad');
        setScores((prev) => {
          const n = [...prev];
          n[ti] = pts;
          return n;
        });
        setPhase('DONE');
      }
    }, 100);
  }, [clearTimers, scheduleVentCycle, ti]);

  const flipSwitch = useCallback(
    (idx: number) => {
      if (phase !== 'PLAY') return;

      if (ventStateRef.current === 'open') {
        clearTimers();
        tone(100, 0.55, 'sawtooth', 0.25);
        const pts = (waveRef.current - 1) * 6;
        setCaughtMsg('💀 ¡El Impostor te vio mover los interruptores!');
        setScores((prev) => {
          const n = [...prev];
          n[ti] = pts;
          return n;
        });
        setPhase('DONE');
        return;
      }

      playControlClick();
      setSwitches((prev) => {
        const next = [...prev];
        next[idx] = !next[idx];
        // Desde panel 2 hay cables cruzados
        if (waveRef.current >= 2 && idx === 1) next[2] = !next[2];
        if (waveRef.current >= 3 && idx === 3) next[4] = !next[4];
        if (waveRef.current >= 4 && idx === 0) next[3] = !next[3];

        if (next.every(Boolean)) {
          if (waveRef.current < WAVES) {
            const nw = waveRef.current + 1;
            waveRef.current = nw;
            setWave(nw);
            tone(760, 0.14);
            return makeWaveSwitches(nw);
          } else {
            clearTimers();
            tone(880, 0.28);
            const bonus = WAVES * 9 + timeLeft * 2;
            setScores((prevSc) => {
              const n = [...prevSc];
              n[ti] = bonus;
              return n;
            });
            setCaughtMsg(null);
            setPhase('DONE');
          }
        } else {
          tone(next[idx] ? 620 : 340, 0.07);
        }
        return next;
      });
    },
    [phase, clearTimers, ti, timeLeft],
  );

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'PASS' && k === 'ok') {
        startShift();
      } else if (phase === 'PLAY') {
        if (k === 'left') {
          setCursor((c) => (c + 4) % 5);
          playControlClick();
        } else if (k === 'right') {
          setCursor((c) => (c + 1) % 5);
          playControlClick();
        } else if (k === 'ok') {
          flipSwitch(cursor);
        }
      } else if (phase === 'DONE' && k === 'ok') {
        if (ti + 1 < np) {
          setTi((i) => i + 1);
          setPhase('PASS');
        } else {
          const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => scores[b] - scores[a]);
          onFinish(
            'Apagón en Electricidad',
            rank,
            rank.map((p) => `${scores[p]} pts de energía`),
            () => {
              setScores(Array(np).fill(0));
              setTi(0);
              setPhase('PASS');
            },
          );
        }
      }
    },
    [phase, cursor, ti, np, scores, startShift, flipSwitch, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'PASS') {
    return (
      <PassScreen
        playerName={players[ti].name}
        subtitle="Electricidad (Difícil): 4 paneles con cables cruzados y vent rápido. ¡Congélate cuando aparezcan los ojos rojos!"
        onReady={() => handleKey('ok')}
      />
    );
  }

  if (phase === 'DONE') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-big" style={{fontSize: 'clamp(1.8rem, 6.5vh, 4rem)'}}>
          {caughtMsg ? caughtMsg : '💡 ¡Luces Restauradas!'}
        </div>
        <div className="stage-sub">
          {players[ti].name} · {scores[ti]} pts
        </div>
        <div className="stage-hint">OK: continuar</div>
      </div>
    );
  }

  return (
    <div className="stage-c">
      <div className="mx-auto flex w-[min(82vw,760px)] items-center justify-between text-[2.3vh] font-bold">
        <span>
          {players[ti].name} · Panel {wave}/{WAVES}
        </span>
        <span
          className={
            ventState === 'open'
              ? 'text-red-400 font-black'
              : ventState === 'rattle'
                ? 'text-amber-300 font-black'
                : 'text-emerald-300'
          }
        >
          {ventState === 'open'
            ? '👁️ ¡IMPOSTOR MIRANDO! ¡QUIETO!'
            : ventState === 'rattle'
              ? '⚠️ Alcantarilla temblando…'
              : wave >= 2
                ? '⚡ Cables cruzados activos'
                : '✅ Alcantarilla cerrada'}
        </span>
        <span className={timeLeft <= 6 ? 'text-red-400' : 'text-cyan-300'}>{timeLeft}s</span>
      </div>

      <div className="my-[1.4vh] flex justify-center">
        <SkeldVentSvg open={ventState === 'open'} className="h-[11vh] w-[17vh]" />
      </div>

      <div className="mx-auto w-[min(82vw,760px)] rounded-[2vh] border-[0.4vh] border-slate-500/70 bg-slate-800/95 p-[2.4vh_2.2vw] shadow-2xl">
        <div className="grid grid-cols-5 gap-[1.4vw]">
          {switches.map((isOn, idx) => {
            const isSel = cursor === idx;
            return (
              <button
                key={`sw-${idx}`}
                type="button"
                onClick={() => {
                  setCursor(idx);
                  flipSwitch(idx);
                }}
                className={`flex flex-col items-center justify-between rounded-[1.4vh] border-[0.35vh] p-[1.5vh_0.8vw] transition-transform cursor-pointer ${
                  isSel
                    ? 'border-white bg-slate-700/90 scale-105 shadow-xl'
                    : 'border-slate-600 bg-slate-900/90'
                }`}
              >
                <div className="text-[1.7vh] font-bold text-slate-300">S{idx + 1}</div>
                <div className="my-[1.4vh] flex h-[11vh] w-[4.4vw] flex-col justify-between rounded-lg border-2 border-slate-950 bg-slate-950 p-1">
                  <div
                    className={`h-[4.4vh] w-full rounded ${
                      isOn ? 'bg-slate-200 shadow' : 'bg-transparent'
                    }`}
                  />
                  <div
                    className={`h-[4.4vh] w-full rounded ${
                      !isOn ? 'bg-slate-400 shadow' : 'bg-transparent'
                    }`}
                  />
                </div>
                <div
                  className={`h-[2.4vh] w-[2.4vh] rounded-full border-2 border-black ${
                    isOn
                      ? 'bg-emerald-400 shadow-[0_0_1.4vh_#34d399]'
                      : 'bg-red-600 shadow-[0_0_1vh_#ef4444]'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="stage-hint">
        ◀▶ Elegir interruptor · OK Cambiar (desde panel 2 algunos arrastran a otro)
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. CALIBRAR DISTRIBUIDOR (DIFÍCIL: 3 PANELES · GIRO INVERSO · MUESCA FINA) */
/* -------------------------------------------------------------------------- */

const DISC_COLORS = ['#facc15', '#3b82f6', '#22d3ee'];
const DISC_NAMES = ['Amarillo', 'Azul', 'Cian'];

export function AuDistribuidorStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
}: StageGameProps) {
  const np = players.length;
  const PANELS_NEEDED = 3;
  const TIME_LIMIT = 22;

  const [ti, setTi] = useState(0);
  const [panelNum, setPanelNum] = useState(1);
  const [activeRing, setActiveRing] = useState(0); // 0, 1, 2
  const [angles, setAngles] = useState<[number, number, number]>([110, 210, 300]);
  const [phase, setPhase] = useState<'PASS' | 'PLAY' | 'DONE'>('PASS');
  const [resets, setResets] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [flashErr, setFlashErr] = useState(false);
  const [timesMs, setTimesMs] = useState<number[]>(() => Array(np).fill(99999));

  const anglesRef = useRef<[number, number, number]>([110, 210, 300]);
  const ringRef = useRef(0);
  const panelRef = useRef(1);
  const resetsRef = useRef(0);
  const startMsRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const clockRef = useRef<number | null>(null);

  const stopLoops = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (clockRef.current) window.clearInterval(clockRef.current);
    rafRef.current = null;
    clockRef.current = null;
  }, []);

  useEffect(() => stopLoops, [stopLoops]);

  useEffect(() => {
    setBg(flashErr ? '#7f1d1d' : '#09121e');
  }, [flashErr, setBg]);

  const startShift = useCallback(() => {
    stopLoops();
    panelRef.current = 1;
    ringRef.current = 0;
    resetsRef.current = 0;
    setPanelNum(1);
    setActiveRing(0);
    setResets(0);
    setTimeLeft(TIME_LIMIT);
    setFlashErr(false);
    anglesRef.current = [130, 230, 315];
    setAngles([130, 230, 315]);
    startMsRef.current = performance.now();
    setPhase('PLAY');
    tone(520, 0.08);

    const endAt = Date.now() + TIME_LIMIT * 1000;
    clockRef.current = window.setInterval(() => {
      const rem = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setTimeLeft(rem);
      if (Date.now() >= endAt) {
        stopLoops();
        tone(120, 0.45, 'sawtooth');
        const penalty =
          TIME_LIMIT * 1000 + (PANELS_NEEDED + 1 - panelRef.current) * 3500 + resetsRef.current * 900;
        setTimesMs((prev) => {
          const n = [...prev];
          n[ti] = penalty;
          return n;
        });
        setPhase('DONE');
      }
    }, 100);

    let lastTs = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;
      const speedBoost = 1 + (panelRef.current - 1) * 0.22;
      // Anillo 2 gira en sentido inverso para evitar memoria muscular
      const speeds = [235 * speedBoost, -310 * speedBoost, 390 * speedBoost];
      const next: [number, number, number] = [...anglesRef.current] as [number, number, number];
      for (let i = ringRef.current; i < 3; i++) {
        next[i] = (next[i] + speeds[i] * dt + 360) % 360;
      }
      for (let j = 0; j < ringRef.current; j++) {
        next[j] = 0;
      }
      anglesRef.current = next;
      setAngles(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [stopLoops, ti]);

  const attemptLock = useCallback(() => {
    if (phase !== 'PLAY') return;
    const r = ringRef.current;
    const deg = anglesRef.current[r];
    const dist = Math.min(deg, 360 - deg);
    const tolerance = 18;

    if (dist <= tolerance) {
      playControlClick();
      tone(580 + r * 140, 0.12);
      if (r < 2) {
        ringRef.current = r + 1;
        setActiveRing(r + 1);
      } else if (panelRef.current < PANELS_NEEDED) {
        panelRef.current += 1;
        ringRef.current = 0;
        setPanelNum(panelRef.current);
        setActiveRing(0);
        anglesRef.current = [145, 255, 65];
        tone(840, 0.16);
      } else {
        stopLoops();
        tone(880, 0.28);
        const total = Math.round(performance.now() - startMsRef.current) + resetsRef.current * 800;
        setTimesMs((prev) => {
          const n = [...prev];
          n[ti] = total;
          return n;
        });
        setPhase('DONE');
      }
    } else {
      resetsRef.current += 1;
      setResets(resetsRef.current);
      ringRef.current = 0;
      setActiveRing(0);
      setFlashErr(true);
      window.setTimeout(() => setFlashErr(false), 260);
      tone(135, 0.24, 'sawtooth');
    }
  }, [phase, stopLoops, ti]);

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'PASS' && k === 'ok') {
        startShift();
      } else if (phase === 'PLAY' && k === 'ok') {
        attemptLock();
      } else if (phase === 'DONE' && k === 'ok') {
        if (ti + 1 < np) {
          setTi((i) => i + 1);
          setPhase('PASS');
        } else {
          const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => timesMs[a] - timesMs[b]);
          onFinish(
            'Calibrar Distribuidor',
            rank,
            rank.map((p) => `${(timesMs[p] / 1000).toFixed(2)} s`),
            () => {
              setTimesMs(Array(np).fill(99999));
              setTi(0);
              setPhase('PASS');
            },
          );
        }
      }
    },
    [phase, ti, np, timesMs, startShift, attemptLock, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'PASS') {
    return (
      <PassScreen
        playerName={players[ti].name}
        subtitle="Distribuidor (Difícil): 3 paneles veloces, anillo Azul gira al revés y muesca estrecha (±18°). ¡Fallo = reinicio!"
        onReady={() => handleKey('ok')}
      />
    );
  }

  if (phase === 'DONE') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-giant tabular-nums">{(timesMs[ti] / 1000).toFixed(2)} s</div>
        <div className="stage-sub">
          {players[ti].name} · Reinicios: {resets} (+{(resets * 0.8).toFixed(1)} s)
        </div>
        <div className="stage-hint">OK: continuar</div>
      </div>
    );
  }

  return (
    <div className="stage-c cursor-pointer" onClick={attemptLock}>
      <div className="stage-sub" style={{marginTop: 0}}>
        {players[ti].name} · Distribuidor {panelNum}/{PANELS_NEEDED} · Anillo {activeRing + 1}/3 (
        {DISC_NAMES[activeRing]}) · ⏱️ {timeLeft}s
      </div>

      <div className="mx-auto mt-[2vh] flex w-[min(82vw,680px)] flex-col gap-[1.8vh] rounded-[2vh] border-[0.4vh] border-slate-500/70 bg-slate-900/95 p-[2.4vh_2.6vw] shadow-2xl">
        {[0, 1, 2].map((idx) => {
          const locked = idx < activeRing;
          const current = idx === activeRing;
          const deg = angles[idx];
          return (
            <div
              key={`disc-${idx}`}
              className={`flex items-center justify-between rounded-[1.4vh] border-2 px-[2vw] py-[1.2vh] ${
                current
                  ? 'border-white bg-slate-800/90'
                  : locked
                    ? 'border-emerald-400/70 bg-emerald-950/35'
                    : 'border-slate-700 bg-slate-950/75 opacity-70'
              }`}
            >
              <svg viewBox="0 0 100 100" className="h-[11.5vh] w-[11.5vh]" aria-hidden="true">
                <circle cx="50" cy="50" r="42" fill="#0f172a" stroke="#475569" strokeWidth="5" />
                <g transform={`rotate(${deg} 50 50)`}>
                  <circle
                    cx="50"
                    cy="50"
                    r="30"
                    fill="none"
                    stroke={DISC_COLORS[idx]}
                    strokeWidth="12"
                    strokeDasharray="145 50"
                  />
                  <rect x="74" y="42" width="16" height="16" rx="3" fill="#ffffff" />
                </g>
                <circle cx="50" cy="50" r="14" fill="#1e293b" stroke="#64748b" strokeWidth="3" />
              </svg>

              <div className="flex-1 px-[2vw]">
                <div className="h-[2vh] w-full overflow-hidden rounded-full bg-slate-950 border border-slate-700">
                  <div
                    className="h-full transition-all duration-100"
                    style={{
                      width: locked ? '100%' : current ? '55%' : '15%',
                      background: locked ? '#22c55e' : DISC_COLORS[idx],
                    }}
                  />
                </div>
              </div>

              <div
                className={`flex h-[6.5vh] w-[8.5vw] items-center justify-center rounded-lg border-2 text-[2vh] font-black ${
                  locked
                    ? 'border-emerald-300 bg-emerald-500 text-slate-950'
                    : current
                      ? 'border-amber-300 bg-slate-950 text-amber-300'
                      : 'border-slate-700 bg-slate-950 text-slate-500'
                }`}
              >
                {locked ? 'LISTO' : current ? '◄ MUESCA' : 'ESPERA'}
              </div>
            </div>
          );
        })}
      </div>

      <div className="stage-hint">Pulsa OK justo cuando la ficha blanca entre en la muesca derecha</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 6. SABOTAJE DE COMMS (DIFÍCIL: 4 CANALES · ≥93% · DERIVA DE INTERFERENCIA) */
/* -------------------------------------------------------------------------- */

function buildWavePath(freq: number, phaseOffset: number, amp: number): string {
  const pts: string[] = [];
  for (let x = 0; x <= 320; x += 8) {
    const t = (x / 320) * Math.PI * 2;
    const y = 60 + Math.sin(t * freq + phaseOffset) * amp;
    pts.push(`${x === 0 ? 'M' : 'L'} ${x} ${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

export function AuCommsStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
}: StageGameProps) {
  const np = players.length;
  const CHANNELS = 4;
  const TIME_LIMIT = 22;

  const [ti, setTi] = useState(0);
  const [channel, setChannel] = useState(1);
  const [phase, setPhase] = useState<'PASS' | 'PLAY' | 'DONE'>('PASS');
  const [targetDial, setTargetDial] = useState(65);
  const [playerDial, setPlayerDial] = useState(15);
  const [penalties, setPenalties] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [timesMs, setTimesMs] = useState<number[]>(() => Array(np).fill(99999));

  const startMsRef = useRef(0);
  const channelRef = useRef(1);
  const penaltiesRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const driftRef = useRef<number | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (driftRef.current) window.clearInterval(driftRef.current);
    timerRef.current = null;
    driftRef.current = null;
  }, []);

  useEffect(() => stopTimer, [stopTimer]);

  const matchPct = Math.max(0, Math.round(100 - Math.abs(targetDial - playerDial) * 1.9));
  const isLocked = matchPct >= 93;

  useEffect(() => {
    setBg(phase === 'PLAY' && isLocked ? '#063322' : '#0a1019');
  }, [phase, isLocked, setBg]);

  const loadChannel = useCallback((ch: number) => {
    channelRef.current = ch;
    setChannel(ch);
    const tgt = 14 + Math.floor(Math.random() * 72);
    const startDial = tgt > 50 ? 10 + Math.floor(Math.random() * 18) : 72 + Math.floor(Math.random() * 18);
    setTargetDial(tgt);
    setPlayerDial(startDial);
  }, []);

  const startShift = useCallback(() => {
    stopTimer();
    penaltiesRef.current = 0;
    setPenalties(0);
    loadChannel(1);
    setTimeLeft(TIME_LIMIT);
    startMsRef.current = performance.now();
    setPhase('PLAY');
    tone(520, 0.08);

    const endAt = Date.now() + TIME_LIMIT * 1000;
    timerRef.current = window.setInterval(() => {
      const rem = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setTimeLeft(rem);
      if (Date.now() >= endAt) {
        stopTimer();
        tone(120, 0.45, 'sawtooth');
        const penalty =
          TIME_LIMIT * 1000 +
          (CHANNELS - channelRef.current + 1) * 3000 +
          penaltiesRef.current * 1500;
        setTimesMs((prev) => {
          const n = [...prev];
          n[ti] = penalty;
          return n;
        });
        setPhase('DONE');
      }
    }, 100);

    // Deriva de interferencia en canales 2–4
    driftRef.current = window.setInterval(() => {
      if (channelRef.current >= 2) {
        const nudge = Math.random() < 0.5 ? -3 : 3;
        setTargetDial((t) => Math.max(10, Math.min(90, t + nudge)));
      }
    }, 1500);
  }, [stopTimer, loadChannel, ti]);

  const moveDial = useCallback(
    (delta: number) => {
      if (phase !== 'PLAY') return;
      setPlayerDial((d) => Math.max(0, Math.min(100, d + delta)));
      tone(320 + delta * 8, 0.03, 'triangle', 0.04);
    },
    [phase],
  );

  const confirmSignal = useCallback(() => {
    if (phase !== 'PLAY') return;
    if (!isLocked) {
      penaltiesRef.current += 1;
      setPenalties(penaltiesRef.current);
      tone(140, 0.2, 'sawtooth', 0.14);
      return;
    }
    if (channelRef.current < CHANNELS) {
      tone(780, 0.14);
      loadChannel(channelRef.current + 1);
    } else {
      stopTimer();
      tone(880, 0.28);
      const total = Math.round(performance.now() - startMsRef.current) + penaltiesRef.current * 1500;
      setTimesMs((prev) => {
        const n = [...prev];
        n[ti] = total;
        return n;
      });
      setPhase('DONE');
    }
  }, [phase, isLocked, loadChannel, stopTimer, ti]);

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'PASS' && k === 'ok') {
        startShift();
      } else if (phase === 'PLAY') {
        if (k === 'left') moveDial(-4);
        else if (k === 'right') moveDial(4);
        else if (k === 'up') moveDial(1);
        else if (k === 'down') moveDial(-1);
        else if (k === 'ok') confirmSignal();
      } else if (phase === 'DONE' && k === 'ok') {
        if (ti + 1 < np) {
          setTi((i) => i + 1);
          setPhase('PASS');
        } else {
          const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => timesMs[a] - timesMs[b]);
          onFinish(
            'Sabotaje de Comms',
            rank,
            rank.map((p) => `${(timesMs[p] / 1000).toFixed(2)} s`),
            () => {
              setTimesMs(Array(np).fill(99999));
              setTi(0);
              setPhase('PASS');
            },
          );
        }
      }
    },
    [phase, ti, np, timesMs, startShift, moveDial, confirmSignal, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'PASS') {
    return (
      <PassScreen
        playerName={players[ti].name}
        subtitle="Comms (Difícil): 4 canales con deriva de señal. Exige ≥93% de sincronía (usar ▲▼ fino); fallar OK suma +1.5 s."
        onReady={() => handleKey('ok')}
      />
    );
  }

  if (phase === 'DONE') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-giant tabular-nums">{(timesMs[ti] / 1000).toFixed(2)} s</div>
        <div className="stage-sub">
          {players[ti].name} · Fallos de fijación: {penalties} (+{(penalties * 1.5).toFixed(1)} s)
        </div>
        <div className="stage-hint">OK: continuar</div>
      </div>
    );
  }

  const targetFreq = 1.8 + (targetDial / 100) * 3.8;
  const playerFreq = 1.8 + (playerDial / 100) * 3.8;
  const targetWave = buildWavePath(targetFreq, (targetDial / 100) * Math.PI, 38);
  const playerWave = buildWavePath(playerFreq, (playerDial / 100) * Math.PI, 38);

  return (
    <div className="stage-c">
      <div className="stage-sub" style={{marginTop: 0}}>
        {players[ti].name} · Canal {channel}/{CHANNELS} · Sincronía{' '}
        <span className={isLocked ? 'text-emerald-300 font-black' : 'text-amber-300'}>
          {matchPct}%
        </span>{' '}
        · Fallos: {penalties} · ⏱️ {timeLeft}s
      </div>

      <div className="mx-auto mt-[2vh] w-[min(84vw,760px)] rounded-[2vh] border-[0.4vh] border-slate-500/70 bg-slate-900/95 p-[2.4vh_2.6vw] shadow-2xl">
        <div className="mb-[1.6vh] flex items-center justify-between">
          <span
            className={`text-[2.2vh] font-black ${
              isLocked ? 'text-emerald-300' : 'text-red-400'
            }`}
          >
            {isLocked ? '🟢 SEÑAL SINCRONIZADA (≥93%) — ¡OK!' : '🔴 ¡COMMS SABOTEADAS! (Meta ≥93%)'}
          </span>
          <span className="font-mono text-[2vh] text-cyan-200 tabular-nums">
            {(88 + playerDial * 0.2).toFixed(1)} MHz
          </span>
        </div>

        <svg
          viewBox="0 0 320 120"
          className="h-[22vh] w-full rounded-[1.4vh] border-2 border-emerald-500/40 bg-[#03140e]"
        >
          <line x1="0" y1="60" x2="320" y2="60" stroke="#064e3b" strokeWidth="1.5" />
          <path d={targetWave} fill="none" stroke="#ef4444" strokeWidth="4" opacity="0.85" />
          <path
            d={playerWave}
            fill="none"
            stroke={isLocked ? '#34d399' : '#22d3ee'}
            strokeWidth="3.5"
          />
        </svg>

        <div className="mt-[2.2vh] flex items-center justify-center gap-[2vw]">
          <button
            type="button"
            onClick={() => moveDial(-4)}
            className="stage-opt px-[2.4vw] py-[1.4vh] text-[2.6vh] font-black"
          >
            ◀ -
          </button>

          <div className="relative h-[4vh] flex-1 rounded-full border-2 border-slate-600 bg-slate-950">
            <div
              className="absolute top-1/2 h-[3.2vh] w-[3.2vh] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-cyan-400 shadow"
              style={{left: `${playerDial}%`}}
            />
          </div>

          <button
            type="button"
            onClick={() => moveDial(4)}
            className="stage-opt px-[2.4vw] py-[1.4vh] text-[2.6vh] font-black"
          >
            + ▶
          </button>

          <button
            type="button"
            onClick={confirmSignal}
            className={`rounded-xl px-[2.2vw] py-[1.4vh] text-[2.4vh] font-black cursor-pointer ${
              isLocked ? 'bg-emerald-400 text-slate-950' : 'bg-slate-700 text-slate-300'
            }`}
          >
            OK
          </button>
        </div>
      </div>

      <div className="stage-hint">◀▶ Girar dial (±4) · ▲▼ Ajuste fino (±1) · OK Fijar (≥93%)</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* EVENTO SECRETO AMONG US: EMBOSCADA DE SHAPESHIFTER (CAZA AL CLON)          */
/* -------------------------------------------------------------------------- */

interface ShapeshifterStageProps extends StageGameProps {
  onAuLockout: () => void;
}

type ShifterGlitchKind = 'morph' | 'flip' | 'aura';

interface ShifterSlot {
  color: CrewColorMeta;
  isShifter: boolean;
  isTwin: boolean;
}

interface ShifterWave {
  slots: ShifterSlot[];
  shifterIdx: number;
  clonedLabel: string;
}

function buildShapeshifterWave(): ShifterWave {
  const palette = shuffleIndices(AMONG_US_COLORS.length)
    .slice(0, 5)
    .map((i) => AMONG_US_COLORS[i]);
  const clonedColor = palette[0];
  const raw: ShifterSlot[] = [
    {color: clonedColor, isShifter: true, isTwin: false},
    {color: clonedColor, isShifter: false, isTwin: true},
    ...palette.slice(1).map((c) => ({color: c, isShifter: false, isTwin: false})),
  ];
  const order = shuffleIndices(raw.length);
  const slots = order.map((i) => raw[i]);
  const shifterIdx = slots.findIndex((s) => s.isShifter);
  return {slots, shifterIdx, clonedLabel: clonedColor.label};
}

export function AuShapeshifterStage({
  players,
  onFinish,
  onAuLockout,
  registerKeyHandler,
  setBg,
}: ShapeshifterStageProps) {
  const MAX_CATCHES = 4;
  const MAX_STRIKES = 2;

  const [phase, setPhase] = useState<'PLAY' | 'CAUGHT' | 'AMBUSH' | 'WIN'>('PLAY');
  const [catches, setCatches] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [wave, setWave] = useState<ShifterWave>(() => buildShapeshifterWave());
  const [glitchKind, setGlitchKind] = useState<ShifterGlitchKind | null>(null);
  const [timePct, setTimePct] = useState(100);
  const [missNote, setMissNote] = useState<string | null>(null);
  const [canDismissAmbush, setCanDismissAmbush] = useState(false);

  const catchesRef = useRef(0);
  const strikesRef = useRef(0);
  const waveRef = useRef<ShifterWave>(wave);
  waveRef.current = wave;

  const barIvRef = useRef<number | null>(null);
  const expireTimerRef = useRef<number | null>(null);
  const glitchTimerRef = useRef<number | null>(null);
  const glitchEndRef = useRef<number | null>(null);
  const caughtTimerRef = useRef<number | null>(null);
  const noteTimerRef = useRef<number | null>(null);
  const ambushLockRef = useRef<number | null>(null);
  const autoExitRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (barIvRef.current) window.clearInterval(barIvRef.current);
    if (expireTimerRef.current) window.clearTimeout(expireTimerRef.current);
    if (glitchTimerRef.current) window.clearTimeout(glitchTimerRef.current);
    if (glitchEndRef.current) window.clearTimeout(glitchEndRef.current);
    if (caughtTimerRef.current) window.clearTimeout(caughtTimerRef.current);
    if (noteTimerRef.current) window.clearTimeout(noteTimerRef.current);
    if (ambushLockRef.current) window.clearTimeout(ambushLockRef.current);
    if (autoExitRef.current) window.clearTimeout(autoExitRef.current);
    barIvRef.current = null;
    expireTimerRef.current = null;
    glitchTimerRef.current = null;
    glitchEndRef.current = null;
    caughtTimerRef.current = null;
    noteTimerRef.current = null;
    ambushLockRef.current = null;
    autoExitRef.current = null;
  }, []);

  useEffect(() => {
    if (phase === 'AMBUSH') setBg('#7f1d1d');
    else if (phase === 'WIN') setBg('#15803d');
    else if (phase === 'CAUGHT') setBg('#0c4a6e');
    else setBg('#070d19');
  }, [phase, setBg]);

  const triggerAmbush = useCallback(() => {
    clearTimers();
    setGlitchKind(null);
    setCanDismissAmbush(false);
    setPhase('AMBUSH');
    tone(95, 0.55, 'sawtooth', 0.25);
    window.setTimeout(() => tone(150, 0.48, 'square', 0.2), 110);
    window.setTimeout(() => tone(75, 0.65, 'sawtooth', 0.24), 240);

    ambushLockRef.current = window.setTimeout(() => {
      setCanDismissAmbush(true);
    }, 700);
    autoExitRef.current = window.setTimeout(() => {
      onAuLockout();
    }, 3600);
  }, [clearTimers, onAuLockout]);

  const startWave = useCallback(
    (currentCatches: number) => {
      clearTimers();
      const nextWave = buildShapeshifterWave();
      waveRef.current = nextWave;
      setWave(nextWave);
      setGlitchKind(null);
      setMissNote(null);
      setTimePct(100);
      setPhase('PLAY');

      const waveMs = Math.max(5400, 8200 - currentCatches * 850);
      const t0 = performance.now();
      barIvRef.current = window.setInterval(() => {
        const elapsed = performance.now() - t0;
        setTimePct(Math.max(0, 100 - (elapsed / waveMs) * 100));
      }, 45);

      expireTimerRef.current = window.setTimeout(() => {
        triggerAmbush();
      }, waveMs);

      const kinds: ShifterGlitchKind[] = ['morph', 'flip', 'aura'];
      const scheduleGlitch = (first = false) => {
        const waitMs = first
          ? 280
          : Math.max(520, 920 - currentCatches * 100) + Math.floor(Math.random() * 280);
        glitchTimerRef.current = window.setTimeout(() => {
          const picked = kinds[Math.floor(Math.random() * kinds.length)];
          setGlitchKind(picked);
          tone(760, 0.04, 'triangle', 0.05);
          const showMs = Math.max(360, 580 - currentCatches * 60);
          glitchEndRef.current = window.setTimeout(() => {
            setGlitchKind(null);
            scheduleGlitch(false);
          }, showMs);
        }, waitMs);
      };
      scheduleGlitch(true);
    },
    [clearTimers, triggerAmbush],
  );

  useEffect(() => {
    catchesRef.current = 0;
    strikesRef.current = 0;
    startWave(0);
    return () => clearTimers();
  }, [startWave, clearTimers]);

  const showTempNote = useCallback((text: string) => {
    setMissNote(text);
    if (noteTimerRef.current) window.clearTimeout(noteTimerRef.current);
    noteTimerRef.current = window.setTimeout(() => setMissNote(null), 900);
  }, []);

  const accuseSlot = useCallback(
    (idx: number) => {
      if (phase !== 'PLAY') return;
      if (idx === waveRef.current.shifterIdx) {
        clearTimers();
        setGlitchKind(null);
        playControlClick();
        tone(560, 0.1, 'triangle', 0.15);
        window.setTimeout(() => tone(820, 0.16, 'triangle', 0.14), 80);

        const nextCatches = catchesRef.current + 1;
        catchesRef.current = nextCatches;
        setCatches(nextCatches);
        setPhase('CAUGHT');

        caughtTimerRef.current = window.setTimeout(() => {
          if (nextCatches >= MAX_CATCHES) {
            tone(523, 0.14);
            window.setTimeout(() => tone(784, 0.3), 150);
            setPhase('WIN');
          } else {
            startWave(nextCatches);
          }
        }, 720);
      } else {
        const nextSt = strikesRef.current + 1;
        strikesRef.current = nextSt;
        setStrikes(nextSt);
        tone(145, 0.2, 'sawtooth', 0.16);
        if (nextSt >= MAX_STRIKES) {
          triggerAmbush();
          return;
        }
        showTempNote(`❌ ¡Era tripulante inocente! Fallo ${nextSt}/${MAX_STRIKES}`);
      }
    },
    [phase, clearTimers, startWave, triggerAmbush, showTempNote],
  );

  const finishVictory = useCallback(() => {
    clearTimers();
    const rank = Array.from({length: players.length}, (_, i) => i);
    const sharedPts = rank.map(() => 3);
    onFinish(
      '¡Emboscada: Shapeshifter!',
      rank,
      rank.map(() => `${MAX_CATCHES}/${MAX_CATCHES} clones cazados · Nave a salvo`),
      () => {
        catchesRef.current = 0;
        strikesRef.current = 0;
        setCatches(0);
        setStrikes(0);
        setCursor(0);
        startWave(0);
      },
      sharedPts,
    );
  }, [clearTimers, players.length, onFinish, startWave]);

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'PLAY') {
        if (k === 'left') {
          playControlClick();
          setCursor((c) => (c % 3 === 0 ? c + 2 : c - 1));
        } else if (k === 'right') {
          playControlClick();
          setCursor((c) => (c % 3 === 2 ? c - 2 : c + 1));
        } else if (k === 'up' || k === 'down') {
          playControlClick();
          setCursor((c) => (c + 3) % 6);
        } else if (k === 'ok') {
          accuseSlot(cursor);
        }
      } else if (phase === 'AMBUSH' && k === 'ok' && canDismissAmbush) {
        onAuLockout();
      } else if (phase === 'WIN' && k === 'ok') {
        finishVictory();
      }
    },
    [phase, cursor, canDismissAmbush, accuseSlot, onAuLockout, finishVictory],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'AMBUSH') {
    return (
      <div
        className="stage-c cursor-pointer"
        onClick={() => {
          if (canDismissAmbush) onAuLockout();
        }}
      >
        <div className="mx-auto mb-[1.6vh] flex items-center justify-center gap-[1.5vw]">
          <CrewmateSvg
            bodyColor="#db2777"
            shadeColor="#9d174d"
            state="impostor"
            className="h-[24vh] w-[24vh] fnaf-jumpscare-pop"
          />
          <ShapeshifterBadgeSvg className="h-[18vh] w-[18vh]" />
        </div>
        <div className="stage-big text-red-300" style={{fontSize: 'clamp(1.9rem, 7vh, 4.2rem)'}}>
          ¡EL SHAPESHIFTER TE EMBOSCÓ!
        </div>
        <div className="stage-sub text-cyan-200">Modo Among Us cerrado durante 1 minuto</div>
        <div className="stage-hint">
          {canDismissAmbush ? 'OK: volver al modo Clásico' : '¡Saboteó la Cafetería!'}
        </div>
      </div>
    );
  }

  if (phase === 'WIN') {
    return (
      <div className="stage-c cursor-pointer" onClick={finishVictory}>
        <div className="mx-auto mb-[1.6vh] flex items-center justify-center">
          <ShapeshifterBadgeSvg className="h-[22vh] w-[22vh]" />
        </div>
        <div className="stage-big text-emerald-300" style={{fontSize: 'clamp(1.9rem, 7vh, 4.2rem)'}}>
          ¡SHAPESHIFTER ELIMINADO!
        </div>
        <div className="stage-sub">
          Detectaste los {MAX_CATCHES} disfraces en Cafetería (+3 pts para todos)
        </div>
        <div className="stage-hint">OK: reclamar +3 pts para todos</div>
      </div>
    );
  }

  return (
    <div className="stage-c">
      <div className="stage-sub text-cyan-300">
        Emboscada Shapeshifter · Rondas {catches}/{MAX_CATCHES} ·{' '}
        <span className={strikes > 0 ? 'text-red-400 font-bold' : 'text-slate-300'}>
          Fallos {strikes}/{MAX_STRIKES}
        </span>
      </div>

      <div className="stage-big" style={{fontSize: 'clamp(1.35rem, 4vh, 2.5rem)', marginTop: '0.3vh'}}>
        {phase === 'CAUGHT'
          ? '✅ ¡CLON DESENMASCARADO!'
          : missNote ?? `Color duplicado: ${wave.clonedLabel} — ¡caza al que falla!`}
      </div>

      <div className="mx-auto mt-[2vh] grid max-w-[78vw] grid-cols-3 gap-[1.4vw]">
        {wave.slots.map((slot, idx) => {
          const isSelected = cursor === idx;
          const isGlitching = phase === 'PLAY' && slot.isShifter && glitchKind !== null;
          const isRevealed = phase === 'CAUGHT' && slot.isShifter;
          const crewState =
            isRevealed || (isGlitching && glitchKind === 'morph') ? 'impostor' : 'alive';
          const crewFacing = isGlitching && glitchKind === 'flip' ? 'left' : 'right';

          return (
            <button
              key={`ss-${idx}-${slot.color.id}`}
              type="button"
              onClick={() => {
                setCursor(idx);
                accuseSlot(idx);
              }}
              className={`relative flex h-[24vh] flex-col items-center justify-center rounded-[1.8vh] border-[0.45vh] p-[1vh] transition-transform duration-100 cursor-pointer ${
                isRevealed
                  ? 'scale-105 border-emerald-400 bg-emerald-950/75 shadow-[0_0_3vh_rgba(52,211,153,0.5)]'
                  : isSelected
                    ? 'scale-[1.03] border-cyan-300 bg-slate-900/95 shadow-[0_0_2.5vh_rgba(34,211,238,0.45)]'
                    : isGlitching && glitchKind === 'aura'
                      ? 'border-fuchsia-400 bg-fuchsia-950/55'
                      : slot.isShifter || slot.isTwin
                        ? 'border-amber-400/35 bg-slate-950/85'
                        : 'border-white/15 bg-slate-950/80'
              }`}
            >
              {isGlitching && glitchKind === 'aura' && (
                <span className="mb-[0.3vh] text-[1.5vh] font-black text-fuchsia-300">
                  MUTANDO…
                </span>
              )}
              <CrewmateSvg
                bodyColor={slot.color.body}
                shadeColor={slot.color.shade}
                state={crewState}
                facing={crewFacing}
                className="h-[13.5vh] w-[13.5vh]"
              />
              <div className="mt-[0.5vh] text-[1.9vh] font-extrabold text-slate-200">
                {slot.color.label}
              </div>
              {isSelected && phase === 'PLAY' && (
                <div className="mt-[0.2vh] text-[1.5vh] font-bold text-cyan-300">OK: REPORTAR</div>
              )}
            </button>
          );
        })}
      </div>

      <div className="stage-barw" style={{marginTop: '2.2vh'}}>
        <div
          className="stage-barf"
          style={{
            width: `${phase === 'PLAY' ? timePct : 100}%`,
            background: phase === 'PLAY' && timePct < 30 ? '#ef4444' : '#22d3ee',
          }}
        />
      </div>

      <div className="stage-hint">
        Busca los 2 del mismo color ({wave.clonedLabel}) y reporta con OK al que mute o se voltee
      </div>
    </div>
  );
}

