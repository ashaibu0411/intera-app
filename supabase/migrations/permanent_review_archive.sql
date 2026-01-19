-- =====================================================
-- PERMANENT REVIEW ARCHIVE SYSTEM
-- Reviews that persist forever - even after account deletion
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Permanent Review Archive Table
-- This stores reviews FOREVER and cannot be deleted by users
CREATE TABLE IF NOT EXISTS permanent_review_archive (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Original review reference (may become null if original deleted)
  original_review_id UUID,
  review_type VARCHAR(20) NOT NULL CHECK (review_type IN ('business', 'service_provider')),

  -- Target info (the person/entity being reviewed)
  target_entity_id UUID, -- Original business_id or provider_id
  target_user_id UUID,   -- The user who owns the business/provider
  target_email VARCHAR(320),  -- Email of the person being reviewed (for linking new accounts)
  target_phone VARCHAR(20),   -- Phone of the person being reviewed
  target_name VARCHAR(255),   -- Name at time of review

  -- Reviewer info
  reviewer_id UUID,
  reviewer_email VARCHAR(320),
  reviewer_phone VARCHAR(20),
  reviewer_name VARCHAR(255),

  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,

  -- Metadata
  original_created_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archive_reason VARCHAR(50) DEFAULT 'auto_archive',

  -- Verification that this review is legitimate
  is_verified BOOLEAN DEFAULT false,
  verification_method VARCHAR(50)
);

-- 2. User Identity Links Table
-- Links different accounts/emails/phones to the same person
CREATE TABLE IF NOT EXISTS user_identity_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Primary identifier (hash of email or phone)
  identity_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of normalized email/phone
  identity_type VARCHAR(20) NOT NULL CHECK (identity_type IN ('email', 'phone')),

  -- Current user reference (may change if they create new account)
  current_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Historical user IDs (JSON array of all user IDs this person has used)
  historical_user_ids JSONB DEFAULT '[]',

  -- Timestamps
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(identity_hash, identity_type)
);

-- 3. Review Fraud Flags Table
-- Flags suspicious review patterns
CREATE TABLE IF NOT EXISTS review_fraud_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  identity_hash VARCHAR(64) NOT NULL,
  flag_type VARCHAR(50) NOT NULL CHECK (flag_type IN (
    'account_deleted_after_bad_review',
    'multiple_accounts',
    'suspicious_pattern',
    'reported_by_community'
  )),

  description TEXT,
  evidence JSONB,

  flagged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by_admin BOOLEAN DEFAULT false,
  admin_notes TEXT
);

-- =====================================================
-- INDEXES for better query performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_archive_target_email ON permanent_review_archive(target_email);
CREATE INDEX IF NOT EXISTS idx_archive_target_phone ON permanent_review_archive(target_phone);
CREATE INDEX IF NOT EXISTS idx_archive_target_user_id ON permanent_review_archive(target_user_id);
CREATE INDEX IF NOT EXISTS idx_archive_reviewer_email ON permanent_review_archive(reviewer_email);
CREATE INDEX IF NOT EXISTS idx_archive_rating ON permanent_review_archive(rating);
CREATE INDEX IF NOT EXISTS idx_archive_review_type ON permanent_review_archive(review_type);

CREATE INDEX IF NOT EXISTS idx_identity_links_hash ON user_identity_links(identity_hash);
CREATE INDEX IF NOT EXISTS idx_identity_links_user ON user_identity_links(current_user_id);

CREATE INDEX IF NOT EXISTS idx_fraud_flags_hash ON review_fraud_flags(identity_hash);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE permanent_review_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_identity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_fraud_flags ENABLE ROW LEVEL SECURITY;

-- Archive is publicly readable but CANNOT be modified by users
CREATE POLICY "Anyone can view archived reviews" ON permanent_review_archive
  FOR SELECT USING (true);

-- No insert/update/delete policies for regular users - only system can modify

-- Identity links - users can see their own
CREATE POLICY "Users can view their own identity links" ON user_identity_links
  FOR SELECT USING (current_user_id = auth.uid());

-- Fraud flags - publicly readable for transparency
CREATE POLICY "Anyone can view fraud flags" ON review_fraud_flags
  FOR SELECT USING (true);

