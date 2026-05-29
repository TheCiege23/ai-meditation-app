import OpenAI from "openai";
import { NextResponse } from "next/server";

import { errorResponse, tooManyRequestsResponse, usageLimitResponse } from "@/lib/api-response";
import {
  canUseMeditation,
  clampVisualToEntitlements,
  durationLabelToMinutes,
  getEffectiveEntitlements,
} from "@/lib/entitlements";
import { checkGuestDailyLimit, incrementGuestDailyUsage } from "@/lib/guest-limit";
import { resolveRequestIdentity } from "@/lib/identity";
import { applyRateLimit, resolvePolicyName } from "@/lib/rate-limit";
import { incrementMeditationUsage, getOrCreateDailyUsage } from "@/lib/usage";
import { logApiRequest, getUserProfileSnapshot } from "@/lib/user-store";
import { createSessionRecord, getGuestUserId } from "@/lib/cache-db";
import type { AppLanguage } from "@/lib/types";
import { getRandomInspiration } from "@/lib/inspiration";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

const MEDITATION_WORD_TARGETS: Record<string, number> = {
  "1 min": 95,
  "3 min": 260,
  "5 min": 430,
  "10 min": 820,
  "15 min": 1225,
  "20 min": 1625,
};

const SLEEP_WORD_TARGETS: Record<string, number> = {
  "1 min": 80,
  "3 min": 220,
  "5 min": 360,
  "10 min": 700,
  "15 min": 1050,
  "20 min": 1400,
};

const BREATHING_WORD_TARGETS: Record<string, number> = {
  "1 min": 70,
  "3 min": 185,
  "5 min": 310,
  "10 min": 590,
  "15 min": 880,
  "20 min": 1180,
};

const YOGA_WORD_TARGETS: Record<string, number> = {
  "1 min": 90,
  "3 min": 240,
  "5 min": 400,
  "10 min": 780,
  "15 min": 1160,
  "20 min": 1540,
};

const BREATHING_PATTERNS: Record<string, { label: string; inhale: number; hold?: number; exhale: number; rest?: number }> = {
  "balanced-446": { label: "balanced 4-4-6 breathing", inhale: 4, hold: 4, exhale: 6 },
  "box-444": { label: "box 4-4-4 breathing", inhale: 4, hold: 4, exhale: 4, rest: 4 },
  "relax-478": { label: "relaxing 4-7-8 breathing", inhale: 4, hold: 7, exhale: 8 },
};

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function normalizeNarrationText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function groupIntoParagraphs(text: string, sentencesPerParagraph = 2) {
  const normalized = normalizeNarrationText(text);
  if (!normalized) {
    return "";
  }

  if (normalized.includes("\n\n")) {
    return normalized;
  }

  const sentences = normalized.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
  if (sentences.length <= sentencesPerParagraph) {
    return normalized;
  }

  const paragraphs: string[] = [];
  for (let index = 0; index < sentences.length; index += sentencesPerParagraph) {
    paragraphs.push(sentences.slice(index, index + sentencesPerParagraph).join(" "));
  }

  return paragraphs.join("\n\n");
}

function getWordTarget(
  duration: string,
  mode: "meditation" | "breathing" | "sleep" | "yoga",
  yogaLevel: "beginner" | "intermediate" | "advanced" = "beginner"
) {
  const minutes = Math.max(1, durationLabelToMinutes(duration));

  if (mode === "breathing") {
    return BREATHING_WORD_TARGETS[duration] ?? Math.round(minutes * 59);
  }

  if (mode === "sleep") {
    return SLEEP_WORD_TARGETS[duration] ?? Math.round(minutes * 70);
  }

  if (mode === "yoga") {
    const levelMultiplier =
      yogaLevel === "advanced" ? 1.05 : yogaLevel === "intermediate" ? 1 : 0.95;
    const baseTarget = YOGA_WORD_TARGETS[duration] ?? Math.round(minutes * 77);
    return Math.round(baseTarget * levelMultiplier);
  }

  return MEDITATION_WORD_TARGETS[duration] ?? Math.round(minutes * 82);
}

