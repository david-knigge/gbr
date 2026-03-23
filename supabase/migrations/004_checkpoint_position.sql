-- Add optional position fields to checkpoints for map placement
alter table checkpoints add column position_lat double precision;
alter table checkpoints add column position_lng double precision;
