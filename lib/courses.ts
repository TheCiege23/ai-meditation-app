import { prisma } from "@/lib/db";
import type { AppLanguage } from "@/lib/types";

export type CourseSummary = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  durationDays: number;
  isPremium: boolean;
  orderIndex: number;
  progress?: { currentStepIndex: number; startedAt: string; completedAt: string | null };
};

export type CourseStepSummary = {
  id: string;
  dayIndex: number;
  title: string;
  description: string | null;
  type: string;
  contentJson: unknown;
  orderIndex: number;
};

export async function getCoursesForUser(
  userId: string | null,
  language: AppLanguage,
  includePremium: boolean
): Promise<CourseSummary[]> {
  const courses = await prisma.course.findMany({
    orderBy: { orderIndex: "asc" },
    include: {
      progress: userId ? { where: { userId } } : false,
    },
  });

  const titleKey = language === "es" ? "titleEs" : "titleEn";
  const descKey = language === "es" ? "descriptionEs" : "descriptionEn";

  return courses
    .filter((c) => includePremium || !c.isPremium)
    .map((c) => {
      const title = titleKey === "titleEs" ? c.titleEs : c.titleEn;
      const description = descKey === "descriptionEs" ? c.descriptionEs : c.descriptionEn;
      const progressItem = Array.isArray(c.progress) && c.progress[0] ? c.progress[0] : null;
      return {
        id: c.id,
        slug: c.slug,
        title,
        description,
        durationDays: c.durationDays,
        isPremium: c.isPremium,
        orderIndex: c.orderIndex,
        progress: progressItem
          ? {
              currentStepIndex: progressItem.currentStepIndex,
              startedAt: progressItem.startedAt.toISOString(),
              completedAt: progressItem.completedAt?.toISOString() ?? null,
            }
          : undefined,
      };
    });
}

export async function getCourseBySlug(
  slug: string,
  language: AppLanguage
): Promise<{ course: CourseSummary; steps: CourseStepSummary[] } | null> {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: { steps: { orderBy: [{ dayIndex: "asc" }, { orderIndex: "asc" }] } },
  });
  if (!course) return null;

  const titleKey = language === "es" ? "titleEs" : "titleEn";
  const descKey = language === "es" ? "descriptionEs" : "descriptionEn";

  const courseSummary: CourseSummary = {
    id: course.id,
    slug: course.slug,
    title: titleKey === "titleEs" ? course.titleEs : course.titleEn,
    description: descKey === "descriptionEs" ? course.descriptionEs : course.descriptionEn,
    durationDays: course.durationDays,
    isPremium: course.isPremium,
    orderIndex: course.orderIndex,
  };

  const steps: CourseStepSummary[] = course.steps.map((s) => ({
    id: s.id,
    dayIndex: s.dayIndex,
    title: language === "es" ? s.titleEs : s.titleEn,
    description: language === "es" ? s.descriptionEs : s.descriptionEn,
    type: s.type,
    contentJson: s.contentJson,
    orderIndex: s.orderIndex,
  }));

  return { course: courseSummary, steps };
}

export async function getUserCourseProgress(userId: string, courseId: string) {
  return prisma.userCourseProgress.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
}

export async function startCourse(userId: string, courseId: string) {
  return prisma.userCourseProgress.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, currentStepIndex: 0 },
    update: {},
  });
}

export async function advanceCourseStep(userId: string, courseId: string, nextStepIndex: number) {
  const steps = await prisma.courseStep.count({ where: { courseId } });
  const completed = nextStepIndex >= steps;
  return prisma.userCourseProgress.update({
    where: { userId_courseId: { userId, courseId } },
    data: {
      currentStepIndex: Math.min(nextStepIndex, steps),
      completedAt: completed ? new Date() : undefined,
    },
  });
}