function buildNarrationBlueprint(input: {
  duration: string;
  mode: "meditation" | "breathing" | "sleep" | "yoga";
  language: AppLanguage;
}) {
  const minutes = Math.max(1, durationLabelToMinutes(input.duration));
  const isEs = input.language === "es";

  if (input.mode === "breathing") {
    return isEs
      ? `Estructura sugerida: apertura breve, varias rondas guiadas con pausas naturales entre ciclos, mitad de sesión más espaciosa y un cierre lento. Haz que la guía se sienta respirable de principio a fin durante unos ${minutes} minutos.`
      : `Suggested structure: brief arrival, repeated guided breath rounds with natural space between cycles, a roomier middle section, and a slow closing. Make the guidance feel breathable from beginning to end for about ${minutes} minutes.`;
  }

  if (input.mode === "sleep") {
    return isEs
      ? `Estructura sugerida: llegada suave, relajación progresiva, varios tramos tranquilos para alargar el descanso y un cierre muy lento. Debe sentirse realmente nocturno y sostener unos ${minutes} minutos.`
      : `Suggested structure: soft arrival, progressive relaxation, several unhurried settling passages, and a very slow close. It should feel truly bedtime-ready and sustain about ${minutes} minutes.`;
  }

  if (input.mode === "yoga") {
    return isEs
      ? `Estructura sugerida: llegada y alineacion, calentamiento progresivo, flujo principal con respiracion guiada, enfriamiento y cierre integrador. Debe sentirse corporal, seguro y sostenible por unos ${minutes} minutos.`
      : `Suggested structure: arrival and alignment, progressive warm-up, main flow with breath-linked cues, cool-down, and an integrating close. It should feel embodied, safe, and sustainable for about ${minutes} minutes.`;
  }

  return isEs
    ? `Estructura sugerida: llegada, asentamiento corporal, profundización gradual, varios pasajes tranquilos en el centro y cierre integrador. Debe sentirse como una sesión real que sostiene unos ${minutes} minutos.`
    : `Suggested structure: arrival, body settling, gradual deepening, several spacious middle passages, and an integrating close. It should feel like a real session that sustains about ${minutes} minutes.`;
}

function normalizeMode(mode: unknown, meditationType: string) {
  if (mode === "yoga") {
    return "yoga" as const;
  }

  if (mode === "breathing") {
    return "breathing" as const;
  }

  if (mode === "sleep" || meditationType === "sleep") {
    return "sleep" as const;
  }

  return "meditation" as const;
}

function buildBreathingCueLine(
  pattern: { inhale: number; hold?: number; exhale: number; rest?: number },
  language: AppLanguage
) {
  const isEs = language === "es";
  const holdLine = pattern.hold
    ? isEs
      ? ` Mantén durante ${pattern.hold}.`
      : ` Hold for ${pattern.hold}.`
    : "";
  const restLine = pattern.rest
    ? isEs
      ? ` Descansa durante ${pattern.rest}.`
      : ` Rest for ${pattern.rest}.`
    : "";
  return isEs
    ? `Inhala durante ${pattern.inhale}.${holdLine} Exhala durante ${pattern.exhale}.${restLine}`
    : `Inhale for ${pattern.inhale}.${holdLine} Exhale for ${pattern.exhale}.${restLine}`;
}

