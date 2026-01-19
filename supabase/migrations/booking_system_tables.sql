-- =====================================================
-- BOOKING SYSTEM TABLES
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Business Services Table
-- Stores services offered by each business
CREATE TABLE IF NOT EXISTS business_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 30, -- in minutes
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  category VARCHAR(100),
  image TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Business Hours Table
-- Stores operating hours for each day of the week
CREATE TABLE IF NOT EXISTS business_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  is_open BOOLEAN NOT NULL DEFAULT true,
  open_time TIME NOT NULL DEFAULT '09:00',
  close_time TIME NOT NULL DEFAULT '18:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, day_of_week)
);

-- 3. Business Booking Settings Table
-- Stores booking configuration for each business
CREATE TABLE IF NOT EXISTS business_booking_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE UNIQUE,
  is_booking_enabled BOOLEAN NOT NULL DEFAULT true,
  has_business_pro BOOLEAN NOT NULL DEFAULT false,
  appointment_buffer INTEGER NOT NULL DEFAULT 15, -- minutes between appointments
  advance_booking_days INTEGER NOT NULL DEFAULT 30, -- how far ahead customers can book
  total_bookings_received INTEGER NOT NULL DEFAULT 0,
  blocked_dates TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Business Blocked Slots Table
-- Stores blocked time slots (lunch breaks, meetings, etc.)
CREATE TABLE IF NOT EXISTS business_blocked_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  date DATE, -- NULL if recurring
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- for recurring blocks
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason VARCHAR(255),
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Appointments Table
-- Stores all bookings/appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES business_services(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card_on_site', 'gems', 'in_app')),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_amount DECIMAL(10,2),
  gems_paid INTEGER,
  notes TEXT,
  customer_phone VARCHAR(50),
  cancelled_by VARCHAR(20) CHECK (cancelled_by IN ('customer', 'business')),
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Business Inventory Table (if not exists)
-- Stores inventory items for businesses
CREATE TABLE IF NOT EXISTS business_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image TEXT,
  category VARCHAR(100),
  in_stock BOOLEAN NOT NULL DEFAULT true,
  quantity INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES for better query performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_business_services_business_id ON business_services(business_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_business_id ON business_hours(business_id);
CREATE INDEX IF NOT EXISTS idx_business_blocked_slots_business_id ON business_blocked_slots(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_business_inventory_business_id ON business_inventory(business_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE business_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_booking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_inventory ENABLE ROW LEVEL SECURITY;

-- Business Services Policies
CREATE POLICY "Anyone can view active business services" ON business_services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Business owners can manage their services" ON business_services
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- Business Hours Policies
CREATE POLICY "Anyone can view business hours" ON business_hours
  FOR SELECT USING (true);

CREATE POLICY "Business owners can manage their hours" ON business_hours
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- Business Booking Settings Policies
CREATE POLICY "Anyone can view booking settings" ON business_booking_settings
  FOR SELECT USING (true);

CREATE POLICY "Business owners can manage their booking settings" ON business_booking_settings
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- Business Blocked Slots Policies
CREATE POLICY "Anyone can view blocked slots" ON business_blocked_slots
  FOR SELECT USING (true);

CREATE POLICY "Business owners can manage their blocked slots" ON business_blocked_slots
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- Appointments Policies
CREATE POLICY "Users can view their own appointments" ON appointments
  FOR SELECT USING (
    customer_id = auth.uid() OR
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can create appointments" ON appointments
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Users and business owners can update appointments" ON appointments
  FOR UPDATE USING (
    customer_id = auth.uid() OR
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- Business Inventory Policies
CREATE POLICY "Anyone can view business inventory" ON business_inventory
  FOR SELECT USING (true);

CREATE POLICY "Business owners can manage their inventory" ON business_inventory
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- =====================================================
-- TRIGGERS for updated_at
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DROP TRIGGER IF EXISTS update_business_services_updated_at ON business_services;
CREATE TRIGGER update_business_services_updated_at
  BEFORE UPDATE ON business_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_hours_updated_at ON business_hours;
CREATE TRIGGER update_business_hours_updated_at
  BEFORE UPDATE ON business_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_booking_settings_updated_at ON business_booking_settings;
CREATE TRIGGER update_business_booking_settings_updated_at
  BEFORE UPDATE ON business_booking_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_inventory_updated_at ON business_inventory;
CREATE TRIGGER update_business_inventory_updated_at
  BEFORE UPDATE ON business_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DONE! All booking system tables created.
-- =====================================================
