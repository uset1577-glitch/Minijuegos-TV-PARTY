import {useCallback, useEffect, useRef, useState} from 'react';
import {
  ClueCard,
  DilemmaItem,
  EmojiPuzzle,
  ImpostorRound,
  MostLikelyPrompt,
  NeverHaveIStatement,
  TriviaQuestion,
  TrueFalseStatement,
} from '../../types/game';
import {apiUrl} from '../../utils/api';
import {
  filterFreshAiItems,
  getRecentAiItems,
  pickFreshTopic,
  recordAiItems,
} from '../../utils/aiHistory';
import {
  PLAYER_STAGE_COLORS,
  RemoteKey,
  StageGameProps,
  playControlClick,
  tone,
} from '../../utils/stageAudio';

/* -------------------------------------------------------------------------- */
/* 9. RULETA DE RETOS IA (CONTINUA CON ANIMACIÓN DE COLORES)                  */
/* -------------------------------------------------------------------------- */

const WHEEL_CATS = ['Mímica', 'Verdad', 'Improvisa', 'Físico', 'Votación', 'Talento', 'Comodín IA'];
const FNAF_WHEEL_CATS = ['Guardia', 'Animatrónico', 'Cámara', 'Mímica FNAF', 'Turno 12 AM', 'Sonido', 'Comodín Fazbear'];
const AU_WHEEL_CATS = ['Tarea Skeld', 'Alcantarilla', 'Emergencia', 'Coartada', 'Sabotaje', 'Mímica Espacial', 'Comodín Tripulación'];
const VIBES = ['En familia', 'Sano y divertido', 'Creativo', 'Para reír todos'];
const FNAF_VIBES = ['Turno 12 AM', 'Animatrónicos', 'Guardia y cámaras', 'Pizzería Fazbear'];
const AU_VIBES = ['Nave The Skeld', 'Sospechosos', 'Sabotaje O2', 'Reunión Cafetería'];

