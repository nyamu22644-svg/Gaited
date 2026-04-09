import React from 'react';
import { Wallet, Transaction } from '../types';
import { formatCurrency } from '../lib/utils';
import { ArrowUpRight, TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface WalletCardProps {
  wallet: Wallet;
  transactions: Transaction[];
  onWithdraw: () => void;
}

const WalletCard: React.FC<WalletCardProps> = ({ wallet, transactions, onWithdraw }) => {
  const canWithdraw = wallet.current_balance >= 200;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-slate-500 text-sm font-medium">Available Balance</p>
          <h2 className="text-4xl font-bold text-green-600 mt-1">
            {formatCurrency(wallet.current_balance)}
          </h2>
        </div>
        <button
          onClick={onWithdraw}
          disabled={!canWithdraw}
          className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center transition-all ${
            canWithdraw
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200/40'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          Withdraw
          <ArrowUpRight size={16} className="ml-2" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <p className="text-slate-500 text-xs uppercase tracking-wider">Total Earned</p>
          <p className="text-slate-900 font-semibold text-lg">{formatCurrency(wallet.total_earned)}</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <p className="text-slate-500 text-xs uppercase tracking-wider">Pending</p>
          <p className="text-amber-600 font-semibold text-lg flex items-center">
            <Clock size={14} className="mr-1" />
            {formatCurrency(wallet.pending_clearance)}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-slate-700 text-sm font-bold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {transactions.map(tx => (
            <div key={tx.id} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
              <div className="flex items-center">
                <div className={`p-2 rounded-full mr-3 ${
                  tx.type === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                }`}>
                  {tx.type === 'CREDIT' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-medium">{tx.description}</p>
                  <p className="text-slate-500 text-xs">{new Date(tx.date).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`font-bold text-sm ${
                tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-700'
              }`}>
                {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WalletCard;
