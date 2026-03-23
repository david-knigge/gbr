-- Points of interest: parking, registration, start/finish, aid stations, stands, etc.
create table pois (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'other',
  position_lat double precision not null,
  position_lng double precision not null,
  description text not null default '',
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- Seed with initial data
insert into pois (name, type, position_lat, position_lng, description) values
  ('Registration & Packet Pickup', 'registration', 38.0494, -122.1586, 'First Street Green — opens 7:00 AM'),
  ('Start / Finish Line', 'start', 38.04567, -122.1612, 'On First Street near the waterfront'),
  ('Street Parking — First Street', 'parking', 38.0488, -122.1570, 'Free street parking, arrive early'),
  ('City Parking Lot — East 2nd St', 'parking', 38.0478, -122.1575, '5 min walk to start line'),
  ('Aid Station 1', 'aid', 38.0510, -122.1550, 'Water and electrolytes'),
  ('Restrooms', 'restroom', 38.0492, -122.1600, 'Near registration area');
