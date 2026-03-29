-- Migration 013: Update clothing size options
-- Old: XS, S, M, L, XL, XXL
-- New: S, M, L, XL, 2XL, 3XL, 4XL

-- Drop old constraint and add new one
alter table public.riders
  drop constraint if exists riders_clothing_size_check;

alter table public.riders
  add constraint riders_clothing_size_check
  check (clothing_size in ('XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL'));

-- Update any existing 'XXL' entries to '2XL' (closest equivalent)
update public.riders set clothing_size = '2XL' where clothing_size = 'XXL';