function buildMeditationPaddingParagraphs(
  input: {
    mood: string;
    meditationType: string;
    checkIn: string;
    language: AppLanguage;
  },
  targetWords: number,
  currentWords: number
) {
  const isEs = input.language === "es";
  const paragraphs = isEs
    ? [
        "Vuelve de nuevo a la respiración y deja que la exhalación haga un poco más del trabajo. Puedes ablandarte sin tener que acelerar el proceso.",
        "Si los pensamientos siguen moviéndose, deja que se queden de fondo mientras tú permaneces con un solo ancla tranquila. La respiración puede sostener tu lugar mientras la mente se asienta.",
        "Observa qué sucede cuando dejas de esforzarte tanto. La frente puede aflojarse, los hombros pueden caer y el pecho puede encontrar un poco más de espacio.",
        "No tienes que resolverlo todo en este momento. Solo necesitas estar presente para esta respiración, y luego para la siguiente.",
        input.checkIn
          ? `Trae de vuelta tu intención original: ${input.checkIn}. Sosténla con suavidad, sin presión, y deja que marque el tono de esta práctica.`
          : "Permanece con la sensación de estabilidad que se construye respiración a respiración. Deja que la calma sea algo que permites, no algo que persigues.",
        `A medida que esta meditación de ${input.meditationType.replace(/_/g, " ")} continúa, sigue eligiendo un ritmo más suave. Deja que el cuerpo confíe en que este momento es lo bastante seguro como para bajar la marcha.`,
        "Siente el apoyo debajo de ti y el silencio a tu alrededor. Descansa un poco más profundamente en el espacio que has creado, aunque solo sea por unos minutos hoy.",
      ]
    : [
        "Return again to the breath and let the exhale do a little more of the work. You are allowed to soften without rushing the process.",
        "If thoughts keep moving, let them move in the background while you stay with one calm anchor. The breath can hold your place while the mind settles.",
        "Notice what happens when you stop pushing so hard. The brow can loosen, the shoulders can drop, and the chest can find a little more room.",
        "You do not need to solve everything in this moment. You only need to be present for this breath, and then the next one after that.",
        input.checkIn
          ? `Bring your original intention back into view: ${input.checkIn}. Hold it gently, without pressure, and let it guide the tone of this practice.`
          : "Stay with the feeling of steadiness building one breath at a time. Let calm feel like something you are allowing, not chasing.",
        `As this ${input.meditationType.replace(/_/g, " ")} session continues, keep choosing a softer rhythm. Let the body trust that this moment is safe enough to slow down.`,
        "Feel the support beneath you and the quiet around you. Rest more fully into the space you have created, even if it is only for a few minutes today.",
      ];

  const extraParagraphs: string[] = [];
  let words = currentWords;
  let index = 0;

  while (words < targetWords) {
    const paragraph = paragraphs[index % paragraphs.length];
    extraParagraphs.push(paragraph);
    words += countWords(paragraph);
    index += 1;
  }

  return extraParagraphs.join("\n\n");
}

function buildBreathingPaddingParagraphs(
  input: {
    mood: string;
    checkIn: string;
    breathingPattern: string | null;
    language: AppLanguage;
  },
  targetWords: number,
  currentWords: number
) {
  const pattern = BREATHING_PATTERNS[input.breathingPattern ?? ""] ?? BREATHING_PATTERNS["balanced-446"];
  const cue = buildBreathingCueLine(pattern, input.language);
  const isEs = input.language === "es";
  const paragraphs = isEs
    ? [
        `${cue} Deja que la respiración llegue con suavidad en lugar de forzarla. Mantén los hombros sueltos y la mandíbula relajada.`,
        `De nuevo, ${cue.toLowerCase()} Permanece con la cuenta y deja que el cuerpo aprenda el ritmo ciclo a ciclo.`,
        "Si la mente intenta adelantarse, vuelve a la siguiente inhalación y a la siguiente exhalación. No hay nada más que tengas que hacer ahora mismo.",
        input.checkIn
          ? `Recuerda la intención con la que entraste en esta práctica: ${input.checkIn}. Deja que esa intención viaje suavemente sobre la respiración.`
          : `Permite que la respiración cree un poco más de espacio alrededor de la sensación de ${input.mood.toLowerCase()}. Cada ciclo puede bajar un poco el volumen dentro de ti.`,
        "Mantén el rostro suave, el pecho abierto y el abdomen blando. Cuanto más tranquilo se siente el cuerpo, más fácil es seguir la siguiente cuenta.",
      ]
    : [
        `${cue} Let the breath arrive smoothly instead of forcing it. Keep the shoulders soft and the jaw relaxed.`,
        `Again, ${cue.toLowerCase()} Stay with the count and let the body learn the rhythm one cycle at a time.`,
        "If the mind tries to rush ahead, return to the next inhale and the next exhale. There is nothing else you need to do right now.",
        input.checkIn
          ? `Remember the intention you brought into this practice: ${input.checkIn}. Let that intention ride gently on top of the breath.`
          : `Let the breath make a little more space around the feeling of ${input.mood.toLowerCase()}. Each cycle can lower the volume inside you.`,
        "Keep the face easy, the chest open, and the belly soft. The calmer your body feels, the easier it is to stay with the next count.",
      ];

  const extraParagraphs: string[] = [];
  let words = currentWords;
  let index = 0;

  while (words < targetWords) {
    const paragraph = paragraphs[index % paragraphs.length];
    extraParagraphs.push(paragraph);
    words += countWords(paragraph);
    index += 1;
  }

  return extraParagraphs.join("\n\n");
}

