-- Booking System for Businesses
-- Run this in Supabase SQL editor.

create extension if not exists pgcrypto;

-- Helper for updated_at timestamps (safe to re-run)
create or replace function public.trigger_set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ====================
-- BUSINESS SERVICES (what businesses offer)
-- ====================
create table if not exists public.business_services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name varchar(255) not null,
  description text null,
  duration int not null default 30, -- in minutes
  price decimal(10,2) not null,
  currency varchar(10) not null default 'USD',
  category varchar(100) null,
  image varchar(500) null,
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_services_business_idx on public.business_services(business_id);
create index if not exists business_services_active_idx on public.business_services(business_id, is_active);

alter table public.business_services enable row level security;

drop policy if exists "business_services_select_all" on public.business_services;
create policy "business_services_select_all"
  on public.business_services
  for select
  to authenticated
  using (true);

drop policy if exists "business_services_insert_owner" on public.business_services;
create policy "business_services_insert_owner"
  on public.business_services
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.businesses
      where id = business_id and owner_id = auth.uid()
    )
  );

drop policy if exists "business_services_update_owner" on public.business_services;
create policy "business_services_update_owner"
  on public.business_services
  for update
  to authenticated
  using (
    exists (
      select 1 from public.businesses
      where id = business_id and owner_id = auth.uid()
    )
  );

drop policy if exists "business_services_delete_owner" on public.business_services;
create policy "business_services_delete_owner"
  on public.business_services
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.businesses
      where id = business_id and owner_id = auth.uid()
    )
  );

drop trigger if exists set_timestamp_business_services on public.business_services;
create trigger set_timestamp_business_services
before update on public.business_services
for each row
execute function public.trigger_set_timestamp();

-- ====================
-- BUSINESS HOURS (weekly schedule)
-- ====================
create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0=Sunday, 6=Saturday
  is_open boolean not null default true,
  open_time time not null default '09:00',
  close_time time not null default '18:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(business_id, day_of_week)
);

create index if not exists business_hours_business_idx on public.business_hours(business_id);

alter table public.business_hours enable row level security;

drop policy if exists "business_hours_select_all" on public.business_hours;
create policy "business_hours_select_all"
  on public.business_hours
  for select
  to authenticated
  using (true);

drop policy if exists "business_hours_insert_owner" on public.business_hours;
create policy "business_hours_insert_owner"
  on public.business_hours
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.businesses
      where id = business_id and owner_id = auth.uid()
    )
  );

drop policy if exists "business_hours_update_owner" on public.business_hours;
create policy "business_hours_update_owner"
  on public.business_hours
  for update
  to authenticated
  using (
    exists (
      select 1 from public.businesses
      where id = business_id and owner_id = auth.uid()
    )
  );

drop policy if exists "business_hours_delete_owner" on public.business_hours;
create policy "business_hours_delete_owner"
  on public.business_hours
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.businesses
      where id = business_id and owner_id = auth.uid()
    )
  );

drop trigger if exists set_timestamp_business_hours on public.business_hours;
create trigger set_timestamp_business_hours
before update on public.business_hours
for each row
execute function public.trigger_set_timestamp();

-- ====================
-- BUSINESS BOOKING SETTINGS
-- ====================
create table if not exists public.business_booking_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade unique,
  is_booking_enabled boolean not null default true,
  has_business_pro boolean not null default false,
  appointment_buffer int not null default 15, -- minutes between appointments
  advance_booking_days int not null default 30, -- how many days in advance
  total_bookings_received int not null default 0,
  blocked_dates text[] not null default '{}', -- array of date strings
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_booking_settings_business_idx on public.business_booking_settings(business_id);

alter table public.business_booking_settings enable row level security;

drop policy if exists "business_booking_settings_select_all" on public.business_booking_settings;
create policy "business_booking_settings_select_all"
  on public.business_booking_settings
  for select
  to authenticated
  using (true);

drop policy if exists "business_booking_settings_insert_owner" on public.business_booking_settings;
create policy "business_booking_settings_insert_owner"
  on public.business_booking_settings
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.businesses
      where id = business_id and owner_id = auth.uid()
    )
  );

drop policy if exists "business_booking_settings_update_owner" on public.business_booking_settings;
create policy "business_booking_settings_update_owner"
  on public.business_booking_settings
  for update
  to authenticated
  using (
    exists (
      select 1 from public.businesses
      where id = business_id and owner_id = auth.uid()
    )
  );

drop trigger if exists set_timestamp_business_booking_settings on public.business_booking_settings;
create trigger set_timestamp_business_booking_settings
before update on public.business_booking_settings
for each row
execute function public.trigger_set_timestamp();

