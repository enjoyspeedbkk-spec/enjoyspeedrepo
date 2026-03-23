-- ============================================================
-- ADMIN OVERHAUL — Messaging, Media, CRM, Analytics support
-- ============================================================

-- 1. MESSAGING TEMPLATES
create table if not exists public.messaging_templates (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('email', 'line', 'sms')),
  name text not null,
  subject text, -- for email only
  content text not null,
  variables jsonb default '[]'::jsonb, -- e.g. ["rider_name", "ride_date"]
  language text not null default 'en' check (language in ('en', 'th')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_msg_templates_type on public.messaging_templates(type, is_active);

-- 2. AUTO-RESPONDERS
create table if not exists public.autoresponders (
  id uuid primary key default uuid_generate_v4(),
  trigger_event text not null check (trigger_event in (
    'booking_created', 'payment_verified', 'booking_confirmed',
    'booking_cancelled', 'ride_day_reminder', 'post_ride', 'weather_cancel'
  )),
  action text not null check (action in ('send_email', 'send_line', 'send_sms')),
  template_id uuid references public.messaging_templates(id) on delete set null,
  delay_minutes integer not null default 0, -- 0 = immediate
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. UPLOADED ASSETS (Media manager)
create table if not exists public.uploaded_assets (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('banner', 'logo', 'gallery', 'document', 'other')),
  title text not null default '',
  description text,
  storage_url text not null,
  file_name text not null,
  file_size integer, -- bytes
  mime_type text,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_assets_type on public.uploaded_assets(type, is_active, sort_order);

-- 4. RIDER NOTES (CRM)
create table if not exists public.rider_notes (
  id uuid primary key default uuid_generate_v4(),
  -- rider_notes can be attached to a profile (user) or a booking
  profile_id uuid references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  admin_id uuid not null references public.profiles(id),
  content text not null,
  note_type text not null default 'general' check (note_type in ('general', 'issue', 'vip', 'preference', 'follow_up')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_rider_notes_profile on public.rider_notes(profile_id);
create index idx_rider_notes_booking on public.rider_notes(booking_id);

-- 5. MESSAGE LOG (Communication history)
create table if not exists public.message_log (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('email', 'line', 'sms')),
  recipient_id uuid references public.profiles(id),
  recipient_address text, -- email/phone/line_id
  template_id uuid references public.messaging_templates(id) on delete set null,
  subject text,
  content text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'delivered', 'failed')),
  delivery_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_msg_log_recipient on public.message_log(recipient_id, created_at desc);
create index idx_msg_log_status on public.message_log(status);

-- 6. ADMIN DASHBOARD LAYOUT (customization)
create table if not exists public.admin_dashboard_layouts (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  layout jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(admin_id)
);

-- 7. Add useful columns to existing tables
-- Bookings: internal admin notes
alter table public.bookings
  add column if not exists internal_notes text;

-- Profiles: lifetime stats (denormalized for fast CRM queries)
alter table public.profiles
  add column if not exists total_rides integer not null default 0,
  add column if not exists total_spent integer not null default 0,
  add column if not exists last_ride_date date,
  add column if not exists customer_tier text not null default 'new'
    check (customer_tier in ('new', 'regular', 'vip', 'lapsed'));

-- Ride sessions: staff assignment
alter table public.ride_sessions
  add column if not exists support_staff_ids uuid[] default array[]::uuid[];

-- 8. RLS POLICIES for new tables
alter table public.messaging_templates enable row level security;
alter table public.autoresponders enable row level security;
alter table public.uploaded_assets enable row level security;
alter table public.rider_notes enable row level security;
alter table public.message_log enable row level security;
alter table public.admin_dashboard_layouts enable row level security;

-- Admin-only for all new tables
create policy "Admins manage messaging_templates" on public.messaging_templates
  for all using (public.is_admin());

create policy "Admins manage autoresponders" on public.autoresponders
  for all using (public.is_admin());

create policy "Anyone can view active assets" on public.uploaded_assets
  for select using (is_active = true);

create policy "Admins manage uploaded_assets" on public.uploaded_assets
  for all using (public.is_admin());

create policy "Admins manage rider_notes" on public.rider_notes
  for all using (public.is_admin());

create policy "Admins manage message_log" on public.message_log
  for all using (public.is_admin());

create policy "Admins manage own dashboard layout" on public.admin_dashboard_layouts
  for all using (public.is_admin());

-- 9. Updated_at triggers for new tables
create trigger set_updated_at before update on public.messaging_templates
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.autoresponders
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.uploaded_assets
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.rider_notes
  for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.admin_dashboard_layouts
  for each row execute function public.update_updated_at();

-- 10. Create storage bucket for admin uploads
insert into storage.buckets (id, name, public)
values ('admin-uploads', 'admin-uploads', true)
on conflict (id) do nothing;

-- 11. Seed default messaging templates
insert into public.messaging_templates (type, name, subject, content, variables, language) values
  ('email', 'Booking Confirmation', 'Your En-Joy Speed Ride is Confirmed! 🚴',
   '<h2>Hi {{rider_name}},</h2><p>Your ride on <strong>{{ride_date}}</strong> at <strong>{{time_slot}}</strong> is confirmed!</p><p><strong>Group:</strong> {{group_type}} ({{rider_count}} riders)</p><p><strong>Amount Paid:</strong> ฿{{amount}}</p><p>See you at the track! 🏁</p><p>— En-Joy Speed Team</p>',
   '["rider_name", "ride_date", "time_slot", "group_type", "rider_count", "amount"]', 'en'),

  ('email', 'Weather Cancellation', 'Ride Cancelled — Weather Update',
   '<h2>Hi {{rider_name}},</h2><p>Unfortunately, your {{time_slot}} ride on {{ride_date}} has been cancelled due to {{reason}}.</p><p>We''ll contact you about rescheduling or a refund.</p><p>— En-Joy Speed Team</p>',
   '["rider_name", "ride_date", "time_slot", "reason"]', 'en'),

  ('email', 'Ride Reminder', 'Tomorrow''s Ride — What to Know!',
   '<h2>Hi {{rider_name}},</h2><p>Just a reminder — your ride is tomorrow, {{ride_date}} at {{time_slot}}.</p><p>📍 Meeting point: Buriram International Circuit main entrance</p><p>🕐 Arrive 15 minutes early for check-in</p><p>💧 Bring water and wear comfortable clothing</p><p>See you there!</p><p>— En-Joy Speed Team</p>',
   '["rider_name", "ride_date", "time_slot"]', 'en'),

  ('line', 'Booking Confirmation', null,
   '🚴 Booking Confirmed!\n\nHi {{rider_name}}, your ride on {{ride_date}} ({{time_slot}}) is all set!\n\nGroup: {{group_type}} · {{rider_count}} riders\nPaid: ฿{{amount}}\n\nSee you at the track! 🏁',
   '["rider_name", "ride_date", "time_slot", "group_type", "rider_count", "amount"]', 'en'),

  ('line', 'Weather Cancellation', null,
   '⚠️ Ride Cancelled\n\nHi {{rider_name}}, your {{time_slot}} ride on {{ride_date}} has been cancelled: {{reason}}.\n\nWe''ll be in touch about rescheduling.',
   '["rider_name", "ride_date", "time_slot", "reason"]', 'en'),

  ('sms', 'OTP Code', null,
   'En-Joy Speed: Your verification code is {{otp_code}}. Valid for 10 minutes.',
   '["otp_code"]', 'en');

-- 12. Seed default autoresponders
insert into public.autoresponders (trigger_event, action, template_id, delay_minutes, enabled)
select 'payment_verified', 'send_email', id, 0, true
from public.messaging_templates where name = 'Booking Confirmation' and type = 'email'
limit 1;

insert into public.autoresponders (trigger_event, action, template_id, delay_minutes, enabled)
select 'payment_verified', 'send_line', id, 0, true
from public.messaging_templates where name = 'Booking Confirmation' and type = 'line'
limit 1;

insert into public.autoresponders (trigger_event, action, template_id, delay_minutes, enabled)
select 'weather_cancel', 'send_email', id, 0, true
from public.messaging_templates where name = 'Weather Cancellation' and type = 'email'
limit 1;
