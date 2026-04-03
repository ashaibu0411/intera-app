-- =====================================================
-- REVIEWS SYSTEM TABLES
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Business Reviews Table
CREATE TABLE IF NOT EXISTS business_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, reviewer_id)
);

-- 2. Business Confirmations Table ("Worked for me" clicks)
CREATE TABLE IF NOT EXISTS business_confirmations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

-- 3. Service Provider Reviews Table
CREATE TABLE IF NOT EXISTS service_provider_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider_id, reviewer_id)
);

-- 4. Service Provider Confirmations Table ("Worked for me" clicks)
CREATE TABLE IF NOT EXISTS service_provider_confirmations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider_id, user_id)
);

-- 5. User Trust Scores Table (for storing computed trust scores)
CREATE TABLE IF NOT EXISTS user_trust_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  overall_score INTEGER NOT NULL DEFAULT 20 CHECK (overall_score >= 0 AND overall_score <= 100),
  verification_level VARCHAR(20) NOT NULL DEFAULT 'basic' CHECK (verification_level IN ('unverified', 'basic', 'verified', 'trusted', 'community_leader')),
  transactions_completed INTEGER NOT NULL DEFAULT 0,
  events_hosted INTEGER NOT NULL DEFAULT 0,
  reviews_received INTEGER NOT NULL DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  community_contributions INTEGER NOT NULL DEFAULT 0,
  vouches_received INTEGER NOT NULL DEFAULT 0,
  vouches_given INTEGER NOT NULL DEFAULT 0,
  reports_filed INTEGER NOT NULL DEFAULT 0,
  reports_against INTEGER NOT NULL DEFAULT 0,
  joined_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. User Vouches Table (community vouching system)
CREATE TABLE IF NOT EXISTS user_vouches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  relationship VARCHAR(20) NOT NULL CHECK (relationship IN ('friend', 'family', 'business', 'neighbor', 'colleague')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id),
  CHECK (from_user_id != to_user_id)
);

-- 7. User Trust Badges Table
CREATE TABLE IF NOT EXISTS user_trust_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL,
  badge_name VARCHAR(100) NOT NULL,
  description TEXT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- =====================================================
-- INDEXES for better query performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_business_reviews_business_id ON business_reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_business_reviews_reviewer_id ON business_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_business_reviews_rating ON business_reviews(rating);

CREATE INDEX IF NOT EXISTS idx_business_confirmations_business_id ON business_confirmations(business_id);
CREATE INDEX IF NOT EXISTS idx_business_confirmations_user_id ON business_confirmations(user_id);

CREATE INDEX IF NOT EXISTS idx_service_provider_reviews_provider_id ON service_provider_reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_provider_reviews_reviewer_id ON service_provider_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_service_provider_reviews_rating ON service_provider_reviews(rating);

