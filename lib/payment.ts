import { PLATFORM_FEE_PERCENTAGE } from '../constants';

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
  const isValid = mpesaReference.startsWith('R');

  if (!isValid) {
    throw new Error('Invalid M-Pesa Transaction');
  }

  const platformFee = amountPaid * PLATFORM_FEE_PERCENTAGE;
  const sellerEarnings = amountPaid - platformFee;

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

export const canWithdraw = (currentBalance: number, minThreshold: number): boolean => {
  return currentBalance >= minThreshold;
};
