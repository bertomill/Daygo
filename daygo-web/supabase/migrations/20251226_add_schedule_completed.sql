-- Add completed field to schedule_events
alter table schedule_events add column completed boolean default false not null;
