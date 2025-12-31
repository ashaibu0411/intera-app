import { useState, useEffect, useCallback } from 'react';
import {
  hasEntitlement,
  getCustomerInfo,
  isRevenueCatEnabled,
} from '@/lib/revenuecatClient';

interface PremiumState {
  isPremium: boolean;
  isLoading: boolean;
  isEnabled: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook to check if user has premium subscription
 *
 * @example
 * const { isPremium, isLoading, isEnabled, refresh } = usePremium();
 *
 * if (isPremium) {
 *   // Show premium features
 * }
 */
export function usePremium(): PremiumState {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isEnabled = isRevenueCatEnabled();

  const checkPremiumStatus = useCallback(async () => {
    if (!isEnabled) {
      setIsLoading(false);
      setIsPremium(false);
      return;
    }

    try {
      const result = await hasEntitlement('premium');
      if (result.ok) {
        setIsPremium(result.data);
      }
    } catch (error) {
      console.log('[usePremium] Error checking premium status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled]);

  useEffect(() => {
    checkPremiumStatus();
  }, [checkPremiumStatus]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await checkPremiumStatus();
  }, [checkPremiumStatus]);

  return {
    isPremium,
    isLoading,
    isEnabled,
    refresh,
  };
}
