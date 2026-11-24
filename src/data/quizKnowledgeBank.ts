import {
  ClueCard,
  EmojiPuzzle,
  ImpostorRound,
  TriviaQuestion,
  TrueFalseStatement,
} from '../types/game';
import {ThemeMode} from '../utils/stageAudio';
import {filterFreshAiItems, recordAiItems} from '../utils/aiHistory';

function shuffleCopy<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function shuffleTriviaOptions(q: TriviaQuestion): TriviaQuestion {
  const correctText = q.options[q.correctIndex];
  const shuffled = shuffleCopy(q.options) as [string, string, string, string];
  return {
    ...q,
    options: shuffled,
    correctIndex: shuffled.indexOf(correctText),
  };
}

function shuffleEmojiOptions(p: EmojiPuzzle): EmojiPuzzle {
  const correctText = p.options[p.correctIndex];
  const shuffled = shuffleCopy(p.options) as [string, string, string, string];
  return {
    ...p,
    options: shuffled,
    correctIndex: shuffled.indexOf(correctText),
  };
}

function shuffleClueOptions(c: ClueCard): ClueCard {
  return {
    ...c,
    options: shuffleCopy(c.options) as [string, string, string, string],
  };
}

/* -------------------------------------------------------------------------- */
/* 1. TRIVIA RELÁMPAGO (CLÁSICO, FNAF Y CANON AMONG US)                       */
/* -------------------------------------------------------------------------- */

const CLASSIC_TRIVIA: TriviaQuestion[] = [
  {question: '¿Cuál es el planeta más grande del sistema solar?', options: ['Júpiter', 'Saturno', 'Neptuno', 'Urano'], correctIndex: 0, explanation: 'Júpiter supera en masa a todos los demás planetas juntos.'},
  {question: '¿Qué animal es el único mamífero capaz de volar de verdad?', options: ['Murciélago', 'Ardilla voladora', 'Colibrí', 'Lémur'], correctIndex: 0, explanation: 'Los murciélagos tienen alas con membrana que les permiten vuelo sostenido.'},
  {question: '¿Cuántos colores tiene un cubo de Rubik clásico 3x3?', options: ['6 colores', '4 colores', '8 colores', '9 colores'], correctIndex: 0, explanation: 'Tiene una cara de cada color: blanco, amarillo, rojo, naranja, azul y verde.'},
  {question: '¿En qué videojuego aparece por primera vez Mario como "Jumpman"?', options: ['Donkey Kong', 'Super Mario Bros', 'Mario Kart', 'Pac-Man'], correctIndex: 0, explanation: 'En 1981 Mario debutó saltando barriles en el arcade Donkey Kong.'},
  {question: '¿Cuál es el océano más grande y profundo de la Tierra?', options: ['Océano Pacífico', 'Océano Atlántico', 'Océano Índico', 'Océano Ártico'], correctIndex: 0, explanation: 'El Pacífico cubre casi un tercio de la superficie terrestre.'},
  {question: '¿Qué instrumento musical tiene 88 teclas en su formato estándar?', options: ['Piano', 'Acordeón', 'Xilófono', 'Órgano portátil'], correctIndex: 0, explanation: 'Un piano moderno cuenta con 52 teclas blancas y 36 negras.'},
  {question: '¿Cuál es el metal líquido a temperatura ambiente?', options: ['Mercurio', 'Plomo', 'Aluminio', 'Titanio'], correctIndex: 0, explanation: 'El mercurio se mantiene líquido desde los -38 °C.'},
  {question: '¿Qué país tiene la forma aproximada de una bota en el mapa?', options: ['Italia', 'Grecia', 'Portugal', 'Chile'], correctIndex: 0, explanation: 'La península itálica parece una bota pateando a Sicilia.'},
  {question: '¿Cuántos corazones tiene un pulpo?', options: ['3 corazones', '1 corazón', '2 corazones', '5 corazones'], correctIndex: 0, explanation: 'Dos bombean sangre a las branquias y uno al resto del cuerpo.'},
  {question: '¿De qué película animada es el personaje "Rayo McQueen"?', options: ['Cars', 'Toy Story', 'Turbo', 'Aviones'], correctIndex: 0, explanation: 'Rayo McQueen es el auto de carreras #95 de Pixar Cars.'},
  {question: '¿Qué gas absorben principalmente las plantas para hacer fotosíntesis?', options: ['Dióxido de carbono', 'Oxígeno', 'Nitrógeno', 'Helio'], correctIndex: 0, explanation: 'Toman CO2 y liberan oxígeno gracias a la luz solar.'},
  {question: '¿Cuál es la montaña más alta del mundo sobre el nivel del mar?', options: ['Monte Everest', 'K2', 'Aconcagua', 'Kilimanjaro'], correctIndex: 0, explanation: 'El Everest mide 8,848 metros de altura en el Himalaya.'},
  {question: '¿Qué personaje de videojuegos recolecta anillos dorados a toda velocidad?', options: ['Sonic', 'Crash Bandicoot', 'Link', 'Kirby'], correctIndex: 0, explanation: 'Sonic the Hedgehog usa los anillos para protegerse.'},
  {question: '¿Cuántos lados tiene un hexágono?', options: ['6 lados', '5 lados', '7 lados', '8 lados'], correctIndex: 0, explanation: 'Un hexágono es un polígono de seis lados y seis vértices.'},
  {question: '¿Qué fruta da origen a las pasas?', options: ['Uva', 'Ciruela', 'Higo', 'Dátil'], correctIndex: 0, explanation: 'Las pasas son uvas deshidratadas al sol o en horno.'},
  {question: '¿Cuál es el hueso más largo del cuerpo humano?', options: ['Fémur', 'Húmero', 'Tibia', 'Radio'], correctIndex: 0, explanation: 'El fémur está en el muslo y soporta gran parte del peso.'},
  {question: '¿Qué estudio creó "El Viaje de Chihiro" y "Mi Vecino Totoro"?', options: ['Studio Ghibli', 'Pixar', 'DreamWorks', 'Illumination'], correctIndex: 0, explanation: 'Fueron dirigidas por Hayao Miyazaki en Studio Ghibli.'},
  {question: '¿Cuántos minutos dura normalmente un partido de fútbol profesional sin reposición?', options: ['90 minutos', '80 minutos', '60 minutos', '100 minutos'], correctIndex: 0, explanation: 'Se divide en dos tiempos de 45 minutos cada uno.'},
  {question: '¿Cuál es el satélite natural de la Tierra?', options: ['La Luna', 'Fobos', 'Titán', 'Europa'], correctIndex: 0, explanation: 'La Luna tarda unos 27.3 días en dar la vuelta a la Tierra.'},
  {question: '¿De qué animal viene la miel natural?', options: ['Abeja', 'Avispa', 'Mariposa', 'Hormiga'], correctIndex: 0, explanation: 'Las abejas transforman el néctar de las flores en miel.'},
  {question: '¿Cuál es el idioma oficial más hablado en Brasil?', options: ['Portugués', 'Español', 'Francés', 'Italiano'], correctIndex: 0, explanation: 'Brasil es el único país lusófono de América.'},
  {question: '¿Qué juego de mesa usa propiedades como "Paseo Tablado" o casas y hoteles?', options: ['Monopoly', 'Risk', 'Clue', 'Catan'], correctIndex: 0, explanation: 'En Monopoly compras calles, cobras renta y construyes hoteles.'},
  {question: '¿En qué ciudad se encuentra la Torre Eiffel?', options: ['París', 'Londres', 'Roma', 'Madrid'], correctIndex: 0, explanation: 'Se inauguró en París en 1889.'},
  {question: '¿Qué vitamina se produce naturalmente cuando tomamos luz solar con moderación?', options: ['Vitamina D', 'Vitamina C', 'Vitamina B12', 'Vitamina K'], correctIndex: 0, explanation: 'La piel sintetiza vitamina D al exponerse al sol.'},
  {question: '¿Cómo se llama el martillo mágico de Thor en la mitología y cómics?', options: ['Mjölnir', 'Excalibur', 'Stormbreaker', 'Tridente'], correctIndex: 0, explanation: 'Mjölnir es el martillo legendario de Thor.'},
  {question: '¿Cuál es el animal terrestre más rápido en carrera corta?', options: ['Guepardo', 'León', 'Gacela', 'Caballo'], correctIndex: 0, explanation: 'El guepardo supera los 100 km/h en pocos segundos.'},
  {question: '¿Cuántas cuerdas tiene normalmente una guitarra española clásica?', options: ['6 cuerdas', '4 cuerdas', '5 cuerdas', '8 cuerdas'], correctIndex: 0, explanation: 'Una guitarra estándar tiene 6 cuerdas afinadas Mi-La-Re-Sol-Si-Mi.'},
  {question: '¿Qué bloque verde explota acercándose en Minecraft?', options: ['Creeper', 'Enderman', 'Slime', 'Esqueleto'], correctIndex: 0, explanation: 'El Creeper sisea antes de explotar junto al jugador.'},
  {question: '¿Qué órgano del cuerpo humano bombea la sangre?', options: ['El corazón', 'Los pulmones', 'El hígado', 'El estómago'], correctIndex: 0, explanation: 'Late más de 100 mil veces al día impulsando la sangre.'},
  {question: '¿Cuál es el río más caudaloso del mundo?', options: ['Río Amazonas', 'Río Nilo', 'Río Misisipi', 'Río Danubio'], correctIndex: 0, explanation: 'El Amazonas aporta cerca del 20% del agua dulce fluvial a los océanos.'},
];

