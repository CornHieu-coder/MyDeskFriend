export type DemoLocation = {
  id: number;
  name: string;
  building: string;
  floor: string;
  description: string;
  qr_slug: string;
};

export const demoLocations: DemoLocation[] = [
  {
    id: 47,
    name: "Desk 47",
    building: "Main Library",
    floor: "Level 3",
    description:
      "A quiet study desk seeded for the live QR demo and the personalised archive flow.",
    qr_slug: "desk-47",
  },
  {
    id: 48,
    name: "Desk 48",
    building: "Main Library",
    floor: "Level 3",
    description: "Neighbouring desk for testing multiple place archives.",
    qr_slug: "desk-48",
  },
  {
    id: 101,
    name: "Law Library Desk 1",
    building: "Law Library",
    floor: "Ground Floor",
    description: "Quiet fallback location for cross-building demo data.",
    qr_slug: "law-library-desk-1",
  },
  {
    id: 205,
    name: "Business School Study Booth",
    building: "UNSW Business School",
    floor: "Level 2",
    description: "Group-study booth for commerce and economics seed content.",
    qr_slug: "business-study-booth",
  },
  {
    id: 310,
    name: "CSE Lab Table",
    building: "K17 CSE",
    floor: "Level 3",
    description: "Computer science lab table for technical study memories.",
    qr_slug: "cse-lab-table",
  },
  {
    id: 401,
    name: "Tyree Quiet Corner",
    building: "Tyree Energy Technologies Building",
    floor: "Level 4",
    description: "Late-night engineering study corner.",
    qr_slug: "tyree-quiet-corner",
  },
  {
    id: 502,
    name: "Ainsworth Window Desk",
    building: "Ainsworth Building",
    floor: "Level 5",
    description: "Window-side desk for longer individual study sessions.",
    qr_slug: "ainsworth-window-desk",
  },
  {
    id: 610,
    name: "Mathews Tutorial Table",
    building: "Mathews Building",
    floor: "Level 6",
    description: "Tutorial table for short, high-turnover study notes.",
    qr_slug: "mathews-tutorial-table",
  },
];

export function getDemoLocationById(locationId: string) {
  const id = Number(locationId);

  if (!Number.isInteger(id)) {
    return null;
  }

  return demoLocations.find((location) => location.id === id) ?? null;
}
