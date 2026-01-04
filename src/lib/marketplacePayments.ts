/**
 * Marketplace Payments Service
 *
 * Handles gem-based payments for marketplace items and business services.
 * Users buy gems with real money (via RevenueCat), then spend gems to purchase items.
 * Sellers receive gems which they can cash out or use in the app.
 */

import { getOfferings, purchasePackage, isRevenueCatEnabled } from './revenuecatClient';
import { addGems as addGemsToWallet, getWalletStats, getOrCreateWallet } from './giftService';
import { supabase } from './supabase';
import type { PurchasesPackage } from 'react-native-purchases';

// Gem package definitions (must match RevenueCat setup)
export interface GemPackage {
  id: string;
  identifier: string;
  gems: number;
  bonusGems: number;
  price: number;
  popular?: boolean;
  bestValue?: boolean;
}

export const GEM_PACKAGES: GemPackage[] = [
  { id: 'gems_100', identifier: 'gems_100', gems: 100, bonusGems: 0, price: 0.99 },
  { id: 'gems_550', identifier: 'gems_550', gems: 500, bonusGems: 50, price: 4.99 },
  { id: 'gems_1400', identifier: 'gems_1400', gems: 1200, bonusGems: 200, price: 9.99, popular: true },
  { id: 'gems_3000', identifier: 'gems_3000', gems: 2500, bonusGems: 500, price: 19.99 },
  { id: 'gems_8000', identifier: 'gems_8000', gems: 6500, bonusGems: 1500, price: 49.99, bestValue: true },
  { id: 'gems_20000', identifier: 'gems_20000', gems: 15000, bonusGems: 5000, price: 99.99 },
];

// Conversion rate: 100 gems = $1 USD (for display purposes)
export const GEMS_PER_DOLLAR = 100;

export interface MarketplacePurchase {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id?: string;
  service_id?: string;
  item_name: string;
  gem_amount: number;
  platform_fee: number; // 10% platform fee
  seller_receives: number;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  created_at: string;
}

export interface PurchaseResult {
  success: boolean;
  error?: string;
  purchase?: MarketplacePurchase;
  newBuyerBalance?: number;
}

/**
 * Get available gem packages from RevenueCat
 */
export async function getGemPackagesFromRC(): Promise<PurchasesPackage[]> {
  if (!isRevenueCatEnabled()) {
    return [];
  }

  const result = await getOfferings();
  if (!result.ok) {
    return [];
  }

  // Look for the "gems" offering
  const gemsOffering = result.data.all?.['gems'];
  if (!gemsOffering) {
    // Fall back to current offering if gems offering not found
    return result.data.current?.availablePackages ?? [];
  }

  return gemsOffering.availablePackages;
}

/**
 * Purchase gems via RevenueCat
 */
export async function purchaseGems(
  userId: string,
  rcPackage: PurchasesPackage
): Promise<{ success: boolean; gemsAdded?: number; error?: string }> {
  if (!isRevenueCatEnabled()) {
    return { success: false, error: 'Payments not available' };
  }

  const result = await purchasePackage(rcPackage);

  if (!result.ok) {
    return { success: false, error: 'Purchase failed' };
  }

  // Find matching gem package to credit
  const gemPackage = GEM_PACKAGES.find(p => p.identifier === rcPackage.identifier);
  if (!gemPackage) {
    console.error('Unknown gem package:', rcPackage.identifier);
    return { success: false, error: 'Unknown package' };
  }

  const totalGems = gemPackage.gems + gemPackage.bonusGems;

  // Add gems to user's wallet
  const addResult = await addGemsToWallet(userId, totalGems);

  if (!addResult.success) {
    return { success: false, error: 'Failed to credit gems' };
  }

  // Record the purchase in Supabase
  await supabase.from('gem_purchases').insert({
    user_id: userId,
    package_id: gemPackage.id,
    gems_purchased: gemPackage.gems,
    bonus_gems: gemPackage.bonusGems,
    price_usd: gemPackage.price,
    rc_transaction_id: rcPackage.identifier,
  });

  return { success: true, gemsAdded: totalGems };
}

/**
 * Convert price to gems (100 gems = $1)
 */
export function priceToGems(priceUSD: number): number {
  return Math.ceil(priceUSD * GEMS_PER_DOLLAR);
}

/**
 * Convert gems to price display
 */
export function gemsToPrice(gems: number): string {
  const dollars = gems / GEMS_PER_DOLLAR;
  return `$${dollars.toFixed(2)}`;
}

/**
 * Purchase a marketplace listing with gems
 */
