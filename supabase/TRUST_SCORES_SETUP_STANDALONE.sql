-- Run this if user_trust_scores (and related trust tables) do not exist yet.
-- Safe alongside existing business_reviews / service_provider_reviews from 20260116.
-- Supabase SQL Editor: paste and run as one script.

-- ========== Tables (IF NOT EXISTS) ==========

CREATE TABLE IF NOT EXISTS public.user_vouches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT,
  relationship VARCHAR(20) NOT NULL CHECK (relationship IN ('friend', 'family', 'business', 'neighbor', 'colleague')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id),
  CHECK (from_user_id != to_user_id)
);

CREATE TABLE IF NOT EXISTS public.user_trust_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
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

CREATE TABLE IF NOT EXISTS public.user_trust_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL,
  badge_name VARCHAR(100) NOT NULL,
  description TEXT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

CREATE INDEX IF NOT EXISTS idx_user_trust_scores_user_id ON public.user_trust_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trust_scores_overall_score ON public.user_trust_scores(overall_score);
CREATE INDEX IF NOT EXISTS idx_user_vouches_from_user_id ON public.user_vouches(from_user_id);
CREATE INDEX IF NOT EXISTS idx_user_vouches_to_user_id ON public.user_vouches(to_user_id);
CREATE INDEX IF NOT EXISTS idx_user_trust_badges_user_id ON public.user_trust_badges(user_id);

-- ========== RLS: trust tables only ==========

ALTER TABLE public.user_trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vouches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trust_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view trust scores" ON public.user_trust_scores;
CREATE POLICY "Anyone can view trust scores" ON public.user_trust_scores
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view their own trust score" ON public.user_trust_scores;
CREATE POLICY "Users can view their own trust score" ON public.user_trust_scores
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can update trust scores" ON public.user_trust_scores;
CREATE POLICY "System can update trust scores" ON public.user_trust_scores
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can insert own trust score" ON public.user_trust_scores;
CREATE POLICY "Users can insert own trust score" ON public.user_trust_scores
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view vouches" ON public.user_vouches;
CREATE POLICY "Anyone can view vouches" ON public.user_vouches
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create vouches for others" ON public.user_vouches;
CREATE POLICY "Users can create vouches for others" ON public.user_vouches
  FOR INSERT WITH CHECK (from_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own vouches" ON public.user_vouches;
CREATE POLICY "Users can delete their own vouches" ON public.user_vouches
  FOR DELETE USING (from_user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view trust badges" ON public.user_trust_badges;
CREATE POLICY "Anyone can view trust badges" ON public.user_trust_badges
  FOR SELECT USING (true);

-- ========== updated_at helper + trigger ==========

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_user_trust_scores_updated_at ON public.user_trust_scores;
CREATE TRIGGER update_user_trust_scores_updated_at
  BEFORE UPDATE ON public.user_trust_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== Recalculate (SECURITY DEFINER — required for review trigger) ==========

CREATE OR REPLACE FUNCTION public.recalculate_user_trust_score(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_score INTEGER;
  review_count INTEGER;
  vouch_count INTEGER;
  avg_rating DECIMAL;
BEGIN
  SELECT COUNT(*) INTO review_count FROM (
    SELECT id FROM public.business_reviews br
    JOIN public.businesses b ON br.business_id = b.id
    WHERE b.owner_id = target_user_id
    UNION ALL
    SELECT id FROM public.service_provider_reviews spr
    JOIN public.service_providers sp ON spr.provider_id = sp.id
    WHERE sp.user_id = target_user_id
  ) reviews;

  SELECT COUNT(*) INTO vouch_count FROM public.user_vouches WHERE to_user_id = target_user_id;

  SELECT AVG(rating) INTO avg_rating FROM (
    SELECT rating FROM public.business_reviews br
    JOIN public.businesses b ON br.business_id = b.id
    WHERE b.owner_id = target_user_id
    UNION ALL
    SELECT rating FROM public.service_provider_reviews spr
    JOIN public.service_providers sp ON spr.provider_id = sp.id
    WHERE sp.user_id = target_user_id
  ) all_ratings;

  new_score := 20 + (review_count * 3) + (vouch_count * 15);

  IF avg_rating IS NOT NULL THEN
    new_score := new_score + CAST((avg_rating - 1) * 5 AS INTEGER);
  END IF;

  IF new_score > 100 THEN
    new_score := 100;
  END IF;

  INSERT INTO public.user_trust_scores (user_id, overall_score, reviews_received, vouches_received, avg_rating)
  VALUES (target_user_id, new_score, review_count, vouch_count, COALESCE(avg_rating, 0))
  ON CONFLICT (user_id) DO UPDATE SET
    overall_score = EXCLUDED.overall_score,
    reviews_received = EXCLUDED.reviews_received,
    vouches_received = EXCLUDED.vouches_received,
    avg_rating = EXCLUDED.avg_rating,
    verification_level = CASE
      WHEN EXCLUDED.overall_score >= 90 THEN 'community_leader'
      WHEN EXCLUDED.overall_score >= 70 THEN 'trusted'
      WHEN EXCLUDED.overall_score >= 50 THEN 'verified'
      WHEN EXCLUDED.overall_score >= 20 THEN 'basic'
      ELSE 'unverified'
    END,
    updated_at = NOW();

  RETURN new_score;
END;
$$;

COMMENT ON FUNCTION public.recalculate_user_trust_score(UUID) IS
  'Recalculates trust from reviews/vouches; SECURITY DEFINER so RLS does not block upsert from triggers.';

-- ========== Triggers on reviews → trust ==========

CREATE OR REPLACE FUNCTION public.update_trust_score_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  owner_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'business_reviews' THEN
    SELECT b.owner_id INTO owner_id FROM public.businesses b WHERE b.id = NEW.business_id;
  ELSIF TG_TABLE_NAME = 'service_provider_reviews' THEN
    SELECT sp.user_id INTO owner_id FROM public.service_providers sp WHERE sp.id = NEW.provider_id;
  END IF;

  IF owner_id IS NOT NULL THEN
    PERFORM public.recalculate_user_trust_score(owner_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_trust_on_business_review ON public.business_reviews;
CREATE TRIGGER update_trust_on_business_review
  AFTER INSERT OR UPDATE ON public.business_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_trust_score_on_review();

DROP TRIGGER IF EXISTS update_trust_on_provider_review ON public.service_provider_reviews;
CREATE TRIGGER update_trust_on_provider_review
  AFTER INSERT OR UPDATE ON public.service_provider_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_trust_score_on_review();

CREATE OR REPLACE FUNCTION public.update_trust_score_on_vouch()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.recalculate_user_trust_score(NEW.to_user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_trust_on_vouch ON public.user_vouches;
CREATE TRIGGER update_trust_on_vouch
  AFTER INSERT ON public.user_vouches
  FOR EACH ROW EXECUTE FUNCTION public.update_trust_score_on_vouch();

-- Optional: backfill trust for existing businesses/providers (safe to run)
-- INSERT INTO user_trust_scores (...) SELECT ... ; -- skip unless you want a one-off backfill