function ensureDurationAlignedScript(
  text: string,
  input: {
    mode: "meditation" | "breathing" | "sleep" | "yoga";
    mood: string;
    meditationType: string;
    breathingPattern: string | null;
    checkIn: string;
    language: AppLanguage;
  },
  wordTarget: number,
  minWords: number
) {
  const normalized = groupIntoParagraphs(text);
  const currentWords = countWords(normalized);
  if (currentWords >= minWords) {
    return normalized;
  }

  const padding =
    input.mode === "breathing"
      ? buildBreathingPaddingParagraphs(input, wordTarget, currentWords)
      : buildMeditationPaddingParagraphs(input, wordTarget, currentWords);

  return groupIntoParagraphs(`${normalized}\n\n${padding}`);
}

function buildFallbackBreathingScript(input: {
  mode?: "meditation" | "breathing" | "sleep" | "yoga";
  mood: string;
  duration: string;
  breathingPattern: string | null;
  checkIn: string;
  language: AppLanguage;
}) {
  const pattern = BREATHING_PATTERNS[input.breathingPattern ?? ""] ?? BREATHING_PATTERNS["balanced-446"];
  const cue = buildBreathingCueLine(pattern, input.language);
  const isEs = input.language === "es";
  if (input.mode === "sleep") {
    return (
      isEs
        ? [
            `Bienvenido a esta sesiÃ³n nocturna de ${input.duration}. Permite que el cuerpo se apoye un poco mÃ¡s en la superficie debajo de ti.`,
            "Deja que la exhalaciÃ³n se haga lenta y pesada. No hay nada que resolver en este momento.",
            "Si la mente sigue activa, no luches con ella. Nota el peso del cuerpo, la suavidad de la mandÃ­bula y el ritmo tranquilo de la respiraciÃ³n.",
            "El descanso puede llegar poco a poco. Solo sigue cediendo un poco mÃ¡s con cada exhalaciÃ³n.",
          ]
        : [
            `Welcome to this ${input.duration} sleep wind-down. Let your body settle a little more fully into the surface beneath you.`,
            "Allow each exhale to become slow and heavy. There is nothing to solve right now.",
            "If the mind stays busy, do not wrestle with it. Notice the weight of the body, the softness in the jaw, and the steady rhythm of your breath.",
            "Rest can arrive gradually. Keep giving the body a little more permission to let go with each exhale.",
          ]
    ).join("\n\n");
  }

  const checkInLine = input.checkIn
    ? isEs
      ? `Trae contigo esta intención: ${input.checkIn}.`
      : `Bring this intention with you: ${input.checkIn}.`
    : isEs
      ? "Trae solo tu atención y tu disposición a ir más despacio."
      : "Bring only your attention and your willingness to slow down.";

  return (
    isEs
      ? [
          `Bienvenido a esta sesión de ${input.duration} de respiración ${pattern.label} para cuando te sientas ${input.mood}. ${checkInLine}`,
          `${cue} Deja que la cuenta sea estable, suave y amable con el cuerpo.`,
          "Si tus pensamientos se dispersan, vuelve a los números y a la sensación del aire moviéndose en ti. No pasa nada si necesitas empezar de nuevo.",
          "Permanece con el ritmo el tiempo suficiente para que tu sistema nervioso note que puede soltar un poco más en cada exhalación.",
        ]
      : [
          `Welcome to this ${input.duration} ${pattern.label} session for when you feel ${input.mood}. ${checkInLine}`,
          `${cue} Let the count be steady, easy, and kind to the body.`,
          "If your thoughts wander, return to the numbers and to the feeling of air moving through you. Nothing has gone wrong when you begin again.",
          "Stay with the rhythm long enough for your nervous system to notice that it can let go a little more on every exhale.",
        ]
  ).join("\n\n");
}

