import { hasEntitlement, isRevenueCatEnabled } from './revenuecatClient';
import { useStore } from './store';

export const FREE_SALES_LIMIT = 50;

/**
 * Check if the user can accept in-app payments
 * Returns true if:
 * - User has less than 50 in-app sales, OR
 * - User has an active Seller Pro subscription
 */
export async function canAcceptInAppPayments(): Promise<boolean> {
  const inAppSalesCount = useStore.getState().inAppSalesCount;

  // If under the free limit, always allow
  if (inAppSalesCount < FREE_SALES_LIMIT) {
    return true;
  }

  // Otherwise, check for Seller Pro subscription
  if (!isRevenueCatEnabled()) {
    return false;
  }

  const result = await hasEntitlement('seller_pro');
  return result.ok && result.data;
}

/**
 * Check if the user has Seller Pro subscription
 */
export async function hasSellerPro(): Promise<boolean> {
  if (!isRevenueCatEnabled()) {
    return false;
  }

  const result = await hasEntitlement('seller_pro');
  return result.ok && result.data;
}

/**
 * Get the number of remaining free in-app sales
 */
export function getRemainingFreeSales(): number {
  const inAppSalesCount = useStore.getState().inAppSalesCount;
  return Math.max(0, FREE_SALES_LIMIT - inAppSalesCount);
}

/**
 * Check if user is approaching the free sales limit (10 or fewer remaining)
 */
export function isApproachingLimit(): boolean {
  return getRemainingFreeSales() <= 10 && getRemainingFreeSales() > 0;
}

/**
 * Check if user has exceeded the free sales limit
 */
export function hasExceededLimit(): boolean {
  return getRemainingFreeSales() === 0;
}

/**
 * Record an in-app sale (call this when a sale is completed through the app)
 */
export function recordInAppSale(): void {
  useStore.getState().incrementInAppSalesCount();
}
