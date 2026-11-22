import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {GoogleGenAI, ThinkingLevel, Type} from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const PRIMARY_MODEL_ID = 'gemini-3.1-flash-lite';
const FALLBACK_MODEL_ID = 'gemini-4-hydrogen';

type ResponseSchemaType = NonNullable<
  Parameters<GoogleGenAI['models']['generateContent']>[0]['config']
>['responseSchema'];

function createAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada en los secretos del proyecto.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeForDedup(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function dedupAgainstRecent<T>(
  items: T[],
  recentList: string[],
  extractText: (item: T) => string,
  targetCount: number,
): T[] {
  const seen = new Set(recentList.map((r) => normalizeForDedup(String(r))));
  const fresh: T[] = [];
  const fallback: T[] = [];
  for (const item of items) {
    const key = normalizeForDedup(extractText(item));
    if (!key) continue;
    if (seen.has(key)) {
      fallback.push(item);
      continue;
    }
    seen.add(key);
    fresh.push(item);
  }
  return [...fresh, ...fallback].slice(0, targetCount);
}

function makeVarietySeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

async function generateJson(
  ai: GoogleGenAI,
  params: {
    contents: string;
    systemInstruction: string;
    responseSchema: ResponseSchemaType;
  },
) {
  const callModel = (model: string, thinkingLevel: ThinkingLevel) =>
    ai.models.generateContent({
      model,
      contents: params.contents,
      config: {
        systemInstruction: params.systemInstruction,
        temperature: 1.05,
        thinkingConfig: {thinkingLevel},
        responseMimeType: 'application/json',
        responseSchema: params.responseSchema,
      },
    });

  try {
    return await callModel(PRIMARY_MODEL_ID, ThinkingLevel.MINIMAL);
  } catch (firstErr) {
    const raw = firstErr instanceof Error ? firstErr.message : String(firstErr);
    const isTransient = raw.includes('503') || raw.includes('500') || raw.includes('UNAVAILABLE');
    if (isTransient) {
      await sleep(600);
      try {
        return await callModel(PRIMARY_MODEL_ID, ThinkingLevel.MINIMAL);
      } catch {
        // continue to fallback model
      }
    }
    return await callModel(FALLBACK_MODEL_ID, ThinkingLevel.LOW);
  }
}

function sendAiError(res: express.Response, err: unknown) {
  const raw = err instanceof Error ? err.message : 'Error inesperado al consultar la IA.';
  console.error('Error en llamada Gemini API:', raw);

  if (raw.includes('GEMINI_API_KEY')) {
    res.status(500).json({error: raw});
    return;
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    res.status(429).json({
      error:
        'Se agotó la cuota gratuita de la IA por hoy. Configura una clave con facturación en Settings > Secrets o inténtalo más tarde.',
    });
    return;
  }
  if (
    raw.includes('403') ||
    raw.includes('PERMISSION_DENIED') ||
    raw.includes('API_KEY_INVALID') ||
    raw.includes('API key not valid')
  ) {
    res.status(403).json({
      error: 'La clave de Gemini API no es válida o no tiene permisos. Revísala en Settings > Secrets.',
    });
    return;
  }
  res.status(502).json({error: 'No se pudo conectar con la IA en este momento.'});
}

async function startServer() {
  const app = express();
  app.use(express.json({limit: '1mb'}));

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // 1. Ruleta de Retos IA (lote de 10 retos filtrados a 8 únicos por petición)
  app.post('/api/ai/challenge', async (req, res) => {
    try {
      const {vibe, playerCount, recentPrompts, theme} = req.body ?? {};
      const isFnaf = theme === 'fnaf';
      const isAu = theme === 'amongus';
      const ai = createAiClient();
      const recentList = Array.isArray(recentPrompts)
        ? recentPrompts.map(String).slice(-45)
        : [];

      const response = await generateJson(ai, {
        contents: isFnaf
          ? `Genera exactamente 10 retos temáticos de Five Nights at Freddy's (FNAF) en español, sencillos de hacer en sala frente al TV.
Cantidad de jugadores en sala: ${Number(playerCount || 1)}
Ambiente: ${String(vibe || 'Turno nocturno en Fazbear')} · Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO repetir o parafrasear cualquiera de estos retos ya jugados:\n- ${recentList.join('\n- ')}` : ''}

Reglas:
- Apto para toda la familia, sin violencia, sin objetos raros ni acciones incómodas o confusas.
- No pongas nombres fijos; usa "tú" o "haz...".
- Máximo 2 frases claras por reto.`
          : isAu
            ? `Genera exactamente 10 retos temáticos de Among Us en español, sencillos de hacer en sala frente al TV.
Cantidad de jugadores en sala: ${Number(playerCount || 1)}
Ambiente: ${String(vibe || 'Nave The Skeld')} · Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO repetir o parafrasear cualquiera de estos retos ya jugados:\n- ${recentList.join('\n- ')}` : ''}

Reglas:
- Apto para toda la familia, sin violencia, sin objetos raros ni acciones incómodas o confusas.
- No pongas nombres fijos; usa "tú" o "haz...".
- Máximo 2 frases claras por reto.`
            : `Genera exactamente 10 retos variados, creativos, claros y 100% familiares en español para una ruleta de televisión en sala sin accesorios.
Cantidad de jugadores en sala: ${Number(playerCount || 1)}
Ambiente: ${String(vibe || 'En familia')} · Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO repetir o parafrasear cualquiera de estos retos ya jugados:\n- ${recentList.join('\n- ')}` : ''}

Reglas:
- Contenido 100% apto para niños, jóvenes, padres y abuelos. Sin alcohol, sin temas adultos y sin retos raros, vergonzosos o difíciles de entender.
- Todo reto debe poder hacerse en 10 segundos en la sala usando solo voz, manos o gestos (nada de salir de casa ni buscar objetos raros).
- Mezcla categorías distintas entre los 10 retos: Mímica cotidiana, Pregunta divertida, Improvisación breve, Reto físico suave, Votación rápida, Talento.
- No pongas nombres fijos dentro del reto (usa "tú" o "haz...").
- Máximo 2 frases directas por reto.`,
        systemInstruction: isFnaf
          ? 'Eres diseñador de retos familiares de fiesta inspirados en Five Nights at Freddy’s en español.'
          : isAu
            ? 'Eres diseñador de retos familiares de fiesta inspirados en Among Us en español.'
            : 'Eres diseñador de juegos familiares en español para televisión. Creas retos naturales, claros, sanos y siempre distintos.',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            challenges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: {type: Type.STRING},
                  title: {type: Type.STRING},
                  challenge: {type: Type.STRING},
                  twist: {type: Type.STRING},
                  points: {type: Type.INTEGER},
                  durationSec: {type: Type.INTEGER},
                },
                required: ['category', 'title', 'challenge', 'twist', 'points', 'durationSec'],
              },
            },
          },
          required: ['challenges'],
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim()) as {
        challenges?: Array<{
          category: string;
          title: string;
          challenge: string;
          twist: string;
          points: number;
          durationSec: number;
        }>;
      };
      const rawList = Array.isArray(parsed.challenges) ? parsed.challenges : [];
      const list = dedupAgainstRecent(rawList, recentList, (c) => c.challenge, 8);
      const first = list[0] ?? {
        category: 'Familiar',
        title: 'Mímica rápida',
        challenge: 'Imita durante 10 segundos a tu animal favorito sin usar palabras.',
        twist: 'En cámara lenta',
        points: 2,
        durationSec: 20,
      };
      res.json({
        ...first,
        challenges: list,
      });
    } catch (err) {
      sendAiError(res, err);
    }
  });

  // 2. Trivia Relámpago IA (genera 7 y filtra a 5 sin repetir)
  app.post('/api/ai/trivia', async (req, res) => {
    try {
      const {topic, difficulty, recentQuestions, theme} = req.body ?? {};
      const isFnaf = theme === 'fnaf';
      const isAu = theme === 'amongus';
      const ai = createAiClient();
      const recentList = Array.isArray(recentQuestions)
        ? recentQuestions.map(String).slice(-45)
        : [];

      const response = await generateJson(ai, {
        contents: isFnaf
          ? `Genera exactamente 7 preguntas originales de trivia en español sobre Five Nights at Freddy's (FNAF).
Enfoque específico de esta ronda: ${String(topic || 'FNAF Clásico')} · Dificultad: ${String(difficulty || 'Media-Alta')} · Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO repetir o reformular estas preguntas ya vistas:\n- ${recentList.join('\n- ')}` : ''}

Reglas:
- Cubre datos reales y concretos de la saga según el enfoque (personajes, mecánicas, noches, años de lanzamiento, cámaras, salas, desarrollador, animatrónicos). Varía mucho respecto a las típicas preguntas básicas.
- Apto para toda la familia.
- Pregunta clara de máximo 18 palabras, 4 opciones cortas (máximo 6 palabras cada una), exactamente 1 correcta (varía su posición entre 0 y 3) y explicación breve de 1 frase.`
          : isAu
            ? `Genera exactamente 7 preguntas originales de trivia en español sobre Among Us.
Enfoque específico de esta ronda: ${String(topic || 'The Skeld')} · Dificultad: ${String(difficulty || 'Media-Alta')} · Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO repetir o reformular estas preguntas ya vistas:\n- ${recentList.join('\n- ')}` : ''}

Reglas:
- Cubre datos reales de Among Us según el enfoque (mapas Skeld, Mira HQ, Polus, Airship, Fungle; tareas visuales; sabotajes; roles; estudio Innersloth; detalles reales de gameplay). Evita repetir las mismas preguntas obvias.
- Apto para toda la familia.
- Pregunta clara de máximo 18 palabras, 4 opciones cortas (máximo 6 palabras cada una), exactamente 1 correcta (varía su posición entre 0 y 3) y explicación breve de 1 frase.`
            : `Genera exactamente 7 preguntas originales de trivia en español para jugar en familia en TV.
Tema específico: ${String(topic || 'Cultura General')} · Dificultad: ${String(difficulty || 'Media-Alta')} · Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO repetir o reformular estas preguntas ya vistas:\n- ${recentList.join('\n- ')}` : ''}

Reglas:
- Apto para toda la familia, preguntas sorprendentes y variadas (evita clichés repetidos).
- Pregunta clara de máximo 18 palabras, 4 opciones cortas (máximo 6 palabras cada una), exactamente 1 correcta (varía su posición entre 0 y 3) y explicación breve de 1 frase.`,
        systemInstruction: isFnaf
          ? 'Eres experto en Five Nights at Freddy’s y guionista de trivias familiares en español. Verificas datos exactos y nunca repites preguntas.'
          : isAu
            ? 'Eres experto en Among Us y guionista de trivias familiares en español. Verificas datos exactos del videojuego y nunca repites preguntas.'
            : 'Eres guionista experto de trivias familiares en español. Generas preguntas frescas, precisas y nunca repetidas.',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: {type: Type.STRING},
                  options: {type: Type.ARRAY, items: {type: Type.STRING}},
                  correctIndex: {type: Type.INTEGER},
                  explanation: {type: Type.STRING},
                },
                required: ['question', 'options', 'correctIndex', 'explanation'],
              },
            },
          },
          required: ['questions'],
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim()) as {
        questions?: Array<{
          question: string;
          options: string[];
          correctIndex: number;
          explanation: string;
        }>;
      };
      const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
      const questions = dedupAgainstRecent(rawQuestions, recentList, (q) => q.question, 5);
      res.json({questions});
    } catch (err) {
      sendAiError(res, err);
    }
  });

  // 3. El Impostor Secreto IA (genera 4 candidatos distintos y elige uno nunca jugado)
  app.post('/api/ai/impostor', async (req, res) => {
    try {
      const {vibe, recentWords, theme} = req.body ?? {};
      const isFnaf = theme === 'fnaf';
      const isAu = theme === 'amongus';
      const ai = createAiClient();
      const recentList = Array.isArray(recentWords)
        ? recentWords.map(String).slice(-45)
        : [];

      const response = await generateJson(ai, {
        contents: isFnaf
          ? `Genera 4 rondas DISTINTAS del juego "El Impostor" en español ambientadas 100% en el universo Five Nights at Freddy's (FNAF).
Enfoque de variedad: ${String(vibe || 'Universo FNAF completo')} · Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO usar cualquiera de estas palabras ya jugadas:\n- ${recentList.join(', ')}` : ''}

Reglas:
- Elige conceptos variados entre las 4 opciones (animatrónicos distintos de toda la saga, salas de diferentes entregas, objetos o mecánicas reales del juego). No repitas siempre los mismos 3 personajes.
- Cada ronda trae una pista sutil para el impostor y una pregunta breve para romper el hielo.`
          : isAu
            ? `Genera 4 rondas DISTINTAS del juego "El Impostor" en español ambientadas 100% en Among Us.
Enfoque de variedad: ${String(vibe || 'Mapas, tareas y roles de Among Us')} · Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO usar cualquiera de estas palabras ya jugadas:\n- ${recentList.join(', ')}` : ''}

Reglas:
- Explora todos los mapas, tareas específicas, sabotajes y roles de Among Us para no repetir las mismas palabras básicas.
- Cada ronda trae una pista sutil para el impostor y una pregunta breve para el debate.`
            : `Genera 4 rondas DISTINTAS del juego familiar "El Impostor" en español.
Temática específica: ${String(vibe || 'Variado y familiar')} · Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO usar cualquiera de estas palabras ya jugadas:\n- ${recentList.join(', ')}` : ''}`,
        systemInstruction: isFnaf
          ? 'Eres diseñador de juegos familiares en español con temática Five Nights at Freddy’s.'
          : isAu
            ? 'Eres diseñador de juegos familiares en español con temática Among Us.'
            : 'Eres diseñador de juegos familiares de deducción social en español.',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            candidates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: {type: Type.STRING},
                  secretWord: {type: Type.STRING},
                  impostorHint: {type: Type.STRING},
                  starterQuestion: {type: Type.STRING},
                },
                required: ['category', 'secretWord', 'impostorHint', 'starterQuestion'],
              },
            },
          },
          required: ['candidates'],
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim()) as {
        candidates?: Array<{
          category: string;
          secretWord: string;
          impostorHint: string;
          starterQuestion: string;
        }>;
      };
      const candidates = Array.isArray(parsed.candidates) ? parsed.candidates : [];
      const fresh = dedupAgainstRecent(candidates, recentList, (c) => c.secretWord, 4);
      const picked =
        fresh[Math.floor(Math.random() * Math.max(1, fresh.length))] ??
        candidates[0] ?? {
          category: 'General',
          secretWord: 'Brújula',
          impostorHint: 'Sirve para orientarse',
          starterQuestion: '¿Dónde la usarías primero?',
        };
      res.json(picked);
    } catch (err) {
      sendAiError(res, err);
    }
  });

  // 4. Bomba de Palabras IA
  app.post('/api/ai/bomb-prompt', async (req, res) => {
    try {
      const {vibe, recentPrompts} = req.body ?? {};
      const ai = createAiClient();
      const recentList = Array.isArray(recentPrompts) ? recentPrompts.slice(-20) : [];

      const response = await generateJson(ai, {
        contents: `Genera 6 consignas rápidas y familiares en español para "La Bomba".
Estilo: ${String(vibe || 'Familiar y rapidez mental')}
${recentList.length > 0 ? `Evita repetir: ${recentList.join(' | ')}` : ''}`,
        systemInstruction:
          'Eres creador de juegos familiares de agilidad mental en español.',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prompts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  prompt: {type: Type.STRING},
                  example: {type: Type.STRING},
                },
                required: ['prompt', 'example'],
              },
            },
          },
          required: ['prompts'],
        },
      });

      res.json(JSON.parse((response.text ?? '{}').trim()));
    } catch (err) {
      sendAiError(res, err);
    }
  });

  // 5. Dilema del Sofá IA (¿Qué prefieres?)
  app.post('/api/ai/dilemma', async (req, res) => {
    try {
      const {vibe, recentDilemmas, theme} = req.body ?? {};
      const isFnaf = theme === 'fnaf';
      const isAu = theme === 'amongus';
      const ai = createAiClient();
      const recentList = Array.isArray(recentDilemmas)
        ? recentDilemmas.map(String).slice(-40)
        : [];

      const response = await generateJson(ai, {
        contents: isFnaf
          ? `Genera 6 dilemas graciosos y 100% familiares del tipo "¿Qué prefieres?" en español ambientados en Five Nights at Freddy's (FNAF).
Ambiente: ${String(vibe || 'Guardia nocturno de Fazbear')} · Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO repetir estos escenarios ya vistos:\n- ${recentList.join('\n- ')}` : ''}`
          : isAu
            ? `Genera 6 dilemas graciosos y 100% familiares del tipo "¿Qué prefieres?" en español ambientados en Among Us.
Ambiente: ${String(vibe || 'Tripulante en The Skeld')} · Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO repetir estos escenarios ya vistos:\n- ${recentList.join('\n- ')}` : ''}`
            : `Genera 6 dilemas difíciles, graciosos y 100% familiares del tipo "¿Qué prefieres?" en español para debatir frente al televisor.
Ambiente: ${String(vibe || 'Familiar y divertido')} · Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO repetir estos escenarios ya vistos:\n- ${recentList.join('\n- ')}` : ''}

Reglas:
- Todo debe ser apto para toda la familia (niños, jóvenes y adultos). Sin temas subidos de tono ni dilemas extraños.
Cada dilema tiene:
- scenario: pregunta corta de contexto (máx 10 palabras).
- optionA: primera opción tentadora o absurda (máx 12 palabras).
- optionB: segunda opción igualmente difícil (máx 12 palabras).
- debateTip: pregunta divertida y sana para encender la conversación familiar.`,
        systemInstruction: isFnaf
          ? 'Eres creador de dilemas familiares divertidos sobre Five Nights at Freddy’s en español.'
          : isAu
            ? 'Eres creador de dilemas familiares divertidos sobre Among Us en español.'
            : 'Eres creador de dilemas familiares entretenidos e ingeniosos en español, aptos para todas las edades.',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dilemmas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  scenario: {type: Type.STRING},
                  optionA: {type: Type.STRING},
                  optionB: {type: Type.STRING},
                  debateTip: {type: Type.STRING},
                },
                required: ['scenario', 'optionA', 'optionB', 'debateTip'],
              },
            },
          },
          required: ['dilemmas'],
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim()) as {
        dilemmas?: Array<{scenario: string; optionA: string; optionB: string; debateTip: string}>;
      };
      const rawDilemmas = Array.isArray(parsed.dilemmas) ? parsed.dilemmas : [];
      res.json({
        dilemmas: dedupAgainstRecent(rawDilemmas, recentList, (d) => d.scenario, 4),
      });
    } catch (err) {
      sendAiError(res, err);
    }
  });

  // 6. Cine y Cultura en Emojis IA (genera 7 y filtra a 5 únicos)
  app.post('/api/ai/emoji-quiz', async (req, res) => {
    try {
      const {category, recentTitles, theme} = req.body ?? {};
      const isFnaf = theme === 'fnaf';
      const isAu = theme === 'amongus';
      const ai = createAiClient();
      const recentList = Array.isArray(recentTitles)
        ? recentTitles.map(String).slice(-45)
        : [];

      const response = await generateJson(ai, {
        contents: isFnaf
          ? `Genera 7 acertijos de emojis originales en español sobre el universo Five Nights at Freddy's (FNAF).
Enfoque específico: ${String(category || 'Personajes y entregas de FNAF')} · Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO usar cualquiera de estas respuestas ya jugadas:\n- ${recentList.join(', ')}` : ''}

Reglas:
- Varía entre diferentes entregas de FNAF (FNAF 1, 2, 3, 4, Sister Location, Pizzeria Simulator, Security Breach) para no repetir siempre los mismos animatrónicos.
- emojis: 4 a 6 emojis claros.
- options: 4 opciones plausibles del universo FNAF (1 correcta y 3 distractores). Varía correctIndex entre 0 y 3.
- hint: pista corta sin decir el nombre.`
          : isAu
            ? `Genera 7 acertijos de emojis originales en español sobre Among Us.
Enfoque específico: ${String(category || 'Tareas, mapas y roles de Among Us')} · Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO usar cualquiera de estas respuestas ya jugadas:\n- ${recentList.join(', ')}` : ''}

Reglas:
- Varía entre distintos mapas (Skeld, Mira HQ, Polus, Airship, Fungle), tareas menos obvias, roles y sabotajes.
- emojis: 4 a 6 emojis claros.
- options: 4 opciones plausibles del universo Among Us (1 correcta y 3 distractores). Varía correctIndex entre 0 y 3.
- hint: pista corta sin decir el nombre.`
            : `Genera 7 acertijos familiares de emojis originales en español sobre: ${String(category || 'Películas y Series familiares')}. Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO usar cualquiera de estas respuestas ya jugadas:\n- ${recentList.join(', ')}` : ''}

Reglas:
- emojis: 4 a 6 emojis muy representativos.
- options: 4 títulos posibles (1 correcto y 3 distractores del mismo estilo). Varía correctIndex entre 0 y 3.
- hint: pista corta sin decir el título.`,
        systemInstruction: isFnaf
          ? 'Eres experto en Five Nights at Freddy’s y acertijos visuales con emojis en español.'
          : isAu
            ? 'Eres experto en Among Us y acertijos visuales con emojis en español.'
            : 'Eres experto en cultura pop familiar y acertijos visuales con emojis en español.',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            puzzles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  emojis: {type: Type.STRING},
                  options: {type: Type.ARRAY, items: {type: Type.STRING}},
                  correctIndex: {type: Type.INTEGER},
                  hint: {type: Type.STRING},
                },
                required: ['emojis', 'options', 'correctIndex', 'hint'],
              },
            },
          },
          required: ['puzzles'],
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim()) as {
        puzzles?: Array<{emojis: string; options: string[]; correctIndex: number; hint: string}>;
      };
      const rawPuzzles = Array.isArray(parsed.puzzles) ? parsed.puzzles : [];
      const puzzles = dedupAgainstRecent(
        rawPuzzles,
        recentList,
        (p) => p.options?.[p.correctIndex] ?? p.emojis,
        5,
      );
      res.json({puzzles});
    } catch (err) {
      sendAiError(res, err);
    }
  });

  // 7. 3 Pistas / Tabú IA (genera 7 y filtra a 5 únicos)
  app.post('/api/ai/clues', async (req, res) => {
    try {
      const {vibe, recentAnswers, theme} = req.body ?? {};
      const isFnaf = theme === 'fnaf';
      const isAu = theme === 'amongus';
      const ai = createAiClient();
      const recentList = Array.isArray(recentAnswers)
        ? recentAnswers.map(String).slice(-45)
        : [];

      const response = await generateJson(ai, {
        contents: isFnaf
          ? `Genera 7 tarjetas de adivinanza con 3 pistas progresivas en español sobre Five Nights at Freddy's (FNAF).
Enfoque específico: ${String(vibe || 'Saga FNAF completa')} · Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO usar cualquiera de estas respuestas ya jugadas:\n- ${recentList.join(', ')}` : ''}

Cada tarjeta debe tener:
- answer: personaje, lugar, entrega u objeto de FNAF (varía entre entregas, no solo Freddy/Bonnie/Chica).
- category: categoría breve.
- clues: exactamente 3 pistas de más difícil a más fácil con referencias fieles al juego.
- forbiddenWords: 3 palabras prohibidas.
- options: 4 opciones posibles del universo FNAF (mezcla el orden, 1 es exactamente igual a answer y 3 distractores).`
          : isAu
            ? `Genera 7 tarjetas de adivinanza con 3 pistas progresivas en español sobre Among Us.
Enfoque específico: ${String(vibe || 'Mapas, tareas y roles')} · Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO usar cualquiera de estas respuestas ya jugadas:\n- ${recentList.join(', ')}` : ''}

Cada tarjeta debe tener:
- answer: sala, tarea, mapa, rol o sabotaje de Among Us.
- category: categoría breve.
- clues: exactamente 3 pistas de más difícil a más fácil con referencias fieles al juego.
- forbiddenWords: 3 palabras prohibidas.
- options: 4 opciones posibles del universo Among Us (mezcla el orden, 1 es exactamente igual a answer y 3 distractores).`
            : `Genera 7 tarjetas familiares de adivinanza con 3 pistas progresivas en español.
Tema específico: ${String(vibe || 'Cultura general')} · Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO usar cualquiera de estas respuestas ya jugadas:\n- ${recentList.join(', ')}` : ''}

Cada tarjeta debe tener:
- answer: palabra, lugar, animal, invento o personaje a adivinar.
- category: categoría breve.
- clues: exactamente 3 pistas de más difícil a más fácil.
- forbiddenWords: 3 palabras prohibidas.
- options: 4 opciones posibles (mezcla el orden, 1 es exactamente igual a answer y 3 distractores).`,
        systemInstruction: isFnaf
          ? 'Eres diseñador de juegos familiares de adivinanzas sobre Five Nights at Freddy’s en español.'
          : isAu
            ? 'Eres diseñador de juegos familiares de adivinanzas sobre Among Us en español.'
            : 'Eres diseñador de juegos familiares de adivinanzas y pistas en español.',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  answer: {type: Type.STRING},
                  category: {type: Type.STRING},
                  clues: {type: Type.ARRAY, items: {type: Type.STRING}},
                  forbiddenWords: {type: Type.ARRAY, items: {type: Type.STRING}},
                  options: {type: Type.ARRAY, items: {type: Type.STRING}},
                },
                required: ['answer', 'category', 'clues', 'forbiddenWords', 'options'],
              },
            },
          },
          required: ['cards'],
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim()) as {
        cards?: Array<{
          answer: string;
          category: string;
          clues: string[];
          forbiddenWords: string[];
          options: string[];
        }>;
      };
      const rawCards = Array.isArray(parsed.cards) ? parsed.cards : [];
      res.json({
        cards: dedupAgainstRecent(rawCards, recentList, (c) => c.answer, 5),
      });
    } catch (err) {
      sendAiError(res, err);
    }
  });

  // 8. ¿Verdad o Mito? IA (genera 8 y filtra a 6 únicas)
  app.post('/api/ai/true-false', async (req, res) => {
    try {
      const {topic, recentStatements, theme} = req.body ?? {};
      const isFnaf = theme === 'fnaf';
      const isAu = theme === 'amongus';
      const ai = createAiClient();
      const recentList = Array.isArray(recentStatements)
        ? recentStatements.map(String).slice(-45)
        : [];

      const response = await generateJson(ai, {
        contents: isFnaf
          ? `Genera 8 afirmaciones frescas (mezcla equilibrada de verdades reales y mitos falsos) en español sobre Five Nights at Freddy's (FNAF).
Enfoque específico: ${String(topic || 'Saga FNAF completa')} · Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO repetir estas afirmaciones ya vistas:\n- ${recentList.join('\n- ')}` : ''}

Reglas:
- Cubre detalles variados de la franquicia (mecánicas de cada noche, secretos de diseño, mitos famosos, datos reales de los juegos). Evita repetir siempre las mismas 3 curiosidades.`
          : isAu
            ? `Genera 8 afirmaciones frescas (mezcla equilibrada de verdades reales y mitos falsos) en español sobre Among Us.
Enfoque específico: ${String(topic || 'Mecánicas, mapas y mitos')} · Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO repetir estas afirmaciones ya vistas:\n- ${recentList.join('\n- ')}` : ''}

Reglas:
- Cubre mecánicas reales (fantasmas, tareas, cooldowns, alcantarillas, roles, mapas Mira HQ / Polus / Airship / Fungle, historia de desarrollo) y mitos falsos creíbles.`
            : `Genera 8 afirmaciones sorprendentes y familiares (mezcla equilibrada de verdades reales y mitos falsos creíbles) en español.
Tema específico: ${String(topic || 'Curiosidades del mundo')} · Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO repetir estas afirmaciones ya vistas:\n- ${recentList.join('\n- ')}` : ''}`,
        systemInstruction: isFnaf
          ? 'Eres historiador y experto en Five Nights at Freddy’s en español. Distingues con precisión datos reales del videojuego de leyendas o mitos de fans, apto para toda la familia.'
          : isAu
            ? 'Eres experto en Among Us en español. Distingues con precisión mecánicas y datos reales del videojuego de mitos de la comunidad, apto para toda la familia.'
            : 'Eres divulgador científico y cultural en español para toda la familia. Distingues con precisión hechos reales de mitos populares.',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            statements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  statement: {type: Type.STRING},
                  isTrue: {type: Type.BOOLEAN},
                  explanation: {type: Type.STRING},
                },
                required: ['statement', 'isTrue', 'explanation'],
              },
            },
          },
          required: ['statements'],
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim()) as {
        statements?: Array<{statement: string; isTrue: boolean; explanation: string}>;
      };
      const rawStatements = Array.isArray(parsed.statements) ? parsed.statements : [];
      res.json({
        statements: dedupAgainstRecent(rawStatements, recentList, (s) => s.statement, 6),
      });
    } catch (err) {
      sendAiError(res, err);
    }
  });

  // 9. Cadena de Historias IA
  app.post('/api/ai/story', async (req, res) => {
    try {
      const {genre, historySoFar, chosenTwist, step, playerNames, theme} = req.body ?? {};
      const isFnaf = theme === 'fnaf';
      const isAu = theme === 'amongus';
      const ai = createAiClient();

      if (step === 'START') {
        const response = await generateJson(ai, {
          contents: isFnaf
            ? `Inicia una aventura interactiva corta, cómica-misteriosa y 100% familiar en español ambientada en el turno nocturno (12 AM) de Freddy Fazbear's Pizza (FNAF).
Protagonistas (los nuevos guardias de seguridad en sala): ${Array.isArray(playerNames) ? playerNames.join(', ') : 'La familia'}.
Incluye referencias al juego original (cámaras, Pirate Cove, la caja de Puppet, Freddy, Bonnie, Chica, Foxy, batería limitada, pizza) manteniendo un tono divertido y apto para niños y familia.
Escribe un párrafo inicial corto (2-3 frases) y propón 3 decisiones para continuar.`
            : isAu
              ? `Inicia una aventura interactiva corta, cómica-espacial y 100% familiar en español a bordo de la nave The Skeld (Among Us).
Protagonistas (los tripulantes en sala): ${Array.isArray(playerNames) ? playerNames.join(', ') : 'La familia'}.
Incluye referencias reales del juego (Cafetería, Electricidad, deslizar la tarjeta de Admin, escáner de Medbay, alcantarillas sospechosas, luces apagadas, botón de emergencia) manteniendo un humor sano para toda la familia.
Escribe un párrafo inicial corto (2-3 frases) y propón 3 decisiones para continuar.`
              : `Inicia una historia interactiva corta, sana y graciosa en español para toda la familia del género "${String(genre || 'Comedia familiar')}".
Protagonistas (jugadores en sala): ${Array.isArray(playerNames) ? playerNames.join(', ') : 'La familia'}.
Escribe un párrafo inicial corto (2-3 frases) y propón 3 giros inesperados y divertidos para continuar.`,
          systemInstruction: isFnaf
            ? 'Eres narrador interactivo de aventuras familiares y divertidas ambientadas en Freddy Fazbear’s Pizza.'
            : isAu
              ? 'Eres narrador interactivo de aventuras espaciales cómicas y familiares en The Skeld (Among Us).'
              : 'Eres narrador interactivo de historias cómicas familiares y breves para leer en televisor.',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              paragraph: {type: Type.STRING},
              choices: {type: Type.ARRAY, items: {type: Type.STRING}},
            },
            required: ['paragraph', 'choices'],
          },
        });
        res.json(JSON.parse((response.text ?? '{}').trim()));
        return;
      }

      if (step === 'NEXT') {
        const response = await generateJson(ai, {
          contents: isFnaf
            ? `Continúa esta aventura nocturna en Freddy Fazbear's Pizza incorporando la decisión elegida:
Historia previa: ${String(historySoFar || '')}
Decisión elegida: ${String(chosenTwist || '')}
Mantén guiños al juego original (batería, puertas, cámaras, animatrónicos, 3 AM - 5 AM) con humor sano familiar. Escribe 2-3 frases y 3 nuevas decisiones.`
            : isAu
              ? `Continúa esta misión espacial en Among Us (The Skeld) incorporando la decisión elegida:
Historia previa: ${String(historySoFar || '')}
Decisión elegida: ${String(chosenTwist || '')}
Mantén guiños al juego (sabotajes de O2/Reactor, tareas de cables, acusaciones graciosas en Cafetería) con humor sano familiar. Escribe 2-3 frases y 3 nuevas decisiones.`
              : `Continúa esta historia familiar en español incorporando la decisión elegida:
Historia previa: ${String(historySoFar || '')}
Decisión elegida: ${String(chosenTwist || '')}
Escribe un párrafo corto (2-3 frases) y 3 nuevas decisiones disparatadas y aptas para toda la familia.`,
          systemInstruction: isFnaf
            ? 'Eres narrador interactivo de aventuras familiares y divertidas ambientadas en Freddy Fazbear’s Pizza.'
            : isAu
              ? 'Eres narrador interactivo de aventuras espaciales cómicas y familiares en The Skeld (Among Us).'
              : 'Eres narrador interactivo de historias cómicas familiares y breves para leer en televisor.',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              paragraph: {type: Type.STRING},
              choices: {type: Type.ARRAY, items: {type: Type.STRING}},
            },
            required: ['paragraph', 'choices'],
          },
        });
        res.json(JSON.parse((response.text ?? '{}').trim()));
        return;
      }

      const response = await generateJson(ai, {
        contents: isFnaf
          ? `Escribe el desenlace de las 6:00 AM (2-3 frases) para esta aventura familiar en Freddy Fazbear's Pizza y califica la guardia del grupo del 1 al 10 con un título para el episodio.
Historia previa: ${String(historySoFar || '')}
Última decisión: ${String(chosenTwist || '')}`
          : isAu
            ? `Escribe el desenlace victorioso o disparatado (2-3 frases) para esta misión familiar en The Skeld (Among Us) y califica el trabajo en equipo del 1 al 10 con un título para el episodio.
Historia previa: ${String(historySoFar || '')}
Última decisión: ${String(chosenTwist || '')}`
            : `Escribe el desenlace final épico o hilarante (2-3 frases) para esta historia familiar en español y califica la creatividad del grupo del 1 al 10 con un título para el episodio.
Historia previa: ${String(historySoFar || '')}
Última decisión: ${String(chosenTwist || '')}`,
        systemInstruction:
          'Eres narrador interactivo familiar en español. Cierras historias grupales con humor sano y remate memorable.',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ending: {type: Type.STRING},
            episodeTitle: {type: Type.STRING},
            ratingOutOf10: {type: Type.INTEGER},
          },
          required: ['ending', 'episodeTitle', 'ratingOutOf10'],
        },
      });
      res.json(JSON.parse((response.text ?? '{}').trim()));
    } catch (err) {
      sendAiError(res, err);
    }
  });

  // 10. ¿Quién es más probable que...? IA (100% familiar)
  app.post('/api/ai/most-likely', async (req, res) => {
    try {
      const {vibe, recentPrompts, theme} = req.body ?? {};
      const isFnaf = theme === 'fnaf';
      const isAu = theme === 'amongus';
      const ai = createAiClient();
      const recentList = Array.isArray(recentPrompts)
        ? recentPrompts.map(String).slice(-45)
        : [];

      const response = await generateJson(ai, {
        contents: isFnaf
          ? `Genera exactamente 7 preguntas del juego "¿Quién es más probable que...?" en español ambientadas en Five Nights at Freddy's (FNAF).
Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO repetir estas preguntas:\n- ${recentList.join('\n- ')}` : ''}`
          : isAu
            ? `Genera exactamente 7 preguntas del juego "¿Quién es más probable que...?" en español ambientadas en Among Us.
Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO repetir estas preguntas:\n- ${recentList.join('\n- ')}` : ''}`
            : `Genera exactamente 7 preguntas del juego "¿Quién es más probable que...?" en español para jugar en familia frente al televisor.
Ambiente: ${String(vibe || 'Familiar y gracioso')} · Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO repetir estas situaciones:\n- ${recentList.join('\n- ')}` : ''}

Reglas estrictas:
- 100% apto para toda la familia (niños, padres, abuelos). Cero temas de alcohol, citas, groserías, contenido adulto ni preguntas raras.
- Situaciones cotidianas, graciosas y entrañables (ej. quedarse dormido viendo una película, perder las llaves, hablar con las plantas, comerse el último postre).
- Cada pregunta empieza con "¿Quién es más probable que..." y tiene máximo 16 palabras.
- funComment: comentario breve y simpático (máx 12 palabras) para animar las risas al revelar quién ganó.`,
        systemInstruction: isFnaf
          ? 'Eres diseñador de juegos familiares en español con temática Five Nights at Freddy’s.'
          : isAu
            ? 'Eres diseñador de juegos familiares en español con temática Among Us.'
            : 'Eres diseñador de juegos de mesa familiares en español. Creas preguntas divertidas, respetuosas y siempre distintas.',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prompts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: {type: Type.STRING},
                  funComment: {type: Type.STRING},
                },
                required: ['question', 'funComment'],
              },
            },
          },
          required: ['prompts'],
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim()) as {
        prompts?: Array<{question: string; funComment: string}>;
      };
      const rawPrompts = Array.isArray(parsed.prompts) ? parsed.prompts : [];
      res.json({
        prompts: dedupAgainstRecent(rawPrompts, recentList, (p) => p.question, 5),
      });
    } catch (err) {
      sendAiError(res, err);
    }
  });

  // 11. Yo Nunca Familiar IA
  app.post('/api/ai/never-have-i', async (req, res) => {
    try {
      const {vibe, recentStatements, theme} = req.body ?? {};
      const isFnaf = theme === 'fnaf';
      const isAu = theme === 'amongus';
      const ai = createAiClient();
      const recentList = Array.isArray(recentStatements)
        ? recentStatements.map(String).slice(-45)
        : [];

      const response = await generateJson(ai, {
        contents: isFnaf
          ? `Genera exactamente 8 frases para el juego "Yo nunca" en español versión 100% familiar inspiradas en Five Nights at Freddy's (FNAF).
Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO repetir estas frases:\n- ${recentList.join('\n- ')}` : ''}`
          : isAu
            ? `Genera exactamente 8 frases para el juego "Yo nunca" en español versión 100% familiar inspiradas en Among Us.
Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO repetir estas frases:\n- ${recentList.join('\n- ')}` : ''}`
            : `Genera exactamente 8 frases para el juego "Yo nunca" versión 100% familiar en español para jugar en el televisor.
Ambiente: ${String(vibe || 'Travesuras sanas en familia')} · Semilla: ${makeVarietySeed()}
${recentList.length > 0 ? `PROHIBIDO repetir estas frases:\n- ${recentList.join('\n- ')}` : ''}

Reglas estrictas:
- 100% apto para niños, jóvenes, padres y abuelos. NADA de alcohol, bebidas, fiestas adultas, romances ni temas extraños.
- Enfócate en travesuras inocentes, anécdotas de comida, escuela, viajes, tecnología, mascotas o costumbres graciosas en casa.
- Cada frase debe empezar exactamente con "Yo nunca..." y tener máximo 15 palabras.
- category: una palabra o dos.
- followUp: pregunta corta y graciosa para contar rápido la anécdota.`,
        systemInstruction: isFnaf
          ? 'Eres creador de dinámicas familiares en español inspiradas en Five Nights at Freddy’s.'
          : isAu
            ? 'Eres creador de dinámicas familiares en español inspiradas en Among Us.'
            : 'Eres creador de dinámicas familiares sanas en español. Tus frases de "Yo nunca" son siempre distintas y hacen reír sin incomodar.',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            statements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  statement: {type: Type.STRING},
                  category: {type: Type.STRING},
                  followUp: {type: Type.STRING},
                },
                required: ['statement', 'category', 'followUp'],
              },
            },
          },
          required: ['statements'],
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim()) as {
        statements?: Array<{statement: string; category: string; followUp: string}>;
      };
      const rawStatements = Array.isArray(parsed.statements) ? parsed.statements : [];
      res.json({
        statements: dedupAgainstRecent(rawStatements, recentList, (s) => s.statement, 6),
      });
    } catch (err) {
      sendAiError(res, err);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mando Party TV escuchando en http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('No se pudo iniciar el servidor:', err);
  process.exit(1);
});
