
import { PLATFORM_FEE_PERCENTAGE } from '../constants';

/**
 * Simulates the IntaSend Webhook processing for M-Pesa payments.
 * In production, this runs on a secure Edge Function.
 */

interface PaymentResult {
  success: boolean;
  transactionId: string;
  sellerAmount: number;
  platformAmount: number;
  escrowReleaseTime: Date;
}

export const processMpesaCallback = (
  mpesaReference: string, 
  amountPaid: number,
  sellerId: string
): PaymentResult => {
  // 1. Validate Payment Signature (Mocked)
  const isValid = mpesaReference.startsWith('R'); // Basic validation for demo
  
  if (!isValid) {
    throw new Error("Invalid M-Pesa Transaction");
  }

  // 2. Arbitrage Calculation (The Business Logic)
  const platformFee = amountPaid * PLATFORM_FEE_PERCENTAGE;
  const sellerEarnings = amountPaid - platformFee;

  // 3. Determine Escrow Period
  // Funds are held for 1 hour to allow for "Blank File" disputes
  const releaseTime = new Date();
  releaseTime.setHours(releaseTime.getHours() + 1);

  return {
    success: true,
    transactionId: `tx_${Math.random().toString(36).substr(2, 9)}`,
    sellerAmount: sellerEarnings,
    platformAmount: platformFee,
    escrowReleaseTime: releaseTime
  };
};

/**
 * Simulates B2C Payout check
 */
export const canWithdraw = (currentBalance: number, minThreshold: number): boolean => {
  return currentBalance >= minThreshold;
};
