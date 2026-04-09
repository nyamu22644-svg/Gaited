import React, { useState } from 'react';
import { Copy, Gift, Share2, Check, UserPlus } from 'lucide-react';
import { getReferralLink } from '../lib/referral';
import { formatCurrency } from '../lib/utils';
import { simulateIncomingReferral } from '../services/db';

interface ReferralCardProps {
  referralCode?: string;
  totalEarnings?: number;
}

const ReferralCard: React.FC<ReferralCardProps> = ({ referralCode, totalEarnings = 0 }) => {
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const link = getReferralLink(referralCode);

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const text = `Join me on GAITED and get access to top lecture notes! Use my code ${referralCode} to sign up: ${link}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSimulateBonus = async () => {
    setSimulating(true);
    await simulateIncomingReferral();
    window.location.reload();
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-6 border border-slate-200 relative overflow-hidden shadow-sm">
      <div className="absolute -right-6 -top-6 bg-green-200/40 w-32 h-32 rounded-full blur-3xl"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center">
              <Gift className="text-green-600 mr-2" size={20} />
              Invite Friends, Earn Cash
            </h3>
            <p className="text-slate-600 text-sm mt-1">
              Earn <span className="font-bold text-green-700">{formatCurrency(50)}</span> for every friend who buys their first note.
            </p>
          </div>
          {totalEarnings > 0 && (
            <div className="bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg text-right">
              <p className="text-[10px] text-green-700 uppercase tracking-wide">Total Earned</p>
              <p className="text-emerald-600 font-bold">{formatCurrency(totalEarnings)}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-1.5 flex items-center border border-slate-200 mb-4">
          <div className="flex-1 px-3 py-2 overflow-hidden">
            <p className="text-xs text-slate-500 font-mono mb-0.5">YOUR REFERRAL LINK</p>
            <p className="text-slate-700 text-sm font-medium truncate">{link}</p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleCopy}
              className="p-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              title="Copy Link"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
            <button
              onClick={handleShare}
              className="p-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg transition-colors"
              title="Share on WhatsApp"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

        <button
          onClick={handleSimulateBonus}
          disabled={simulating}
          className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center justify-center transition-colors"
        >
          {simulating ? 'Processing Simulation...' : (
            <>
              <UserPlus size={14} className="mr-2" />
              Simulate Friend Purchase (Demo Only)
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ReferralCard;
