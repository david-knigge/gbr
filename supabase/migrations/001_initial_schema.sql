-- Users: lightweight guest identity
create table users (
  id uuid primary key default gen_random_uuid(),
  app_code text unique not null,
  nickname text,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_users_app_code on users(app_code);

-- Questions: educational mission questions
create table questions (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  answer_a text not null,
  answer_b text not null,
  answer_c text not null,
  answer_d text, -- nullable: supports 3 or 4 options
  correct_answer text not null check (correct_answer in ('a', 'b', 'c', 'd')),
  explanation text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Checkpoints: physical QR locations
create table checkpoints (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  qr_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  description text,
  entries_awarded int default 1,
  question_id uuid references questions(id),
  is_active boolean default true,
  sort_order int,
  created_at timestamptz default now()
);

-- Scans: unique user-checkpoint visit records
create table scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  checkpoint_id uuid not null references checkpoints(id),
  created_at timestamptz default now(),
  unique(user_id, checkpoint_id)
);

create index idx_scans_user on scans(user_id);

-- Question attempts: one attempt per user per checkpoint
create table question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  checkpoint_id uuid not null references checkpoints(id),
  question_id uuid not null references questions(id),
  selected_answer text not null,
  is_correct boolean not null,
  created_at timestamptz default now(),
  unique(user_id, checkpoint_id)
);

-- Donations: verified donations from Givebutter
create table donations (
  id uuid primary key default gen_random_uuid(),
  external_id text unique not null,
  user_id uuid references users(id), -- null when unmatched
  race_app_code text,
  donor_email text,
  amount_cents int not null,
  currency text default 'USD',
  status text default 'completed',
  raw_payload jsonb,
  created_at timestamptz default now()
);

create index idx_donations_app_code on donations(race_app_code);
create index idx_donations_user on donations(user_id);

-- Raffle entries ledger: source of truth for all reward changes
create table raffle_entries_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  source_type text not null,
  source_id text, -- references the scan/attempt/donation id
  delta int not null,
  note text,
  created_at timestamptz default now()
);

create index idx_ledger_user on raffle_entries_ledger(user_id);

-- Reward states: tracks multipliers, badges, etc.
create table reward_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  reward_type text not null,
  remaining_uses int, -- null for permanent rewards like badges
  is_active boolean default true,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_reward_states_active on reward_states(user_id, reward_type, is_active);

-- Handy view for quick raffle totals
create or replace view user_raffle_totals as
select user_id, coalesce(sum(delta), 0)::int as total_entries
from raffle_entries_ledger
group by user_id;

-- Seed some example questions
insert into questions (prompt, answer_a, answer_b, answer_c, answer_d, correct_answer, explanation) values
(
  'What does STEAM stand for?',
  'Science, Technology, Engineering, Arts, and Math',
  'Sports, Teamwork, Energy, Achievement, and Movement',
  'Science, Theater, Education, Athletics, and Music',
  'Study, Thinking, Exploration, Art, and Motivation',
  'a',
  'STEAM stands for Science, Technology, Engineering, Arts, and Math — a holistic approach to learning!'
),
(
  'Why are the Arts included in STEAM education?',
  'To make the acronym sound better',
  'Because creativity is essential to problem-solving',
  'Arts are not actually part of STEAM',
  'To replace physical education',
  'b',
  'The Arts are part of STEAM because creativity is essential to problem-solving and innovation.'
),
(
  'What kind of activities does a STEAM Wheel program support?',
  'Only computer programming',
  'Standardized test preparation',
  'Hands-on making, experimenting, and creative projects',
  'Competitive sports only',
  'c',
  'STEAM Wheel supports hands-on learning where students build confidence through making and experimenting.'
),
(
  'Why is funding important for STEAM programs in schools?',
  'It is not important at all',
  'Programs like STEAM Wheel help students explore ideas they may not otherwise encounter',
  'Only wealthy schools need STEAM',
  'Funding is only needed for sports',
  'b',
  'Programs like STEAM Wheel help students explore ideas they may not otherwise encounter — funding keeps these opportunities alive!'
),
(
  'How does STEAM education help students?',
  'It only teaches them to code',
  'It replaces all other subjects',
  'It builds confidence through making and experimenting',
  'It focuses only on math skills',
  'c',
  'Hands-on STEAM learning helps students build confidence through making, experimenting, and creative problem-solving.'
);

-- Seed example checkpoints linked to questions
insert into checkpoints (name, slug, description, question_id, sort_order)
select
  'Checkpoint ' || row_number() over (order by q.created_at),
  'checkpoint-' || row_number() over (order by q.created_at),
  'Scan this checkpoint to answer a STEAM question!',
  q.id,
  row_number() over (order by q.created_at)
from questions q
where q.is_active = true
limit 5;
