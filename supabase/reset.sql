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
      WHEN 1  THEN 'The Tannery Building'
      WHEN 2  THEN 'Sailor Jack''s'
      WHEN 3  THEN 'Fox & Fawn Bakehouse'
      WHEN 4  THEN 'Lucca Bar & Grill'
      WHEN 5  THEN 'Bookshop Benicia'
      WHEN 6  THEN 'Majestic Cafe'
      WHEN 7  THEN 'The Rellik Tavern'
      WHEN 8  THEN 'One House Bakery'
      WHEN 9  THEN 'Benicia Capitol'
      WHEN 10 THEN 'Benicia Point Pier'
    END AS name,
    CASE row_number() OVER (ORDER BY q.created_at)
      WHEN 1  THEN 'tannery-building'
      WHEN 2  THEN 'sailor-jacks'
      WHEN 3  THEN 'fox-fawn-bakehouse'
      WHEN 4  THEN 'lucca-bar'
      WHEN 5  THEN 'bookshop-benicia'
      WHEN 6  THEN 'majestic-cafe'
      WHEN 7  THEN 'rellik-tavern'
      WHEN 8  THEN 'one-house-bakery'
      WHEN 9  THEN 'benicia-capitol'
      WHEN 10 THEN 'benicia-point-pier'
    END AS slug,
    'Scan this QR code to answer a STEAM question!' AS description,
    CASE row_number() OVER (ORDER BY q.created_at)
      WHEN 1  THEN 38.0483
      WHEN 2  THEN 38.0482
      WHEN 3  THEN 38.0487
      WHEN 4  THEN 38.0490
      WHEN 5  THEN 38.0495
      WHEN 6  THEN 38.0496
      WHEN 7  THEN 38.0496
      WHEN 8  THEN 38.0499
      WHEN 9  THEN 38.0497
      WHEN 10 THEN 38.0478
    END AS position_lat,
    CASE row_number() OVER (ORDER BY q.created_at)
      WHEN 1  THEN -122.1587
      WHEN 2  THEN -122.1588
      WHEN 3  THEN -122.1584
      WHEN 4  THEN -122.1575
      WHEN 5  THEN -122.1558
      WHEN 6  THEN -122.1553
      WHEN 7  THEN -122.1550
      WHEN 8  THEN -122.1532
      WHEN 9  THEN -122.1560
      WHEN 10 THEN -122.1592
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
('Registration & Packet Pickup', 'registration', 'race', 38.0485, -122.1590, 'first street green', 'opens 7:00 AM', NULL, 1),
('Start / Finish Line',          'start',        'race', 38.0482, -122.1588, 'first street at the waterfront', NULL, NULL, 2),
('Aid Station 1',                'aid',           'race', 38.0510, -122.1550, '~1.5 mi mark', NULL, 'water & electrolytes', 3),
('Aid Station 2',                'aid',           'race', 38.0530, -122.1510, '~3.1 mi (10k turnaround)', NULL, 'water & electrolytes', 4),
('Restrooms — First Street',     'restroom',      'both', 38.0486, -122.1589, 'first street green', NULL, 'portable restrooms near registration', 5);


-- ============================================
-- Seed: POIs — Parking (shared)
-- ============================================
INSERT INTO pois (name, type, category, position_lat, position_lng, location, hours, description, sort_order) VALUES
('Street Parking',     'parking', 'both', 38.0490, -122.1575, 'first street', NULL, 'free, arrive early', 10),
('City Parking Lot',   'parking', 'both', 38.0478, -122.1575, 'east 2nd street', NULL, '5 min walk to start', 11),
('Parking — E Street', 'parking', 'both', 38.0495, -122.1565, 'east E street', NULL, 'additional overflow parking', 12);


