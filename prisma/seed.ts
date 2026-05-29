import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const course = await prisma.course.upsert({
    where: { slug: "7-day-calm-reset" },
    create: {
      slug: "7-day-calm-reset",
      titleEn: "7 Day Calm Reset",
      titleEs: "7 días de calma",
      descriptionEn: "A week of short daily practices to reset stress and build a calm habit.",
      descriptionEs: "Una semana de prácticas diarias cortas para resetear el estrés y construir un hábito de calma.",
      durationDays: 7,
      isPremium: false,
      orderIndex: 0,
    },
    update: {},
  });

  const steps = [
    { dayIndex: 0, titleEn: "Welcome", titleEs: "Bienvenida", type: "reflection", orderIndex: 0 },
    { dayIndex: 1, titleEn: "Breath awareness", titleEs: "Conciencia de la respiración", type: "breathing", orderIndex: 0 },
    { dayIndex: 2, titleEn: "Body scan", titleEs: "Escaneo corporal", type: "meditation", orderIndex: 0 },
    { dayIndex: 3, titleEn: "Rest day", titleEs: "Día de descanso", type: "rest", orderIndex: 0 },
    { dayIndex: 4, titleEn: "Calm focus", titleEs: "Enfoque calmado", type: "meditation", orderIndex: 0 },
    { dayIndex: 5, titleEn: "Gentle breath", titleEs: "Respiración suave", type: "breathing", orderIndex: 0 },
    { dayIndex: 6, titleEn: "Closing reflection", titleEs: "Reflexión final", type: "reflection", orderIndex: 0 },
  ];

  const existingSteps = await prisma.courseStep.count({ where: { courseId: course.id } });
  if (existingSteps === 0) {
    await prisma.courseStep.createMany({
      data: steps.map((s) => ({ courseId: course.id, ...s })),
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
