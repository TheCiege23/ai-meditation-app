import type { AppLanguage, YogaFocus, YogaLevel, YogaSessionPlan } from "@/lib/types";

export type YogaPose = {
  id: string;
  name: string;
  nameEs: string;
  focus: YogaFocus[];
  level: YogaLevel;
  holdSecondsMin: number;
  holdSecondsMax: number;
  allowedNextPoseIds: string[];
  cuesEn: string[];
  cuesEs: string[];
};

export type YogaSessionStep = {
  order: number;
  poseId: string;
  holdSeconds: number;
};

export const YOGA_POSES: YogaPose[] = [
  {
    id: "childs_pose",
    name: "Child's Pose",
    nameEs: "Postura del nino",
    focus: ["stress_relief", "sleep_wind_down", "lower_back"],
    level: "beginner",
    holdSecondsMin: 30,
    holdSecondsMax: 90,
    allowedNextPoseIds: ["cat_cow", "seated_forward_fold"],
    cuesEn: ["Let your hips sink back gently and soften your shoulders."],
    cuesEs: ["Deja que las caderas bajen con suavidad y relaja los hombros."],
  },
  {
    id: "cat_cow",
    name: "Cat-Cow",
    nameEs: "Gato-vaca",
    focus: ["morning_flow", "desk_reset", "lower_back", "full_body_reset"],
    level: "beginner",
    holdSecondsMin: 30,
    holdSecondsMax: 60,
    allowedNextPoseIds: ["downward_dog", "seated_twist"],
    cuesEn: ["Move slowly with your breath and keep the neck easy."],
    cuesEs: ["Muevete lentamente con la respiracion y manten el cuello suelto."],
  },
  {
    id: "seated_forward_fold",
    name: "Seated Forward Fold",
    nameEs: "Flexion hacia delante sentado",
    focus: ["stress_relief", "sleep_wind_down", "lower_back"],
    level: "beginner",
    holdSecondsMin: 30,
    holdSecondsMax: 75,
    allowedNextPoseIds: ["seated_twist", "childs_pose"],
    cuesEn: ["Lengthen your spine first, then fold from the hips."],
    cuesEs: ["Alarga la columna primero y luego flexiona desde las caderas."],
  },
  {
    id: "seated_twist",
    name: "Seated Twist",
    nameEs: "Torsion sentada",
    focus: ["desk_reset", "full_body_reset", "lower_back"],
    level: "beginner",
    holdSecondsMin: 20,
    holdSecondsMax: 45,
    allowedNextPoseIds: ["childs_pose", "downward_dog"],
    cuesEn: ["Twist from the ribcage and keep your breath smooth."],
    cuesEs: ["Gira desde la caja toracica y manten la respiracion suave."],
  },
  {
    id: "downward_dog",
    name: "Downward Dog",
    nameEs: "Perro boca abajo",
    focus: ["morning_flow", "full_body_reset", "stress_relief"],
    level: "beginner",
    holdSecondsMin: 20,
    holdSecondsMax: 60,
    allowedNextPoseIds: ["childs_pose", "standing_forward_fold"],
    cuesEn: ["Press evenly through both hands and lengthen through your hips."],
    cuesEs: ["Presiona por igual con ambas manos y alarga las caderas hacia arriba."],
  },
  {
    id: "standing_forward_fold",
    name: "Standing Forward Fold",
    nameEs: "Flexion de pie hacia delante",
    focus: ["morning_flow", "stress_relief", "full_body_reset"],
    level: "beginner",
    holdSecondsMin: 20,
    holdSecondsMax: 50,
    allowedNextPoseIds: ["seated_twist", "childs_pose"],
    cuesEn: ["Keep a soft bend in the knees and relax your neck."],
    cuesEs: ["Manten una ligera flexion en las rodillas y relaja el cuello."],
  },
];

const YOGA_LEVEL_RANK: Record<YogaLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