const FNAF_TRIVIA: TriviaQuestion[] = [
  {question: '¿Quién es el único animatrónico de FNAF 1 que corre visiblemente por el pasillo en cámara?', options: ['Foxy', 'Bonnie', 'Chica', 'Freddy'], correctIndex: 0, explanation: 'Si sale de Pirate Cove, corre por el pasillo oeste hacia tu puerta.'},
  {question: '¿Por qué lado entra Chica a tu oficina en Five Nights at Freddy’s 1?', options: ['Puerta derecha', 'Puerta izquierda', 'Conducto superior', 'Escenario'], correctIndex: 0, explanation: 'Bonnie ataca por la izquierda y Chica junto a Freddy por la derecha.'},
  {question: '¿En qué entrega de FNAF aparece por primera vez The Puppet (Marionette)?', options: ['FNAF 2', 'FNAF 1', 'FNAF 3', 'FNAF 4'], correctIndex: 0, explanation: 'En FNAF 2 debes darle cuerda constante a su caja musical en Prize Corner.'},
  {question: '¿Qué hace Balloon Boy si logra entrar en tu oficina en FNAF 2?', options: ['Desactiva tu linterna', 'Te asusta al instante', 'Cierra las puertas', 'Apaga la caja musical'], correctIndex: 0, explanation: 'Se ríe en la esquina y bloquea tu linterna, dejando paso a Foxy.'},
  {question: '¿Cuál es el único animatrónico real (físico) que te persigue en FNAF 3?', options: ['Springtrap', 'Phantom Freddy', 'Ennard', 'Circus Baby'], correctIndex: 0, explanation: 'Los demás en Fazbear’s Fright son alucinaciones Phantom.'},
  {question: '¿Cómo distraes a Springtrap lejos de tu oficina en FNAF 3?', options: ['Con el Audio Lure', 'Poniéndote máscara', 'Con la linterna', 'Tocando la nariz de Freddy'], correctIndex: 0, explanation: 'Reproduciendo la voz infantil en otra cámara atraes a Springtrap hacia ahí.'},
  {question: '¿Qué debes hacer en las puertas del dormitorio en FNAF 4 antes de usar la linterna?', options: ['Escuchar la respiración', 'Dar cuerda a la caja', 'Reiniciar el video', 'Cerrar el monitor'], correctIndex: 0, explanation: 'Si escuchas respiración en la puerta y alumbras, te atacan de inmediato.'},
  {question: '¿Quién creó el primer Five Nights at Freddy’s en 2014?', options: ['Scott Cawthon', 'Toby Fox', 'Innersloth', 'RobTop'], correctIndex: 0, explanation: 'Scott Cawthon diseñó y programó el juego tras recibir críticas sobre sus modelos.'},
  {question: '¿Qué animatrónico aparece con la melodía "Toreador March" cuando la batería llega a 0% en FNAF 1?', options: ['Freddy Fazbear', 'Golden Freddy', 'Bonnie', 'Springtrap'], correctIndex: 0, explanation: 'La cara iluminada de Freddy suena con su cajita musical antes del corte final.'},
  {question: '¿Cómo evitas a Golden Freddy cuando aparece sentado en tu oficina en FNAF 1?', options: ['Subiendo el monitor rápido', 'Cerrando ambas puertas', 'Apagando el ventilador', 'Tocando la campana'], correctIndex: 0, explanation: 'Subir rápidamente las cámaras hace que desaparezca.'},
  {question: '¿En qué juego debutan Circus Baby, Ballora y Funtime Foxy?', options: ['Sister Location', 'FNAF 3', 'Pizzeria Simulator', 'Security Breach'], correctIndex: 0, explanation: 'Sister Location (FNAF 5) ocurre en Circus Baby’s Entertainment and Rental.'},
  {question: '¿Cómo se llama el establecimiento gigante de FNAF: Security Breach?', options: ['Mega Pizzaplex', 'Fazbear’s Fright', 'Fredbear’s Diner', 'Circus World'], correctIndex: 0, explanation: 'Gregory recorre el enorme Freddy Fazbear’s Mega Pizzaplex.'},
  {question: '¿Qué animatrónico en FNAF 2 NO se deja engañar por la máscara de Freddy?', options: ['Withered Foxy y Puppet', 'Toy Bonnie y Toy Chica', 'Mangle y BB', 'Withered Freddy'], correctIndex: 0, explanation: 'A Withered Foxy hay que alumbrarlo con la linterna y a Puppet darle cuerda.'},
  {question: '¿Qué hora marca el reloj cuando sobrevives con éxito una noche en FNAF?', options: ['6:00 AM', '5:00 AM', '7:00 AM', '12:00 PM'], correctIndex: 0, explanation: 'El turno nocturno dura de 12:00 AM a 6:00 AM.'},
  {question: '¿Cuántas entregas o animatrónicos enfrentas en Ultimate Custom Night (UCN)?', options: ['50 animatrónicos', '12 animatrónicos', '25 animatrónicos', '80 animatrónicos'], correctIndex: 0, explanation: 'UCN reúne a 50 personajes ajustables del 0 al 20 de dificultad.'},
];

