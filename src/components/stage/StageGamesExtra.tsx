import {useCallback, useEffect, useRef, useState} from 'react';
import {
  RemoteKey,
  StageGameProps,
  playControlClick,
  tone,
} from '../../utils/stageAudio';
import {PassScreen} from './StageGamesArcade';
import {
  BalloonBoySvg,
  FnafCamActor,
  FnafCamId,
  FnafCamSceneSvg,
} from './FnafExtrasArtwork';
import puppetBoxClosedImg from '../../assets/images/fnaf_puppet_box_closed_1795317909635.jpg';
import puppetBoxPeekingImg from '../../assets/images/fnaf_puppet_box_peeking_1795317909553.jpg';
import puppetJumpscareImg from '../../assets/images/fnaf_puppet_jumpscare_1795317908729.jpg';

/* -------------------------------------------------------------------------- */
/* EXCLUSIVO FNAF 1: TURNO EN LA OFICINA (2 PUERTAS, LUCES Y ATAQUES DOBLES)  */
/* -------------------------------------------------------------------------- */

export function FnafOficinaStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
}: StageGameProps) {
  const np = players.length;
  const TOTAL_TICKS = 84; // 84 * 210ms = ~17.6s
  const [pi, setPi] = useState(0);
  const [phase, setPhase] = useState<'PASS' | 'PLAY' | 'TURN_END'>('PASS');
  const [hour, setHour] = useState(0); // 0 = 12 AM .. 6 = 6 AM
  const [battery, setBattery] = useState(100);
  const [leftDoor, setLeftDoor] = useState(false);
  const [rightDoor, setRightDoor] = useState(false);
  const [lightOn, setLightOn] = useState(false);
  const [leftThreat, setLeftThreat] = useState<'none' | 'bonnie' | 'blocked'>('none');
  const [rightThreat, setRightThreat] = useState<'none' | 'chica' | 'blocked'>('none');
  const [freddySurge, setFreddySurge] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Vigila los pasillos y ahorra energía');
  const [wonShift, setWonShift] = useState(false);
  const [blocks, setBlocks] = useState(0);
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));

  const leftDoorRef = useRef(false);
  const rightDoorRef = useRef(false);
  const lightRef = useRef(false);
  const batteryRef = useRef(100);
  const tickRef = useRef(0);
  const blocksRef = useRef(0);
  const leftTimerRef = useRef(0);
  const rightTimerRef = useRef(0);
  const leftSideRef = useRef<'none' | 'bonnie' | 'blocked'>('none');
  const rightSideRef = useRef<'none' | 'chica' | 'blocked'>('none');
  const ivRef = useRef<number | null>(null);

  const stopLoop = () => {
    if (ivRef.current) {
      window.clearInterval(ivRef.current);
      ivRef.current = null;
    }
  };
  useEffect(() => stopLoop, []);

  useEffect(() => {
    if (phase === 'TURN_END') setBg(wonShift ? '#16a34a' : '#7f1d1d');
    else setBg('#09080c');
  }, [phase, wonShift, setBg]);

  const finishTurn = useCallback(
    (survived: boolean, reason: string) => {
      stopLoop();
      setWonShift(survived);
      setStatusMsg(reason);
      if (survived) {
        tone(523, 0.14);
        window.setTimeout(() => tone(784, 0.35), 160);
      } else {
        tone(110, 0.55, 'sawtooth', 0.22);
      }
      const reachedHour = Math.min(6, Math.floor((tickRef.current * 6) / TOTAL_TICKS));
      const pts =
        reachedHour * 2 +
        blocksRef.current * 3 +
        (survived ? 8 : 0) +
        (batteryRef.current > 0 && survived ? Math.floor(batteryRef.current / 8) : 0);
      setScores((prev) => {
        const n = [...prev];
        n[pi] = pts;
        return n;
      });
      setPhase('TURN_END');
    },
    [pi],
  );

  const startShift = useCallback(() => {
    stopLoop();
    leftDoorRef.current = false;
    rightDoorRef.current = false;
    lightRef.current = false;
    batteryRef.current = 100;
    tickRef.current = 0;
    blocksRef.current = 0;
    leftTimerRef.current = 0;
    rightTimerRef.current = 0;
    leftSideRef.current = 'none';
    rightSideRef.current = 'none';

    setHour(0);
    setBattery(100);
    setLeftDoor(false);
    setRightDoor(false);
    setLightOn(false);
    setLeftThreat('none');
    setRightThreat('none');
    setFreddySurge(false);
    setBlocks(0);
    setWonShift(false);
    setStatusMsg('12:00 AM · ◀ Puerta Izq · ▶ Puerta Der · ▲ Luz');
    setPhase('PLAY');
    tone(520, 0.1);

    ivRef.current = window.setInterval(() => {
      const nextTick = tickRef.current + 1;
      tickRef.current = nextTick;
      const curHour = Math.min(6, Math.floor((nextTick * 6) / TOTAL_TICKS));
      setHour(curHour);

      // Consumo exigente (puertas dobles + luz agotan rápido)
      const usage =
        1 + (leftDoorRef.current ? 1 : 0) + (rightDoorRef.current ? 1 : 0) + (lightRef.current ? 1 : 0);
      const drain = usage === 1 ? 0.68 : usage === 2 ? 1.72 : usage === 3 ? 2.85 : 4.1;
      let extraDrain = 0;

      // Desde las 3 AM Freddy da risas y provoca picos de consumo si tienes luz encendida
      if (nextTick >= 42 && nextTick % 16 === 0 && Math.random() < 0.65) {
        setFreddySurge(true);
        extraDrain = lightRef.current ? 3.5 : 1.5;
        setStatusMsg('🐻 Risa de Freddy… ¡apaga la luz o te drena batería!');
        tone(145, 0.14, 'sawtooth', 0.09);
      } else if (nextTick % 16 === 5) {
        setFreddySurge(false);
      }

      const nextBat = Math.max(0, batteryRef.current - drain - extraDrain);
      batteryRef.current = nextBat;
      setBattery(Math.ceil(nextBat));

      if (nextBat <= 0) {
        finishTurn(false, '🔋 0% de batería · Freddy tocó Toreador March');
        return;
      }

      if (nextTick >= TOTAL_TICKS) {
        finishTurn(true, '🕰️ ¡6:00 AM! Sobreviviste la noche más dura');
        return;
      }

      const dualAllowed = nextTick >= 20; // Desde ~1:30 AM atacan ambos pasillos a la vez
      const aggression = 0.42 + curHour * 0.06;

      // Lógica de Bonnie (Izquierda)
      if (leftSideRef.current === 'bonnie') {
        if (leftDoorRef.current) {
          leftSideRef.current = 'blocked';
          leftTimerRef.current = 4;
          blocksRef.current += 1;
          setBlocks(blocksRef.current);
          setLeftThreat('blocked');
          setStatusMsg('🛡️ ¡Puerta Izq bloqueó a Bonnie! Abre rápido para ahorrar');
          tone(740, 0.12);
        } else {
          leftTimerRef.current -= 1;
          if (leftTimerRef.current <= 0) {
            finishTurn(false, '🐰 ¡Bonnie entró por el Pasillo Oeste!');
            return;
          }
        }
      } else if (leftSideRef.current === 'blocked') {
        leftTimerRef.current -= 1;
        if (leftTimerRef.current <= 0) {
          leftSideRef.current = 'none';
          setLeftThreat('none');
        }
      } else if (
        nextTick % 6 === 0 &&
        Math.random() < aggression &&
        (dualAllowed || rightSideRef.current !== 'chica')
      ) {
        leftSideRef.current = 'bonnie';
        leftTimerRef.current = Math.max(8, 10 - Math.floor(curHour / 3)); // ~1.7-2.1s
        setLeftThreat('bonnie');
        setStatusMsg('👣 Pasos rápidos a la IZQUIERDA… ¡revisa ▲ o cierra ◀!');
        tone(220, 0.08, 'triangle', 0.08);
      }

      // Lógica de Chica (Derecha)
      if (rightSideRef.current === 'chica') {
        if (rightDoorRef.current) {
          rightSideRef.current = 'blocked';
          rightTimerRef.current = 4;
          blocksRef.current += 1;
          setBlocks(blocksRef.current);
          setRightThreat('blocked');
          setStatusMsg('🛡️ ¡Puerta Der bloqueó a Chica! Abre rápido para ahorrar');
          tone(740, 0.12);
        } else {
          rightTimerRef.current -= 1;
          if (rightTimerRef.current <= 0) {
            finishTurn(false, '🐥 ¡Chica entró desde la cocina por la derecha!');
            return;
          }
        }
      } else if (rightSideRef.current === 'blocked') {
        rightTimerRef.current -= 1;
        if (rightTimerRef.current <= 0) {
          rightSideRef.current = 'none';
          setRightThreat('none');
        }
      } else if (
        nextTick % 7 === 0 &&
        Math.random() < aggression &&
        (dualAllowed || leftSideRef.current !== 'bonnie')
      ) {
        rightSideRef.current = 'chica';
        rightTimerRef.current = Math.max(8, 10 - Math.floor(curHour / 3));
        setRightThreat('chica');
        setStatusMsg('🍳 Cacerolas sonando a la DERECHA… ¡revisa ▲ o cierra ▶!');
        tone(265, 0.08, 'triangle', 0.08);
      }
    }, 210);
  }, [finishTurn]);

  const toggleLeft = useCallback(() => {
    const next = !leftDoorRef.current;
    leftDoorRef.current = next;
    setLeftDoor(next);
    tone(next ? 180 : 300, 0.09, 'square', 0.09);
  }, []);

  const toggleRight = useCallback(() => {
    const next = !rightDoorRef.current;
    rightDoorRef.current = next;
    setRightDoor(next);
    tone(next ? 180 : 300, 0.09, 'square', 0.09);
  }, []);

  const toggleLight = useCallback(() => {
    const next = !lightRef.current;
    lightRef.current = next;
    setLightOn(next);
    playControlClick();
  }, []);

  const openBoth = useCallback(() => {
    leftDoorRef.current = false;
    rightDoorRef.current = false;
    lightRef.current = false;
    setLeftDoor(false);
    setRightDoor(false);
    setLightOn(false);
    playControlClick();
  }, []);

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'PASS' && k === 'ok') {
        startShift();
      } else if (phase === 'PLAY') {
        if (k === 'left') toggleLeft();
        else if (k === 'right') toggleRight();
        else if (k === 'up') toggleLight();
        else if (k === 'down' || k === 'ok') openBoth();
      } else if (phase === 'TURN_END' && k === 'ok') {
        if (pi + 1 < np) {
          setPi((p) => p + 1);
          setPhase('PASS');
        } else {
          const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => scores[b] - scores[a]);
          onFinish(
            'Turno en la Oficina',
            rank,
            rank.map((p) => `${scores[p]} pts`),
            () => {
              setScores(Array(np).fill(0));
              setPi(0);
              setPhase('PASS');
            },
          );
        }
      }
    },
    [phase, pi, np, scores, startShift, toggleLeft, toggleRight, toggleLight, openBoth, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'PASS') {
    return (
      <PassScreen
        playerName={players[pi].name}
        subtitle="FNAF 1 (Difícil) · Bonnie y Chica atacan a la vez desde 1 AM · Raciona batería hasta 6:00 AM"
        onReady={startShift}
      />
    );
  }

  if (phase === 'TURN_END') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="text-[11vh] leading-none">{wonShift ? '🕰️' : '🐻'}</div>
        <div className="stage-big" style={{fontSize: '7.5vh', marginTop: '1vh'}}>
          {statusMsg}
        </div>
        <div className="stage-sub">
          {players[pi].name}: {scores[pi]} pts · Bloqueos: {blocks} · Batería restante: {battery}%
        </div>
        <div className="stage-hint">OK: continuar</div>
      </div>
    );
  }

  const usageBars = 1 + (leftDoor ? 1 : 0) + (rightDoor ? 1 : 0) + (lightOn ? 1 : 0);
  const clockLabel = hour === 0 ? '12:00 AM' : `${hour}:00 AM`;

  return (
    <div className="stage-c">
      <div className="flex justify-between items-center max-w-[74vw] mx-auto text-[2.6vh] font-bold">
        <span className={battery <= 25 ? 'text-red-400' : 'text-amber-300'}>
          🔋 {battery}% · Uso {'⚡'.repeat(usageBars)} {freddySurge ? '🐻!' : ''}
        </span>
        <span className="text-white">{players[pi].name}</span>
        <span className="text-emerald-300">🕰️ {clockLabel} / 6:00 AM</span>
      </div>

      <div className="stage-sub text-amber-200" style={{fontSize: '2.7vh', marginTop: '1.3vh'}}>
        {statusMsg}
      </div>

      <div className="grid grid-cols-3 gap-[1.8vw] max-w-[74vw] mx-auto mt-[2.6vh] items-stretch">
        <button
          type="button"
          onClick={toggleLeft}
          className={`stage-opt flex flex-col items-center justify-center py-[3vh] ${
            leftDoor ? 'ok' : leftThreat === 'bonnie' && lightOn ? 'bad' : ''
          }`}
        >
          <div className="text-[7vh] leading-none">
            {leftDoor
              ? '🚧'
              : lightOn && leftThreat === 'bonnie'
                ? '🐰'
                : leftThreat === 'blocked'
                  ? '🛡️'
                  : lightOn
                    ? '💡'
                    : '🚪'}
          </div>
          <div className="mt-2">◀ PUERTA IZQ</div>
          <div className="text-[1.9vh] opacity-80">
            {leftDoor
              ? 'CERRADA'
              : lightOn && leftThreat === 'bonnie'
                ? '¡BONNIE AQUÍ!'
                : lightOn
                  ? 'Pasillo vacío'
                  : 'Abierta'}
          </div>
        </button>

        <button
          type="button"
          onClick={toggleLight}
          className={`stage-opt flex flex-col items-center justify-center py-[3vh] ${
            lightOn ? 'sel' : ''
          }`}
        >
          <div className="text-[7vh] leading-none">{lightOn ? '🔦' : '🖥️'}</div>
          <div className="mt-2">▲ LUZ PASILLOS</div>
          <div className="text-[1.9vh] opacity-80">
            {lightOn ? 'Encendida' : 'Apagada'} · Bloqueos: {blocks}
          </div>
        </button>

        <button
          type="button"
          onClick={toggleRight}
          className={`stage-opt flex flex-col items-center justify-center py-[3vh] ${
            rightDoor ? 'ok' : rightThreat === 'chica' && lightOn ? 'bad' : ''
          }`}
        >
          <div className="text-[7vh] leading-none">
            {rightDoor
              ? '🚧'
              : lightOn && rightThreat === 'chica'
                ? '🐥'
                : rightThreat === 'blocked'
                  ? '🛡️'
                  : lightOn
                    ? '💡'
                    : '🚪'}
          </div>
          <div className="mt-2">PUERTA DER ▶</div>
          <div className="text-[1.9vh] opacity-80">
            {rightDoor
              ? 'CERRADA'
              : lightOn && rightThreat === 'chica'
                ? '¡CHICA AQUÍ!'
                : lightOn
                  ? 'Pasillo vacío'
                  : 'Abierta'}
          </div>
        </button>
      </div>

      <div className="stage-hint">
        ◀ Puerta Izq · ▶ Puerta Der · ▲ Luz pasillos · ▼/OK Abrir todo para ahorrar batería
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* EXCLUSIVO FNAF 2: VIGILA PIRATE COVE (CAM 1C & CAM 2A · FOXY)              */
/* -------------------------------------------------------------------------- */

export function FnafPirateCoveStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
}: StageGameProps) {
  const np = players.length;
  const TOTAL_TICKS = 78; // 78 * 220ms = ~17.2s
  const [pi, setPi] = useState(0);
  const [phase, setPhase] = useState<'PASS' | 'PLAY' | 'TURN_END'>('PASS');
  const [camOpen, setCamOpen] = useState(true);
  const [doorClosed, setDoorClosed] = useState(false);
  const [foxyStage, setFoxyStage] = useState<0 | 1 | 2 | 3>(0); // 0=cortina, 1=asoma, 2=fuera, 3=corriendo CAM 2A
  const [battery, setBattery] = useState(100);
  const [stopped, setStopped] = useState(0);
  const [endReason, setEndReason] = useState('');
  const [survived, setSurvived] = useState(false);
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));

  const camRef = useRef(true);
  const doorRef = useRef(false);
  const stageRef = useRef<0 | 1 | 2 | 3>(0);
  const batRef = useRef(100);
  const stoppedRef = useRef(0);
  const ticksRef = useRef(0);
  const sprintTicksRef = useRef(0);
  const ivRef = useRef<number | null>(null);

  const stopLoop = () => {
    if (ivRef.current) {
      window.clearInterval(ivRef.current);
      ivRef.current = null;
    }
  };
  useEffect(() => stopLoop, []);

  useEffect(() => {
    if (phase === 'TURN_END') setBg(survived ? '#16a34a' : '#7f1d1d');
    else setBg('#09080c');
  }, [phase, survived, setBg]);

  const finishTurn = useCallback(
    (ok: boolean, msg: string) => {
      stopLoop();
      setSurvived(ok);
      setEndReason(msg);
      if (ok) tone(784, 0.3);
      else tone(120, 0.55, 'sawtooth', 0.22);
      const pts =
        stoppedRef.current * 4 +
        (ok ? 8 + Math.floor(batRef.current / 10) : Math.floor(ticksRef.current / 10));
      setScores((prev) => {
        const n = [...prev];
        n[pi] = pts;
        return n;
      });
      setPhase('TURN_END');
    },
    [pi],
  );

  const startPlay = useCallback(() => {
    stopLoop();
    camRef.current = true;
    doorRef.current = false;
    stageRef.current = 0;
    batRef.current = 100;
    stoppedRef.current = 0;
    ticksRef.current = 0;
    sprintTicksRef.current = 0;
    setCamOpen(true);
    setDoorClosed(false);
    setFoxyStage(0);
    setBattery(100);
    setStopped(0);
    setSurvived(false);
    setPhase('PLAY');
    tone(520, 0.1);

    ivRef.current = window.setInterval(() => {
      ticksRef.current += 1;
      const drain = 0.62 + (camRef.current ? 1.05 : 0) + (doorRef.current ? 1.7 : 0);
      batRef.current = Math.max(0, batRef.current - drain);
      setBattery(Math.ceil(batRef.current));

      if (batRef.current <= 0) {
        finishTurn(false, '🔋 Se agotó la batería vigilando Pirate Cove');
        return;
      }

      if (ticksRef.current >= TOTAL_TICKS) {
        finishTurn(true, '🦊 ¡Dominaste Pirate Cove hasta las 6:00 AM!');
        return;
      }

      if (stageRef.current === 3) {
        if (doorRef.current) {
          tone(480, 0.12);
          stoppedRef.current += 1;
          setStopped(stoppedRef.current);
          stageRef.current = 0;
          setFoxyStage(0);
          sprintTicksRef.current = 0;
        } else {
          sprintTicksRef.current -= 1;
          if (sprintTicksRef.current <= 0) {
            finishTurn(false, '🦊 ¡Foxy golpeó la puerta abierta de tu oficina!');
            return;
          }
        }
      } else {
        const fastPhase = ticksRef.current >= 40;
        const stepCheck = fastPhase && !camRef.current ? 2 : 3;
        const advanceChance = camRef.current ? 0.16 : 0.56;
        if (ticksRef.current % stepCheck === 0 && Math.random() < advanceChance) {
          const nextSt = (stageRef.current + 1) as 0 | 1 | 2 | 3;
          stageRef.current = nextSt;
          setFoxyStage(nextSt);
          if (nextSt === 3) {
            sprintTicksRef.current = 5; // 1.1s para cerrar la puerta oeste!
            tone(190, 0.18, 'sawtooth', 0.14);
          } else {
            tone(320 + nextSt * 60, 0.06, 'triangle', 0.06);
          }
        }
      }
    }, 220);
  }, [finishTurn]);

  const toggleCam = useCallback(() => {
    const next = !camRef.current;
    camRef.current = next;
    setCamOpen(next);
    playControlClick();
  }, []);

  const toggleDoor = useCallback(() => {
    const next = !doorRef.current;
    doorRef.current = next;
    setDoorClosed(next);
    tone(next ? 170 : 310, 0.1, 'square', 0.09);
  }, []);

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'PASS' && k === 'ok') {
        startPlay();
      } else if (phase === 'PLAY') {
        if (k === 'up' || k === 'down') toggleCam();
        else if (k === 'ok' || k === 'left' || k === 'right') toggleDoor();
      } else if (phase === 'TURN_END' && k === 'ok') {
        if (pi + 1 < np) {
          setPi((p) => p + 1);
          setPhase('PASS');
        } else {
          const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => scores[b] - scores[a]);
          onFinish(
            'Vigila Pirate Cove',
            rank,
            rank.map((p) => `${scores[p]} pts`),
            () => {
              setScores(Array(np).fill(0));
              setPi(0);
              setPhase('PASS');
            },
          );
        }
      }
    },
    [phase, pi, np, scores, startPlay, toggleCam, toggleDoor, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'PASS') {
    return (
      <PassScreen
        playerName={players[pi].name}
        subtitle="CAM 1C (Difícil) · Foxy corre más rápido: solo 1.1 s para cerrar puerta al salir por CAM 2A"
        onReady={startPlay}
      />
    );
  }

  if (phase === 'TURN_END') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="text-[11vh] leading-none">{survived ? '🦊' : '💥'}</div>
        <div className="stage-big" style={{fontSize: '7.5vh', marginTop: '1vh'}}>
          {endReason}
        </div>
        <div className="stage-sub">
          {players[pi].name}: {scores[pi]} pts · Foxy detenido {stopped} veces · Batería {battery}%
        </div>
        <div className="stage-hint">OK: continuar</div>
      </div>
    );
  }

  const stageTexts = [
    '🎭 Fase 1: Cortinas cerradas (“Sorry! Out of Order”)',
    '👀 Fase 2: Foxy se asoma por la cortina…',
    '🦊 Fase 3: ¡Foxy salió de Pirate Cove!',
    '💨 ¡ALERTA CAM 2A: FOXY VIENE CORRIENDO! ¡CIERRA LA PUERTA YA!',
  ];

  return (
    <div className="stage-c">
      <div className="flex justify-between items-center max-w-[70vw] mx-auto text-[2.6vh] font-bold">
        <span className={battery <= 25 ? 'text-red-400' : 'text-amber-300'}>🔋 Batería: {battery}%</span>
        <span>{players[pi].name}</span>
        <span className="text-emerald-300">🛡️ Bloqueos: {stopped}</span>
      </div>

      <div
        className={`max-w-[70vw] mx-auto mt-[3vh] p-[3.2vh] rounded-2xl border-2 ${
          foxyStage === 3
            ? 'border-red-500 bg-red-950/60'
            : camOpen
              ? 'border-amber-400/60 bg-slate-900/80'
              : 'border-slate-700 bg-slate-950/80'
        }`}
      >
        <div className="text-[2.2vh] font-mono text-amber-300">
          {camOpen ? '📹 CAM 1C — PIRATE COVE (EN VIVO)' : '🖥️ MONITOR APAGADO (AHORRANDO BATERÍA)'}
        </div>
        <div className="text-[9.5vh] leading-none my-[2vh]">
          {!camOpen
            ? foxyStage === 3
              ? '💨🦊'
              : '🌑'
            : ['🎭', '👀', '🦊', '💨🦊'][foxyStage]}
        </div>
        <div className="text-[3vh] font-bold">
          {camOpen || foxyStage === 3 ? stageTexts[foxyStage] : 'Monitor apagado — no ves a Foxy'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[2vw] max-w-[60vw] mx-auto mt-[3vh]">
        <button type="button" onClick={toggleCam} className={`stage-opt ${camOpen ? 'sel' : ''}`}>
          ▲▼ {camOpen ? 'APAGAR CAM 1C' : 'ENCENDER CAM 1C'}
        </button>
        <button type="button" onClick={toggleDoor} className={`stage-opt ${doorClosed ? 'ok' : ''}`}>
          OK {doorClosed ? '🚧 PUERTA CERRADA (ABRIR)' : '🚪 CERRAR PUERTA OESTE'}
        </button>
      </div>

      <div className="stage-hint">▲▼ encender/apagar CAM 1C · OK cerrar/abrir Puerta Oeste</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* EXCLUSIVO FNAF 3: NO DEJES SALIR A PUPPET DE SU CAJA (AUDIO REAL MP3)      */
/* -------------------------------------------------------------------------- */

const PUPPET_SONG_MP3 = '/assets/aistudio/puppet_808dc018.mp3';

export function FnafPuppetStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
}: StageGameProps) {
  const np = players.length;
  const MAX_STOPS = 8;
  const WINDS_NEEDED = 4;

  const [pi, setPi] = useState(0);
  const [phase, setPhase] = useState<'PASS' | 'PLAYING' | 'STOPPED' | 'JUMPSCARE' | 'TURN_WIN'>(
    'PASS',
  );
  const [roundStop, setRoundStop] = useState(0);
  const [windProgress, setWindProgress] = useState(0);
  const [timePct, setTimePct] = useState(100);
  const [prematureCount, setPrematureCount] = useState(0);
  const [waitHint, setWaitHint] = useState(false);
  const [canDismissScare, setCanDismissScare] = useState(false);
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const expireTimerRef = useRef<number | null>(null);
  const barIvRef = useRef<number | null>(null);
  const hintTimerRef = useRef<number | null>(null);
  const scareLockRef = useRef<number | null>(null);

  const roundRef = useRef(0);
  const windRef = useRef(0);
  const prematureRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    if (expireTimerRef.current) window.clearTimeout(expireTimerRef.current);
    if (barIvRef.current) window.clearInterval(barIvRef.current);
    if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current);
    if (scareLockRef.current) window.clearTimeout(scareLockRef.current);
    stopTimerRef.current = null;
    expireTimerRef.current = null;
    barIvRef.current = null;
    hintTimerRef.current = null;
    scareLockRef.current = null;
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  useEffect(() => {
    const audio = new Audio(PUPPET_SONG_MP3);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0.85;
    audioRef.current = audio;
    return () => {
      clearTimers();
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [clearTimers]);

  useEffect(() => {
    if (phase === 'JUMPSCARE') setBg('#7f1d1d');
    else if (phase === 'TURN_WIN') setBg('#16a34a');
    else if (phase === 'STOPPED') setBg('#451a03');
    else setBg('#09080f');
  }, [phase, setBg]);

  const triggerJumpscare = useCallback(() => {
    clearTimers();
    stopAudio();
    setCanDismissScare(false);
    setPhase('JUMPSCARE');
    tone(110, 0.6, 'sawtooth', 0.25);
    tone(165, 0.5, 'square', 0.2);
    window.setTimeout(() => tone(240, 0.4, 'sawtooth', 0.18), 90);

    const pts = roundRef.current * 2;
    setScores((prev) => {
      const n = [...prev];
      n[pi] = pts;
      return n;
    });

    scareLockRef.current = window.setTimeout(() => {
      setCanDismissScare(true);
    }, 650);
  }, [clearTimers, stopAudio, pi]);

  const scheduleNextStop = useCallback(() => {
    clearTimers();
    setWindProgress(0);
    windRef.current = 0;
    setTimePct(100);
    setWaitHint(false);
    setPhase('PLAYING');

    if (audioRef.current) {
      void audioRef.current.play().catch(() => {});
    }

    // Paradas más rápidas y erráticas (1.5s a 3.5s)
    const delayMs = 1500 + Math.floor(Math.random() * 2000);
    stopTimerRef.current = window.setTimeout(() => {
      stopAudio();
      tone(185, 0.09, 'triangle', 0.08);
      windRef.current = 0;
      setWindProgress(0);
      setTimePct(100);
      setPhase('STOPPED');

      // Ventana exigente: empieza en 1950ms y baja hasta 1050ms (-200ms si hubo amago prematuro)
      const penalty = prematureRef.current * 200;
      const windowMs = Math.max(1050, 1950 - roundRef.current * 125 - penalty);
      const t0 = performance.now();

      barIvRef.current = window.setInterval(() => {
        const elapsed = performance.now() - t0;
        const pct = Math.max(0, 100 - (elapsed / windowMs) * 100);
        setTimePct(pct);
      }, 35);

      expireTimerRef.current = window.setTimeout(() => {
        triggerJumpscare();
      }, windowMs);
    }, delayMs);
  }, [clearTimers, stopAudio, triggerJumpscare]);

  const startPlay = useCallback(() => {
    clearTimers();
    roundRef.current = 0;
    prematureRef.current = 0;
    setRoundStop(0);
    setPrematureCount(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    scheduleNextStop();
  }, [clearTimers, scheduleNextStop]);

  const handleWindPress = useCallback(() => {
    if (phase === 'PLAYING') {
      const nextPremature = prematureRef.current + 1;
      prematureRef.current = nextPremature;
      setPrematureCount(nextPremature);
      tone(160, 0.16, 'sawtooth', 0.14);
      if (nextPremature >= 2) {
        triggerJumpscare();
        return;
      }
      setWaitHint(true);
      if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current);
      hintTimerRef.current = window.setTimeout(() => setWaitHint(false), 1200);
      return;
    }

    if (phase !== 'STOPPED') return;

    playControlClick();
    const nextWind = windRef.current + 1;
    windRef.current = nextWind;
    setWindProgress(nextWind);
    tone(440 + nextWind * 110, 0.08, 'triangle', 0.1);

    if (nextWind >= WINDS_NEEDED) {
      clearTimers();
      const nextRound = roundRef.current + 1;
      roundRef.current = nextRound;
      setRoundStop(nextRound);

      if (nextRound >= MAX_STOPS) {
        stopAudio();
        const totalPts = MAX_STOPS * 2 + 6 - prematureRef.current * 2;
        setScores((prev) => {
          const n = [...prev];
          n[pi] = totalPts;
          return n;
        });
        tone(523, 0.14);
        window.setTimeout(() => tone(784, 0.32), 150);
        setPhase('TURN_WIN');
      } else {
        scheduleNextStop();
      }
    }
  }, [phase, pi, clearTimers, stopAudio, scheduleNextStop, triggerJumpscare]);

  const advanceTurn = useCallback(() => {
    clearTimers();
    stopAudio();
    if (pi + 1 < np) {
      setPi((p) => p + 1);
      setPhase('PASS');
    } else {
      const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => scores[b] - scores[a]);
      onFinish(
        '¡No dejes salir a Puppet!',
        rank,
        rank.map((p) => `${scores[p]} pts`),
        () => {
          setScores(Array(np).fill(0));
          setPi(0);
          setPhase('PASS');
        },
      );
    }
  }, [clearTimers, stopAudio, pi, np, scores, onFinish]);

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'PASS' && k === 'ok') {
        startPlay();
      } else if ((phase === 'PLAYING' || phase === 'STOPPED') && k === 'ok') {
        handleWindPress();
      } else if (phase === 'JUMPSCARE' && k === 'ok' && canDismissScare) {
        advanceTurn();
      } else if (phase === 'TURN_WIN' && k === 'ok') {
        advanceTurn();
      }
    },
    [phase, canDismissScare, startPlay, handleWindPress, advanceTurn],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'PASS') {
    return (
      <PassScreen
        playerName={players[pi].name}
        subtitle="Puppet (Difícil) · 8 paradas · Pulsa OK x4 cuando pare la canción · ¡2 toques antes = susto!"
        onReady={startPlay}
      />
    );
  }

  if (phase === 'JUMPSCARE') {
    return (
      <div
        className="stage-c cursor-pointer"
        onClick={() => {
          if (canDismissScare) advanceTurn();
        }}
      >
        <div className="mx-auto mb-[1.6vh] h-[40vh] w-[40vh] overflow-hidden rounded-[2.2vh] border-[0.55vh] border-red-500/85 bg-gradient-to-b from-red-950 via-neutral-950 to-black shadow-[0_0_5.5vh_rgba(239,68,68,0.65)] fnaf-jumpscare-pop">
          <img
            src={puppetJumpscareImg}
            alt="Puppet saliendo de su caja"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="stage-big" style={{fontSize: '7.5vh', marginTop: '0.5vh'}}>
          ¡PUPPET TE ASUSTÓ!
        </div>
        <div className="stage-sub">
          {players[pi].name} aguantó {roundStop}/{MAX_STOPS} paradas ({scores[pi]} pts)
        </div>
        <div className="stage-hint">{canDismissScare ? 'OK: continuar' : '¡Salió de la caja!'}</div>
      </div>
    );
  }

  if (phase === 'TURN_WIN') {
    return (
      <div className="stage-c cursor-pointer" onClick={advanceTurn}>
        <div className="mx-auto mb-[1.6vh] h-[34vh] w-[34vh] overflow-hidden rounded-[2vh] border-[0.45vh] border-emerald-400/80 bg-gradient-to-b from-purple-950 to-slate-950 shadow-[0_0_4vh_rgba(34,197,94,0.45)]">
          <img
            src={puppetBoxClosedImg}
            alt="Caja musical de Puppet cerrada"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="stage-big" style={{fontSize: '7.5vh', marginTop: '0.5vh'}}>
          ¡NO SALIÓ DE SU CAJA!
        </div>
        <div className="stage-sub">
          {players[pi].name} completó las {MAX_STOPS} cuerdas ({scores[pi]} pts)
        </div>
        <div className="stage-hint">OK: continuar</div>
      </div>
    );
  }

  const isStopped = phase === 'STOPPED';

  return (
    <div className="stage-c cursor-pointer" onClick={handleWindPress}>
      <div className="stage-sub">
        {players[pi].name} · Cuerdas: {roundStop}/{MAX_STOPS} ·{' '}
        <span className={prematureCount > 0 ? 'text-red-400 font-bold' : 'text-slate-300'}>
          Avisos: {prematureCount}/2
        </span>
      </div>

      <div className="my-[1.8vh] flex justify-center">
        <div
          className={`relative h-[34vh] w-[34vh] overflow-hidden rounded-[2vh] border-[0.45vh] bg-gradient-to-b from-purple-950 via-slate-950 to-black transition-transform duration-150 ${
            isStopped
              ? 'scale-105 border-amber-400 shadow-[0_0_4.5vh_rgba(245,158,11,0.55)]'
              : 'border-purple-400/45 shadow-[0_0_3vh_rgba(88,28,135,0.4)]'
          }`}
        >
          <img
            src={isStopped ? puppetBoxPeekingImg : puppetBoxClosedImg}
            alt={isStopped ? 'Puppet asomándose de la caja' : 'Caja musical de Puppet sonando'}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {isStopped ? (
        <>
          <div className="stage-big text-amber-300" style={{fontSize: 'clamp(1.6rem, 5.8vh, 3.6rem)'}}>
            ¡SE PARÓ LA CANCIÓN! ¡DALE CUERDA x4!
          </div>
          <div className="mt-[1.2vh] flex items-center justify-center gap-[1vw]">
            {Array.from({length: WINDS_NEEDED}, (_, i) => (
              <div
                key={`wind-${i}`}
                className={`h-[2.4vh] w-[5.2vw] rounded-[0.8vh] border-[0.25vh] transition-colors duration-100 ${
                  i < windProgress
                    ? 'border-amber-200 bg-amber-400 shadow-[0_0_1.4vh_rgba(251,191,36,0.65)]'
                    : 'border-white/25 bg-slate-900/80'
                }`}
              />
            ))}
            <span className="ml-[0.6vw] text-[3.4vh] font-extrabold text-white tabular-nums">
              {windProgress}/{WINDS_NEEDED}
            </span>
          </div>
          <div className="stage-barw" style={{marginTop: '2vh'}}>
            <div
              className="stage-barf"
              style={{
                width: `${timePct}%`,
                background: timePct < 35 ? '#ef4444' : '#fbbf24',
              }}
            />
          </div>
        </>
      ) : (
        <>
          <div className="stage-big" style={{fontSize: 'clamp(1.6rem, 5.6vh, 3.5rem)'}}>
            La caja está sonando…
          </div>
          <div className={`stage-sub ${waitHint ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
            {waitHint
              ? '⚠️ ¡AVISO 1/2! ¡NO PULSES ANTES DE TIEMPO!'
              : 'Escucha atento — un toque más antes de tiempo despierta a Puppet'}
          </div>
        </>
      )}

      <div className="stage-hint">
        {isStopped ? 'Pulsa OK 4 veces rápido antes de que se agote la barra' : 'Prohibido pulsar mientras suena'}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* EXCLUSIVO FNAF 4: SEÑUELO SPRINGTRAP (FNAF 3 · AUDIO LURE + REBOOT 2x)     */
/* -------------------------------------------------------------------------- */

const FNAF3_CAMS = ['CAM 05 (Lejos)', 'CAM 03 (Centro)', 'CAM 01 (Cerca)', '🚪 TU OFICINA'];

export function FnafSpringtrapStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
}: StageGameProps) {
  const np = players.length;
  const TOTAL_TICKS = 72;
  const [pi, setPi] = useState(0);
  const [phase, setPhase] = useState<'PASS' | 'PLAY' | 'TURN_END'>('PASS');
  const [springPos, setSpringPos] = useState(1);
  const [selCam, setSelCam] = useState(0);
  const [rebootTapsLeft, setRebootTapsLeft] = useState(0);
  const [lures, setLures] = useState(0);
  const [status, setStatus] = useState('Atrae a Springtrap hacia CAM 05 usando el audio');
  const [survived, setSurvived] = useState(false);
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));

  const posRef = useRef(1);
  const rebootTapsRef = useRef(0);
  const luresRef = useRef(0);
  const ticksRef = useRef(0);
  const ivRef = useRef<number | null>(null);

  const stopLoop = () => {
    if (ivRef.current) {
      window.clearInterval(ivRef.current);
      ivRef.current = null;
    }
  };
  useEffect(() => stopLoop, []);

  useEffect(() => {
    if (phase === 'TURN_END') setBg(survived ? '#16a34a' : '#7f1d1d');
    else setBg('#08100a');
  }, [phase, survived, setBg]);

  const finishTurn = useCallback(
    (ok: boolean, msg: string) => {
      stopLoop();
      setSurvived(ok);
      setStatus(msg);
      if (ok) tone(784, 0.3);
      else tone(120, 0.5, 'sawtooth', 0.22);
      const pts = luresRef.current * 2 + (ok ? 10 : Math.floor(ticksRef.current / 8));
      setScores((prev) => {
        const n = [...prev];
        n[pi] = pts;
        return n;
      });
      setPhase('TURN_END');
    },
    [pi],
  );

  const startPlay = useCallback(() => {
    stopLoop();
    posRef.current = 1;
    rebootTapsRef.current = 0;
    luresRef.current = 0;
    ticksRef.current = 0;
    setSpringPos(1);
    setSelCam(0);
    setRebootTapsLeft(0);
    setLures(0);
    setSurvived(false);
    setStatus('Elige una cámara atrás de él y pulsa OK (“¡Hola!”)');
    setPhase('PLAY');
    tone(520, 0.1);

    ivRef.current = window.setInterval(() => {
      ticksRef.current += 1;
      if (ticksRef.current >= TOTAL_TICKS) {
        finishTurn(true, '🐰 ¡Mantuviste a Springtrap lejos de Fazbear’s Fright!');
        return;
      }

      if (rebootTapsRef.current === 0 && ticksRef.current % 11 === 0 && Math.random() < 0.78) {
        const tapsNeeded = ticksRef.current >= 30 ? 2 : 1;
        rebootTapsRef.current = tapsNeeded;
        setRebootTapsLeft(tapsNeeded);
        setStatus(`⚠️ ERROR DE AUDIO · ¡Pulsa ▲ ${tapsNeeded}x para reiniciar!`);
        tone(170, 0.22, 'sawtooth', 0.12);
      }

      if (ticksRef.current % 5 === 0) {
        const nextP = posRef.current + 1;
        posRef.current = nextP;
        setSpringPos(nextP);
        if (nextP >= 3) {
          finishTurn(false, '🐰 ¡Springtrap entró a tu oficina en Fazbear’s Fright!');
        } else {
          tone(210, 0.09, 'triangle', 0.08);
        }
      }
    }, 235);
  }, [finishTurn]);

  const sendLure = useCallback(
    (camIdx: number) => {
      if (rebootTapsRef.current > 0) {
        setStatus(`❌ Audio caído · Pulsa ▲ (${rebootTapsRef.current} toque${rebootTapsRef.current > 1 ? 's' : ''})`);
        tone(140, 0.12, 'sawtooth');
        return;
      }
      if (camIdx < posRef.current) {
        posRef.current = Math.max(0, posRef.current - 1);
        setSpringPos(posRef.current);
        luresRef.current += 1;
        setLures(luresRef.current);
        setStatus('🎈 “¡Hola!” — Springtrap retrocedió hacia el audio');
        tone(680, 0.12, 'triangle');
      } else if (camIdx === posRef.current) {
        setStatus('⚠️ Está en esa misma cámara — ponlo en una más lejana atrás');
        tone(250, 0.1, 'square');
      } else {
        // Error grave: audio delante de él lo atrae hacia tu oficina
        const pulled = Math.min(3, posRef.current + 1);
        posRef.current = pulled;
        setSpringPos(pulled);
        tone(150, 0.18, 'sawtooth');
        if (pulled >= 3) {
          finishTurn(false, '💥 ¡Pusiste el audio delante de Springtrap y corrió a tu oficina!');
        } else {
          setStatus('💥 ¡Audio delante de él! ¡Lo atrajiste más cerca de ti!');
        }
      }
    },
    [finishTurn],
  );

  const rebootAudio = useCallback(() => {
    if (rebootTapsRef.current <= 0) return;
    const rem = rebootTapsRef.current - 1;
    rebootTapsRef.current = rem;
    setRebootTapsLeft(rem);
    if (rem === 0) {
      setStatus('🔄 Sistema de audio reiniciado');
      tone(820, 0.14);
    } else {
      setStatus('🔄 Reiniciando audio… ¡pulsa ▲ 1 vez más!');
      tone(560, 0.1);
    }
  }, []);

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'PASS' && k === 'ok') {
        startPlay();
      } else if (phase === 'PLAY') {
        if (k === 'left') {
          setSelCam((c) => (c + 2) % 3);
          playControlClick();
        } else if (k === 'right') {
          setSelCam((c) => (c + 1) % 3);
          playControlClick();
        } else if (k === 'ok') {
          sendLure(selCam);
        } else if (k === 'up' || k === 'down') {
          rebootAudio();
        }
      } else if (phase === 'TURN_END' && k === 'ok') {
        if (pi + 1 < np) {
          setPi((p) => p + 1);
          setPhase('PASS');
        } else {
          const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => scores[b] - scores[a]);
          onFinish(
            'Señuelo Springtrap',
            rank,
            rank.map((p) => `${scores[p]} pts`),
            () => {
              setScores(Array(np).fill(0));
              setPi(0);
              setPhase('PASS');
            },
          );
        }
      }
    },
    [phase, selCam, pi, np, scores, startPlay, sendLure, rebootAudio, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'PASS') {
    return (
      <PassScreen
        playerName={players[pi].name}
        subtitle="FNAF 3 (Difícil) · Audio delante de él lo atrae hacia ti · Reboot pide ▲x2"
        onReady={startPlay}
      />
    );
  }

  if (phase === 'TURN_END') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="text-[11vh] leading-none">{survived ? '🎈' : '🐰'}</div>
        <div className="stage-big" style={{fontSize: '7.5vh', marginTop: '1vh'}}>
          {status}
        </div>
        <div className="stage-sub">
          {players[pi].name}: {scores[pi]} pts · Señuelos efectivos: {lures}
        </div>
        <div className="stage-hint">OK: continuar</div>
      </div>
    );
  }

  return (
    <div className="stage-c">
      <div className="stage-sub">
        {players[pi].name} · Señuelos: {lures} ·{' '}
        <span className={rebootTapsLeft > 0 ? 'text-red-400 font-bold' : 'text-emerald-300'}>
          {rebootTapsLeft > 0 ? `⚠️ ERROR AUDIO (▲ x${rebootTapsLeft})` : '🔊 Audio OK'}
        </span>
      </div>
      <div className="stage-sub" style={{fontSize: '2.7vh', marginTop: '1vh'}}>
        {status}
      </div>

      <div className="grid grid-cols-4 gap-[1.2vw] max-w-[76vw] mx-auto mt-[3vh]">
        {FNAF3_CAMS.map((label, idx) => {
          const isSpring = springPos === idx;
          const isCam = idx < 3;
          const selected = isCam && selCam === idx;
          return (
            <button
              key={label}
              type="button"
              onClick={() => {
                if (isCam) {
                  setSelCam(idx);
                  sendLure(idx);
                }
              }}
              className={`stage-opt flex flex-col items-center py-[3vh] ${
                selected ? 'sel' : ''
              } ${isSpring ? 'border-emerald-400' : ''}`}
            >
              <div className="text-[7vh] leading-none">
                {isSpring ? '🐰' : isCam ? '📹' : '🚪'}
              </div>
              <div className="text-[2.2vh] mt-2">{label}</div>
              <div className="text-[1.7vh] opacity-80 mt-1">
                {isSpring ? '¡SPRINGTRAP AQUÍ!' : isCam ? 'OK: Señuelo 🎈' : 'No dejes que llegue'}
              </div>
            </button>
          );
        })}
      </div>

      {rebootTapsLeft > 0 && (
        <button type="button" onClick={rebootAudio} className="stage-opt bad mt-[2.5vh] px-8 py-2">
          ▲ REINICIAR AUDIO ({rebootTapsLeft} toque{rebootTapsLeft > 1 ? 's' : ''})
        </button>
      )}

      <div className="stage-hint">◀▶ elegir cámara · OK reproducir audio 🎈 · ▲ reiniciar si hay error</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* EXCLUSIVO FNAF 5: RESPIRACIÓN FNAF 4 (CONTRARRELOJ + PISTA QUE DESAPARECE) */
/* -------------------------------------------------------------------------- */

interface Fnaf4Wave {
  spot: 'Puerta Izquierda' | 'Armario Central' | 'Puerta Derecha';
  cueKind: 'breath' | 'steps';
  cueText: string;
}

export function FnafClosetStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
}: StageGameProps) {
  const np = players.length;
  const WAVES = 8;
  const [pi, setPi] = useState(0);
  const [phase, setPhase] = useState<'PASS' | 'PLAY' | 'FEEDBACK' | 'TURN_END'>('PASS');
  const [waveIdx, setWaveIdx] = useState(0);
  const [wave, setWave] = useState<Fnaf4Wave | null>(null);
  const [cueHidden, setCueHidden] = useState(false);
  const [timePct, setTimePct] = useState(100);
  const [waveScore, setWaveScore] = useState(0);
  const [lastOk, setLastOk] = useState(false);
  const [lastMsg, setLastMsg] = useState('');
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));
  const waveStartRef = useRef(0);
  const barIvRef = useRef<number | null>(null);
  const expireRef = useRef<number | null>(null);
  const hideRef = useRef<number | null>(null);

  const clearWaveTimers = useCallback(() => {
    if (barIvRef.current) window.clearInterval(barIvRef.current);
    if (expireRef.current) window.clearTimeout(expireRef.current);
    if (hideRef.current) window.clearTimeout(hideRef.current);
    barIvRef.current = null;
    expireRef.current = null;
    hideRef.current = null;
  }, []);

  useEffect(() => clearWaveTimers, [clearWaveTimers]);

  useEffect(() => {
    if (phase === 'FEEDBACK') setBg(lastOk ? '#16a34a' : '#7f1d1d');
    else setBg('#07060b');
  }, [phase, lastOk, setBg]);

  const nextWave = useCallback(
    (idx: number) => {
      clearWaveTimers();
      const spots: Fnaf4Wave['spot'][] = ['Puerta Izquierda', 'Armario Central', 'Puerta Derecha'];
      const spot = spots[Math.floor(Math.random() * spots.length)];
      const cueKind: 'breath' | 'steps' = Math.random() < 0.5 ? 'breath' : 'steps';
      const cueText =
        cueKind === 'breath'
          ? '🌬️ ¡RESPIRACIÓN PEGADA A LA PUERTA!'
          : '👣 ¡PASOS CORRIENDO EN LO PROFUNDO!';
      setWave({spot, cueKind, cueText});
      setCueHidden(false);
      setTimePct(100);
      waveStartRef.current = performance.now();
      setPhase('PLAY');
      tone(cueKind === 'breath' ? 140 : 420, 0.14, 'triangle', 0.08);

      const limitMs = Math.max(1650, 2450 - idx * 100);
      const t0 = performance.now();
      barIvRef.current = window.setInterval(() => {
        const elapsed = performance.now() - t0;
        setTimePct(Math.max(0, 100 - (elapsed / limitMs) * 100));
      }, 35);

      hideRef.current = window.setTimeout(() => {
        setCueHidden(true);
      }, 950);

      expireRef.current = window.setTimeout(() => {
        clearWaveTimers();
        tone(110, 0.45, 'sawtooth', 0.22);
        setLastOk(false);
        setLastMsg('💀 ¡Tardaste demasiado! Nightmare te saltó en la oscuridad');
        setPhase('FEEDBACK');
      }, limitMs);
    },
    [clearWaveTimers],
  );

  const startPlay = useCallback(() => {
    setWaveIdx(0);
    setWaveScore(0);
    nextWave(0);
  }, [nextWave]);

  const act = useCallback(
    (action: 'light' | 'close') => {
      if (phase !== 'PLAY' || !wave) return;
      clearWaveTimers();
      const ms = performance.now() - waveStartRef.current;
      const correct =
        (wave.cueKind === 'breath' && action === 'close') ||
        (wave.cueKind === 'steps' && action === 'light');
      const bonus = ms < 1050 ? 2 : 1;

      setLastOk(correct);
      if (correct) {
        tone(784, 0.2);
        setWaveScore((s) => s + bonus);
        setLastMsg(
          action === 'close'
            ? `🚪 ¡Puerta cerrada a tiempo! (+${bonus})`
            : `🔦 ¡Linterna espantó la sombra! (+${bonus})`,
        );
      } else {
        tone(120, 0.4, 'sawtooth', 0.2);
        setLastMsg(
          wave.cueKind === 'breath'
            ? '💥 ¡Alumbraste cuando respiraba ahí!'
            : '💥 ¡Cerraste cuando estaba lejos y se coló otro!',
        );
      }
      setPhase('FEEDBACK');
    },
    [phase, wave, clearWaveTimers],
  );

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'PASS' && k === 'ok') {
        startPlay();
      } else if (phase === 'PLAY') {
        if (k === 'left' || k === 'up') act('light');
        else if (k === 'right' || k === 'down' || k === 'ok') act('close');
      } else if (phase === 'FEEDBACK' && k === 'ok') {
        if (waveIdx + 1 < WAVES) {
          const nxt = waveIdx + 1;
          setWaveIdx(nxt);
          nextWave(nxt);
        } else {
          setScores((prev) => {
            const n = [...prev];
            n[pi] = waveScore;
            return n;
          });
          setPhase('TURN_END');
        }
      } else if (phase === 'TURN_END' && k === 'ok') {
        if (pi + 1 < np) {
          setPi((p) => p + 1);
          setPhase('PASS');
        } else {
          const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => scores[b] - scores[a]);
          onFinish(
            'Respiración FNAF 4',
            rank,
            rank.map((p) => `${scores[p]} pts`),
            () => {
              setScores(Array(np).fill(0));
              setPi(0);
              setPhase('PASS');
            },
          );
        }
      }
    },
    [phase, waveIdx, pi, np, waveScore, scores, startPlay, act, nextWave, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'PASS') {
    return (
      <PassScreen
        playerName={players[pi].name}
        subtitle="FNAF 4 (Difícil) · 8 oleadas contrarreloj (2.4 s) · La pista desaparece rápido"
        onReady={startPlay}
      />
    );
  }

  if (phase === 'TURN_END') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="text-[11vh] leading-none">🔦</div>
        <div className="stage-big" style={{fontSize: '8vh', marginTop: '1vh'}}>
          {players[pi].name}: {scores[pi]} pts
        </div>
        <div className="stage-sub">Noche en el dormitorio completada</div>
        <div className="stage-hint">OK: continuar</div>
      </div>
    );
  }

  if (phase === 'FEEDBACK') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-big" style={{fontSize: '7vh'}}>
          {lastMsg}
        </div>
        <div className="stage-hint">OK: siguiente sonido ({waveIdx + 1}/{WAVES})</div>
      </div>
    );
  }

  return (
    <div className="stage-c">
      <div className="stage-sub">
        {players[pi].name} · {wave?.spot} · Oleada {waveIdx + 1}/{WAVES}
      </div>
      <div className="text-[10vh] leading-none my-[1.5vh]">
        {cueHidden ? '🌑' : wave?.cueKind === 'breath' ? '🌬️' : '👣'}
      </div>
      <div className="stage-big" style={{fontSize: 'clamp(1.6rem, 5.4vh, 3.2rem)'}}>
        {cueHidden ? '¡EL SONIDO SE DESVANECIÓ! ¡DECIDE YA!' : wave?.cueText}
      </div>

      <div className="stage-barw" style={{marginTop: '1.8vh'}}>
        <div
          className="stage-barf"
          style={{
            width: `${timePct}%`,
            background: timePct < 35 ? '#ef4444' : '#f59e0b',
          }}
        />
      </div>

      <div className="stage-opt-grid">
        <button type="button" onClick={() => act('light')} className="stage-opt sel">
          ◀ / ▲ 🔦 LINTERNA
          <div className="text-[1.8vh] opacity-80 font-normal mt-1">Si está lejos (pasos)</div>
        </button>
        <button type="button" onClick={() => act('close')} className="stage-opt sel">
          CERRAR PUERTA 🚪 ▶ / OK
          <div className="text-[1.8vh] opacity-80 font-normal mt-1">Si respira cerca</div>
        </button>
      </div>

      <div className="stage-hint">◀/▲ Linterna · ▶/▼/OK Cerrar puerta antes de que se acabe la barra</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* EXCLUSIVO FNAF 6: SALA DE SALVAMENTO (7 CINTAS + 22s + TASER ESTRICTO)     */
/* -------------------------------------------------------------------------- */

const SALVAGE_ACTORS = [
  {name: 'Scrap Baby', emoji: '🤡'},
  {name: 'Molten Freddy', emoji: '🐻'},
  {name: 'Lefty', emoji: '🖤'},
  {name: 'Scraptrap', emoji: '🐰'},
];

export function FnafSalvageStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
}: StageGameProps) {
  const np = players.length;
  const TAPES = 7;
  const MAX_TICKS = 88; // 88 * 250ms = 22s límite
  const [pi, setPi] = useState(0);
  const [phase, setPhase] = useState<'PASS' | 'PLAY' | 'TURN_END'>('PASS');
  const [actor, setActor] = useState(SALVAGE_ACTORS[0]);
  const [tape, setTape] = useState(1);
  const [posture, setPosture] = useState<'calm' | 'twitch' | 'attack'>('calm');
  const [tasersLeft, setTasersLeft] = useState(3);
  const [valueEarned, setValueEarned] = useState(0);
  const [timeLeftSec, setTimeLeftSec] = useState(22);
  const [msg, setMsg] = useState('');
  const [alive, setAlive] = useState(true);
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));

  const postureRef = useRef<'calm' | 'twitch' | 'attack'>('calm');
  const tasersRef = useRef(3);
  const valueRef = useRef(0);
  const tapeRef = useRef(1);
  const ticksRef = useRef(0);
  const ivRef = useRef<number | null>(null);
  const attackTimerRef = useRef(0);

  const stopLoop = () => {
    if (ivRef.current) {
      window.clearInterval(ivRef.current);
      ivRef.current = null;
    }
  };
  useEffect(() => stopLoop, []);

  useEffect(() => {
    if (phase === 'TURN_END') setBg(alive ? '#16a34a' : '#7f1d1d');
    else setBg('#0b090c');
  }, [phase, alive, setBg]);

  const finishTurn = useCallback(
    (ok: boolean, reason: string) => {
      stopLoop();
      setAlive(ok);
      setMsg(reason);
      if (ok) tone(784, 0.3);
      else tone(115, 0.5, 'sawtooth', 0.22);
      setScores((prev) => {
        const n = [...prev];
        n[pi] = valueRef.current;
        return n;
      });
      setPhase('TURN_END');
    },
    [pi],
  );

  const startSalvage = useCallback(() => {
    stopLoop();
    const picked = SALVAGE_ACTORS[Math.floor(Math.random() * SALVAGE_ACTORS.length)];
    setActor(picked);
    postureRef.current = 'calm';
    tasersRef.current = 3;
    valueRef.current = 0;
    tapeRef.current = 1;
    ticksRef.current = 0;
    attackTimerRef.current = 0;

    setTape(1);
    setPosture('calm');
    setTasersLeft(3);
    setValueEarned(0);
    setTimeLeftSec(22);
    setAlive(true);
    setMsg(`“Audio Prompt #1”… Anota con OK mientras ${picked.name} siga quieto`);
    setPhase('PLAY');
    tone(520, 0.1);

    ivRef.current = window.setInterval(() => {
      ticksRef.current += 1;
      const secLeft = Math.max(0, Math.ceil(((MAX_TICKS - ticksRef.current) * 250) / 1000));
      setTimeLeftSec(secLeft);

      if (ticksRef.current >= MAX_TICKS) {
        finishTurn(false, '⏱️ ¡Se acabó el tiempo de salvamento! Perdiste el bono final');
        return;
      }

      if (postureRef.current === 'attack') {
        attackTimerRef.current -= 1;
        if (attackTimerRef.current <= 0) {
          finishTurn(false, `⚡ ¡${picked.name} saltó de la mesa! Salvamento perdido`);
          return;
        }
      } else if (postureRef.current === 'twitch') {
        if (Math.random() < 0.54) {
          postureRef.current = 'attack';
          attackTimerRef.current = 5; // 1.25 s para usar Taser ▲
          setPosture('attack');
          setMsg('🚨 ¡SE LEVANTÓ! ¡USA EL TASER (▲) AHORA!');
          tone(180, 0.22, 'sawtooth', 0.14);
        }
      } else if (Math.random() < 0.42) {
        postureRef.current = 'twitch';
        setPosture('twitch');
        setMsg(`👀 ${picked.name} movió el cuello… ¡cuidado al anotar!`);
        tone(300, 0.08, 'triangle', 0.07);
      }
    }, 250);
  }, [finishTurn]);

  const writeClipboard = useCallback(() => {
    if (phase !== 'PLAY') return;
    if (postureRef.current === 'attack') {
      finishTurn(false, `📋 ¡Miraste el papel cuando ${actor.name} iba a atacar!`);
      return;
    }
    if (postureRef.current === 'twitch' && Math.random() < 0.5) {
      postureRef.current = 'attack';
      attackTimerRef.current = 5;
      setPosture('attack');
      setMsg('🚨 ¡El ruido del bolígrafo lo alteró! ¡TASER ▲ YA!');
      tone(175, 0.22, 'sawtooth', 0.16);
      return;
    }

    valueRef.current += 3;
    setValueEarned(valueRef.current);
    tone(660, 0.12);

    if (tapeRef.current >= TAPES) {
      valueRef.current += 4;
      setValueEarned(valueRef.current);
      finishTurn(true, `📋 ¡Salvamento completo! Bono total: $${valueRef.current * 500}`);
      return;
    }

    tapeRef.current += 1;
    setTape(tapeRef.current);
    setMsg(`“Audio Prompt #${tapeRef.current}”… Anota con OK si sigue estable`);
  }, [phase, actor.name, finishTurn]);

  const useTaser = useCallback(() => {
    if (phase !== 'PLAY') return;
    if (tasersRef.current <= 0) {
      setMsg('❌ Sin cargas de taser — anota rápido con OK');
      tone(130, 0.15, 'sawtooth');
      return;
    }
    tasersRef.current -= 1;
    setTasersLeft(tasersRef.current);

    if (postureRef.current === 'attack' || postureRef.current === 'twitch') {
      postureRef.current = 'calm';
      setPosture('calm');
      valueRef.current += 1;
      setValueEarned(valueRef.current);
      setMsg('⚡ ¡Descarga controlada! Volvió a su postura inicial (+1)');
      tone(880, 0.14, 'square', 0.1);
    } else {
      setMsg('⚠️ Usaste el taser cuando estaba quieto (desperdiciado)');
      tone(220, 0.14, 'sawtooth');
    }
  }, [phase]);

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'PASS' && k === 'ok') {
        startSalvage();
      } else if (phase === 'PLAY') {
        if (k === 'ok') writeClipboard();
        else if (k === 'up' || k === 'left' || k === 'right') useTaser();
      } else if (phase === 'TURN_END' && k === 'ok') {
        if (pi + 1 < np) {
          setPi((p) => p + 1);
          setPhase('PASS');
        } else {
          const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => scores[b] - scores[a]);
          onFinish(
            'Sala de Salvamento',
            rank,
            rank.map((p) => `$${scores[p] * 500}`),
            () => {
              setScores(Array(np).fill(0));
              setPi(0);
              setPhase('PASS');
            },
          );
        }
      }
    },
    [phase, pi, np, scores, startSalvage, writeClipboard, useTaser, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'PASS') {
    return (
      <PassScreen
        playerName={players[pi].name}
        subtitle="FNAF 6 (Difícil) · 7 cintas en 22 s · Si anotas cuando tiembla puede atacar · Solo 3 Tasers"
        onReady={startSalvage}
      />
    );
  }

  if (phase === 'TURN_END') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="text-[11vh] leading-none">{alive ? '📋' : '⚡'}</div>
        <div className="stage-big" style={{fontSize: '7.2vh', marginTop: '1vh'}}>
          {msg}
        </div>
        <div className="stage-sub">
          {players[pi].name} · Valor rescatado: ${scores[pi] * 500}
        </div>
        <div className="stage-hint">OK: continuar</div>
      </div>
    );
  }

  return (
    <div className="stage-c">
      <div className="flex justify-between items-center max-w-[74vw] mx-auto text-[2.5vh] font-bold">
        <span className="text-amber-300">📼 Cinta {tape}/{TAPES}</span>
        <span>{actor.name} · ⏱️ {timeLeftSec}s</span>
        <span className="text-cyan-300">⚡ Tasers: {tasersLeft}/3 · ${valueEarned * 500}</span>
      </div>

      <div
        className={`max-w-[54vw] mx-auto mt-[3vh] p-[3vh] rounded-2xl border-2 ${
          posture === 'attack'
            ? 'border-red-500 bg-red-950/60 scale-105'
            : posture === 'twitch'
              ? 'border-amber-400 bg-amber-950/35'
              : 'border-slate-700 bg-slate-900/75'
        }`}
      >
        <div className="text-[11vh] leading-none">{actor.emoji}</div>
        <div className="text-[2.8vh] font-bold mt-[2vh]">{msg}</div>
      </div>

      <div className="stage-opt-grid">
        <button type="button" onClick={writeClipboard} className="stage-opt sel">
          OK 📋 ANOTAR EN PORTAPAPELES
        </button>
        <button
          type="button"
          onClick={useTaser}
          className={`stage-opt ${posture === 'attack' ? 'bad' : ''}`}
        >
          ▲ ⚡ DISPARAR TASER ({tasersLeft})
        </button>
      </div>

      <div className="stage-hint">OK: anotar resultado · ▲: electroshock controlado</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* EVENTO TELÉFONO FNAF: BALLOON BOY (6 GOLPES · VENTANA RÁPIDA · 2 FALLOS)   */
/* -------------------------------------------------------------------------- */

const BB_SOUNDS = [
  {src: '/assets/aistudio/bb_hi.mp3', label: '¡Hi!'},
  {src: '/assets/aistudio/bb_hello.mp3', label: '¡Hello!'},
  {src: '/assets/aistudio/bb_laugh.mp3', label: '¡Ha ha ha!'},
] as const;

interface BalloonBoyStageProps extends StageGameProps {
  onFnafLockout: () => void;
}

export function FnafBalloonBoyStage({
  players,
  onFinish,
  onFnafLockout,
  registerKeyHandler,
  setBg,
}: BalloonBoyStageProps) {
  const MAX_HITS = 6;
  const MAX_STRIKES = 2;
  const [phase, setPhase] = useState<'WAIT' | 'APPEAR' | 'HIT' | 'JUMPSCARE' | 'WIN'>('WAIT');
  const [hits, setHits] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [lane, setLane] = useState<0 | 1 | 2>(1);
  const [soundIdx, setSoundIdx] = useState<0 | 1 | 2>(0);
  const [timePct, setTimePct] = useState(100);
  const [missNote, setMissNote] = useState<string | null>(null);
  const [canDismissScare, setCanDismissScare] = useState(false);

  const audiosRef = useRef<HTMLAudioElement[]>([]);
  const spawnTimerRef = useRef<number | null>(null);
  const expireTimerRef = useRef<number | null>(null);
  const barIvRef = useRef<number | null>(null);
  const hitTimerRef = useRef<number | null>(null);
  const noteTimerRef = useRef<number | null>(null);
  const scareLockRef = useRef<number | null>(null);
  const autoExitRef = useRef<number | null>(null);
  const hitsRef = useRef(0);
  const strikesRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (spawnTimerRef.current) window.clearTimeout(spawnTimerRef.current);
    if (expireTimerRef.current) window.clearTimeout(expireTimerRef.current);
    if (barIvRef.current) window.clearInterval(barIvRef.current);
    if (hitTimerRef.current) window.clearTimeout(hitTimerRef.current);
    if (noteTimerRef.current) window.clearTimeout(noteTimerRef.current);
    if (scareLockRef.current) window.clearTimeout(scareLockRef.current);
    if (autoExitRef.current) window.clearTimeout(autoExitRef.current);
    spawnTimerRef.current = null;
    expireTimerRef.current = null;
    barIvRef.current = null;
    hitTimerRef.current = null;
    noteTimerRef.current = null;
    scareLockRef.current = null;
    autoExitRef.current = null;
  }, []);

  const stopAllBbAudio = useCallback(() => {
    audiosRef.current.forEach((a) => {
      a.pause();
      a.currentTime = 0;
    });
  }, []);

  const playBbClip = useCallback((idx: number) => {
    audiosRef.current.forEach((a, i) => {
      if (i !== idx) {
        a.pause();
        a.currentTime = 0;
      }
    });
    const el = audiosRef.current[idx];
    if (el) {
      el.currentTime = 0;
      void el.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    audiosRef.current = BB_SOUNDS.map((s) => {
      const a = new Audio(s.src);
      a.preload = 'auto';
      a.volume = 0.92;
      return a;
    });
    return () => {
      clearTimers();
      audiosRef.current.forEach((a) => {
        a.pause();
        a.src = '';
      });
      audiosRef.current = [];
    };
  }, [clearTimers]);

  useEffect(() => {
    if (phase === 'JUMPSCARE') setBg('#7f1d1d');
    else if (phase === 'WIN') setBg('#16a34a');
    else if (phase === 'APPEAR') setBg('#1e1b4b');
    else setBg('#07060b');
  }, [phase, setBg]);

  const triggerJumpscare = useCallback(() => {
    clearTimers();
    setCanDismissScare(false);
    setPhase('JUMPSCARE');
    playBbClip(2);
    tone(95, 0.65, 'sawtooth', 0.28);
    tone(155, 0.55, 'square', 0.22);
    window.setTimeout(() => tone(235, 0.45, 'sawtooth', 0.2), 85);

    scareLockRef.current = window.setTimeout(() => {
      setCanDismissScare(true);
    }, 700);
    autoExitRef.current = window.setTimeout(() => {
      onFnafLockout();
    }, 3600);
  }, [clearTimers, playBbClip, onFnafLockout]);

  const scheduleNextAppearance = useCallback(
    (currentHits: number) => {
      clearTimers();
      setMissNote(null);
      setTimePct(100);
      setPhase('WAIT');

      const delayMs = currentHits === 0 ? 700 : 650 + Math.floor(Math.random() * 950);
      spawnTimerRef.current = window.setTimeout(() => {
        const nextLane = Math.floor(Math.random() * 3) as 0 | 1 | 2;
        const nextSound = (
          currentHits < 3 ? currentHits : Math.floor(Math.random() * 3)
        ) as 0 | 1 | 2;
        setLane(nextLane);
        setSoundIdx(nextSound);
        setTimePct(100);
        setPhase('APPEAR');
        playBbClip(nextSound);

        // Ventana más rápida: empieza en 1900ms y baja hasta 1100ms
        const windowMs = Math.max(1100, 1900 - currentHits * 155);
        const t0 = performance.now();
        barIvRef.current = window.setInterval(() => {
          const elapsed = performance.now() - t0;
          setTimePct(Math.max(0, 100 - (elapsed / windowMs) * 100));
        }, 35);

        expireTimerRef.current = window.setTimeout(() => {
          triggerJumpscare();
        }, windowMs);
      }, delayMs);
    },
    [clearTimers, playBbClip, triggerJumpscare],
  );

  useEffect(() => {
    hitsRef.current = 0;
    strikesRef.current = 0;
    scheduleNextAppearance(0);
    return () => clearTimers();
  }, [scheduleNextAppearance, clearTimers]);

  const showTempNote = useCallback((text: string) => {
    setMissNote(text);
    if (noteTimerRef.current) window.clearTimeout(noteTimerRef.current);
    noteTimerRef.current = window.setTimeout(() => setMissNote(null), 850);
  }, []);

  const attemptStrike = useCallback(
    (targetLane: 0 | 1 | 2) => {
      if (phase === 'WAIT') {
        const nextSt = strikesRef.current + 1;
        strikesRef.current = nextSt;
        setStrikes(nextSt);
        tone(170, 0.14, 'sawtooth', 0.14);
        if (nextSt >= MAX_STRIKES) {
          triggerJumpscare();
          return;
        }
        showTempNote(`❌ ¡Te adelantaste! Fallo ${nextSt}/${MAX_STRIKES}`);
        return;
      }
      if (phase !== 'APPEAR') return;

      if (targetLane !== lane) {
        const nextSt = strikesRef.current + 1;
        strikesRef.current = nextSt;
        setStrikes(nextSt);
        tone(155, 0.14, 'sawtooth', 0.14);
        if (nextSt >= MAX_STRIKES) {
          triggerJumpscare();
          return;
        }
        showTempNote(`❌ ¡Lado equivocado! Fallo ${nextSt}/${MAX_STRIKES}`);
        return;
      }

      clearTimers();
      stopAllBbAudio();
      playControlClick();
      tone(540, 0.09, 'square', 0.14);
      window.setTimeout(() => tone(220, 0.12, 'triangle', 0.14), 50);

      const nextHits = hitsRef.current + 1;
      hitsRef.current = nextHits;
      setHits(nextHits);
      setPhase('HIT');

      hitTimerRef.current = window.setTimeout(() => {
        if (nextHits >= MAX_HITS) {
          tone(523, 0.14);
          window.setTimeout(() => tone(784, 0.3), 150);
          setPhase('WIN');
        } else {
          scheduleNextAppearance(nextHits);
        }
      }, 420);
    },
    [phase, lane, clearTimers, stopAllBbAudio, scheduleNextAppearance, showTempNote, triggerJumpscare],
  );

  const finishVictory = useCallback(() => {
    clearTimers();
    stopAllBbAudio();
    const rank = Array.from({length: players.length}, (_, i) => i);
    const sharedPts = rank.map(() => 3);
    onFinish(
      '¡Llamada: Balloon Boy!',
      rank,
      rank.map(() => `${MAX_HITS}/${MAX_HITS} golpes · Defensa completada`),
      () => {
        hitsRef.current = 0;
        strikesRef.current = 0;
        setHits(0);
        setStrikes(0);
        scheduleNextAppearance(0);
      },
      sharedPts,
    );
  }, [clearTimers, stopAllBbAudio, players.length, onFinish, scheduleNextAppearance]);

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'WAIT' || phase === 'APPEAR') {
        if (k === 'left') attemptStrike(0);
        else if (k === 'ok' || k === 'up') attemptStrike(1);
        else if (k === 'right') attemptStrike(2);
      } else if (phase === 'JUMPSCARE' && k === 'ok' && canDismissScare) {
        onFnafLockout();
      } else if (phase === 'WIN' && k === 'ok') {
        finishVictory();
      }
    },
    [phase, canDismissScare, attemptStrike, onFnafLockout, finishVictory],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'JUMPSCARE') {
    return (
      <div
        className="stage-c cursor-pointer"
        onClick={() => {
          if (canDismissScare) onFnafLockout();
        }}
      >
        <div className="mx-auto mb-[1.4vh] h-[40vh] w-[40vh] overflow-hidden rounded-[2.2vh] border-[0.55vh] border-red-500 shadow-[0_0_6vh_rgba(239,68,68,0.75)] fnaf-jumpscare-pop">
          <BalloonBoySvg mood="jumpscare" />
        </div>
        <div className="stage-big" style={{fontSize: 'clamp(1.9rem, 7vh, 4.3rem)'}}>
          ¡BALLOON BOY TE ATRAPÓ!
        </div>
        <div className="stage-sub text-amber-200">Modo FNAF cerrado durante 1 minuto</div>
        <div className="stage-hint">
          {canDismissScare ? 'OK: volver al modo Clásico' : '¡Te robó las baterías!'}
        </div>
      </div>
    );
  }

  if (phase === 'WIN') {
    return (
      <div className="stage-c cursor-pointer" onClick={finishVictory}>
        <div className="mx-auto mb-[1.5vh] h-[30vh] w-[30vh] overflow-hidden rounded-[2vh] border-[0.45vh] border-emerald-400/80 shadow-[0_0_4vh_rgba(34,197,94,0.45)]">
          <BalloonBoySvg mood="hit" />
        </div>
        <div className="stage-big" style={{fontSize: 'clamp(1.9rem, 7vh, 4.2rem)'}}>
          ¡ESPANTASTE A BALLOON BOY!
        </div>
        <div className="stage-sub">
          Bloqueaste la llamada y salvaste el modo FNAF ({MAX_HITS}/{MAX_HITS} golpes · +3 pts para todos)
        </div>
        <div className="stage-hint">OK: reclamar +3 pts para todos</div>
      </div>
    );
  }

  const laneSpecs: {idx: 0 | 1 | 2; title: string; keyLabel: string}[] = [
    {idx: 0, title: 'Conducto Izquierdo', keyLabel: '◀ GOLPEAR'},
    {idx: 1, title: 'Pasillo Central', keyLabel: 'OK GOLPEAR'},
    {idx: 2, title: 'Conducto Derecho', keyLabel: '▶ GOLPEAR'},
  ];

  const isAppearing = phase === 'APPEAR' || phase === 'HIT';

  return (
    <div className="stage-c">
      <div className="stage-sub text-amber-300">
        Llamada entrante · Golpes {hits}/{MAX_HITS} ·{' '}
        <span className={strikes > 0 ? 'text-red-400 font-bold' : 'text-slate-300'}>
          Fallos {strikes}/{MAX_STRIKES}
        </span>
      </div>

      <div className="stage-big" style={{fontSize: 'clamp(1.4rem, 4.4vh, 2.7rem)', marginTop: '0.4vh'}}>
        {phase === 'HIT'
          ? '¡GOLPE CERTERO!'
          : phase === 'APPEAR'
            ? `Sonido detectado: "${BB_SOUNDS[soundIdx].label}"`
            : missNote ?? 'Escucha dónde aparece Balloon Boy… (¡2 fallos = jumpscare!)'}
      </div>

      <div className="mx-auto mt-[2.4vh] grid max-w-[82vw] grid-cols-3 gap-[1.8vw]">
        {laneSpecs.map((slot) => {
          const activeHere = isAppearing && lane === slot.idx;
          return (
            <button
              key={`lane-${slot.idx}`}
              type="button"
              onClick={() => attemptStrike(slot.idx)}
              className={`relative flex h-[38vh] flex-col items-center justify-between rounded-[2vh] border-[0.45vh] p-[1.4vh] transition-all duration-100 cursor-pointer ${
                activeHere
                  ? phase === 'HIT'
                    ? 'scale-95 border-emerald-400 bg-emerald-950/60 shadow-[0_0_3.5vh_rgba(74,222,128,0.5)]'
                    : 'scale-105 border-amber-400 bg-slate-900/95 shadow-[0_0_4vh_rgba(251,191,36,0.55)]'
                  : 'border-white/15 bg-slate-950/80 opacity-75'
              }`}
            >
              <div className="text-[1.9vh] font-bold text-slate-300">{slot.title}</div>

              <div className="relative flex h-[24vh] w-[22vh] items-center justify-center">
                {activeHere ? (
                  <>
                    <BalloonBoySvg mood={phase === 'HIT' ? 'hit' : 'normal'} />
                    {phase === 'APPEAR' && (
                      <div className="absolute -top-[1vh] right-[-1vw] rounded-lg border border-amber-300 bg-red-700 px-[0.8vw] py-[0.3vh] text-[1.9vh] font-extrabold text-white shadow">
                        {BB_SOUNDS[soundIdx].label}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex h-[18vh] w-[18vh] items-center justify-center rounded-2xl border border-white/10 bg-black/60 text-[1.8vh] font-semibold text-slate-500">
                    Oscuro
                  </div>
                )}
              </div>

              <div
                className={`w-full rounded-xl py-[0.8vh] text-[2.2vh] font-extrabold ${
                  activeHere ? 'bg-amber-400 text-slate-950' : 'bg-slate-800/90 text-slate-200'
                }`}
              >
                {slot.keyLabel}
              </div>
            </button>
          );
        })}
      </div>

      <div className="stage-barw" style={{marginTop: '2.4vh'}}>
        <div
          className="stage-barf"
          style={{
            width: `${phase === 'APPEAR' ? timePct : 100}%`,
            background: phase === 'APPEAR' && timePct < 35 ? '#ef4444' : '#fbbf24',
            opacity: phase === 'APPEAR' ? 1 : 0.25,
          }}
        />
      </div>

      <div className="stage-hint">
        Pulsa ◀, OK o ▶ solo cuando aparezca y en su conducto exacto
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* EXCLUSIVO FNAF 7: CÁMARAS DE SEGURIDAD (4 ANIMATRÓNICOS · CAM 1A/1B/2/4)   */
/* -------------------------------------------------------------------------- */

const SEC_CAMS: {id: FnafCamId; label: string; zone: string}[] = [
  {id: 'CAM 1A', label: 'CAM 1A', zone: 'Escenario'},
  {id: 'CAM 1B', label: 'CAM 1B', zone: 'Comedor'},
  {id: 'CAM 2', label: 'CAM 2', zone: 'Pasillo Oeste'},
  {id: 'CAM 4', label: 'CAM 4', zone: 'Pasillo Este'},
];

interface CamThreat {
  actor: FnafCamActor;
  name: string;
  camIdx: number;
  threat: number; // 0..100
}

function makeInitialCamThreats(): CamThreat[] {
  return [
    {actor: 'freddy', name: 'Freddy', camIdx: 0, threat: 16},
    {actor: 'bonnie', name: 'Bonnie', camIdx: 2, threat: 24},
    {actor: 'chica', name: 'Chica', camIdx: 1, threat: 20},
    {actor: 'foxy', name: 'Foxy', camIdx: 3, threat: 28},
  ];
}

export function FnafCamarasStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
}: StageGameProps) {
  const np = players.length;
  const SHIFT_SECONDS = 25;

  const [pi, setPi] = useState(0);
  const [phase, setPhase] = useState<'PASS' | 'PLAY' | 'TURN_END'>('PASS');
  const [selCam, setSelCam] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SHIFT_SECONDS);
  const [threats, setThreats] = useState<CamThreat[]>(makeInitialCamThreats);
  const [flashed, setFlashed] = useState(false);
  const [turnPts, setTurnPts] = useState(0);
  const [status, setStatus] = useState('4 animatrónicos activos · Cambia con flechas y frena con OK');
  const [survived, setSurvived] = useState(true);
  const [killerName, setKillerName] = useState<string | null>(null);
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));

  const selCamRef = useRef(0);
  selCamRef.current = selCam;
  const turnPtsRef = useRef(0);
  turnPtsRef.current = turnPts;
  const threatsRef = useRef<CamThreat[]>(makeInitialCamThreats());
  const cooldownRef = useRef(false);
  const flashTimerRef = useRef<number | null>(null);
  const coolTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
      if (coolTimerRef.current) window.clearTimeout(coolTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase === 'TURN_END') setBg(survived ? '#16a34a' : '#7f1d1d');
    else setBg('#07090e');
  }, [phase, survived, setBg]);

  const startShift = useCallback(() => {
    const initial = makeInitialCamThreats();
    threatsRef.current = initial;
    setSelCam(0);
    setTimeLeft(SHIFT_SECONDS);
    setThreats(initial);
    setFlashed(false);
    setTurnPts(0);
    setSurvived(true);
    setKillerName(null);
    cooldownRef.current = false;
    setStatus('4 animatrónicos acechan · Localiza y frena con OK');
    setPhase('PLAY');
  }, []);

  useEffect(() => {
    if (phase !== 'PLAY') return;

    let rem = SHIFT_SECONDS;
    const secIv = window.setInterval(() => {
      rem -= 1;
      setTimeLeft(rem);
      if (rem <= 0) {
        const totalPts = turnPtsRef.current + 8;
        setSurvived(true);
        setScores((sc) => {
          const next = [...sc];
          next[pi] = totalPts;
          return next;
        });
        tone(523, 0.14);
        window.setTimeout(() => tone(784, 0.3), 150);
        setPhase('TURN_END');
      }
    }, 1000);

    const aiIv = window.setInterval(() => {
      let breached: string | null = null;
      const next = threatsRef.current.map((item) => {
        const isWatched = item.camIdx === selCamRef.current;
        const baseSpeed = item.actor === 'foxy' ? 8.6 : 7.0;
        const step = isWatched ? 2.6 : baseSpeed + Math.random() * 4.8;
        let nextThreat = item.threat + step;
        let nextCam = item.camIdx;

        if (!isWatched && Math.random() < 0.22) {
          nextCam = Math.floor(Math.random() * SEC_CAMS.length);
        }

        if (nextThreat >= 100) {
          nextThreat = 100;
          breached = item.name;
        }
        return {...item, camIdx: nextCam, threat: nextThreat};
      });

      threatsRef.current = next;
      setThreats(next);

      if (breached) {
        tone(100, 0.55, 'sawtooth', 0.25);
        setSurvived(false);
        setKillerName(breached);
        setScores((sc) => {
          const n = [...sc];
          n[pi] = turnPtsRef.current;
          return n;
        });
        setPhase('TURN_END');
      }
    }, 460);

    return () => {
      window.clearInterval(secIv);
      window.clearInterval(aiIv);
    };
  }, [phase, pi]);

  const switchCam = useCallback((targetCam: number) => {
    setSelCam(targetCam);
    tone(290 + targetCam * 35, 0.05, 'triangle', 0.06);
  }, []);

  const triggerFlash = useCallback(() => {
    if (phase !== 'PLAY' || cooldownRef.current) return;
    const activeCam = selCamRef.current;
    setFlashed(true);
    if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => setFlashed(false), 210);

    let spottedCount = 0;
    let bonusPts = 0;

    const updated = threatsRef.current.map((item) => {
      if (item.camIdx !== activeCam) return item;
      spottedCount += 1;
      bonusPts += item.threat >= 66 ? 4 : item.threat >= 25 ? 2 : 1;
      const movedCam = (item.camIdx + 1 + Math.floor(Math.random() * 3)) % SEC_CAMS.length;
      return {...item, threat: 8, camIdx: movedCam};
    });

    threatsRef.current = updated;
    setThreats(updated);

    if (spottedCount > 0) {
      playControlClick();
      tone(660, 0.12, 'triangle', 0.12);
      setTurnPts((p) => p + bonusPts);
      setStatus(`¡Vigilado en ${SEC_CAMS[activeCam].label}! (+${bonusPts} pts)`);
    } else {
      tone(155, 0.1, 'sawtooth', 0.08);
      cooldownRef.current = true;
      if (coolTimerRef.current) window.clearTimeout(coolTimerRef.current);
      coolTimerRef.current = window.setTimeout(() => {
        cooldownRef.current = false;
      }, 650);
      setStatus(`⚠️ Estática en ${SEC_CAMS[activeCam].label} (0.65 s bloqueo de flash)`);
    }
  }, [phase]);

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'PASS' && k === 'ok') {
        startShift();
      } else if (phase === 'PLAY') {
        if (k === 'left' || k === 'right') {
          switchCam(selCamRef.current ^ 1);
        } else if (k === 'up' || k === 'down') {
          switchCam(selCamRef.current ^ 2);
        } else if (k === 'ok') {
          triggerFlash();
        }
      } else if (phase === 'TURN_END' && k === 'ok') {
        if (pi + 1 < np) {
          setPi((p) => p + 1);
          setPhase('PASS');
        } else {
          const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => scores[b] - scores[a]);
          onFinish(
            'Cámaras de Seguridad',
            rank,
            rank.map((p) => `${scores[p]} pts`),
            () => {
              setScores(Array(np).fill(0));
              setPi(0);
              setPhase('PASS');
            },
          );
        }
      }
    },
    [phase, pi, np, scores, startShift, switchCam, triggerFlash, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'PASS') {
    return (
      <PassScreen
        playerName={players[pi].name}
        subtitle="Cámaras FNAF (Difícil) · Freddy, Bonnie, Chica y Foxy · 25 s · Flash en vacío bloquea 0.65 s"
        onReady={startShift}
      />
    );
  }

  if (phase === 'TURN_END') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="mx-auto mb-[1.6vh] h-[28vh] w-[52vh] overflow-hidden rounded-[2vh] border-[0.45vh] border-white/25 bg-black shadow-2xl">
          <FnafCamSceneSvg
            camId={SEC_CAMS[selCam].id}
            actor={survived ? null : 'freddy'}
            threatPct={survived ? 0 : 100}
            flashed={false}
          />
        </div>
        <div className="stage-big" style={{fontSize: 'clamp(1.8rem, 7vh, 4.2rem)'}}>
          {survived ? '¡VIGILANCIA COMPLETADA!' : `¡${(killerName ?? 'ANIMATRÓNICO').toUpperCase()} SE ACERCÓ!`}
        </div>
        <div className="stage-sub">
          {players[pi].name} consiguió {scores[pi]} pts en cámaras
        </div>
        <div className="stage-hint">OK: continuar</div>
      </div>
    );
  }

  const currentCam = SEC_CAMS[selCam];
  const actorInCam = threats.reduce<CamThreat | null>((best, item) => {
    if (item.camIdx !== selCam) return best;
    if (!best || item.threat > best.threat) return item;
    return best;
  }, null);

  return (
    <div className="stage-c">
      <div className="mx-auto flex max-w-[84vw] items-center justify-between text-[2.4vh] font-bold">
        <span>{players[pi].name} · {turnPts} pts</span>
        <span className="text-amber-300">{status}</span>
        <span className="tabular-nums text-emerald-300">{timeLeft}s</span>
      </div>

      <div className="mx-auto mt-[2vh] grid max-w-[84vw] grid-cols-[1.45fr_1fr] items-stretch gap-[2vw]">
        <div className="relative overflow-hidden rounded-[2vh] border-[0.45vh] border-slate-400/35 bg-black shadow-2xl">
          <FnafCamSceneSvg
            camId={currentCam.id}
            actor={actorInCam ? actorInCam.actor : null}
            threatPct={actorInCam ? actorInCam.threat : 0}
            flashed={flashed}
          />
          <div className="absolute left-[1.2vw] top-[1.4vh] flex items-center gap-[0.6vw] rounded bg-black/75 px-[0.8vw] py-[0.35vh] text-[1.9vh] font-extrabold text-white">
            <span className="inline-block h-[1.1vh] w-[1.1vh] rounded-full bg-red-500 animate-pulse" />
            <span>REC · {currentCam.label} ({currentCam.zone})</span>
          </div>
          <div className="absolute bottom-[1.4vh] inset-x-[1.2vw] flex items-center justify-between rounded-lg bg-black/75 px-[1vw] py-[0.6vh] text-[1.9vh] font-bold">
            {actorInCam ? (
              <>
                <span className={actorInCam.threat >= 66 ? 'text-red-400' : 'text-amber-300'}>
                  Detectado: {actorInCam.name} ({Math.round(actorInCam.threat)}%)
                </span>
                <span className="text-white">Pulsa OK para frenar</span>
              </>
            ) : (
              <>
                <span className="text-emerald-300">Sin movimiento aquí</span>
                <span className="text-slate-400">No gastes flash en vacío</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-[1.2vh_1vw]">
          {SEC_CAMS.map((cam, idx) => {
            const threatsHere = threats.filter((t) => t.camIdx === idx);
            const maxThreat = threatsHere.reduce((m, t) => Math.max(m, t.threat), 0);
            const isDanger = maxThreat >= 60;
            const isSel = selCam === idx;

            return (
              <button
                key={cam.id}
                type="button"
                onClick={() => {
                  switchCam(idx);
                  if (isSel) triggerFlash();
                }}
                className={`stage-opt flex flex-col justify-between text-left ${isSel ? 'sel' : ''} ${
                  isDanger ? 'border-red-500/80' : ''
                }`}
                style={{padding: '1.8vh 1.2vw'}}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[2.4vh] font-extrabold text-white">{cam.label}</span>
                  {isDanger && (
                    <span className="text-[1.5vh] font-extrabold text-red-400">¡CERCA!</span>
                  )}
                </div>
                <div className="text-[1.8vh] text-slate-300">{cam.zone}</div>
                <div className="mt-[0.8vh] h-[0.9vh] w-full overflow-hidden rounded-full bg-slate-900">
                  <div
                    className="h-full transition-all duration-200"
                    style={{
                      width: `${Math.round(maxThreat)}%`,
                      background: maxThreat >= 66 ? '#ef4444' : maxThreat >= 35 ? '#f59e0b' : '#22c55e',
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="stage-hint">
        ◀▶▲▼ cambiar entre CAM 1A, 1B, 2 y 4 · OK iluminar (no pulses en vacío)
      </div>
    </div>
  );
}