-- =====================================================
-- FUNCTION to archive a review (called by trigger)
-- =====================================================

CREATE OR REPLACE FUNCTION archive_review_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  target_email VARCHAR(320);
  target_phone VARCHAR(20);
  target_name VARCHAR(255);
  reviewer_email VARCHAR(320);
  reviewer_phone VARCHAR(20);
  reviewer_name VARCHAR(255);
BEGIN
  -- Get target info based on review type
  IF TG_TABLE_NAME = 'business_reviews' THEN
    SELECT
      b.owner_id,
      p.email,
      p.phone,
      p.name
    INTO target_user_id, target_email, target_phone, target_name
    FROM businesses b
    JOIN profiles p ON b.owner_id = p.id
    WHERE b.id = NEW.business_id;
  ELSIF TG_TABLE_NAME = 'service_provider_reviews' THEN
    SELECT
      sp.user_id,
      p.email,
      p.phone,
      p.name
    INTO target_user_id, target_email, target_phone, target_name
    FROM service_providers sp
    JOIN profiles p ON sp.user_id = p.id
    WHERE sp.id = NEW.provider_id;
  END IF;

  -- Get reviewer info
  SELECT email, phone, name
  INTO reviewer_email, reviewer_phone, reviewer_name
  FROM profiles
  WHERE id = NEW.reviewer_id;

  -- Archive the review
  INSERT INTO permanent_review_archive (
    original_review_id,
    review_type,
    target_entity_id,
    target_user_id,
    target_email,
    target_phone,
    target_name,
    reviewer_id,
    reviewer_email,
    reviewer_phone,
    reviewer_name,
    rating,
    review_text,
    original_created_at,
    archive_reason
  ) VALUES (
    NEW.id,
    CASE WHEN TG_TABLE_NAME = 'business_reviews' THEN 'business' ELSE 'service_provider' END,
    CASE WHEN TG_TABLE_NAME = 'business_reviews' THEN NEW.business_id ELSE NEW.provider_id END,
    target_user_id,
    target_email,
    target_phone,
    target_name,
    NEW.reviewer_id,
    reviewer_email,
    reviewer_phone,
    reviewer_name,
    NEW.rating,
    CASE WHEN TG_TABLE_NAME = 'business_reviews' THEN NEW.review ELSE NEW.review END,
    NEW.created_at,
    'auto_archive'
  );

  -- Update identity link for target
  IF target_email IS NOT NULL THEN
    INSERT INTO user_identity_links (identity_hash, identity_type, current_user_id, historical_user_ids)
    VALUES (
      encode(sha256(lower(target_email)::bytea), 'hex'),
      'email',
      target_user_id,
      jsonb_build_array(target_user_id)
    )
    ON CONFLICT (identity_hash, identity_type) DO UPDATE SET
      current_user_id = target_user_id,
      historical_user_ids = CASE
        WHEN NOT user_identity_links.historical_user_ids ? target_user_id::text
        THEN user_identity_links.historical_user_ids || jsonb_build_array(target_user_id)
        ELSE user_identity_links.historical_user_ids
      END,
      last_seen_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION to flag account deletion after bad reviews
-- =====================================================

CREATE OR REPLACE FUNCTION flag_deletion_with_bad_reviews()
RETURNS TRIGGER AS $$
DECLARE
  bad_review_count INTEGER;
  avg_rating DECIMAL;
  user_email VARCHAR(320);
  user_phone VARCHAR(20);
  identity_hash_value VARCHAR(64);
BEGIN
  -- Get user's email and phone before deletion
  SELECT email, phone INTO user_email, user_phone FROM profiles WHERE id = OLD.id;

  -- Count bad reviews (3 stars or less) in archive
  SELECT COUNT(*), AVG(rating)
  INTO bad_review_count, avg_rating
  FROM permanent_review_archive
  WHERE target_user_id = OLD.id AND rating <= 3;

  -- If user has bad reviews and is deleting account, flag it
  IF bad_review_count > 0 THEN
    identity_hash_value := encode(sha256(lower(COALESCE(user_email, user_phone))::bytea), 'hex');

    INSERT INTO review_fraud_flags (
      identity_hash,
      flag_type,
      description,
      evidence
    ) VALUES (
      identity_hash_value,
      'account_deleted_after_bad_review',
      'User deleted account after receiving ' || bad_review_count || ' negative reviews (avg rating: ' || ROUND(avg_rating, 1) || ')',
      jsonb_build_object(
        'deleted_user_id', OLD.id,
        'email', user_email,
        'bad_review_count', bad_review_count,
        'average_rating', ROUND(avg_rating, 2),
        'deleted_at', NOW()
      )
    );
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION to get all reviews for a person (by email/phone)
-- =====================================================

