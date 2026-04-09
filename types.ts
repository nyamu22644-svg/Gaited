
// User & Profile
export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  university: string;   // Changed from restrictive union to string to support all universities
  campus: string;
  mpesa_number?: string; // Only visible to owner
  is_verified_seller: boolean;
  reputation_score: number;
  is_profile_complete: boolean; // New Field
  role: 'user' | 'admin';       // New Field
  referral_code?: string;       // New: For invite links
  is_banned?: boolean;          // New: For admin ban functionality
  referred_by?: string;         // New: Stores the ID/Code of the person who referred this user
}

// Leaderboard
export interface TopSeller {
  id: string;
  username: string;
  avatar_url: string;
  university: string;
  weekly_earnings: number;
  rank: number;
}

// Wallet
export interface Wallet {
  user_id: string;
  current_balance: number; // Available for withdrawal
  total_earned: number; // Lifetime earnings
  pending_clearance: number; // Held during dispute window (1hr)
  referral_earnings: number; // New: Track specific earnings from invites
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'CREDIT' | 'DEBIT' | 'WITHDRAWAL';
  amount: number;
  description: string;
  date: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  mpesa_ref?: string; // For tracking
}

// Payouts
export type PayoutStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  status: PayoutStatus;
  created_at: string;
  admin_note?: string;
  mpesa_phone?: string;
}

// Notes
export interface Note {
  id: string;
  seller_id: string;
  seller_name: string;
  title: string;
  description: string;
  unit_code: string;
  university: string;
  lecturer_name?: string; // New: Quality control
  semester?: string; // New: Context
  price: number;
  preview_image: string; // Public blurred image
  file_url?: string; // Private secure URL (only if purchased)
  text_content?: string; // For Text-to-Speech Audio Player
  rating: number;
  review_count: number;
  category?: 'Summary' | 'Past Paper' | 'Cheat Sheet';
  is_verified_purchase?: boolean;
}

// Comments / Q&A
export interface Comment {
  id: string;
  note_id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
  is_seller_reply: boolean;
}

// Bounties (Requests)
export interface Bounty {
  id: string;
  buyer_id: string;
  buyer_name: string;
  unit_code: string;
  description: string;
  status: 'OPEN' | 'FILLED';
  created_at: string;
  status_label?: string; // Helper for UI if needed
}

// Admin Stats
export interface AdminStats {
  platform_revenue: number;
  liabilities: number;
  pending_payouts_count: number;
  active_disputes: number;
}
