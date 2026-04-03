-- Trust score trigger failed on INSERT into user_trust_scores: RLS had UPDATE-only policy,
-- so the first review for a business/provider owner rolled back the whole transaction.
-- Also allow authenticated users to insert their own initial trust row (client bootstrap).

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
    SELECT id FROM business_reviews br
    JOIN businesses b ON br.business_id = b.id
    WHERE b.owner_id = target_user_id
    UNION ALL
    SELECT id FROM service_provider_reviews spr
    JOIN service_providers sp ON spr.provider_id = sp.id
    WHERE sp.user_id = target_user_id
  ) reviews;

  SELECT COUNT(*) INTO vouch_count FROM user_vouches WHERE to_user_id = target_user_id;

  SELECT AVG(rating) INTO avg_rating FROM (
    SELECT rating FROM business_reviews br
    JOIN businesses b ON br.business_id = b.id
    WHERE b.owner_id = target_user_id
    UNION ALL
    SELECT rating FROM service_provider_reviews spr
    JOIN service_providers sp ON spr.provider_id = sp.id
    WHERE sp.user_id = target_user_id
  ) all_ratings;

  new_score := 20 + (review_count * 3) + (vouch_count * 15);

  IF avg_rating IS NOT NULL THEN
    new_score := new_score + CAST((avg_rating - 1) * 5 AS INTEGER);
  END IF;

  IF new_score > 100 THEN
    new_score := 100;
  END IF;

  INSERT INTO user_trust_scores (user_id, overall_score, reviews_received, vouches_received, avg_rating)
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

-- Let signed-in users create their own row; trigger still uses SECURITY DEFINER for any user_id.
DROP POLICY IF EXISTS "Users can insert own trust score" ON public.user_trust_scores;
CREATE POLICY "Users can insert own trust score" ON public.user_trust_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

COMMENT ON FUNCTION public.recalculate_user_trust_score(UUID) IS
  'Recalculates trust from reviews/vouches; SECURITY DEFINER so RLS does not block upsert from triggers.';
