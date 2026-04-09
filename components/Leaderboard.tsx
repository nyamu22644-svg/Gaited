import React from 'react';
import { TopSeller } from '../types';
import { formatCurrency } from '../lib/utils';
import { Trophy, Medal, Crown } from 'lucide-react';

interface LeaderboardProps {
  sellers: TopSeller[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ sellers }) => {
  if (sellers.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="text-yellow-500" fill="currentColor" size={20} />
            Top Earners This Week
          </h2>
          <p className="text-xs text-gray-500 mt-1">These sellers are cashing out big time.</p>
        </div>
        <span className="text-xs font-bold bg-green-50 text-green-700 px-2 py-1 rounded-lg">
          Live Rankings
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sellers.slice(0, 3).map((seller, index) => {
          let rankColor = 'bg-gray-50 border-gray-100';
          let icon = <span className="font-bold text-gray-400">#{seller.rank}</span>;

          if (index === 0) {
            rankColor = 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 ring-1 ring-yellow-400/30';
            icon = <Crown className="text-yellow-600" fill="currentColor" size={20} />;
          } else if (index === 1) {
            rankColor = 'bg-gradient-to-br from-gray-50 to-slate-100 border-gray-300';
            icon = <Medal className="text-gray-500" size={20} />;
          } else if (index === 2) {
            rankColor = 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200';
            icon = <Medal className="text-orange-600" size={20} />;
          }

          return (
            <div key={seller.id} className={`relative flex items-center p-4 rounded-xl border ${rankColor} transition-transform hover:-translate-y-1`}>
              <div className="relative mr-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                  <img src={seller.avatar_url} alt={seller.username} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-sm">
                  {icon}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate">{seller.username}</h3>
                <p className="text-xs text-gray-500 truncate">{seller.university}</p>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Earned</p>
                <p className="font-bold text-green-700">{formatCurrency(seller.weekly_earnings)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;
