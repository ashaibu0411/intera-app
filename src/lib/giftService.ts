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
    // Try to get existing wallet
    const { data: existingWallet, error: fetchError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingWallet) {
      return existingWallet;
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
    // Get sender's wallet
    const senderWallet = await getOrCreateWallet(senderId);
    if (!senderWallet) {
      return { success: false, error: 'Could not access wallet' };
    }

    // Check if sender has enough gems
    if (senderWallet.gem_balance < giftValue) {
      return { success: false, error: 'Insufficient gems' };
    }

    // Get recipient's wallet
    const recipientWallet = await getOrCreateWallet(recipientId);
    if (!recipientWallet) {
      return { success: false, error: 'Recipient wallet not found' };
    }

    // Deduct from sender
    const { error: senderUpdateError } = await supabase
      .from('user_wallets')
      .update({
        gem_balance: senderWallet.gem_balance - giftValue,
        total_sent: senderWallet.total_sent + giftValue,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', senderId);

    if (senderUpdateError) {
      console.error('Error updating sender wallet:', senderUpdateError);
      return { success: false, error: 'Failed to deduct gems' };
    }

    // Credit to recipient
    const { error: recipientUpdateError } = await supabase
      .from('user_wallets')
      .update({
        gem_balance: recipientWallet.gem_balance + giftValue,
        total_earned: recipientWallet.total_earned + giftValue,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', recipientId);

    if (recipientUpdateError) {
      console.error('Error updating recipient wallet:', recipientUpdateError);
      // Rollback sender deduction
      await supabase
        .from('user_wallets')
        .update({
          gem_balance: senderWallet.gem_balance,
          total_sent: senderWallet.total_sent,
        })
        .eq('user_id', senderId);
      return { success: false, error: 'Failed to credit recipient' };
    }

    // Record the transaction
    const { error: transactionError } = await supabase
      .from('gift_transactions')
      .insert({
        sender_id: senderId,
        sender_name: senderName,
        recipient_id: recipientId,
        recipient_name: recipientName,
        gift_id: giftId,
        gift_name: giftName,
        gift_value: giftValue,
        room_id: roomId ?? null,
        room_title: roomTitle ?? null,
      });

    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
      // Transaction still succeeded, just not recorded
    }

    return {
      success: true,
      newBalance: senderWallet.gem_balance - giftValue,
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