function makePlanTitle(focus: YogaFocus, isEs: boolean, minutes: number) {
  const map: Record<YogaFocus, { en: string; es: string }> = {
    stress_relief: { en: "Stress Relief Flow", es: "Flujo antiestrés" },
    sleep_wind_down: { en: "Sleep Wind-Down", es: "Relajación para dormir" },
    lower_back: { en: "Lower Back Relief", es: "Alivio de zona lumbar" },
    morning_flow: { en: "Morning Activation", es: "Activación matutina" },
    desk_reset: { en: "Desk Reset", es: "Reinicio de escritorio" },
    full_body_reset: { en: "Full Body Reset", es: "Reinicio corporal" },
  };

  const base = isEs ? map[focus].es : map[focus].en;
  return `${minutes}-min ${base}`;
}

function clampHoldSeconds(pose: YogaPose, remaining: number) {
  const midpoint = Math.round((pose.holdSecondsMin + pose.holdSecondsMax) / 2);
  const clamped = Math.min(midpoint, remaining);
  return Math.max(Math.min(clamped, pose.holdSecondsMax), Math.min(15, pose.holdSecondsMin));
}

function selectNextPose(current: YogaPose | null, pool: YogaPose[], usedCounts: Map<string, number>) {
  if (pool.length === 0) return null;

  if (!current) {
    return pool[0];
  }

  const linked = current.allowedNextPoseIds
    .map((nextId) => pool.find((pose) => pose.id === nextId))
    .filter((pose): pose is YogaPose => Boolean(pose));

  const withUsageSort = (poses: YogaPose[]) =>
    [...poses].sort((a, b) => (usedCounts.get(a.id) ?? 0) - (usedCounts.get(b.id) ?? 0));

  if (linked.length > 0) {
    return withUsageSort(linked)[0];
  }

  return withUsageSort(pool)[0];
}

export function getYogaPoseById(poseId: string) {
  return YOGA_POSES.find((pose) => pose.id === poseId) ?? null;
}

export function generateYogaSessionPlan(input: {
  focus: YogaFocus;
  level: YogaLevel;
  durationMinutes: number;
  language: AppLanguage;
}) {
  const durationMinutes = Math.max(3, Math.min(30, Math.floor(input.durationMinutes)));
  const targetSeconds = durationMinutes * 60;

  const basePool = YOGA_POSES.filter(
    (pose) =>
      pose.focus.includes(input.focus) &&
      YOGA_LEVEL_RANK[pose.level] <= YOGA_LEVEL_RANK[input.level]
  );

  const pool = basePool.length > 0 ? basePool : YOGA_POSES.filter((pose) => pose.level === "beginner");

  const steps: YogaSessionStep[] = [];
  const usedCounts = new Map<string, number>();
  let elapsed = 0;
  let current: YogaPose | null = null;

  while (elapsed < targetSeconds) {
    const nextPose = selectNextPose(current, pool, usedCounts);
    if (!nextPose) break;

    const remaining = targetSeconds - elapsed;
    if (remaining < 15) break;

    const holdSeconds = clampHoldSeconds(nextPose, remaining);
    if (holdSeconds <= 0) break;

    steps.push({
      order: steps.length + 1,
      poseId: nextPose.id,
      holdSeconds,
    });

    elapsed += holdSeconds;
    usedCounts.set(nextPose.id, (usedCounts.get(nextPose.id) ?? 0) + 1);
    current = nextPose;
  }

  const cooldownPose = getYogaPoseById("childs_pose");
  if (cooldownPose && current?.id !== "childs_pose" && elapsed + 30 <= targetSeconds + 20) {
    steps.push({
      order: steps.length + 1,
      poseId: cooldownPose.id,
      holdSeconds: 30,
    });
    elapsed += 30;
  }

  const isEs = input.language === "es";
  const plan: YogaSessionPlan = {
    id: `yoga_${input.focus}_${durationMinutes}`,
    title: makePlanTitle(input.focus, false, durationMinutes),
    titleEs: makePlanTitle(input.focus, true, durationMinutes),
    language: input.language,
    focus: input.focus,
    level: input.level,
    totalSeconds: elapsed,
    poseIds: steps.map((step) => step.poseId),
  };

  return {
    plan,
    displayTitle: isEs ? plan.titleEs : plan.title,
    steps,
  };
}

export const YOGA_SESSION_PLANS: YogaSessionPlan[] = [
  generateYogaSessionPlan({
    focus: "stress_relief",
    level: "beginner",
    durationMinutes: 5,
    language: "en",
  }).plan,
];