-- ============================================
-- Seed: POIs — Restaurants (visitor)
-- ============================================
INSERT INTO pois (name, type, category, position_lat, position_lng, location, hours, description, sort_order) VALUES
('Sailor Jack''s',             'restaurant', 'visitor', 38.0482, -122.1588, '123 first street',  NULL, 'waterfront dining, seafood & American', 20),
('Bella Siena',                'restaurant', 'visitor', 38.0483, -122.1587, '127 first street',  NULL, 'Italian fine dining', 21),
('The Union Hotel',            'restaurant', 'visitor', 38.0489, -122.1578, '401 first street',  NULL, 'historic hotel restaurant', 22),
('Lucca Bar & Grill',          'restaurant', 'visitor', 38.0490, -122.1575, '439 first street',  NULL, 'Italian-American, full bar', 23),
('Mare Island Brewing Taphouse', 'restaurant', 'visitor', 38.0490, -122.1574, '440 first street', NULL, 'craft beer & pub food', 24),
('Kaigan Sushi',               'restaurant', 'visitor', 38.0493, -122.1566, '560 first street',  NULL, 'Japanese, sushi bar', 25),
('Mai Thai Cuisine',           'restaurant', 'visitor', 38.0497, -122.1543, '807 first street',  NULL, 'Thai cuisine', 26),
('Pacifica Pizza',             'restaurant', 'visitor', 38.0499, -122.1533, '915 first street',  NULL, 'pizza & Italian', 27);


-- ============================================
-- Seed: POIs — Cafes & Bakeries (visitor)
-- ============================================
INSERT INTO pois (name, type, category, position_lat, position_lng, location, hours, description, sort_order) VALUES
('Majestic Cafe',         'cafe',   'visitor', 38.0496, -122.1553, '700 first street',  NULL, 'specialty coffee & cafe', 30),
('Rainbow Ice Cream',     'cafe',   'visitor', 38.0495, -122.1555, '701 first street',  NULL, 'ice cream & frozen treats', 33),
('Fox & Fawn Bakehouse',  'bakery', 'visitor', 38.0487, -122.1584, '305 first street',  NULL, 'vegan bakery & pastries', 31),
('One House Bakery',      'bakery', 'visitor', 38.0499, -122.1532, '918 first street',  NULL, 'artisan bakery & coffee', 32);


-- ============================================
-- Seed: POIs — Bars & Wine (visitor)
-- ============================================
INSERT INTO pois (name, type, category, position_lat, position_lng, location, hours, description, sort_order) VALUES
('The Rellik Tavern',    'bar', 'visitor', 38.0496, -122.1550, '726 first street',  NULL, 'craft cocktails & whiskey', 40),
('The Chill Wine Bar',   'bar', 'visitor', 38.0488, -122.1581, '362 first street',  NULL, 'wine bar, relaxed vibe', 41),
('Rookies Sports Bar',   'bar', 'visitor', 38.0487, -122.1583, '321 first street',  NULL, 'sports bar & grill', 42),
('Cullen''s Tannery Pub', 'bar', 'visitor', 38.0483, -122.1587, '131 first street', NULL, 'pub in the historic Tannery building', 43);


-- ============================================
-- Seed: POIs — Retail & Shops (visitor)
-- ============================================
INSERT INTO pois (name, type, category, position_lat, position_lng, location, hours, description, sort_order) VALUES
('Bookshop Benicia',       'retail', 'visitor', 38.0495, -122.1558, '636 first street',  NULL, 'independent bookstore', 50),
('Pink Arrows Boutique',   'retail', 'visitor', 38.0488, -122.1580, '372 first street',  NULL, 'women''s clothing & accessories', 51),
('Sparkly Ragz',           'retail', 'visitor', 38.0495, -122.1557, '638 first street',  NULL, 'consignment & vintage', 52),
('Collektive Boutique',    'retail', 'visitor', 38.0500, -122.1530, '935 first street',  NULL, 'curated clothing & gifts', 53);