// TRIVIA 100% CANÓNICA DE AMONG US (SKELD, MIRA HQ, POLUS, AIRSHIP, FUNGLE, ROLES Y MECÁNICAS)
const AMONGUS_TRIVIA: TriviaQuestion[] = [
  {question: '¿Cuántas cámaras de seguridad activas vigila el panel de Seguridad en The Skeld?', options: ['4 cámaras', '6 cámaras', '2 cámaras', '8 cámaras'], correctIndex: 0, explanation: 'Vigilam Ala Médica, Administración, Navegación y Seguridad/Reactor.'},
  {question: '¿Qué tarea de The Skeld tiene animación visual visible para los demás jugadores?', options: ['Escáner de Ala Médica', 'Pasar tarjeta en Admin', 'Descargar datos', 'Alinear salida de motor'], correctIndex: 0, explanation: 'Las 4 tareas visuales en Skeld son: Escáner, Asteroides en Armas, Escudos y Basura en Almacén.'},
  {question: '¿Qué pasa con el sabotaje de Reactor y O2 a diferencia de Luces o Comms?', options: ['Tiene cuenta regresiva mortal', 'No tiene límite de tiempo', 'Solo cierra puertas', 'Expulsa a un jugador'], correctIndex: 0, explanation: 'Si O2 o Reactor llegan a cero segundos, ganan automáticamente los Impostores.'},
  {question: '¿Cuántas manos o jugadores simultáneos se necesitan para detener el sabotaje del Reactor en Skeld?', options: ['2 jugadores a la vez', '1 solo jugador', '3 jugadores', '4 jugadores'], correctIndex: 0, explanation: 'Dos tripulantes deben mantener su mano en los dos paneles al mismo tiempo.'},
  {question: '¿En qué sala de The Skeld está el panel eléctrico para restaurar las luces?', options: ['Electricidad', 'Administración', 'Cafetería', 'Almacén'], correctIndex: 0, explanation: 'El cuadro de 5 interruptores verdes está dentro de Electricidad.'},
  {question: '¿Qué muestra exactamente la Mesa de Administración (Admin Table) en The Skeld?', options: ['Cantidad de personas por sala', 'Nombres y colores exactos', 'Quién es el Impostor', 'Dónde están las alcantarillas'], correctIndex: 0, explanation: 'Muestra íconos amarillos anónimos por cada sala cerrada (sin mostrar quién es cada uno).'},
  {question: '¿Qué rol de Tripulante puede entrar y salir de las alcantarillas (vents)?', options: ['Ingeniero', 'Científico', 'Rastreador', 'Ángel Guardián'], correctIndex: 0, explanation: 'El Ingeniero puede usar las alcantarillas con un tiempo límite y enfriamiento.'},
  {question: '¿Qué rol de Impostor deja un rastro o puede copiar el color y aspecto de otro tripulante?', options: ['Cambiaformas (Shapeshifter)', 'Fantasma (Phantom)', 'Víbora', 'Ingeniero'], correctIndex: 0, explanation: 'El Shapeshifter se transforma temporalmente dejando una cápsula de evidencia al mutar.'},
  {question: '¿Qué mapa de Among Us tiene el puente de lava y el tablero de Signos Vitales (Vitals)?', options: ['Polus', 'The Skeld', 'MIRA HQ', 'The Fungle'], correctIndex: 0, explanation: 'Polus introdujo los Vitals en Oficina y el Pozo de Lava para las expulsiones.'},
  {question: '¿Qué mapa de Among Us tiene TODAS sus alcantarillas conectadas entre sí en una sola red?', options: ['MIRA HQ', 'The Skeld', 'Polus', 'The Airship'], correctIndex: 0, explanation: 'En MIRA HQ cualquier vent lleva a todas las demás alcantarillas del mapa.'},
  {question: '¿Qué mapa permite elegir en qué sala apareces tras cada reunión?', options: ['The Airship', 'The Skeld', 'Polus', 'MIRA HQ'], correctIndex: 0, explanation: 'The Airship deja elegir entre 3 salas de aparición al terminar cada reunión.'},
  {question: '¿Qué estudio desarrolló y publicó Among Us en 2018?', options: ['Innersloth', 'Epic Games', 'Rovio', 'Mojang'], correctIndex: 0, explanation: 'Innersloth lanzó Among Us en 2018 y explotó en popularidad mundial en 2020.'},
  {question: '¿Qué tarea NO hace subir la barra verde hasta completar su parte final?', options: ['Tareas de múltiples pasos', 'Escáner de Ala Médica', 'Disparar asteroides', 'Calibrar distribuidor'], correctIndex: 0, explanation: 'Como Descargar/Subir datos o Arreglar cables en 3 sitios: solo sube al terminar el último paso.'},
  {question: '¿Qué sucede en The Skeld si el Impostor sabotea las Comunicaciones (Comms)?', options: ['Se ocultan tareas, cámaras y Admin', 'Se apagan todas las luces', 'Se cierran las puertas 1 minuto', 'No se puede reportar cuerpos'], correctIndex: 0, explanation: 'Comms anula temporalmente la lista de tareas, la barra, cámaras y mesa de Admin.'},
  {question: '¿Cuándo pueden seguir ayudando a ganar los tripulantes que ya fueron eliminados o expulsados?', options: ['Terminando sus tareas como fantasmas', 'Votando en secreto', 'Cerrando puertas', 'Reparando el Reactor'], correctIndex: 0, explanation: 'Los fantasmas atraviesan paredes y sus tareas cuentan igual para la barra de victoria.'},
  {question: '¿Qué rol tiene un tripulante fantasma que puede poner un escudo protector temporal sobre un vivo?', options: ['Ángel Guardián', 'Científico', 'Rastreador', 'Alborotador'], correctIndex: 0, explanation: 'Es el único rol que se activa al morir como tripulante para bloquear un ataque del Impostor.'},
  {question: '¿Qué función tiene el rol de Alborotador (Noisemaker) al ser eliminado?', options: ['Emite una alerta direccional', 'Se vuelve invisible', 'Bloquea las alcantarillas', 'Vota dos veces'], correctIndex: 0, explanation: 'Cuando muere un Noisemaker, todos reciben una alerta sonora y flecha hacia su cuerpo.'},
  {question: '¿Cuál de estas tareas en The Skeld requiere mantener presionado para llenar un tanque de combustible?', options: ['Motores (Gasolina)', 'Calibrar Distribuidor', 'Estabilizar Dirección', 'Desbloquear Colectores'], correctIndex: 0, explanation: 'Debes llenar la lata en Almacén y llevarla a Motor Superior e Inferior.'},
  {question: '¿Qué te indica que alguien es el Impostor al ver la animación de los asteroides en Armas?', options: ['Si está ahí pero NO disparan los cañones', 'Si disparan láser verde', 'Si dispara muy rápido', 'Si la puerta está cerrada'], correctIndex: 0, explanation: 'Si las tareas visuales están activadas, un Impostor fingiendo Armas nunca activa el láser exterior.'},
  {question: '¿Qué ocurre con el mapa The Fungle respecto a los sabotajes?', options: ['Tiene sabotaje de Mix Up de esporas', 'No tiene alcantarillas', 'No tiene botón de reunión', 'Solo se juega con 20 jugadores'], correctIndex: 0, explanation: 'El sabotaje Mushroom Mixup cambia temporalmente el color y ropa de todos los jugadores.'},
  {question: '¿Qué muestran los Registros de Puertas (Doorlog) en MIRA HQ?', options: ['Qué jugadores cruzaron cada sensor', 'Quién usó las alcantarillas', 'Dónde murió alguien', 'La barra de oxígeno'], correctIndex: 0, explanation: 'Los sensores norte, suroeste y sureste registran quién pasa por los pasillos.'},
  {question: '¿En qué dos salas de The Skeld están los códigos del sabotaje de O2?', options: ['O2 y Administración', 'Cafetería y Seguridad', 'Reactor y Motores', 'Armas y Navegación'], correctIndex: 0, explanation: 'Un panel está en Oxígeno (O2) y el otro dentro de Administración.'},
  {question: '¿Cómo se llama el rol de Impostor que puede volverse completamente invisible unos segundos?', options: ['Fantasma (Phantom)', 'Cambiaformas', 'Rastreador', 'Víbora'], correctIndex: 0, explanation: 'El Phantom desaparece dejando una nube de humo antes de hacerse invisible.'},
  {question: '¿Qué indica el pequeño parpadeo rojo en las cámaras de seguridad de The Skeld?', options: ['Que alguien está mirando las cámaras', 'Que el Impostor está cerca', 'Que se dañó la cámara', 'Que la tarea terminó'], correctIndex: 0, explanation: 'Si ves la luz roja parpadeando en la cámara del pasillo, alguien está vigilando desde Seguridad.'},
  {question: '¿Cuántos colores de traje distintos había originalmente en el lanzamiento base clásico de Skeld antes de los 18 actuales?', options: ['12 colores', '6 colores', '24 colores', '8 colores'], correctIndex: 0, explanation: 'Originalmente eran 12 colores; luego con el lobby de 15 jugadores subieron a 18.'},
];

export function getTriviaBatch(
  theme: ThemeMode,
  historyKey: string,
  count = 5,
): TriviaQuestion[] {
  const pool =
    theme === 'fnaf' ? FNAF_TRIVIA : theme === 'amongus' ? AMONGUS_TRIVIA : CLASSIC_TRIVIA;
  const fresh = filterFreshAiItems(historyKey, shuffleCopy(pool), (q) => q.question, 60);
  return fresh.slice(0, count).map(shuffleTriviaOptions);
}

/* -------------------------------------------------------------------------- */
/* 2. EL IMPOSTOR SECRETO                                                     */
/* -------------------------------------------------------------------------- */

