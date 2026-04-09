
import React, { useState, useEffect } from 'react';
import { Note, Profile } from '../types';
import { formatCurrency, generateSecurePreview } from '../lib/utils';
import { Lock, Star, ShieldCheck, AlertCircle, Calendar, User, Eye, X, WifiOff, CheckCircle2 } from 'lucide-react';
import { CommentInput, CommentItem } from '../components/SanitizedComment';
import NoteViewer from '../components/NoteViewer';

interface NoteDetailProps {
  note: Note;
  onBack: () => void;
  user: Profile; // Pass the logged-in user to act as the buyer
}

const NoteDetail: React.FC<NoteDetailProps> = ({ note, onBack, user }) => {
  const [isPurchased, setIsPurchased] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFullView, setShowFullView] = useState(false);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  
  // State for the generated secure preview
  const [securePreviewUrl, setSecurePreviewUrl] = useState<string | null>(null);

  // Dispute Modal State
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  // Generate the blurred preview on mount
  useEffect(() => {
    let isMounted = true;
    generateSecurePreview(note.preview_image).then((url) => {
      if (isMounted) setSecurePreviewUrl(url);
    });
    return () => { isMounted = false; };
  }, [note.preview_image]);

  const handlePurchase = async () => {
    setIsProcessing(true);
    
    // Simulating M-Pesa STK Push
    setTimeout(async () => {
      setIsPurchased(true);
      setIsProcessing(false);
      setShowFullView(true);
      
      // OFFLINE CACHING LOGIC
      if ('caches' in window && note.file_url) {
        try {
          const cache = await caches.open('gaited-purchased-notes-v1');
          const response = await fetch(note.file_url, { mode: 'cors' });
          if (response.ok) {
            await cache.put(note.file_url, response);
            setIsOfflineReady(true);
          }
        } catch (err) {
          console.error('Failed to cache note for offline usage:', err);
        }
      }
    }, 2000);
  };

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDisputeSubmitting(true);
    
    // Simulate API submission
    setTimeout(() => {
      setDisputeSubmitting(false);
      setShowDisputeModal(false);
      alert("Dispute filed successfully. The transaction has been flagged for admin review.");
      setDisputeReason('');
    }, 1500);
  };

  return (
    <div className="bg-white min-h-screen pb-24 relative">
      {/* Sticky Header */}
      <div className="p-4 border-b border-gray-100 flex items-center sticky top-0 bg-white/95 backdrop-blur z-20 shadow-sm">
        <button onClick={onBack} className="text-gray-500 mr-4 hover:bg-gray-100 p-1 rounded-full">← Back</button>
        <span className="font-semibold text-gray-800 truncate flex-1">{note.unit_code}</span>
        {isPurchased && (
          <div className="flex items-center space-x-2">
            {isOfflineReady && (
              <span className="hidden sm:flex items-center text-[10px] text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full border border-green-100">
                <WifiOff size={10} className="mr-1" /> Offline Ready
              </span>
            )}
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold flex items-center">
              <CheckCircle2 size={12} className="mr-1"/> OWNED
            </span>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto p-4 grid md:grid-cols-3 gap-8">
        
        {/* Left Col: Document Viewer */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Quality Control Metadata */}
          <div className="bg-blue-50 p-4 rounded-lg flex flex-wrap gap-4 text-sm text-blue-900 border border-blue-100">
             <div className="flex items-center">
               <User size={16} className="mr-1 opacity-70" />
               <span className="font-semibold mr-1">Lecturer:</span> {note.lecturer_name || 'Not Listed'}
             </div>
             <div className="flex items-center">
               <Calendar size={16} className="mr-1 opacity-70" />
               <span className="font-semibold mr-1">Semester:</span> {note.semester || 'N/A'}
             </div>
          </div>

          <div className="relative bg-gray-100 rounded-xl overflow-hidden border border-gray-200 min-h-[400px]">
             
             {/* CONDITIONAL RENDERING: Preview vs DRM Viewer */}
             {isPurchased && showFullView && note.file_url ? (
               <NoteViewer 
                 fileUrl={note.file_url} 
                 buyerName={user.username} 
                 buyerPhone={user.mpesa_number || '07XX'} 
                 textContent={note.text_content}
               />
             ) : (
               <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-200 min-h-[400px]">
                  {/* Generated Secure Preview Image */}
                  {securePreviewUrl ? (
                    <img 
                      src={securePreviewUrl} 
                      alt="Secure Preview" 
                      className="w-full h-full object-cover opacity-90 transition-opacity duration-500" 
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400 animate-pulse">
                      <Eye size={32} className="mb-2" />
                      <span className="text-xs">Generating Secure Preview...</span>
                    </div>
                  )}
                  
                  {/* Lock Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-10 p-6 backdrop-blur-[1px]">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl text-center max-w-xs w-full transform transition-transform hover:scale-105">
                      <Lock size={32} className="mx-auto text-green-600 mb-3" />
                      <h3 className="font-bold text-gray-900 mb-1">Unlock {note.unit_code}</h3>
                      <p className="text-xs text-gray-500 mb-4">
                        Secure M-Pesa payment. Funds held in escrow for 1 hour.
                      </p>
                      <button 
                        onClick={handlePurchase}
                        disabled={isProcessing}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-70 text-sm flex items-center justify-center"
                      >
                        {isProcessing ? (
                           <>
                             <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                             Processing...
                           </>
                        ) : (
                           `Pay ${formatCurrency(note.price)} Now`
                        )}
                      </button>
                      
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                         <ShieldCheck size={12} className="mr-1" />
                         100% Money Back Guarantee if blank.
                      </div>
                    </div>
                  </div>
               </div>
             )}

          </div>

          {/* Q&A Section */}
          <div className="pt-8 border-t border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Public Q&A</h3>
            <div className="space-y-4 mb-6">
              <CommentItem 
                username="Student_001" 
                timestamp="2 days ago" 
                content="Is this readable on mobile?" 
              />
              <CommentItem 
                username={note.seller_name} 
                timestamp="1 day ago" 
                content="Yes, check the preview. It is handwritten but scanned in HD." 
                isSeller={true}
              />
            </div>
            <CommentInput onSubmit={(text) => console.log('Submit comment:', text)} />
          </div>
        </div>

        {/* Right Col: Stats & Actions */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
             <h1 className="text-xl font-bold text-gray-900 mb-2">{note.title}</h1>
             
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">
                 <Star size={16} fill="currentColor" />
                 <span className="ml-1 font-bold text-sm">{note.rating}</span>
               </div>
               <span className="text-xs text-gray-400">{note.review_count} verified reviews</span>
             </div>
             
             <div className="space-y-3 pt-4 border-t border-gray-100">
               <div className="flex justify-between text-sm">
                 <span className="text-gray-500">Unit Code</span>
                 <span className="font-mono font-medium text-gray-900">{note.unit_code}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-gray-500">Seller</span>
                 <span className="font-medium text-green-700">{note.seller_name}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-gray-500">University</span>
                 <span className="font-medium text-gray-900">{note.university}</span>
               </div>
             </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl text-xs text-gray-500 space-y-2">
            <h4 className="font-bold text-gray-700 flex items-center">
              <AlertCircle size={14} className="mr-2" />
              Buyer Protection
            </h4>
            <p>1. Payment is held in our Escrow wallet.</p>
            <p>2. You have 1 hour to verify file contents.</p>
            <p>3. Use "Report Issue" if file is blank or fake.</p>
          </div>

          {isPurchased && (
            <button 
              onClick={() => setShowDisputeModal(true)}
              className="w-full bg-red-50 text-red-600 py-2 rounded-lg text-sm font-medium border border-red-100 hover:bg-red-100 transition-colors"
            >
              Report Problem (Dispute)
            </button>
          )}
        </div>

      </div>

      {/* DISPUTE MODAL */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowDisputeModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            
            <div className="flex items-center gap-2 mb-6 text-red-600">
               <AlertCircle size={24} />
               <h2 className="text-xl font-bold text-gray-900">Report Issue</h2>
            </div>

            <form onSubmit={handleDisputeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Dispute</label>
                <select 
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  required
                >
                  <option value="">Select a reason...</option>
                  <option value="blank">File is blank or empty</option>
                  <option value="fake">Content does not match title</option>
                  <option value="quality">Unreadable / Poor Quality</option>
                  <option value="copyright">Copyright Violation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 h-24 resize-none"
                  placeholder="Please provide details regarding the issue..."
                  required
                />
              </div>

              <div className="bg-red-50 p-3 rounded-lg flex gap-3 text-xs text-red-800">
                 <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                 <p>Funds will be frozen in Escrow. The Admin will review the file and your claim within 24 hours.</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="flex-1 py-3 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={disputeSubmitting}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-70 flex justify-center items-center"
                >
                  {disputeSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default NoteDetail;