-- ============================================
-- Seed: POIs — Galleries & Art (visitor)
-- ============================================
INSERT INTO pois (name, type, category, position_lat, position_lng, location, hours, description, sort_order) VALUES
('The Little Art Shop',       'gallery', 'visitor', 38.0483, -122.1587, '129 first street (Tannery building)', NULL, 'local art & prints', 60),
('Benicia Plein Air Gallery', 'gallery', 'visitor', 38.0487, -122.1584, '307 first street',                    NULL, 'plein air paintings of Benicia & beyond', 61),
('Happy Life Pottery',        'gallery', 'visitor', 38.0495, -122.1558, '632 first street',                    NULL, 'pottery studio & gallery', 62),
('Arts Benicia',              'gallery', 'visitor', 38.0522, -122.1467, '1 Commandants Lane (Arsenal)',        NULL, 'community art gallery in historic Arsenal', 63);


-- ============================================
-- Seed: POIs — Historic sites (visitor)
-- ============================================
INSERT INTO pois (name, type, category, position_lat, position_lng, location, hours, description, sort_order) VALUES
('Benicia Capitol State Historic Park', 'historic', 'visitor', 38.0497, -122.1560, '115 west G street',        '10:00 AM – 5:00 PM', 'California''s 3rd state capitol (1853–1854), Greek Revival', 70),
('Fischer-Hanlon House',                'historic', 'visitor', 38.0498, -122.1562, '135 west G street',        NULL, '1858 Gold Rush-era home, part of Capitol SHP', 71),
('Benicia Arsenal / Clock Tower',       'historic', 'visitor', 38.0520, -122.1470, 'arsenal drive',            NULL, '1859 sandstone fortress, oldest U.S. military storehouse in CA', 72),
('St. Paul''s Episcopal Church',        'historic', 'visitor', 38.0500, -122.1525, '120 east J street',        NULL, '1859, one of the oldest churches in California', 73),
('The Tannery Building',                'historic', 'visitor', 38.0483, -122.1587, '131 first street',         NULL, 'historic industrial building, now shops & restaurants', 74);


-- ============================================
-- Seed: POIs — Parks & Green spaces (visitor)
-- ============================================
INSERT INTO pois (name, type, category, position_lat, position_lng, location, hours, description, sort_order) VALUES
('First Street Green',              'park', 'both',    38.0485, -122.1590, 'first street at B street',     NULL, 'waterfront park, event lawn & benches', 80),
('City Park',                       'park', 'visitor', 38.0455, -122.1650, 'west 9th street',              NULL, 'playground, BBQs, strait views, fishing pier', 81),
('Matthew Turner Shipyard Park',    'park', 'visitor', 38.0460, -122.1640, 'west of downtown, waterfront', NULL, 'ship-themed playground, waterfront walking', 82),
('Benicia State Recreation Area',   'park', 'visitor', 38.0440, -122.1790, 'west end, off I-780',          NULL, '720 acres — hiking, biking, birdwatching, shoreline', 83);


-- ============================================
-- Seed: POIs — Waterfront & Marina (visitor)
-- ============================================
INSERT INTO pois (name, type, category, position_lat, position_lng, location, hours, description, sort_order) VALUES
('Benicia Marina',           'marina', 'visitor', 38.0479, -122.1560, '266 east B street',         NULL, 'boat slips, waterfront promenade', 90),
('Benicia Point Pier',       'marina', 'visitor', 38.0478, -122.1592, 'end of first street',       NULL, 'fishing pier, beach access, strait views', 91),
('Waterfront Promenade',     'marina', 'visitor', 38.0480, -122.1575, 'waterfront between 1st & marina', NULL, 'paved walking & cycling path', 92);


-- ============================================
-- Seed: POIs — Viewpoints (visitor)
-- ============================================
INSERT INTO pois (name, type, category, position_lat, position_lng, location, hours, description, sort_order) VALUES
('Point Pier Viewpoint',     'viewpoint', 'visitor', 38.0478, -122.1592, 'end of first street',      NULL, 'panoramic views of Carquinez Strait & bridge', 95),
('9th Street Pier Viewpoint', 'viewpoint', 'visitor', 38.0455, -122.1655, 'west 9th street pier',    NULL, 'unobstructed strait and hillside views', 96);