export async function purchaseMarketplaceListing(
  buyerId: string,
  buyerName: string,
  sellerId: string,
  sellerName: string,
  listingId: string,
  itemName: string,
  gemPrice: number
): Promise<PurchaseResult> {
  try {
    // Get buyer's wallet
    const buyerWallet = await getOrCreateWallet(buyerId);
    if (!buyerWallet) {
      return { success: false, error: 'Could not access wallet' };
    }

    // Check if buyer has enough gems
    if (buyerWallet.gem_balance < gemPrice) {
      return { success: false, error: 'Insufficient gems' };
    }

    // Calculate fees (10% platform fee)
    const platformFee = Math.floor(gemPrice * 0.10);
    const sellerReceives = gemPrice - platformFee;

    // Get seller's wallet
    const sellerWallet = await getOrCreateWallet(sellerId);
    if (!sellerWallet) {
      return { success: false, error: 'Seller wallet not found' };
    }

    // Deduct from buyer
    const { error: buyerError } = await supabase
      .from('user_wallets')
      .update({
        gem_balance: buyerWallet.gem_balance - gemPrice,
        total_sent: buyerWallet.total_sent + gemPrice,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', buyerId);

    if (buyerError) {
      return { success: false, error: 'Failed to process payment' };
    }

    // Credit seller (minus platform fee)
    const { error: sellerError } = await supabase
      .from('user_wallets')
      .update({
        gem_balance: sellerWallet.gem_balance + sellerReceives,
        total_earned: sellerWallet.total_earned + sellerReceives,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', sellerId);

    if (sellerError) {
      // Rollback buyer deduction
      await supabase
        .from('user_wallets')
        .update({
          gem_balance: buyerWallet.gem_balance,
          total_sent: buyerWallet.total_sent,
        })
        .eq('user_id', buyerId);
      return { success: false, error: 'Failed to credit seller' };
    }

    // Record the purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('marketplace_purchases')
      .insert({
        buyer_id: buyerId,
        seller_id: sellerId,
        listing_id: listingId,
        item_name: itemName,
        gem_amount: gemPrice,
        platform_fee: platformFee,
        seller_receives: sellerReceives,
        status: 'completed',
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Error recording purchase:', purchaseError);
    }

    return {
      success: true,
      purchase: purchase as MarketplacePurchase,
      newBuyerBalance: buyerWallet.gem_balance - gemPrice,
    };
  } catch (error) {
    console.error('Error in purchaseMarketplaceListing:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Purchase a business service with gems
 */
export async function purchaseBusinessService(
  buyerId: string,
  buyerName: string,
  sellerId: string,
  sellerName: string,
  serviceId: string,
  serviceName: string,
  gemPrice: number
): Promise<PurchaseResult> {
  try {
    // Get buyer's wallet
    const buyerWallet = await getOrCreateWallet(buyerId);
    if (!buyerWallet) {
      return { success: false, error: 'Could not access wallet' };
    }

    // Check if buyer has enough gems
    if (buyerWallet.gem_balance < gemPrice) {
      return { success: false, error: 'Insufficient gems' };
    }

    // Calculate fees (10% platform fee)
    const platformFee = Math.floor(gemPrice * 0.10);
    const sellerReceives = gemPrice - platformFee;

    // Get seller's wallet
    const sellerWallet = await getOrCreateWallet(sellerId);
    if (!sellerWallet) {
      return { success: false, error: 'Seller wallet not found' };
    }

    // Deduct from buyer
    const { error: buyerError } = await supabase
      .from('user_wallets')
      .update({
        gem_balance: buyerWallet.gem_balance - gemPrice,
        total_sent: buyerWallet.total_sent + gemPrice,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', buyerId);

    if (buyerError) {
      return { success: false, error: 'Failed to process payment' };
    }

    // Credit seller (minus platform fee)
    const { error: sellerError } = await supabase
      .from('user_wallets')
      .update({
        gem_balance: sellerWallet.gem_balance + sellerReceives,
        total_earned: sellerWallet.total_earned + sellerReceives,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', sellerId);

    if (sellerError) {
      // Rollback buyer deduction
      await supabase
        .from('user_wallets')
        .update({
          gem_balance: buyerWallet.gem_balance,
          total_sent: buyerWallet.total_sent,
        })
        .eq('user_id', buyerId);
      return { success: false, error: 'Failed to credit seller' };
    }

    // Record the purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('marketplace_purchases')
      .insert({
        buyer_id: buyerId,
        seller_id: sellerId,
        service_id: serviceId,
        item_name: serviceName,
        gem_amount: gemPrice,
        platform_fee: platformFee,
        seller_receives: sellerReceives,
        status: 'completed',
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Error recording purchase:', purchaseError);
    }

    return {
      success: true,
      purchase: purchase as MarketplacePurchase,
      newBuyerBalance: buyerWallet.gem_balance - gemPrice,
    };
  } catch (error) {
    console.error('Error in purchaseBusinessService:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get user's purchase history
 */
export async function getPurchaseHistory(
  userId: string,
  type: 'buyer' | 'seller' | 'all' = 'all'
): Promise<MarketplacePurchase[]> {
  try {
    let query = supabase
      .from('marketplace_purchases')
      .select('*')
      .order('created_at', { ascending: false });

    if (type === 'buyer') {
      query = query.eq('buyer_id', userId);
    } else if (type === 'seller') {
      query = query.eq('seller_id', userId);
    } else {
      query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Error fetching purchase history:', error);
      return [];
    }

    return data ?? [];
  } catch (error) {
    console.error('Error in getPurchaseHistory:', error);
    return [];
  }
}

/**
 * Get seller earnings summary
 */
export async function getSellerEarnings(sellerId: string): Promise<{
  totalEarnings: number;
  totalSales: number;
  pendingBalance: number;
}> {
  try {
    const { data, error } = await supabase
      .from('marketplace_purchases')
      .select('seller_receives')
      .eq('seller_id', sellerId)
      .eq('status', 'completed');

    if (error || !data) {
      return { totalEarnings: 0, totalSales: 0, pendingBalance: 0 };
    }

    const totalEarnings = data.reduce((sum, p) => sum + (p.seller_receives ?? 0), 0);
    const wallet = await getWalletStats(sellerId);

    return {
      totalEarnings,
      totalSales: data.length,
      pendingBalance: wallet?.balance ?? 0,
    };
  } catch (error) {
    console.error('Error in getSellerEarnings:', error);
    return { totalEarnings: 0, totalSales: 0, pendingBalance: 0 };
  }
}
