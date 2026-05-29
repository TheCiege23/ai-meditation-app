import { prisma } from "@/lib/db";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal";

export async function createUserConsents(input: {
  userId: string;
  ipHash: string | null;
  userAgent: string | null;
}) {
  await prisma.$transaction([
    prisma.userConsent.create({
      data: {
        userId: input.userId,
        consentType: "terms",
        version: TERMS_VERSION,
        ipHash: input.ipHash,
        userAgent: input.userAgent,
      },
    }),
    prisma.userConsent.create({
      data: {
        userId: input.userId,
        consentType: "privacy",
        version: PRIVACY_VERSION,
        ipHash: input.ipHash,
        userAgent: input.userAgent,
      },
    }),
  ]);
}