-- ====================
-- BLOCKED TIME SLOTS (recurring or one-time)
-- ====================
create table if not exists public.business_blocked_slots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  date date null, -- null for recurring (every week)
  day_of_week int null check (day_of_week between 0 and 6), -- for recurring blocks
  start_time time not null,
  end_time time not null,
  reason varchar(255) null,
  is_recurring boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists business_blocked_slots_business_idx on public.business_blocked_slots(business_id);
create index if not exists business_blocked_slots_date_idx on public.business_blocked_slots(business_id, date);

alter table public.business_blocked_slots enable row level security;

drop policy if exists "business_blocked_slots_select_all" on public.business_blocked_slots;
create policy "business_blocked_slots_select_all"
  on public.business_blocked_slots
  for select
  to authenticated
  using (true);

drop policy if exists "business_blocked_slots_insert_owner" on public.business_blocked_slots;
create policy "business_blocked_slots_insert_owner"
  on public.business_blocked_slots
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.businesses
      where id = business_id and owner_id = auth.uid()
    )
  );

drop policy if exists "business_blocked_slots_delete_owner" on public.business_blocked_slots;
create policy "business_blocked_slots_delete_owner"
  on public.business_blocked_slots
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.businesses
      where id = business_id and owner_id = auth.uid()
    )
  );

