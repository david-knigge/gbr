-- ============================================
-- CLEAN SLATE — drops everything and recreates
-- only what the admin panel needs.
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
DROP TABLE IF EXISTS routes CASCADE;
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
-- ============================================
-- Routes (courses, parking streets, etc.)
-- ============================================
CREATE TABLE routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'course',       -- course | parking | other
  color text NOT NULL DEFAULT '#E8643B',
  weight int NOT NULL DEFAULT 6,
  opacity double precision NOT NULL DEFAULT 0.9,
  dash_array text,                           -- e.g. '6 8' for dashed
  label text,                                -- e.g. '8:00 AM' for start time
  points jsonb NOT NULL DEFAULT '[]'::jsonb, -- [[lat,lng], ...]
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);


CREATE TABLE pois (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'other',
  category text NOT NULL DEFAULT 'race',
  position_lat double precision NOT NULL,
  position_lng double precision NOT NULL,
  location text NOT NULL DEFAULT '',
  gmaps_url text,
  hours text,
  description text,
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);


-- ============================================
-- Seed: 10 STEAM questions (Benicia history)
-- ============================================
INSERT INTO questions (id, prompt, answer_a, answer_b, answer_c, answer_d, correct_answer, explanation) VALUES
(
  gen_random_uuid(),
  'What major bridge completed in 1962 connected Benicia to Solano County across the Carquinez Strait?',
  'Golden Gate Bridge',
  'Carquinez Bridge',
  'Benicia–Martinez Bridge',
  'Richmond–San Rafael Bridge',
  'c',
  'The Benicia–Martinez Bridge, completed in 1962, spans the Carquinez Strait connecting Benicia in Solano County to Martinez in Contra Costa County.'
),
(
  gen_random_uuid(),
  'Benicia was home to a major U.S. Army weapons manufacturing and storage facility beginning in 1849. What was it called?',
  'Presidio Arsenal',
  'Benicia Arsenal',
  'Pacific Armory',
  'California Military Depot',
  'b',
  'The Benicia Arsenal was established in 1849 and served as a key military facility for over a century before closing in 1964.'
),
(
  gen_random_uuid(),
  'Early surveyors mapped land around Benicia using what standardized system still used in the U.S. today?',
  'Metric grid system',
  'Township and Range system',
  'Roman cadastral system',
  'Spanish league system',
  'b',
  'The Township and Range system (also called the Public Land Survey System) was used to survey and divide land in Benicia and across the western United States.'
),
(
  gen_random_uuid(),
  'The former arsenal buildings were later converted into one of Northern California''s largest artist studio communities. What is it called today?',
  'Benicia Art District',
  'Arsenal Artist Lofts',
  'Benicia Arsenal Artist Studios',
  'Solano Creative Center',
  'c',
  'The Benicia Arsenal Artist Studios occupy historic military buildings and house over 40 artists working in various media.'
),
(
  gen_random_uuid(),
  'Before bridges carried trains across the strait, how were railroad cars transported across the water near Benicia in the late 1800s?',
  'Suspension tram',
  'Rail ferry system',
  'Underwater tunnel',
  'Floating pontoon bridge',
  'b',
  'The Solano, one of the world''s largest rail ferries, carried entire trains across the Carquinez Strait between Benicia and Port Costa starting in 1879.'
),
(
  gen_random_uuid(),
  'The famous 19th-century shipbuilder who constructed hundreds of sailing vessels in Benicia had a shipyard along the waterfront. Who was he?',
  'Donald McKay',
  'Matthew Turner',
  'William Webb',
  'Joshua Humphreys',
  'b',
  'Matthew Turner built over 225 vessels in Benicia between 1883 and 1903, making him one of the most prolific shipbuilders on the Pacific Coast.'
),
(
  gen_random_uuid(),
  'Which famous American landscape painter known for dramatic Western scenes lived and worked in Benicia in the 1800s?',
  'Thomas Hill',
  'Frederic Remington',
  'Albert Bierstadt',
  'Charles Christian Nahl',
  'a',
  'Thomas Hill, renowned for his Yosemite paintings, lived and maintained a studio in Benicia during the late 1800s.'
),
(
  gen_random_uuid(),
  'The historic rail ferry in Benicia carried trains across the strait to which nearby city?',
  'Vallejo',
  'Martinez',
  'Richmond',
  'Antioch',
  'b',
  'The rail ferry ran between Benicia and Port Costa/Martinez, carrying Southern Pacific trains across the Carquinez Strait.'
),
(
  gen_random_uuid(),
  'The historic state capitol building in Benicia (used briefly in the 1850s) is primarily built in which architectural style?',
  'Victorian Gothic',
  'Greek Revival',
  'Spanish Colonial',
  'Art Deco',
  'b',
  'The Benicia Capitol, California''s third state capitol (1853–1854), is a beautiful example of Greek Revival architecture and is now a State Historic Park.'
),
(
  gen_random_uuid(),
  'Benicia''s shoreline wetlands are part of the Pacific Flyway, a major migration route for which animals?',
  'Atlantic salmon',
  'Monarch butterflies',
  'Birds (such as northern pintail ducks)',
  'Sea lions',
  'c',
  'The Pacific Flyway is one of four major bird migration routes in North America. Benicia''s wetlands provide critical habitat for migratory waterfowl.'
);


