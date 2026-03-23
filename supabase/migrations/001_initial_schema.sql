-- ============================================================
-- EN-JOY SPEED — Full Database Schema
-- Supabase (PostgreSQL) with RLS
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ========================================
-- 1. PROFILES (extends Supabase auth.users)
-- ========================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  line_id text,
  role text not null default 'customer' check (role in ('customer', 'admin', 'leader')),
  preferred_language text not null default 'en' check (preferred_language in ('en', 'th')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========================================
-- 2. RIDE SESSIONS (admin-managed availability)
-- ========================================
-- Each row = one bookable slot on a specific date
create table public.ride_sessions (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  time_slot_id text not null check (time_slot_id in ('A1', 'A2', 'B', 'C', 'D')),

  -- Capacity & availability
  max_groups smallint not null default 1,
  is_available boolean not null default true,
  is_blackout boolean not null default false,
  blackout_reason text,

  -- Weather
  weather_status text not null default 'clear' check (weather_status in ('clear', 'warning', 'cancelled')),
  weather_note text,

  -- Assigned staff
  lead_athlete_id uuid references public.profiles(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One slot per date
  unique(date, time_slot_id)
);

-- Index for fast date range lookups
create index idx_ride_sessions_date on public.ride_sessions(date);
create index idx_ride_sessions_available on public.ride_sessions(date, is_available) where is_available = true;

-- ========================================
-- 3. BOOKINGS (the core transaction)
-- ========================================
create table public.bookings (
  id uuid primary key default uuid_generate_v4(),

  -- Who booked
  user_id uuid not null references public.profiles(id),

  -- What they booked
  ride_session_id uuid not null references public.ride_sessions(id),
  group_type text not null check (group_type in ('duo', 'squad', 'peloton')),
  rider_count smallint not null check (rider_count between 2 and 8),

  -- Pricing (captured at time of booking, not computed later)
  price_per_person integer not null,
  ride_total integer not null,
  rental_total integer not null default 0,
  total_price integer not null,
  currency text not null default 'THB',

  -- Status
  status text not null default 'pending' check (status in (
    'pending',        -- just created, awaiting payment
    'confirmed',      -- payment received
    'rider_details',  -- confirmed, collecting rider info
    'ready',          -- all riders submitted details + waivers
    'completed',      -- ride done
    'cancelled',      -- cancelled by user or admin
    'no_show'         -- didn't show up
  )),

  -- Contact
  contact_name text not null,
  contact_phone text,
  contact_email text,
  contact_line_id text,

  -- Notes
  special_requests text,
  admin_notes text,

  -- Cancellation
  cancelled_at timestamptz,
  cancellation_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_bookings_user on public.bookings(user_id);
create index idx_bookings_session on public.bookings(ride_session_id);
create index idx_bookings_status on public.bookings(status);
create index idx_bookings_date on public.bookings(created_at);

-- ========================================
-- 4. RIDERS (per-person details within a booking)
-- ========================================
-- Each rider in a group can have DIFFERENT bike preferences
create table public.riders (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,

  -- Rider info
  name text not null,
  nickname text,
  height_cm smallint,
  weight_kg smallint,

  -- Individual bike preference (your question answered: each rider picks independently!)
  bike_preference text not null default 'hybrid' check (bike_preference in ('hybrid', 'road', 'own')),
  bike_rental_price integer not null default 0,

  -- Clothing (for padded liner shorts from starter kit)
  clothing_size text check (clothing_size in ('XS', 'S', 'M', 'L', 'XL', 'XXL')),

  -- Waiver
  waiver_accepted boolean not null default false,
  waiver_accepted_at timestamptz,
  waiver_ip_address text,

  -- Emergency contact
  emergency_contact_name text,
  emergency_contact_phone text,

  -- Experience level
  cycling_experience text default 'beginner' check (cycling_experience in ('beginner', 'intermediate', 'experienced')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_riders_booking on public.riders(booking_id);

-- ========================================
-- 5. PAYMENTS
-- ========================================
create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,

  -- Payment info
  amount integer not null,
  currency text not null default 'THB',
  method text not null default 'promptpay' check (method in ('promptpay', 'bank_transfer', 'cash', 'other')),

  -- Status
  status text not null default 'pending' check (status in (
    'pending',
    'paid',
    'verified',     -- admin confirmed receipt
    'refunded',
    'partially_refunded',
    'failed'
  )),

  -- PromptPay specifics
  promptpay_ref text,
  slip_image_url text,

  -- Verification
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,

  -- Refund tracking
  refund_amount integer,
  refund_reason text,
  refund_at timestamptz,

  -- Rain credit (90-day validity per business rules)
  is_rain_credit boolean not null default false,
  rain_credit_expires_at timestamptz,
  rain_credit_used boolean not null default false,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payments_booking on public.payments(booking_id);
create index idx_payments_status on public.payments(status);

-- ========================================
-- 6. STARTER KIT TRACKING
-- ========================================
create table public.starter_kits (
  id uuid primary key default uuid_generate_v4(),
  rider_id uuid not null references public.riders(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,

  -- Kit items
  liner_shorts_size text check (liner_shorts_size in ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  liner_shorts_issued boolean not null default false,
  energy_gel_issued boolean not null default false,
  eco_bag_issued boolean not null default false,

  -- Tracking
  issued_at timestamptz,
  issued_by uuid references public.profiles(id),
  notes text,

  created_at timestamptz not null default now()
);

-- ========================================
-- 7. ROW LEVEL SECURITY
-- ========================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.ride_sessions enable row level security;
alter table public.bookings enable row level security;
alter table public.riders enable row level security;
alter table public.payments enable row level security;
alter table public.starter_kits enable row level security;

-- Helper: check if user is admin
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

-- Helper: check if user is admin or leader
create or replace function public.is_staff()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'leader')
  );
$$ language sql security definer;

-- PROFILES policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());

-- RIDE SESSIONS policies (public read, admin write)
create policy "Anyone can view available ride sessions"
  on public.ride_sessions for select
  using (true);

create policy "Admins can manage ride sessions"
  on public.ride_sessions for all
  using (public.is_admin());

-- BOOKINGS policies
create policy "Users can view own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);

create policy "Users can create bookings"
  on public.bookings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own pending bookings"
  on public.bookings for update
  using (auth.uid() = user_id and status in ('pending', 'rider_details'))
  with check (auth.uid() = user_id);

create policy "Admins can view all bookings"
  on public.bookings for select
  using (public.is_admin());

create policy "Admins can manage all bookings"
  on public.bookings for all
  using (public.is_admin());

create policy "Leaders can view session bookings"
  on public.bookings for select
  using (public.is_staff());

-- RIDERS policies
create policy "Users can view riders for own bookings"
  on public.riders for select
  using (
    exists (
      select 1 from public.bookings
      where bookings.id = riders.booking_id
      and bookings.user_id = auth.uid()
    )
  );

create policy "Users can manage riders for own bookings"
  on public.riders for all
  using (
    exists (
      select 1 from public.bookings
      where bookings.id = riders.booking_id
      and bookings.user_id = auth.uid()
    )
  );

create policy "Staff can view all riders"
  on public.riders for select
  using (public.is_staff());

-- PAYMENTS policies
create policy "Users can view own payments"
  on public.payments for select
  using (
    exists (
      select 1 from public.bookings
      where bookings.id = payments.booking_id
      and bookings.user_id = auth.uid()
    )
  );

create policy "Admins can manage all payments"
  on public.payments for all
  using (public.is_admin());

-- STARTER KITS policies
create policy "Users can view own starter kits"
  on public.starter_kits for select
  using (
    exists (
      select 1 from public.bookings
      where bookings.id = starter_kits.booking_id
      and bookings.user_id = auth.uid()
    )
  );

create policy "Staff can manage starter kits"
  on public.starter_kits for all
  using (public.is_staff());

-- ========================================
-- 8. UPDATED_AT TRIGGER
-- ========================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.ride_sessions
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.bookings
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.riders
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.payments
  for each row execute function public.update_updated_at();

-- ========================================
-- 9. USEFUL VIEWS
-- ========================================

-- View: upcoming bookings with session details
create or replace view public.upcoming_bookings as
select
  b.*,
  rs.date as ride_date,
  rs.time_slot_id,
  rs.weather_status,
  p.full_name as booker_name,
  p.phone as booker_phone,
  (select count(*) from public.riders r where r.booking_id = b.id) as riders_submitted,
  (select count(*) from public.riders r where r.booking_id = b.id and r.waiver_accepted = true) as waivers_completed
from public.bookings b
join public.ride_sessions rs on rs.id = b.ride_session_id
join public.profiles p on p.id = b.user_id
where rs.date >= current_date
  and b.status not in ('cancelled', 'no_show', 'completed')
order by rs.date, rs.time_slot_id;

-- View: daily dashboard for admin
create or replace view public.daily_dashboard as
select
  rs.date,
  rs.time_slot_id,
  rs.is_available,
  rs.is_blackout,
  rs.weather_status,
  count(b.id) as total_bookings,
  coalesce(sum(b.rider_count), 0) as total_riders,
  coalesce(sum(case when b.status = 'confirmed' or b.status = 'ready' then 1 else 0 end), 0) as confirmed_bookings,
  coalesce(sum(case when b.status = 'pending' then 1 else 0 end), 0) as pending_bookings
from public.ride_sessions rs
left join public.bookings b on b.ride_session_id = rs.id and b.status not in ('cancelled', 'no_show')
where rs.date >= current_date
group by rs.date, rs.time_slot_id, rs.is_available, rs.is_blackout, rs.weather_status
order by rs.date, rs.time_slot_id;
