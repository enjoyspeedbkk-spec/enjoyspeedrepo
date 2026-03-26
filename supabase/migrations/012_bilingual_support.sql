-- ============================================================
-- EN-JOY SPEED — Bilingual Support (EN/TH)
-- Adds Thai name/label fields to configurable entities
-- and locale tracking to bookings for notification language
-- ============================================================

-- 1. Add Thai name to ride packages config
alter table public.ride_packages_config
  add column if not exists name_th text;

comment on column public.ride_packages_config.name_th is 'Thai display name (e.g. ทีมสนุก for "The Squad")';

-- Seed Thai names for existing packages
update public.ride_packages_config set name_th = 'ดูโอ' where type = 'duo';
update public.ride_packages_config set name_th = 'เดอะสควอด' where type = 'squad';
update public.ride_packages_config set name_th = 'เดอะเพลาตอน' where type = 'peloton';

-- 2. Add Thai label to time slots config
alter table public.time_slots_config
  add column if not exists label_th text;

comment on column public.time_slots_config.label_th is 'Thai display label (e.g. ปั่นรับอรุณ for "Early Bird")';

-- Seed Thai labels for existing time slots
update public.time_slots_config set label_th = 'ปั่นรับอรุณ' where slot_id = 'A1';
update public.time_slots_config set label_th = 'เครื่องเสริมพลังงาน' where slot_id = 'A2';
update public.time_slots_config set label_th = 'ไล่แสง' where slot_id = 'B';
update public.time_slots_config set label_th = 'โกลเด้นฮาวร์' where slot_id = 'C';
update public.time_slots_config set label_th = 'ทไวไลท์ฟินิช' where slot_id = 'D';

-- 3. Add locale to bookings (captures language at time of booking)
alter table public.bookings
  add column if not exists locale text not null default 'en'
  check (locale in ('en', 'th'));

comment on column public.bookings.locale is 'Language used at booking time — notifications sent in this language';
