import {
  DilemmaItem,
  MostLikelyPrompt,
  NeverHaveIStatement,
} from '../types/game';
import {ThemeMode} from '../utils/stageAudio';
import {filterFreshAiItems, recordAiItems} from '../utils/aiHistory';

export interface LocalWheelChallenge {
  title: string;
  challenge: string;
}

export interface LocalStoryNode {
  paragraph: string;
  choices: [string, string, string];
}

export interface LocalStoryEnding {
  title: string;
  text: string;
  rating: number;
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleCopy<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* -------------------------------------------------------------------------- */
/* 1. RULETA DE RETOS (MILES DE COMBINACIONES + CURADOS)                      */
/* -------------------------------------------------------------------------- */

const CLASSIC_WHEEL_CURATED: LocalWheelChallenge[] = [
  {title: 'Estatua musical', challenge: 'Quédate congelado en una pose épica durante 10 segundos aunque intenten hacerte reír.'},
  {title: 'Noticiero urgente', challenge: 'Narra lo que hiciste hoy como si fuera la noticia más dramática del planeta en 12 segundos.'},
  {title: 'Mímica sin manos', challenge: 'Haz que el grupo adivine tu comida favorita usando solo gestos de la cara y hombros.'},
  {title: 'Elogio al rival', challenge: 'Dile un cumplido súper exagerado y gracioso al jugador que tienes a tu derecha.'},
  {title: 'Cámara lenta', challenge: 'Levanta un vaso o control imaginario y bebe agua en cámara ultra lenta durante 8 segundos.'},
  {title: 'Doblaje en vivo', challenge: 'Haz la voz de un villano de caricatura presentando la siguiente ronda del juego.'},
  {title: 'Aplauso rítmico', challenge: 'Inventa un ritmo corto con palmas y logra que al menos dos personas lo repitan igual.'},
  {title: 'Sin la letra E', challenge: 'Describe qué hay en la sala durante 10 segundos sin pronunciar ninguna palabra con la letra A.'},
  {title: 'Maestro del equilibrio', challenge: 'Mantente en un solo pie mientras cuentas del 15 al 0 hacia atrás sin trabarte.'},
  {title: 'Anuncio imposible', challenge: 'Vende un calcetín viejo como si fuera el invento tecnológico más caro del año.'},
  {title: 'Eco humano', challenge: 'Repite exactamente el tono y gesto de la última persona que habló antes que tú.'},
  {title: 'Reto de velocidad', challenge: 'Nombra 6 frutas o verduras distintas en menos de 7 segundos.'},
  {title: 'Modo robot', challenge: 'Habla y muévete como un robot con poca batería hasta que empiece el siguiente turno.'},
  {title: 'Risa contagiosa', challenge: 'Suelta una risa de caricatura durante 6 segundos seguidos sin reírte de verdad.'},
  {title: 'Director de orquesta', challenge: 'Dirige una canción imaginaria con mucha pasión mientras tarareas el ritmo.'},
  {title: 'Cinco animales', challenge: 'Imita los sonidos de 4 animales diferentes en menos de 8 segundos.'},
  {title: 'Espejo perfecto', challenge: 'Elige a alguien de la sala e imita todos sus movimientos durante 10 segundos.'},
  {title: 'Detective expreso', challenge: 'Di en 8 segundos 4 cosas de color azul que veas ahora mismo en la habitación.'},
  {title: 'Cambio de acento', challenge: 'Pide un aplauso para el grupo usando el acento de comentarista de fútbol.'},
  {title: 'Baile de victoria', challenge: 'Inventa un baile corto de celebración de 5 segundos por si ganas el torneo.'},
];

const CLASSIC_ACTIONS = [
  'Imita a un chef famoso preparando una pizza gigante',
  'Actúa como un astronauta caminando sin gravedad',
  'Haz mímica de estar atrapado dentro de una caja invisible',
  'Presenta a todos en la sala como estrellas de cine',
  'Di 5 cosas que llevarías a una isla desierta',
  'Canta el coro de una canción infantil famosa',
  'Nombra 5 películas animadas que te encanten',
  'Camina en el mismo sitio como si hubiera viento fortísimo',
  'Haz la mímica de atrapar una mosca molesta en el aire',
  'Inventa un saludo secreto usando codos y manos',
  'Cuenta qué superpoder elegirías y para qué lo usarías hoy',
  'Di 5 palabras que empiecen con la letra M',
  'Actúa como un árbitro expulsando a un jugador imaginario',
  'Haz cara de sorpresa máxima y mantenla firme',
  'Explica cómo se prepara un sándwich perfecto',
  'Haz mímica de jugar tenis en una final olímpica',
  'Nombra 4 países que te gustaría visitar pronto',
  'Actúa como un gato buscando el lugar más cómodo del sofá',
  'Di un trabalenguas rápido o inventa uno al instante',
  'Agradece un premio Óscar imaginario con mucha emoción',
];

const CLASSIC_MODIFIERS = [
  'como si hablaras en cámara lenta.',
  'con voz de robot elegante.',
  'sin mostrar los dientes ni reírte.',
  'usando voz de locutor de radio antiguo.',
  'mientras aplaudes al ritmo de cada palabra.',
  'en menos de 8 segundos antes de que acabe el tiempo.',
  'como si fuera un secreto súper confidencial.',
  'con tono de tráiler épico de cine.',
  'con las manos detrás de la espalda.',
  'mirando al techo sin bajar la vista.',
  'como si estuvieras congelado de frío.',
  'con la energía de quien acaba de ganar la lotería.',
];

const CLASSIC_TITLES = [
  'Mímica Exprés',
  'Desafío en Sala',
  'Giro Cómico',
  'Actuación Rápida',
  'Reto Relámpago',
  'Show en Vivo',
];

const FNAF_WHEEL_CURATED: LocalWheelChallenge[] = [
  {title: 'Batería al 1%', challenge: 'Quédate totalmente inmóvil y sin respirar fuerte 8 segundos para que Freddy no te vea.'},
  {title: 'Vigilando Pirate Cove', challenge: 'Mira hacia los lados rápido como revisando puertas izquierda y derecha durante 10 segundos.'},
  {title: 'Caja de Puppet', challenge: 'Haz el gesto de girar una manivela sin parar durante 10 segundos mientras tarareas una cajita musical.'},
  {title: 'Risa de Freddy', challenge: 'Suelta una risa grave y lenta de animatrónico en la oscuridad.'},
  {title: 'Llamada del Tipo del Teléfono', challenge: 'Da un consejo de seguridad inventado para sobrevivir a la Noche 1 con tono nervioso.'},
  {title: 'Máscara de Freddy', challenge: 'Cúbrete la cara con las manos 6 segundos como poniéndote la máscara para engañar a Foxy.'},
  {title: 'Audio Lure en CAM 09', challenge: 'Di "¡Hola!" con voz aguda de Balloon Boy para distraer a Springtrap hacia otra esquina.'},
  {title: 'Modo Endoesqueleto', challenge: 'Muévete con pasos rígidos de animatrónico durante 8 segundos sin doblar los codos.'},
];

const FNAF_ACTIONS = [
  'Revisa imaginariamente las dos puertas de la oficina',
  'Imita los pasos rápidos de Foxy corriendo por el pasillo',
  'Nombra 4 animatrónicos distintos de la saga Fazbear',
  'Haz el sonido de una puerta blindada cerrándose de golpe',
  'Actúa como guardia esperando ansioso a que den las 6:00 AM',
  'Explica cuál es el animatrónico que más miedo te da',
  'Haz la pose rígida de Bonnie esperando frente a la puerta',
  'Finge que la linterna parpadea y no quiere encender',
  'Di qué harías si escucharas la música de Freddy con luz apagada',
  'Imita la postura congelada de Golden Freddy en la silla',
  'Haz mímica de reiniciar el sistema de ventilación en pánico',
  'Nombra 3 salas de la pizzería original de FNAF 1',
];

const FNAF_MODIFIERS = [
  'susurrando como si estuvieras a las 5:55 AM.',
  'con cara de susto pero sin mover los pies.',
  'mirando hacia atrás cada 2 segundos.',
  'con voz robótica medio desconectada.',
  'en menos de 8 segundos antes de que se vaya la luz.',
  'como si tuvieras solo 3% de batería en la oficina.',
  'sin parpadear mientras hablas.',
  'con tono de grabación vieja en cinta de casete.',
];

const AU_WHEEL_CURATED: LocalWheelChallenge[] = [
  {title: 'Tarjeta de Admin', challenge: 'Haz la mímica de pasar una tarjeta por el lector 4 veces fallando hasta que a la quinta te salga bien.'},
  {title: 'Defiende tu coartada', challenge: 'Inventa en 10 segundos qué estabas haciendo en Electricidad para demostrar que no eres el Impostor.'},
  {title: 'Escáner de MedBay', challenge: 'Ponte derecho y gira despacio 360 grados con brazos quietos mientras haces "biiip" como el escáner.'},
  {title: 'Botón de Cafetería', challenge: 'Golpea suavemente un botón imaginario en la mesa y acusa en broma al jugador más callado.'},
  {title: 'Sospecha en alcantarilla', challenge: 'Mira a dos jugadores fijamente y di con voz seria: "Yo vi a uno salir del ducto".'},
  {title: 'Sabotaje de O2', challenge: 'Corre en el sitio durante 7 segundos fingiendo buscar el código del oxígeno antes de que acabe el tiempo.'},
  {title: 'Luces apagadas', challenge: 'Camina 4 pasos despacio con los brazos estirados como buscando el panel en Electricidad a oscuras.'},
  {title: 'Shapeshifter detectado', challenge: 'Imita la voz o postura de otro jugador de la sala durante 8 segundos.'},
];

const AU_ACTIONS = [
  'Nombra 4 salas de la nave The Skeld',
  'Inventa una coartada convincente de dónde estuviste toda la ronda',
  'Haz mímica de conectar 4 cables de colores a toda prisa',
  'Señala a alguien y explica por qué actúa "muy sospechoso"',
  'Haz el gesto de disparar meteoritos desde Armas',
  'Di cuál tarea visual demuestra al 100% que eres tripulante',
  'Imita el sonido de alarma roja cuando sabotean el Reactor',
  'Finge vaciar la basura jalando la palanca gigante',
  'Actúa como fantasma flotando que sigue terminando sus tareas',
  'Nombra 3 mapas oficiales de Among Us',
  'Haz la pose dramática de salir expulsado al espacio girando',
  'Explica por qué nunca conviene quedarse solo en Electricidad',
];

const AU_MODIFIERS = [
  'con tono de reunión de emergencia urgente.',
  'sin decir la palabra "impostor" ni "rojo".',
  'en menos de 8 segundos antes de que cierren las puertas.',
  'mirando de reojo al jugador de tu izquierda.',
  'como si hablaras por radio con interferencia.',
  'con la voz más inocente del universo.',
  'mientras finges arreglar un panel eléctrico.',
  'sin dejar de mover los brazos como flotando.',
];

export function generateWheelChallenges(
  theme: ThemeMode,
  cat: string,
  vibe: string,
  historyKey: string,
): LocalWheelChallenge[] {
  const curated =
    theme === 'fnaf'
      ? FNAF_WHEEL_CURATED
      : theme === 'amongus'
        ? AU_WHEEL_CURATED
        : CLASSIC_WHEEL_CURATED;

  const actions =
    theme === 'fnaf' ? FNAF_ACTIONS : theme === 'amongus' ? AU_ACTIONS : CLASSIC_ACTIONS;
  const mods =
    theme === 'fnaf' ? FNAF_MODIFIERS : theme === 'amongus' ? AU_MODIFIERS : CLASSIC_MODIFIERS;
  const titles =
    theme === 'fnaf'
      ? ['Guardia Fazbear', 'Alerta 12 AM', 'Turno Nocturno', 'Cámara Activa', 'Susto en Sala']
      : theme === 'amongus'
        ? ['Misión Skeld', 'Coartada', 'Alerta Nave', 'Tarea Rápida', 'Reunión']
        : CLASSIC_TITLES;

  const generated: LocalWheelChallenge[] = [...shuffleCopy(curated).slice(0, 4)];
  for (let i = 0; i < 10; i++) {
    const a = pickRandom(actions);
    const m = pickRandom(mods);
    const t = i % 2 === 0 ? cat : pickRandom(titles);
    generated.push({
      title: `${t} · ${vibe}`,
      challenge: `${a} ${m}`,
    });
  }

  return filterFreshAiItems(historyKey, generated, (c) => c.challenge, 80);
}

/* -------------------------------------------------------------------------- */
/* 2. DILEMA DEL SOFÁ / ¿QUÉ PREFIERES? (MILES DE COMBINACIONES)              */
/* -------------------------------------------------------------------------- */

const CLASSIC_DILEMMAS_CURATED: DilemmaItem[] = [
  {
    scenario: 'Si tuvieras que elegir hoy…',
    optionA: 'Poder hablar con todos los animales',
    optionB: 'Hablar todos los idiomas del mundo',
    debateTip: '¿Qué sería lo primero que preguntarías con ese poder?',
  },
  {
    scenario: 'Para el resto del año…',
    optionA: 'Comer tu comida favorita gratis siempre',
    optionB: 'Viajar gratis a cualquier país en vacaciones',
    debateTip: '¿La comida gana a la aventura o al revés?',
  },
  {
    scenario: 'Superpoder en casa…',
    optionA: 'Limpiar toda la casa con un chasquido',
    optionB: 'Cocinar cualquier platillo en 3 segundos',
    debateTip: '¿Cuál ahorraría más tiempo en tu familia?',
  },
  {
    scenario: 'En un viaje largo…',
    optionA: 'Ir sin internet pero con música infinita',
    optionB: 'Tener internet pero sin batería en el audífono',
    debateTip: '¿Cómo sobrevivirías 5 horas de carretera?',
  },
  {
    scenario: 'Solo puedes conservar uno…',
    optionA: 'Ver películas en cine gratis toda la vida',
    optionB: 'Tener videojuegos nuevos gratis cada mes',
    debateTip: '¿Pantalla gigante o control en mano?',
  },
  {
    scenario: 'Situación curiosa…',
    optionA: 'Despertar siempre con energía al 100%',
    optionB: 'No volver a sentir frío ni calor extremo nunca',
    debateTip: '¿Qué molesta más: el sueño o el clima?',
  },
];

const CLASSIC_DILEMMA_PERKS = [
  'tener Wi-Fi perfecto hasta en medio del bosque',
  'poder teletransportarte solo los fines de semana',
  'recordar todo lo que estudias con leerlo una vez',
  'tener risa tan contagiosa que alegra cualquier sala',
  'no volver a perder las llaves ni el control del TV',
  'correr el doble de rápido sin cansarte',
  'dibujar perfecto cualquier cosa en 10 segundos',
  'tener tu postre favorito siempre recién hecho en la nevera',
  'poder pausar el tiempo 5 minutos al día',
  'entender lo que piensan las mascotas',
  'tener entradas VIP gratis a conciertos y parques',
  'dormir 4 horas y despertar descansado como si fueran 10',
  'saber tocar cualquier instrumento musical al instante',
  'encontrar siempre dinero olvidado en tus bolsillos',
  'tener zapatos que nunca se ensucian ni se gastan',
  'hacer reír a cualquiera con un solo chiste',
  'tener una mochila mágica donde cabe todo sin pesar',
  'poder respirar bajo el agua durante 1 hora',
  'elegir siempre el clima perfecto de tu cumpleaños',
  'hablar fluido cualquier idioma con solo escucharlo',
  'tener suerte extra en cada juego de mesa familiar',
  'volar a la altura de un edificio de dos pisos',
];

const FNAF_DILEMMAS_CURATED: DilemmaItem[] = [
  {
    scenario: 'Turno de 12 AM a 6 AM…',
    optionA: 'Oficina con 150% de batería pero sin puerta derecha',
    optionB: 'Ambas puertas intactas pero cámaras apagadas',
    debateTip: '¿Prefieres ver dónde están o poder cerrar todo?',
  },
  {
    scenario: 'Para sobrevivir a Fazbear…',
    optionA: 'Tener linterna infinita contra Foxy',
    optionB: 'Caja de Puppet que nunca se descarga',
    debateTip: '¿Qué te daría más tranquilidad en la Noche 5?',
  },
  {
    scenario: 'Trabajo nocturno…',
    optionA: 'Pasar una noche vigilando a Springtrap en FNAF 3',
    optionB: 'Pasar una noche escuchando respiraciones en FNAF 4',
    debateTip: '¿Ductos de ventilación o pasillos oscuros?',
  },
];

const FNAF_DILEMMA_PERKS = [
  'empezar la noche a las 3:00 AM directamente',
  'tener máscara de Freddy puesta toda la noche sin quitártela',
  'escuchar los pasos de cada animatrónico desde lejos',
  'tener el Audio Lure recargado en 1 segundo',
  'tener una puerta extra en los ductos de ventilación',
  'contar con 40% extra de batería desde el inicio',
  'poder encender las luces de toda la pizzería 10 segundos',
  'tener al Tipo del Teléfono guiándote en vivo toda la noche',
  'que Puppet duerma tranquilo hasta las 5:00 AM',
  'que Foxy nunca salga de Pirate Cove',
  'ver la silueta de los animatrónicos a través de la pared',
  'tener pizza caliente gratis en el escritorio',
];

const AU_DILEMMAS_CURATED: DilemmaItem[] = [
  {
    scenario: 'En una partida en The Skeld…',
    optionA: 'Ser Impostor y que nadie sospeche de ti nunca',
    optionB: 'Ser Tripulante con escáner de MedBay en cada ronda',
    debateTip: '¿Prefieres engañar a todos o ser inocente probado?',
  },
  {
    scenario: 'Sabotaje simultáneo…',
    optionA: 'Correr solo hacia Electricidad con las luces apagadas',
    optionB: 'Ir al Reactor con el jugador que más miente en el grupo',
    debateTip: '¿Dónde crees que corres menos peligro?',
  },
  {
    scenario: 'Rol especial de la nave…',
    optionA: 'Ser Ingeniero y poder usar todas las alcantarillas',
    optionB: 'Ser Científico y ver los signos vitales en cualquier sala',
    debateTip: '¿Escapar rápido o detectar eliminaciones al instante?',
  },
];

const AU_DILEMMA_PERKS = [
  'hacer el deslizamiento de tarjeta de Admin a la primera siempre',
  'tener coartada visual en Armas cada partida',
  'ver quién entra a las alcantarillas desde el mapa Admin',
  'tener un Ángel Guardián protegiéndote toda la ronda',
  'ser Shapeshifter con transformación silenciosa',
  'arreglar cables en 1 segundo sin equivocarte de color',
  'empezar siempre cerca del Botón de Emergencia',
  'tener cámara portátil de Seguridad en el bolsillo',
  'caminar 20% más rápido por todos los pasillos de Skeld',
  'detectar automáticamente si una tarea es falsa',
  'tener recarga de sabotaje más rápida como Impostor',
  'convencer siempre a la mayoría en Cafetería',
];

const DILEMMA_SCENARIOS = [
  '¿Qué prefieres para tu vida diaria?',
  'En esta situación… ¿qué eliges?',
  'Solo puedes quedarte con una opción:',
  'Debate rápido en sala: ¿A o B?',
];

const DILEMMA_TIPS = [
  'Defiendan su elección en 10 segundos antes de votar.',
  '¿El grupo votó igual o se dividió la sala?',
  '¿Quién cambiaría de opinión después de escuchar al resto?',
  '¿Cuál de las dos opciones sirve más en el día a día?',
];

export function generateDilemmas(
  theme: ThemeMode,
  historyKey: string,
  count = 8,
): DilemmaItem[] {
  const curated =
    theme === 'fnaf'
      ? FNAF_DILEMMAS_CURATED
      : theme === 'amongus'
        ? AU_DILEMMAS_CURATED
        : CLASSIC_DILEMMAS_CURATED;

  const perks =
    theme === 'fnaf'
      ? FNAF_DILEMMA_PERKS
      : theme === 'amongus'
        ? AU_DILEMMA_PERKS
        : CLASSIC_DILEMMA_PERKS;

  const pool = [...shuffleCopy(curated).slice(0, 2)];
  const shuffledPerks = shuffleCopy(perks);

  for (let i = 0; i + 1 < shuffledPerks.length && pool.length < Math.max(8, count + 2); i += 2) {
    const a = shuffledPerks[i];
    const b = shuffledPerks[i + 1];
    pool.push({
      scenario: pickRandom(DILEMMA_SCENARIOS),
      optionA: a.charAt(0).toUpperCase() + a.slice(1),
      optionB: b.charAt(0).toUpperCase() + b.slice(1),
      debateTip: pickRandom(DILEMMA_TIPS),
    });
  }

  return filterFreshAiItems(historyKey, pool, (d) => `${d.optionA}|${d.optionB}`, 80).slice(
    0,
    count,
  );
}

/* -------------------------------------------------------------------------- */
/* 3. ¿QUIÉN ES MÁS PROBABLE QUE...?                                          */
/* -------------------------------------------------------------------------- */

const CLASSIC_MOST_LIKELY: MostLikelyPrompt[] = [
  {question: '¿Quién es más probable que se quede dormido viendo una película?', funComment: 'Y luego jura que "solo estaba descansando los ojos".'},
  {question: '¿Quién es más probable que pierda el control del televisor sentado encima de él?', funComment: 'Siempre aparece en el lugar más obvio.'},
  {question: '¿Quién es más probable que se ría en el momento más serio?', funComment: 'Con solo cruzar miradas ya perdió.'},
  {question: '¿Quién es más probable que diga "en 5 minutos salgo" y tarde media hora?', funComment: 'Su reloj funciona en otra dimensión.'},
  {question: '¿Quién es más probable que pida comida para compartir y se coma lo mejor?', funComment: 'Las mejores papas nunca sobreviven.'},
  {question: '¿Quién es más probable que hable con las mascotas como si le entendieran todo?', funComment: 'Y hasta espera respuesta con cara seria.'},
  {question: '¿Quién es más probable que olvide a qué entró a la cocina?', funComment: 'Se queda mirando la nevera buscando pistas.'},
  {question: '¿Quién es más probable que cante en la ducha a todo volumen?', funComment: 'Concierto privado con acústica de baño.'},
  {question: '¿Quién es más probable que sobreviva primero en una isla desierta?', funComment: 'Ingeniería pura o pura suerte.'},
  {question: '¿Quién es más probable que se gaste el premio del torneo en botanas?', funComment: 'Inversión totalmente aprobada por la sala.'},
  {question: '¿Quién es más probable que haga trampa sin querer leyendo al revés las reglas?', funComment: 'Siempre hay que revisar la letra pequeña.'},
  {question: '¿Quién es más probable que llegue primero a cualquier fiesta?', funComment: 'Puntualidad olímpica.'},
  {question: '¿Quién es más probable que adopte tres perros más si nadie lo detiene?', funComment: 'Corazón enorme para los animales.'},
  {question: '¿Quién es más probable que busque sus lentes mientras los trae puestos?', funComment: 'Un clásico universal de la casa.'},
  {question: '¿Quién es más probable que invente excusas increíbles cuando pierde un minijuego?', funComment: '"¡Es que el botón no agarró bien!"'},
  {question: '¿Quién es más probable que termine una serie completa en un solo fin de semana?', funComment: 'Modo maratón sin frenos.'},
  {question: '¿Quién es más probable que tome 40 fotos de la comida antes de probarla?', funComment: 'Primero la estética, luego el tenedor.'},
  {question: '¿Quién es más probable que se pierda incluso usando GPS?', funComment: 'Tomó el desvío misterioso.'},
  {question: '¿Quién es más probable que gane un concurso de baile improvisado?', funComment: 'Ritmo natural bajo presión.'},
  {question: '¿Quién es más probable que guarde bolsas dentro de otra bolsa en la cocina?', funComment: 'Tradición familiar respetable.'},
];

const FNAF_MOST_LIKELY: MostLikelyPrompt[] = [
  {question: '¿Quién gastaría toda la batería de la oficina antes de las 2:00 AM?', funComment: 'Dejó las dos puertas cerradas y la luz encendida.'},
  {question: '¿Quién se olvidaría por completo de darle cuerda a la Caja de Puppet?', funComment: 'Y luego diría: "¿Qué es esa musiquita?"'},
  {question: '¿Quién gritaría primero con un susto de Foxy en el pasillo?', funComment: 'Saltaría del sofá con todo y control.'},
  {question: '¿Quién intentaría hacerse amigo de los animatrónicos en lugar de huir?', funComment: '"Seguro que Freddy solo quiere pizza."'},
  {question: '¿Quién sobreviviría las 5 noches enteras sin perder los nervios?', funComment: 'Sangre fría nivel guardia profesional.'},
  {question: '¿Quién dejaría entrar a Balloon Boy a la oficina por distraído?', funComment: '¡Adiós linterna por toda la noche!'},
  {question: '¿Quién confundiría las cámaras y mandaría a Springtrap hacia su propia puerta?', funComment: 'Usó el Audio Lure al revés.'},
  {question: '¿Quién se pondría la máscara de Freddy demasiado tarde?', funComment: 'Reflejos en cámara lenta.'},
  {question: '¿Quién aceptaría el trabajo en Fazbear solo por la pizza gratis?', funComment: 'El sueldo es lo de menos.'},
  {question: '¿Quién revisaría Pirate Cove cada 2 segundos por pánico?', funComment: 'Foxy ni respira bajo tanta vigilancia.'},
];

const AU_MOST_LIKELY: MostLikelyPrompt[] = [
  {question: '¿Quién sería expulsado en la primera ronda siendo 100% tripulante inocente?', funComment: 'Siempre parece sospechoso aunque no haga nada.'},
  {question: '¿Quién pasaría 2 minutos enteros peleando con la tarjeta de Admin?', funComment: '"¡Muy rápido! ¡Muy lento!" otra vez.'},
  {question: '¿Quién se metería a una alcantarilla frente a todos y diría que "solo limpiaba"?', funComment: 'Coartada imposible de defender.'},
  {question: '¿Quién presionaría el Botón de Emergencia solo para saludar?', funComment: 'Reunión innecesaria en Cafetería.'},
  {question: '¿Quién ganaría como Impostor sin eliminar a casi nadie porque todos se acusan solos?', funComment: 'Maestría en ver el caos desde lejos.'},
  {question: '¿Quién se quedaría atascado haciendo una tarea mientras sabotean el O2?', funComment: 'Prioridades muy cuestionables en The Skeld.'},
  {question: '¿Quién acusaría al que literalmente acaba de escanearse en Ala Médica?', funComment: 'Cero memoria en Cafetería.'},
  {question: '¿Quién sería descubierto por olvidar que la barra de tareas no subió?', funComment: 'Fingió cables durante 15 segundos seguidos.'},
  {question: '¿Quién sobreviviría toda la partida escondido en Cámaras?', funComment: 'El vigilante oficial de la nave.'},
  {question: '¿Quién caería primero en la trampa de Electricidad con luces apagadas?', funComment: 'Zona de peligro garantizada.'},
];

const CLASSIC_ML_BASES = [
  'apague la tele por error en la mejor parte de la final',
  'compre cosas graciosas en internet a medianoche',
  'intente abrir una puerta automática caminando muy rápido',
  'se quede viendo videos de gatitos 2 horas seguidas',
  'pierda un zapato en su propia habitación',
  'arme una fiesta por ganarle a todos en un minijuego',
  'se coma la última rebanada de pizza pidiendo permiso después',
  'salude a la cámara del televisor como si saliera en vivo',
  'confunda la sal con el azúcar preparando desayuno',
  'cante el tema de una serie vieja a todo pulmón',
];

const CLASSIC_ML_CONTEXTS = [
  'antes de terminar la semana',
  'frente a toda la familia',
  'sin darse cuenta hasta mañana',
  'en menos de diez minutos',
  'y jure que fue planeado',
];

export function generateMostLikelyPrompts(
  theme: ThemeMode,
  historyKey: string,
  count = 5,
): MostLikelyPrompt[] {
  const pool =
    theme === 'fnaf'
      ? [...FNAF_MOST_LIKELY]
      : theme === 'amongus'
        ? [...AU_MOST_LIKELY]
        : [...CLASSIC_MOST_LIKELY];

  if (theme === 'classic') {
    for (let i = 0; i < 12; i++) {
      const base = pickRandom(CLASSIC_ML_BASES);
      const ctx = pickRandom(CLASSIC_ML_CONTEXTS);
      pool.push({
        question: `¿Quién es más probable que ${base} ${ctx}?`,
        funComment: 'Todos en la sala ya tienen a alguien en mente.',
      });
    }
  }
  return filterFreshAiItems(historyKey, shuffleCopy(pool), (p) => p.question, 90).slice(0, count);
}

/* -------------------------------------------------------------------------- */
/* 4. YO NUNCA FAMILIAR                                                       */
/* -------------------------------------------------------------------------- */

const CLASSIC_NEVER_HAVE_I: NeverHaveIStatement[] = [
  {statement: 'Yo nunca he buscado el celular usando la linterna del propio celular', category: 'Despiste', followUp: '¡Un clásico de oro cuando hay prisa!'},
  {statement: 'Yo nunca me he quedado dormido con la tele encendida y despertado por un anuncio', category: 'TV en casa', followUp: 'Ese volumen nocturno despierta a cualquiera.'},
  {statement: 'Yo nunca he dicho "¡qué rico!" antes de probar algo que no me gustó nada', category: 'Cortesía', followUp: 'Actuación digna de película.'},
  {statement: 'Yo nunca he intentado abrir la puerta de casa con las llaves equivocadas', category: 'Despiste', followUp: 'Hasta que te das cuenta mirando la cerradura.'},
  {statement: 'Yo nunca he comido postre antes que la comida fuerte a escondidas', category: 'Comida', followUp: 'Nadie vio nada, nadie dice nada.'},
  {statement: 'Yo nunca he cantado la letra inventada de una canción en inglés con total seguridad', category: 'Música', followUp: 'Lo importante es la actitud.'},
  {statement: 'Yo nunca he culpado al control remoto o al internet cuando pierdo un juego', category: 'Juegos', followUp: '"¡Es que tenía lag!"'},
  {statement: 'Yo nunca me he reído solo recordando un chiste en medio de la calle', category: 'Humor', followUp: 'Y disimular tosiendo después.'},
  {statement: 'Yo nunca he leído un mensaje y olvidado responder hasta dos días después', category: 'Mensajes', followUp: 'Responder mentalmente no cuenta.'},
  {statement: 'Yo nunca he empujado una puerta que tenía un letrero gigante de "Jalar"', category: 'Despiste', followUp: 'Incluso dándole un segundo empujón.'},
  {statement: 'Yo nunca he guardado comida rica escondida para que nadie más la encuentre', category: 'Comida', followUp: 'Estrategia culinaria avanzada.'},
  {statement: 'Yo nunca he dicho "ya me sé el camino" y terminado dando vueltas de más', category: 'Viajes', followUp: 'Era un atajo panorámico.'},
  {statement: 'Yo nunca he mirado el reloj dos veces seguidas porque la primera no vi la hora', category: 'Despiste', followUp: 'Solo vimos que tenía números.'},
  {statement: 'Yo nunca he intentado hacer un reto viral o truco de magia en la sala', category: 'En casa', followUp: '¿Salió bien o terminó en risas?'},
  {statement: 'Yo nunca he saludado por error a alguien que estaba saludando al de atrás', category: 'Momento incómodo', followUp: 'Toca peinarse rápido para disimular.'},
  {statement: 'Yo nunca he visto dos veces la misma película el mismo fin de semana', category: 'Cine', followUp: 'Cuando es buena se repite sin culpa.'},
  {statement: 'Yo nunca he escondido un dulce en el bolsillo para comerlo luego', category: 'Comida', followUp: 'Reserva estratégica.'},
  {statement: 'Yo nunca he inventado una excusa chistosa para no lavar los platos', category: 'Casa', followUp: 'Al menos hizo reír a la cocina.'},
];

const FNAF_NEVER_HAVE_I: NeverHaveIStatement[] = [
  {statement: 'Yo nunca he saltado de la silla por un jumpscare de FNAF', category: 'Sustitos', followUp: '¡Y mucho menos con audífonos puestos!'},
  {statement: 'Yo nunca he cerrado ambas puertas por pánico gastando toda la batería', category: 'Oficina', followUp: 'Y a las 4 AM llegó Freddy.'},
  {statement: 'Yo nunca he olvidado por completo la Caja de Puppet mirando otra cámara', category: 'FNAF 2', followUp: 'Cuando suena la caja rápida ya es tarde.'},
  {statement: 'Yo nunca he confundido el nombre de dos animatrónicos distintos', category: 'Saga', followUp: '¿Era Toy Bonnie o Rockstar Bonnie?'},
  {statement: 'Yo nunca he pausado o bajado el volumen para no asustarme tanto', category: 'Supervivencia', followUp: 'Táctica totalmente válida.'},
  {statement: 'Yo nunca he visto teorías o secretos de la historia de Fazbear por horas', category: 'Lore FNAF', followUp: 'Un agujero sin fondo de misterios.'},
  {statement: 'Yo nunca he perdido justo a las 5:59 AM antes de sonar las 6:00 AM', category: 'Oficina', followUp: 'El momento más doloroso del juego.'},
  {statement: 'Yo nunca he puesto a un animatrónico difícil al 20 por pura curiosidad', category: 'Desafío', followUp: 'Y duró menos de 15 segundos.'},
];

const AU_NEVER_HAVE_I: NeverHaveIStatement[] = [
  {statement: 'Yo nunca he fallado la tarjeta de Admin más de 4 veces seguidas', category: 'The Skeld', followUp: 'El enemigo más duro de toda la nave.'},
  {statement: 'Yo nunca he sido expulsado por votar demasiado rápido sin dejar hablar', category: 'Cafetería', followUp: 'El silencio también te vuelve sospechoso.'},
  {statement: 'Yo nunca he acusado con 100% de seguridad a quien sí era tripulante', category: 'Reunión', followUp: '"¡Era él, confíen en mí!" y no era.'},
  {statement: 'Yo nunca he fingido hacer cables para que no sospechen cuando soy Impostor', category: 'Impostor', followUp: 'Solo hay que vigilar la barra de tareas.'},
  {statement: 'Yo nunca me he equivocado usando la alcantarilla delante de alguien', category: 'Alcantarilla', followUp: 'Botón de emergencia en 1 segundo.'},
  {statement: 'Yo nunca he perdido una partida por no llegar a tiempo a apagar el O2 o Reactor', category: 'Sabotaje', followUp: 'Todos pensaron que alguien más iba.'},
  {statement: 'Yo nunca me he quedado mirando las cámaras en Seguridad casi toda la partida', category: 'Seguridad', followUp: 'Vigilando el pasillo de Ala Médica.'},
  {statement: 'Yo nunca he olvidado qué color tenía mi propio personaje en medio de una acusación', category: 'Despiste', followUp: '"¡No fui yo, el otro tampoco!"'},
];

export function generateNeverHaveI(
  theme: ThemeMode,
  historyKey: string,
  count = 6,
): NeverHaveIStatement[] {
  const pool =
    theme === 'fnaf'
      ? FNAF_NEVER_HAVE_I
      : theme === 'amongus'
        ? AU_NEVER_HAVE_I
        : CLASSIC_NEVER_HAVE_I;
  return filterFreshAiItems(historyKey, shuffleCopy(pool), (s) => s.statement, 80).slice(0, count);
}

/* -------------------------------------------------------------------------- */
/* 5. HISTORIA LOCA EN CADENA (MÚLTIPLES RAMAS PROCEDURALES)                 */
/* -------------------------------------------------------------------------- */

interface StoryTemplate {
  start: LocalStoryNode;
  branches: Record<string, LocalStoryNode>;
  endings: Record<string, LocalStoryEnding>;
}

const CLASSIC_STORIES: StoryTemplate[] = [
  {
    start: {
      paragraph: 'Hoy tocaba tarde tranquila de películas en la sala, pero al encender el televisor salió un mensaje gigante: "FELICIDADES, GANARON UNA MÁQUINA DE PALOMITAS GIGANTE". De repente empieza a llenarse todo el pasillo de palomitas calientes.',
      choices: [
        'Construir un fuerte con cojines antes de que tape el sofá',
        'Llamar a los vecinos para organizar un festival de cine improvisado',
        'Buscar el botón rojo secreto detrás de la máquina',
      ],
    },
    branches: {
      '0': {
        paragraph: 'Armaron un castillo épico de cojines justo a tiempo, pero la gata de la casa trepó a la cima y proclamó ser la reina del fuerte mientras la máquina empezó a lanzar palomitas con sabor a queso.',
        choices: [
          'Negociar con la gata ofreciéndole atún real',
          'Usar escobas como escudos para avanzar hasta la cocina',
          'Grabar un documental narrando la aventura en vivo',
        ],
      },
      '1': {
        paragraph: 'En cinco minutos llegaron todos los vecinos con vasos gigantes, pero la máquina tomó vida propia y preguntó qué película querían ver antes de seguir sirviendo.',
        choices: [
          'Elegir una comedia familiar clásica para que todos rían',
          'Pedir una de aventuras con efecto 4D de palomitas voladoras',
          'Retar a la máquina a un concurso de trivia rápido',
        ],
      },
      '2': {
        paragraph: 'Al girar la máquina encontraron una palanca que decía "TURBO SABOR" y otra que decía "MODO FUENTE DE CHOCOLATE". Alguien apretó las dos sin querer.',
        choices: [
          'Sacar bowls gigantes y aprovechar la lluvia dulce',
          'Desenchufar con una cuerda como vaqueros expertos',
          'Hacer una torre gigante de palomitas acarameladas',
        ],
      },
    },
    endings: {
      '0': {
        title: 'El Reino de las Palomitas',
        text: 'Con trabajo en equipo calmaron la máquina justo antes de cenar y toda la familia terminó coronada en el sofá viendo películas hasta medianoche.',
        rating: 9,
      },
      '1': {
        title: 'Cine Monumental en Casa',
        text: 'Convirtieron el caos en la mejor noche de cine del barrio. Todavía hay palomitas detrás del sillón, pero valió totalmente la pena.',
        rating: 10,
      },
      '2': {
        title: 'Misión Dulce Cumplida',
        text: 'Lograron domar la máquina con ingenio y dejaron la cocina brillante… bueno, casi brillante después de comerse la evidencia.',
        rating: 9,
      },
    },
  },
  {
    start: {
      paragraph: 'El grupo decidió ir de excursión a un museo de inventos antiguos. Apenas entraron a la sala del reloj, alguien tocó una brújula brillante y una puerta secreta se abrió revelando un tobogán directo al sótano de inventos locos.',
      choices: [
        'Deslizarse todos juntos por el tobogán sin pensarlo',
        'Tomar primero una linterna gigante del mostrador',
        'Leer las instrucciones escritas en la pared antes de bajar',
      ],
    },
    branches: {
      '0': {
        paragraph: '¡Wuuu! Cayeron sobre una cama elástica de espuma gigante frente a tres inventos encendidos: unas botas saltarinas, un traductor de perros y una bicicleta voladora.',
        choices: [
          'Probar primero las botas saltarinas por toda la sala',
          'Encender el traductor de perros para ver qué dice el perro guardián',
          'Subirse en fila a la bicicleta voladora de cuatro asientos',
        ],
      },
      '1': {
        paragraph: 'Al bajar iluminando el pasillo encontraron un laboratorio lleno de frascos burbujeantes y un cartel enorme: "NO TOCAR EL BOTÓN VERDE DEL PATO GIGANTE".',
        choices: [
          'Tocar el botón verde para ver qué pasa',
          'Seguir las flechas amarillas hacia la salida secreta',
          'Revisar los planos del profesor sobre la mesa',
        ],
      },
      '2': {
        paragraph: 'Las instrucciones decían: "Solo los grupos unidos pueden salir antes de las 6:00". Al bajar, un robot simpático les pidió resolver una prueba de equipo.',
        choices: [
          'Hacerle un baile sincronizado para impresionarlo',
          'Contarle un chiste tan bueno que se ría de metal',
          'Ayudarlo a encontrar su tuerca perdida bajo la mesa',
        ],
      },
    },
    endings: {
      '0': {
        title: 'Inventores del Año',
        text: 'El director del museo los felicitó por probar los inventos sin romper nada y les dio pases vitalicios para volver en familia.',
        rating: 9,
      },
      '1': {
        title: 'El Misterio del Pato Verde',
        text: 'Resultó que el botón activaba confeti y música de fiesta. Salieron por la puerta principal bailando como campeones.',
        rating: 10,
      },
      '2': {
        title: 'Equipo Imparable',
        text: 'El robot les abrió el ascensor dorado y guardó una placa con el nombre de todo el grupo como los mejores exploradores.',
        rating: 9,
      },
    },
  },
];

const FNAF_STORIES: StoryTemplate[] = [
  {
    start: {
      paragraph: 'Son las 12:00 AM en Freddy Fazbear’s Pizza y el grupo acaba de aceptar cubrir el turno de guardia. La batería marca 98%, el ventilador zumba en el escritorio y en el monitor aparece que Bonnie ya no está en el escenario.',
      choices: [
        'Encender la luz de la puerta izquierda de inmediato',
        'Buscarlo rápido por las cámaras del comedor y pasillo',
        'Guardar batería y escuchar atento los pasos metálicos',
      ],
    },
    branches: {
      '0': {
        paragraph: '¡Ahí estaba Bonnie mirando directo hacia el pasillo! Cerraron la puerta justo a tiempo, pero al mirar el monitor la Caja de Puppet empezó a sonar más lento en el pasillo musical.',
        choices: [
          'Darle cuerda a la caja de Puppet a toda velocidad',
          'Revisar Pirate Cove porque Foxy lleva rato muy callado',
          'Apagar luces innecesarias para rescatar la batería que bajó a 42%',
        ],
      },
      '1': {
        paragraph: 'Vieron a Chica en la cocina haciendo ruido con las ollas de pizza, pero al volver a la oficina alguien escuchó una risa chistosa cerca de la ventilación: ¡era Balloon Boy!',
        choices: [
          'Ponerse la máscara de Freddy sin hacer ningún ruido',
          'Cerrar el conducto de aire antes de que robe las pilas',
          'Usar el señuelo de audio para mandarlo hacia la entrada',
        ],
      },
      '2': {
        paragraph: 'Ahorraron mucha batería hasta las 4:00 AM, pero de pronto escucharon pasos veloces corriendo desde Pirate Cove hacia la puerta izquierda.',
        choices: [
          'Dar golpe seco al botón rojo para cerrar la puerta izquierda',
          'Alumbrar con la linterna esperando frenarlo a tiempo',
          'Mirar la cámara del pasillo para calcular exactamente cuándo llega',
        ],
      },
    },
    endings: {
      '0': {
        title: '¡Sobrevivientes de las 6:00 AM!',
        text: 'Con batería al 2% y el corazón a mil, sonó la campana de las 6:00 AM. Ningún animatrónico logró entrar a la oficina.',
        rating: 10,
      },
      '1': {
        title: 'Turno Nocturno Perfecto',
        text: 'La máscara y los reflejos del equipo salvaron la noche entera. Hasta el Tipo del Teléfono dejó un mensaje felicitando al grupo.',
        rating: 9,
      },
      '2': {
        title: 'Maestros de la Oficina',
        text: 'Foxy golpeó la puerta cerrada justo dos segundos antes del amanecer. Guardias profesionales listos para otra noche.',
        rating: 10,
      },
    },
  },
];

const AU_STORIES: StoryTemplate[] = [
  {
    start: {
      paragraph: 'La tripulación acaba de despegar en The Skeld rumbo al sector espacial. Todo iba tranquilo en Cafetería hasta que la barra de tareas no subió cuando alguien fingió pasar la tarjeta en Admin y ¡de repente se apagaron todas las luces!',
      choices: [
        'Ir en grupo unido hacia Electricidad para subir los interruptores',
        'Correr directo a Seguridad para ver las cámaras antes que nada',
        'Quedarse junto al Botón de Emergencia vigilando quién sale del pasillo',
      ],
    },
    branches: {
      '0': {
        paragraph: 'Llegaron con linternas a Electricidad y vieron tres interruptores bajados, pero en la esquina alguien cerró las puertas de golpe mientras sonaba una alcantarilla abriéndose.',
        choices: [
          'Arreglar rápido los 4 cables de colores para recuperar la luz',
          'Contar cuántos tripulantes están en la sala para detectar si falta uno',
          'Esperar unidos frente a la puerta mirando quién se acerca a la alcantarilla',
        ],
      },
      '1': {
        paragraph: 'En las cámaras vieron a alguien entrar a Ala Médica sin usar la puerta y luego aparecer corriendo en Cafetería. ¡Es hora de reunir evidencia!',
        choices: [
          'Correr al Botón de Emergencia y pedir escáner de MedBay para todos',
          'Revisar el Mapa de Admin para ver en qué sala hay dos íconos juntos',
          'Seguir a distancia al sospechoso con todo el equipo detrás',
        ],
      },
      '2': {
        paragraph: 'Mientras cuidaban Cafetería sonó la alarma roja de Sabotaje de O2 con solo 30 segundos en el reloj. Uno en Admin y otro en O2 necesitan el código ya.',
        choices: [
          'Dividirse en parejas para cubrir O2 y Admin sin ir solos',
          'Correr directo al panel de O2 a teclear la clave de 5 dígitos',
          'Revisar primero el panel de Admin y cantar la clave por radio',
        ],
      },
    },
    endings: {
      '0': {
        title: '¡Victoria Tripulante en Skeld!',
        text: 'Restauraron las luces, reunieron votos en Cafetería y expulsaron al Impostor al espacio exterior entre aplausos.',
        rating: 10,
      },
      '1': {
        title: 'Detectives del Espacio',
        text: 'El Mapa de Admin y las cámaras delataron al Shapeshifter antes de que pudiera cambiar de color. Misión impecable.',
        rating: 10,
      },
      '2': {
        title: 'Oxígeno a Salvo en el Último Segundo',
        text: 'Detuvieron el sabotaje con 1 segundo en el reloj y completaron la última tarea visual en Armas. ¡La nave sigue a salvo!',
        rating: 9,
      },
    },
  },
];

export interface StorySessionEngine {
  start: LocalStoryNode;
  getNextNode: (chapter: number, choiceIndex: number) => LocalStoryNode;
  getEnding: (choiceIndex: number) => LocalStoryEnding;
}

export function createStorySession(theme: ThemeMode): StorySessionEngine {
  const pool =
    theme === 'fnaf' ? FNAF_STORIES : theme === 'amongus' ? AU_STORIES : CLASSIC_STORIES;
  const tpl = pickRandom(pool);

  const extraNodes: LocalStoryNode[] =
    theme === 'fnaf'
      ? [
          {
            paragraph: 'A las 5:00 AM la oficina quedó casi a oscuras y una música de caja musical sonó desde el pasillo izquierdo. El grupo solo tiene una oportunidad para aguantar hasta el alba.',
            choices: [
              'Quedarse completamente quietos conteniendo la respiración',
              'Dar el último vistazo al monitor de cámaras',
              'Sostener ambos botones de puerta hasta el último segundo',
            ],
          },
        ]
      : theme === 'amongus'
        ? [
            {
              paragraph: 'Todos llegaron a Cafetería con el tiempo encima. Quedan dos sospechosos principales y uno jura haber hecho escáner en Ala Médica mientras el otro dice que estuvo en Escudos.',
              choices: [
                'Pedirles que hagan una tarea visual frente a todos',
                'Votar por el que entró al pasillo justo antes del sabotaje',
                'Omitir voto y vigilar juntos en grupo las últimas 2 tareas',
              ],
            },
          ]
        : [
            {
              paragraph: 'En el tramo final apareció un último obstáculo divertidísimo que puso a prueba las risas y reflejos de toda la sala.',
              choices: [
                'Resolverlo todos juntos contando hasta tres',
                'Probar la idea más loca y creativa del grupo',
                'Hacer un último movimiento relámpago antes de que cierre la puerta',
              ],
            },
          ];

  return {
    start: tpl.start,
    getNextNode: (chapter: number, choiceIndex: number) => {
      if (chapter === 1) {
        return tpl.branches[String(choiceIndex)] ?? tpl.branches['0'];
      }
      return pickRandom(extraNodes);
    },
    getEnding: (choiceIndex: number) => {
      const e = tpl.endings[String(choiceIndex)] ?? tpl.endings['0'];
      recordAiItems(`historia_${theme}`, [e.title], 30);
      return e;
    },
  };
}