-- ====================
-- APPOINTMENTS
-- ====================
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  service_id uuid not null references public.business_services(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  status varchar(50) not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  payment_method varchar(50) null check (payment_method in ('cash', 'card_on_site', 'gems', 'in_app')),
  payment_status varchar(50) not null default 'pending' check (payment_status in ('pending', 'paid', 'refunded')),
  payment_amount decimal(10,2) null,
  gems_paid int null,
  notes text null,
  customer_phone varchar(50) null,
  cancelled_by varchar(50) null check (cancelled_by in ('customer', 'business')),
  cancellation_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appointments_business_idx on public.appointments(business_id);
create index if not exists appointments_customer_idx on public.appointments(customer_id);
create index if not exists appointments_date_idx on public.appointments(business_id, date);
create index if not exists appointments_status_idx on public.appointments(business_id, status);

alter table public.appointments enable row level security;

-- Everyone can see appointments for businesses (needed for availability check)
drop policy if exists "appointments_select_all" on public.appointments;
create policy "appointments_select_all"
  on public.appointments
  for select
  to authenticated
  using (true);

-- Customers can create their own appointments
drop policy if exists "appointments_insert_customer" on public.appointments;
create policy "appointments_insert_customer"
  on public.appointments
  for insert
  to authenticated
  with check (customer_id = auth.uid());

-- Customers and business owners can update appointments
drop policy if exists "appointments_update_participant" on public.appointments;
create policy "appointments_update_participant"
  on public.appointments
  for update
  to authenticated
  using (
    customer_id = auth.uid() or
    exists (
      select 1 from public.businesses
      where id = business_id and owner_id = auth.uid()
    )
  );

drop trigger if exists set_timestamp_appointments on public.appointments;
create trigger set_timestamp_appointments
before update on public.appointments
for each row
execute function public.trigger_set_timestamp();

-- ====================
-- SERVICE TEMPLATES (preset services for business types)
-- ====================
create table if not exists public.service_templates (
  id uuid primary key default gen_random_uuid(),
  business_category varchar(100) not null,
  name varchar(255) not null,
  description text null,
  suggested_duration int not null default 30,
  suggested_price decimal(10,2) not null,
  currency varchar(10) not null default 'USD',
  service_category varchar(100) null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists service_templates_category_idx on public.service_templates(business_category);

alter table public.service_templates enable row level security;

drop policy if exists "service_templates_select_all" on public.service_templates;
create policy "service_templates_select_all"
  on public.service_templates
  for select
  to authenticated
  using (true);

-- Insert service templates for common business types
INSERT INTO public.service_templates (business_category, name, description, suggested_duration, suggested_price, service_category, display_order) VALUES
-- Barbershop / Men's Hair
('barbershop', 'Classic Haircut', 'Traditional haircut with clippers and scissors', 30, 25.00, 'Haircuts', 1),
('barbershop', 'Haircut + Beard Trim', 'Full haircut with precision beard shaping and line-up', 45, 40.00, 'Haircuts', 2),
('barbershop', 'Kids Haircut', 'Haircut for children 12 and under', 20, 18.00, 'Haircuts', 3),
('barbershop', 'Fade Haircut', 'Skin fade or taper fade with clean lines', 35, 30.00, 'Haircuts', 4),
('barbershop', 'Hot Towel Shave', 'Luxurious straight razor shave with hot towel treatment', 30, 30.00, 'Shaves', 5),
('barbershop', 'Beard Trim & Shape', 'Professional beard grooming and shaping', 20, 15.00, 'Beard', 6),
('barbershop', 'The Works', 'Haircut, beard trim, hot towel shave, and scalp massage', 75, 65.00, 'Packages', 7),
('barbershop', 'Line-Up Only', 'Edge up and clean lines around hairline', 15, 15.00, 'Touch-ups', 8),

-- Hair Salon / Women's Hair
('hair_salon', 'Women''s Haircut', 'Wash, cut, and style', 45, 45.00, 'Haircuts', 1),
('hair_salon', 'Men''s Haircut', 'Basic men''s cut and style', 30, 30.00, 'Haircuts', 2),
('hair_salon', 'Kids Haircut', 'Haircut for children', 25, 25.00, 'Haircuts', 3),
('hair_salon', 'Blowout', 'Shampoo and professional blowout styling', 30, 35.00, 'Styling', 4),
('hair_salon', 'Full Color', 'Single-process all-over color', 90, 85.00, 'Color', 5),
('hair_salon', 'Highlights (Partial)', 'Partial foil highlights', 90, 95.00, 'Color', 6),
('hair_salon', 'Highlights (Full)', 'Full head foil highlights', 120, 150.00, 'Color', 7),
('hair_salon', 'Balayage', 'Hand-painted highlights for natural look', 150, 175.00, 'Color', 8),
('hair_salon', 'Deep Conditioning Treatment', 'Intensive moisture treatment', 30, 30.00, 'Treatments', 9),
('hair_salon', 'Keratin Treatment', 'Smoothing and anti-frizz treatment', 180, 250.00, 'Treatments', 10),
('hair_salon', 'Updo / Special Occasion', 'Elegant styling for events', 60, 75.00, 'Styling', 11),
('hair_salon', 'Braids', 'Braiding service (price varies by style)', 60, 50.00, 'Styling', 12),

-- Beauty Salon / Nail Salon
('beauty_salon', 'Basic Manicure', 'Nail shaping, cuticle care, and polish', 30, 25.00, 'Nails', 1),
('beauty_salon', 'Gel Manicure', 'Long-lasting gel polish manicure', 45, 40.00, 'Nails', 2),
('beauty_salon', 'Basic Pedicure', 'Foot soak, nail care, and polish', 45, 35.00, 'Nails', 3),
('beauty_salon', 'Spa Pedicure', 'Deluxe pedicure with massage and treatment', 60, 55.00, 'Nails', 4),
('beauty_salon', 'Acrylic Full Set', 'Full set of acrylic nail extensions', 60, 55.00, 'Nails', 5),
('beauty_salon', 'Acrylic Fill', 'Acrylic nail fill and maintenance', 45, 35.00, 'Nails', 6),
('beauty_salon', 'Eyebrow Wax', 'Eyebrow shaping with wax', 15, 15.00, 'Waxing', 7),
('beauty_salon', 'Lip Wax', 'Upper lip hair removal', 10, 10.00, 'Waxing', 8),
('beauty_salon', 'Full Face Wax', 'Complete facial hair removal', 30, 40.00, 'Waxing', 9),
('beauty_salon', 'Eyebrow Tint', 'Semi-permanent eyebrow color', 20, 20.00, 'Brows & Lashes', 10),
('beauty_salon', 'Lash Lift', 'Natural lash curl and lift', 45, 65.00, 'Brows & Lashes', 11),
('beauty_salon', 'Eyelash Extensions (Full Set)', 'Individual lash extensions', 120, 150.00, 'Brows & Lashes', 12),

-- Spa / Massage
('spa', 'Swedish Massage (60 min)', 'Relaxing full-body massage', 60, 80.00, 'Massage', 1),
('spa', 'Swedish Massage (90 min)', 'Extended relaxation massage', 90, 120.00, 'Massage', 2),
('spa', 'Deep Tissue Massage', 'Therapeutic deep pressure massage', 60, 95.00, 'Massage', 3),
('spa', 'Hot Stone Massage', 'Massage with heated stones', 75, 110.00, 'Massage', 4),
('spa', 'Couples Massage', 'Side-by-side massage for two', 60, 180.00, 'Massage', 5),
('spa', 'Classic Facial', 'Cleansing, exfoliation, and hydration', 60, 75.00, 'Facials', 6),
('spa', 'Anti-Aging Facial', 'Targeted treatment for fine lines', 75, 95.00, 'Facials', 7),
('spa', 'Hydrating Facial', 'Deep moisture treatment', 60, 85.00, 'Facials', 8),
('spa', 'Body Scrub', 'Full body exfoliation treatment', 45, 65.00, 'Body Treatments', 9),
('spa', 'Body Wrap', 'Detoxifying or hydrating wrap', 60, 85.00, 'Body Treatments', 10),

-- Fitness / Personal Training
('fitness', 'Personal Training Session (1hr)', 'One-on-one fitness training', 60, 75.00, 'Training', 1),
('fitness', 'Personal Training (30 min)', 'Quick focused workout session', 30, 45.00, 'Training', 2),
('fitness', 'Fitness Assessment', 'Initial fitness evaluation and goal setting', 60, 50.00, 'Assessment', 3),
('fitness', 'Nutrition Consultation', 'Personalized nutrition planning', 45, 60.00, 'Consultation', 4),
('fitness', 'Group Class (per person)', 'Small group fitness class', 45, 25.00, 'Classes', 5),

-- Photography
('photography', 'Portrait Session (1hr)', 'Individual or headshot photography', 60, 150.00, 'Portraits', 1),
('photography', 'Family Session (1hr)', 'Family photography session', 60, 200.00, 'Portraits', 2),
('photography', 'Event Photography (2hr)', 'Birthday, party, or small event', 120, 300.00, 'Events', 3),
('photography', 'Wedding Photography (Half Day)', 'Wedding coverage up to 4 hours', 240, 800.00, 'Weddings', 4),
('photography', 'Product Photography', 'Per product or item', 30, 50.00, 'Commercial', 5),

-- Auto Services
('auto_services', 'Basic Wash', 'Exterior hand wash', 30, 25.00, 'Wash', 1),
('auto_services', 'Full Detail Wash', 'Interior and exterior cleaning', 60, 75.00, 'Wash', 2),
('auto_services', 'Interior Detail', 'Deep interior cleaning and conditioning', 90, 100.00, 'Detailing', 3),
('auto_services', 'Full Detail Package', 'Complete interior and exterior detail', 180, 200.00, 'Detailing', 4),
('auto_services', 'Oil Change', 'Standard oil and filter change', 30, 45.00, 'Maintenance', 5),
('auto_services', 'Tire Rotation', 'Rotate all four tires', 30, 25.00, 'Maintenance', 6),

-- Tutoring / Education
('tutoring', 'Tutoring Session (1hr)', 'One-on-one academic tutoring', 60, 50.00, 'Academic', 1),
('tutoring', 'Tutoring Session (30 min)', 'Quick tutoring session', 30, 30.00, 'Academic', 2),
('tutoring', 'Test Prep Session', 'SAT, ACT, or other test preparation', 60, 65.00, 'Test Prep', 3),
('tutoring', 'Music Lesson', 'Instrument or vocal lesson', 45, 45.00, 'Music', 4),
('tutoring', 'Language Lesson', 'Foreign language tutoring', 60, 50.00, 'Languages', 5),

-- Home Services
('home_services', 'House Cleaning (1 bedroom)', 'Standard cleaning service', 120, 100.00, 'Cleaning', 1),
('home_services', 'House Cleaning (2-3 bedroom)', 'Standard cleaning service', 180, 150.00, 'Cleaning', 2),
('home_services', 'Deep Clean', 'Thorough deep cleaning service', 240, 250.00, 'Cleaning', 3),
('home_services', 'Lawn Mowing', 'Basic lawn mowing service', 60, 50.00, 'Lawn & Garden', 4),
('home_services', 'Handyman (1hr)', 'General repairs and maintenance', 60, 65.00, 'Repairs', 5),

-- Pet Services
('pet_services', 'Dog Grooming (Small)', 'Full grooming for dogs under 25 lbs', 60, 45.00, 'Grooming', 1),
('pet_services', 'Dog Grooming (Medium)', 'Full grooming for dogs 25-50 lbs', 75, 60.00, 'Grooming', 2),
('pet_services', 'Dog Grooming (Large)', 'Full grooming for dogs over 50 lbs', 90, 80.00, 'Grooming', 3),
('pet_services', 'Dog Walking (30 min)', 'Individual dog walk', 30, 20.00, 'Walking', 4),
('pet_services', 'Pet Sitting (Day)', 'In-home pet sitting per day', 480, 50.00, 'Sitting', 5)

ON CONFLICT DO NOTHING;

-- Add accepts_bookings column to businesses if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'accepts_bookings'
  ) THEN
    ALTER TABLE public.businesses ADD COLUMN accepts_bookings boolean not null default false;
  END IF;
END $$;
