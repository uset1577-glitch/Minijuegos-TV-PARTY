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
import {
  StorySessionEngine,
  createStorySession,
  generateDilemmas,
  generateMostLikelyPrompts,
  generateNeverHaveI,
  generateWheelChallenges,
} from '../../data/partyChallengesBank';
import {
  getClueBatch,
  getEmojiBatch,
  getImpostorRound,
  getTriviaBatch,
  getTrueFalseBatch,
} from '../../data/quizKnowledgeBank';
import {
  DIFFICULTY_META,
  PLAYER_STAGE_COLORS,
  RemoteKey,
  StageGameProps,
  playControlClick,
  tone,
} from '../../utils/stageAudio';

/* -------------------------------------------------------------------------- */
/* 9. RULETA DE RETOS (MILES DE RETOS SIN CONEXIÓN)                           */
/* -------------------------------------------------------------------------- */

const WHEEL_CATS = ['Mímica', 'Verdad', 'Improvisa', 'Físico', 'Votación', 'Talento', 'Comodín'];
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
  difficulty = 'normal',
  onAwardSingle,
}: StageGameProps & {onAwardSingle: (playerIdx: number, pts: number) => void}) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const activeVibes = isFnaf ? FNAF_VIBES : isAu ? AU_VIBES : VIBES;
  const activeCats = isFnaf ? FNAF_WHEEL_CATS : isAu ? AU_WHEEL_CATS : WHEEL_CATS;
  const np = players.length;
  const secLimit = difficulty === 'easy' ? 0 : difficulty === 'hard' ? 8 : 14;
  const ptsReward = difficulty === 'hard' ? 3 : 2;
  const [phase, setPhase] = useState<'SPIN' | 'SHOW'>('SPIN');
  const [vibeIdx, setVibeIdx] = useState(0);
  const [spinColorIdx, setSpinColorIdx] = useState(0);
  const [targetPlayer, setTargetPlayer] = useState(0);
  const [challengeText, setChallengeText] = useState('');
  const [challengeTitle, setChallengeTitle] = useState('');
  const [timeLeft, setTimeLeft] = useState(secLimit);
  const [timedOut, setTimedOut] = useState(false);

  const lastPlayerRef = useRef(-1);
  const ivRef = useRef<number | null>(null);
  const spinTimeoutRef = useRef<number | null>(null);
  const showClockRef = useRef<number | null>(null);
  const queueRef = useRef<Array<{title: string; challenge: string}>>([]);
  const queueVibeRef = useRef(-1);
  const historyKey = `ruleta_${themeMode}`;

  const stopSpin = () => {
    if (ivRef.current) window.clearInterval(ivRef.current);
    if (spinTimeoutRef.current) window.clearTimeout(spinTimeoutRef.current);
    if (showClockRef.current) window.clearInterval(showClockRef.current);
  };
  useEffect(() => stopSpin, []);

  const launchSpin = useCallback(
    (chosenVibeIdx: number) => {
      stopSpin();
      setTimedOut(false);
      setTimeLeft(secLimit);
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
        tone(300 + tick * 14, 0.04);
      }, 95);

      if (queueVibeRef.current !== chosenVibeIdx || queueRef.current.length === 0) {
        queueVibeRef.current = chosenVibeIdx;
        const cat = activeCats[Math.floor(Math.random() * activeCats.length)];
        queueRef.current = generateWheelChallenges(
          themeMode,
          cat,
          activeVibes[chosenVibeIdx],
          historyKey,
        );
      }

      const nextItem = queueRef.current.shift() ?? {
        title: activeCats[0],
        challenge: 'Cuenta un chiste rápido en menos de 10 segundos.',
      };

      spinTimeoutRef.current = window.setTimeout(() => {
        stopSpin();
        setChallengeTitle(nextItem.title);
        setChallengeText(nextItem.challenge);
        tone(784, 0.3);
        setPhase('SHOW');

        if (secLimit > 0) {
          const endAt = Date.now() + secLimit * 1000;
          setTimeLeft(secLimit);
          showClockRef.current = window.setInterval(() => {
            const rem = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
            setTimeLeft(rem);
            if (Date.now() >= endAt) {
              if (showClockRef.current) window.clearInterval(showClockRef.current);
              showClockRef.current = null;
              setTimedOut(true);
              tone(130, 0.3, 'sawtooth');
            }
          }, 150);
        }
      }, 520);
    },
    [np, activeCats, activeVibes, themeMode, historyKey, secLimit],
  );

  useEffect(() => {
    launchSpin(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase === 'SHOW' && timedOut) setBg('#7f1d1d');
    else if (phase === 'SPIN') setBg(PLAYER_STAGE_COLORS[spinColorIdx % PLAYER_STAGE_COLORS.length]);
    else setBg(PLAYER_STAGE_COLORS[targetPlayer % PLAYER_STAGE_COLORS.length]);
  }, [phase, timedOut, spinColorIdx, targetPlayer, setBg]);

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'SPIN') return;
      if (k === 'ok') {
        launchSpin(vibeIdx);
      } else if (k === 'up' && phase === 'SHOW' && !timedOut) {
        onAwardSingle(targetPlayer, ptsReward);
        tone(784, 0.25);
        launchSpin(vibeIdx);
      } else if (k === 'right' || k === 'left') {
        const nextV =
          k === 'right'
            ? (vibeIdx + 1) % activeVibes.length
            : (vibeIdx + activeVibes.length - 1) % activeVibes.length;
        setVibeIdx(nextV);
        playControlClick();
        launchSpin(nextV);
      }
    },
    [phase, timedOut, vibeIdx, activeVibes.length, targetPlayer, ptsReward, launchSpin, onAwardSingle],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

  if (phase === 'SPIN') {
    return (
      <div className="stage-c">
        <div className="stage-sub">
          {isFnaf ? '🍕 Girando Ruleta Fazbear…' : isAu ? '🚀 Girando Ruleta Skeld…' : '🎡 Girando la ruleta…'} ({activeVibes[vibeIdx]})
        </div>
        <div className="stage-big" style={{fontSize: '8vh', marginTop: '3vh'}}>
          {isFnaf ? 'Asignando reto del turno' : isAu ? 'Asignando tarea espacial' : 'Eligiendo jugador y reto'}
        </div>
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
            : `Le toca a · ${activeVibes[vibeIdx]}`}{' '}
        · {DIFFICULTY_META[difficulty].emoji} {DIFFICULTY_META[difficulty].label}
        {secLimit > 0 && ` · ⏱️ ${timeLeft}s`}
      </div>
      <div className="stage-big">{players[targetPlayer].name}</div>
      <div className="stage-sub" style={{opacity: 0.9}}>
        {timedOut ? '⏰ ¡Se acabó el tiempo del reto!' : challengeTitle}
      </div>
      <div
        className="stage-big"
        style={{fontSize: 'clamp(1.4rem, 5.2vh, 3rem)', marginTop: '3vh', lineHeight: 1.25}}
      >
        {challengeText}
      </div>
      {secLimit > 0 && (
        <div className="stage-barw" style={{marginTop: '2.5vh', height: '1.6vh'}}>
          <div
            className="stage-barf"
            style={{
              width: `${(timeLeft / secLimit) * 100}%`,
              background: timeLeft <= 3 ? '#ef4444' : '#ffffff',
            }}
          />
        </div>
      )}
      <div className="stage-hint">
        {timedOut
          ? 'OK: girar otro reto · ◀▶: ambiente · Atrás: menú'
          : `▲: cumplido (+${ptsReward} pts) · OK: otro reto · ◀▶: ambiente · Atrás: menú`}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 10. TRIVIA RELÁMPAGO (CLÁSICO, FNAF Y CANON AMONG US)                       */
/* -------------------------------------------------------------------------- */

export function TriviaIaStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
  difficulty = 'normal',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const count = difficulty === 'easy' ? 4 : difficulty === 'hard' ? 7 : 5;
  const secLimit = difficulty === 'easy' ? 20 : difficulty === 'hard' ? 7 : 12;
  const historyKey = `trivia_${themeMode}`;

  const [questions, setQuestions] = useState<TriviaQuestion[]>(() =>
    getTriviaBatch(themeMode, historyKey, count),
  );
  const [phase, setPhase] = useState<'PLAY' | 'REVEAL'>('PLAY');
  const [qi, setQi] = useState(0);
  const [sel, setSel] = useState(0);
  const [timeLeft, setTimeLeft] = useState(secLimit);
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));
  const [wasCorrect, setWasCorrect] = useState(false);

  const reloadQuestions = useCallback(() => {
    setQuestions(getTriviaBatch(themeMode, historyKey, count));
    setQi(0);
    setSel(0);
    setTimeLeft(secLimit);
    setScores(Array(np).fill(0));
    setPhase('PLAY');
  }, [themeMode, historyKey, np, count, secLimit]);

  const pi = qi % np;
  const currentQ = questions[qi];

  useEffect(() => {
    if (phase === 'REVEAL') setBg(wasCorrect ? '#16a34a' : '#7f1d1d');
    else setBg(PLAYER_STAGE_COLORS[pi % PLAYER_STAGE_COLORS.length]);
  }, [phase, wasCorrect, pi, setBg]);

  useEffect(() => {
    if (phase !== 'PLAY') return;
    setTimeLeft(secLimit);
    const endAt = Date.now() + secLimit * 1000;
    const iv = window.setInterval(() => {
      const rem = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setTimeLeft(rem);
      if (Date.now() >= endAt) {
        window.clearInterval(iv);
        setWasCorrect(false);
        tone(150, 0.35, 'sawtooth');
        setPhase('REVEAL');
      }
    }, 150);
    return () => window.clearInterval(iv);
  }, [phase, qi, secLimit]);

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
            isFnaf ? 'Trivia Fazbear' : isAu ? 'Trivia de Skeld' : 'Trivia Relámpago',
            rank,
            rank.map((p) => `${scores[p]} aciertos`),
            reloadQuestions,
          );
        }
      }
    },
    [phase, sel, qi, questions.length, np, scores, isFnaf, isAu, confirmOpt, reloadQuestions, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

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
        {players[pi].name} · {qi + 1}/{questions.length} · {DIFFICULTY_META[difficulty].emoji}{' '}
        {DIFFICULTY_META[difficulty].label} · ⏱️ {timeLeft}s
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
/* 11. EL IMPOSTOR SECRETO                                                    */
/* -------------------------------------------------------------------------- */

export function ImpostorIaStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
  difficulty = 'normal',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const voteSecs = difficulty === 'easy' ? 45 : difficulty === 'hard' ? 15 : 25;
  const historyKey = `impostor_${themeMode}`;

  const [phase, setPhase] = useState<'NEED3' | 'LOCK' | 'PEEK' | 'VOTE'>(
    np < 3 ? 'NEED3' : 'LOCK',
  );
  const [round, setRound] = useState<ImpostorRound>(() => getImpostorRound(themeMode, historyKey));
  const [impIdx, setImpIdx] = useState(() => Math.floor(Math.random() * Math.max(1, np)));
  const [peekIdx, setPeekIdx] = useState(0);
  const [voteSel, setVoteSel] = useState(0);
  const [voteTimeLeft, setVoteTimeLeft] = useState(voteSecs);

  const voteSelRef = useRef(0);
  voteSelRef.current = voteSel;

  const reloadRound = useCallback(() => {
    if (np < 3) {
      setPhase('NEED3');
      return;
    }
    setRound(getImpostorRound(themeMode, historyKey));
    setImpIdx(Math.floor(Math.random() * np));
    setPeekIdx(0);
    setVoteSel(0);
    setVoteTimeLeft(voteSecs);
    setPhase('LOCK');
  }, [np, themeMode, historyKey, voteSecs]);

  useEffect(() => {
    if (phase === 'LOCK' || phase === 'PEEK') {
      setBg(PLAYER_STAGE_COLORS[peekIdx % PLAYER_STAGE_COLORS.length]);
    } else if (phase === 'NEED3') {
      setBg('#7f1d1d');
    } else {
      setBg('#05070a');
    }
  }, [phase, peekIdx, setBg]);

  const finishVote = useCallback(
    (chosenVote: number) => {
      const caught = chosenVote === impIdx;
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
            ? `${isFnaf ? 'INFILTRADO' : 'IMPOSTOR'} (${round.secretWord})`
            : isFnaf
              ? 'Guardia'
              : isAu
                ? 'Tripulante'
                : 'Ciudadano',
        ),
        reloadRound,
      );
    },
    [impIdx, np, players, round, isFnaf, isAu, reloadRound, onFinish],
  );

  useEffect(() => {
    if (phase !== 'VOTE') return;
    setVoteTimeLeft(voteSecs);
    const endAt = Date.now() + voteSecs * 1000;
    const iv = window.setInterval(() => {
      const rem = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setVoteTimeLeft(rem);
      if (Date.now() >= endAt) {
        window.clearInterval(iv);
        finishVote(voteSelRef.current);
      }
    }, 150);
    return () => window.clearInterval(iv);
  }, [phase, voteSecs, finishVote]);

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'NEED3') return;
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
          finishVote(voteSel);
        }
      }
    },
    [phase, peekIdx, np, voteSel, finishVote],
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

  if (phase === 'LOCK') {
    return (
      <div className="stage-c cursor-pointer" onClick={() => handleKey('ok')}>
        <div className="stage-sub">
          {isFnaf
            ? 'Solo el guardia de turno'
            : isAu
              ? 'Solo el tripulante de turno'
              : 'Que nadie más mire'}{' '}
          · {DIFFICULTY_META[difficulty].emoji} {DIFFICULTY_META[difficulty].label}
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

  if (phase === 'PEEK') {
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
        <div className="stage-big" style={{fontSize: difficulty === 'hard' && isImp ? '6.5vh' : '9vh'}}>
          {isImp
            ? difficulty === 'hard'
              ? `Categoría: ${round.category} (sin pista)`
              : `Pista: ${round.impostorHint}`
            : round.secretWord}
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
            : 'Debatan y voten al sospechoso'}{' '}
        · ⏱️ {voteTimeLeft}s
      </div>
      <div className="stage-sub" style={{fontSize: '3vh', opacity: 0.85}}>
        {round.starterQuestion}
      </div>
      <div className="stage-opt-grid">
        {players.map((p, i) => (
          <div
            key={p.id}
            onClick={() => {
              setVoteSel(i);
              finishVote(i);
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
/* 12. ¿QUÉ PREFIERES? / DILEMA DEL SOFÁ                                      */
/* -------------------------------------------------------------------------- */

export function DilemaIaStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
  difficulty = 'normal',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const count = difficulty === 'easy' ? 3 : difficulty === 'hard' ? 5 : 4;
  const secLimit = difficulty === 'easy' ? 0 : difficulty === 'hard' ? 6 : 10;
  const historyKey = `dilema_${themeMode}`;

  const [items, setItems] = useState<DilemmaItem[]>(() =>
    generateDilemmas(themeMode, historyKey, count),
  );
  const [phase, setPhase] = useState<'VOTE' | 'REVEAL'>('VOTE');
  const [idx, setIdx] = useState(0);
  const [voterIdx, setVoterIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(secLimit);
  const [votes, setVotes] = useState<string[]>(() => Array(np).fill('A'));

  const reloadDilemmas = useCallback(() => {
    setItems(generateDilemmas(themeMode, historyKey, count));
    setIdx(0);
    setVoterIdx(0);
    setTimeLeft(secLimit);
    setVotes(Array(np).fill('A'));
    setPhase('VOTE');
  }, [themeMode, historyKey, np, count, secLimit]);

  const current = items[idx];

  useEffect(() => {
    if (phase === 'VOTE') setBg(PLAYER_STAGE_COLORS[voterIdx % PLAYER_STAGE_COLORS.length]);
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

  useEffect(() => {
    if (phase !== 'VOTE' || secLimit <= 0) return;
    setTimeLeft(secLimit);
    const endAt = Date.now() + secLimit * 1000;
    const iv = window.setInterval(() => {
      const rem = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setTimeLeft(rem);
      if (Date.now() >= endAt) {
        window.clearInterval(iv);
        pickChoice(Math.random() < 0.5 ? 'A' : 'B');
      }
    }, 150);
    return () => window.clearInterval(iv);
  }, [phase, idx, voterIdx, secLimit, pickChoice]);

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'VOTE') {
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
            isFnaf ? 'Dilema del Guardia' : isAu ? 'Dilema Espacial' : '¿Qué Prefieres?',
            rank,
            rank.map(() =>
              isFnaf ? 'Turno sobrevivido' : isAu ? 'Misión debatida' : 'Debate completado',
            ),
            reloadDilemmas,
          );
        }
      }
    },
    [phase, idx, items.length, np, isFnaf, isAu, reloadDilemmas, pickChoice, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

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
      <div className="stage-sub">
        Vota {players[voterIdx].name} · {idx + 1}/{items.length} · {DIFFICULTY_META[difficulty].emoji}{' '}
        {DIFFICULTY_META[difficulty].label}
        {secLimit > 0 && ` · ⏱️ ${timeLeft}s`}
      </div>
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
/* 13. CINE / MISIONES EN EMOJIS                                              */
/* -------------------------------------------------------------------------- */

export function EmojiIaStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
  difficulty = 'normal',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const count = difficulty === 'easy' ? 4 : difficulty === 'hard' ? 7 : 5;
  const secLimit = difficulty === 'easy' ? 20 : difficulty === 'hard' ? 6 : 11;
  const historyKey = `emoji_${themeMode}`;

  const [puzzles, setPuzzles] = useState<EmojiPuzzle[]>(() =>
    getEmojiBatch(themeMode, historyKey, count),
  );
  const [phase, setPhase] = useState<'PLAY' | 'REVEAL'>('PLAY');
  const [qi, setQi] = useState(0);
  const [sel, setSel] = useState(0);
  const [timeLeft, setTimeLeft] = useState(secLimit);
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));
  const [wasOk, setWasOk] = useState(false);

  const reloadPuzzles = useCallback(() => {
    setPuzzles(getEmojiBatch(themeMode, historyKey, count));
    setQi(0);
    setSel(0);
    setTimeLeft(secLimit);
    setScores(Array(np).fill(0));
    setPhase('PLAY');
  }, [themeMode, historyKey, np, count, secLimit]);

  const pi = qi % np;
  const current = puzzles[qi];

  useEffect(() => {
    if (phase === 'REVEAL') setBg(wasOk ? '#16a34a' : '#7f1d1d');
    else setBg(PLAYER_STAGE_COLORS[pi % PLAYER_STAGE_COLORS.length]);
  }, [phase, wasOk, pi, setBg]);

  useEffect(() => {
    if (phase !== 'PLAY') return;
    setTimeLeft(secLimit);
    const endAt = Date.now() + secLimit * 1000;
    const iv = window.setInterval(() => {
      const rem = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setTimeLeft(rem);
      if (Date.now() >= endAt) {
        window.clearInterval(iv);
        setWasOk(false);
        tone(150, 0.35, 'sawtooth');
        setPhase('REVEAL');
      }
    }, 150);
    return () => window.clearInterval(iv);
  }, [phase, qi, secLimit]);

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
            isFnaf ? 'FNAF en Emojis' : isAu ? 'Skeld en Emojis' : 'Cine en Emojis',
            rank,
            rank.map((p) => `${scores[p]} aciertos`),
            reloadPuzzles,
          );
        }
      }
    },
    [phase, sel, qi, puzzles.length, np, scores, isFnaf, isAu, reloadPuzzles, confirm, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

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
        {players[pi].name} · {qi + 1}/{puzzles.length} · {DIFFICULTY_META[difficulty].emoji}{' '}
        {DIFFICULTY_META[difficulty].label} · ⏱️ {timeLeft}s
      </div>
      {difficulty === 'easy' && current.hint && (
        <div className="stage-sub" style={{fontSize: '2.4vh', opacity: 0.85, marginTop: '0.5vh'}}>
          Pista: {current.hint}
        </div>
      )}
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
/* 14. TRES PISTAS                                                            */
/* -------------------------------------------------------------------------- */

export function PistasIaStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
  difficulty = 'normal',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const count = difficulty === 'easy' ? 4 : difficulty === 'hard' ? 6 : 5;
  const maxClues = difficulty === 'hard' ? 2 : 3;
  const secLimit = difficulty === 'easy' ? 20 : difficulty === 'hard' ? 7 : 12;
  const historyKey = `pistas_${themeMode}`;

  const [cards, setCards] = useState<ClueCard[]>(() => getClueBatch(themeMode, historyKey, count));
  const [phase, setPhase] = useState<'PLAY' | 'REVEAL'>('PLAY');
  const [qi, setQi] = useState(0);
  const [cluesCount, setCluesCount] = useState(1);
  const [sel, setSel] = useState(0);
  const [timeLeft, setTimeLeft] = useState(secLimit);
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));
  const [wasOk, setWasOk] = useState(false);

  const reloadCards = useCallback(() => {
    setCards(getClueBatch(themeMode, historyKey, count));
    setQi(0);
    setCluesCount(1);
    setSel(0);
    setTimeLeft(secLimit);
    setScores(Array(np).fill(0));
    setPhase('PLAY');
  }, [themeMode, historyKey, np, count, secLimit]);

  const pi = qi % np;
  const current = cards[qi];

  useEffect(() => {
    if (phase === 'REVEAL') setBg(wasOk ? '#16a34a' : '#7f1d1d');
    else setBg(PLAYER_STAGE_COLORS[pi % PLAYER_STAGE_COLORS.length]);
  }, [phase, wasOk, pi, setBg]);

  useEffect(() => {
    if (phase !== 'PLAY') return;
    setTimeLeft(secLimit);
    const endAt = Date.now() + secLimit * 1000;
    const iv = window.setInterval(() => {
      const rem = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setTimeLeft(rem);
      if (Date.now() >= endAt) {
        window.clearInterval(iv);
        setWasOk(false);
        tone(150, 0.35, 'sawtooth');
        setPhase('REVEAL');
      }
    }, 150);
    return () => window.clearInterval(iv);
  }, [phase, qi, secLimit]);

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
      if (phase === 'PLAY') {
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
          if (cluesCount < maxClues) {
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
            isFnaf ? '3 Pistas Fazbear' : isAu ? '3 Pistas de Nave' : 'Tres Pistas',
            rank,
            rank.map((p) => `${scores[p]} pts`),
            reloadCards,
          );
        }
      }
    },
    [phase, cluesCount, maxClues, sel, qi, cards.length, np, scores, isFnaf, isAu, reloadCards, confirm, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

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
        {players[pi].name} · {current.category} · {qi + 1}/{cards.length} ·{' '}
        {DIFFICULTY_META[difficulty].emoji} {DIFFICULTY_META[difficulty].label} · ⏱️ {timeLeft}s
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
        ▲: otra pista ({cluesCount}/{maxClues}) · ◀▶▼: elegir · OK: confirmar
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 15. ¿VERDAD O MITO?                                                        */
/* -------------------------------------------------------------------------- */

export function VerdadMitoIaStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
  difficulty = 'normal',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const count = difficulty === 'easy' ? 4 : difficulty === 'hard' ? 7 : 5;
  const secLimit = difficulty === 'easy' ? 18 : difficulty === 'hard' ? 5 : 10;
  const historyKey = `verdad_${themeMode}`;

  const [items, setItems] = useState<TrueFalseStatement[]>(() =>
    getTrueFalseBatch(themeMode, historyKey, count),
  );
  const [phase, setPhase] = useState<'PLAY' | 'REVEAL'>('PLAY');
  const [qi, setQi] = useState(0);
  const [timeLeft, setTimeLeft] = useState(secLimit);
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));
  const [wasOk, setWasOk] = useState(false);

  const reloadItems = useCallback(() => {
    setItems(getTrueFalseBatch(themeMode, historyKey, count));
    setQi(0);
    setTimeLeft(secLimit);
    setScores(Array(np).fill(0));
    setPhase('PLAY');
  }, [themeMode, historyKey, np, count, secLimit]);

  const pi = qi % np;
  const current = items[qi];

  useEffect(() => {
    if (phase === 'REVEAL') setBg(wasOk ? '#16a34a' : '#7f1d1d');
    else setBg(PLAYER_STAGE_COLORS[pi % PLAYER_STAGE_COLORS.length]);
  }, [phase, wasOk, pi, setBg]);

  useEffect(() => {
    if (phase !== 'PLAY') return;
    setTimeLeft(secLimit);
    const endAt = Date.now() + secLimit * 1000;
    const iv = window.setInterval(() => {
      const rem = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setTimeLeft(rem);
      if (Date.now() >= endAt) {
        window.clearInterval(iv);
        setWasOk(false);
        tone(150, 0.35, 'sawtooth');
        setPhase('REVEAL');
      }
    }, 150);
    return () => window.clearInterval(iv);
  }, [phase, qi, secLimit]);

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
      if (phase === 'PLAY') {
        if (k === 'left') answer(true);
        else if (k === 'right') answer(false);
      } else if (phase === 'REVEAL' && k === 'ok') {
        if (qi + 1 < items.length) {
          setQi((i) => i + 1);
          setPhase('PLAY');
        } else {
          const rank = Array.from({length: np}, (_, i) => i).sort((a, b) => scores[b] - scores[a]);
          onFinish(
            isFnaf ? 'Mito o Realidad' : isAu ? 'Dato o Sabotaje' : 'Verdad o Mito',
            rank,
            rank.map((p) => `${scores[p]} aciertos`),
            reloadItems,
          );
        }
      }
    },
    [phase, qi, items.length, np, scores, isFnaf, isAu, reloadItems, answer, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

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
        {players[pi].name} · {qi + 1}/{items.length} · {DIFFICULTY_META[difficulty].emoji}{' '}
        {DIFFICULTY_META[difficulty].label} · ⏱️ {timeLeft}s
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
/* 16. HISTORIA LOCA EN CADENA                                                */
/* -------------------------------------------------------------------------- */

export function HistoriaIaStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
  difficulty = 'normal',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const secLimit = difficulty === 'easy' ? 0 : difficulty === 'hard' ? 7 : 14;

  const sessionRef = useRef<StorySessionEngine | null>(null);
  if (!sessionRef.current) {
    sessionRef.current = createStorySession(themeMode);
  }

  const [phase, setPhase] = useState<'CHOICE' | 'FINALE'>('CHOICE');
  const [chapter, setChapter] = useState(1);
  const [storyText, setStoryText] = useState(() => sessionRef.current!.start.paragraph);
  const [choices, setChoices] = useState<string[]>(() => sessionRef.current!.start.choices);
  const [sel, setSel] = useState(0);
  const [timeLeft, setTimeLeft] = useState(secLimit);
  const [ending, setEnding] = useState({title: '', text: '', rating: 9});

  const selRef = useRef(0);
  selRef.current = sel;

  const restartStory = useCallback(() => {
    const nextEngine = createStorySession(themeMode);
    sessionRef.current = nextEngine;
    setChapter(1);
    setSel(0);
    setTimeLeft(secLimit);
    setStoryText(nextEngine.start.paragraph);
    setChoices(nextEngine.start.choices);
    setPhase('CHOICE');
  }, [themeMode, secLimit]);

  const pi = (chapter - 1) % np;

  useEffect(() => {
    if (phase === 'FINALE') setBg('#16a34a');
    else setBg(PLAYER_STAGE_COLORS[pi % PLAYER_STAGE_COLORS.length]);
  }, [phase, pi, setBg]);

  const pickTwist = useCallback(
    (choiceIdx: number) => {
      tone(520, 0.1);
      const engine = sessionRef.current!;
      if (chapter >= 3) {
        tone(784, 0.35);
        setEnding(engine.getEnding(choiceIdx));
        setPhase('FINALE');
      } else {
        const nextNode = engine.getNextNode(chapter, choiceIdx);
        setStoryText(nextNode.paragraph);
        setChoices(nextNode.choices);
        setChapter((c) => c + 1);
        setSel(0);
      }
    },
    [chapter],
  );

  useEffect(() => {
    if (phase !== 'CHOICE' || secLimit <= 0) return;
    setTimeLeft(secLimit);
    const endAt = Date.now() + secLimit * 1000;
    const iv = window.setInterval(() => {
      const rem = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setTimeLeft(rem);
      if (Date.now() >= endAt) {
        window.clearInterval(iv);
        pickTwist(selRef.current);
      }
    }, 150);
    return () => window.clearInterval(iv);
  }, [phase, chapter, secLimit, pickTwist]);

  const handleKey = useCallback(
    (k: RemoteKey) => {
      if (phase === 'CHOICE') {
        if (k === 'down' || k === 'right') {
          setSel((s) => (s + 1) % Math.max(1, choices.length));
          playControlClick();
        } else if (k === 'up' || k === 'left') {
          setSel((s) => (s + Math.max(1, choices.length) - 1) % Math.max(1, choices.length));
          playControlClick();
        } else if (k === 'ok' && choices[sel]) {
          pickTwist(sel);
        }
      } else if (phase === 'FINALE' && k === 'ok') {
        const rank = Array.from({length: np}, (_, i) => i);
        onFinish(
          ending.title,
          rank,
          rank.map(() => `Nota ${ending.rating}/10`),
          restartStory,
        );
      }
    },
    [phase, choices, sel, np, ending, restartStory, pickTwist, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

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
            : `Decide ${players[pi].name} · Capítulo ${chapter}/3`}{' '}
        · {DIFFICULTY_META[difficulty].emoji} {DIFFICULTY_META[difficulty].label}
        {secLimit > 0 && ` · ⏱️ ${timeLeft}s`}
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
            onClick={() => pickTwist(i)}
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
/* 17. ¿QUIÉN ES MÁS PROBABLE QUE...?                                         */
/* -------------------------------------------------------------------------- */

export function MasProbableIaStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
  difficulty = 'normal',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const count = difficulty === 'easy' ? 3 : difficulty === 'hard' ? 6 : 4;
  const secLimit = difficulty === 'easy' ? 0 : difficulty === 'hard' ? 6 : 10;
  const historyKey = `probable_${themeMode}`;

  const [prompts, setPrompts] = useState<MostLikelyPrompt[]>(() =>
    generateMostLikelyPrompts(themeMode, historyKey, count),
  );
  const [phase, setPhase] = useState<'VOTE' | 'REVEAL'>('VOTE');
  const [qi, setQi] = useState(0);
  const [voterIdx, setVoterIdx] = useState(0);
  const [sel, setSel] = useState(0);
  const [timeLeft, setTimeLeft] = useState(secLimit);
  const [votes, setVotes] = useState<number[]>(() => Array(np).fill(0));
  const [soloYesCount, setSoloYesCount] = useState(0);
  const [soloLastYes, setSoloLastYes] = useState(false);
  const [scores, setScores] = useState<number[]>(() => Array(np).fill(0));
  const [crownedCounts, setCrownedCounts] = useState<number[]>(() => Array(np).fill(0));

  const selRef = useRef(0);
  selRef.current = sel;

  const reloadPrompts = useCallback(() => {
    setPrompts(generateMostLikelyPrompts(themeMode, historyKey, count));
    setQi(0);
    setVoterIdx(0);
    setSel(0);
    setTimeLeft(secLimit);
    setVotes(Array(np).fill(0));
    setSoloYesCount(0);
    setScores(Array(np).fill(0));
    setCrownedCounts(Array(np).fill(0));
    setPhase('VOTE');
  }, [themeMode, historyKey, np, count, secLimit]);

  const current = prompts[qi];

  useEffect(() => {
    if (phase === 'VOTE') setBg(PLAYER_STAGE_COLORS[voterIdx % PLAYER_STAGE_COLORS.length]);
    else if (phase === 'REVEAL') setBg('#1d4ed8');
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

  useEffect(() => {
    if (phase !== 'VOTE' || secLimit <= 0) return;
    setTimeLeft(secLimit);
    const endAt = Date.now() + secLimit * 1000;
    const iv = window.setInterval(() => {
      const rem = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setTimeLeft(rem);
      if (Date.now() >= endAt) {
        window.clearInterval(iv);
        confirmVote(np === 1 ? (Math.random() < 0.5 ? 0 : 1) : selRef.current);
      }
    }, 150);
    return () => window.clearInterval(iv);
  }, [phase, qi, voterIdx, secLimit, np, confirmVote]);

  const handleKey = useCallback(
    (k: RemoteKey) => {
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
              ? '¿Qué Guardia de Fazbear?'
              : isAu
                ? '¿Quién es más Sus?'
                : '¿Quién es más...?',
            [0],
            [`${soloYesCount}/${prompts.length} veces tú`],
            reloadPrompts,
          );
        } else {
          const rank = Array.from({length: np}, (_, i) => i).sort(
            (a, b) => scores[b] - scores[a] || crownedCounts[b] - crownedCounts[a],
          );
          onFinish(
            isFnaf
              ? '¿Qué Guardia de Fazbear?'
              : isAu
                ? '¿Quién es más Sus?'
                : '¿Quién es más...?',
            rank,
            rank.map((p) => `${scores[p]} con mayoría · ${crownedCounts[p]} títulos`),
            reloadPrompts,
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
      reloadPrompts,
      confirmVote,
      onFinish,
    ],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

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
          {players[0].name} · {qi + 1}/{prompts.length} · {DIFFICULTY_META[difficulty].emoji}{' '}
          {DIFFICULTY_META[difficulty].label}
          {secLimit > 0 && ` · ⏱️ ${timeLeft}s`}
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
        Vota {players[voterIdx].name} · {qi + 1}/{prompts.length} · {DIFFICULTY_META[difficulty].emoji}{' '}
        {DIFFICULTY_META[difficulty].label}
        {secLimit > 0 && ` · ⏱️ ${timeLeft}s`}
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
/* 18. YO NUNCA FAMILIAR                                                      */
/* -------------------------------------------------------------------------- */

export function YoNuncaIaStage({
  players,
  onFinish,
  registerKeyHandler,
  setBg,
  themeMode = 'classic',
  difficulty = 'normal',
}: StageGameProps) {
  const isFnaf = themeMode === 'fnaf';
  const isAu = themeMode === 'amongus';
  const np = players.length;
  const count = difficulty === 'easy' ? 3 : difficulty === 'hard' ? 7 : 5;
  const secLimit = difficulty === 'easy' ? 0 : difficulty === 'hard' ? 5 : 10;
  const historyKey = `yonunca_${themeMode}`;

  const [items, setItems] = useState<NeverHaveIStatement[]>(() =>
    generateNeverHaveI(themeMode, historyKey, count),
  );
  const [phase, setPhase] = useState<'CONFESS' | 'REVEAL'>('CONFESS');
  const [qi, setQi] = useState(0);
  const [turnIdx, setTurnIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(secLimit);
  const [didItRound, setDidItRound] = useState<boolean[]>(() => Array(np).fill(false));
  const [innocentScores, setInnocentScores] = useState<number[]>(() => Array(np).fill(0));
  const [doneCounts, setDoneCounts] = useState<number[]>(() => Array(np).fill(0));

  const reloadStatements = useCallback(() => {
    setItems(generateNeverHaveI(themeMode, historyKey, count));
    setQi(0);
    setTurnIdx(0);
    setTimeLeft(secLimit);
    setDidItRound(Array(np).fill(false));
    setInnocentScores(Array(np).fill(0));
    setDoneCounts(Array(np).fill(0));
    setPhase('CONFESS');
  }, [themeMode, historyKey, np, count, secLimit]);

  const current = items[qi];

  useEffect(() => {
    if (phase === 'CONFESS') setBg(PLAYER_STAGE_COLORS[turnIdx % PLAYER_STAGE_COLORS.length]);
    else setBg('#0f766e');
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

  useEffect(() => {
    if (phase !== 'CONFESS' || secLimit <= 0) return;
    setTimeLeft(secLimit);
    const endAt = Date.now() + secLimit * 1000;
    const iv = window.setInterval(() => {
      const rem = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setTimeLeft(rem);
      if (Date.now() >= endAt) {
        window.clearInterval(iv);
        answer(true);
      }
    }, 150);
    return () => window.clearInterval(iv);
  }, [phase, qi, turnIdx, secLimit, answer]);

  const handleKey = useCallback(
    (k: RemoteKey) => {
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
            isFnaf ? 'Yo Nunca Nocturno' : isAu ? 'Yo Nunca en Nave' : 'Yo Nunca',
            rank,
            rank.map((p) => `${innocentScores[p]} inocentes · ${doneCounts[p]} sí`),
            reloadStatements,
          );
        }
      }
    },
    [phase, qi, items.length, np, innocentScores, doneCounts, isFnaf, isAu, answer, reloadStatements, onFinish],
  );

  useEffect(() => {
    registerKeyHandler(handleKey);
  }, [registerKeyHandler, handleKey]);

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
        Responde {players[turnIdx].name} · {current.category} · {qi + 1}/{items.length} ·{' '}
        {DIFFICULTY_META[difficulty].emoji} {DIFFICULTY_META[difficulty].label}
        {secLimit > 0 && ` · ⏱️ ${timeLeft}s`}
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