const CLASSIC_IMPOSTOR: ImpostorRound[] = [
  {category: 'Lugares', secretWord: 'Aeropuerto', impostorHint: 'Tiene filas y maletas', starterQuestion: '¿Qué es lo primero que haces al llegar ahí?'},
  {category: 'Lugares', secretWord: 'Cine', impostorHint: 'Está oscuro y hay olor rico', starterQuestion: '¿Con quién irías y qué comprarías?'},
  {category: 'Lugares', secretWord: 'Hospital', impostorHint: 'Huele muy limpio', starterQuestion: '¿Qué prenda usa la gente que trabaja ahí?'},
  {category: 'Lugares', secretWord: 'Supermercado', impostorHint: 'Usas un vehículo pequeño sin motor', starterQuestion: '¿Por qué pasillo empiezas siempre?'},
  {category: 'Lugares', secretWord: 'Playa', impostorHint: 'Termina en tu ropa al volver', starterQuestion: '¿Qué no puedes olvidar empacar?'},
  {category: 'Lugares', secretWord: 'Biblioteca', impostorHint: 'Hay que cuidar el volumen', starterQuestion: '¿Cuánto tiempo te quedarías ahí?'},
  {category: 'Lugares', secretWord: 'Zoológico', impostorHint: 'Se camina bastante al aire libre', starterQuestion: '¿Cuál es tu parte favorita del recorrido?'},
  {category: 'Comida', secretWord: 'Pizza', impostorHint: 'Viene en caja plana', starterQuestion: '¿Qué ingrediente nunca debería faltar?'},
  {category: 'Comida', secretWord: 'Helado', impostorHint: 'Hay que comerlo antes de que cambie', starterQuestion: '¿En vaso o en otra presentación?'},
  {category: 'Comida', secretWord: 'Tacos', impostorHint: 'Se come con la mano inclinando la cabeza', starterQuestion: '¿Suave o picante?'},
  {category: 'Comida', secretWord: 'Hamburguesa', impostorHint: 'Tiene varias capas', starterQuestion: '¿Qué salsa le pones siempre?'},
  {category: 'Comida', secretWord: 'Palomitas', impostorHint: 'Hacen ruido al prepararse', starterQuestion: '¿Dulces o saladas?'},
  {category: 'Objetos', secretWord: 'Paraguas', impostorHint: 'Se abre cuando menos quieres usarlo', starterQuestion: '¿Dónde suele quedarse olvidado?'},
  {category: 'Objetos', secretWord: 'Reloj', impostorHint: 'Tiene números o manecillas', starterQuestion: '¿Lo miras muchas veces al día?'},
  {category: 'Objetos', secretWord: 'Mochila', impostorHint: 'Va detrás de ti', starterQuestion: '¿Qué cosa rara has cargado ahí dentro?'},
  {category: 'Objetos', secretWord: 'Control remoto', impostorHint: 'Desaparece entre cojines', starterQuestion: '¿Quién lo acapara más en tu casa?'},
  {category: 'Animales', secretWord: 'Pingüino', impostorHint: 'Parece llevar traje elegante', starterQuestion: '¿Cómo camina?'},
  {category: 'Animales', secretWord: 'Camaleón', impostorHint: 'Se esconde sin moverse', starterQuestion: '¿Cuál es su habilidad más famosa?'},
  {category: 'Profesiones', secretWord: 'Bombero', impostorHint: 'Usa ropa muy pesada y casco', starterQuestion: '¿Qué vehículo maneja?'},
  {category: 'Profesiones', secretWord: 'Astronauta', impostorHint: 'Trabaja muy lejos de casa', starterQuestion: '¿Cómo es su traje?'},
  {category: 'Deportes', secretWord: 'Natación', impostorHint: 'No usas zapatos', starterQuestion: '¿Qué accesorio necesitas para los ojos?'},
  {category: 'Deportes', secretWord: 'Ajedrez', impostorHint: 'El reloj importa y no corres', starterQuestion: '¿Cuál pieza te parece más fuerte?'},
].map(({category, secretWord, impostorHint, starterQuestion}) => ({
  category,
  secretWord,
  impostorHint,
  starterQuestion,
}));

const FNAF_IMPOSTOR: ImpostorRound[] = [
  {category: 'Animatrónico', secretWord: 'Freddy Fazbear', impostorHint: 'Lleva sombrero negro', starterQuestion: '¿Qué canción suena cuando se va la luz?'},
  {category: 'Animatrónico', secretWord: 'Foxy', impostorHint: 'Tiene garfio y parche', starterQuestion: '¿En qué sala empieza escondido?'},
  {category: 'Animatrónico', secretWord: 'The Puppet', impostorHint: 'Depende de una melodía', starterQuestion: '¿Cómo lo mantienes dormido en FNAF 2?'},
  {category: 'Animatrónico', secretWord: 'Springtrap', impostorHint: 'Está muy dañado y es verde oliva', starterQuestion: '¿Qué usas para alejarlo en FNAF 3?'},
  {category: 'Animatrónico', secretWord: 'Balloon Boy', impostorHint: 'Trae un cartel y globo', starterQuestion: '¿Qué te quita si entra en la oficina?'},
  {category: 'Animatrónico', secretWord: 'Chica', impostorHint: 'Lleva babero blanco', starterQuestion: '¿Qué tiene en su mano?'},
  {category: 'Objeto FNAF', secretWord: 'Máscara de Freddy', impostorHint: 'La pones frente a la cara', starterQuestion: '¿Contra quién NO funciona bien?'},
  {category: 'Objeto FNAF', secretWord: 'Puerta blindada', impostorHint: 'Consume mucha batería si queda abajo', starterQuestion: '¿De qué color es el botón para bajarla?'},
  {category: 'Sala FNAF', secretWord: 'Pirate Cove', impostorHint: 'Tiene cortinas moradas con estrellas', starterQuestion: '¿Qué letrero aparece cuando queda vacía?'},
  {category: 'Sala FNAF', secretWord: 'Oficina de Seguridad', impostorHint: 'Tiene un ventilador que no se apaga', starterQuestion: '¿Qué hay en el escritorio frente a ti?'},
  {category: 'Objeto FNAF', secretWord: 'Linterna', impostorHint: 'Usa pilas limitadas en FNAF 2', starterQuestion: '¿Contra qué animatrónico es obligatoria?'},
  {category: 'Animatrónico', secretWord: 'Circus Baby', impostorHint: 'Pertenece a Sister Location', starterQuestion: '¿Qué dulce ofrecía en su minijuego?'},
];

const AMONGUS_IMPOSTOR: ImpostorRound[] = [
  {category: 'Sala Skeld', secretWord: 'Cafetería', impostorHint: 'Está en el centro superior', starterQuestion: '¿Qué objeto rojo hay justo en medio?'},
  {category: 'Sala Skeld', secretWord: 'Electricidad', impostorHint: 'Es un rincón muy peligroso', starterQuestion: '¿Cuántas tareas suelen juntarse ahí dentro?'},
  {category: 'Sala Skeld', secretWord: 'Ala Médica (MedBay)', impostorHint: 'Tiene camillas y luz verde', starterQuestion: '¿Qué tarea visual famosa se hace ahí?'},
  {category: 'Sala Skeld', secretWord: 'Administración (Admin)', impostorHint: 'Tiene una mesa con mapa digital', starterQuestion: '¿Qué tarea frustra a medio mundo ahí?'},
  {category: 'Tarea Visual', secretWord: 'Disparar Asteroides', impostorHint: 'Tiene silla giratoria', starterQuestion: '¿Qué se ve desde afuera de la nave cuando alguien la hace?'},
  {category: 'Tarea Visual', secretWord: 'Vaciar Basura', impostorHint: 'Se jala una palanca hacia abajo', starterQuestion: '¿Dónde termina el segundo paso de esta tarea?'},
  {category: 'Sabotaje', secretWord: 'Sabotaje de O2', impostorHint: 'Tiene reloj mortal de 30 segundos', starterQuestion: '¿En qué dos lugares metes el código?'},
  {category: 'Sabotaje', secretWord: 'Sabotaje de Reactor', impostorHint: 'La pantalla brilla roja y suena alarma', starterQuestion: '¿Cuántos jugadores deben tocar los paneles a la vez?'},
  {category: 'Rol', secretWord: 'Cambiaformas (Shapeshifter)', impostorHint: 'Puede confundir a cualquiera en cámara', starterQuestion: '¿Qué deja en el suelo cuando se transforma?'},
  {category: 'Rol', secretWord: 'Ingeniero', impostorHint: 'Usa algo que normalmente da sospecha', starterQuestion: '¿Por qué es peligroso hacerlo frente a gente que no confía?'},
  {category: 'Mapa', secretWord: 'Polus', impostorHint: 'Tiene nieve y suelo abierto', starterQuestion: '¿Cómo salen expulsados aquí al perder votación?'},
  {category: 'Mecánica', secretWord: 'Alcantarilla (Vent)', impostorHint: 'Permite viajar rápido entre salas', starterQuestion: '¿Quiénes pueden usarla legalmente?'},
];