-- ============================================
-- Seed: 10 checkpoints along First Street
-- linked to the 10 questions in order
-- ============================================
INSERT INTO checkpoints (name, slug, description, question_id, sort_order, position_lat, position_lng)
SELECT
  name, slug, description, question_id, sort_order, position_lat, position_lng
FROM (
  SELECT
    q.id AS question_id,
    row_number() OVER (ORDER BY q.created_at) - 1 AS sort_order,
    CASE row_number() OVER (ORDER BY q.created_at)
      WHEN 1  THEN 'Sailor Jack''s'
      WHEN 2  THEN 'Bella Siena'
      WHEN 3  THEN 'Char''s Hot Dogs'
      WHEN 4  THEN 'Fox & Fawn Bakehouse'
      WHEN 5  THEN 'Happy Life Pottery'
      WHEN 6  THEN 'Sandoval''s'
      WHEN 7  THEN 'Elviarita''s'
      WHEN 8  THEN 'Majestic Cafe'
      WHEN 9  THEN 'One House Bakery'
      WHEN 10 THEN 'The Collective'
    END AS name,
    CASE row_number() OVER (ORDER BY q.created_at)
      WHEN 1  THEN 'sailor-jacks'
      WHEN 2  THEN 'bella-siena'
      WHEN 3  THEN 'chars-hot-dogs'
      WHEN 4  THEN 'fox-fawn-bakehouse'
      WHEN 5  THEN 'happy-life-pottery'
      WHEN 6  THEN 'sandovals'
      WHEN 7  THEN 'elviaritas'
      WHEN 8  THEN 'majestic-cafe'
      WHEN 9  THEN 'one-house-bakery'
      WHEN 10 THEN 'the-collective'
    END AS slug,
    'Scan this QR code to answer a STEAM question!' AS description,
    CASE row_number() OVER (ORDER BY q.created_at)
      WHEN 1  THEN 38.04567
      WHEN 2  THEN 38.04588
      WHEN 3  THEN 38.04611
      WHEN 4  THEN 38.04670
      WHEN 5  THEN 38.04938
      WHEN 6  THEN 38.04927
      WHEN 7  THEN 38.05009
      WHEN 8  THEN 38.04977
      WHEN 9  THEN 38.05154
      WHEN 10 THEN 38.05212
    END AS position_lat,
    CASE row_number() OVER (ORDER BY q.created_at)
      WHEN 1  THEN -122.16180
      WHEN 2  THEN -122.16169
      WHEN 3  THEN -122.16154
      WHEN 4  THEN -122.16103
      WHEN 5  THEN -122.15865
      WHEN 6  THEN -122.15881
      WHEN 7  THEN -122.15848
      WHEN 8  THEN -122.15831
      WHEN 9  THEN -122.15709
      WHEN 10 THEN -122.15707
    END AS position_lng
  FROM questions q
  WHERE q.is_active = true
  ORDER BY q.created_at
  LIMIT 10
) sub;


-- ============================================
-- Seed: POIs — Race
-- ============================================
INSERT INTO pois (name, type, category, position_lat, position_lng, location, hours, description, sort_order) VALUES
('Registration & Packet Pickup', 'registration', 'race', 38.04505, -122.16113, 'first street green', 'opens 7:00 AM', NULL, 1),
('Start / Finish Line',          'start',        'race', 38.04505, -122.16113, 'first street at the waterfront', NULL, NULL, 2),
('Aid Station 1',                'aid',           'race', 38.05100, -122.15500, '~1.5 mi mark', NULL, 'water & electrolytes', 3),
('Aid Station 2',                'aid',           'race', 38.05300, -122.15100, '~3.1 mi (10k turnaround)', NULL, 'water & electrolytes', 4),
('Restrooms — First Street',     'restroom',      'both', 38.04505, -122.16113, 'first street green', NULL, 'portable restrooms near registration', 5);