function buildFallbackMeditationScript(input: {
  mode: "meditation" | "breathing" | "sleep" | "yoga";
  mood: string;
  duration: string;
  meditationType: string;
  breathingPattern: string | null;
  checkIn: string;
  language: AppLanguage;
  yogaFocus?: string;
  yogaLevel?: "beginner" | "intermediate" | "advanced";
}) {
  if (input.mode === "breathing") {
    return buildFallbackBreathingScript(input);
  }

  if (input.mode === "yoga") {
    const focusLabel = input.yogaFocus ? input.yogaFocus.replace(/_/g, " ") : "full body";
    const levelLabel = input.yogaLevel ?? "beginner";
    const isEs = input.language === "es";

    return (
      isEs
        ? [
            `Bienvenido a esta practica de yoga de ${input.duration} con enfoque en ${focusLabel}. Hoy nos moveremos a un ritmo ${levelLabel}.`,
            "Comienza con respiraciones suaves y una postura estable. Activa el centro del cuerpo y deja que cada transicion siga el ritmo de la exhalacion.",
            "Durante el flujo, evita forzar. Si aparece molestia aguda, reduce la intensidad o descansa en una postura neutra.",
            "Cierra con respiracion lenta y observacion corporal. Lleva esta sensacion de espacio y equilibrio al resto de tu dia.",
          ]
        : [
            `Welcome to this ${input.duration} yoga flow focused on ${focusLabel}. Today we will move at a ${levelLabel} pace.`,
            "Begin with smooth breaths and a stable base. Engage your center and let each transition follow the pace of your exhale.",
            "During the flow, avoid forcing range of motion. If you feel sharp pain, reduce intensity or rest in a neutral pose.",
            "Close with slower breathing and a full-body check-in. Carry this sense of space and balance into the rest of your day.",
          ]
    ).join("\n\n");
  }

  const isEs = input.language === "es";
  if (input.mode === "sleep") {
    return (
      isEs
        ? [
            `Bienvenido a esta sesion nocturna de ${input.duration}. Permite que el cuerpo se apoye un poco mas en la superficie debajo de ti.`,
            "Deja que la exhalacion se haga lenta y pesada. No hay nada que resolver en este momento.",
            "Si la mente sigue activa, no luches con ella. Nota el peso del cuerpo, la suavidad de la mandibula y el ritmo tranquilo de la respiracion.",
            "El descanso puede llegar poco a poco. Solo sigue cediendo un poco mas con cada exhalacion.",
          ]
        : [
            `Welcome to this ${input.duration} sleep wind-down. Let your body settle a little more fully into the surface beneath you.`,
            "Allow each exhale to become slow and heavy. There is nothing to solve right now.",
            "If the mind stays busy, do not wrestle with it. Notice the weight of the body, the softness in the jaw, and the steady rhythm of your breath.",
            "Rest can arrive gradually. Keep giving the body a little more permission to let go with each exhale.",
          ]
    ).join("\n\n");
  }

  const checkInLine = input.checkIn
    ? isEs
      ? `Llegas con esto en el corazón: ${input.checkIn}.`
      : `You are arriving with this in your heart: ${input.checkIn}.`
    : isEs
      ? "Puedes entrar en esta práctica exactamente como estás ahora."
      : "You are allowed to enter this practice exactly as you are.";

  return (
    isEs
      ? [
          `Bienvenido a esta meditación de ${input.duration} de ${input.meditationType.replace(/_/g, " ")} para cuando te sientas ${input.mood}. ${checkInLine}`,
          "Deja que la respiración encuentre un ritmo sencillo. Nota las partes del cuerpo que siguen esforzándose demasiado y abládalas un poco.",
          "No tienes que corregir cada sensación que llegue aquí. Permanece con un solo ancla estable: la respiración, el peso del cuerpo o el espacio tranquilo debajo de los pensamientos.",
          "Cada vez que la mente vaya hacia la siguiente tarea, vuelve con suavidad. Permite que este momento sea sencillo, de apoyo y suficiente para hoy.",
        ]
      : [
          `Welcome to this ${input.duration} ${input.meditationType.replace(/_/g, " ")} meditation for when you feel ${input.mood}. ${checkInLine}`,
          "Let the breathing settle into an easy rhythm. Notice the places in the body that are still working too hard, and soften them by a small degree.",
          "You do not need to fix every feeling that arrives here. Stay with one steady anchor: the breath, the weight of the body, or the quiet space underneath your thoughts.",
          "Each time the mind reaches for the next task, return gently. Let this moment be simple, supportive, and enough for today.",
        ]
  ).join("\n\n");
}