export function getImpostorRound(theme: ThemeMode, historyKey: string): ImpostorRound {
  const pool =
    theme === 'fnaf' ? FNAF_IMPOSTOR : theme === 'amongus' ? AMONGUS_IMPOSTOR : CLASSIC_IMPOSTOR;
  const fresh = filterFreshAiItems(historyKey, shuffleCopy(pool), (r) => r.secretWord, 45);
  return fresh[0] ?? pool[0];
}

/* -------------------------------------------------------------------------- */
/* 3. CINE / MISIONES EN EMOJIS                                               */
/* -------------------------------------------------------------------------- */

const CLASSIC_EMOJI: EmojiPuzzle[] = [
  {emojis: '🦁👑🌅', options: ['El Rey León', 'Madagascar', 'El Libro de la Selva', 'Tarzán'], correctIndex: 0, hint: 'Clásico animado de la sabana'},
  {emojis: '🤠🚀🧸', options: ['Toy Story', 'Cars', 'Wall-E', 'Up'], correctIndex: 0, hint: 'Juguetes que cobran vida'},
  {emojis: '❄️👸⛄', options: ['Frozen', 'Valiente', 'Enredados', 'Moana'], correctIndex: 0, hint: 'Libre soy'},
  {emojis: '🎈🏠👴', options: ['Up: Una aventura de altura', 'Coco', 'Intensamente', 'Luca'], correctIndex: 0, hint: 'Una casa voladora con globos'},
  {emojis: '🐠🔍🌊', options: ['Buscando a Nemo', 'La Sirenita', 'Espantatiburones', 'Ponyo'], correctIndex: 0, hint: 'Un pez payaso perdido'},
  {emojis: '🕷️🧑🕸️', options: ['Spider-Man', 'Ant-Man', 'Batman', 'Flash'], correctIndex: 0, hint: 'Un gran poder conlleva una gran responsabilidad'},
  {emojis: '🎸💀🌺', options: ['Coco', 'El Libro de la Vida', 'Encanto', 'Soul'], correctIndex: 0, hint: 'Día de Muertos y música'},
  {emojis: '🐀👨‍🍳🍲', options: ['Ratatouille', 'Garfield', 'Stuart Little', 'Zootopia'], correctIndex: 0, hint: 'Cualquiera puede cocinar en París'},
  {emojis: '🦖🚙🌴', options: ['Jurassic Park', 'Godzilla', 'King Kong', 'Ice Age'], correctIndex: 0, hint: 'Parque con dinosaurios clonados'},
  {emojis: '🧙‍♂️⚡🦉', options: ['Harry Potter', 'El Señor de los Anillos', 'Narnia', 'Percy Jackson'], correctIndex: 0, hint: 'Colegio Hogwarts de magia'},
  {emojis: '🚢🧊💔', options: ['Titanic', 'Piratas del Caribe', 'Poseidón', 'Náufrago'], correctIndex: 0, hint: 'Un barco gigante y un iceberg'},
  {emojis: '🍄⭐🐢', options: ['Super Mario Bros', 'Sonic', 'Zelda', 'Donkey Kong'], correctIndex: 0, hint: 'Fontanero saltando tuberías'},
  {emojis: '⛏️💎🟩', options: ['Minecraft', 'Roblox', 'Terraria', 'Fortnite'], correctIndex: 0, hint: 'Picar bloques y crear'},
  {emojis: '👻🚫🔫', options: ['Cazafantasmas', 'Luigi’s Mansion', 'Beetlejuice', 'Hotel Transylvania'], correctIndex: 0, hint: '¿A quién vas a llamar?'},
  {emojis: '🐼🥋🥟', options: ['Kung Fu Panda', 'Mulan', 'Shrek', 'Madagascar'], correctIndex: 0, hint: 'El Guerrero Dragón ama los dumplings'},
  {emojis: '🏎️⚡🏁', options: ['Cars', 'Rápidos y Furiosos', 'Gran Turismo', 'Mario Kart'], correctIndex: 0, hint: 'Kachow en la pista'},
  {emojis: '👹🟢🏰', options: ['Shrek', 'Monsters Inc', 'Hulk', 'El Grinch'], correctIndex: 0, hint: 'Un ogro en su pantano'},
  {emojis: '🤖🌱🗑️', options: ['WALL·E', 'Big Hero 6', 'Robots', 'El Gigante de Hierro'], correctIndex: 0, hint: 'Un robot compactador buscando vida verde'},
  {emojis: '🕯️🏠🦋', options: ['Encanto', 'Valiente', 'Raya', 'Moana'], correctIndex: 0, hint: 'La familia Madrigal en Colombia'},
  {emojis: '🦈🌊🚤', options: ['Tiburón (Jaws)', 'Megalodón', 'Nemo', 'Moana'], correctIndex: 0, hint: 'Se necesita un barco más grande'},
  {emojis: '🍌👓💛', options: ['Minions', 'Los Simpson', 'Bob Esponja', 'Pikachu'], correctIndex: 0, hint: 'Ayudantes amarillos amantes de la banana'},
  {emojis: '🍍🌊🍔', options: ['Bob Esponja', 'Buscando a Nemo', 'Aquaman', 'La Sirenita'], correctIndex: 0, hint: 'Vive en una piña debajo del mar'},
];

const FNAF_EMOJI: EmojiPuzzle[] = [
  {emojis: '🐻🎩🎤', options: ['Freddy Fazbear', 'Bonnie', 'Golden Freddy', 'Lefty'], correctIndex: 0, hint: 'El líder del escenario con micrófono'},
  {emojis: '🦊🏴‍☠️🏃', options: ['Foxy', 'Mangle', 'Lolbit', 'Grim Foxy'], correctIndex: 0, hint: 'Corre por el pasillo desde Pirate Cove'},
  {emojis: '🎁🎭🎵', options: ['The Puppet', 'Balloon Boy', 'Circus Baby', 'Ennard'], correctIndex: 0, hint: 'Sale de su caja si para la música'},
  {emojis: '🎈🔦😂', options: ['Balloon Boy', 'Dee Dee', 'Bon-Bon', 'Helpy'], correctIndex: 0, hint: 'Se ríe y apaga tu linterna'},
  {emojis: '🐰🟩🔥', options: ['Springtrap', 'Bonnie', 'Glitchtrap', 'Plushtrap'], correctIndex: 0, hint: 'Animatrónico en la atracción del terror'},
  {emojis: '🐤🧁🍕', options: ['Chica', 'Toy Chica', 'Roxanne Wolf', 'Ballora'], correctIndex: 0, hint: 'Siempre lleva su cupcake rosa'},
  {emojis: '🎸🟣🐰', options: ['Bonnie', 'Montgomery Gator', 'Freddy', 'Shadow Bonnie'], correctIndex: 0, hint: 'Guitarrista de la banda original'},
  {emojis: '🤡🍦👧', options: ['Circus Baby', 'Ballora', 'Vanny', 'Chica'], correctIndex: 0, hint: 'Estrella de Sister Location'},
  {emojis: '🛏️🔦👂', options: ['FNAF 4', 'FNAF 1', 'FNAF 3', 'Security Breach'], correctIndex: 0, hint: 'Dormitorio, armario y respiraciones'},
  {emojis: '📹🔋🚪', options: ['Oficina de FNAF 1', 'Mega Pizzaplex', 'Pirate Cove', 'Parts & Service'], correctIndex: 0, hint: 'Dos puertas y energía limitada'},
  {emojis: '🐻🟡👻', options: ['Golden Freddy', 'Fredbear', 'Shadow Freddy', 'Helpy'], correctIndex: 0, hint: 'Aparece sentado al azar en tu oficina'},
  {emojis: '🐊🕶️🎸', options: ['Montgomery Gator', 'Bonnie', 'Springtrap', 'Freddy'], correctIndex: 0, hint: 'Cocodrilo de Security Breach'},
];

