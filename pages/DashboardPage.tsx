
import React, { useEffect, useState } from 'react';
import { getWallet, getTransactions, getNotes, updateUserProfile, createNote } from '../services/db';
import { Wallet, Transaction, Note, Profile } from '../types';
import WalletCard from '../components/WalletCard';
import ReferralCard from '../components/ReferralCard';
import { ShieldCheck, MapPin, Edit, FileText, Package, UploadCloud, Zap, ArrowRight, LayoutDashboard, LogOut, X } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface DashboardPageProps {
  navigate?: (path: string) => void;
  onLogout: () => void;
  onNoteSelect: (note: Note) => void;
  user: Profile;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ navigate, onLogout, onNoteSelect, user }) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [myUploads, setMyUploads] = useState<Note[]>([]);
  const [purchases, setPurchases] = useState<Note[]>([]); 
  const [trendingNotes, setTrendingNotes] = useState<Note[]>([]); 
  const [activeTab, setActiveTab] = useState<'purchases' | 'uploads' | 'bounties'>('uploads');
  const [loading, setLoading] = useState(true);

  // Modals State
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form State
  const [profileForm, setProfileForm] = useState({ username: user.username, mpesa: user.mpesa_number || '' });
  const [uploadForm, setUploadForm] = useState({ title: '', unit_code: '', price: '50' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      getWallet(),
      getTransactions(),
      getNotes()
    ]).then(([wData, tData, nData]) => {
      setWallet(wData);
      setTransactions(tData);
      // In real app, we filter by user_id from the DB query, but here we filter client side for now based on the fetchAll
      setMyUploads(nData.filter(n => n.seller_id === user.id)); 
      // Mocking purchases logic for now as we don't have a purchases table in this snippet
      setPurchases(nData.filter((_, i) => i % 2 !== 0)); 
      setTrendingNotes(nData.filter(n => n.university === user.university).slice(0, 3));
      setLoading(false);
    });
  }, [user]);

  const handleWithdraw = () => {
    alert("Withdrawal modal would open here.");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        await updateUserProfile({ username: profileForm.username, mpesa_number: profileForm.mpesa });
        setShowEditProfile(false);
        // Trigger a reload or callback to update parent state in real app
        window.location.reload(); 
    } catch (e) {
        alert("Error saving profile");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        const newNote = await createNote({
            title: uploadForm.title,
            unit_code: uploadForm.unit_code.toUpperCase(),
            price: Number(uploadForm.price),
            university: user.university
        });
        setMyUploads(prev => [newNote, ...prev]);
        setShowUploadModal(false);
        setUploadForm({ title: '', unit_code: '', price: '50' });
    } catch(e) {
        alert("Error uploading note");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading Dashboard...</div>;
  }

  const maskPhone = (phone?: string) => {
    if (!phone) return 'Not Set';
    return `******${phone.slice(-3)}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-24 relative">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        
        {/* PANIC WIDGET */}
        <div className="mb-8 bg-gradient-to-r from-green-900 to-slate-900 rounded-2xl p-6 border border-green-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap size={120} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 flex items-center">
            <Zap className="text-yellow-400 mr-2" fill="currentColor" />
            Panic Mode: Trending at {user.university}
          </h2>
          <p className="text-green-100 text-sm mb-4">Classmates are buying these right now. Don't fail.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
            {trendingNotes.map(note => (
              <div 
                key={note.id} 
                onClick={() => onNoteSelect(note)}
                className="bg-black/40 backdrop-blur-sm p-3 rounded-xl border border-white/10 hover:bg-black/60 transition-colors cursor-pointer group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-green-400 bg-green-900/50 px-1.5 py-0.5 rounded">{note.unit_code}</span>
                    <h4 className="font-semibold text-white mt-1 text-sm line-clamp-1">{note.title}</h4>
                  </div>
                  <span className="text-white font-bold text-sm">{formatCurrency(note.price)}</span>
                </div>
                <div className="mt-2 flex items-center text-xs text-gray-400 group-hover:text-green-300">
                  Get it now <ArrowRight size={12} className="ml-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-8">Command Center</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-emerald-900/50 to-slate-900"></div>
              
              <div className="relative flex flex-col items-center text-center mt-8">
                <div className="w-24 h-24 rounded-full border-4 border-slate-900 overflow-hidden mb-4 shadow-lg bg-slate-800">
                   {user.avatar_url ? (
                      <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-500">
                        {user.username?.charAt(0)}
                      </div>
                   )}
                </div>
                
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {user.username}
                  {user.is_verified_seller && <ShieldCheck size={18} className="text-emerald-400" />}
                </h2>
                
                <p className="text-slate-400 text-sm mt-1 flex items-center">
                  <MapPin size={12} className="mr-1" />
                  Student at {user.university}
                </p>

                {user.role === 'admin' && (
                  <button 
                    onClick={() => navigate && navigate('/admin')}
                    className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/20 py-2 rounded-lg text-sm font-semibold flex items-center justify-center transition-all shadow-lg shadow-emerald-900/20"
                  >
                    <LayoutDashboard size={14} className="mr-2" />
                    Switch to Admin Console
                  </button>
                )}

                <div className="mt-6 w-full bg-slate-950 p-4 rounded-xl border border-slate-800 text-left">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">M-Pesa Connected</p>
                  <p className="text-slate-300 font-mono tracking-widest">{maskPhone(user.mpesa_number)}</p>
                </div>

                <button 
                  onClick={() => {
                    setProfileForm({ username: user.username, mpesa: user.mpesa_number || '' });
                    setShowEditProfile(true);
                  }}
                  className="mt-6 w-full py-2 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-800 transition-colors flex items-center justify-center"
                >
                  <Edit size={14} className="mr-2" /> Edit Profile
                </button>

                <button 
                  onClick={onLogout}
                  className="mt-3 w-full py-2 border border-red-900/30 bg-red-500/5 text-red-400 rounded-lg text-sm hover:bg-red-500/10 transition-colors flex items-center justify-center"
                >
                  <LogOut size={14} className="mr-2" /> Log Out
                </button>
              </div>
            </div>

            <ReferralCard 
                referralCode={user.referral_code} 
                totalEarnings={wallet?.referral_earnings} 
            />

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-slate-400 text-sm font-medium mb-2">Seller Reputation</h3>
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-white">{user.reputation_score}</span>
                    <span className="text-sm text-slate-500 mb-1">Points</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-3">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Top 15% of sellers this week.</p>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 space-y-8">
            {wallet && <WalletCard 
              wallet={wallet} 
              transactions={transactions} 
              onWithdraw={handleWithdraw} 
            />}

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden min-h-[400px]">
              <div className="flex border-b border-slate-800">
                <button 
                  onClick={() => setActiveTab('uploads')}
                  className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'uploads' ? 'bg-slate-800 text-white border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  My Uploads
                </button>
                <button 
                  onClick={() => setActiveTab('purchases')}
                  className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'purchases' ? 'bg-slate-800 text-white border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  My Purchases
                </button>
                <button 
                  onClick={() => setActiveTab('bounties')}
                  className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'bounties' ? 'bg-slate-800 text-white border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Bounties
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'uploads' && (
                    <div className="space-y-4">
                        {myUploads.length === 0 ? (
                            <div className="text-center py-12">
                                <UploadCloud size={48} className="mx-auto text-slate-700 mb-4" />
                                <p className="text-slate-500">You haven't uploaded any notes yet.</p>
                                <button 
                                  onClick={() => setShowUploadModal(true)}
                                  className="mt-4 text-emerald-400 font-bold text-sm hover:underline"
                                >
                                  Start Selling
                                </button>
                            </div>
                        ) : (
                            <>
                              <button 
                                onClick={() => setShowUploadModal(true)}
                                className="w-full mb-4 py-2 border border-dashed border-slate-700 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-center text-sm"
                              >
                                + Upload New Note
                              </button>
                              {myUploads.map(note => (
                                  <div key={note.id} className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                                      <div className="flex items-center gap-4">
                                          <div className="h-12 w-12 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
                                              <FileText size={20} />
                                          </div>
                                          <div>
                                              <h4 className="text-white font-medium text-sm line-clamp-1">{note.title}</h4>
                                              <p className="text-slate-500 text-xs">{note.unit_code} • {note.university}</p>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <p className="text-white font-bold text-sm">{formatCurrency(note.price)}</p>
                                          <p className="text-emerald-500 text-xs">Sold 12x</p>
                                      </div>
                                  </div>
                              ))}
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'purchases' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         {purchases.map(note => (
                             <div key={note.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                 <div className="aspect-video bg-slate-900 rounded-lg mb-3 relative overflow-hidden group">
                                    <img src={note.preview_image} className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs border border-emerald-500/50">Owned</span>
                                    </div>
                                 </div>
                                 <h4 className="text-white font-medium text-sm truncate">{note.title}</h4>
                                 <button 
                                   onClick={() => onNoteSelect(note)}
                                   className="mt-3 w-full py-2 bg-slate-800 text-white text-xs rounded-lg hover:bg-slate-700 transition-colors"
                                 >
                                   Read Now
                                 </button>
                             </div>
                         ))}
                    </div>
                )}
                
                {activeTab === 'bounties' && (
                    <div className="text-center py-12 text-slate-500">
                        <Package size={48} className="mx-auto text-slate-700 mb-4" />
                        No active bounty requests found.
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditProfile && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 relative">
              <button onClick={() => setShowEditProfile(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
              <h2 className="text-xl font-bold text-white mb-4">Edit Profile</h2>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                     <label className="text-slate-400 text-xs uppercase mb-1 block">Username</label>
                     <input 
                       className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white outline-none focus:border-emerald-500" 
                       value={profileForm.username}
                       onChange={e => setProfileForm({...profileForm, username: e.target.value})}
                       required
                     />
                  </div>
                  <div>
                     <label className="text-slate-400 text-xs uppercase mb-1 block">M-Pesa Number</label>
                     <input 
                       className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white outline-none focus:border-emerald-500" 
                       value={profileForm.mpesa}
                       onChange={e => setProfileForm({...profileForm, mpesa: e.target.value})}
                       required
                     />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl mt-4">
                     {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
              </form>
           </div>
         </div>
      )}

      {/* UPLOAD NOTE MODAL */}
      {showUploadModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 relative">
              <button onClick={() => setShowUploadModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
              <h2 className="text-xl font-bold text-white mb-4">Upload New Note</h2>
              <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                     <label className="text-slate-400 text-xs uppercase mb-1 block">Note Title</label>
                     <input 
                       className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white outline-none focus:border-emerald-500" 
                       placeholder="e.g. Calculus I Mid-Semester Notes"
                       value={uploadForm.title}
                       onChange={e => setUploadForm({...uploadForm, title: e.target.value})}
                       required
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-slate-400 text-xs uppercase mb-1 block">Unit Code</label>
                        <input 
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white outline-none focus:border-emerald-500" 
                            placeholder="SMA 101"
                            value={uploadForm.unit_code}
                            onChange={e => setUploadForm({...uploadForm, unit_code: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <label className="text-slate-400 text-xs uppercase mb-1 block">Price (KES)</label>
                        <input 
                            type="number"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white outline-none focus:border-emerald-500" 
                            value={uploadForm.price}
                            onChange={e => setUploadForm({...uploadForm, price: e.target.value})}
                            required
                        />
                    </div>
                  </div>
                  
                  <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 text-center hover:border-emerald-500/50 transition-colors cursor-pointer bg-slate-950/50">
                     <UploadCloud className="mx-auto text-slate-500 mb-2" />
                     <p className="text-sm text-slate-400">Drag & drop PDF here</p>
                     <p className="text-xs text-slate-600 mt-1">or click to browse</p>
                  </div>

                  <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl mt-4">
                     {isSubmitting ? 'Uploading...' : 'Publish Note'}
                  </button>
              </form>
           </div>
         </div>
      )}
    </div>
  );
};

export default DashboardPage;
