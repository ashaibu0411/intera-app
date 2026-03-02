import { supabase, DbUserWallet, DbGiftTransaction } from './supabase';

export interface SendGiftParams {
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  giftId: string;
  giftName: string;
  giftValue: number;
  roomId?: string;
  roomTitle?: string;
}

export interface GiftServiceResult {
  success: boolean;
  error?: string;
  newBalance?: number;
}

// Get or create user wallet
export async function getOrCreateWallet(userId: string): Promise<DbUserWallet | null> {
  try {
    // Only the user themselves can create/update their wallet under RLS.
    const { data: auth } = await supabase.auth.getUser();
    const authId = auth?.user?.id ?? null;

    // Try to get existing wallet
    const { data: existingWallet, error: fetchError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingWallet) {
      return existingWallet;
    }

    // If the requested wallet isn't the signed-in user, we can't create it client-side.
    if (!authId || authId !== userId) {
      return null;
    }

    // Create new wallet with 500 starting gems
    const { data: newWallet, error: createError } = await supabase
      .from('user_wallets')
      .insert({
        user_id: userId,
        gem_balance: 500,
        total_earned: 0,
        total_sent: 0,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating wallet:', createError);
      return null;
    }

    return newWallet;
  } catch (error) {
    console.error('Error in getOrCreateWallet:', error);
    return null;
  }
}

// Get user's gem balance
export async function getGemBalance(userId: string): Promise<number> {
  const wallet = await getOrCreateWallet(userId);
  return wallet?.gem_balance ?? 500;
}

// Send a gift (deduct from sender, credit to recipient)
export async function sendGift(params: SendGiftParams): Promise<GiftServiceResult> {
  const { senderId, senderName, recipientId, recipientName, giftId, giftName, giftValue, roomId, roomTitle } = params;

  try {
    // Use secure RPC to avoid RLS issues (updates both wallets + records transaction).
    const { data, error } = await supabase.rpc('send_gift', {
      recipient_id: recipientId,
      gift_id: giftId,
      gift_name: giftName,
      gift_value: giftValue,
      room_id: roomId ?? null,
      room_title: roomTitle ?? null,
      sender_name: senderName ?? null,
      recipient_name: recipientName ?? null,
    });

    if (error) {
      const msg = String((error as any)?.message ?? error);
      if (msg.toLowerCase().includes('insufficient')) return { success: false, error: 'Insufficient gems' };
      if (msg.toLowerCase().includes('not authenticated')) return { success: false, error: 'Not authenticated' };
      return { success: false, error: msg };
    }

    const row = Array.isArray(data) ? data[0] : data;
    const newBalance = typeof row?.new_balance === 'number' ? row.new_balance : undefined;
    return {
      success: true,
      newBalance,
    };
  } catch (error) {
    console.error('Error in sendGift:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Add gems to user's wallet (for purchases)
export async function addGems(userId: string, amount: number): Promise<GiftServiceResult> {
  try {
    const wallet = await getOrCreateWallet(userId);
    if (!wallet) {
      return { success: false, error: 'Could not access wallet' };
    }

    const { error } = await supabase
      .from('user_wallets')
      .update({
        gem_balance: wallet.gem_balance + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error adding gems:', error);
      return { success: false, error: 'Failed to add gems' };
    }

    return {
      success: true,
      newBalance: wallet.gem_balance + amount,
    };
  } catch (error) {
    console.error('Error in addGems:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Get user's transaction history
export async function getTransactionHistory(userId: string, limit: number = 50): Promise<DbGiftTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('gift_transactions')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return data ?? [];
  } catch (error) {
    console.error('Error in getTransactionHistory:', error);
    return [];
  }
}

// Get wallet stats
export async function getWalletStats(userId: string): Promise<{
  balance: number;
  totalEarned: number;
  totalSent: number;
} | null> {
  const wallet = await getOrCreateWallet(userId);
  if (!wallet) return null;

  return {
    balance: wallet.gem_balance,
    totalEarned: wallet.total_earned,
    totalSent: wallet.total_sent,
  };
}
