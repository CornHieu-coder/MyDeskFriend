import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_SECONDS = 24 * 60 * 60;
const localDevelopmentSecret = "local-development-only-qr-token-secret";

type TokenPayload = {
  deskId: number;
  iat: number;
};

export type VerifyResult = { ok: true } | { ok: false; error: string };

function getSecret(): string {
  if (process.env.APP_SECRET) {
    return process.env.APP_SECRET;
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn("APP_SECRET is missing. Using a development-only QR token secret.");
    return localDevelopmentSecret;
  }

  throw new Error("APP_SECRET is required for QR token signing.");
}

export function signDeskToken(locationId: number): string {
  const secret = getSecret();
  const payload: TokenPayload = {
    deskId: locationId,
    iat: Math.floor(Date.now() / 1000),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyDeskToken(token: string, locationId: number): VerifyResult {
  const secret = getSecret();

  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) {
    return { ok: false, error: "QR code has expired, please scan a fresh code" };
  }

  const encoded = token.slice(0, dotIndex);
  const providedSig = token.slice(dotIndex + 1);
  const expectedSig = createHmac("sha256", secret).update(encoded).digest("base64url");

  let sigMatches: boolean;
  try {
    sigMatches = timingSafeEqual(
      Buffer.from(providedSig, "base64url"),
      Buffer.from(expectedSig, "base64url"),
    );
  } catch {
    sigMatches = false;
  }

  if (!sigMatches) {
    return { ok: false, error: "QR code has expired, please scan a fresh code" };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return { ok: false, error: "QR code has expired, please scan a fresh code" };
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    typeof (payload as TokenPayload).deskId !== "number" ||
    typeof (payload as TokenPayload).iat !== "number"
  ) {
    return { ok: false, error: "QR code has expired, please scan a fresh code" };
  }

  const { deskId, iat } = payload as TokenPayload;

  if (deskId !== locationId) {
    return { ok: false, error: "QR code has expired, please scan a fresh code" };
  }

  const age = Math.floor(Date.now() / 1000) - iat;
  if (age > TOKEN_TTL_SECONDS) {
    return { ok: false, error: "QR code has expired, please scan a fresh code" };
  }

  return { ok: true };
}
