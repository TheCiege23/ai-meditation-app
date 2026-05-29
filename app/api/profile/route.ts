import { NextResponse } from "next/server";

import { resolveViewer } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { getPersonalAstroSnapshot } from "@/lib/horoscope";
import { getUserProfileSnapshot, upsertUserProfile } from "@/lib/user-store";
import type { AppLanguage } from "@/lib/types";
import { getZodiacSign, isValidBirthdate } from "@/lib/zodiac";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in first.", 401);
  }

  const profile = await getUserProfileSnapshot(viewer.userId);
  const astroSnapshot = profile ? await getPersonalAstroSnapshot(profile) : null;
  return NextResponse.json({ profile, astroSnapshot });
}

export async function POST(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in first.", 401);
  }

  const body = await req.json();
  const birthdate = typeof body?.birthdate === "string" ? body.birthdate.trim() : null;

  if (birthdate && !isValidBirthdate(birthdate)) {
    return errorResponse("Please provide a valid birthdate.", 400);
  }

  const zodiacSign = birthdate ? getZodiacSign(new Date(birthdate)) : null;

  const profile = await upsertUserProfile({
    userId: viewer.userId,
    fullName: typeof body?.fullName === "string" ? body.fullName.trim() : undefined,
    birthdate,
    zodiacSign,
    birthTime: typeof body?.birthTime === "string" ? body.birthTime.trim() : undefined,
    birthLocation: typeof body?.birthLocation === "string" ? body.birthLocation.trim() : undefined,
    latitude: typeof body?.latitude === "number" ? body.latitude : undefined,
    longitude: typeof body?.longitude === "number" ? body.longitude : undefined,
    timezone: typeof body?.timezone === "string" ? body.timezone.trim() : undefined,
    preferredMood: typeof body?.preferredMood === "string" ? body.preferredMood.trim() : undefined,
    preferredLanguage: (body?.preferredLanguage as AppLanguage | null) ?? undefined,
  });

  const astroSnapshot = await getPersonalAstroSnapshot({
    fullName: profile.fullName,
    birthdate: profile.birthdate?.toISOString() ?? null,
    zodiacSign: profile.zodiacSign,
    birthTime: profile.birthTime,
    birthLocation: profile.birthLocation,
    latitude: profile.latitude,
    longitude: profile.longitude,
    timezone: profile.timezone,
    preferredMood: profile.preferredMood,
    preferredLanguage: (profile.preferredLanguage as AppLanguage | null) ?? null,
  });

  return NextResponse.json({
    profile: {
      fullName: profile.fullName,
      birthdate: profile.birthdate?.toISOString() ?? null,
      zodiacSign: profile.zodiacSign,
      birthTime: profile.birthTime,
      birthLocation: profile.birthLocation,
      latitude: profile.latitude,
      longitude: profile.longitude,
      timezone: profile.timezone,
      preferredMood: profile.preferredMood,
      preferredLanguage: (profile.preferredLanguage as AppLanguage | null) ?? null,
    },
    astroSnapshot,
  });
}