
import { Wallet, Transaction } from '../types';

const REFERRAL_BONUS_AMOUNT = 50; // KES

/**
 * Generates a unique invite link for the user.
 */
export const getReferralLink = (referralCode?: string): string => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gaited.co';
  const code = referralCode || 'JOIN';
  return `${baseUrl}/join?ref=${code}`;
};

/**
 * Simulates the backend logic when a referred user makes their first purchase.
 * In a real app, this runs on the server (e.g., Supabase Edge Function).
 */
export const creditReferralBonus = (
  currentWallet: Wallet,
  referrerId: string
): { updatedWallet: Wallet; newTransaction: Transaction } => {
  
  // 1. Calculate new balance
  const newBalance = currentWallet.current_balance + REFERRAL_BONUS_AMOUNT;
  const newTotal = currentWallet.total_earned + REFERRAL_BONUS_AMOUNT;
  const newReferralEarnings = (currentWallet.referral_earnings || 0) + REFERRAL_BONUS_AMOUNT;

  // 2. Create Transaction Record
  const transaction: Transaction = {
    id: `tx_ref_${Math.random().toString(36).substr(2, 9)}`,
    user_id: referrerId,
    type: 'CREDIT',
    amount: REFERRAL_BONUS_AMOUNT,
    description: 'Referral Bonus: Friend made first purchase',
    date: new Date().toISOString(),
    status: 'COMPLETED'
  };

  // 3. Return updated objects
  const updatedWallet: Wallet = {
    ...currentWallet,
    current_balance: newBalance,
    total_earned: newTotal,
    referral_earnings: newReferralEarnings
  };

  return { updatedWallet, newTransaction: transaction };
};
