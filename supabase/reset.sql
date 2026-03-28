-- ============================================
-- CLEAN SLATE — drops everything and recreates
-- only what the admin panel needs.
-- No more: users, scans, question_attempts,
-- donations, ledger, reward_states, views, RPCs.
-- ============================================

-- Drop old views and functions first
DROP VIEW IF EXISTS user_raffle_totals CASCADE;
DROP FUNCTION IF EXISTS get_user_state(uuid) CASCADE;

-- Drop old tables (order matters for foreign keys)
DROP TABLE IF EXISTS reward_states CASCADE;
DROP TABLE IF EXISTS raffle_entries_ledger CASCADE;
DROP TABLE IF EXISTS question_attempts CASCADE;
DROP TABLE IF EXISTS scans CASCADE;
DROP TABLE IF EXISTS donations CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS checkpoints CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS pois CASCADE;

-- ============================================
-- Questions
-- ============================================
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt text NOT NULL,
  answer_a text NOT NULL,
  answer_b text NOT NULL,
  answer_c text NOT NULL,
  answer_d text,
  correct_answer text NOT NULL CHECK (correct_answer IN ('a', 'b', 'c', 'd')),
  explanation text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- Checkpoints (QR locations for STEAM quest)
-- ============================================
CREATE TABLE checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  qr_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  description text,
  question_id uuid REFERENCES questions(id),
  is_active boolean DEFAULT true,
  sort_order int,
  position_lat double precision,
  position_lng double precision,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- POIs (map points of interest)
-- ============================================
CREATE TABLE pois (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'other',
  category text NOT NULL DEFAULT 'race',
  position_lat double precision NOT NULL,
  position_lng double precision NOT NULL,
  location text NOT NULL DEFAULT '',
  hours text,
  description text,
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- Seed: 5 STEAM questions
-- ============================================
INSERT INTO questions (prompt, answer_a, answer_b, answer_c, answer_d, correct_answer, explanation) VALUES
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

-- ============================================
-- Seed: 5 checkpoints linked to questions
-- ============================================
INSERT INTO checkpoints (name, slug, description, question_id, sort_order)
SELECT
  'Checkpoint ' || row_number() OVER (ORDER BY q.created_at),
  'checkpoint-' || row_number() OVER (ORDER BY q.created_at),
  'Scan this QR code to answer a STEAM question!',
  q.id,
  row_number() OVER (ORDER BY q.created_at) - 1
FROM questions q
WHERE q.is_active = true
LIMIT 5;
