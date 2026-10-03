-- ===========================================================================
-- LisBee — delivery areas within a city
--
-- A city can have more than one priced zone (Lagos Mainland / Island). The
-- customer picks one at checkout and the fee comes from that row.
--
-- Safe to run more than once.
-- ===========================================================================

alter table public.recipients
  add column if not exists delivery_area text;

-- Lagos split into mainland and island. Re-running does not touch fees: the
-- update list deliberately omits them, so a price you change later survives.
insert into public.delivery_zones (id, city, zone_name, fee, same_day, next_day, standard, active)
values
  ('zone-lagos-mainland', 'Lagos', 'Mainland', 3000, false, false, true, true),
  ('zone-lagos-island',   'Lagos', 'Island',   4000, false, false, true, true)
on conflict (id) do update
set city = excluded.city,
    zone_name = excluded.zone_name,
    standard = excluded.standard,
    active = excluded.active;

-- The old single "Lagos (city-wide)" row is no longer used, because a city
-- with one priced row must not also carry a second.
delete from public.delivery_zones where id = 'zone-lagos';

select city, zone_name, fee, active from public.delivery_zones order by city, zone_name;