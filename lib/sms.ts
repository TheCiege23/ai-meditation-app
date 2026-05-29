import type { AppLanguage } from "@/lib/types";

type TwilioCredentials = {
  accountSid: string;
  username: string;
  password: string;
  fromPhone: string;
};

/** Returns true when all required Twilio env vars are present. */
export function isTwilioConfigured(): boolean {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const fromPhone =
    process.env.TWILIO_PHONE_NUMBER?.trim() ||
    process.env.TWILIO_FROM_PHONE?.trim();
  const hasCredential =
    !!(process.env.TWILIO_API_KEY_SID?.trim() || process.env.TWILIO_KEY_SID?.trim() || process.env.TWILIO_API_KEY?.trim()) ||
    !!(process.env.TWILIO_API_KEY_SECRET?.trim() || process.env.TWILIO_KEY_SECRET?.trim() || process.env.TWILIO_KEY?.trim()) ||
    !!process.env.TWILIO_AUTH_TOKEN?.trim();
  return !!(accountSid && fromPhone && hasCredential);
}

function getTwilioCredentials(): TwilioCredentials {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const apiKeySid =
    process.env.TWILIO_API_KEY_SID?.trim() ||
    process.env.TWILIO_KEY_SID?.trim() ||
    process.env.TWILIO_API_KEY?.trim();
  const apiKeySecret =
    process.env.TWILIO_API_KEY_SECRET?.trim() ||
    process.env.TWILIO_KEY_SECRET?.trim() ||
    process.env.TWILIO_KEY?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromPhone =
    process.env.TWILIO_PHONE_NUMBER?.trim() ||
    process.env.TWILIO_FROM_PHONE?.trim();

  if (!accountSid || !fromPhone) {
    throw new Error("Twilio account SID or from phone number is missing.");
  }

  if (apiKeySid && apiKeySecret) {
    return {
      accountSid,
      username: apiKeySid,
      password: apiKeySecret,
      fromPhone,
    };
  }

  if (authToken) {
    return {
      accountSid,
      username: accountSid,
      password: authToken,
      fromPhone,
    };
  }

  throw new Error("Twilio credentials are incomplete.");
}

function getOtpMessage(code: string, language: AppLanguage) {
  return language === "es"
    ? `Tu codigo de verificacion de ChimAura es ${code}. Este codigo vence en 5 minutos.`
    : `Your ChimAura verification code is ${code}. This code expires in 5 minutes.`;
}

async function sendTwilioFormRequest(
  path: string,
  params: Record<string, string>
) {
  const credentials = getTwilioCredentials();
  const body = new URLSearchParams(params);

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${credentials.accountSid}${path}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${credentials.username}:${credentials.password}`
        ).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      cache: "no-store",
    }
  );

  const payload = (await response.json().catch(() => null)) as
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.message || "Twilio request failed.");
  }
}

export async function sendOtpSms(params: {
  to: string;
  code: string;
  language: AppLanguage;
}) {
  const { to, code, language } = params;
  const credentials = getTwilioCredentials();

  await sendTwilioFormRequest("/Messages.json", {
    To: to,
    From: credentials.fromPhone,
    Body: getOtpMessage(code, language),
  });
}

export async function sendOtpVoiceCall(params: {
  to: string;
  code: string;
  language: AppLanguage;
}) {
  const { to, code, language } = params;
  const credentials = getTwilioCredentials();

  const spokenCode = code.split("").join(" ");
  const twiml =
    language === "es"
      ? `<Response><Say language="es-ES" voice="alice">Tu codigo de verificacion de ChimAura es ${spokenCode}. Repito. ${spokenCode}. Este codigo vence en cinco minutos.</Say></Response>`
      : `<Response><Say language="en-US" voice="alice">Your ChimAura verification code is ${spokenCode}. I repeat. ${spokenCode}. This code expires in five minutes.</Say></Response>`;

  await sendTwilioFormRequest("/Calls.json", {
    To: to,
    From: credentials.fromPhone,
    Twiml: twiml,
  });
}