export function RuletaIaStage({
  players,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
  onAwardSingle,
}: StageGameProps & {onAwardSingle: (playerIdx: number, pts: number) => void}) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const activeVibes = isFnaf ? FNAF_VIBES : isAu ? AU_VIBES : VIBES;
  const activeCats = isFnaf ? FNAF_WHEEL_CATS : isAu ? AU_WHEEL_CATS : WHEEL_CATS;
  const np = players.length;
  const [phase, setPhase] = useState<'SPIN' | 'SHOW' | 'ERR'>('SPIN');
  const [vibeIdx, setVibeIdx] = useState(0);
  const [spinColorIdx, setSpinColorIdx] = useState(0);
  const [targetPlayer, setTargetPlayer] = useState(0);
  const [challengeText, setChallengeText] = useState('');
  const [challengeTitle, setChallengeTitle] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const lastPlayerRef = useRef(-1);
  const spinningRef = useRef(false);
  const ivRef = useRef<number | null>(null);
  const spinTimeoutRef = useRef<number | null>(null);
  const queueRef = useRef<Array<{title: string; challenge: string}>>([]);
  const queueVibeRef = useRef(-1);
  const historyKey = `ruleta_${themeMode}`;

  const stopSpin = () => {
    if (ivRef.current) window.clearInterval(ivRef.current);
    if (spinTimeoutRef.current) window.clearTimeout(spinTimeoutRef.current);
    spinningRef.current = false;
  };
  useEffect(() => stopSpin, []);

  const launchSpin = useCallback(
    async (chosenVibeIdx: number) => {
      stopSpin();
      spinningRef.current = true;
      setPhase('SPIN');

      let ti = 0;
      do {
        ti = Math.floor(Math.random() * np);
      } while (np > 1 && ti === lastPlayerRef.current);
      lastPlayerRef.current = ti;
      setTargetPlayer(ti);

      let tick = 0;
      ivRef.current = window.setInterval(() => {
        tick++;
        setSpinColorIdx(tick % np);
        tone(300 + tick * 12, 0.04);
      }, 110);

      if (queueVibeRef.current !== chosenVibeIdx) {
        queueRef.current = [];
        queueVibeRef.current = chosenVibeIdx;
      }

      if (queueRef.current.length > 0) {
        const nextItem = queueRef.current.shift()!;
        spinTimeoutRef.current = window.setTimeout(() => {
          stopSpin();
          setChallengeTitle(nextItem.title);
          setChallengeText(nextItem.challenge);
          recordAiItems(historyKey, [nextItem.challenge], 45);
          tone(784, 0.35);
          setPhase('SHOW');
        }, 700);
        return;
      }

      try {
        const cat = activeCats[Math.floor(Math.random() * activeCats.length)];
        const res = await fetch(apiUrl('/api/ai/challenge'), {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            category: cat,
            vibe: activeVibes[chosenVibeIdx],
            playerName: players[ti].name,
            playerCount: np,
            recentPrompts: getRecentAiItems(historyKey),
            theme: themeMode,
          }),
        });
        const data = await res.json();
        stopSpin();
        if (!res.ok) throw new Error(data.error || 'Error con IA');

        const batch = Array.isArray(data.challenges)
          ? (data.challenges as Array<{title?: string; challenge?: string}>)
          : [];
        const formatted = batch
          .filter((c) => c && c.challenge)
          .map((c) => ({
            title: String(c.title || cat),
            challenge: String(c.challenge || ''),
          }));

        const freshList = filterFreshAiItems(
          historyKey,
          formatted,
          (c) => c.challenge,
          45,
        );
        const first = freshList.shift() ?? {
          title: String(data.title || cat),
          challenge: String(data.challenge || ''),
        };
        if (first.challenge) {
          recordAiItems(historyKey, [first.challenge], 45);
        }
        queueRef.current = freshList;

        setChallengeTitle(first.title);
        setChallengeText(first.challenge);
        tone(784, 0.35);
        setPhase('SHOW');
      } catch (err) {
        stopSpin();
        setErrMsg(err instanceof Error ? err.message : 'Error de conexión con IA');
        tone(150, 0.35, 'sawtooth');
        setPhase('ERR');
      }
    },
    [np, players, activeCats, activeVibes, themeMode, historyKey],
  );

  useEffect(() => {
    void launchSpin(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase === 'SPIN') setBg(PLAYER_STAGE_COLORS[spinColorIdx % PLAYER_STAGE_COLORS.length]);
    else if (phase === 'ERR') setBg('#7f1d1d');
    else setBg(PLAYER_STAGE_COLORS[targetPlayer % PLAYER_STAGE_COLORS.length]);
  }, [phase, spinColorIdx, targetPlayer, setBg]);

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'SPIN') return;
      if (k === 'ok') {
        void launchSpin(vibeIdx);
      } else if (k === 'up' && phase === 'SHOW') {
        onAwardSingle(targetPlayer, 2);
        tone(784, 0.25);
        void launchSpin(vibeIdx);
      } else if (k === 'right' || k === 'left') {
        const nextV =
          k === 'right'
            ? (vibeIdx + 1) % activeVibes.length
            : (vibeIdx + activeVibes.length - 1) % activeVibes.length;
        setVibeIdx(nextV);
        playControlClick();
        void launchSpin(nextV);
      }
    },
    [phase, vibeIdx, activeVibes.length, targetPlayer, launchSpin, onAwardSingle],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'SPIN') {
    return (
      <div className="stage-c">
        <div className="stage-sub">
          {isFnaf ? '🍕 Girando Ruleta Fazbear…' : isAu ? '🚀 Girando Ruleta Skeld…' : 'Girando ruleta IA…'} ({activeVibes[vibeIdx]})
        </div>
        <div className="stage-big" style={{fontSize: '8vh', marginTop: '3vh'}}>
          {isFnaf ? 'Asignando reto del turno' : isAu ? 'Asignando tarea espacial' : 'Creando reto inédito'}
        </div>
      </div>
    );
  }

  if (phase === 'ERR') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-big" style={{fontSize: '7vh'}}>
          No se pudo generar el reto
        </div>
        <div className="stage-sub">{errMsg}</div>
        <div className="stage-hint">OK: reintentar · Atrás: menú</div>
      </div>
    );
  }

  return (
    <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
      <div className="stage-sub">
        {isFnaf
          ? `🐻 Turno de guardia · ${activeVibes[vibeIdx]}`
          : isAu
            ? `🛰️ Tripulante asignado · ${activeVibes[vibeIdx]}`
            : `Le toca a · ${activeVibes[vibeIdx]}`}
      </div>
      <div className="stage-big">{players[targetPlayer].name}</div>
      <div className="stage-sub" style={{opacity: 0.9}}>
        {challengeTitle}
      </div>
      <div
        className="stage-big"
        style={{fontSize: 'clamp(1.4rem, 5.2vh, 3rem)', marginTop: '3vh', lineHeight: 1.25}}
      >
        {challengeText}
      </div>
      <div className="stage-hint">
        ▲: cumplido (+2 pts) · OK: otro reto · ◀▶: ambiente · Atrás: menú
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 10. TRIVIA RELÁMPAGO IA                                                    */
/* -------------------------------------------------------------------------- */

const TRIVIA_TOPICS = [
  'Cultura General',
  'Cine y Animación',
  'Videojuegos Clásicos y Modernos',
  'Ciencia y Espacio',
  'Música y Deportes',
  'Geografía y Naturaleza',
  'Inventos e Historia',
];
const FNAF_TRIVIA_TOPICS = [
  'FNAF 1 y Pizzería original',
  'FNAF 2, Toys y Puppet',
  'FNAF 3 y Fazbear’s Fright',
  'FNAF 4 y Sister Location',
  'Pizzeria Simulator, UCN y Security Breach',
  'Curiosidades y mecánicas secretas de FNAF',
];
const AU_TRIVIA_TOPICS = [
  'The Skeld: salas y cámaras',
  'Mira HQ y Polus',
  'The Airship y The Fungle',
  'Roles: Ingeniero, Científico, Cambiaformas, Rastreador',
  'Sabotajes, tareas visuales y reglas de juego',
  'Historia de Innersloth y curiosidades de Among Us',
];

export function TriviaIaStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const [phase, setPhase] = useState<'LOAD' | 'PLAY' | 'REVEAL' | 'ERR'>('LOAD');
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [qi, setQi] = useState(0);
  const [sel, setSel] = useState(0);
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));
  const [wasCorrect, setWasCorrect] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const loadQuestions = useCallback(async () => {
    setPhase('LOAD');
    const historyKey = `trivia_${themeMode}`;
    const pool = isFnaf ? FNAF_TRIVIA_TOPICS : isAu ? AU_TRIVIA_TOPICS : TRIVIA_TOPICS;
    const topic = pickFreshTopic(historyKey, pool);
    try {
      const res = await fetch(apiUrl('/api/ai/trivia'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          topic,
          difficulty: 'Media-Alta',
          recentQuestions: getRecentAiItems(historyKey),
          theme: themeMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error IA');
      const rawList = Array.isArray(data.questions) ? (data.questions as TriviaQuestion[]) : [];
      if (rawList.length === 0) throw new Error('Sin preguntas');
      const list = filterFreshAiItems(historyKey, rawList, (q) => q.question, 50).slice(0, 5);
      setQuestions(list);
      setQi(0);
      setSel(0);
      setScores(Array(np).fill(0));
      setPhase('PLAY');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Error de conexión');
      setPhase('ERR');
    }
  }, [np, isFnaf, isAu, themeMode]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  const pi = qi % np;
  const currentQ = questions[qi];

  useEffect(() => {
    if (phase === 'ERR') setBg('#7f1d1d');
    else if (phase === 'REVEAL') setBg(wasCorrect ? '#16a34a' : '#7f1d1d');
    else if (phase === 'LOAD') setBg('#05070a');
    else setBg(PLAYER_STAGE_COLORS[pi % PLAYER_STAGE_COLORS.length]);
  }, [phase, wasCorrect, pi, setBg]);

  const confirmOpt = useCallback(
    (idx: number) => {
      if (!currentQ) return;
      const ok = idx === currentQ.correctIndex;
      setWasCorrect(ok);
      if (ok) {
        tone(784, 0.22);
        setScores((prev) => {
          const n = [...prev];
          n[pi] += 1;
          return n;
        });
      } else {
        tone(150, 0.35, 'sawtooth');
      }
      setPhase('REVEAL');
    },
    [currentQ, pi],
  );

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'ERR' && k === 'ok') {
        void loadQuestions();
        return;
      }
      if (phase === 'PLAY') {
        if (k === 'right') {
          setSel((s) => (s + 1) % 4);
          playControlClick();
        } else if (k === 'left') {
          setSel((s) => (s + 3) % 4);
          playControlClick();
        } else if (k === 'up' || k === 'down') {
          setSel((s) => (s + 2) % 4);
          playControlClick();
        } else if (k === 'ok') {
          confirmOpt(sel);
        }
      } else if (phase === 'REVEAL' && k === 'ok') {
        if (qi + 1 < questions.length) {
          setQi((i) => i + 1);
          setSel(0);
          setPhase('PLAY');
        } else {
          const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => scores[b] - scores[a]);
          onFinish(
            isFnaf ? 'Trivia FNAF IA' : isAu ? 'Trivia Skeld IA' : 'Trivia IA',
            rank,
            rank.map((p) => `${scores[p]} aciertos`),
            () => void loadQuestions(),
          );
        }
      }
    },
    [phase, sel, qi, questions.length, np, scores, isFnaf, isAu, confirmOpt, loadQuestions, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'LOAD') {
    return (
      <div className="stage-c">
        <div className="stage-big" style={{fontSize: '8vh'}}>
          {isFnaf
            ? '🐻 Sintonizando Trivia Fazbear…'
            : isAu
              ? '🛸 Cargando Trivia de The Skeld…'
              : 'Generando preguntas con IA…'}
        </div>
      </div>
    );
  }

  if (phase === 'ERR') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-big" style={{fontSize: '7vh'}}>
          Error al cargar trivia
        </div>
        <div className="stage-sub">{errMsg}</div>
        <div className="stage-hint">OK: reintentar · Atrás: menú</div>
      </div>
    );
  }

  if (!currentQ) return null;

  if (phase === 'REVEAL') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-big">{wasCorrect ? '¡Correcto!' : 'Incorrecto'}</div>
        <div className="stage-sub">
          Respuesta: {currentQ.options[currentQ.correctIndex]}
        </div>
        <div className="stage-sub" style={{fontSize: '3vh', opacity: 0.9}}>
          {currentQ.explanation}
        </div>
        <div className="stage-hint">OK: continuar</div>
      </div>
    );
  }

  return (
    <div className="stage-c">
      <div className="stage-sub">
        {players[pi].name} · {qi + 1}/{questions.length}
      </div>
      <div className="stage-big" style={{fontSize: 'clamp(1.5rem, 5.5vh, 3.2rem)'}}>
        {currentQ.question}
      </div>
      <div className="stage-opt-grid">
        {currentQ.options.map((o, i) => (
          <div
            key={i}
            onClick={() => confirmOpt(i)}
            className={`stage-opt ${sel === i ? 'sel' : ''}`}
          >
            {o}
          </div>
        ))}
      </div>
      <div className="stage-hint">▲▼◀▶ elegir · OK confirma</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 11. EL IMPOSTOR IA                                                         */
/* -------------------------------------------------------------------------- */

export function ImpostorIaStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const [phase, setPhase] = useState<'NEED3' | 'LOAD' | 'LOCK' | 'PEEK' | 'VOTE' | 'ERR'>(
    np < 3 ? 'NEED3' : 'LOAD',
  );
  const [round, setRound] = useState<ImpostorRound | null>(null);
  const [impIdx, setImpIdx] = useState(0);
  const [peekIdx, setPeekIdx] = useState(0);
  const [voteSel, setVoteSel] = useState(0);
  const [errMsg, setErrMsg] = useState('');

  const loadRound = useCallback(async () => {
    if (np < 3) {
      setPhase('NEED3');
      return;
    }
    setPhase('LOAD');
    const historyKey = `impostor_${themeMode}`;
    const vibePool = isFnaf
      ? [
          'Animatrónicos de FNAF 1, 2, 3 y 4',
          'Salas, cámaras y objetos de oficina FNAF',
          'Sister Location, Pizzeria Simulator y Security Breach',
        ]
      : isAu
        ? [
            'Salas y mapas de Among Us (Skeld, Mira HQ, Polus, Airship, Fungle)',
            'Tareas visuales, cables y sabotajes de Among Us',
            'Roles y mecánicas de tripulantes e impostores',
          ]
        : [
            'Lugares y viajes',
            'Comida y cocina',
            'Animales y naturaleza',
            'Profesiones y objetos cotidianos',
            'Deportes y pasatiempos',
          ];
    const vibe = pickFreshTopic(historyKey, vibePool);
    try {
      const res = await fetch(apiUrl('/api/ai/impostor'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          vibe,
          recentWords: getRecentAiItems(historyKey),
          theme: themeMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error IA');
      const loadedRound = data as ImpostorRound;
      if (loadedRound?.secretWord) {
        recordAiItems(historyKey, [loadedRound.secretWord], 45);
      }
      setRound(loadedRound);
      setImpIdx(Math.floor(Math.random() * np));
      setPeekIdx(0);
      setVoteSel(0);
      setPhase('LOCK');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Error de conexión');
      setPhase('ERR');
    }
  }, [np, isFnaf, isAu, themeMode]);

  useEffect(() => {
    void loadRound();
  }, [loadRound]);

  useEffect(() => {
    if (phase === 'LOCK' || phase === 'PEEK') {
      setBg(PLAYER_STAGE_COLORS[peekIdx % PLAYER_STAGE_COLORS.length]);
    } else if (phase === 'ERR' || phase === 'NEED3') {
      setBg('#7f1d1d');
    } else {
      setBg('#05070a');
    }
  }, [phase, peekIdx, setBg]);

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'NEED3') return;
      if (phase === 'ERR' && k === 'ok') {
        void loadRound();
        return;
      }
      if (phase === 'LOCK' && k === 'ok') {
        tone(520, 0.1);
        setPhase('PEEK');
      } else if (phase === 'PEEK' && k === 'ok') {
        tone(440, 0.08);
        if (peekIdx + 1 < np) {
          setPeekIdx((i) => i + 1);
          setPhase('LOCK');
        } else {
          setPhase('VOTE');
        }
      } else if (phase === 'VOTE') {
        if (k === 'right' || k === 'down') {
          setVoteSel((v) => (v + 1) % np);
          playControlClick();
        } else if (k === 'left' || k === 'up') {
          setVoteSel((v) => (v + np - 1) % np);
          playControlClick();
        } else if (k === 'ok') {
          const caught = voteSel === impIdx;
          const rank = caught
            ? [
                ...Array.from({length: np}, (_, i) => i).filter((i) => i !== impIdx),
                impIdx,
              ]
            : [
                impIdx,
                ...Array.from({length: np}, (_, i) => i).filter((i) => i !== impIdx),
              ];
          onFinish(
            caught
              ? isFnaf
                ? `🎭 ¡Animatrónico descubierto! Era ${players[impIdx].name}`
                : isAu
                  ? `🚀 ¡${players[impIdx].name} era El Impostor!`
                  : `¡Atrapado! Era ${players[impIdx].name}`
              : isFnaf
                ? `🦊 ¡Se coló en la oficina ${players[impIdx].name}!`
                : isAu
                  ? `🛸 ¡Ganó El Impostor ${players[impIdx].name}!`
                  : `¡Escapó ${players[impIdx].name}!`,
            rank,
            rank.map((p) =>
              p === impIdx
                ? `${isFnaf ? 'INFILTRADO' : 'IMPOSTOR'} (${round?.secretWord ?? ''})`
                : isFnaf
                  ? 'Guardia'
                  : isAu
                    ? 'Tripulante'
                    : 'Ciudadano',
            ),
            () => void loadRound(),
          );
        }
      }
    },
    [phase, peekIdx, np, voteSel, impIdx, players, round, isFnaf, isAu, loadRound, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'NEED3') {
    return (
      <div className="stage-c">
        <div className="stage-big" style={{fontSize: '8vh'}}>
          {isFnaf ? 'Mínimo 3 guardias' : isAu ? 'Mínimo 3 tripulantes' : 'Mínimo 3 jugadores'}
        </div>
        <div className="stage-sub">Cambia la cantidad de jugadores en el menú</div>
        <div className="stage-hint">Atrás: volver al menú</div>
      </div>
    );
  }

  if (phase === 'LOAD') {
    return (
      <div className="stage-c">
        <div className="stage-big" style={{fontSize: '8vh'}}>
          {isFnaf
            ? '🎭 Revisando cámaras de Fazbear…'
            : isAu
              ? '🛸 Asignando roles en The Skeld…'
              : 'Eligiendo palabra secreta…'}
        </div>
      </div>
    );
  }

  if (phase === 'ERR') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-big" style={{fontSize: '7vh'}}>
          Error al iniciar Impostor
        </div>
        <div className="stage-sub">{errMsg}</div>
        <div className="stage-hint">OK: reintentar · Atrás: menú</div>
      </div>
    );
  }

  if (phase === 'LOCK') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-sub">
          {isFnaf
            ? 'Solo el guardia de turno'
            : isAu
              ? 'Solo el tripulante de turno'
              : 'Que nadie más mire'}
        </div>
        <div className="stage-big">{players[peekIdx].name}</div>
        <div className="stage-hint">
          {isFnaf
            ? 'OK: revisar tu pase de seguridad'
            : isAu
              ? 'OK: ver tu rol en la nave'
              : 'OK: ver tu tarjeta secreta'}
        </div>
      </div>
    );
  }

  if (phase === 'PEEK' && round) {
    const isImp = peekIdx === impIdx;
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-sub">
          {isImp
            ? isFnaf
              ? 'Eres el ANIMATRÓNICO infiltrado'
              : 'Eres el IMPOSTOR'
            : `${isFnaf ? 'Clave de oficina' : isAu ? 'Tarea de la nave' : 'Palabra secreta'} (${round.category})`}
        </div>
        <div className="stage-big" style={{fontSize: '9vh'}}>
          {isImp ? `Pista: ${round.impostorHint}` : round.secretWord}
        </div>
        <div className="stage-hint">OK: ocultar y pasar</div>
      </div>
    );
  }

  return (
    <div className="stage-c">
      <div className="stage-sub">
        {isFnaf
          ? '🚨 Debatan y voten quién se coló en la oficina'
          : isAu
            ? '🚨 ¡Reunión de Emergencia! Voten quién será expulsado'
            : 'Debatan y voten al sospechoso'}
      </div>
      <div className="stage-sub" style={{fontSize: '3vh', opacity: 0.85}}>
        {round?.starterQuestion}
      </div>
      <div className="stage-opt-grid">
        {players.map((p, i) => (
          <div
            key={p.id}
            onClick={() => {
              setVoteSel(i);
              handleKey('ok');
            }}
            className={`stage-opt ${voteSel === i ? 'sel' : ''}`}
          >
            {p.name}
          </div>
        ))}
      </div>
      <div className="stage-hint">◀▶▲▼ elegir sospechoso · OK votar</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 12. DILEMA DEL SOFÁ IA                                                     */
/* -------------------------------------------------------------------------- */

export function DilemaIaStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const [phase, setPhase] = useState<'LOAD' | 'VOTE' | 'REVEAL' | 'ERR'>('LOAD');
  const [items, setItems] = useState<DilemmaItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [voterIdx, setVoterIdx] = useState(0);
  const [votes, setVotes] = useState<string[]>([]);
  const [errMsg, setErrMsg] = useState('');

  const load = useCallback(async () => {
    setPhase('LOAD');
    const historyKey = `dilema_${themeMode}`;
    try {
      const res = await fetch(apiUrl('/api/ai/dilemma'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          vibe: isFnaf
            ? 'Decisiones de guardia en Fazbear'
            : isAu
              ? 'Decisiones de tripulantes en The Skeld'
              : pickFreshTopic(historyKey, [
                  'Superpoderes cotidianos y fantasía',
                  'Viajes, comida y aventuras',
                  'Tecnología, escuela y familia',
                  'Situaciones absurdas y graciosas',
                ]),
          recentDilemmas: getRecentAiItems(historyKey),
          theme: themeMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error IA');
      const rawList = Array.isArray(data.dilemmas) ? (data.dilemmas as DilemmaItem[]) : [];
      if (rawList.length === 0) throw new Error('Sin dilemas');
      const list = filterFreshAiItems(historyKey, rawList, (d) => d.scenario, 40).slice(0, 4);
      setItems(list);
      setIdx(0);
      setVoterIdx(0);
      setVotes(Array(np).fill('A'));
      setPhase('VOTE');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Error de conexión');
      setPhase('ERR');
    }
  }, [np, isFnaf, isAu, themeMode]);

  useEffect(() => {
    void load();
  }, [load]);

  const current = items[idx];

  useEffect(() => {
    if (phase === 'VOTE') setBg(PLAYER_STAGE_COLORS[voterIdx % PLAYER_STAGE_COLORS.length]);
    else if (phase === 'ERR') setBg('#7f1d1d');
    else setBg('#05070a');
  }, [phase, voterIdx, setBg]);

  const pickChoice = useCallback(
    (ch: 'A' | 'B') => {
      tone(520, 0.08);
      const nextVotes = [...votes];
      nextVotes[voterIdx] = ch;
      setVotes(nextVotes);
      if (voterIdx + 1 < np) {
        setVoterIdx((v) => v + 1);
      } else {
        tone(784, 0.25);
        setPhase('REVEAL');
      }
    },
    [votes, voterIdx, np],
  );

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'ERR' && k === 'ok') void load();
      else if (phase === 'VOTE') {
        if (k === 'left') pickChoice('A');
        else if (k === 'right') pickChoice('B');
      } else if (phase === 'REVEAL' && k === 'ok') {
        if (idx + 1 < items.length) {
          setIdx((i) => i + 1);
          setVoterIdx(0);
          setPhase('VOTE');
        } else {
          const rank = Array.from({length: np}, (_, i) => i);
          onFinish(
            isFnaf ? 'Dilema del Guardia' : isAu ? 'Dilema Espacial' : 'Dilema del sofá',
            rank,
            rank.map(() =>
              isFnaf ? 'Turno sobrevivido' : isAu ? 'Misión debatida' : 'Debate completado',
            ),
            () => void load(),
          );
        }
      }
    },
    [phase, idx, items.length, np, isFnaf, isAu, load, pickChoice, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'LOAD') {
    return (
      <div className="stage-c">
        <div className="stage-big" style={{fontSize: '8vh'}}>
          {isFnaf
            ? '⚖️ Consultando manual del guardia…'
            : isAu
              ? '⚖️ Consultando bitácora de The Skeld…'
              : 'Creando dilemas con IA…'}
        </div>
      </div>
    );
  }
  if (phase === 'ERR') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-big" style={{fontSize: '7vh'}}>
          Error al cargar dilemas
        </div>
        <div className="stage-sub">{errMsg}</div>
        <div className="stage-hint">OK: reintentar</div>
      </div>
    );
  }
  if (!current) return null;

  if (phase === 'REVEAL') {
    const aCount = votes.filter((v) => v === 'A').length;
    const bCount = votes.filter((v) => v === 'B').length;
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-sub">{current.scenario}</div>
        <div className="stage-opt-grid">
          <div className="stage-opt">
            A ({aCount}): {current.optionA}
          </div>
          <div className="stage-opt">
            B ({bCount}): {current.optionB}
          </div>
        </div>
        <div className="stage-sub" style={{fontSize: '3.2vh', marginTop: '3vh'}}>
          {current.debateTip}
        </div>
        <div className="stage-hint">OK: siguiente dilema</div>
      </div>
    );
  }

  return (
    <div className="stage-c">
      <div className="stage-sub">Vota {players[voterIdx].name}</div>
      <div className="stage-big" style={{fontSize: '7vh'}}>
        {current.scenario}
      </div>
      <div className="stage-opt-grid">
        <div onClick={() => pickChoice('A')} className="stage-opt sel">
          ◀ {current.optionA}
        </div>
        <div onClick={() => pickChoice('B')} className="stage-opt sel">
          {current.optionB} ▶
        </div>
      </div>
      <div className="stage-hint">◀: Opción A · ▶: Opción B</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 13. CINE EN EMOJIS IA                                                      */
/* -------------------------------------------------------------------------- */

export function EmojiIaStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const [phase, setPhase] = useState<'LOAD' | 'PLAY' | 'REVEAL' | 'ERR'>('LOAD');
  const [puzzles, setPuzzles] = useState<EmojiPuzzle[]>([]);
  const [qi, setQi] = useState(0);
  const [sel, setSel] = useState(0);
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));
  const [wasOk, setWasOk] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const load = useCallback(async () => {
    setPhase('LOAD');
    const historyKey = `emoji_${themeMode}`;
    const catPool = isFnaf
      ? [
          'Personajes de FNAF 1, 2, 3 y 4',
          'Sister Location, Security Breach y FNAF 6',
          'Salas, objetos y mecánicas de FNAF',
        ]
      : isAu
        ? [
            'Tareas y sabotajes de Among Us',
            'Salas y mapas (Skeld, Polus, Mira HQ, Airship, Fungle)',
            'Roles y momentos icónicos de Among Us',
          ]
        : [
            'Películas animadas y familiares',
            'Series, videojuegos y superhéroes',
            'Películas de aventuras y ciencia ficción',
            'Cuentos, canciones y libros famosos',
          ];
    const category = pickFreshTopic(historyKey, catPool);
    try {
      const res = await fetch(apiUrl('/api/ai/emoji-quiz'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          category,
          recentTitles: getRecentAiItems(historyKey),
          theme: themeMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error IA');
      const rawList = Array.isArray(data.puzzles) ? (data.puzzles as EmojiPuzzle[]) : [];
      if (rawList.length === 0) throw new Error('Sin acertijos');
      const list = filterFreshAiItems(
        historyKey,
        rawList,
        (p) => p.options?.[p.correctIndex] ?? p.emojis,
        45,
      ).slice(0, 5);
      setPuzzles(list);
      setQi(0);
      setSel(0);
      setScores(Array(np).fill(0));
      setPhase('PLAY');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Error');
      setPhase('ERR');
    }
  }, [np, isFnaf, isAu, themeMode]);

  useEffect(() => {
    void load();
  }, [load]);

  const pi = qi % np;
  const current = puzzles[qi];

  useEffect(() => {
    if (phase === 'ERR') setBg('#7f1d1d');
    else if (phase === 'REVEAL') setBg(wasOk ? '#16a34a' : '#7f1d1d');
    else if (phase === 'LOAD') setBg('#05070a');
    else setBg(PLAYER_STAGE_COLORS[pi % PLAYER_STAGE_COLORS.length]);
  }, [phase, wasOk, pi, setBg]);

  const confirm = useCallback(
    (idx: number) => {
      if (!current) return;
      const ok = idx === current.correctIndex;
      setWasOk(ok);
      if (ok) {
        tone(784, 0.22);
        setScores((prev) => {
          const n = [...prev];
          n[pi] += 1;
          return n;
        });
      } else {
        tone(150, 0.35, 'sawtooth');
      }
      setPhase('REVEAL');
    },
    [current, pi],
  );

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'ERR' && k === 'ok') void load();
      else if (phase === 'PLAY') {
        if (k === 'right') {
          setSel((s) => (s + 1) % 4);
          playControlClick();
        } else if (k === 'left') {
          setSel((s) => (s + 3) % 4);
          playControlClick();
        } else if (k === 'up' || k === 'down') {
          setSel((s) => (s + 2) % 4);
          playControlClick();
        } else if (k === 'ok') {
          confirm(sel);
        }
      } else if (phase === 'REVEAL' && k === 'ok') {
        if (qi + 1 < puzzles.length) {
          setQi((i) => i + 1);
          setSel(0);
          setPhase('PLAY');
        } else {
          const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => scores[b] - scores[a]);
          onFinish(
            isFnaf ? 'FNAF en Emojis' : isAu ? 'Among Us en Emojis' : 'Cine en emojis',
            rank,
            rank.map((p) => `${scores[p]} aciertos`),
            () => void load(),
          );
        }
      }
    },
    [phase, sel, qi, puzzles.length, np, scores, isFnaf, isAu, load, confirm, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'LOAD') {
    return (
      <div className="stage-c">
        <div className="stage-big" style={{fontSize: '8vh'}}>
          {isFnaf
            ? '🍕 Descifrando códigos de Fazbear…'
            : isAu
              ? '🛸 Descifrando códigos de The Skeld…'
              : 'Combinando emojis con IA…'}
        </div>
      </div>
    );
  }
  if (phase === 'ERR') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-big" style={{fontSize: '7vh'}}>
          Error al cargar acertijos
        </div>
        <div className="stage-sub">{errMsg}</div>
        <div className="stage-hint">OK: reintentar</div>
      </div>
    );
  }
  if (!current) return null;

  if (phase === 'REVEAL') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-big">{wasOk ? '¡Acertaste!' : 'Incorrecto'}</div>
        <div className="stage-sub">Era: {current.options[current.correctIndex]}</div>
        <div className="stage-hint">OK: continuar</div>
      </div>
    );
  }

  return (
    <div className="stage-c">
      <div className="stage-sub">
        {players[pi].name} · {qi + 1}/{puzzles.length}
      </div>
      <div className="text-[12vh] leading-tight my-3">{current.emojis}</div>
      <div className="stage-opt-grid">
        {current.options.map((o, i) => (
          <div
            key={i}
            onClick={() => confirm(i)}
            className={`stage-opt ${sel === i ? 'sel' : ''}`}
          >
            {o}
          </div>
        ))}
      </div>
      <div className="stage-hint">▲▼◀▶ elegir · OK confirma</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 14. TRES PISTAS IA                                                         */
/* -------------------------------------------------------------------------- */

export function PistasIaStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const [phase, setPhase] = useState<'LOAD' | 'PLAY' | 'REVEAL' | 'ERR'>('LOAD');
  const [cards, setCards] = useState<ClueCard[]>([]);
  const [qi, setQi] = useState(0);
  const [cluesCount, setCluesCount] = useState(1);
  const [sel, setSel] = useState(0);
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));
  const [wasOk, setWasOk] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const load = useCallback(async () => {
    setPhase('LOAD');
    const historyKey = `pistas_${themeMode}`;
    const vibePool = isFnaf
      ? [
          'Animatrónicos clásicos y Toy de FNAF',
          'Salas, cámaras y objetos de oficina FNAF',
          'FNAF 3, 4, Sister Location y Security Breach',
        ]
      : isAu
        ? [
            'Mapas y salas de Among Us',
            'Tareas, botones y sabotajes de Among Us',
            'Roles especiales y mecánicas de Among Us',
          ]
        : [
            'Animales, naturaleza y planetas',
            'Inventos, países y monumentos',
            'Personajes históricos, deportes y música',
            'Comida, ciencia y objetos cotidianos',
          ];
    try {
      const res = await fetch(apiUrl('/api/ai/clues'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          vibe: pickFreshTopic(historyKey, vibePool),
          recentAnswers: getRecentAiItems(historyKey),
          theme: themeMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error IA');
      const rawList = Array.isArray(data.cards) ? (data.cards as ClueCard[]) : [];
      if (rawList.length === 0) throw new Error('Sin tarjetas');
      const list = filterFreshAiItems(historyKey, rawList, (c) => c.answer, 45).slice(0, 5);
      setCards(list);
      setQi(0);
      setCluesCount(1);
      setSel(0);
      setScores(Array(np).fill(0));
      setPhase('PLAY');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Error');
      setPhase('ERR');
    }
  }, [np, isFnaf, isAu, themeMode]);

  useEffect(() => {
    void load();
  }, [load]);

  const pi = qi % np;
  const current = cards[qi];

  useEffect(() => {
    if (phase === 'ERR') setBg('#7f1d1d');
    else if (phase === 'REVEAL') setBg(wasOk ? '#16a34a' : '#7f1d1d');
    else if (phase === 'LOAD') setBg('#05070a');
    else setBg(PLAYER_STAGE_COLORS[pi % PLAYER_STAGE_COLORS.length]);
  }, [phase, wasOk, pi, setBg]);

  const confirm = useCallback(
    (idx: number) => {
      if (!current) return;
      const ok = current.options[idx] === current.answer;
      setWasOk(ok);
      if (ok) {
        tone(784, 0.22);
        const pts = cluesCount === 1 ? 3 : cluesCount === 2 ? 2 : 1;
        setScores((prev) => {
          const n = [...prev];
          n[pi] += pts;
          return n;
        });
      } else {
        tone(150, 0.35, 'sawtooth');
      }
      setPhase('REVEAL');
    },
    [current, cluesCount, pi],
  );

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'ERR' && k === 'ok') void load();
      else if (phase === 'PLAY') {
        if (k === 'right') {
          setSel((s) => (s + 1) % 4);
          playControlClick();
        } else if (k === 'left') {
          setSel((s) => (s + 3) % 4);
          playControlClick();
        } else if (k === 'down') {
          setSel((s) => (s + 2) % 4);
          playControlClick();
        } else if (k === 'up') {
          if (cluesCount < 3) {
            setCluesCount((c) => c + 1);
            tone(520, 0.08);
          } else {
            setSel((s) => (s + 2) % 4);
          }
        } else if (k === 'ok') {
          confirm(sel);
        }
      } else if (phase === 'REVEAL' && k === 'ok') {
        if (qi + 1 < cards.length) {
          setQi((i) => i + 1);
          setCluesCount(1);
          setSel(0);
          setPhase('PLAY');
        } else {
          const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => scores[b] - scores[a]);
          onFinish(
            isFnaf ? '3 Pistas Fazbear' : isAu ? '3 Pistas Skeld' : 'Tres pistas IA',
            rank,
            rank.map((p) => `${scores[p]} pts`),
            () => void load(),
          );
        }
      }
    },
    [phase, cluesCount, sel, qi, cards.length, np, scores, isFnaf, isAu, load, confirm, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'LOAD') {
    return (
      <div className="stage-c">
        <div className="stage-big" style={{fontSize: '8vh'}}>
          {isFnaf
            ? '🔦 Recopilando pistas en cámaras…'
            : isAu
              ? '🛰️ Escaneando registros de The Skeld…'
              : 'Escribiendo pistas con IA…'}
        </div>
      </div>
    );
  }
  if (phase === 'ERR') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-big" style={{fontSize: '7vh'}}>
          Error al cargar pistas
        </div>
        <div className="stage-sub">{errMsg}</div>
        <div className="stage-hint">OK: reintentar</div>
      </div>
    );
  }
  if (!current) return null;

  if (phase === 'REVEAL') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-big">{wasOk ? '¡Correcto!' : 'Incorrecto'}</div>
        <div className="stage-sub">Respuesta: {current.answer}</div>
        <div className="stage-hint">OK: continuar</div>
      </div>
    );
  }

  return (
    <div className="stage-c">
      <div className="stage-sub">
        {players[pi].name} · {current.category}
      </div>
      <div className="space-y-2 mt-4 max-w-4xl mx-auto">
        {current.clues.slice(0, cluesCount).map((c, idx) => (
          <div key={idx} className="text-[3.4vh] font-bold">
            {idx + 1}. {c}
          </div>
        ))}
      </div>
      <div className="stage-opt-grid">
        {current.options.map((o, i) => (
          <div
            key={i}
            onClick={() => confirm(i)}
            className={`stage-opt ${sel === i ? 'sel' : ''}`}
          >
            {o}
          </div>
        ))}
      </div>
      <div className="stage-hint">
        ▲: otra pista ({cluesCount}/3) · ◀▶▼: elegir · OK: confirmar
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 15. ¿VERDAD O MITO? IA                                                     */
/* -------------------------------------------------------------------------- */

export function VerdadMitoIaStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const [phase, setPhase] = useState<'LOAD' | 'PLAY' | 'REVEAL' | 'ERR'>('LOAD');
  const [items, setItems] = useState<TrueFalseStatement[]>([]);
  const [qi, setQi] = useState(0);
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));
  const [wasOk, setWasOk] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const load = useCallback(async () => {
    setPhase('LOAD');
    const historyKey = `verdad_${themeMode}`;
    const topicPool = isFnaf
      ? [
          'Mecánicas y secretos de FNAF 1 y 2',
          'Historia, desarrollo y mitos de Scott Cawthon y FNAF 3-4',
          'Sister Location, Pizzeria Simulator y Security Breach',
        ]
      : isAu
        ? [
            'Mecánicas de tareas, fantasmas y sabotajes en Among Us',
            'Historia de Innersloth, mapas y actualizaciones de Among Us',
            'Mitos famosos y roles de Among Us',
          ]
        : [
            'Animales y naturaleza sorprendente',
            'Espacio, ciencia y cuerpo humano',
            'Historia, inventos y gastronomía mundial',
            'Cine, videojuegos y récords curiosos',
          ];
    try {
      const res = await fetch(apiUrl('/api/ai/true-false'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          topic: pickFreshTopic(historyKey, topicPool),
          recentStatements: getRecentAiItems(historyKey),
          theme: themeMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error IA');
      const rawList = Array.isArray(data.statements)
        ? (data.statements as TrueFalseStatement[])
        : [];
      if (rawList.length === 0) throw new Error('Sin afirmaciones');
      const list = filterFreshAiItems(historyKey, rawList, (s) => s.statement, 50).slice(0, 6);
      setItems(list);
      setQi(0);
      setScores(Array(np).fill(0));
      setPhase('PLAY');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Error');
      setPhase('ERR');
    }
  }, [np, isFnaf, isAu, themeMode]);

  useEffect(() => {
    void load();
  }, [load]);

  const pi = qi % np;
  const current = items[qi];

  useEffect(() => {
    if (phase === 'ERR') setBg('#7f1d1d');
    else if (phase === 'REVEAL') setBg(wasOk ? '#16a34a' : '#7f1d1d');
    else if (phase === 'LOAD') setBg('#05070a');
    else setBg(PLAYER_STAGE_COLORS[pi % PLAYER_STAGE_COLORS.length]);
  }, [phase, wasOk, pi, setBg]);

  const answer = useCallback(
    (choice: boolean) => {
      if (!current) return;
      const ok = choice === current.isTrue;
      setWasOk(ok);
      if (ok) {
        tone(784, 0.22);
        setScores((prev) => {
          const n = [...prev];
          n[pi] += 1;
          return n;
        });
      } else {
        tone(150, 0.35, 'sawtooth');
      }
      setPhase('REVEAL');
    },
    [current, pi],
  );

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'ERR' && k === 'ok') void load();
      else if (phase === 'PLAY') {
        if (k === 'left') answer(true);
        else if (k === 'right') answer(false);
      } else if (phase === 'REVEAL' && k === 'ok') {
        if (qi + 1 < items.length) {
          setQi((i) => i + 1);
          setPhase('PLAY');
        } else {
          const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => scores[b] - scores[a]);
          onFinish(
            isFnaf ? 'Mito o Realidad FNAF' : isAu ? 'Mito o Realidad Skeld' : 'Verdad o mito',
            rank,
            rank.map((p) => `${scores[p]} aciertos`),
            () => void load(),
          );
        }
      }
    },
    [phase, qi, items.length, np, scores, isFnaf, isAu, load, answer, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'LOAD') {
    return (
      <div className="stage-c">
        <div className="stage-big" style={{fontSize: '8vh'}}>
          {isFnaf
            ? '📋 Revisando archivos de Fazbear…'
            : isAu
              ? '📋 Revisando registros de The Skeld…'
              : 'Buscando datos curiosos…'}
        </div>
      </div>
    );
  }
  if (phase === 'ERR') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-big" style={{fontSize: '7vh'}}>
          Error al cargar datos
        </div>
        <div className="stage-sub">{errMsg}</div>
        <div className="stage-hint">OK: reintentar</div>
      </div>
    );
  }
  if (!current) return null;

  if (phase === 'REVEAL') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-big">
          {current.isTrue ? '¡VERDADERO!' : '¡MITO FALSO!'}
        </div>
        <div className="stage-sub" style={{fontSize: '3.4vh'}}>
          {current.explanation}
        </div>
        <div className="stage-hint">OK: continuar</div>
      </div>
    );
  }

  return (
    <div className="stage-c">
      <div className="stage-sub">
        {players[pi].name} · {qi + 1}/{items.length}
      </div>
      <div className="stage-big" style={{fontSize: 'clamp(1.6rem, 5.8vh, 3.4rem)'}}>
        “{current.statement}”
      </div>
      <div className="stage-opt-grid">
        <div onClick={() => answer(true)} className="stage-opt sel">
          ◀ VERDADERO
        </div>
        <div onClick={() => answer(false)} className="stage-opt sel">
          MITO FALSO ▶
        </div>
      </div>
      <div className="stage-hint">◀: Verdadero · ▶: Mito falso</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 16. HISTORIA EN CADENA IA                                                  */
/* -------------------------------------------------------------------------- */

export function HistoriaIaStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const [phase, setPhase] = useState<'LOAD' | 'CHOICE' | 'FINALE' | 'ERR'>('LOAD');
  const [chapter, setChapter] = useState(1);
  const [storyText, setStoryText] = useState('');
  const [choices, setChoices] = useState<string[]>([]);
  const [sel, setSel] = useState(0);
  const [ending, setEnding] = useState({title: '', text: '', rating: 8});
  const [errMsg, setErrMsg] = useState('');

  const startStory = useCallback(async () => {
    setPhase('LOAD');
    setChapter(1);
    setSel(0);
    const historyKey = `historia_${themeMode}`;
    const genre = isFnaf
      ? 'Turno nocturno en Freddy Fazbear Pizza'
      : isAu
        ? 'Aventura espacial en la nave The Skeld'
        : pickFreshTopic(historyKey, [
            'Comedia absurda en unas vacaciones',
            'Misterio gracioso en un museo',
            'Aventura en una isla llena de inventos',
            'Día caótico en un restaurante mágico',
          ]);
    try {
      const res = await fetch(apiUrl('/api/ai/story'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          step: 'START',
          genre,
          playerNames: players.map((p) => p.name),
          theme: themeMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error IA');
      setStoryText(String(data.paragraph || ''));
      setChoices(Array.isArray(data.choices) ? data.choices : []);
      setPhase('CHOICE');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Error');
      setPhase('ERR');
    }
  }, [players, isFnaf, isAu, themeMode]);

  useEffect(() => {
    void startStory();
  }, [startStory]);

  const pi = (chapter - 1) % np;

  useEffect(() => {
    if (phase === 'ERR') setBg('#7f1d1d');
    else if (phase === 'LOAD') setBg('#05070a');
    else if (phase === 'FINALE') setBg('#16a34a');
    else setBg(PLAYER_STAGE_COLORS[pi % PLAYER_STAGE_COLORS.length]);
  }, [phase, pi, setBg]);

  const pickTwist = useCallback(
    async (twist: string) => {
      tone(520, 0.1);
      setPhase('LOAD');
      const isLast = chapter >= 3;
      try {
        const res = await fetch(apiUrl('/api/ai/story'), {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            step: isLast ? 'FINISH' : 'NEXT',
            genre: isFnaf
              ? 'Turno nocturno en Freddy Fazbear Pizza'
              : isAu
                ? 'Aventura espacial en la nave The Skeld'
                : 'Comedia absurda',
            historySoFar: storyText,
            chosenTwist: twist,
            theme: themeMode,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error IA');
        if (isLast) {
          tone(784, 0.35);
          setEnding({
            title: String(
              data.episodeTitle ||
                (isFnaf ? '¡Llegaron las 6:00 AM!' : isAu ? '¡Victoria Tripulante!' : 'Final'),
            ),
            text: String(data.ending || ''),
            rating: Number(data.ratingOutOf10 || 8),
          });
          setPhase('FINALE');
        } else {
          setStoryText(String(data.paragraph || ''));
          setChoices(Array.isArray(data.choices) ? data.choices : []);
          setChapter((c) => c + 1);
          setSel(0);
          setPhase('CHOICE');
        }
      } catch (err) {
        setErrMsg(err instanceof Error ? err.message : 'Error');
        setPhase('ERR');
      }
    },
    [chapter, storyText, isFnaf, isAu, themeMode],
  );

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'ERR' && k === 'ok') void startStory();
      else if (phase === 'CHOICE') {
        if (k === 'down' || k === 'right') {
          setSel((s) => (s + 1) % Math.max(1, choices.length));
          playControlClick();
        } else if (k === 'up' || k === 'left') {
          setSel((s) => (s + Math.max(1, choices.length) - 1) % Math.max(1, choices.length));
          playControlClick();
        } else if (k === 'ok' && choices[sel]) {
          void pickTwist(choices[sel]);
        }
      } else if (phase === 'FINALE' && k === 'ok') {
        const rank = Array.from({length: np}, (_, i) => i);
        onFinish(
          ending.title,
          rank,
          rank.map(() => `Nota ${ending.rating}/10`),
          () => void startStory(),
        );
      }
    },
    [phase, choices, sel, np, ending, startStory, pickTwist, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'LOAD') {
    return (
      <div className="stage-c">
        <div className="stage-big" style={{fontSize: '8vh'}}>
          {isFnaf
            ? '🕰️ Avanzando el turno en Fazbear…'
            : isAu
              ? '🚀 Avanzando rumbo en The Skeld…'
              : 'Escribiendo escena con IA…'}
        </div>
      </div>
    );
  }
  if (phase === 'ERR') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-big" style={{fontSize: '7vh'}}>
          Error en la historia
        </div>
        <div className="stage-sub">{errMsg}</div>
        <div className="stage-hint">OK: reintentar</div>
      </div>
    );
  }
  if (phase === 'FINALE') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-sub">
          {isFnaf
            ? `🕰️ 6:00 AM · Turno completo · ${ending.rating}/10`
            : isAu
              ? `🚀 Misión completada · ${ending.rating}/10`
              : `Episodio completo · ${ending.rating}/10`}
        </div>
        <div className="stage-big" style={{fontSize: '7vh'}}>
          {ending.title}
        </div>
        <div className="stage-sub" style={{fontSize: '3.6vh', lineHeight: 1.35}}>
          {ending.text}
        </div>
        <div className="stage-hint">OK: terminar</div>
      </div>
    );
  }

  return (
    <div className="stage-c">
      <div className="stage-sub">
        {isFnaf
          ? `📹 Decide ${players[pi].name} · ${chapter === 1 ? '12:00 AM' : chapter === 2 ? '2:00 AM' : '4:00 AM'}`
          : isAu
            ? `🛰️ Decide ${players[pi].name} · Sector ${chapter}/3`
            : `Decide ${players[pi].name} · Capítulo ${chapter}/3`}
      </div>
      <div
        className="stage-sub"
        style={{fontSize: '3.6vh', maxWidth: '82vw', margin: '2vh auto', lineHeight: 1.3}}
      >
        {storyText}
      </div>
      <div className="space-y-2.5 max-w-4xl mx-auto mt-4">
        {choices.map((c, i) => (
          <div
            key={i}
            onClick={() => void pickTwist(c)}
            className={`stage-opt ${sel === i ? 'sel' : ''}`}
            style={{padding: '1.8vh 2vw', fontSize: '2.8vh'}}
          >
            {c}
          </div>
        ))}
      </div>
      <div className="stage-hint">▲▼ elegir giro · OK confirma</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 17. ¿QUIÉN ES MÁS PROBABLE QUE...? IA (FAMILIAR)                           */
/* -------------------------------------------------------------------------- */

export function MasProbableIaStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const [phase, setPhase] = useState<'LOAD' | 'VOTE' | 'REVEAL' | 'ERR'>('LOAD');
  const [prompts, setPrompts] = useState<MostLikelyPrompt[]>([]);
  const [qi, setQi] = useState(0);
  const [voterIdx, setVoterIdx] = useState(0);
  const [sel, setSel] = useState(0);
  const [votes, setVotes] = useState<number[]>([]);
  const [soloYesCount, setSoloYesCount] = useState(0);
  const [soloLastYes, setSoloLastYes] = useState(false);
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));
  const [crownedCounts, setCrownedCounts] = useState<number[]>(() => Array(np).fill(0));
  const [errMsg, setErrMsg] = useState('');

  const load = useCallback(async () => {
    setPhase('LOAD');
    const historyKey = `probable_${themeMode}`;
    try {
      const res = await fetch(apiUrl('/api/ai/most-likely'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          vibe: isFnaf
            ? 'Guardias nocturnos en Freddy Fazbear Pizza'
            : isAu
              ? 'Tripulantes e impostores en The Skeld'
              : pickFreshTopic(historyKey, [
                  'Costumbres en casa y familia',
                  'Viajes, comida y distracciones',
                  'Situaciones cómicas y manías diarias',
                ]),
          recentPrompts: getRecentAiItems(historyKey),
          theme: themeMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error IA');
      const rawList = Array.isArray(data.prompts) ? (data.prompts as MostLikelyPrompt[]) : [];
      if (rawList.length === 0) throw new Error('Sin preguntas');
      const list = filterFreshAiItems(historyKey, rawList, (p) => p.question, 45).slice(0, 5);
      setPrompts(list);
      setQi(0);
      setVoterIdx(0);
      setSel(0);
      setVotes(Array(np).fill(0));
      setSoloYesCount(0);
      setScores(Array(np).fill(0));
      setCrownedCounts(Array(np).fill(0));
      setPhase('VOTE');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Error de conexión');
      setPhase('ERR');
    }
  }, [np, isFnaf, isAu, themeMode]);

  useEffect(() => {
    void load();
  }, [load]);

  const current = prompts[qi];

  useEffect(() => {
    if (phase === 'VOTE') setBg(PLAYER_STAGE_COLORS[voterIdx % PLAYER_STAGE_COLORS.length]);
    else if (phase === 'ERR') setBg('#7f1d1d');
    else if (phase === 'REVEAL') setBg('#1d4ed8');
    else setBg('#05070a');
  }, [phase, voterIdx, setBg]);

  const confirmVote = useCallback(
    (chosenIdx: number) => {
      tone(520, 0.08);
      if (np === 1) {
        const isYes = chosenIdx === 0;
        setSoloLastYes(isYes);
        if (isYes) setSoloYesCount((c) => c + 1);
        tone(784, 0.2);
        setPhase('REVEAL');
        return;
      }

      const nextVotes = [...votes];
      nextVotes[voterIdx] = chosenIdx;
      setVotes(nextVotes);

      if (voterIdx + 1 < np) {
        setVoterIdx((v) => v + 1);
        setSel(0);
      } else {
        const counts = Array(np).fill(0);
        nextVotes.forEach((v) => {
          if (v >= 0 && v < np) counts[v] += 1;
        });
        const maxV = Math.max(...counts);
        const winners = counts
          .map((c, idx) => (c === maxV ? idx : -1))
          .filter((idx) => idx !== -1);

        setCrownedCounts((prev) => {
          const next = [...prev];
          winners.forEach((w) => {
            next[w] = (next[w] ?? 0) + 1;
          });
          return next;
        });
        setScores((prev) => {
          const next = [...prev];
          nextVotes.forEach((votedFor, vIdx) => {
            if (winners.includes(votedFor)) {
              next[vIdx] = (next[vIdx] ?? 0) + 1;
            }
          });
          return next;
        });

        tone(784, 0.25);
        setPhase('REVEAL');
      }
    },
    [np, votes, voterIdx],
  );

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'ERR' && k === 'ok') {
        void load();
        return;
      }
      if (phase === 'VOTE') {
        if (np === 1) {
          if (k === 'left') confirmVote(0);
          else if (k === 'right') confirmVote(1);
          return;
        }
        if (k === 'right') {
          setSel((s) => (s + 1) % np);
          playControlClick();
        } else if (k === 'left') {
          setSel((s) => (s + np - 1) % np);
          playControlClick();
        } else if (k === 'down') {
          setSel((s) => (s + Math.min(2, np)) % np);
          playControlClick();
        } else if (k === 'up') {
          setSel((s) => (s + np - Math.min(2, np)) % np);
          playControlClick();
        } else if (k === 'ok') {
          confirmVote(sel);
        }
      } else if (phase === 'REVEAL' && k === 'ok') {
        if (qi + 1 < prompts.length) {
          setQi((i) => i + 1);
          setVoterIdx(0);
          setSel(0);
          setVotes(Array(np).fill(0));
          setPhase('VOTE');
        } else if (np === 1) {
          onFinish(
            isFnaf
              ? '¿Quién sobrevive en Fazbear?'
              : isAu
                ? '¿Quién es más sospechoso?'
                : '¿Quién es más probable?',
            [0],
            [`${soloYesCount}/${prompts.length} veces tú`],
            () => void load(),
          );
        } else {
          const rank = Array.from({length: np}, (_, i) => i).sort(
            (a, b) => scores[b] - scores[a] || crownedCounts[b] - crownedCounts[a],
          );
          onFinish(
            isFnaf
              ? '¿Quién sobrevive en Fazbear?'
              : isAu
                ? '¿Quién es más sospechoso?'
                : '¿Quién es más probable?',
            rank,
            rank.map((p) => `${scores[p]} con mayoría · ${crownedCounts[p]} títulos`),
            () => void load(),
          );
        }
      }
    },
    [
      phase,
      np,
      sel,
      qi,
      prompts.length,
      soloYesCount,
      scores,
      crownedCounts,
      isFnaf,
      isAu,
      load,
      confirmVote,
      onFinish,
    ],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'LOAD') {
    return (
      <div className="stage-c">
        <div className="stage-big" style={{fontSize: '8vh'}}>
          {isFnaf
            ? '👀 Evaluando al equipo de guardia…'
            : isAu
              ? '🛸 Analizando coartadas de la tripulación…'
              : 'Pensando situaciones en familia…'}
        </div>
      </div>
    );
  }

  if (phase === 'ERR') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-big" style={{fontSize: '7vh'}}>
          Error al cargar preguntas
        </div>
        <div className="stage-sub">{errMsg}</div>
        <div className="stage-hint">OK: reintentar · Atrás: menú</div>
      </div>
    );
  }

  if (!current) return null;

  if (phase === 'REVEAL') {
    if (np === 1) {
      return (
        <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
          <div className="stage-sub">{current.question}</div>
          <div className="stage-big" style={{fontSize: '8vh', marginTop: '2vh'}}>
            {soloLastYes ? '¡Totalmente tú! 😄' : '¡Para nada! 😇'}
          </div>
          <div className="stage-sub" style={{fontSize: '3.2vh', opacity: 0.9}}>
            {current.funComment}
          </div>
          <div className="stage-hint">OK: siguiente pregunta</div>
        </div>
      );
    }

    const counts = Array(np).fill(0);
    votes.forEach((v) => {
      if (v >= 0 && v < np) counts[v] += 1;
    });
    const maxV = Math.max(...counts);
    const winners = counts
      .map((c, idx) => (c === maxV ? idx : -1))
      .filter((idx) => idx !== -1);
    const winnerNames = winners.map((w) => players[w]?.name).join(' y ');

    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-sub" style={{opacity: 0.9}}>
          {current.question}
        </div>
        <div className="stage-big" style={{fontSize: '8.5vh', marginTop: '2vh'}}>
          👉 {winnerNames}
        </div>
        <div className="stage-sub">
          {winners.length > 1 ? `Empate con ${maxV} votos` : `Elegido por mayoría (${maxV} votos)`}
        </div>
        <div className="stage-sub" style={{fontSize: '3vh', opacity: 0.85}}>
          {current.funComment}
        </div>
        <div className="stage-hint">OK: siguiente pregunta</div>
      </div>
    );
  }

  if (np === 1) {
    return (
      <div className="stage-c">
        <div className="stage-sub">
          {players[0].name} · {qi + 1}/{prompts.length}
        </div>
        <div className="stage-big" style={{fontSize: 'clamp(1.6rem, 5.8vh, 3.4rem)'}}>
          {current.question}
        </div>
        <div className="stage-opt-grid">
          <div onClick={() => confirmVote(0)} className="stage-opt sel">
            ◀ ¡Sí, soy yo!
          </div>
          <div onClick={() => confirmVote(1)} className="stage-opt sel">
            ¡Para nada! ▶
          </div>
        </div>
        <div className="stage-hint">◀: Sí, soy yo · ▶: Para nada</div>
      </div>
    );
  }

  return (
    <div className="stage-c">
      <div className="stage-sub">
        Vota {players[voterIdx].name} · {qi + 1}/{prompts.length}
      </div>
      <div className="stage-big" style={{fontSize: 'clamp(1.5rem, 5.4vh, 3.1rem)'}}>
        {current.question}
      </div>
      <div className="stage-opt-grid">
        {players.map((p, i) => (
          <div
            key={p.id}
            onClick={() => confirmVote(i)}
            className={`stage-opt ${sel === i ? 'sel' : ''}`}
          >
            {p.name}
          </div>
        ))}
      </div>
      <div className="stage-hint">◀▶▲▼ elegir familiar · OK votar (+1 pt si coincides con la mayoría)</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 18. YO NUNCA FAMILIAR IA                                                   */
/* -------------------------------------------------------------------------- */

export function YoNuncaIaStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const [phase, setPhase] = useState<'LOAD' | 'CONFESS' | 'REVEAL' | 'ERR'>('LOAD');
  const [items, setItems] = useState<NeverHaveIStatement[]>([]);
  const [qi, setQi] = useState(0);
  const [turnIdx, setTurnIdx] = useState(0);
  const [didItRound, setDidItRound] = useState<boolean[]>(() => Array(np).fill(false));
  const [innocentScores, setInnocentScores] = useState<number[]>(() => Array(np).fill(0));
  const [doneCounts, setDoneCounts] = useState<number[]>(() => Array(np).fill(0));
  const [errMsg, setErrMsg] = useState('');

  const load = useCallback(async () => {
    setPhase('LOAD');
    const historyKey = `yonunca_${themeMode}`;
    try {
      const res = await fetch(apiUrl('/api/ai/never-have-i'), {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          vibe: isFnaf
            ? 'Anécdotas y sustos jugando FNAF'
            : isAu
              ? 'Anécdotas graciosas jugando Among Us'
              : pickFreshTopic(historyKey, [
                  'Travesuras en casa y colegio',
                  'Comida, dulces y cocina',
                  'Viajes, tecnología y despistes',
                ]),
          recentStatements: getRecentAiItems(historyKey),
          theme: themeMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error IA');
      const rawList = Array.isArray(data.statements)
        ? (data.statements as NeverHaveIStatement[])
        : [];
      if (rawList.length === 0) throw new Error('Sin tarjetas');
      const list = filterFreshAiItems(historyKey, rawList, (s) => s.statement, 45).slice(0, 6);
      setItems(list);
      setQi(0);
      setTurnIdx(0);
      setDidItRound(Array(np).fill(false));
      setInnocentScores(Array(np).fill(0));
      setDoneCounts(Array(np).fill(0));
      setPhase('CONFESS');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Error de conexión');
      setPhase('ERR');
    }
  }, [np, isFnaf, isAu, themeMode]);

  useEffect(() => {
    void load();
  }, [load]);

  const current = items[qi];

  useEffect(() => {
    if (phase === 'CONFESS') setBg(PLAYER_STAGE_COLORS[turnIdx % PLAYER_STAGE_COLORS.length]);
    else if (phase === 'ERR') setBg('#7f1d1d');
    else if (phase === 'REVEAL') setBg('#0f766e');
    else setBg('#05070a');
  }, [phase, turnIdx, setBg]);

  const answer = useCallback(
    (didIt: boolean) => {
      tone(didIt ? 420 : 660, 0.1);
      const nextRound = [...didItRound];
      nextRound[turnIdx] = didIt;
      setDidItRound(nextRound);

      if (didIt) {
        setDoneCounts((prev) => {
          const next = [...prev];
          next[turnIdx] = (next[turnIdx] ?? 0) + 1;
          return next;
        });
      } else {
        setInnocentScores((prev) => {
          const next = [...prev];
          next[turnIdx] = (next[turnIdx] ?? 0) + 1;
          return next;
        });
      }

      if (turnIdx + 1 < np) {
        setTurnIdx((t) => t + 1);
      } else {
        tone(784, 0.22);
        setPhase('REVEAL');
      }
    },
    [didItRound, turnIdx, np],
  );

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'ERR' && k === 'ok') {
        void load();
        return;
      }
      if (phase === 'CONFESS') {
        if (k === 'left') answer(true);
        else if (k === 'right') answer(false);
      } else if (phase === 'REVEAL' && k === 'ok') {
        if (qi + 1 < items.length) {
          setQi((i) => i + 1);
          setTurnIdx(0);
          setDidItRound(Array(np).fill(false));
          setPhase('CONFESS');
        } else {
          const rank = Array.from({length: np}, (_, i) => i).sort(
            (a, b) => innocentScores[b] - innocentScores[a],
          );
          onFinish(
            isFnaf ? 'Yo nunca nocturno' : isAu ? 'Yo nunca tripulante' : 'Yo nunca (Familiar)',
            rank,
            rank.map((p) => `${innocentScores[p]} inocentes · ${doneCounts[p]} sí`),
            () => void load(),
          );
        }
      }
    },
    [phase, qi, items.length, np, innocentScores, doneCounts, isFnaf, isAu, answer, load, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'LOAD') {
    return (
      <div className="stage-c">
        <div className="stage-big" style={{fontSize: '8vh'}}>
          {isFnaf
            ? '🕯️ Preparando confesiones del turno…'
            : isAu
              ? '🛸 Preparando confesiones en Cafetería…'
              : 'Preparando confesiones familiares…'}
        </div>
      </div>
    );
  }

  if (phase === 'ERR') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-big" style={{fontSize: '7vh'}}>
          Error al cargar tarjetas
        </div>
        <div className="stage-sub">{errMsg}</div>
        <div className="stage-hint">OK: reintentar · Atrás: menú</div>
      </div>
    );
  }

  if (!current) return null;

  if (phase === 'REVEAL') {
    const confessors = players.filter((_, idx) => didItRound[idx]).map((p) => p.name);
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-sub" style={{opacity: 0.9}}>
          {current.statement}
        </div>
        <div className="stage-big" style={{fontSize: '7.5vh', marginTop: '2.2vh'}}>
          {confessors.length === 0
            ? '😇 ¡Nadie lo ha hecho!'
            : confessors.length === np
              ? '😂 ¡Todos culpables!'
              : `🙋 Sí lo hicieron: ${confessors.join(', ')}`}
        </div>
        <div className="stage-sub" style={{fontSize: '3.2vh', opacity: 0.92}}>
          {current.followUp}
        </div>
        <div className="stage-hint">OK: siguiente tarjeta</div>
      </div>
    );
  }

  return (
    <div className="stage-c">
      <div className="stage-sub">
        Responde {players[turnIdx].name} · {current.category} · {qi + 1}/{items.length}
      </div>
      <div className="stage-big" style={{fontSize: 'clamp(1.6rem, 5.8vh, 3.4rem)'}}>
        “{current.statement}”
      </div>
      <div className="stage-opt-grid">
        <div onClick={() => answer(true)} className="stage-opt sel">
          ◀ 🙋 ¡Sí lo he hecho!
        </div>
        <div onClick={() => answer(false)} className="stage-opt sel">
          😇 ¡Yo nunca! ▶
        </div>
      </div>
      <div className="stage-hint">◀: Sí lo hice · ▶: Yo nunca</div>
    </div>
  );
}