-- ============================================
-- Seed: POIs — Parking (shared)
-- ============================================
INSERT INTO pois (name, type, category, position_lat, position_lng, location, hours, description, sort_order) VALUES
('P1 — Public Lot (Yacht Club)',    'parking', 'both', 38.04645, -122.15778, 'near Yacht Club, E 2nd St',        NULL, 'free parking', 10),
('P2 — City Hall Lot',              'parking', 'both', 38.05238, -122.15320, 'City Hall, W N St',                NULL, 'free parking', 11),
('P3 — Liberty High School Lot',    'parking', 'both', 38.05020, -122.15163, 'Liberty High School, E K St',      NULL, 'free parking', 12),
('V — Vendor / Volunteer Lot',      'parking', 'race', 38.04480, -122.16200, 'near 1st & E 2nd St',              'closes 7 AM, reopens 12 PM', 'vendor & volunteer parking only', 13),
('4+ADA — ADA & Public Lot',        'parking', 'both', 38.04430, -122.15900, 'south waterfront, E 2nd St',       NULL, 'ADA accessible + public parking', 14);


-- ============================================
-- Seed: POIs — Restaurants (visitor)
-- ============================================
INSERT INTO pois (name, type, category, position_lat, position_lng, location, hours, description, sort_order) VALUES
('Sailor Jack''s',             'restaurant', 'visitor', 38.04567, -122.16180, '123 first street',  NULL, 'waterfront dining, seafood & American', 20),
('Bella Siena',                'restaurant', 'visitor', 38.04588, -122.16169, '127 first street',  NULL, 'Italian fine dining', 21),
('The Union Hotel',            'restaurant', 'visitor', 38.04751, -122.16036, '401 first street',  NULL, 'historic hotel restaurant', 22),
('Lucca Bar & Grill',          'restaurant', 'visitor', 38.04811, -122.16002, '439 first street',  NULL, 'Italian-American, full bar', 23),
('Mare Island Brewing Taphouse', 'restaurant', 'visitor', 38.04797, -122.15969, '440 first street', NULL, 'craft beer & pub food', 24),
('Kaigan Sushi',               'restaurant', 'visitor', 38.04859, -122.15932, '560 first street',  NULL, 'Japanese, sushi bar', 25),
('Mai Thai Cuisine',           'restaurant', 'visitor', 38.05092, -122.15798, '807 first street',  NULL, 'Thai cuisine', 26),
('Elviarita''s',               'restaurant', 'visitor', 38.05009, -122.15848, '727 first street',  NULL, 'Mexican cantina & catering', 27),
('Pacifica Pizza',             'restaurant', 'visitor', 38.05165, -122.15736, '915 first street',  NULL, 'pizza & Italian', 28);


-- ============================================
-- Seed: POIs — Cafes & Bakeries (visitor)
-- ============================================
INSERT INTO pois (name, type, category, position_lat, position_lng, location, hours, description, sort_order) VALUES
('Majestic Cafe',         'cafe',   'visitor', 38.04977, -122.15831, '700 first street',  NULL, 'specialty coffee & cafe', 30),
('Rainbow Ice Cream',     'cafe',   'visitor', 38.04993, -122.15859, '701 first street',  NULL, 'ice cream & frozen treats', 33),
('Fox & Fawn Bakehouse',  'bakery', 'visitor', 38.04670, -122.16103, '305 first street',  NULL, 'vegan bakery & pastries', 31),
('One House Bakery',      'bakery', 'visitor', 38.05154, -122.15709, '918 first street',  NULL, 'artisan bakery & coffee', 32);


-- ============================================
-- Seed: POIs — Bars & Wine (visitor)
-- ============================================
INSERT INTO pois (name, type, category, position_lat, position_lng, location, hours, description, sort_order) VALUES
('The Rellik Tavern',    'bar', 'visitor', 38.05026, -122.15798, '726 first street',  NULL, 'craft cocktails & whiskey', 40),
('The Chill Wine Bar',   'bar', 'visitor', 38.04668, -122.16072, '362 first street',  NULL, 'wine bar, relaxed vibe', 41),
('Rookies Sports Bar',   'bar', 'visitor', 38.04655, -122.16105, '321 first street',  NULL, 'sports bar & grill', 42),
('Cullen''s Tannery Pub', 'bar', 'visitor', 38.04611, -122.16154, '131 first street', NULL, 'pub in the historic Tannery building', 43);


-- ============================================
-- Seed: POIs — Retail & Shops (visitor)
-- ============================================
INSERT INTO pois (name, type, category, position_lat, position_lng, location, hours, description, sort_order) VALUES
('Bookshop Benicia',       'retail', 'visitor', 38.04948, -122.15857, '636 first street',  NULL, 'independent bookstore', 50),
('Pink Arrows Boutique',   'retail', 'visitor', 38.04671, -122.16070, '372 first street',  NULL, 'women''s clothing & accessories', 51),
('Sparkly Ragz',           'retail', 'visitor', 38.04926, -122.15882, '638 first street',  NULL, 'consignment & vintage', 52),
('Collektive Boutique',    'retail', 'visitor', 38.05212, -122.15707, '935 first street',  NULL, 'curated clothing & gifts', 53);