async function generateMeditationText(input: {
  mood: string;
  duration: string;
  mode: "meditation" | "breathing" | "sleep" | "yoga";
  meditationType: string;
  breathingPattern: string | null;
  checkIn: string;
  yogaFocus: string;
  yogaLevel: "beginner" | "intermediate" | "advanced";
  wordTarget: number;
  minWords: number;
  maxWords: number;
  language: AppLanguage;
}) {
  const fallbackMeditation = ensureDurationAlignedScript(
    buildFallbackMeditationScript(input),
    input,
    input.wordTarget,
    input.minWords
  );
  const fallback = {
    meditation: fallbackMeditation,
    source: "fallback" as const,
  };

  const openai = getOpenAI();
  if (!openai) {
    return fallback;
  }

  const languageLine =
    input.language === "es"
      ? "Write the entire script in natural, warm, and clear Spanish (es). Do not mix English."
      : "Write the entire script in natural, warm, and clear English (en). Do not mix Spanish.";

  const inspiration = getRandomInspiration({
    language: input.language,
    category: "bible_proverb",
  });

  const inspirationLine = inspiration
    ? `Optionally, weave in this short inspirational line once in a natural way (do not mention that it came from a separate list): "${inspiration.text}".`
    : "";

  const blueprint = buildNarrationBlueprint({
    duration: input.duration,
    mode: input.mode,
    language: input.language,
  });

  const prompt = `
You are an expert mindfulness writer for ChimAura, a premium wellness app.

User language: ${input.language}.
${languageLine}

Write one ${input.mode} script for a user who feels "${input.mood}" and wants a "${input.duration}" session.
Meditation focus: "${input.meditationType}".
Breathing pattern: "${input.breathingPattern ?? "natural"}".
Yoga focus: "${input.yogaFocus}".
Yoga level: "${input.yogaLevel}".
User check-in note: "${input.checkIn || "none"}".

Hard duration requirement:
- This script must feel like a complete guided session that lasts the requested time when read slowly as meditation narration.
- Target about ${input.wordTarget} words
- Minimum ${input.minWords} words
- Maximum ${input.maxWords} words

Pacing requirements:
- Write for a slow, soothing meditation cadence
- Use short paragraphs separated by blank lines
- Every paragraph should sound natural with room for gentle pauses
- Do not rush the script
- Do not sound repetitive, robotic, overly poetic, or like an affirmation list
- Avoid one-line paragraphs unless they are emotionally meaningful
- Keep the middle of the session substantial so the guidance does not end early

Structure guidance:
- ${blueprint}

Rules:
- Sound calm, warm, grounded, and human
- Return only the meditation script
- No title
- No bullet points
- No stage directions like "[pause]" or "(breathe)"
- If mode is breathing, naturally guide inhale, hold, and exhale throughout the session
- If mode is sleep, make the tone slower, heavier, and quieter
- If mode is yoga, include breath-linked movement cues, alignment reminders, and clear transitions between poses

Safety and wellness rules (apply to all modes):
- Do not diagnose, treat, cure, or claim to prevent any physical or mental health condition
- Do not present this session as mental health care, therapy, psychiatric treatment, medical care, or crisis support
- For anxiety, stress, or mood-related content: use general relaxation language only; do not suggest this session replaces professional support
- If the user's mood or check-in note includes self-harm, suicidal thoughts, crisis, chest pain, severe physical symptoms, or emergency language: open with a brief, warm note directing them to seek immediate professional or emergency help, then keep the remainder of the script short and gently grounding only

Yoga-specific safety rules (apply only when mode is yoga):
- Never instruct the user to push through pain or ignore discomfort
- Explicitly remind the user to stop and rest if they feel any pain, dizziness, numbness, shortness of breath, or unusual discomfort
- Do not make pregnancy, injury rehabilitation, trauma treatment, or medical recovery claims
- Avoid cueing advanced inversions (unsupported headstands, handstands), deep spinal compressions, extreme backbends, breath retention with strain, or extreme flexibility cues
- Always offer a gentler modification or alternative for every challenging pose or movement
- Guide movement within a comfortable and sustainable range of motion only

- ${inspirationLine}
`;

  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const meditation = response.output_text?.trim();
    if (!meditation) {
      return fallback;
    }

    return {
      meditation: ensureDurationAlignedScript(meditation, input, input.wordTarget, input.minWords),
      source: "openai" as const,
    };
  } catch (error) {
    console.error("Falling back to local meditation script:", error);
    return fallback;
  }
}

