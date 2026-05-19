import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_SECONDS = 24 * 60 * 60;

type TokenPayload = {
  deskId: number;
  iat: number;
};

export type VerifyResult =
  | { ok: true; payload: TokenPayload }
  | { ok: false; error: string };

function getSecret(): string | null {
  return process.env.APP_SECRET || null;
}

export function signDeskToken(locationId: number): string | null {
  const secret = getSecret();
  if (!secret) return null;

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

  // APP_SECRET not configured — skip verification so dev works without env setup
  if (!secret) {
    return { ok: true, payload: { deskId: locationId, iat: Math.floor(Date.now() / 1000) } };
  }

  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) {
    return { ok: false, error: "Check-in token is malformed." };
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
    return { ok: false, error: "Check-in token has been tampered with." };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return { ok: false, error: "Check-in token is malformed." };
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    typeof (payload as TokenPayload).deskId !== "number" ||
    typeof (payload as TokenPayload).iat !== "number"
  ) {
    return { ok: false, error: "Check-in token is malformed." };
  }

  const { deskId, iat } = payload as TokenPayload;

  if (deskId !== locationId) {
    return { ok: false, error: "Check-in token is not valid for this desk." };
  }

  const age = Math.floor(Date.now() / 1000) - iat;
  if (age > TOKEN_TTL_SECONDS) {
    return {
      ok: false,
      error: "Check-in token has expired. Please scan the QR code again.",
    };
  }

  return { ok: true, payload: { deskId, iat } };
}
