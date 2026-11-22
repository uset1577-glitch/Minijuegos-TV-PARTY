import {useCallback, useEffect, useRef, useState} from 'react';
import {
  PLAYER_STAGE_COLORS,
  RemoteKey,
  StageGameProps,
  playControlClick,
  tone,
} from '../../utils/stageAudio';

/* -------------------------------------------------------------------------- */
/* SHARED PASS SCREEN HELPER                                                  */
/* -------------------------------------------------------------------------- */

export function PassScreen({
  playerName,
  subtitle,
  onReady,
}: {
  playerName: string;
  subtitle: string;
  onReady: () => void;
}) {
  return (
    <div className="stage-c cursor-pointer" onClick={onReady}>
      <div className="stage-sub">Pásale el control a</div>
      <div className="stage-big">{playerName}</div>
      <div className="stage-sub">{subtitle}</div>
      <div className="stage-hint">Presiona OK cuando lo tengas</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 1. PATATA CALIENTE (MECHA CORTA + TECLA CAMBIANTE + DIRECCIÓN INVERSA)     */
/* -------------------------------------------------------------------------- */

type PassButtonKind = 'ok' | 'up' | 'right';
const PASS_BTN_META: Record<PassButtonKind, {label: string; short: string}> = {
  ok: {label: 'Pulsa OK', short: 'OK'},
  up: {label: 'Pulsa ▲', short: '▲'},
  right: {label: 'Pulsa ▶', short: '▶'},
};

function randomPassBtn(): PassButtonKind {
  const pool: PassButtonKind[] = ['ok', 'ok', 'up', 'right'];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function BombaStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const MAX_BURNS = 2;

  const [phase, setPhase] = useState<'PASS' | 'ALIVE' | 'BOOM'>('PASS');
  const [holder, setHolder] = useState(0);
  const [burns, setBurns] = useState<number[]>(() => Array(np).fill(0));
  const [boomCooldown, setBoomCooldown] = useState(false);
  const [reqBtn, setReqBtn] = useState<PassButtonKind>('ok');
  const [dirStep, setDirStep] = useState<1 | -1>(1);
  const [roundNum, setRoundNum] = useState(1);

  const holderRef = useRef(0);
  const aliveRef = useRef(false);
  const lastPassRef = useRef(0);
  const t0Ref = useRef(0);
  const totRef = useRef(0);
  const reqBtnRef = useRef<PassButtonKind>('ok');
  const dirStepRef = useRef<1 | -1>(1);
  const roundRef = useRef(1);
  const beatTimerRef = useRef<number | null>(null);
  const boomTimerRef = useRef<number | null>(null);
  const cooldownTimerRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (beatTimerRef.current) window.clearTimeout(beatTimerRef.current);
    if (boomTimerRef.current) window.clearTimeout(boomTimerRef.current);
    if (cooldownTimerRef.current) window.clearTimeout(cooldownTimerRef.current);
  };

  useEffect(() => clearTimers, []);

  const startRound = useCallback(() => {
    clearTimers();
    const minMs = isAu ? 5200 : Math.max(3600, 5200 - roundRef.current * 450);
    const tot = minMs + Math.random() * (isAu ? 5500 : 5200);
    totRef.current = tot;
    t0Ref.current = Date.now();
    lastPassRef.current = Date.now();
    aliveRef.current = true;
    const nextDir: 1 | -1 = !isAu && Math.random() < 0.4 ? -1 : 1;
    dirStepRef.current = nextDir;
    setDirStep(nextDir);
    const nextKey: PassButtonKind = !isAu && roundRef.current > 1 ? randomPassBtn() : 'ok';
    reqBtnRef.current = nextKey;
    setReqBtn(nextKey);
    setBoomCooldown(false);
    setPhase('ALIVE');

    const beat = () => {
      if (!aliveRef.current) return;
      const f = Math.min(1, (Date.now() - t0Ref.current) / totRef.current);
      if (isAu) {
        tone(440 + f * 260, 0.035, 'sine', 0.03);
      } else {
        tone(620 + f * 780, 0.05, 'square', 0.07);
      }
      beatTimerRef.current = window.setTimeout(
        beat,
        Math.max(isAu ? 160 : 110, (isAu ? 580 : 520) - f * 410),
      );
    };
    beat();

    boomTimerRef.current = window.setTimeout(() => {
      if (!aliveRef.current) return;
      aliveRef.current = false;
      clearTimers();
      tone(110, 0.8, 'sawtooth', 0.25);
      const currentHolder = holderRef.current;
      setBurns((prev) => {
        const next = [...prev];
        next[currentHolder] = (next[currentHolder] ?? 0) + 1;
        return next;
      });
      roundRef.current += 1;
      setRoundNum(roundRef.current);
      setBoomCooldown(true);
      setPhase('BOOM');
      cooldownTimerRef.current = window.setTimeout(() => {
        setBoomCooldown(false);
      }, 2100);
    }, tot);
  }, [isAu]);

  useEffect(() => {
    if (phase === 'BOOM') setBg('#7f1d1d');
    else setBg(PLAYER_STAGE_COLORS[holder % PLAYER_STAGE_COLORS.length]);
  }, [phase, holder, setBg]);

  const finishGame = useCallback(() => {
    const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => burns[a] - burns[b]);
    onFinish(
      isFnaf ? 'Pasa el Cupcake' : isAu ? 'Núcleo Inestable' : 'Patata caliente',
      rank,
      rank.map(
        (p) =>
          `${burns[p]} ${
            isFnaf ? 'sustos de Chica' : isAu ? 'sabotajes de reactor' : 'quemadas'
          }`,
      ),
      () => {
        holderRef.current = 0;
        roundRef.current = 1;
        setRoundNum(1);
        setBurns(Array(np).fill(0));
        setHolder(0);
        setBoomCooldown(false);
        setPhase('PASS');
      },
    );
  }, [burns, np, isFnaf, isAu, onFinish]);

  const passBomb = useCallback(
    (pressed: RemoteKey) => {
      if (phase === 'PASS' && pressed === 'ok') {
        tone(520, 0.1);
        startRound();
      } else if (phase === 'ALIVE' && aliveRef.current) {
        if (pressed !== reqBtnRef.current) {
          tone(150, 0.14, 'sawtooth', 0.1);
          return;
        }
        if (Date.now() - lastPassRef.current <= 140) return;
        lastPassRef.current = Date.now();
        tone(440, 0.05);
        const nextHolder = (holderRef.current + dirStepRef.current + np) % np;
        holderRef.current = nextHolder;
        setHolder(nextHolder);

        const nextBtn = isAu ? 'ok' : randomPassBtn();
        reqBtnRef.current = nextBtn;
        setReqBtn(nextBtn);
        if (!isAu && Math.random() < 0.25) {
          const flipped: 1 | -1 = dirStepRef.current === 1 ? -1 : 1;
          dirStepRef.current = flipped;
          setDirStep(flipped);
        }
      } else if (phase === 'BOOM' && pressed === 'ok') {
        if (boomCooldown) return;
        if ((burns[holder] ?? 0) >= MAX_BURNS) {
          finishGame();
        } else {
          startRound();
        }
      }
    },
    [phase, np, burns, holder, boomCooldown, isAu, startRound, finishGame],
  );

  useEffect(() => {
    registerKeyHandler((k: RemoteKey) => {
      if (isAu) {
        if (k === 'ok') passBomb(k);
      } else if (k === 'ok' || k === 'up' || k === 'right') {
        passBomb(k);
      }
    });
  }, [registerKeyHandler, passBomb, isAu]);

  if (phase === 'PASS') {
    return (
      <PassScreen
        playerName={players[holder].name}
        subtitle={
          isFnaf
            ? 'Pasa a Carl el Cupcake con la tecla indicada (OK, ▲ o ▶). ¡2 sustos y pierdes!'
            : isAu
              ? 'Pasa el núcleo inestable presionando solo OK antes de la sobrecarga. ¡2 fallos y pierdes!'
              : 'Mecha corta y tecla aleatoria (OK, ▲ o ▶). ¡2 quemadas y termina!'
        }
        onReady={() => passBomb('ok')}
      />
    );
  }

  if (phase === 'BOOM') {
    const burnedOut = (burns[holder] ?? 0) >= MAX_BURNS;
    return (
      <div className="stage-c cursor-pointer" onClick={() => passBomb('ok')}>
        <div className="text-[19vh] leading-none">{isFnaf ? '🐥' : isAu ? '☢️' : '💥'}</div>
        <div className="stage-big mt-2">
          {isFnaf ? '¡SUSTO DE CHICA!' : isAu ? '¡SOBRECARGA DEL NÚCLEO!' : '¡BOOM!'}
        </div>
        <div className="stage-sub">
          {players[holder].name} {isFnaf ? 'atrapado' : isAu ? 'expulsado' : 'se quemó'} (
          {burns[holder]}/{MAX_BURNS})
        </div>
        <div className="stage-hint">
          {boomCooldown
            ? 'Descanso (2 s)…'
            : `OK: ${burnedOut ? 'ver resultados' : `ronda ${roundNum}`}`}
        </div>
      </div>
    );
  }

  return (
    <div className="stage-c cursor-pointer" onClick={() => passBomb(reqBtn)}>
      <div className="text-[15vh] leading-none">{isFnaf ? '🧁' : isAu ? '⚛️' : '💣'}</div>
      <div className="stage-big mt-2">{players[holder].name}</div>
      <div className="mt-3 inline-block rounded-[1.5vh] border-[0.35vh] border-white bg-black/45 px-[2.5vw] py-[1vh] text-[4.5vh] font-black text-yellow-300">
        {PASS_BTN_META[reqBtn].label} · {dirStep === 1 ? '▶ Siguiente' : '◀ Reversa'}
      </div>
      <div className="stage-sub">
        {isFnaf
          ? `Sustos de Chica: ${burns[holder]} / ${MAX_BURNS}`
          : isAu
            ? `Sabotajes: ${burns[holder]} / ${MAX_BURNS}`
            : `Quemadas: ${burns[holder]} / ${MAX_BURNS}`}
      </div>
      <div className="stage-hint">
        {isAu
          ? '¡Pulsa OK rápido para pasar el núcleo!'
          : `¡Obedece la tecla exacta (${PASS_BTN_META[reqBtn].short}) rápido!`}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. REFLEJOS (CON AMAGOS TRAMPA + LÍMITE DE TIEMPO ESTRICTO)                */
/* -------------------------------------------------------------------------- */

export function ReflejosStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const ROUNDS = 3;
  const totalTurns = ROUNDS * np;

  const [qi, setQi] = useState(0);
  const [phase, setPhase] = useState<'PASS' | 'WAIT' | 'FAKE' | 'GO' | 'EARLY' | 'RESULT'>('PASS');
  const [totals, setTotals] = useState<number[]>(() => Array(np).fill(0));
  const [lastMs, setLastMs] = useState(0);
  const [earlyReason, setEarlyReason] = useState('');

  const waitTimerRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const goTimeRef = useRef(0);

  const clearAll = () => {
    if (waitTimerRef.current) window.clearTimeout(waitTimerRef.current);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  };
  useEffect(() => clearAll, []);

  const playerIdx = qi % np;
  const roundNum = Math.floor(qi / np) + 1;

  useEffect(() => {
    if (phase === 'WAIT') setBg('#b91c1c');
    else if (phase === 'FAKE') setBg('#6d28d9');
    else if (phase === 'GO') setBg('#16a34a');
    else if (phase === 'EARLY') setBg('#7f1d1d');
    else setBg(PLAYER_STAGE_COLORS[playerIdx % PLAYER_STAGE_COLORS.length]);
  }, [phase, playerIdx, setBg]);

  const triggerPenalty = useCallback(
    (reason: string, pIdx: number) => {
      clearAll();
      tone(140, 0.38, 'sawtooth');
      setEarlyReason(reason);
      setTotals((prev) => {
        const next = [...prev];
        next[pIdx] += 1200;
        return next;
      });
      setPhase('EARLY');
    },
    [],
  );

  const startWait = useCallback(
    (pIdx: number, rnd: number) => {
      clearAll();
      setPhase('WAIT');
      const hasFake = rnd >= 2 || Math.random() < 0.55;

      const scheduleGo = (delay: number) => {
        waitTimerRef.current = window.setTimeout(() => {
          goTimeRef.current = performance.now();
          tone(920, 0.2);
          setPhase('GO');
          timeoutRef.current = window.setTimeout(() => {
            triggerPenalty('¡Demasiado lento (> 950 ms)! (+1200 ms)', pIdx);
          }, 950);
        }, delay);
      };

      if (hasFake) {
        waitTimerRef.current = window.setTimeout(() => {
          tone(360, 0.14, 'square');
          setPhase('FAKE');
          waitTimerRef.current = window.setTimeout(() => {
            setPhase('WAIT');
            scheduleGo(850 + Math.random() * 1900);
          }, 720);
        }, 1000 + Math.random() * 1400);
      } else {
        scheduleGo(1300 + Math.random() * 2400);
      }
    },
    [triggerPenalty],
  );

  const advance = useCallback(() => {
    const nextQi = qi + 1;
    if (nextQi >= totalTurns) {
      const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => totals[a] - totals[b]);
      onFinish(
        isFnaf ? 'Cierra la Puerta' : isAu ? 'Botón Emergencia' : 'Reflejos',
        rank,
        rank.map(
          (p) =>
            `${totals[p]} ms ${
              isFnaf ? 'al cerrar puerta' : isAu ? 'en reportar' : 'en total'
            }`,
        ),
        () => {
          setTotals(Array(np).fill(0));
          setQi(0);
          setPhase('PASS');
        },
      );
    } else {
      setQi(nextQi);
      setPhase('PASS');
    }
  }, [qi, totalTurns, np, totals, isFnaf, isAu, onFinish]);

  const handleOk = useCallback(() => {
    if (phase === 'PASS') {
      tone(520, 0.1);
      startWait(playerIdx, roundNum);
    } else if (phase === 'WAIT' || phase === 'FAKE') {
      triggerPenalty(
        phase === 'FAKE'
          ? '¡Caíste en el AMAGO trampa! (+1200 ms)'
          : isFnaf
            ? 'Cerraste antes de tiempo (+1200 ms)'
            : isAu
              ? '¡Falsa alarma en Cafetería! (+1200 ms)'
              : '¡Presionaste antes de verde! (+1200 ms)',
        playerIdx,
      );
    } else if (phase === 'GO') {
      clearAll();
      const ms = Math.round(performance.now() - goTimeRef.current);
      tone(660, 0.1);
      setLastMs(ms);
      setTotals((prev) => {
        const next = [...prev];
        next[playerIdx] += ms;
        return next;
      });
      setPhase('RESULT');
    } else {
      advance();
    }
  }, [phase, playerIdx, roundNum, isFnaf, isAu, startWait, triggerPenalty, advance]);

  useEffect(() => {
    registerKeyHandler((k: RemoteKey) => {
      if (k === 'ok') handleOk();
    });
  }, [registerKeyHandler, handleOk]);

  if (phase === 'PASS') {
    return (
      <PassScreen
        playerName={players[playerIdx].name}
        subtitle={
          isFnaf
            ? `Noche ${roundNum}/${ROUNDS} · ¡Cuidado con los amagos! Tienes <950 ms al ver a Foxy`
            : isAu
              ? `Ronda ${roundNum}/${ROUNDS} · Ignora los amagos morados y pulsa en <950 ms al ver VERDE`
              : `Ronda ${roundNum}/${ROUNDS} · ¡Habrá amagos trampa! Pulsa en <950 ms solo en VERDE`
        }
        onReady={handleOk}
      />
    );
  }

  if (phase === 'FAKE') {
    return (
      <div className="stage-c cursor-pointer" onClick={handleOk}>
        <div className="text-[14vh] leading-none">⚠️</div>
        <div className="stage-big mt-2">¡AMAGO! ¡NO PULSES!</div>
        <div className="stage-sub">Solo es una sombra… espera al VERDE</div>
      </div>
    );
  }

  if (phase === 'WAIT') {
    return (
      <div className="stage-c cursor-pointer" onClick={handleOk}>
        <div className="text-[12vh] leading-none">{isFnaf ? '🚪' : isAu ? '🚨' : '🔴'}</div>
        <div className="stage-big mt-2">
          {isFnaf ? 'Vigila la puerta…' : isAu ? 'Espera en Cafetería…' : 'Espera…'}
        </div>
        <div className="stage-sub">
          {isFnaf
            ? 'No cierres hasta confirmar a Foxy'
            : isAu
              ? 'No reportes hasta ver luz VERDE'
              : 'No pulses hasta ver VERDE (cuidado con amagos)'}
        </div>
      </div>
    );
  }

  if (phase === 'GO') {
    return (
      <div className="stage-c cursor-pointer" onClick={handleOk}>
        {isFnaf ? (
          <>
            <div className="text-[18vh] leading-none">🦊</div>
            <div className="stage-big mt-2">¡FOXY EN LA PUERTA!</div>
            <div className="stage-sub">¡Presiona OK ya!</div>
          </>
        ) : isAu ? (
          <>
            <div className="text-[18vh] leading-none">🛸</div>
            <div className="stage-big mt-2">¡IMPOSTOR DETECTADO!</div>
            <div className="stage-sub">¡Presiona OK para REPORTAR!</div>
          </>
        ) : (
          <div className="stage-giant">¡YA!</div>
        )}
      </div>
    );
  }

  if (phase === 'EARLY') {
    return (
      <div className="stage-c cursor-pointer" onClick={handleOk}>
        <div className="stage-big">¡FALLO!</div>
        <div className="stage-sub">{earlyReason}</div>
        <div className="stage-hint">OK: continuar</div>
      </div>
    );
  }

  return (
    <div className="stage-c cursor-pointer" onClick={handleOk}>
      <div className="stage-big">{lastMs} ms</div>
      <div className="stage-sub">
        {players[playerIdx].name}
        {isFnaf ? ' · ¡Puerta cerrada a tiempo!' : isAu ? ' · ¡Reporte inmediato!' : ''}
      </div>
      <div className="stage-hint">OK: continuar</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. SIMÓN (ARRANCA CON 3 FLECHAS + RITMO VELOZ + RELOJ DE 7 s)              */
/* -------------------------------------------------------------------------- */

type SimonDir = 'up' | 'right' | 'down' | 'left';
const SIMON_DIRS: SimonDir[] = ['up', 'right', 'down', 'left'];
const SIMON_META: Record<SimonDir, {color: string; freq: number; arrow: string}> = {
  up: {color: '#22c55e', freq: 523, arrow: '▲'},
  right: {color: '#ef4444', freq: 659, arrow: '▶'},
  down: {color: '#f59e0b', freq: 392, arrow: '▼'},
  left: {color: '#3b82f6', freq: 330, arrow: '◀'},
};

function makeSeedSimon(len = 3): SimonDir[] {
  return Array.from({length: len}, () => SIMON_DIRS[Math.floor(Math.random() * 4)]);
}

export function SimonStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const [alive, setAlive] = useState<number[]>(() => Array.from({length: np}, (_, i) => i));
  const [eliminated, setEliminated] = useState<number[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [seq, setSeq] = useState<SimonDir[]>(() => makeSeedSimon(3));
  const [phase, setPhase] = useState<'PASS' | 'WATCH' | 'INPUT' | 'FAIL'>('PASS');
  const [lit, setLit] = useState<SimonDir | null>(null);
  const [inputIdx, setInputIdx] = useState(0);
  const [inputPct, setInputPct] = useState(100);
  const [msg, setMsg] = useState('');

  const timersRef = useRef<number[]>([]);
  const inputIvRef = useRef<number | null>(null);
  const turnLockedRef = useRef(false);

  const clearAll = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    if (inputIvRef.current) {
      window.clearInterval(inputIvRef.current);
      inputIvRef.current = null;
    }
  };
  useEffect(() => clearAll, []);

  const currentPlayer = alive[turnIndex % alive.length] ?? 0;

  useEffect(() => {
    if (phase === 'FAIL') setBg('#7f1d1d');
    else setBg(PLAYER_STAGE_COLORS[currentPlayer % PLAYER_STAGE_COLORS.length]);
  }, [phase, currentPlayer, setBg]);

  const eliminatePlayer = useCallback(
    (reasonMsg: string) => {
      clearAll();
      turnLockedRef.current = true;
      tone(110, 0.65, 'sawtooth', 0.25);
      const nextAlive = alive.filter((p) => p !== currentPlayer);
      const nextElim = eliminated.includes(currentPlayer)
        ? eliminated
        : [...eliminated, currentPlayer];
      setAlive(nextAlive);
      setEliminated(nextElim);
      setSeq(makeSeedSimon(3));
      setTurnIndex((prev) => prev % Math.max(1, nextAlive.length));
      setMsg(reasonMsg);
      setPhase('FAIL');
    },
    [alive, currentPlayer, eliminated],
  );

  const startWatch = useCallback(
    (seqSnapshot: SimonDir[], playerId: number) => {
      clearAll();
      setPhase('WATCH');
      setLit(null);
      setInputPct(100);
      setMsg(
        `${players[playerId].name} · ${
          isFnaf ? 'escucha rápido la caja…' : isAu ? 'observa el escáner…' : 'observa…'
        }`,
      );

      const stepMs = Math.max(330, 560 - seqSnapshot.length * 26);
      seqSnapshot.forEach((d, idx) => {
        const t1 = window.setTimeout(() => {
          setLit(d);
          tone(SIMON_META[d].freq, 0.18);
        }, idx * stepMs + 280);
        const t2 = window.setTimeout(() => {
          setLit(null);
        }, idx * stepMs + stepMs - 70);
        timersRef.current.push(t1, t2);
      });

      const endT = window.setTimeout(() => {
        turnLockedRef.current = false;
        setInputIdx(0);
        setPhase('INPUT');
        setMsg(`${players[playerId].name} · repite (0/${seqSnapshot.length}) + 1 nueva`);

        const limitMs = 5500 + seqSnapshot.length * 950;
        const endAt = performance.now() + limitMs;
        inputIvRef.current = window.setInterval(() => {
          const left = Math.max(0, endAt - performance.now());
          setInputPct((left / limitMs) * 100);
          if (left <= 0) {
            eliminatePlayer('¡Se acabó el tiempo de respuesta!');
          }
        }, 50);
      }, seqSnapshot.length * stepMs + 320);
      timersRef.current.push(endT);
    },
    [players, isFnaf, isAu, eliminatePlayer],
  );

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'PASS' && k === 'ok') {
        tone(520, 0.1);
        startWatch(seq, currentPlayer);
        return;
      }

      if (phase === 'FAIL' && k === 'ok') {
        if (alive.length <= 1) {
          const rank = Array.from(new Set([...alive, ...eliminated.slice().reverse()]));
          onFinish(
            isFnaf ? 'Caja de Puppet' : isAu ? 'Escáner Medbay' : 'Simón',
            rank,
            rank.map((_, idx) =>
              idx === 0
                ? 'Ganador'
                : isFnaf
                  ? 'Salió Puppet'
                  : isAu
                    ? 'Expulsado'
                    : 'Eliminado',
            ),
            () => {
              turnLockedRef.current = false;
              setAlive(Array.from({length: np}, (_, i) => i));
              setEliminated([]);
              setTurnIndex(0);
              setSeq(makeSeedSimon(3));
              setPhase('PASS');
            },
          );
        } else {
          setPhase('PASS');
        }
        return;
      }

      if (phase === 'INPUT' && (k === 'up' || k === 'right' || k === 'down' || k === 'left')) {
        if (turnLockedRef.current) return;
        tone(SIMON_META[k].freq, 0.16);
        setLit(k);
        if (inputIdx < seq.length) {
          if (k === seq[inputIdx]) {
            const nextIdx = inputIdx + 1;
            setInputIdx(nextIdx);
            setMsg(
              nextIdx < seq.length
                ? `${players[currentPlayer].name} · repite (${nextIdx}/${seq.length})`
                : `${players[currentPlayer].name} · ¡ahora agrega una flecha nueva!`,
            );
            const t = window.setTimeout(() => setLit(null), 150);
            timersRef.current.push(t);
          } else {
            eliminatePlayer('¡Flecha incorrecta!');
          }
        } else {
          if (inputIvRef.current) {
            window.clearInterval(inputIvRef.current);
            inputIvRef.current = null;
          }
          turnLockedRef.current = true;
          const nextSeq = [...seq, k];
          setSeq(nextSeq);
          setMsg(isFnaf ? '¡Cuerda cargada!' : isAu ? '¡Escaneo completo!' : '¡Agregada!');
          const t = window.setTimeout(() => {
            setLit(null);
            setTurnIndex((prev) => (prev + 1) % alive.length);
            setPhase('PASS');
          }, 550);
          timersRef.current.push(t);
        }
      }
    },
    [
      phase,
      seq,
      currentPlayer,
      alive,
      eliminated,
      inputIdx,
      np,
      players,
      isFnaf,
      isAu,
      startWatch,
      eliminatePlayer,
      onFinish,
    ],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'PASS') {
    return (
      <PassScreen
        playerName={players[currentPlayer].name}
        subtitle={
          isFnaf
            ? `Caja de Puppet (${seq.length} notas): repite rápido contra el reloj y agrega 1`
            : isAu
              ? `Escáner Medbay (${seq.length} señales): repite rápido antes de tiempo y agrega 1`
              : `Simón rápido (${seq.length} flechas): repite contra reloj y agrega 1`
        }
        onReady={() => handleKey('ok')}
      />
    );
  }

  if (phase === 'FAIL') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="text-[12vh] leading-none">{isFnaf ? '🎁' : isAu ? '🧬' : '❌'}</div>
        <div className="stage-big mt-2">
          {isFnaf
            ? '¡Se abrió la caja de Puppet!'
            : isAu
              ? '¡Fallo en Escáner Medbay!'
              : '¡Fallaste!'}
        </div>
        <div className="stage-sub">{msg}</div>
        <div className="stage-hint">OK: continuar</div>
      </div>
    );
  }

  return (
    <div className="stage-c">
      <div className="stage-sub">
        {isFnaf ? '🎁 ' : isAu ? '🧬 ' : ''}
        {msg}
      </div>
      {phase === 'INPUT' && (
        <div className="stage-barw" style={{height: '1.4vh', marginTop: '1.2vh', width: '44vw'}}>
          <div
            className="stage-barf"
            style={{width: `${inputPct}%`, background: inputPct < 30 ? '#ef4444' : '#ffffff'}}
          />
        </div>
      )}
      <div className="stage-simon" style={{marginTop: '2.2vh'}}>
        {SIMON_DIRS.map((d) => (
          <div
            key={d}
            onClick={() => handleKey(d)}
            className={`stage-sd ${d} cursor-pointer`}
            style={{
              background: SIMON_META[d].color,
              opacity: lit === d ? 1 : 0.24,
            }}
          >
            {SIMON_META[d].arrow}
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. MACHACA OK (DECAIMIENTO DE ENERGÍA + VENTANAS DE SOBRECALENTAMIENTO)    */
/* -------------------------------------------------------------------------- */

export function MachacaStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const [ti, setTi] = useState(0);
  const [phase, setPhase] = useState<'PASS' | 'COUNT' | 'RUN' | 'DONE'>('PASS');
  const [countNum, setCountNum] = useState(3);
  const [taps, setTaps] = useState(0);
  const [pct, setPct] = useState(100);
  const [overheat, setOverheat] = useState(false);
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));

  const tapsRef = useRef(0);
  const overheatRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const decayTimerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (decayTimerRef.current) window.clearInterval(decayTimerRef.current);
  };
  useEffect(() => clearTimer, []);

  useEffect(() => {
    if (phase === 'RUN' && overheat) setBg('#991b1b');
    else setBg(PLAYER_STAGE_COLORS[ti % PLAYER_STAGE_COLORS.length]);
  }, [phase, overheat, ti, setBg]);

  const startCountdown = useCallback(() => {
    clearTimer();
    setOverheat(false);
    overheatRef.current = false;
    setPhase('COUNT');
    setCountNum(3);
    tone(500, 0.1);
    let c = 3;
    const iv = window.setInterval(() => {
      c--;
      if (c > 0) {
        setCountNum(c);
        tone(500, 0.1);
      } else {
        window.clearInterval(iv);
        setTaps(0);
        tapsRef.current = 0;
        setPct(100);
        setPhase('RUN');
        const startAt = Date.now();
        const endAt = startAt + 11000;

        decayTimerRef.current = window.setInterval(() => {
          if (tapsRef.current > 0) {
            tapsRef.current = Math.max(0, tapsRef.current - 1);
            setTaps(tapsRef.current);
          }
        }, 420);

        timerRef.current = window.setInterval(() => {
          const now = Date.now();
          const elapsed = now - startAt;
          const left = endAt - now;
          setPct(Math.max(0, left / 110));

          // Dos breves fases de sobrecalentamiento (3.2s-4.2s y 7.1s-8.1s)
          const isHot =
            (elapsed >= 3200 && elapsed <= 4200) || (elapsed >= 7100 && elapsed <= 8100);
          if (isHot !== overheatRef.current) {
            overheatRef.current = isHot;
            setOverheat(isHot);
            if (isHot) tone(190, 0.16, 'sawtooth', 0.1);
            else tone(680, 0.1, 'triangle', 0.08);
          }

          if (left <= 0) {
            clearTimer();
            overheatRef.current = false;
            setOverheat(false);
            tone(300, 0.45);
            const finalTaps = tapsRef.current;
            setScores((prev) => {
              const next = [...prev];
              next[ti] = finalTaps;
              return next;
            });
            setPhase('DONE');
          }
        }, 50);
      }
    }, 650);
    timerRef.current = iv;
  }, [ti]);

  const handleOk = useCallback(() => {
    if (phase === 'PASS') {
      tone(520, 0.1);
      startCountdown();
    } else if (phase === 'RUN') {
      if (overheatRef.current) {
        tapsRef.current = Math.max(0, tapsRef.current - 4);
        setTaps(tapsRef.current);
        tone(125, 0.22, 'sawtooth', 0.14);
      } else {
        tapsRef.current += 1;
        setTaps(tapsRef.current);
        tone(500 + (tapsRef.current % 10) * 40, 0.03, 'square', 0.05);
      }
    } else if (phase === 'DONE') {
      if (ti + 1 >= np) {
        const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => scores[b] - scores[a]);
        onFinish(
          isFnaf ? 'Recarga Linterna' : isAu ? 'Carga de Escudos' : 'Machaca OK',
          rank,
          rank.map(
            (p) =>
              `${scores[p]} ${
                isFnaf ? 'destellos vs Foxy' : isAu ? 'cargas de escudo' : 'puntos netos'
              }`,
          ),
          () => {
            setScores(Array(np).fill(0));
            setTi(0);
            setPhase('PASS');
          },
        );
      } else {
        setTi((i) => i + 1);
        setPhase('PASS');
      }
    }
  }, [phase, ti, np, scores, isFnaf, isAu, startCountdown, onFinish]);

  useEffect(() => {
    registerKeyHandler((k: RemoteKey) => {
      if (k === 'ok') handleOk();
    });
  }, [registerKeyHandler, handleOk]);

  if (phase === 'PASS') {
    return (
      <PassScreen
        playerName={players[ti].name}
        subtitle={
          isFnaf
            ? 'Alumbra a Foxy 11s: la pila decae sola y ¡NO pulses cuando se sobrecaliente (-4)!'
            : isAu
              ? 'Escudos 11s: la carga decae sola y ¡NO pulses en sobrecarga roja (-4)!'
              : 'Machaca OK 11s: la barra baja sola y ¡NO pulses durante ALERTA ROJA (-4)!'
        }
        onReady={handleOk}
      />
    );
  }

  if (phase === 'COUNT') {
    return (
      <div className="stage-c">
        <div className="stage-giant tabular-nums">{countNum}</div>
      </div>
    );
  }

  if (phase === 'DONE') {
    return (
      <div className="stage-c cursor-pointer" onClick={handleOk}>
        <div className="stage-big">
          {taps} {isFnaf ? 'destellos' : isAu ? 'cargas' : 'puntos netos'}
        </div>
        <div className="stage-sub">{players[ti].name}</div>
        <div className="stage-hint">OK: continuar</div>
      </div>
    );
  }

  return (
    <div className="stage-c cursor-pointer" onClick={handleOk}>
      <div className="stage-sub">
        {players[ti].name} ·{' '}
        {overheat
          ? '🔥 ¡SOBRECALENTAMIENTO — NO PULSES (-4)!'
          : isFnaf
            ? '🔦 ¡ALUMBRA A FOXY!'
            : isAu
              ? '🛡️ ¡CARGA ESCUDOS!'
              : '¡DALE RÁPIDO!'}
      </div>
      <div className="stage-giant tabular-nums">{taps}</div>
      <div className="stage-barw">
        <div
          className="stage-barf"
          style={{width: `${pct}%`, background: overheat ? '#ef4444' : '#ffffff'}}
        />
      </div>
      <div className="stage-hint">
        {overheat ? '¡SUELTA EL BOTÓN 1 SEGUNDO!' : 'Pulsa OK rápido antes de que decaiga'}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 6. PUNTERÍA (4 TIROS + ZONA MÓVIL ESTRECHA + VELOCIDAD EXTREMA + RELOJ)    */
/* -------------------------------------------------------------------------- */

const SHOT_WIDTHS = [11, 8.5, 6.5, 5];

export function PunteriaStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const TOTAL_SHOTS = 4;

  const [ti, setTi] = useState(0);
  const [shotNum, setShotNum] = useState(0);
  const [phase, setPhase] = useState<'PASS' | 'AIM' | 'HIT' | 'PLAYER_DONE'>('PASS');
  const [x, setX] = useState(0);
  const [zoneLeft, setZoneLeft] = useState(44);
  const [zoneWidth, setZoneWidth] = useState(11);
  const [lastPts, setLastPts] = useState(0);
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));

  const xRef = useRef(0);
  const dirRef = useRef(1);
  const zoneLeftRef = useRef(44);
  const zoneWidthRef = useRef(11);
  const rafRef = useRef<number | null>(null);
  const shotTimeoutRef = useRef<number | null>(null);

  const stopAnim = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (shotTimeoutRef.current) window.clearTimeout(shotTimeoutRef.current);
  };
  useEffect(() => stopAnim, []);

  useEffect(() => {
    setBg(PLAYER_STAGE_COLORS[ti % PLAYER_STAGE_COLORS.length]);
  }, [ti, setBg]);

  const startShot = useCallback((n: number, playerIdx: number) => {
    stopAnim();
    setShotNum(n);
    const w = SHOT_WIDTHS[n] ?? 5;
    const zl = Math.round(18 + Math.random() * (68 - w));
    zoneLeftRef.current = zl;
    zoneWidthRef.current = w;
    setZoneLeft(zl);
    setZoneWidth(w);

    xRef.current = 0;
    dirRef.current = 1;
    setX(0);
    setPhase('AIM');
    const speed = 1.75 + n * 0.72;
    const step = () => {
      let next = xRef.current + dirRef.current * speed;
      if (next >= 100) {
        next = 100;
        dirRef.current = -1;
      } else if (next <= 0) {
        next = 0;
        dirRef.current = 1;
      }
      xRef.current = next;
      setX(next);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    shotTimeoutRef.current = window.setTimeout(() => {
      stopAnim();
      tone(130, 0.3, 'sawtooth');
      setLastPts(0);
      setPhase('HIT');
      window.setTimeout(() => {
        if (n + 1 >= TOTAL_SHOTS) {
          setPhase('PLAYER_DONE');
        } else {
          startShot(n + 1, playerIdx);
        }
      }, 750);
    }, 4500);
  }, []);

  const handleOk = useCallback(() => {
    if (phase === 'PASS') {
      tone(520, 0.1);
      startShot(0, ti);
    } else if (phase === 'AIM') {
      stopAnim();
      const center = zoneLeftRef.current + zoneWidthRef.current / 2;
      const dist = Math.abs(xRef.current - center);
      const inside = xRef.current >= zoneLeftRef.current && xRef.current <= zoneLeftRef.current + zoneWidthRef.current;
      const pts = inside
        ? Math.max(55, Math.round(100 - (dist / (zoneWidthRef.current / 2)) * 45))
        : Math.max(0, Math.round(40 - dist * 1.4));
      tone(inside ? 380 + pts * 5 : 160, 0.25);
      setLastPts(pts);
      const nextScores = [...scores];
      nextScores[ti] += pts;
      setScores(nextScores);
      setPhase('HIT');
      window.setTimeout(() => {
        if (shotNum + 1 >= TOTAL_SHOTS) {
          setPhase('PLAYER_DONE');
        } else {
          startShot(shotNum + 1, ti);
        }
      }, 750);
    } else if (phase === 'PLAYER_DONE') {
      if (ti + 1 >= np) {
        const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => scores[b] - scores[a]);
        onFinish(
          isFnaf ? 'Puerta Blindada' : isAu ? 'Calibrar Distribuidor' : 'Puntería',
          rank,
          rank.map(
            (p) =>
              `${scores[p]} ${
                isFnaf ? 'pts de batería' : isAu ? 'pts de calibración' : 'puntos'
              }`,
          ),
          () => {
            setScores(Array(np).fill(0));
            setTi(0);
            setPhase('PASS');
          },
        );
      } else {
        setTi((i) => i + 1);
        setPhase('PASS');
      }
    }
  }, [phase, shotNum, ti, np, scores, isFnaf, isAu, startShot, onFinish]);

  useEffect(() => {
    registerKeyHandler((k: RemoteKey) => {
      if (k === 'ok') handleOk();
    });
  }, [registerKeyHandler, handleOk]);

  if (phase === 'PASS') {
    return (
      <PassScreen
        playerName={players[ti].name}
        subtitle={
          isFnaf
            ? '4 bloqueos: la zona verde cambia de sitio y se encoge al 5% (máx 4.5s por tiro)'
            : isAu
              ? 'Electricidad: 4 calibraciones veloces con zona móvil estrecha'
              : '4 disparos rápidos: la zona verde cambia de lugar y se encoge'
        }
        onReady={handleOk}
      />
    );
  }

  if (phase === 'HIT') {
    return (
      <div className="stage-c">
        <div className="stage-giant tabular-nums">+{lastPts}</div>
      </div>
    );
  }

  if (phase === 'PLAYER_DONE') {
    return (
      <div className="stage-c cursor-pointer" onClick={handleOk}>
        <div className="stage-big">
          {scores[ti]} {isFnaf ? 'pts de energía' : isAu ? 'pts de potencia' : 'puntos'}
        </div>
        <div className="stage-sub">{players[ti].name}</div>
        <div className="stage-hint">OK: continuar</div>
      </div>
    );
  }

  return (
    <div className="stage-c cursor-pointer" onClick={handleOk}>
      <div className="stage-sub">
        {players[ti].name} ·{' '}
        {isFnaf
          ? `🛡️ bloqueo ${shotNum + 1}/${TOTAL_SHOTS}`
          : isAu
            ? `⚙️ calibración ${shotNum + 1}/${TOTAL_SHOTS}`
            : `disparo ${shotNum + 1}/${TOTAL_SHOTS}`}{' '}
        · Ancho {zoneWidth}%
      </div>
      <div className="stage-track">
        <div className="stage-zone" style={{left: `${zoneLeft}%`, width: `${zoneWidth}%`}} />
        <div className="stage-mk" style={{left: `${x}%`}} />
      </div>
      <div className="stage-hint">
        {isFnaf
          ? 'OK: clavar seguro justo en la zona verde'
          : isAu
            ? 'OK: fijar distribuidor antes de 4.5 s'
            : 'OK: detener en la zona verde (antes de 4.5 s)'}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 7. RELOJ CIEGO (META VARIABLE + OCULTA EN 0.80 s + PITIDO DISTRACTOR)      */
/* -------------------------------------------------------------------------- */

const BLIND_TARGETS = [5.5, 6.25, 7.0, 7.75];

export function RelojCiegoStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;

  const [ti, setTi] = useState(0);
  const [targetSec, setTargetSec] = useState(
    () => BLIND_TARGETS[Math.floor(Math.random() * BLIND_TARGETS.length)],
  );
  const [phase, setPhase] = useState<'PASS' | 'RUN' | 'RESULT'>('PASS');
  const [liveSec, setLiveSec] = useState(0);
  const [finalSec, setFinalSec] = useState(0);
  const [diffs, setDiffs] = useState<number[]>(() => Array(np).fill(99));
  const [recorded, setRecorded] = useState<number[]>(() => Array(np).fill(0));
  const [targetsUsed, setTargetsUsed] = useState<number[]>(() => Array(np).fill(6.25));

  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const decoyRef = useRef<number | null>(null);

  const stopRaf = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (decoyRef.current) window.clearTimeout(decoyRef.current);
  };
  useEffect(() => stopRaf, []);

  useEffect(() => {
    setBg(PLAYER_STAGE_COLORS[ti % PLAYER_STAGE_COLORS.length]);
  }, [ti, setBg]);

  const startClock = useCallback(() => {
    stopRaf();
    startRef.current = performance.now();
    setPhase('RUN');
    decoyRef.current = window.setTimeout(() => {
      tone(370, 0.08, 'triangle', 0.08);
      window.setTimeout(() => tone(510, 0.08, 'triangle', 0.08), 180);
    }, 2200 + Math.random() * 1400);

    const tick = () => {
      setLiveSec((performance.now() - startRef.current) / 1000);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const handleOk = useCallback(() => {
    if (phase === 'PASS') {
      tone(520, 0.1);
      startClock();
    } else if (phase === 'RUN') {
      stopRaf();
      const sec = Number(((performance.now() - startRef.current) / 1000).toFixed(2));
      const diff = Number(Math.abs(sec - targetSec).toFixed(2));
      tone(diff < 0.3 ? 784 : 440, 0.25);
      setFinalSec(sec);
      setRecorded((prev) => {
        const n = [...prev];
        n[ti] = sec;
        return n;
      });
      setTargetsUsed((prev) => {
        const n = [...prev];
        n[ti] = targetSec;
        return n;
      });
      setDiffs((prev) => {
        const n = [...prev];
        n[ti] = diff;
        return n;
      });
      setPhase('RESULT');
    } else {
      if (ti + 1 >= np) {
        const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => diffs[a] - diffs[b]);
        onFinish(
          isFnaf ? 'Turno 6:00 AM' : isAu ? 'Salto Hiperespacial' : 'Reloj ciego',
          rank,
          rank.map(
            (p) => `${recorded[p].toFixed(2)}s / meta ${targetsUsed[p].toFixed(2)}s (±${diffs[p].toFixed(2)})`,
          ),
          () => {
            setDiffs(Array(np).fill(99));
            setRecorded(Array(np).fill(0));
            setTi(0);
            setTargetSec(BLIND_TARGETS[Math.floor(Math.random() * BLIND_TARGETS.length)]);
            setPhase('PASS');
          },
        );
      } else {
        setTi((i) => i + 1);
        setTargetSec(BLIND_TARGETS[Math.floor(Math.random() * BLIND_TARGETS.length)]);
        setPhase('PASS');
      }
    }
  }, [phase, ti, np, targetSec, diffs, recorded, targetsUsed, isFnaf, isAu, startClock, onFinish]);

  useEffect(() => {
    registerKeyHandler((k: RemoteKey) => {
      if (k === 'ok') handleOk();
    });
  }, [registerKeyHandler, handleOk]);

  if (phase === 'PASS') {
    return (
      <PassScreen
        playerName={players[ti].name}
        subtitle={
          isFnaf
            ? `6:00 AM en ${targetSec.toFixed(2)} s · ¡Se oculta a los 0.80 s y habrá ruidos!`
            : isAu
              ? `Navegación: detén el salto en ${targetSec.toFixed(2)} s (se oculta en 0.80 s)`
              : `Detén el reloj oculto en ${targetSec.toFixed(2)} s (desaparece a los 0.80 s)`
        }
        onReady={handleOk}
      />
    );
  }

  if (phase === 'RESULT') {
    return (
      <div className="stage-c cursor-pointer" onClick={handleOk}>
        <div className="stage-big tabular-nums">{finalSec.toFixed(2)} s</div>
        <div className="stage-sub">
          Meta: {targetSec.toFixed(2)} s · Diferencia: ±{Math.abs(finalSec - targetSec).toFixed(2)} s
        </div>
        <div className="stage-hint">OK: continuar</div>
      </div>
    );
  }

  return (
    <div className="stage-c cursor-pointer" onClick={handleOk}>
      <div className="stage-sub">
        {players[ti].name} ·{' '}
        {isFnaf
          ? `🕰️ 1% batería · meta ${targetSec.toFixed(2)} s`
          : isAu
            ? `🧭 Navegación · meta ${targetSec.toFixed(2)} s`
            : `meta ${targetSec.toFixed(2)} s`}
      </div>
      <div className="stage-giant tabular-nums">
        {liveSec < 0.8 ? liveSec.toFixed(2) : isFnaf ? '5:?? AM' : '?.??'}
      </div>
      <div className="stage-hint">
        {isFnaf
          ? 'OK: sonar campana de las 6:00 AM'
          : isAu
            ? 'OK: estabilizar rumbo espacial'
            : 'OK: detener en el segundo exacto'}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 8. MEMORIA EMOJI (4×4 = 16 CARTAS + RACHA COMBO + RELOJ DE 10 s)           */
/* -------------------------------------------------------------------------- */

const MEM_EMOJIS = ['🐶', '🍕', '🚀', '🌟', '🎈', '🍦', '👾', '💎'];
const FNAF_MEM_EMOJIS = ['🐻', '🐰', '🐥', '🦊', '🍕', '🧁', '🔦', '🎭'];
const AU_MEM_EMOJIS = ['🛸', '🛰️', '☄️', '⚛️', '🪪', '🧬', '🔌', '🚨'];

function createMemoryDeck(themeMode: StageGameProps['themeMode']) {
  const pool =
    themeMode === 'fnaf' ? FNAF_MEM_EMOJIS : themeMode === 'amongus' ? AU_MEM_EMOJIS : MEM_EMOJIS;
  return [...pool, ...pool]
    .map((emoji, idx) => ({emoji, id: idx, sort: Math.random()}))
    .sort((a, b) => a.sort - b.sort)
    .map((item, idx) => ({id: idx, emoji: item.emoji}));
}

export function MemoriaStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const TOTAL_CARDS = 16;

  const [deck, setDeck] = useState(() => createMemoryDeck(themeMode));
  const [matched, setMatched] = useState<boolean[]>(() => Array(TOTAL_CARDS).fill(false));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [cursor, setCursor] = useState(0);
  const [ti, setTi] = useState(0);
  const [streak, setStreak] = useState(0);
  const [turnLeft, setTurnLeft] = useState(10);
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));
  const [locked, setLocked] = useState(false);

  const lockTimerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (lockTimerRef.current) window.clearTimeout(lockTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setBg(PLAYER_STAGE_COLORS[ti % PLAYER_STAGE_COLORS.length]);
  }, [ti, setBg]);

  // Reloj de turno de 10 s
  useEffect(() => {
    if (locked || matched.every(Boolean)) return;
    let rem = 10;
    setTurnLeft(10);
    const iv = window.setInterval(() => {
      rem -= 1;
      setTurnLeft(Math.max(0, rem));
      if (rem <= 0) {
        window.clearInterval(iv);
        tone(200, 0.16, 'sawtooth');
        setFlipped([]);
        setStreak(0);
        setTi((t) => (t + 1) % np);
      }
    }, 1000);
    return () => window.clearInterval(iv);
  }, [ti, locked, matched, np]);

  const flipCard = useCallback(
    (idx: number) => {
      if (locked || matched[idx] || flipped.includes(idx)) return;
      tone(520, 0.06);
      const nextFlipped = [...flipped, idx];
      setFlipped(nextFlipped);

      if (nextFlipped.length === 2) {
        const [a, b] = nextFlipped;
        if (deck[a].emoji === deck[b].emoji) {
          tone(784 + streak * 60, 0.2);
          const gain = 1 + streak;
          const nextMatched = [...matched];
          nextMatched[a] = true;
          nextMatched[b] = true;
          const nextScores = [...scores];
          nextScores[ti] += gain;

          setMatched(nextMatched);
          setScores(nextScores);
          setStreak((s) => s + 1);
          setFlipped([]);

          if (nextMatched.every(Boolean)) {
            lockTimerRef.current = window.setTimeout(() => {
              const rank = Array.from({length: np}, (_, i) => i).sort(
                (x, y) => nextScores[y] - nextScores[x],
              );
              onFinish(
                isFnaf ? 'Cámaras Fazbear' : isAu ? 'Monitor Skeld' : 'Memoria Emoji',
                rank,
                rank.map((p) => `${nextScores[p]} pts (con rachas)`),
                () => {
                  setDeck(createMemoryDeck(themeMode));
                  setMatched(Array(TOTAL_CARDS).fill(false));
                  setFlipped([]);
                  setCursor(0);
                  setTi(0);
                  setStreak(0);
                  setScores(Array(np).fill(0));
                  setLocked(false);
                },
              );
            }, 550);
          }
        } else {
          setLocked(true);
          tone(220, 0.16, 'sawtooth');
          lockTimerRef.current = window.setTimeout(() => {
            setFlipped([]);
            setStreak(0);
            setTi((t) => (t + 1) % np);
            setLocked(false);
          }, 700);
        }
      }
    },
    [locked, matched, flipped, deck, scores, ti, np, streak, isFnaf, isAu, themeMode, onFinish],
  );

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (locked) return;
      if (k === 'right') {
        setCursor((c) => (c + 1) % TOTAL_CARDS);
        playControlClick();
      } else if (k === 'left') {
        setCursor((c) => (c + TOTAL_CARDS - 1) % TOTAL_CARDS);
        playControlClick();
      } else if (k === 'down') {
        setCursor((c) => (c + 4) % TOTAL_CARDS);
        playControlClick();
      } else if (k === 'up') {
        setCursor((c) => (c + TOTAL_CARDS - 4) % TOTAL_CARDS);
        playControlClick();
      } else if (k === 'ok') {
        flipCard(cursor);
      }
    },
    [locked, cursor, flipCard],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  return (
    <div className="stage-c">
      <div className="stage-sub" style={{marginTop: 0}}>
        {isFnaf ? '📹 ' : isAu ? '🛰️ ' : ''}Turno de {players[ti].name} · {scores[ti]} pts
        {streak > 0 ? ` (🔥 racha ×${streak + 1})` : ''} · ⏱️ {turnLeft}s
      </div>
      <div className="stage-mem-grid">
        {deck.map((card, i) => {
          const isOpen = matched[i] || flipped.includes(i);
          return (
            <div
              key={card.id}
              onClick={() => {
                setCursor(i);
                flipCard(i);
              }}
              className={`stage-mem-card ${cursor === i ? 'sel' : ''} ${
                matched[i] ? 'matched' : ''
              }`}
            >
              {isOpen ? card.emoji : isFnaf ? '📹' : isAu ? '📡' : '❓'}
            </div>
          );
        })}
      </div>
      <div className="stage-hint">
        ▲▼◀▶ mover · OK {isFnaf ? 'revisar monitor' : isAu ? 'escanear módulo' : 'destapar carta'} (16
        cartas · 10 s por turno)
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 10. SEMÁFORO LOCO (AMAGOS AMARILLOS + ROJO ESTRICTO -22%)                  */
/* -------------------------------------------------------------------------- */

export function SemaforoStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const [ti, setTi] = useState(0);
  const [phase, setPhase] = useState<'PASS' | 'RUN' | 'DONE'>('PASS');
  const [light, setLight] = useState<'GREEN' | 'YELLOW' | 'RED'>('GREEN');
  const [progress, setProgress] = useState(0);
  const [timeLeftPct, setTimeLeftPct] = useState(100);
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));
  const [penaltyFlash, setPenaltyFlash] = useState(false);

  const lightRef = useRef<'GREEN' | 'YELLOW' | 'RED'>('GREEN');
  const redAtRef = useRef(0);
  const progressRef = useRef(0);
  const runningRef = useRef(false);
  const toggleTimerRef = useRef<number | null>(null);
  const tickTimerRef = useRef<number | null>(null);

  const clearTimers = () => {
    runningRef.current = false;
    if (toggleTimerRef.current) window.clearTimeout(toggleTimerRef.current);
    if (tickTimerRef.current) window.clearInterval(tickTimerRef.current);
  };
  useEffect(() => clearTimers, []);

  useEffect(() => {
    if (phase === 'RUN') {
      setBg(light === 'GREEN' ? '#15803d' : light === 'YELLOW' ? '#a16207' : '#b91c1c');
    } else {
      setBg(PLAYER_STAGE_COLORS[ti % PLAYER_STAGE_COLORS.length]);
    }
  }, [phase, light, ti, setBg]);

  const finishTurn = useCallback(
    (finalProgress: number) => {
      clearTimers();
      setScores((prev) => {
        const next = [...prev];
        next[ti] = finalProgress;
        return next;
      });
      tone(784, 0.25);
      setPhase('DONE');
    },
    [ti],
  );

  const startRun = useCallback(() => {
    clearTimers();
    progressRef.current = 0;
    lightRef.current = 'GREEN';
    runningRef.current = true;
    setProgress(0);
    setLight('GREEN');
    setTimeLeftPct(100);
    setPenaltyFlash(false);
    setPhase('RUN');

    const t0 = Date.now();
    const DUR = 11000;

    const scheduleLightSwitch = () => {
      if (!runningRef.current) return;
      let delay = 700 + Math.random() * 1100;
      if (lightRef.current === 'YELLOW') delay = 260 + Math.random() * 280;
      else if (lightRef.current === 'RED') delay = 750 + Math.random() * 850;

      toggleTimerRef.current = window.setTimeout(() => {
        if (!runningRef.current) return;
        let nextLight: 'GREEN' | 'YELLOW' | 'RED';
        if (lightRef.current === 'GREEN') {
          nextLight = 'YELLOW';
          tone(480, 0.08, 'triangle', 0.1);
        } else if (lightRef.current === 'YELLOW') {
          // 70% pasa a ROJO, 30% vuelve a VERDE para engañar
          nextLight = Math.random() < 0.7 ? 'RED' : 'GREEN';
          if (nextLight === 'RED') {
            redAtRef.current = performance.now();
            tone(210, 0.15, 'square', 0.12);
          } else {
            tone(680, 0.09, 'triangle', 0.1);
          }
        } else {
          nextLight = 'GREEN';
          tone(680, 0.1, 'triangle', 0.12);
        }
        lightRef.current = nextLight;
        setLight(nextLight);
        scheduleLightSwitch();
      }, delay);
    };
    scheduleLightSwitch();

    tickTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - t0;
      const pct = Math.max(0, 100 - (elapsed / DUR) * 100);
      setTimeLeftPct(pct);
      if (elapsed >= DUR) {
        finishTurn(progressRef.current);
      }
    }, 50);
  }, [finishTurn]);

  const handleOk = useCallback(() => {
    if (phase === 'PASS') {
      tone(520, 0.1);
      startRun();
    } else if (phase === 'RUN' && runningRef.current) {
      if (lightRef.current === 'GREEN' || lightRef.current === 'YELLOW') {
        const nextP = Math.min(100, progressRef.current + 3);
        progressRef.current = nextP;
        setProgress(nextP);
        setPenaltyFlash(false);
        tone(500 + nextP * 3, 0.04);
        if (nextP >= 100) {
          finishTurn(100);
        }
      } else {
        if (performance.now() - redAtRef.current > 210) {
          const nextP = Math.max(0, progressRef.current - 22);
          progressRef.current = nextP;
          setProgress(nextP);
          setPenaltyFlash(true);
          tone(130, 0.25, 'sawtooth', 0.2);
        }
      }
    } else if (phase === 'DONE') {
      if (ti + 1 >= np) {
        const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => scores[b] - scores[a]);
        onFinish(
          isFnaf ? 'Luz de Foxy' : isAu ? 'Luz de Cafetería' : 'Semáforo loco',
          rank,
          rank.map(
            (p) =>
              `${scores[p]}% ${
                isFnaf ? 'del pasillo' : isAu ? 'de la nave' : 'de meta'
              }`,
          ),
          () => {
            setScores(Array(np).fill(0));
            setTi(0);
            setPhase('PASS');
          },
        );
      } else {
        setTi((i) => i + 1);
        setPhase('PASS');
      }
    }
  }, [phase, ti, np, scores, isFnaf, isAu, startRun, finishTurn, onFinish]);

  useEffect(() => {
    registerKeyHandler((k: RemoteKey) => {
      if (k === 'ok') handleOk();
    });
  }, [registerKeyHandler, handleOk]);

  if (phase === 'PASS') {
    return (
      <PassScreen
        playerName={players[ti].name}
        subtitle={
          isFnaf
            ? 'Avanza con luz verde; ¡OJO con el aviso AMARILLO y no te muevas en ROJO (-22%)!'
            : isAu
              ? 'Avanza por Cafetería; frena si falla la luz (-22% de castigo en rojo)'
              : 'Llega al 100% en 11s: el aviso AMARILLO avisa rojo (o engaña). ¡Moverse en rojo = -22%!'
        }
        onReady={handleOk}
      />
    );
  }

  if (phase === 'DONE') {
    return (
      <div className="stage-c cursor-pointer" onClick={handleOk}>
        <div className="stage-giant tabular-nums">{scores[ti]}%</div>
        <div className="stage-sub">{players[ti].name}</div>
        <div className="stage-hint">OK: continuar</div>
      </div>
    );
  }

  return (
    <div className="stage-c cursor-pointer" onClick={handleOk}>
      <div className="stage-sub">
        {players[ti].name} · {progress}%
      </div>
      <div className="stage-big" style={{fontSize: isFnaf || isAu ? '8.2vh' : '11vh'}}>
        {light === 'YELLOW'
          ? '🟡 ¡ATENTO! ¿CAMBIA A ROJO…?'
          : isFnaf
            ? light === 'GREEN'
              ? '🟢 ¡CORRE! (FOXY ESCONDIDO)'
              : '🦊 ¡QUIETO, FOXY TE VE!'
            : isAu
              ? light === 'GREEN'
                ? '🟢 ¡AVANZA! (LUCES ESTABLES)'
                : '🚨 ¡SABOTAJE! ¡QUIETO!'
              : light === 'GREEN'
                ? '🟢 ¡CORRE!'
                : '🔴 ¡QUIETO!'}
      </div>
      <div className="stage-sub" style={{opacity: 0.9}}>
        {penaltyFlash
          ? '¡Te pillaron en ROJO! -22%'
          : 'Meta: 100% (+3% por toque)'}
      </div>
      <div className="stage-barw">
        <div className="stage-barf" style={{width: `${progress}%`, background: '#4ade80'}} />
      </div>
      <div className="stage-barw" style={{height: '1.4vh', marginTop: '1.5vh'}}>
        <div className="stage-barf" style={{width: `${timeLeftPct}%`, opacity: 0.7}} />
      </div>
      <div className="stage-hint">OK rápido en verde · frena al instante en rojo</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 11. COLOR TRAMPOSO (5 RONDAS + 6 COLORES + CAMBIO DE REGLA + 2.7 s)        */
/* -------------------------------------------------------------------------- */

const STROOP_COLORS = [
  {name: 'ROJO', hex: '#ef4444'},
  {name: 'AZUL', hex: '#3b82f6'},
  {name: 'VERDE', hex: '#22c55e'},
  {name: 'AMARILLO', hex: '#facc15'},
  {name: 'MORADO', hex: '#a855f7'},
  {name: 'CIAN', hex: '#06b6d4'},
];

function makeStroopPuzzle() {
  const wordIdx = Math.floor(Math.random() * STROOP_COLORS.length);
  let inkIdx = Math.floor(Math.random() * STROOP_COLORS.length);
  while (inkIdx === wordIdx) {
    inkIdx = Math.floor(Math.random() * STROOP_COLORS.length);
  }
  const askWord = Math.random() < 0.38; // 38% pide la palabra en lugar de la tinta
  return {
    word: STROOP_COLORS[wordIdx].name,
    inkHex: STROOP_COLORS[inkIdx].hex,
    askWord,
    correctIndex: askWord ? wordIdx : inkIdx,
  };
}

export function ColoresStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const ROUNDS = 5;
  const total = ROUNDS * np;

  const [qi, setQi] = useState(0);
  const [phase, setPhase] = useState<'PASS' | 'PLAY' | 'RES'>('PASS');
  const [puzzle, setPuzzle] = useState(() => makeStroopPuzzle());
  const [sel, setSel] = useState(0);
  const [timePct, setTimePct] = useState(100);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));

  const pi = qi % np;
  const rnd = Math.floor(qi / np) + 1;
  const timerRef = useRef<number | null>(null);

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  useEffect(() => stopTimer, []);

  useEffect(() => {
    if (phase === 'RES') setBg(wasCorrect ? '#16a34a' : '#7f1d1d');
    else setBg('#0f172a');
  }, [phase, wasCorrect, setBg]);

  const startQuestion = useCallback(() => {
    stopTimer();
    setPuzzle(makeStroopPuzzle());
    setSel(0);
    setTimedOut(false);
    setTimePct(100);
    setPhase('PLAY');
    tone(520, 0.08);

    const LIMIT_MS = 2900;
    const endAt = performance.now() + LIMIT_MS;
    timerRef.current = window.setInterval(() => {
      const left = Math.max(0, endAt - performance.now());
      setTimePct((left / LIMIT_MS) * 100);
      if (left <= 0) {
        stopTimer();
        tone(140, 0.35, 'sawtooth');
        setWasCorrect(false);
        setTimedOut(true);
        setPhase('RES');
      }
    }, 45);
  }, []);

  const confirmOpt = useCallback(
    (idx: number) => {
      stopTimer();
      const ok = idx === puzzle.correctIndex;
      setWasCorrect(ok);
      setTimedOut(false);
      if (ok) {
        tone(784, 0.2);
        setScores((prev) => {
          const n = [...prev];
          n[pi] += 1;
          return n;
        });
      } else {
        tone(150, 0.3, 'sawtooth');
      }
      setPhase('RES');
    },
    [puzzle, pi],
  );

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'PASS' && k === 'ok') {
        startQuestion();
      } else if (phase === 'PLAY') {
        if (k === 'right') {
          setSel((s) => (s + 1) % 6);
          playControlClick();
        } else if (k === 'left') {
          setSel((s) => (s + 5) % 6);
          playControlClick();
        } else if (k === 'up' || k === 'down') {
          setSel((s) => (s + 3) % 6);
          playControlClick();
        } else if (k === 'ok') {
          confirmOpt(sel);
        }
      } else if (phase === 'RES' && k === 'ok') {
        const nextQi = qi + 1;
        if (nextQi >= total) {
          const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => scores[b] - scores[a]);
          onFinish(
            isFnaf ? 'Cables de Fazbear' : isAu ? 'Cables de Admin' : 'Color tramposo',
            rank,
            rank.map(
              (p) =>
                `${scores[p]}/${ROUNDS} ${
                  isFnaf || isAu ? 'reparaciones' : 'aciertos'
                }`,
            ),
            () => {
              setScores(Array(np).fill(0));
              setQi(0);
              setPhase('PASS');
            },
          );
        } else {
          setQi(nextQi);
          setPhase('PASS');
        }
      }
    },
    [phase, sel, qi, total, np, scores, isFnaf, isAu, startQuestion, confirmOpt, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'PASS') {
    return (
      <PassScreen
        playerName={players[pi].name}
        subtitle={
          isFnaf
            ? `Ronda ${rnd}/${ROUNDS} · ¡Lee la regla arriba (TINTA o PALABRA) antes de 2.9s!`
            : isAu
              ? `Ronda ${rnd}/${ROUNDS} · ¡6 cables y regla cambiante (COLOR vs ETIQUETA) en 2.9s!`
              : `Ronda ${rnd}/${ROUNDS} · ¡6 colores, regla sorpresa (TINTA o PALABRA) y reloj de 2.9s!`
        }
        onReady={() => handleKey('ok')}
      />
    );
  }

  if (phase === 'RES') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-big">
          {timedOut
            ? `⏰ ¡Muy lento! Era ${STROOP_COLORS[puzzle.correctIndex].name}`
            : wasCorrect
              ? isFnaf || isAu
                ? '¡Energía restaurada!'
                : '¡Exacto!'
              : `❌ Era ${STROOP_COLORS[puzzle.correctIndex].name}`}
        </div>
        <div className="stage-hint">OK: continuar</div>
      </div>
    );
  }

  return (
    <div className="stage-c">
      <div className="stage-sub" style={{marginTop: 0}}>
        {players[pi].name} · Ronda {rnd}/{ROUNDS} ·{' '}
        <span className={puzzle.askWord ? 'text-amber-300 font-black' : 'text-cyan-300 font-black'}>
          {puzzle.askWord ? '📝 DI LA PALABRA ESCRITA' : '🎨 DI EL COLOR DE LA TINTA'}
        </span>
      </div>
      <div className="stage-barw" style={{height: '1.3vh', marginTop: '1vh', width: '48vw'}}>
        <div
          className="stage-barf"
          style={{width: `${timePct}%`, background: timePct < 35 ? '#ef4444' : '#38bdf8'}}
        />
      </div>
      <div
        className="stage-big"
        style={{
          fontSize: '12vh',
          color: puzzle.inkHex,
          textShadow: '0 0.6vh 2vh rgba(0,0,0,0.8)',
          marginTop: '1.5vh',
        }}
      >
        {puzzle.word}
      </div>
      <div className="stage-opt-grid cols-3">
        {STROOP_COLORS.map((c, i) => (
          <div
            key={c.name}
            onClick={() => confirmOpt(i)}
            className={`stage-opt ${sel === i ? 'sel' : ''}`}
            style={{padding: '1.8vh 1vw'}}
          >
            {isFnaf || isAu ? `CABLE ${c.name}` : c.name}
          </div>
        ))}
      </div>
      <div className="stage-hint">▲▼◀▶ elegir antes de 2.9s · OK confirma</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 12. DUELO DE FLECHAS (16 PASOS + FLECHAS ROJAS INVERSAS + +2s CASTIGO)     */
/* -------------------------------------------------------------------------- */

const ARROWS: {dir: 'up' | 'down' | 'left' | 'right'; opp: 'up' | 'down' | 'left' | 'right'; symbol: string}[] = [
  {dir: 'up', opp: 'down', symbol: '⬆️'},
  {dir: 'down', opp: 'up', symbol: '⬇️'},
  {dir: 'left', opp: 'right', symbol: '⬅️'},
  {dir: 'right', opp: 'left', symbol: '➡️'},
];

const FNAF_CAMS = [
  'CAM 1A · Escenario',
  'CAM 1B · Comedor',
  'CAM 1C · Pirate Cove',
  'CAM 2A · Pasillo Oeste',
  'CAM 2B · Esquina Oeste',
  'CAM 3 · Armario',
  'CAM 4A · Pasillo Este',
  'CAM 4B · Esquina Este',
  'CAM 5 · Bastidores',
  'CAM 6 · Cocina',
  'CAM 7 · Baños',
  'Ducto Izquierdo',
  'Ducto Derecho',
  'Oficina Oeste',
  'Oficina Este',
  'Control Central',
];

const AU_ROOMS = [
  'Cafetería',
  'Armería',
  'Navegación',
  'O2 · Filtro',
  'Escudos',
  'Comunicaciones',
  'Almacén',
  'Electricidad',
  'Motor Superior',
  'Motor Inferior',
  'Reactor',
  'Seguridad',
  'Ala Médica',
  'Admin',
  'Pasillo Sur',
  'Escotilla Central',
];

function buildArrowSeq(count: number) {
  return Array.from({length: count}, (_, i) => {
    const base = ARROWS[Math.floor(Math.random() * 4)];
    const inverted = i >= 2 && Math.random() < 0.35;
    return {
      symbol: base.symbol,
      expectedDir: inverted ? base.opp : base.dir,
      inverted,
    };
  });
}

export function FlechasStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const TOTAL = 16;

  const [ti, setTi] = useState(0);
  const [phase, setPhase] = useState<'PASS' | 'RUN' | 'DONE'>('PASS');
  const [seq, setSeq] = useState(() => buildArrowSeq(TOTAL));
  const [step, setStep] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [timesMs, setTimesMs] = useState<number[]>(() => Array(np).fill(99999));

  const startRef = useRef(0);

  useEffect(() => {
    if (phase === 'RUN' && seq[step]?.inverted) setBg('#450a0a');
    else setBg(PLAYER_STAGE_COLORS[ti % PLAYER_STAGE_COLORS.length]);
  }, [phase, seq, step, ti, setBg]);

  const startTurn = useCallback(() => {
    setSeq(buildArrowSeq(TOTAL));
    setStep(0);
    setMistakes(0);
    startRef.current = performance.now();
    setPhase('RUN');
    tone(520, 0.08);
  }, []);

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'PASS' && k === 'ok') {
        startTurn();
      } else if (phase === 'RUN') {
        if (k === 'up' || k === 'down' || k === 'left' || k === 'right') {
          const target = seq[step];
          if (target && k === target.expectedDir) {
            tone(440 + step * 35, 0.07);
            if (step + 1 >= TOTAL) {
              const totalMs = Math.round(performance.now() - startRef.current) + mistakes * 2000;
              setTimesMs((prev) => {
                const next = [...prev];
                next[ti] = totalMs;
                return next;
              });
              tone(784, 0.25);
              setPhase('DONE');
            } else {
              setStep((s) => s + 1);
            }
          } else {
            setMistakes((m) => m + 1);
            tone(140, 0.2, 'sawtooth');
          }
        }
      } else if (phase === 'DONE' && k === 'ok') {
        if (ti + 1 >= np) {
          const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => timesMs[a] - timesMs[b]);
          onFinish(
            isFnaf ? 'Ronda de Cámaras' : isAu ? 'Ruta por Skeld' : 'Duelo de flechas',
            rank,
            rank.map((p) => `${(timesMs[p] / 1000).toFixed(2)} s`),
            () => {
              setTimesMs(Array(np).fill(99999));
              setTi(0);
              setPhase('PASS');
            },
          );
        } else {
          setTi((i) => i + 1);
          setPhase('PASS');
        }
      }
    },
    [phase, seq, step, mistakes, ti, np, timesMs, isFnaf, isAu, startTurn, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'PASS') {
    return (
      <PassScreen
        playerName={players[ti].name}
        subtitle={
          isFnaf
            ? '16 cámaras veloces: si la pantalla se pone ROJA (INVERSA), ¡pulsa la dirección OPUESTA!'
            : isAu
              ? '16 salas por The Skeld: si ves SABOTAJE ROJO, ¡pulsa la flecha OPUESTA!'
              : '16 flechas veloces: si aparece en ROJO (INVERSA), ¡pulsa la flecha contraria!'
        }
        onReady={() => handleKey('ok')}
      />
    );
  }

  if (phase === 'DONE') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-giant tabular-nums">{(timesMs[ti] / 1000).toFixed(2)} s</div>
        <div className="stage-sub">
          {players[ti].name} · {mistakes} errores (+{mistakes * 2} s)
        </div>
        <div className="stage-hint">OK: continuar</div>
      </div>
    );
  }

  const cur = seq[step];

  return (
    <div className="stage-c">
      <div className="stage-sub">
        {players[ti].name} ·{' '}
        {isFnaf ? FNAF_CAMS[step] : isAu ? AU_ROOMS[step] : `Paso ${step + 1} / ${TOTAL}`}
      </div>
      {cur?.inverted && (
        <div className="mt-2 inline-block rounded-xl border-2 border-red-400 bg-red-600/80 px-4 py-1 text-[3vh] font-black text-white">
          🔄 ¡INVERSA! PULSA LA OPUESTA
        </div>
      )}
      <div className="text-[20vh] leading-none my-3">{cur?.symbol}</div>
      <div className="stage-sub" style={{opacity: 0.85}}>
        {step + 1}/{TOTAL} · Errores: {mistakes} (+2 s c/u)
      </div>
      <div className="stage-hint">
        {cur?.inverted ? '¡Pulsa la dirección CONTRARIA ▲▼◀▶!' : 'Pulsa la flecha normal ▲▼◀▶'}
      </div>
    </div>
  );
}
