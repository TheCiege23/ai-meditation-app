CREATE TABLE IF NOT EXISTS "user_consents" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "consentType" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipHash" TEXT,
  "userAgent" TEXT,
  CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "user_consents_userId_consentType_idx" ON "user_consents"("userId", "consentType");
CREATE INDEX IF NOT EXISTS "user_consents_consentType_acceptedAt_idx" ON "user_consents"("consentType", "acceptedAt");
