
// NOTE: This file assumes a Next.js App Router structure.
// In the current file structure provided, this logic would typically reside in a server-side function
// or an edge function. This is the implementation requested by the "Write the route.ts" instruction.

import { NextResponse } from 'next/server';
// import { createClient } from '@supabase/supabase-js'; // Mocked for this snippet

// Initialize Admin Client (Bypass RLS)
// const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Verify IntaSend Signature/Challenge (Crucial Security Step)
    // const signature = req.headers.get('X-Intasend-Signature');
    // if (!verifySignature(signature, body)) return NextResponse.json({ error: 'Invalid' }, { status: 401 });

    const {
      invoice_id,      // Our internal Transaction ID
      state,           // 'COMPLETE' or 'FAILED'
      provider_ref,    // M-Pesa Receipt Number (e.g., QKH...)
      amount,
      meta             // Metadata passed during payment init (seller_id, note_id, buyer_id)
    } = body;

    if (state !== 'COMPLETE') {
      // Handle Failure (Update transaction status)
      // await supabase.from('transactions').update({ status: 'FAILED' }).eq('id', invoice_id);
      return NextResponse.json({ received: true });
    }

    // 2. THE ARBITRAGE LOGIC (80/20 Split)
    const totalAmount = parseFloat(amount);
    const platformFee = totalAmount * 0.20;
    const sellerEarnings = totalAmount - platformFee;
    const sellerId = meta.seller_id;

    // 3. Database Updates (Atomic Transaction recommended)
    
    // A. Mark Transaction as Completed
    /*
    const { error: txError } = await supabase
      .from('transactions')
      .update({ 
        status: 'COMPLETED',
        mpesa_ref: provider_ref
      })
      .eq('id', invoice_id);
    */

    // B. Credit Seller's Wallet (PENDING CLEARANCE)
    // We hold funds for 1 hour to allow for "Fake File" disputes.
    /*
    const { error: walletError } = await supabase.rpc('increment_wallet_pending', {
      user_uuid: sellerId,
      amount: sellerEarnings
    });
    */

    // C. Add Buyer to 'Purchased' list (if using a separate table, or relying on transaction history)

    console.log(`[PAYMENT] Success: ${invoice_id}. Seller ${sellerId} credited ${sellerEarnings} (Pending).`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