const AU_EMOJI: EmojiPuzzle[] = [
  {emojis: '🚨🔴☕', options: ['Botón de Emergencia', 'Sabotaje de Reactor', 'Mesa de Admin', 'Escáner MedBay'], correctIndex: 0, hint: 'En el centro de Cafetería'},
  {emojis: '💳😤🔁', options: ['Tarjeta de Admin', 'Calibrar Distribuidor', 'Subir Datos', 'Limpiar Filtro O2'], correctIndex: 0, hint: 'Muy rápido… muy lento…'},
  {emojis: '🩺💚🧪', options: ['Escáner de Ala Médica', 'Analizar Muestras', 'Vitals en Polus', 'Estabilizar Dirección'], correctIndex: 0, hint: 'Demuestra tu inocencia con luz verde'},
  {emojis: '💡🔌⚡', options: ['Apagón en Electricidad', 'Sabotaje de Comms', 'Cargar Escudos', 'Motores'], correctIndex: 0, hint: 'Queda todo oscuro alrededor'},
  {emojis: '☢️✋✋', options: ['Sabotaje de Reactor', 'Sabotaje de O2', 'Desbloquear Colectores', 'Armas'], correctIndex: 0, hint: 'Necesita dos manos al mismo tiempo'},
  {emojis: '☄️🎯🔫', options: ['Disparar Asteroides', 'Calibrar Distribuidor', 'Tarjeta de Admin', 'Vaciar Basura'], correctIndex: 0, hint: 'Tarea visual en Armas'},
  {emojis: '🗑️⬇️🚀', options: ['Vaciar Basura', 'Expulsión al Espacio', 'Llenar Gasolina', 'Escudos'], correctIndex: 0, hint: 'Jalas la palanca en Cafetería y Almacén'},
  {emojis: '🎭🔄👤', options: ['Shapeshifter', 'Ingeniero', 'Científico', 'Ángel Guardián'], correctIndex: 0, hint: 'Impostor que copia otro color'},
  {emojis: '❄️🌋🌡️', options: ['Polus', 'The Skeld', 'MIRA HQ', 'The Airship'], correctIndex: 0, hint: 'Planeta nevado con pozo de lava'},
  {emojis: '✈️🎩🚁', options: ['The Airship', 'MIRA HQ', 'The Fungle', 'The Skeld'], correctIndex: 0, hint: 'Dirigible gigante donde eliges sala inicial'},
  {emojis: '🍄🌫️🎭', options: ['The Fungle (Mix Up)', 'Polus', 'The Skeld', 'MIRA HQ'], correctIndex: 0, hint: 'Isla de hongos que mezcla los colores'},
  {emojis: '🕳️🏃💨', options: ['Usar Alcantarilla (Vent)', 'Reportar Cuerpo', 'Mesa de Admin', 'Revisar Cámaras'], correctIndex: 0, hint: 'Atajo subterráneo de Impostor o Ingeniero'},
];

export function getEmojiBatch(
  theme: ThemeMode,
  historyKey: string,
  count = 5,
): EmojiPuzzle[] {
  const pool = theme === 'fnaf' ? FNAF_EMOJI : theme === 'amongus' ? AU_EMOJI : CLASSIC_EMOJI;
  const fresh = filterFreshAiItems(
    historyKey,
    shuffleCopy(pool),
    (p) => p.options[p.correctIndex],
    50,
  );
  return fresh.slice(0, count).map(shuffleEmojiOptions);
}

/* -------------------------------------------------------------------------- */
/* 4. TRES PISTAS                                                             */
/* -------------------------------------------------------------------------- */

const CLASSIC_CLUES: ClueCard[] = [
  {answer: 'Brújula', category: 'Objeto', clues: ['Funciona gracias al campo magnético de la Tierra.', 'La usan exploradores y navegantes.', 'Su aguja siempre señala al Norte.'], forbiddenWords: ['Norte', 'Imán', 'Mapa'], options: ['Brújula', 'Reloj', 'Termómetro', 'Binoculares']},
  {answer: 'Camaleón', category: 'Animal', clues: ['Sus ojos se mueven de manera independiente.', 'Atrapa insectos con una lengua larguísima.', 'Cambia de color para camuflarse.'], forbiddenWords: ['Color', 'Reptil', 'Lengua'], options: ['Camaleón', 'Iguana', 'Rana', 'Gecko']},
  {answer: 'Volcán', category: 'Naturaleza', clues: ['Puede pasar dormido cientos de años.', 'Conecta la superficie con el magma profundo.', 'Al entrar en erupción expulsa lava y ceniza.'], forbiddenWords: ['Lava', 'Fuego', 'Montaña'], options: ['Volcán', 'Géiser', 'Glaciar', 'Terremoto']},
  {answer: 'Submarino', category: 'Transporte', clues: ['Sus tripulantes usan sonar para orientarse.', 'Puede pasar semanas sin ver la luz del sol.', 'Navega completamente debajo del mar.'], forbiddenWords: ['Agua', 'Mar', 'Barco'], options: ['Submarino', 'Crucero', 'Portaaviones', 'Lancha']},
  {answer: 'Ajedrez', category: 'Juego', clues: ['Se juega en un tablero de 64 casillas.', 'Los caballos saltan en forma de L.', 'Termina cuando el Rey recibe jaque mate.'], forbiddenWords: ['Rey', 'Tablero', 'Jaque'], options: ['Ajedrez', 'Damas', 'Domino', 'Backgammon']},
  {answer: 'Arcoíris', category: 'Fenómeno', clues: ['Aparece cuando se combinan sol y gotas de lluvia.', 'En realidad es un círculo completo visto desde el aire.', 'Tiene siete franjas de colores en el cielo.'], forbiddenWords: ['Lluvia', 'Colores', 'Cielo'], options: ['Arcoíris', 'Aurora boreal', 'Eclipse', 'Relámpago']},
  {answer: 'Telescopio', category: 'Ciencia', clues: ['Usa lentes o espejos curvos para captar luz.', 'Galileo Galilei perfeccionó su uso astronómico.', 'Sirve para observar planetas y estrellas lejanas.'], forbiddenWords: ['Estrellas', 'Mirar', 'Espacio'], options: ['Telescopio', 'Microscopio', 'Lupa', 'Proyector']},
  {answer: 'Canguro', category: 'Animal', clues: ['No puede caminar hacia atrás fácilmente.', 'Es símbolo nacional de Australia.', 'Lleva a su cría en una bolsa frontal dando saltos.'], forbiddenWords: ['Saltar', 'Australia', 'Bolsa'], options: ['Canguro', 'Koala', 'Liebre', 'Venado']},
  {answer: 'Chocolate', category: 'Comida', clues: ['Su ingrediente principal viene de una semilla tropical.', 'Los antiguos mayas y aztecas lo bebían amargo.', 'El cacao dulce viene en barras o bombones.'], forbiddenWords: ['Cacao', 'Dulce', 'Barra'], options: ['Chocolate', 'Caramelo', 'Vainilla', 'Café']},
  {answer: 'Pirámide', category: 'Monumento', clues: ['Tiene base cuadrada y caras triangulares.', 'Servía como tumba monumental para faraones.', 'Las más famosas están en Guiza, Egipto.'], forbiddenWords: ['Egipto', 'Faraón', 'Triángulo'], options: ['Pirámide', 'Coliseo', 'Partenón', 'Esfinge']},
  {answer: 'Relámpago', category: 'Clima', clues: ['Ocurre durante tormentas con mucha carga eléctrica.', 'Viaja a la velocidad de la luz y se ve antes de oír el trueno.', 'Es un destello enorme entre nubes o hacia el suelo.'], forbiddenWords: ['Trueno', 'Tormenta', 'Luz'], options: ['Relámpago', 'Tornado', 'Granizo', 'Huracán']},
  {answer: 'Pianista', category: 'Profesión', clues: ['Lee dos pentagramas a la vez (clave de sol y fa).', 'Usa pedales con los pies para sostener notas.', 'Toca un instrumento de 88 teclas blancas y negras.'], forbiddenWords: ['Teclas', 'Música', 'Piano'], options: ['Pianista', 'Violinista', 'Director', 'Baterista']},
];

