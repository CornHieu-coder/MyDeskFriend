export type MessageEnrichment = {
  courseTags: string[];
  tags: string[];
  termWeekWhenWritten: number;
};

const demoCurrentWeek = 10;
const supportedCourseCodes = [
  "COMP1511",
  "COMP2521",
  "COMP1531",
  "MATH1081",
  "FINS1613",
  "ECON1101",
];

export function enrichMessageBody(body: string): MessageEnrichment {
  const normalizedBody = body.toUpperCase();
  const lowerBody = body.toLowerCase();
  const courseTags = supportedCourseCodes.filter((courseCode) =>
    new RegExp(`\\b${courseCode}\\b`, "i").test(normalizedBody),
  );
  const tags: string[] = [];

  if (/\b(exam|final|quiz|test)\b/i.test(lowerBody)) {
    tags.push("exam advice");
  }

  if (/\b(tip|practise|practice|write|draw|explain)\b/i.test(lowerBody)) {
    tags.push("study tip");
  }

  if (/\b(tired|stress|stressed|stressful|overwhelming|hard)\b/i.test(lowerBody)) {
    tags.push("emotional support");
  }

  return {
    courseTags,
    tags,
    termWeekWhenWritten: demoCurrentWeek,
  };
}
