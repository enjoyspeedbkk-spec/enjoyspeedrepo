-- ============================================================
-- SECURITY FIXES — Race conditions, duplicate prevention,
-- payment window enforcement, booking expiry
-- ============================================================

-- 1. Prevent duplicate active bookings: same user + same session
-- (A user shouldn't be able to book the same ride session twice)
create unique index idx_unique_active_booking_per_user_session
  on public.bookings(user_id, ride_session_id)
  where status not in ('cancelled', 'no_show');

-- 2. Add payment deadline to bookings (default 2 hours)
alter table public.bookings
  add column if not exists payment_deadline timestamptz;

-- Set default payment deadline for new bookings via trigger
create or replace function public.set_payment_deadline()
returns trigger as $$
begin
  if new.status = 'pending' and new.payment_deadline is null then
    new.payment_deadline := now() + interval '2 hours';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger set_booking_payment_deadline
  before insert on public.bookings
  for each row execute function public.set_payment_deadline();

-- 3. Auto-expire stale pending bookings (run via cron or periodic check)
-- This function can be called by a Supabase Edge Function or pg_cron
create or replace function public.expire_stale_bookings()
returns integer as $$
declare
  expired_count integer;
begin
  update public.bookings
  set status = 'cancelled',
      cancelled_at = now(),
      cancellation_reason = 'Payment deadline expired'
  where status = 'pending'
    and payment_deadline is not null
    and payment_deadline < now();

  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$ language plpgsql security definer;

-- 4. Add cancellation metadata to weather cancels
alter table public.bookings
  add column if not exists cancelled_by uuid references public.profiles(id);

-- 5. Ensure OTP attempt tracking works correctly
-- Add index for faster OTP lookups
create index if not exists idx_phone_otp_lookup
  on public.phone_otp_codes(phone, verified, expires_at);

-- 6. Add a max_attempts column with default
-- (in case the column doesn't have a default)
alter table public.phone_otp_codes
  alter column attempts set default 0;

-- 7. Advisory lock helper for slot-level booking serialization
-- Uses a deterministic hash of (date, slot_id) as the lock key
create or replace function public.booking_advisory_lock(p_date date, p_slot_id text)
returns void as $$
begin
  -- pg_advisory_xact_lock auto-releases at end of transaction
  perform pg_advisory_xact_lock(
    hashtext(p_date::text || '::' || p_slot_id)
  );
end;
$$ language plpgsql;

-- 8. Create a server-side booking function that does everything atomically
-- This runs inside a single transaction, preventing race conditions
create or replace function public.create_booking_atomic(
  p_user_id uuid,
  p_date date,
  p_time_slot_id text,
  p_group_type text,
  p_rider_count smallint,
  p_price_per_person integer,
  p_ride_total integer,
  p_rental_total integer,
  p_total_price integer,
  p_contact_name text,
  p_contact_phone text default null,
  p_contact_email text default null,
  p_contact_line_id text default null,
  p_special_requests text default null,
  p_riders jsonb default '[]'::jsonb
)
returns jsonb as $$
declare
  v_session_id uuid;
  v_booking_id uuid;
  v_conflicting_slots text[];
  v_has_conflict boolean := false;
  v_rider record;
begin
  -- Acquire advisory lock for this date+slot to serialize concurrent requests
  perform public.booking_advisory_lock(p_date, p_time_slot_id);

  -- 1. Find or create ride session
  select id into v_session_id
  from public.ride_sessions
  where date = p_date and time_slot_id = p_time_slot_id;

  if v_session_id is null then
    insert into public.ride_sessions(date, time_slot_id, max_groups, is_available)
    values (p_date, p_time_slot_id, 1, true)
    returning id into v_session_id;
  else
    -- Check session availability
    if exists (
      select 1 from public.ride_sessions
      where id = v_session_id
        and (not is_available or is_blackout or weather_status = 'cancelled')
    ) then
      return jsonb_build_object('success', false, 'error', 'This time slot is not available.');
    end if;
  end if;

  -- 2. Check for conflicting slots
  v_conflicting_slots := case p_time_slot_id
    when 'A1' then array['A2']
    when 'A2' then array['A1']
    when 'B'  then array['C', 'D']
    when 'C'  then array['B', 'D']
    when 'D'  then array['B', 'C']
    else array[]::text[]
  end;

  if array_length(v_conflicting_slots, 1) > 0 then
    select exists (
      select 1
      from public.bookings b
      join public.ride_sessions rs on rs.id = b.ride_session_id
      where rs.date = p_date
        and rs.time_slot_id = any(v_conflicting_slots)
        and b.status not in ('cancelled', 'no_show')
    ) into v_has_conflict;

    if v_has_conflict then
      return jsonb_build_object(
        'success', false,
        'error', 'This time slot conflicts with an existing booking.'
      );
    end if;
  end if;

  -- 3. Check for duplicate booking (same user, same session, still active)
  if exists (
    select 1 from public.bookings
    where user_id = p_user_id
      and ride_session_id = v_session_id
      and status not in ('cancelled', 'no_show')
  ) then
    return jsonb_build_object(
      'success', false,
      'error', 'You already have a booking for this session.'
    );
  end if;

  -- 4. Create booking (payment_deadline auto-set by trigger)
  insert into public.bookings(
    user_id, ride_session_id, group_type, rider_count,
    price_per_person, ride_total, rental_total, total_price,
    status, contact_name, contact_phone, contact_email, contact_line_id,
    special_requests
  ) values (
    p_user_id, v_session_id, p_group_type, p_rider_count,
    p_price_per_person, p_ride_total, p_rental_total, p_total_price,
    'pending', p_contact_name, p_contact_phone, p_contact_email, p_contact_line_id,
    p_special_requests
  ) returning id into v_booking_id;

  -- 5. Create riders
  for v_rider in select * from jsonb_array_elements(p_riders)
  loop
    insert into public.riders(
      booking_id, name, nickname, height_cm,
      bike_preference, bike_rental_price, clothing_size,
      cycling_experience, emergency_contact_name, emergency_contact_phone,
      waiver_accepted, waiver_accepted_at
    ) values (
      v_booking_id,
      v_rider.value->>'name',
      nullif(v_rider.value->>'nickname', ''),
      (v_rider.value->>'height_cm')::smallint,
      coalesce(v_rider.value->>'bike_preference', 'hybrid'),
      coalesce((v_rider.value->>'bike_rental_price')::integer, 0),
      nullif(v_rider.value->>'clothing_size', ''),
      coalesce(v_rider.value->>'cycling_experience', 'beginner'),
      nullif(v_rider.value->>'emergency_contact_name', ''),
      nullif(v_rider.value->>'emergency_contact_phone', ''),
      coalesce((v_rider.value->>'waiver_accepted')::boolean, false),
      case when (v_rider.value->>'waiver_accepted')::boolean then now() else null end
    );
  end loop;

  -- 6. Create payment record
  insert into public.payments(booking_id, amount, currency, method, status)
  values (v_booking_id, p_ride_total, 'THB', 'promptpay', 'pending');

  -- All succeeded atomically
  return jsonb_build_object(
    'success', true,
    'bookingId', v_booking_id,
    'paymentAmount', p_ride_total
  );

exception when unique_violation then
  return jsonb_build_object(
    'success', false,
    'error', 'You already have a booking for this session.'
  );
when others then
  return jsonb_build_object(
    'success', false,
    'error', 'Could not create booking. Please try again.'
  );
end;
$$ language plpgsql security definer;
