import React, { useEffect, useState } from 'react';
import { getWallet } from './services/db';
import { Wallet, PayoutRequest } from './types';
import { formatCurrency } from './lib/utils';
import { MINIMUM_WITHDRAWAL } from './constants';
import { ArrowUpRight, Clock, CheckCircle } from 'lucide-react';

const WalletPage: React.FC = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [requestStatus, setRequestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    getWallet().then(data => {
      setWallet(data);
      setLoading(false);
    });
  }, []);

  const handleWithdraw = () => {
    if (!wallet) return;
    const amount = parseFloat(withdrawAmount);
    
    if (isNaN(amount) || amount < MINIMUM_WITHDRAWAL) {
      alert(`Minimum withdrawal is ${formatCurrency(MINIMUM_WITHDRAWAL)}`);
      return;
    }

    if (amount > wallet.current_balance) {
      alert('Insufficient available balance.');
      return;
    }

    // DELIVERABLE 3: "Wallet Logic" (Simulation of backend call)
    // In a real app, this calls supabase.from('payout_requests').insert(...)
    setRequestStatus('success');
    
    // Optimistic Update
    setWallet(prev => prev ? ({
      ...prev,
      current_balance: prev.current_balance - amount
    }) : null);
    
    setWithdrawAmount('');
    setTimeout(() => setRequestStatus('idle'), 3000);
  };

  if (loading || !wallet) return <div className="min-h-screen bg-slate-50 p-8 text-center text-slate-500">Loading wallet...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="p-4 max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">My Wallet</h1>

        {/* Main Balance Card */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-green-100 text-sm font-medium mb-1">Available to Withdraw</p>
          <h2 className="text-4xl font-bold mb-4">{formatCurrency(wallet.current_balance)}</h2>
          
          <div className="flex gap-4 border-t border-green-400/30 pt-4 mt-2">
             <div>
               <p className="text-green-100 text-xs">Total Earned</p>
               <p className="font-semibold text-lg">{formatCurrency(wallet.total_earned)}</p>
             </div>
             <div className="border-l border-green-400/30 pl-4">
               <p className="text-green-100 text-xs">Pending Clearance</p>
               <p className="font-semibold text-lg flex items-center">
                 <Clock size={14} className="mr-1" />
                 {formatCurrency(wallet.pending_clearance)}
               </p>
             </div>
          </div>
        </div>

        {/* Withdrawal Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4">Request Payout</h3>
          <p className="text-sm text-slate-500 mb-4">
            Withdraw funds directly to your M-Pesa. Minimum withdrawal is {formatCurrency(MINIMUM_WITHDRAWAL)}.
          </p>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-3 text-slate-400">KES</span>
              <input 
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="0.00"
              />
            </div>
            <button 
              onClick={handleWithdraw}
              disabled={!wallet.current_balance || wallet.current_balance < MINIMUM_WITHDRAWAL}
              className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              Withdraw
              <ArrowUpRight size={18} className="ml-2" />
            </button>
          </div>
          
          {requestStatus === 'success' && (
            <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm flex items-center">
              <CheckCircle size={16} className="mr-2" />
              Payout requested successfully. Admin will process within 24hrs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
