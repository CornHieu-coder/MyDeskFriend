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

insert into public.messages (
  id,
  location_id,
  pseudonym,
  body,
  tags,
  course_tags,
  upvotes,
  status,
  term_week_when_written,
  created_at
)
values
  ('10000000-0000-4000-8000-000000000001', 47, 'Desk-47 Lantern', 'If COMP2521 recursion feels impossible tonight, draw the stack frame by frame. It clicks faster than rereading slides.', array['study tip','exam advice'], array['COMP2521'], 18, 'public', 10, '2026-05-19T00:45:00.000Z'),
  ('10000000-0000-4000-8000-000000000002', 47, 'Desk-47 North', 'I cried here before a final, then passed. Stay for one more focused block, then go drink water.', array['emotional support','exam advice'], array[]::text[], 24, 'public', 10, '2026-05-18T22:15:00.000Z'),
  ('10000000-0000-4000-8000-000000000003', 47, 'Desk-47 Signal', 'For FINS1613, write the formula sheet from memory first. The gaps tell you what to revise.', array['study tip','course advice'], array['FINS1613'], 15, 'public', 8, '2026-05-18T19:30:00.000Z'),
  ('10000000-0000-4000-8000-000000000004', 47, 'Desk-47 Atlas', 'Past papers beat panic. Do one question badly, mark it honestly, then do the same type again.', array['study tip','exam advice'], array[]::text[], 21, 'public', 9, '2026-05-18T11:10:00.000Z'),
  ('10000000-0000-4000-8000-000000000005', 47, 'Desk-47 Current', 'COMP2521 graphs: say out loud what the queue or stack contains after every step. It saved my BFS question.', array['study tip','course advice'], array['COMP2521'], 17, 'public', 9, '2026-05-17T23:55:00.000Z'),
  ('10000000-0000-4000-8000-000000000006', 47, 'Desk-47 Harbor', 'You are allowed to be tired and still make progress. Set a 25 minute timer and make the task smaller.', array['emotional support'], array[]::text[], 28, 'public', 10, '2026-05-17T14:20:00.000Z'),
  ('10000000-0000-4000-8000-000000000007', 47, 'Desk-47 Circuit', 'FINS1613 ratios stopped blending together when I made one tiny example company and reused it for every formula.', array['study tip','course advice'], array['FINS1613'], 14, 'public', 7, '2026-05-17T09:00:00.000Z'),
  ('10000000-0000-4000-8000-000000000008', 47, 'Desk-47 Paper', 'If the library feels silent in a bad way, remember there are probably ten people nearby also pretending they understand everything.', array['emotional support','memory'], array[]::text[], 31, 'public', 10, '2026-05-16T21:25:00.000Z'),
  ('10000000-0000-4000-8000-000000000009', 47, 'Desk-47 Margin', 'COMP2521 tip: after writing code, test the empty list, one node, and two nodes. Most pointer bugs show up there.', array['study tip','course advice'], array['COMP2521'], 22, 'public', 8, '2026-05-16T08:40:00.000Z'),
  ('10000000-0000-4000-8000-000000000010', 47, 'Desk-47 Solace', 'I left this desk after midnight and thought I learned nothing. The next morning it was there. Sleep counts.', array['emotional support','memory'], array[]::text[], 26, 'public', 10, '2026-05-15T15:15:00.000Z'),
  ('10000000-0000-4000-8000-000000000011', 47, 'Desk-47 Ledger', 'FINS1613: make sure you can explain why the answer moves, not just calculate the number.', array['exam advice','course advice'], array['FINS1613'], 13, 'public', 9, '2026-05-15T03:05:00.000Z'),
  ('10000000-0000-4000-8000-000000000012', 47, 'Desk-47 Kernel', 'When debugging C, print the pointer address and the value. They are different questions.', array['study tip','course advice'], array['COMP2521','COMP1511'], 20, 'public', 6, '2026-05-14T20:00:00.000Z'),
  ('10000000-0000-4000-8000-000000000013', 47, 'Desk-47 Quiet', 'Take the window seat if you can. Looking up for ten seconds between questions helps more than scrolling.', array['study tip','memory'], array[]::text[], 11, 'public', 5, '2026-05-14T06:50:00.000Z'),
  ('10000000-0000-4000-8000-000000000014', 47, 'Desk-47 Proof', 'MATH1081 proofs got easier when I wrote the definitions at the top before trying anything clever.', array['study tip','course advice'], array['MATH1081'], 16, 'public', 8, '2026-05-13T16:35:00.000Z'),
  ('10000000-0000-4000-8000-000000000015', 47, 'Desk-47 Balance', 'For ECON1101 diagrams, label the axis before the curve. It prevents half the silly mistakes.', array['study tip','course advice'], array['ECON1101'], 12, 'public', 7, '2026-05-13T05:45:00.000Z'),
  ('10000000-0000-4000-8000-000000000016', 47, 'Desk-47 Northstar', 'You do not need to finish the whole course tonight. You need to make tomorrow less scary.', array['emotional support'], array[]::text[], 34, 'public', 10, '2026-05-12T22:10:00.000Z'),
  ('10000000-0000-4000-8000-000000000017', 47, 'Desk-47 Compile', 'COMP2521 AVL rotations: draw the three nodes only. Ignore the rest of the tree until the rotation is done.', array['exam advice','course advice'], array['COMP2521'], 19, 'public', 10, '2026-05-12T10:00:00.000Z'),
  ('10000000-0000-4000-8000-000000000018', 47, 'Desk-47 Yield', 'FINS1613 revision worked best in pairs: one person asks what changed, the other explains the financial reason.', array['study tip','course advice'], array['FINS1613'], 10, 'public', 8, '2026-05-11T18:25:00.000Z'),
  ('10000000-0000-4000-8000-000000000019', 47, 'Desk-47 Sunrise', 'Morning study here is underrated. The room feels different before the rush starts.', array['memory'], array[]::text[], 9, 'public', 4, '2026-05-11T00:20:00.000Z'),
  ('10000000-0000-4000-8000-000000000020', 47, 'Desk-47 Anchor', 'Before leaving, write the first task for tomorrow on paper. Future you gets a softer landing.', array['study tip','emotional support'], array[]::text[], 23, 'public', 10, '2026-05-10T12:00:00.000Z'),
  ('10000000-0000-4000-8000-000000000021', 47, 'Desk-47 Array', 'For COMP2521 complexity, say what n represents before writing Big O. That stopped my worst exam mistakes.', array['exam advice','course advice'], array['COMP2521'], 18, 'public', 9, '2026-05-09T17:30:00.000Z'),
  ('10000000-0000-4000-8000-000000000022', 47, 'Desk-47 Market', 'For FINS1613, explain ratios in plain English before memorising. It makes the formulas less slippery.', array['study tip','course advice'], array['FINS1613'], 12, 'public', 9, '2026-05-09T08:05:00.000Z'),
  ('10000000-0000-4000-8000-000000000023', 47, 'Desk-47 Signal', 'Someone else sat here stuck on the same page. You are not behind life. You are inside a hard week.', array['emotional support'], array[]::text[], 30, 'public', 10, '2026-05-08T23:20:00.000Z'),
  ('10000000-0000-4000-8000-000000000024', 47, 'Desk-47 Outline', 'Write the answer structure before solving. It turns a blank page into a checklist.', array['exam advice','study tip'], array[]::text[], 14, 'public', 8, '2026-05-08T12:45:00.000Z'),
  ('10000000-0000-4000-8000-000000000029', 47, 'Desk-47 Theorem', 'MATH1081 graph proofs: name the vertices, state what edge means, then prove the condition one direction at a time.', array['exam advice','course advice'], array['MATH1081'], 17, 'public', 10, '2026-05-18T06:30:00.000Z'),
  ('10000000-0000-4000-8000-000000000030', 47, 'Desk-47 Set', 'For MATH1081 relations, write a tiny set example before the formal proof. It catches symmetry and transitivity mistakes fast.', array['study tip','course advice'], array['MATH1081'], 14, 'public', 9, '2026-05-17T19:10:00.000Z'),
  ('10000000-0000-4000-8000-000000000031', 47, 'Desk-47 Demand', 'ECON1101 elasticity questions get easier if you write what is changing first: price, quantity, income, or substitutes.', array['exam advice','course advice'], array['ECON1101'], 16, 'public', 10, '2026-05-18T04:40:00.000Z'),
  ('10000000-0000-4000-8000-000000000032', 47, 'Desk-47 Curve', 'ECON1101 graphs: say whether the curve shifts or you move along it before touching the diagram.', array['study tip','course advice'], array['ECON1101'], 15, 'public', 9, '2026-05-16T18:35:00.000Z'),
  ('10000000-0000-4000-8000-000000000033', 47, 'Desk-47 Trace', 'For COMP2521, start every hard problem by tracing a tiny input and writing what the algorithm remembers at each step. The right data structure usually becomes clearer after the trace.', array['study tip'], array['COMP2521'], 7, 'public', 10, '2026-05-19T03:10:00.000Z'),
  ('10000000-0000-4000-8000-000000000034', 47, 'Desk-47 Plain', 'MATH1081 proofs get easier when you turn each definition into plain English before writing symbols. Focus on the reason each step follows from the last one.', array['study tip'], array['MATH1081'], 6, 'public', 10, '2026-05-19T03:20:00.000Z'),
  ('10000000-0000-4000-8000-000000000035', 47, 'Desk-47 Pattern', 'If an algorithms question feels messy, separate the idea from the implementation. First explain the pattern, then choose the stack, queue, tree, or graph representation.', array['study tip','emotional support'], array['COMP2521'], 8, 'public', 10, '2026-05-19T03:30:00.000Z'),
  ('10000000-0000-4000-8000-000000000036', 47, 'Desk-47 Variable', 'For FINS1613, write the meaning of every variable before using the formula. If you can explain the relationship in words, the calculation becomes easier.', array['study tip'], array['FINS1613'], 7, 'public', 10, '2026-05-19T03:40:00.000Z'),
  ('10000000-0000-4000-8000-000000000037', 47, 'Desk-47 Equilibrium', 'ECON1101 graphs are less confusing when you describe the story first: who changed behaviour, what shifted, and where the new equilibrium sits.', array['study tip'], array['ECON1101'], 6, 'public', 10, '2026-05-19T03:50:00.000Z'),
  ('10000000-0000-4000-8000-000000000038', 47, 'Desk-47 Intuition', 'Before a finance quiz, practise explaining the intuition without numbers. Once the concept is clear, the formula stops feeling random.', array['exam advice','study tip'], array['FINS1613'], 8, 'public', 10, '2026-05-19T04:00:00.000Z'),
  ('10000000-0000-4000-8000-000000000025', 48, 'Desk-48 Margin', 'This desk is better for reading than coding. Less traffic, softer noise.', array['memory','study tip'], array[]::text[], 7, 'public', 6, '2026-05-17T05:00:00.000Z'),
  ('10000000-0000-4000-8000-000000000026', 101, 'Law-Desk-1 Note', 'For case notes, write the issue in one sentence before copying any facts.', array['study tip'], array[]::text[], 8, 'public', 7, '2026-05-16T04:00:00.000Z'),
  ('10000000-0000-4000-8000-000000000027', 205, 'Business-Booth Signal', 'Group study works when everyone brings one question they cannot answer alone.', array['study tip'], array['FINS1613','ECON1101'], 11, 'public', 8, '2026-05-15T04:00:00.000Z'),
  ('10000000-0000-4000-8000-000000000028', 310, 'CSE-Table Compile', 'Run the sample tests before changing anything. Know what was broken before you start fixing.', array['study tip','course advice'], array['COMP1511','COMP2521'], 13, 'public', 9, '2026-05-14T04:00:00.000Z')
on conflict (id) do update set
  location_id = excluded.location_id,
  pseudonym = excluded.pseudonym,
  body = excluded.body,
  tags = excluded.tags,
  course_tags = excluded.course_tags,
  upvotes = excluded.upvotes,
  status = excluded.status,
  term_week_when_written = excluded.term_week_when_written,
  created_at = excluded.created_at;

update public.messages
set author_label = pseudonym
where author_label = 'Anonymous Student'
  and pseudonym is not null
  and pseudonym <> ''
  and pseudonym <> 'Anonymous Student';
