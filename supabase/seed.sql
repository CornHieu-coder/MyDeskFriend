insert into public.locations (id, name, building, floor, description, qr_slug)
values
  (47, 'Desk 47', 'Main Library', 'Level 3', 'A quiet study desk seeded for the live QR demo and the personalised archive flow.', 'desk-47'),
  (48, 'Desk 48', 'Main Library', 'Level 3', 'Neighbouring desk for testing multiple place archives.', 'desk-48'),
  (101, 'Law Library Desk 1', 'Law Library', 'Ground Floor', 'Quiet fallback location for cross-building demo data.', 'law-library-desk-1'),
  (205, 'Business School Study Booth', 'UNSW Business School', 'Level 2', 'Group-study booth for commerce and economics seed content.', 'business-study-booth'),
  (310, 'CSE Lab Table', 'K17 CSE', 'Level 3', 'Computer science lab table for technical study memories.', 'cse-lab-table'),
  (401, 'Tyree Quiet Corner', 'Tyree Energy Technologies Building', 'Level 4', 'Late-night engineering study corner.', 'tyree-quiet-corner'),
  (502, 'Ainsworth Window Desk', 'Ainsworth Building', 'Level 5', 'Window-side desk for longer individual study sessions.', 'ainsworth-window-desk'),
  (610, 'Mathews Tutorial Table', 'Mathews Building', 'Level 6', 'Tutorial table for short, high-turnover study notes.', 'mathews-tutorial-table')
on conflict (id) do update set
  name = excluded.name,
  building = excluded.building,
  floor = excluded.floor,
  description = excluded.description,
  qr_slug = excluded.qr_slug;