-- ============================================
-- Seed: POIs — Galleries & Art (visitor)
-- ============================================
INSERT INTO pois (name, type, category, position_lat, position_lng, location, hours, description, sort_order) VALUES
('The Little Art Shop',       'gallery', 'visitor', 38.04604, -122.16172, '129 first street (Tannery building)', NULL, 'local art & prints', 60),
('Benicia Plein Air Gallery', 'gallery', 'visitor', 38.04678, -122.16097, '307 first street',                    NULL, 'plein air paintings of Benicia & beyond', 61),
('Happy Life Pottery',        'gallery', 'visitor', 38.04938, -122.15865, '632 first street',                    NULL, 'pottery studio & gallery', 62),
('Arts Benicia',              'gallery', 'visitor', 38.04765, -122.13937, '1 Commandants Lane (Arsenal)',        NULL, 'community art gallery in historic Arsenal', 63);


-- ============================================
-- Seed: POIs — Historic sites (visitor)
-- ============================================
INSERT INTO pois (name, type, category, position_lat, position_lng, location, hours, description, sort_order) VALUES
('Benicia Capitol State Historic Park', 'historic', 'visitor', 38.05026, -122.15902, '115 west G street',        '10:00 AM – 5:00 PM', 'California''s 3rd state capitol (1853–1854), Greek Revival', 70),
('Fischer-Hanlon House',                'historic', 'visitor', 38.05010, -122.15900, '135 west G street',        NULL, '1858 Gold Rush-era home, part of Capitol SHP', 71),
('Benicia Arsenal / Clock Tower',       'historic', 'visitor', 38.04611, -122.13472, 'arsenal drive',            NULL, '1859 sandstone fortress, oldest U.S. military storehouse in CA', 72),
('St. Paul''s Episcopal Church',        'historic', 'visitor', 38.05179, -122.15663, '120 east J street',        NULL, '1859, one of the oldest churches in California', 73),
('The Tannery Building',                'historic', 'visitor', 38.04611, -122.16154, '131 first street',         NULL, 'historic industrial building, now shops & restaurants', 74);


-- ============================================
-- Seed: POIs — Parks & Green spaces (visitor)
-- ============================================
INSERT INTO pois (name, type, category, position_lat, position_lng, location, hours, description, sort_order) VALUES
('First Street Green',              'park', 'both',    38.04505, -122.16113, 'first street at B street',     NULL, 'waterfront park, event lawn & benches', 80),
('City Park',                       'park', 'visitor', 38.05944, -122.17420, 'west 9th street',              NULL, 'playground, BBQs, strait views, fishing pier', 81),
('Matthew Turner Shipyard Park',    'park', 'visitor', 38.06251, -122.17906, 'west of downtown, waterfront', NULL, 'ship-themed playground, waterfront walking', 82),
('Benicia State Recreation Area',   'park', 'visitor', 38.07361, -122.19306, 'west end, off I-780',          NULL, '720 acres — hiking, biking, birdwatching, shoreline', 83);


-- ============================================
-- Seed: POIs — Waterfront & Marina (visitor)
-- ============================================
INSERT INTO pois (name, type, category, position_lat, position_lng, location, hours, description, sort_order) VALUES
('Benicia Marina',           'marina', 'visitor', 38.04580, -122.15631, '266 east B street',         NULL, 'boat slips, waterfront promenade', 90),
('Benicia Point Pier',       'marina', 'visitor', 38.04424, -122.16490, 'end of first street',       NULL, 'fishing pier, beach access, strait views', 91),
('Waterfront Promenade',     'marina', 'visitor', 38.04500, -122.15870, 'waterfront between 1st & marina', NULL, 'paved walking & cycling path', 92);


-- ============================================
-- Seed: POIs — Viewpoints (visitor)
-- ============================================
INSERT INTO pois (name, type, category, position_lat, position_lng, location, hours, description, sort_order) VALUES
('Point Pier Viewpoint',     'viewpoint', 'visitor', 38.04424, -122.16490, 'end of first street',      NULL, 'panoramic views of Carquinez Strait & bridge', 95),
('9th Street Pier Viewpoint', 'viewpoint', 'visitor', 38.05944, -122.17420, 'west 9th street pier',    NULL, 'unobstructed strait and hillside views', 96);