export async function POST(req: Request) {
  const identity = await resolveRequestIdentity(req);
  const policy = resolvePolicyName("meditationGenerate", identity.isAuthenticated);
  const rateLimit = await applyRateLimit(policy, identity.identifier);

  if (!rateLimit.success) {
    await logApiRequest({
      userId: identity.userId,
      route: "/api/generate-meditation",
      method: "POST",
      ipHash: identity.ipHash,
      userAgent: identity.userAgent,
      statusCode: 429,
      provider: null,
    });

    return tooManyRequestsResponse(rateLimit);
  }

  if (!identity.isAuthenticated) {
    const guestLimit = await checkGuestDailyLimit(identity.ipHash);
    if (!guestLimit.allowed) {
      await logApiRequest({
        userId: null,
        route: "/api/generate-meditation",
        method: "POST",
        ipHash: identity.ipHash,
        userAgent: identity.userAgent,
        statusCode: 403,
        provider: null,
      });
      return NextResponse.json(
        {
          error: "Guest daily limit reached",
          code: "GUEST_LIMIT_REACHED",
          signupRequired: true,
          message:
            "You've used your free guest session for today. Create a free account for 3 AI sessions per day.",
        },
        { status: 403 }
      );
    }
  }

  try {
    const entitlements = getEffectiveEntitlements(identity.viewer);
    const body = await req.json();

    const mood = String(body?.mood ?? "").trim();
    const duration = String(body?.duration ?? "").trim();
    const meditationType = String(body?.meditationType ?? "stress_relief").trim();
    const mode = normalizeMode(body?.mode, meditationType);
    const breathingPattern = body?.breathingPattern ? String(body.breathingPattern) : null;
    const checkIn = typeof body?.checkIn === "string" ? body.checkIn.trim() : "";
    const yogaFocus = typeof body?.yogaFocus === "string" ? body.yogaFocus.trim() : "full_body";
    const yogaLevel =
      body?.yogaLevel === "advanced" || body?.yogaLevel === "intermediate"
        ? body.yogaLevel
        : "beginner";
    const voice = typeof body?.voice === "string" ? body.voice : "marin";
    const visual = typeof body?.visual === "string" ? body.visual : "mist";
    const sounds = Array.isArray(body?.sounds)
      ? body.sounds.filter((item: unknown): item is string => typeof item === "string")
      : [];
    let language: AppLanguage = body?.language === "es" ? "es" : "en";

    if (identity.userId) {
      const profile = await getUserProfileSnapshot(identity.userId);
      if (profile?.preferredLanguage) {
        language = profile.preferredLanguage;
      }
    }

    if (!mood || !duration) {
      await logApiRequest({
        userId: identity.userId,
        route: "/api/generate-meditation",
        method: "POST",
        ipHash: identity.ipHash,
        userAgent: identity.userAgent,
        statusCode: 400,
        provider: null,
      });

      return errorResponse("Mood and duration are required.", 400);
    }

    const durationMinutes = durationLabelToMinutes(duration);
    if (durationMinutes > entitlements.maxDurationMinutes) {
      return usageLimitResponse(
        `Your ${entitlements.tier} plan supports sessions up to ${entitlements.maxDurationMinutes} minutes.`,
        entitlements,
        "meditation"
      );
    }

    if (!entitlements.allowedVoices.includes(voice)) {
      return usageLimitResponse(
        "That voice is available on ChimAura Premium.",
        entitlements,
        "meditation"
      );
    }

    if (sounds.some((sound: string) => !entitlements.allowedSounds.includes(sound))) {
      return usageLimitResponse(
        "That sound choice is available on ChimAura Premium.",
        entitlements,
        "meditation"
      );
    }

    if (mode === "sleep" && !entitlements.sleepMode && durationMinutes > 5) {
      return usageLimitResponse(
        "Long-form sleep sessions are part of ChimAura Premium.",
        entitlements,
        "meditation"
      );
    }

    const shouldTrackMeditationUsage = mode !== "breathing";
    if (shouldTrackMeditationUsage && identity.userId) {
      const usage = await getOrCreateDailyUsage(identity.userId);
      if (!canUseMeditation(usage, entitlements)) {
        await logApiRequest({
          userId: identity.userId,
          route: "/api/generate-meditation",
          method: "POST",
          ipHash: identity.ipHash,
          userAgent: identity.userAgent,
          statusCode: 403,
          provider: null,
        });

        return usageLimitResponse(
          "You have reached your free daily limit. Upgrade to ChimAura Premium for more meditation access.",
          entitlements,
          "meditation"
        );
      }
    }

    const wordTarget = getWordTarget(duration, mode, yogaLevel);
    const minWords = Math.max(90, Math.floor(wordTarget * 0.98));
    const maxWords = Math.ceil(wordTarget * 1.12);
    const selectedVisual = clampVisualToEntitlements(visual, entitlements);
    const selectedSounds = sounds
      .filter((sound: string) => entitlements.allowedSounds.includes(sound))
      .slice(0, entitlements.maxSounds);

    const generated = await generateMeditationText({
      mood,
      duration,
      mode,
      meditationType,
      breathingPattern,
      checkIn,
      yogaFocus,
      yogaLevel,
      wordTarget,
      minWords,
      maxWords,
      language,
    });

    if (shouldTrackMeditationUsage && identity.userId) {
      await incrementMeditationUsage(identity.userId);
    }

    if (!identity.isAuthenticated) {
      await incrementGuestDailyUsage(identity.ipHash);
    }

    const sessionId = await createSessionRecord(
      {
        mode,
        meditationType,
        mood,
        duration,
        breathingPattern,
        voice,
        visual: selectedVisual,
        sounds: selectedSounds,
        text: generated.meditation,
      },
      identity.userId ?? getGuestUserId()
    );

    await logApiRequest({
      userId: identity.userId,
      route: "/api/generate-meditation",
      method: "POST",
      ipHash: identity.ipHash,
      userAgent: identity.userAgent,
      statusCode: 200,
      provider: generated.source === "openai" ? "openai" : null,
    });

    return NextResponse.json({
      meditation: generated.meditation,
      source: generated.source,
      sessionId,
      wordCount: countWords(generated.meditation),
    });
  } catch (error) {
    await logApiRequest({
      userId: identity.userId,
      route: "/api/generate-meditation",
      method: "POST",
      ipHash: identity.ipHash,
      userAgent: identity.userAgent,
      statusCode: 500,
      provider: "openai",
    });

    return errorResponse(
      "Something went wrong while generating the session.",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}