const FNAF_CLUES: ClueCard[] = [
  {answer: 'Caja de Puppet', category: 'Mecánica FNAF 2', clues: ['Está ubicada en la cámara CAM 11 (Prize Corner).', 'Si deja de sonar, aparece una alerta naranja en pantalla.', 'Debes mantener presionado para darle cuerda constantemente.'], forbiddenWords: ['Puppet', 'Música', 'Cuerda'], options: ['Caja de Puppet', 'Máscara de Freddy', 'Audio Lure', 'Pirate Cove']},
  {answer: 'Springtrap', category: 'Animatrónico FNAF 3', clues: ['Sus ojos parecen brillar con resto humano adentro.', 'Es el único peligro físico real en Fazbear’s Fright.', 'Es atraído lejos de ti usando el Audio Lure.'], forbiddenWords: ['Verde', 'Conejo', 'Audio'], options: ['Springtrap', 'Withered Bonnie', 'Nightmare', 'Ennard']},
  {answer: 'Pirate Cove', category: 'Sala FNAF 1', clues: ['Tiene una cortina morada decorada con estrellas.', 'Un cartel delante cambia a "IT’S ME" si se vacía.', 'Es el escondite inicial de Foxy.'], forbiddenWords: ['Foxy', 'Cortina', 'Pirata'], options: ['Pirate Cove', 'Show Stage', 'Backstage', 'Kitchen']},
  {answer: 'Máscara de Freddy', category: 'Objeto FNAF 2', clues: ['Se pone rápidamente bajándola frente a tu cara.', 'Engaña a Toy Bonnie, Toy Chica y Withered Freddy.', 'No sirve contra Withered Foxy ni Puppet.'], forbiddenWords: ['Cara', 'Freddy', 'Engañar'], options: ['Máscara de Freddy', 'Linterna', 'Ventilador', 'Cámara']},
  {answer: 'Phone Guy', category: 'Personaje FNAF', clues: ['Nunca aparece en pantalla, solo escuchas su voz.', 'Te deja grabaciones cada noche con consejos de seguridad.', 'Explica cómo sobrevivir en el turno de 12 AM a 6 AM.'], forbiddenWords: ['Teléfono', 'Voz', 'Llamada'], options: ['Phone Guy', 'William Afton', 'Michael', 'Henry']},
  {answer: 'Balloon Boy', category: 'Animatrónico FNAF 2', clues: ['Entra por el conducto de ventilación izquierdo.', 'Tiene un cartel que dice "Balloons!" y ríe sin parar.', 'Desactiva tu linterna en la oficina.'], forbiddenWords: ['Globo', 'Linterna', 'Risa'], options: ['Balloon Boy', 'The Puppet', 'Toy Freddy', 'Mangle']},
  {answer: 'Freddy Fazbear', category: 'Animatrónico FNAF 1', clues: ['Se mueve principalmente en la oscuridad desde la Noche 3.', 'Sus ojos brillan tocando una marcha si te quedas sin luz.', 'Es el oso principal que da nombre a la pizzería.'], forbiddenWords: ['Oso', 'Sombrero', 'Pizza'], options: ['Freddy Fazbear', 'Golden Freddy', 'Bonnie', 'Foxy']},
  {answer: 'Scooper', category: 'Sister Location', clues: ['Está detrás de una gran ventana en una sala secreta.', 'Se usa para extraer el endoesqueleto de los animatrónicos.', 'Aparece en la Noche 5 de Sister Location.'], forbiddenWords: ['Cuchara', 'Máquina', 'Ennard'], options: ['Scooper', 'Exotic Butters', 'HandUnit', 'Breaker Room']},
];

const AU_CLUES: ClueCard[] = [
  {answer: 'Mesa de Admin', category: 'Herramienta Skeld', clues: ['Está ubicada junto al pasillo de Almacén y Cafetería.', 'Muestra un mapa verde con figuras amarillas anónimas.', 'Sirve para detectar si alguien saltó entre salas usando una alcantarilla.'], forbiddenWords: ['Mapa', 'Admin', 'Puntos'], options: ['Mesa de Admin', 'Cámaras de Seguridad', 'Signos Vitales', 'Registro de Puertas']},
  {answer: 'Escáner de Ala Médica', category: 'Tarea Visual', clues: ['La luz verde sube y baja rodeando tu traje espacial.', 'Muestra tu altura, peso y tipo de sangre en pantalla.', 'Es la forma más famosa de probar que eres tripulante inocente.'], forbiddenWords: ['Médica', 'Verde', 'Inocente'], options: ['Escáner de Ala Médica', 'Vaciar Basura', 'Calibrar Distribuidor', 'Pasar Tarjeta']},
  {answer: 'Tarjeta de Admin', category: 'Tarea Común', clues: ['Sacas una identificación de tu billetera roja.', 'La pasas horizontalmente por un lector con luz.', 'Si vas muy rápido o muy lento, te manda repetirla.'], forbiddenWords: ['Tarjeta', 'Lector', 'Rápido'], options: ['Tarjeta de Admin', 'Cables de Admin', 'Subir Datos', 'Alinear Motor']},
  {answer: 'Sabotaje de O2', category: 'Emergencia Skeld', clues: ['Tiene una cuenta regresiva de 30 segundos antes de perder.', 'Obliga a ingresar códigos de 5 dígitos en dos paneles.', 'Uno está junto a Navegación y el otro en Administración.'], forbiddenWords: ['Oxígeno', 'Código', 'Tiempo'], options: ['Sabotaje de O2', 'Sabotaje de Reactor', 'Sabotaje de Luces', 'Sabotaje de Comms']},
  {answer: 'Cambiaformas (Shapeshifter)', category: 'Rol Impostor', clues: ['Deja un pequeño capullo o cáscara de evidencia al activarse.', 'Puede confundir las cámaras tomando el nombre y color de otro.', 'Es una variante especial del equipo Impostor.'], forbiddenWords: ['Transformar', 'Color', 'Impostor'], options: ['Cambiaformas (Shapeshifter)', 'Ingeniero', 'Fantasma', 'Científico']},
  {answer: 'Signos Vitales (Vitals)', category: 'Herramienta Polus', clues: ['No existe en The Skeld; debutó en Polus y Airship.', 'Muestra latidos verdes en línea de cada jugador vivo.', 'Cambia a rojo "DEAD" cuando alguien muere y gris si fue expulsado.'], forbiddenWords: ['Polus', 'Muerto', 'Corazón'], options: ['Signos Vitales (Vitals)', 'Mesa de Admin', 'Sensor de Puertas', 'Cámaras']},
  {answer: 'Calibrar Distribuidor', category: 'Tarea Eléctrica', clues: ['Está en la esquina superior de Electricidad.', 'Tiene tres discos giratorios de colores amarillo, azul y cian.', 'Debes detener cada anillo justo cuando toca la pestaña derecha.'], forbiddenWords: ['Electricidad', 'Girar', 'Anillo'], options: ['Calibrar Distribuidor', 'Arreglar Cables', 'Cargar Escudos', 'Motor Superior']},
  {answer: 'Polus', category: 'Mapa Among Us', clues: ['Es un planeta helado mucho más grande que The Skeld.', 'Sus alcantarillas son agujeros en la nieve o suelo.', 'Al expulsar a alguien cae en un pozo de lava ardiente.'], forbiddenWords: ['Nieve', 'Lava', 'Planeta'], options: ['Polus', 'MIRA HQ', 'The Airship', 'The Fungle']},
];

export function getClueBatch(
  theme: ThemeMode,
  historyKey: string,
  count = 5,
): ClueCard[] {
  const pool = theme === 'fnaf' ? FNAF_CLUES : theme === 'amongus' ? AU_CLUES : CLASSIC_CLUES;
  const fresh = filterFreshAiItems(historyKey, shuffleCopy(pool), (c) => c.answer, 50);
  return fresh.slice(0, count).map(shuffleClueOptions);
}

/* -------------------------------------------------------------------------- */
/* 5. VERDAD O MITO                                                           */
/* -------------------------------------------------------------------------- */

