
import { supabase } from '../lib/supabaseClient';
import { Note, Profile, Wallet, Bounty, PayoutRequest, Transaction, TopSeller } from '../types';

// --- USER & AUTH ---

export const getCurrentUserProfile = async (): Promise<Profile | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data as Profile;
};

export const getAllUsers = async (): Promise<Profile[]> => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) {
     // Return empty if table doesn't exist yet or RLS blocks
     return []; 
  }
  return data as Profile[];
};

export const updateUserProfile = async (updates: Partial<Profile>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No user logged in");

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) throw error;
};

// --- NOTES ---

export const getNotes = async (): Promise<Note[]> => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching notes:', error);
    return [];
  }
  return data as Note[];
};

export const createNote = async (noteData: Partial<Note>): Promise<Note> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // Fetch username for denormalized field
  const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();

  const newNote = {
    seller_id: user.id,
    seller_name: profile?.username || 'Anonymous',
    title: noteData.title,
    description: noteData.description || '',
    unit_code: noteData.unit_code,
    university: noteData.university,
    price: noteData.price || 50,
    preview_image: 'https://picsum.photos/400/600', // Placeholder until File Upload is implemented
    file_url: 'https://example.com/secure-pdf', // Placeholder
    ...noteData
  };

  const { data, error } = await supabase
    .from('notes')
    .insert(newNote)
    .select()
    .single();

  if (error) throw error;
  return data as Note;
};

// --- WALLET & TRANSACTIONS ---

export const getWallet = async (): Promise<Wallet | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    // Handle case where wallet might not exist yet (though trigger should handle it)
    console.error('Error fetching wallet:', error);
    return null;
  }
  return data as Wallet;
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data as Transaction[];
};

// --- BOUNTIES ---

export const getBounties = async (): Promise<Bounty[]> => {
  const { data, error } = await supabase
    .from('bounties')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return [];
  return data as Bounty[];
};

export const createBounty = async (unitCode: string, description: string): Promise<Bounty> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();

  const { data, error } = await supabase
    .from('bounties')
    .insert({
      buyer_id: user.id,
      buyer_name: profile?.username || 'Unknown',
      unit_code: unitCode,
      description: description,
      status: 'OPEN'
    })
    .select()
    .single();

  if (error) throw error;
  return data as Bounty;
};

// --- LEADERBOARD & STATS ---

export const getTopSellers = async (): Promise<TopSeller[]> => {
  // In a real app, you'd use a postgres view or RPC for complex aggregation
  // This is a simplified fetch
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, university, reputation_score')
    .order('reputation_score', { ascending: false })
    .limit(3);

  if (error) return [];

  return data.map((p, index) => ({
    id: p.id,
    username: p.username,
    avatar_url: p.avatar_url || 'https://picsum.photos/200',
    university: p.university,
    weekly_earnings: p.reputation_score * 50, // Mock calc based on score
    rank: index + 1
  }));
};

// Mock function for simulating referral (Client-side simulation only)
export const simulateIncomingReferral = async (): Promise<void> => {
  // In production, this happens on the backend via Webhook
  console.log("Referral simulation requires backend logic.");
};

// --- MOCK DATA FOR UI DEVELOPMENT ---

export const MOCK_ADMIN_STATS = {
  platform_revenue: 125400,
  liabilities: 45000,
  pending_payouts_count: 12,
  active_disputes: 3
};

export const MOCK_PAYOUTS: PayoutRequest[] = [
  {
    id: 'txn_8823',
    user_id: 'user_29',
    amount: 4500,
    status: 'PENDING',
    created_at: new Date().toISOString(),
    mpesa_phone: '254799000000'
  },
  {
    id: 'txn_8824',
    user_id: 'user_45',
    amount: 1250,
    status: 'APPROVED',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    mpesa_phone: '254711000000'
  }
];

export const MOCK_NOTES: Note[] = [
  {
    id: 'note_99',
    seller_id: 'user_bad',
    seller_name: 'SuspiciousSeller',
    title: 'Complete Computer Science Degree Notes',
    description: 'All 4 years in one PDF.',
    unit_code: 'CS 100-400',
    university: 'UoN',
    price: 50,
    preview_image: 'https://picsum.photos/400/600?grayscale',
    rating: 1.2,
    review_count: 5,
    file_url: 'https://example.com/blank.pdf'
  },
  {
    id: 'note_100',
    seller_id: 'user_new',
    seller_name: 'Newbie',
    title: 'Calculus III',
    description: 'Empty file uploaded by mistake?',
    unit_code: 'MAT 301',
    university: 'KU',
    price: 100,
    preview_image: 'https://picsum.photos/400/600?blur',
    rating: 0,
    review_count: 0
  }
];

export const MOCK_BOUNTIES: Bounty[] = [
  {
    id: 'b_001',
    buyer_id: 'u_1',
    buyer_name: 'Stacy K.',
    unit_code: 'BIT 2104',
    description: 'Database Management Systems notes for JKUAT 2nd Year',
    status: 'OPEN',
    created_at: new Date().toISOString()
  },
  {
    id: 'b_002',
    buyer_id: 'u_2',
    buyer_name: 'John M.',
    unit_code: 'ECO 101',
    description: 'Introduction to Microeconomics summaries',
    status: 'OPEN',
    created_at: new Date().toISOString()
  },
  {
    id: 'b_003',
    buyer_id: 'u_3',
    buyer_name: 'David O.',
    unit_code: 'SMA 201',
    description: 'Calculus II past papers with answers',
    status: 'FILLED',
    created_at: new Date().toISOString()
  }
];