CREATE INDEX IF NOT EXISTS idx_service_provider_confirmations_provider_id ON service_provider_confirmations(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_provider_confirmations_user_id ON service_provider_confirmations(user_id);

CREATE INDEX IF NOT EXISTS idx_user_trust_scores_user_id ON user_trust_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trust_scores_overall_score ON user_trust_scores(overall_score);
CREATE INDEX IF NOT EXISTS idx_user_trust_scores_verification_level ON user_trust_scores(verification_level);

CREATE INDEX IF NOT EXISTS idx_user_vouches_from_user_id ON user_vouches(from_user_id);
CREATE INDEX IF NOT EXISTS idx_user_vouches_to_user_id ON user_vouches(to_user_id);

CREATE INDEX IF NOT EXISTS idx_user_trust_badges_user_id ON user_trust_badges(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE business_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_provider_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_provider_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vouches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trust_badges ENABLE ROW LEVEL SECURITY;

-- Business Reviews Policies
CREATE POLICY "Anyone can view business reviews" ON business_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create/update their own reviews" ON business_reviews
  FOR ALL USING (reviewer_id = auth.uid());

-- Business Confirmations Policies
CREATE POLICY "Anyone can view business confirmations count" ON business_confirmations
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own confirmations" ON business_confirmations
  FOR ALL USING (user_id = auth.uid());

-- Service Provider Reviews Policies
CREATE POLICY "Anyone can view provider reviews" ON service_provider_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create/update their own provider reviews" ON service_provider_reviews
  FOR ALL USING (reviewer_id = auth.uid());

-- Service Provider Confirmations Policies
CREATE POLICY "Anyone can view provider confirmations count" ON service_provider_confirmations
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own provider confirmations" ON service_provider_confirmations
  FOR ALL USING (user_id = auth.uid());

-- User Trust Scores Policies
CREATE POLICY "Anyone can view trust scores" ON user_trust_scores
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own trust score" ON user_trust_scores
  FOR ALL USING (user_id = auth.uid());

-- Allow system to update trust scores (for triggers/functions)
CREATE POLICY "System can update trust scores" ON user_trust_scores
  FOR UPDATE USING (true);

-- Authenticated users can create their own row (client bootstrap); triggers use SECURITY DEFINER.
DROP POLICY IF EXISTS "Users can insert own trust score" ON user_trust_scores;
CREATE POLICY "Users can insert own trust score" ON user_trust_scores
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- User Vouches Policies
CREATE POLICY "Anyone can view vouches" ON user_vouches
  FOR SELECT USING (true);

CREATE POLICY "Users can create vouches for others" ON user_vouches
  FOR INSERT WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can delete their own vouches" ON user_vouches
  FOR DELETE USING (from_user_id = auth.uid());

-- User Trust Badges Policies
CREATE POLICY "Anyone can view trust badges" ON user_trust_badges
  FOR SELECT USING (true);

-- =====================================================
-- TRIGGERS for updated_at
-- =====================================================

-- Function to update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
DROP TRIGGER IF EXISTS update_business_reviews_updated_at ON business_reviews;
CREATE TRIGGER update_business_reviews_updated_at
  BEFORE UPDATE ON business_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_provider_reviews_updated_at ON service_provider_reviews;
CREATE TRIGGER update_service_provider_reviews_updated_at
  BEFORE UPDATE ON service_provider_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_trust_scores_updated_at ON user_trust_scores;
CREATE TRIGGER update_user_trust_scores_updated_at
  BEFORE UPDATE ON user_trust_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION to recalculate trust score
-- =====================================================

-- SECURITY DEFINER: trigger runs as reviewer; RLS on user_trust_scores would block INSERT otherwise.
CREATE OR REPLACE FUNCTION recalculate_user_trust_score(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_score INTEGER;
  review_count INTEGER;
  vouch_count INTEGER;
  avg_rating DECIMAL;
BEGIN
  -- Count reviews received (as business owner or service provider)
  SELECT COUNT(*) INTO review_count FROM (
    SELECT id FROM business_reviews br
    JOIN businesses b ON br.business_id = b.id
    WHERE b.owner_id = target_user_id
    UNION ALL
    SELECT id FROM service_provider_reviews spr
    JOIN service_providers sp ON spr.provider_id = sp.id
    WHERE sp.user_id = target_user_id
  ) reviews;

  -- Count vouches received
  SELECT COUNT(*) INTO vouch_count FROM user_vouches WHERE to_user_id = target_user_id;

  -- Calculate average rating across all reviews
  SELECT AVG(rating) INTO avg_rating FROM (
    SELECT rating FROM business_reviews br
    JOIN businesses b ON br.business_id = b.id
    WHERE b.owner_id = target_user_id
    UNION ALL
    SELECT rating FROM service_provider_reviews spr
    JOIN service_providers sp ON spr.provider_id = sp.id
    WHERE sp.user_id = target_user_id
  ) all_ratings;

  -- Calculate score: base 20 + reviews*3 + vouches*15 + rating bonus
  new_score := 20 + (review_count * 3) + (vouch_count * 15);

  -- Add rating bonus (0-20 points based on avg rating)
  IF avg_rating IS NOT NULL THEN
    new_score := new_score + CAST((avg_rating - 1) * 5 AS INTEGER);
  END IF;

  -- Cap at 100
  IF new_score > 100 THEN
    new_score := 100;
  END IF;

  -- Update or insert trust score
  INSERT INTO user_trust_scores (user_id, overall_score, reviews_received, vouches_received, avg_rating)
  VALUES (target_user_id, new_score, review_count, vouch_count, COALESCE(avg_rating, 0))
  ON CONFLICT (user_id) DO UPDATE SET
    overall_score = new_score,
    reviews_received = review_count,
    vouches_received = vouch_count,
    avg_rating = COALESCE(avg_rating, 0),
    verification_level = CASE
      WHEN new_score >= 90 THEN 'community_leader'
      WHEN new_score >= 70 THEN 'trusted'
      WHEN new_score >= 50 THEN 'verified'
      WHEN new_score >= 20 THEN 'basic'
      ELSE 'unverified'
    END,
    updated_at = NOW();

  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- TRIGGER to auto-update trust score on new review
-- =====================================================

CREATE OR REPLACE FUNCTION update_trust_score_on_review()
RETURNS TRIGGER AS $$
DECLARE
  owner_id UUID;
BEGIN
  -- Find the owner of the reviewed business
  IF TG_TABLE_NAME = 'business_reviews' THEN
    SELECT b.owner_id INTO owner_id FROM businesses b WHERE b.id = NEW.business_id;
  ELSIF TG_TABLE_NAME = 'service_provider_reviews' THEN
    SELECT sp.user_id INTO owner_id FROM service_providers sp WHERE sp.id = NEW.provider_id;
  END IF;

  -- Recalculate trust score for the owner
  IF owner_id IS NOT NULL THEN
    PERFORM recalculate_user_trust_score(owner_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_trust_on_business_review ON business_reviews;
CREATE TRIGGER update_trust_on_business_review
  AFTER INSERT OR UPDATE ON business_reviews
  FOR EACH ROW EXECUTE FUNCTION update_trust_score_on_review();

DROP TRIGGER IF EXISTS update_trust_on_provider_review ON service_provider_reviews;
CREATE TRIGGER update_trust_on_provider_review
  AFTER INSERT OR UPDATE ON service_provider_reviews
  FOR EACH ROW EXECUTE FUNCTION update_trust_score_on_review();

-- Trigger for vouches
CREATE OR REPLACE FUNCTION update_trust_score_on_vouch()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM recalculate_user_trust_score(NEW.to_user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_trust_on_vouch ON user_vouches;
CREATE TRIGGER update_trust_on_vouch
  AFTER INSERT ON user_vouches
  FOR EACH ROW EXECUTE FUNCTION update_trust_score_on_vouch();

-- =====================================================
-- DONE! All review and trust score tables created.
-- =====================================================