CREATE OR REPLACE FUNCTION get_permanent_reviews_by_identity(
  search_email VARCHAR DEFAULT NULL,
  search_phone VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  review_id UUID,
  review_type VARCHAR,
  rating INTEGER,
  review_text TEXT,
  reviewer_name VARCHAR,
  original_created_at TIMESTAMPTZ,
  target_name VARCHAR,
  is_current_account BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pra.id,
    pra.review_type,
    pra.rating,
    pra.review_text,
    pra.reviewer_name,
    pra.original_created_at,
    pra.target_name,
    (pra.target_user_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM profiles WHERE id = pra.target_user_id
    )) as is_current_account
  FROM permanent_review_archive pra
  WHERE
    (search_email IS NOT NULL AND LOWER(pra.target_email) = LOWER(search_email))
    OR (search_phone IS NOT NULL AND pra.target_phone = search_phone)
  ORDER BY pra.original_created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION to check if user has fraud flags
-- =====================================================

CREATE OR REPLACE FUNCTION check_user_fraud_history(user_id UUID)
RETURNS TABLE (
  has_flags BOOLEAN,
  flag_count INTEGER,
  total_bad_reviews INTEGER,
  average_rating DECIMAL,
  deleted_accounts INTEGER
) AS $$
DECLARE
  user_email VARCHAR(320);
  user_phone VARCHAR(20);
  identity_hash_value VARCHAR(64);
BEGIN
  -- Get user's email
  SELECT email, phone INTO user_email, user_phone FROM profiles WHERE id = user_id;

  IF user_email IS NULL AND user_phone IS NULL THEN
    RETURN QUERY SELECT false, 0, 0, 0::DECIMAL, 0;
    RETURN;
  END IF;

  identity_hash_value := encode(sha256(lower(COALESCE(user_email, user_phone))::bytea), 'hex');

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) > 0 FROM review_fraud_flags WHERE identity_hash = identity_hash_value),
    (SELECT COUNT(*)::INTEGER FROM review_fraud_flags WHERE identity_hash = identity_hash_value),
    (SELECT COUNT(*)::INTEGER FROM permanent_review_archive
     WHERE (LOWER(target_email) = LOWER(user_email) OR target_phone = user_phone) AND rating <= 3),
    (SELECT COALESCE(AVG(rating), 0) FROM permanent_review_archive
     WHERE LOWER(target_email) = LOWER(user_email) OR target_phone = user_phone),
    (SELECT COUNT(DISTINCT target_user_id)::INTEGER - 1 FROM permanent_review_archive
     WHERE LOWER(target_email) = LOWER(user_email) OR target_phone = user_phone);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Archive business reviews on insert
DROP TRIGGER IF EXISTS archive_business_review ON business_reviews;
CREATE TRIGGER archive_business_review
  AFTER INSERT ON business_reviews
  FOR EACH ROW EXECUTE FUNCTION archive_review_on_insert();

-- Archive service provider reviews on insert
DROP TRIGGER IF EXISTS archive_provider_review ON service_provider_reviews;
CREATE TRIGGER archive_provider_review
  AFTER INSERT ON service_provider_reviews
  FOR EACH ROW EXECUTE FUNCTION archive_review_on_insert();

-- Flag account deletion with bad reviews
DROP TRIGGER IF EXISTS flag_profile_deletion ON profiles;
CREATE TRIGGER flag_profile_deletion
  BEFORE DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION flag_deletion_with_bad_reviews();

-- =====================================================
-- DONE! Permanent review archive system created.
-- Reviews are now permanently stored and linked by identity.
-- =====================================================
