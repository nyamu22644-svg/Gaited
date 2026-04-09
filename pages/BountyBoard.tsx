
import React, { useEffect, useState } from 'react';
import { Bounty } from '../types';
import { getBounties, createBounty } from '../services/db';
import { PlusCircle, Search, X } from 'lucide-react';

const BountyBoard: React.FC = () => {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showPostModal, setShowPostModal] = useState(false);
  const [form, setForm] = useState({ unit_code: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getBounties().then(data => {
      setBounties(data);
      setLoading(false);
    });
  }, []);

  const handlePostBounty = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const newBounty = await createBounty(form.unit_code.toUpperCase(), form.description);
    setBounties(prev => [newBounty, ...prev]);
    setSubmitting(false);
    setShowPostModal(false);
    setForm({ unit_code: '', description: '' });
  };

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6 pb-24 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bounty Board</h1>
          <p className="text-gray-500 text-sm">Earn money by fulfilling specific requests.</p>
        </div>
        <button 
          onClick={() => setShowPostModal(true)}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-gray-800 transition-colors"
        >
          <PlusCircle size={16} className="mr-2" />
          Post Request
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search by Unit Code (e.g. SMA 2101)..." 
          className="w-full pl-10 p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading bounties...</div>
      ) : (
        <div className="space-y-4">
          {bounties.map(bounty => (
            <div key={bounty.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                  {bounty.unit_code}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${bounty.status === 'OPEN' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  {bounty.status}
                </span>
              </div>
              <h3 className="mt-2 font-medium text-gray-900">Requested by {bounty.buyer_name}</h3>
              <p className="text-gray-600 text-sm mt-1">{bounty.description}</p>
              
              {bounty.status === 'OPEN' && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                   <button className="text-sm text-green-600 font-medium hover:underline">
                     I have these notes (Upload)
                   </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* POST MODAL */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-white w-full max-w-md rounded-2xl p-6 relative shadow-2xl">
             <button onClick={() => setShowPostModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
               <X size={24} />
             </button>
             <h2 className="text-xl font-bold mb-4">Request Notes</h2>
             <form onSubmit={handlePostBounty} className="space-y-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Unit Code</label>
                   <input 
                     className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                     placeholder="e.g. HMP 100"
                     value={form.unit_code}
                     onChange={e => setForm({...form, unit_code: e.target.value})}
                     required
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                   <textarea 
                     className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 resize-none h-24"
                     placeholder="What exactly do you need? (e.g. Chapter 4 Summaries)"
                     value={form.description}
                     onChange={e => setForm({...form, description: e.target.value})}
                     required
                   />
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
                   You will be notified via SMS when a seller fulfills this request.
                </div>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-70"
                >
                  {submitting ? 'Posting...' : 'Post Request'}
                </button>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default BountyBoard;