const CLASSIC_TRUE_FALSE: TrueFalseStatement[] = [
  {statement: 'Los pulpos tienen tres corazones y sangre azulada', isTrue: true, explanation: 'Su sangre usa cobre (hemocianina) en lugar de hierro, lo que le da tono azul.'},
  {statement: 'Los toros se enfurecen específicamente al ver el color rojo', isTrue: false, explanation: 'Los toros casi no distinguen el rojo; reaccionan al movimiento rápido de la tela.'},
  {statement: 'Un día en Venus dura más que un año completo en Venus', isTrue: true, explanation: 'Tarda más en girar sobre sí mismo (243 días) que en dar la vuelta al Sol (225 días).'},
  {statement: 'Las jirafas tienen muchas más vértebras en el cuello que los humanos', isTrue: false, explanation: 'Tienen exactamente 7 vértebras cervicales igual que nosotros, pero muchísimo más largas.'},
  {statement: 'Los plátanos (bananas) crecen en palmeras gigantes llamadas árboles', isTrue: false, explanation: 'Botánicamente la planta del banano es una hierba gigante, no un árbol de madera.'},
  {statement: 'La miel natural bien sellada puede conservarse comestible durante siglos', isTrue: true, explanation: 'Por su baja humedad y acidez natural, no se echa a perder.'},
  {statement: 'El Monte Everest crece unos milímetros cada año por choque tectónico', isTrue: true, explanation: 'Las placas de India y Eurasia siguen empujando el Himalaya lentamente.'},
  {statement: 'Las avestruces entierran la cabeza en la arena cuando tienen miedo', isTrue: false, explanation: 'Es un mito; suelen correr rápido o agacharse pegadas al suelo para ocultarse.'},
  {statement: 'Un rayo puede ser más caliente que la superficie visible del Sol', isTrue: true, explanation: 'Un rayo alcanza cerca de 30,000 °C, cinco veces más que la superficie solar.'},
  {statement: 'Solo usamos el 10% de nuestro cerebro en toda la vida', isTrue: false, explanation: 'Usamos prácticamente todas las áreas del cerebro en distintas actividades cada día.'},
  {statement: 'Las huellas de la lengua son únicas en cada persona, igual que las digitales', isTrue: true, explanation: 'Cada persona posee una forma y textura única en la lengua.'},
  {statement: 'Los camellos guardan agua líquida pura dentro de sus jorobas', isTrue: false, explanation: 'Las jorobas almacenan grasa energética, no agua líquida.'},
  {statement: 'Los koalas duermen entre 18 y 22 horas al día', isTrue: true, explanation: 'Digerir hojas de eucalipto consume mucha energía y aporta pocas calorías.'},
  {statement: 'En el espacio exterior los astronautas crecen unos centímetros temporalmente', isTrue: true, explanation: 'Sin gravedad comprimiendo la columna, los discos se estiran un poco.'},
  {statement: 'Los tiburones tienen más huesos que cualquier otro pez del océano', isTrue: false, explanation: 'No tienen huesos sólidos; su esqueleto está hecho de cartílago.'},
  {statement: 'El sonido viaja mucho más rápido bajo el agua que en el aire', isTrue: true, explanation: 'En el agua viaja unas 4 veces más rápido por la cercanía entre moléculas.'},
  {statement: 'Los murciélagos son completamente ciegos y no ven nada con los ojos', isTrue: false, explanation: 'La mayoría ve bastante bien; usan la ecolocalización como refuerzo nocturno.'},
  {statement: 'Las fresas llevan sus semillas por fuera de la fruta', isTrue: true, explanation: 'Cada pequeño punto amarillo en la piel contiene una semilla.'},
];

const FNAF_TRUE_FALSE: TrueFalseStatement[] = [
  {statement: 'Puedes tocar la nariz del póster de Freddy en la oficina para oír un "honk"', isTrue: true, explanation: 'Es un secreto clásico presente en casi todas las entregas de FNAF.'},
  {statement: 'En FNAF 1, Bonnie siempre aparece por la puerta derecha de la oficina', isTrue: false, explanation: 'Bonnie ataca por la puerta izquierda; Chica y Freddy van por la derecha.'},
  {statement: 'Scott Cawthon creó FNAF tras recibir críticas de que sus personajes anteriores parecían muñecos inquietantes', isTrue: true, explanation: 'Aprovechó ese estilo robótico inquietante para hacer un juego de terror.'},
  {statement: 'La máscara de Freddy protege contra absolutamente todos los animatrónicos de FNAF 2', isTrue: false, explanation: 'No engaña ni a Withered Foxy ni a The Puppet.'},
  {statement: 'El ventilador de escritorio de FNAF 1 consume energía continua aunque no hagas nada', isTrue: true, explanation: 'Siempre mantiene activa la barra base de consumo en pantalla.'},
  {statement: 'En FNAF 3, los Phantom te matan de inmediato si aparecen frente a ti', isTrue: false, explanation: 'Los Phantom solo dañan sistemas (ventilación/audio/video) facilitando el ataque de Springtrap.'},
  {statement: 'Freddy’s en Security Breach es el primer juego oficial en permitir recorrer libremente un enorme complejo en 3D', isTrue: true, explanation: 'El Mega Pizzaplex rompió el formato clásico de estar fijo en una oficina.'},
  {statement: 'Golden Freddy nunca aparece en el primer Five Nights at Freddy’s', isTrue: false, explanation: 'Sí aparece como huevo de pascua raro al ver cierto póster en CAM 2B.'},
  {statement: 'El turno completo de una noche en FNAF dura desde las 12 AM hasta las 6 AM', isTrue: true, explanation: 'Al sonar las campanas de las 6:00 AM ganas automáticamente la noche.'},
  {statement: 'En FNAF 4 la historia se juega en una pizzería con cámaras de seguridad', isTrue: false, explanation: 'FNAF 4 ocurre en la habitación de una casa usando solo una linterna y escuchando pasos.'},
];

const AMONGUS_TRUE_FALSE: TrueFalseStatement[] = [
  {statement: 'Los fantasmas de tripulantes pueden seguir terminando sus tareas y ganar la partida', isTrue: true, explanation: 'Sus tareas cuentan exactamente igual para completar la barra verde.'},
  {statement: 'El Impostor también hace subir la barra verde de tareas cuando simula una tarea', isTrue: false, explanation: 'Los Impostores tienen tareas falsas de referencia que nunca suben la barra.'},
  {statement: 'Si las tareas visuales están desactivadas, el escáner de Ala Médica no muestra luz verde a los demás', isTrue: true, explanation: 'Sin tareas visuales activas solo puedes confirmar por la barra si está en modo normal.'},
  {statement: 'Un Impostor puede reportar un cuerpo aunque él mismo haya eliminado a ese jugador', isTrue: true, explanation: 'Se conoce como "autorreporte" y sirve para armar coartadas falsas.'},
  {statement: 'En The Skeld todas las alcantarillas están conectadas entre sí igual que en MIRA HQ', isTrue: false, explanation: 'En Skeld están divididas por pequeños circuitos cerrados; solo MIRA HQ conecta todas.'},
  {statement: 'El sabotaje de Comunicaciones oculta también la Mesa de Administración y las cámaras', isTrue: true, explanation: 'Desactiva temporalmente Admin, cámaras, Vitals y la lista de tareas.'},
  {statement: 'Un jugador Ingeniero puede quedarse oculto dentro de una alcantarilla para siempre sin límite', isTrue: false, explanation: 'Tiene un tiempo máximo por uso en la alcantarilla antes de salir automáticamente.'},
  {statement: 'Al estar dentro de una alcantarilla, el tiempo de recarga (cooldown) del Impostor se detiene', isTrue: true, explanation: 'El cooldown de eliminación solo baja mientras caminas afuera.'},
  {statement: 'Si un tripulante está haciéndose el escáner de MedBay, otro jugador también puede escanearse encima al mismo tiempo', isTrue: false, explanation: 'Si alguien ya está en el escáner, el segundo queda esperando en cola hasta que termine.'},
  {statement: 'En Polus, el mapa muestra la temperatura y tiene paneles de Signos Vitales (Vitals)', isTrue: true, explanation: 'Los Vitals en la Oficina permiten ver si alguien cayó eliminado en tiempo real.'},
  {statement: 'El botón de emergencia en Cafetería se puede apretar incluso durante un sabotaje activo de Luces o Reactor', isTrue: false, explanation: 'Mientras haya un sabotaje crítico o de luces activo, el botón queda bloqueado (aunque sí se pueden reportar cuerpos).'},
  {statement: 'El Cambiaformas (Shapeshifter) deja una cápsula o piel de evidencia temporal en el suelo tras mutar', isTrue: true, explanation: 'Si alguien ve esa evidencia cerca del sitio, sabe que hubo transformación.'},
];

export function getTrueFalseBatch(
  theme: ThemeMode,
  historyKey: string,
  count = 6,
): TrueFalseStatement[] {
  const pool =
    theme === 'fnaf'
      ? FNAF_TRUE_FALSE
      : theme === 'amongus'
        ? AMONGUS_TRUE_FALSE
        : CLASSIC_TRUE_FALSE;
  const fresh = filterFreshAiItems(historyKey, shuffleCopy(pool), (s) => s.statement, 50);
  return fresh.slice(0, count);
}
