-- ============================================================
-- EN-JOY SPEED — Reviews & Post-Ride Feedback
-- ============================================================

create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  user_id uuid not null references public.profiles(id),

  -- Star rating (1-5)
  rating smallint not null check (rating between 1 and 5),

  -- Survey questions from En-Joy Speed Checklist
  enjoyed_ride boolean,          -- คุณสนุกกับการปั่นในครั้งนี้ หรือไม่
  gained_skills boolean,         -- คุุณได้ทักษะในการปั่นจักรยาน ทริปนี้ เพิ่มขึ้นหรือไม่
  will_return boolean,           -- คุณคิดว่า คุณจะกลับมาปั่นจักรยาน เป็นกีฬา ประจำหรือไม่
  next_steps text,               -- คุณจะมีก้าวต่อไป สำหรับ จักรยาน หรือไม่

  -- Free-text feedback
  comment text,

  -- Photo sharing consent
  photo_consent boolean not null default false,

  -- Admin moderation
  is_public boolean not null default true,
  admin_response text,
  admin_responded_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One review per booking
  unique(booking_id)
);

create index idx_reviews_booking on public.reviews(booking_id);
create index idx_reviews_user on public.reviews(user_id);
create index idx_reviews_rating on public.reviews(rating);

-- RLS
alter table public.reviews enable row level security;

create policy "Users can view own reviews"
  on public.reviews for select
  using (auth.uid() = user_id);

create policy "Users can create reviews for own bookings"
  on public.reviews for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.bookings
      where bookings.id = reviews.booking_id
      and bookings.user_id = auth.uid()
    )
  );

create policy "Public reviews visible to all"
  on public.reviews for select
  using (is_public = true);

create policy "Admins can manage all reviews"
  on public.reviews for all
  using (public.is_admin());

-- Updated_at trigger
create trigger set_updated_at before update on public.reviews
  for each row execute function public.update_updated_at();

-- ============================================================
-- Ride stats (captured post-ride by leaders)
-- ============================================================
create table public.ride_stats (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  rider_id uuid references public.riders(id),

  -- Performance data from checklist
  distance_km numeric(5,2) default 23.5,
  duration_minutes integer,
  avg_speed_kmh numeric(4,1),
  group_ranking text,         -- e.g. "Group A" or "Group B"

  -- Gear data
  gear_fitting_done boolean default false,
  gear_test_done boolean default false,

  -- Captured by
  recorded_by uuid references public.profiles(id),
  recorded_at timestamptz default now(),

  created_at timestamptz not null default now()
);

alter table public.ride_stats enable row level security;

create policy "Users can view own stats"
  on public.ride_stats for select
  using (
    exists (
      select 1 from public.bookings
      where bookings.id = ride_stats.booking_id
      and bookings.user_id = auth.uid()
    )
  );

create policy "Staff can manage stats"
  on public.ride_stats for all
  using (public.is_staff());
