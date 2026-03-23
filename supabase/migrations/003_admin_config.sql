-- ============================================================
-- EN-JOY SPEED — Admin-Configurable Business Data
-- Everything Pailin & Udorn need to change without code
-- ============================================================

-- ========================================
-- 1. SITE CONFIG (key-value pairs for general settings)
-- ========================================
create table public.site_config (
  key text primary key,
  value jsonb not null,
  label text not null,             -- Human-readable label for admin UI
  category text not null default 'general',
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

-- Seed initial config
insert into public.site_config (key, value, label, category, description) values
  ('business_name', '"En-Joy Speed"', 'Business Name', 'general', 'Displayed in header and emails'),
  ('business_tagline', '"Let us handle the speed. You enjoy the ride."', 'Tagline', 'general', 'Main hero tagline'),
  ('contact_email', '"enjoyspeed.bkk@gmail.com"', 'Contact Email', 'contact', 'Public contact email'),
  ('contact_phone', '"0955709465"', 'Contact Phone', 'contact', 'Public phone number'),
  ('line_oa', '"@EnjoySpeed"', 'LINE OA Handle', 'contact', 'LINE Official Account ID'),
  ('promptpay_phone', '"0955709465"', 'PromptPay Phone', 'payment', 'Phone number for PromptPay QR'),
  ('promptpay_name', '"Pailin"', 'PromptPay Display Name', 'payment', 'Name shown on payment screen'),
  ('payment_timeout_minutes', '30', 'Payment Timeout (min)', 'payment', 'Minutes before unpaid booking expires'),
  ('min_booking_advance_hours', '24', 'Min Booking Advance (hrs)', 'booking', 'Minimum hours before ride to book'),
  ('max_booking_days_ahead', '14', 'Max Days Ahead', 'booking', 'How many days ahead customers can book'),
  ('rain_refund_48h', '"full"', 'Rain Policy >48hrs', 'policy', 'Refund policy for cancellation >48 hours before ride'),
  ('rain_refund_24_48h', '"50% fee"', 'Rain Policy 24-48hrs', 'policy', 'Refund policy for 24-48 hours before ride'),
  ('rain_refund_under_24h', '"100% fee"', 'Rain Policy <24hrs', 'policy', 'Refund policy for <24 hours before ride'),
  ('rain_credit_days', '90', 'Rain Credit Validity (days)', 'policy', 'Days rain credit is valid'),
  ('route_distance', '"23.5 km"', 'Route Distance', 'route', 'Total route distance'),
  ('route_location', '"Skylane (Happy and Healthy Bike Lane), Suvarnabhumi"', 'Route Location', 'route', 'Route location description'),
  ('route_bathroom_stops', '["km 5", "km 11", "km 16"]', 'Bathroom Stops', 'route', 'Bathroom stop locations');

-- ========================================
-- 2. EDITABLE RIDE PACKAGES
-- ========================================
create table public.ride_packages_config (
  id uuid primary key default gen_random_uuid(),
  type text unique not null,        -- e.g. 'duo', 'squad', 'peloton'
  name text not null,
  min_riders smallint not null,
  max_riders smallint not null,
  price_per_person integer not null,
  leaders_count smallint not null default 1,
  heroes_count smallint not null default 0,
  description text,
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  color text,                        -- Accent color for the card
  icon text,                         -- Icon name (e.g. 'star', 'zap', 'crown')
  is_popular boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed current packages
insert into public.ride_packages_config (type, name, min_riders, max_riders, price_per_person, leaders_count, heroes_count, description, sort_order, icon, is_popular) values
  ('duo', 'Duo', 2, 2, 2500, 1, 0, 'Perfect for couples or friends. Intimate ride with your personal leader.', 1, 'star', false),
  ('squad', 'The Squad', 3, 5, 2100, 1, 1, 'The most popular choice. Ride with friends and a dedicated support hero.', 2, 'zap', true),
  ('peloton', 'The Peloton', 6, 8, 2000, 2, 2, 'The best value. Larger group energy with full leader and hero support.', 3, 'crown', false);

-- ========================================
-- 3. EDITABLE TIME SLOTS
-- ========================================
create table public.time_slots_config (
  id text primary key,              -- 'A1', 'A2', 'B', 'C', 'D'
  label text not null,
  start_time time not null,
  end_time time not null,
  period text not null check (period in ('morning', 'evening')),
  "overlaps" text[] default '{}',     -- Array of conflicting slot IDs
  description text,
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  is_staff_pick boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed current slots
insert into public.time_slots_config (id, label, start_time, end_time, period, "overlaps", description, sort_order, is_staff_pick) values
  ('A1', 'Early Bird', '06:15', '08:15', 'morning', '{"A2"}', 'ปั่นรับอรุณ สูดอากาศบริสุทธิ์ — Morning Social', 1, false),
  ('A2', 'Energy Booster', '06:30', '08:30', 'morning', '{"A1"}', 'เติมพลังยามเช้า เตรียมพร้อมสำหรับวันใหม่', 2, false),
  ('B', 'Light Chaser', '16:15', '18:15', 'evening', '{"C","D"}', 'ปั่นไล่แสงแดดอ่อนๆ ก่อนอาทิตย์อัสดง', 3, false),
  ('C', 'Golden Hour', '16:45', '18:45', 'evening', '{"B","D"}', 'แสงสีทองสวยที่สุด ถ่ายรูปปัง', 4, true),
  ('D', 'Twilight Finish', '17:15', '19:15', 'evening', '{"B","C"}', 'ปั่นชิลล์รับลมเย็น จบด้วยบรรยากาศทไวไลท์', 5, false);

-- ========================================
-- 4. BIKE RENTAL CONFIG
-- ========================================
create table public.bike_rentals_config (
  type text primary key,            -- 'hybrid', 'road', 'own'
  label text not null,
  price integer not null default 0,
  description text,
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.bike_rentals_config (type, label, price, description, sort_order) values
  ('hybrid', 'Hybrid Bike', 420, 'Comfortable, beginner-friendly. Paid at track to HHBL.', 1),
  ('road', 'Road Bike', 700, 'Faster, sportier feel. Paid at track to HHBL.', 2),
  ('own', 'Own Bike', 0, 'Bring your own bicycle.', 3);

-- ========================================
-- 5. STARTER KIT CONFIG
-- ========================================
create table public.starter_kit_config (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  description text,
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.starter_kit_config (item_name, description, sort_order) values
  ('Padded cycling liner shorts', 'Gel-padded, hygiene-first — yours to keep', 1),
  ('Energy gel (Korona WATT)', 'Quick energy boost during the ride', 2),
  ('Reusable eco mesh bag', 'Carry your gear in style', 3);

-- ========================================
-- 6. STAFF / LEADERS
-- ========================================
create table public.staff_members (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id),
  name text not null,
  nickname text,
  role text not null check (role in ('leader', 'hero', 'admin')),
  bio text,
  photo_url text,
  phone text,
  line_id text,
  is_active boolean not null default true,
  max_sessions_per_day smallint default 2,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ========================================
-- 7. PROMOTIONAL CODES
-- ========================================
create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value integer not null,    -- percentage (e.g. 10) or fixed THB amount
  max_uses integer,                    -- null = unlimited
  current_uses integer not null default 0,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  min_riders smallint,                 -- minimum group size to apply
  applicable_packages text[],          -- null = all packages
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ========================================
-- 8. BLACKOUT DATES (easier than per-slot management)
-- ========================================
create table public.blackout_dates (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  reason text,
  affects_slots text[] default '{}',  -- empty = all slots, or specific ['A1','B']
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index idx_blackout_dates on public.blackout_dates(date);

-- ========================================
-- 9. RLS POLICIES FOR CONFIG TABLES
-- ========================================

-- All config tables: public read, admin write
alter table public.site_config enable row level security;
alter table public.ride_packages_config enable row level security;
alter table public.time_slots_config enable row level security;
alter table public.bike_rentals_config enable row level security;
alter table public.starter_kit_config enable row level security;
alter table public.staff_members enable row level security;
alter table public.promo_codes enable row level security;
alter table public.blackout_dates enable row level security;

-- Public read for site-facing data
create policy "Anyone can read site config" on public.site_config for select using (true);
create policy "Anyone can read packages" on public.ride_packages_config for select using (true);
create policy "Anyone can read time slots" on public.time_slots_config for select using (true);
create policy "Anyone can read bike rentals" on public.bike_rentals_config for select using (true);
create policy "Anyone can read starter kit" on public.starter_kit_config for select using (true);
create policy "Anyone can read active staff" on public.staff_members for select using (is_active = true);

-- Admin write
create policy "Admins manage site config" on public.site_config for all using (public.is_admin());
create policy "Admins manage packages" on public.ride_packages_config for all using (public.is_admin());
create policy "Admins manage time slots" on public.time_slots_config for all using (public.is_admin());
create policy "Admins manage bike rentals" on public.bike_rentals_config for all using (public.is_admin());
create policy "Admins manage starter kit" on public.starter_kit_config for all using (public.is_admin());
create policy "Admins manage staff" on public.staff_members for all using (public.is_admin());
create policy "Admins manage promo codes" on public.promo_codes for all using (public.is_admin());
create policy "Admins manage blackout dates" on public.blackout_dates for all using (public.is_admin());

-- Promo codes: users can validate but not see all
create policy "Anyone can validate promo codes" on public.promo_codes for select using (is_active = true);

-- Updated_at triggers
create trigger set_updated_at before update on public.ride_packages_config
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.time_slots_config
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.bike_rentals_config
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.staff_members
  for each row execute function public.update_updated_at();
