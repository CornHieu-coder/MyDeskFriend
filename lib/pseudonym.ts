import { createHmac } from "crypto";

const labelNouns = [
  "Lantern",
  "Owl",
  "Fox",
  "Koala",
  "Comet",
  "Echo",
  "Wombat",
  "Maple",
  "Orbit",
  "Finch",
] as const;

const localDevelopmentSecret = "local-development-only-author-label-secret";

export function createAuthorLabel({
  demoUserId,
  locationId,
}: {
  demoUserId: string;
  locationId: number;
}) {
  const secret = getAppSecret();
  const hash = createHmac("sha256", secret)
    .update(`${demoUserId}:${locationId}`)
    .digest("hex");
  const hashNumber = Number.parseInt(hash.slice(0, 8), 16);
  const noun = labelNouns[hashNumber % labelNouns.length];

  return `Desk-${locationId} ${noun}`;
}

function getAppSecret() {
  if (process.env.APP_SECRET) {
    return process.env.APP_SECRET;
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "APP_SECRET is missing. Using a development-only author label secret.",
    );
    return localDevelopmentSecret;
  }

  throw new Error("APP_SECRET is required to create anonymous author labels.");
}
