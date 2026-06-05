-- Optional dev seed (run after 001_initial_schema.sql).
-- Mirrors mock UI data so Supabase-connected apps show content before ND ingest.

insert into public.operators (external_id, name, hq, focus_areas, permits_ytd, rigs, is_active)
values
  ('op-continental', 'Continental Resources', 'Oklahoma City, OK', 'McKenzie / Williams', 62, 8, true),
  ('op-hess', 'Hess Corporation', 'Houston, TX', 'Williams', 48, 6, true),
  ('op-marathon', 'Marathon Oil', 'Houston, TX', 'Dunn / McKenzie', 35, 5, true),
  ('op-wpx', 'WPX Energy', 'Tulsa, OK', 'Mountrail', 31, 4, true),
  ('op-oasis', 'Oasis Petroleum', 'Houston, TX', 'Mountrail / Williams', 24, 3, true)
on conflict (external_id) do nothing;

insert into public.counties (name, permits_ytd, rigs, median_cycle_days, top_operator_name)
values
  ('McKenzie', 412, 14, 118, 'Continental Resources'),
  ('Williams', 286, 9, 124, 'Hess Corporation'),
  ('Mountrail', 198, 7, 131, 'WPX Energy'),
  ('Dunn', 164, 4, 127, 'Marathon Oil'),
  ('Divide', 121, 3, 136, 'Continental Resources'),
  ('Burke', 54, 2, 142, 'Smaller independents')
on conflict (name) do nothing;

insert into public.permits (
  external_id, operator_name, well_name, county_name, permit_type, status, filed_at
)
values
  ('ND-26-08421', 'Continental Resources', 'Hawkeye Federal 5-32H', 'McKenzie', 'Drilling', 'Approved', '2026-05-10'),
  ('ND-26-08407', 'Hess Corporation', 'Elm Coulee 12-24H', 'Williams', 'Drilling', 'Under review', '2026-05-09'),
  ('ND-26-08398', 'Marathon Oil', 'Bailey 3-11H', 'Dunn', 'Drilling', 'Approved', '2026-05-08'),
  ('ND-26-08376', 'WPX Energy', 'Missouri Ridge 14-33H', 'Mountrail', 'Recomplete', 'Approved', '2026-05-07'),
  ('ND-26-08351', 'Oasis Petroleum', 'Sanish 8-21H', 'Mountrail', 'Drilling', 'Awaiting bond', '2026-05-06'),
  ('ND-26-08322', 'Whiting Petroleum', 'Pronghorn 2-18H', 'Mountrail', 'Drilling', 'Approved', '2026-05-05')
on conflict (external_id) do nothing;

insert into public.activity_events (
  title, detail, body, county_name, event_type, severity, occurred_at
)
values
  ('Drilling permit approved', 'Hess — Elm Coulee 12-24H', null, 'Williams', 'permit', null, '2026-05-12T14:22:00Z'),
  ('Spud notification filed', 'Continental — Hawkeye Federal 5-32H', null, 'McKenzie', 'spud', null, '2026-05-12T11:05:00Z'),
  ('Completion report received', 'WPX — Missouri Ridge 14-33H', null, 'Mountrail', 'completion', null, '2026-05-11T16:40:00Z'),
  ('Gas capture plan update', 'Oasis — Sanish 8-21H', null, 'Mountrail', 'regulatory', null, '2026-05-11T09:18:00Z'),
  ('Water haul route variance', 'Marathon — Bailey 3-11H', null, 'Dunn', 'logistics', null, '2026-05-10T13:55:00Z'),
  (
    'Processing utilization threshold',
    'Eastern McKenzie gas plants',
    'Eastern McKenzie gas plants trending above 88% utilization on trailing 30 days.',
    'McKenzie',
    'regulatory',
    'warning',
    '2026-05-12T07:30:00Z'
  ),
  (
    'New permit cluster',
    'Sanish field cluster',
    'Five drilling permits filed within 6 miles near Sanish field in the last 72 hours.',
    'Mountrail',
    'permit',
    'info',
    '2026-05-11T15:12:00Z'
  ),
  (
    'Disposal lead time',
    'Williams SWD interval',
    'Median SWD permit-to-injection interval increased 9 business days vs. prior quarter.',
    'Williams',
    'regulatory',
    'critical',
    '2026-05-10T09:45:00Z'
  );

insert into public.risk_summaries (headline, bullets, risk_level, generated_at, is_current)
values (
  'Midstream and disposal headroom tightening in core McKenzie',
  '[
    "Gas processing utilization in eastern McKenzie is trending above 88% on a 30-day average; new drilling clusters could push swing capacity earlier than modeled.",
    "Saltwater disposal capacity in southern Williams remains adequate, but permit-to-injection lead times have lengthened by roughly 9 business days quarter-over-quarter.",
    "Proppant and sand last-mile logistics show normal seasonal variance; no broad rail disruptions detected in the mock feed."
  ]'::jsonb,
  'elevated',
  '2026-05-12T08:00:00Z',
  true
);
