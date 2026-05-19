export function toVectorLiteral(values: number[]) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Embedding must be a non-empty number array.");
  }

  return `[${values.map(formatVectorNumber).join(",")}]`;
}

function formatVectorNumber(value: number) {
  if (!Number.isFinite(value)) {
    throw new Error("Embedding contains a non-finite value.");
  }

  return String(value);
}
