import crypto from "crypto";

export function generateRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

type StatelessTokenPurpose = "email-verification" | "password-reset";

type StatelessTokenPayload = {
  v: 1;
  exp: number;
  purpose: StatelessTokenPurpose;
  sub: string;
  state: string;
};

let warnedUsingFallbackAuthTokenSecret = false;

function getAuthTokenSecret() {
  const explicitSecret =
    process.env.AUTH_TOKEN_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim();

  if (explicitSecret) {
    return explicitSecret;
  }

  const fallbackSecret =
    process.env.IP_HASH_SALT?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    "chimaura-dev-auth-secret";

  if (process.env.NODE_ENV === "production" && !warnedUsingFallbackAuthTokenSecret) {
    warnedUsingFallbackAuthTokenSecret = true;
    console.warn("AUTH_TOKEN_SECRET is not configured; auth tokens are using a fallback secret.");
  }

  return fallbackSecret;
}

function encodeStatelessToken(payload: StatelessTokenPayload) {
  const serialized = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", getAuthTokenSecret()).update(serialized).digest("base64url");
  return `${serialized}.${signature}`;
}

function decodeStatelessToken(
  token: string,
  expectedPurpose: StatelessTokenPurpose
): StatelessTokenPayload | null {
  const [serialized, signature] = token.split(".");
  if (!serialized || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", getAuthTokenSecret())
    .update(serialized)
    .digest("base64url");

  const receivedSignature = Buffer.from(signature, "utf8");
  const normalizedExpectedSignature = Buffer.from(expectedSignature, "utf8");

  if (
    receivedSignature.length !== normalizedExpectedSignature.length ||
    !crypto.timingSafeEqual(receivedSignature, normalizedExpectedSignature)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(serialized, "base64url").toString("utf8")) as Partial<StatelessTokenPayload>;
    if (
      payload.v !== 1 ||
      payload.purpose !== expectedPurpose ||
      typeof payload.sub !== "string" ||
      typeof payload.state !== "string" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    return payload as StatelessTokenPayload;
  } catch {
    return null;
  }
}

function normalizeEmailAddress(email: string) {
  return email.trim().toLowerCase();
}

export function getEmailVerificationState(email: string, emailVerified: boolean) {
  return hashToken(`${normalizeEmailAddress(email)}|${emailVerified ? "1" : "0"}`);
}

export function createEmailVerificationToken(input: {
  userId: string;
  email: string;
  emailVerified: boolean;
  expiresAt?: Date;
}) {
  return encodeStatelessToken({
    v: 1,
    purpose: "email-verification",
    sub: input.userId,
    exp: (input.expiresAt ?? new Date(Date.now() + 1000 * 60 * 60 * 24)).getTime(),
    state: getEmailVerificationState(input.email, input.emailVerified),
  });
}

export function decodeEmailVerificationToken(token: string) {
  return decodeStatelessToken(token, "email-verification");
}

export function getPasswordResetState(passwordHash: string | null) {
  return hashToken(passwordHash ?? "");
}

export function createPasswordResetToken(input: {
  userId: string;
  passwordHash: string | null;
  expiresAt?: Date;
}) {
  return encodeStatelessToken({
    v: 1,
    purpose: "password-reset",
    sub: input.userId,
    exp: (input.expiresAt ?? new Date(Date.now() + 1000 * 60 * 30)).getTime(),
    state: getPasswordResetState(input.passwordHash),
  });
}

export function decodePasswordResetToken(token: string) {
  return decodeStatelessToken(token, "password-reset");
}

export function normalizePhoneNumber(rawPhoneNumber: string) {
  const trimmed = rawPhoneNumber.trim();
  if (!trimmed) {
    return null;
  }

  const digitsOnly = trimmed.replace(/[^\d+]/g, "");
  const compact = digitsOnly.startsWith("+")
    ? `+${digitsOnly.slice(1).replace(/\D/g, "")}`
    : digitsOnly.replace(/\D/g, "");

  if (/^\d{10}$/.test(compact)) {
    return `+1${compact}`;
  }

  if (/^1\d{10}$/.test(compact)) {
    return `+${compact}`;
  }

  if (/^\+\d{8,15}$/.test(compact)) {
    return compact;
  }

  return null;
}

export function generateOtpCode(length = 6) {
  const max = 10 ** length;
  const value = crypto.randomInt(0, max);
  return value.toString().padStart(length, "0");
}

