
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import BountyBoard from './pages/BountyBoard';
import AdminDashboard from './pages/AdminDashboard';
import NoteDetail from './pages/NoteDetail';
import SearchHero from './components/SearchHero';
import Leaderboard from './components/Leaderboard';
import OnboardingPage from './pages/OnboardingPage';
import LoginPage from './pages/LoginPage';
import { getNotes, getTopSellers, getCurrentUserProfile } from './services/db';
import { Note, TopSeller, Profile } from './types';
import { formatCurrency } from './lib/utils';
import { ArrowRight } from 'lucide-react';
import { supabase } from './lib/supabaseClient';

const App: React.FC = () => {
  // Routing State
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  // Marketplace State
  const [activeTab, setActiveTab] = useState('home');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Handle Browser Back Button
  useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Auth Listener
  useEffect(() => {
    const checkUser = async () => {
      const profile = await getCurrentUserProfile();
      if (profile) {
        setUser(profile);
        setIsLoggedIn(true);
      } else {
        // If we have a session but no profile (e.g. newly signed up), the trigger in schema.sql should handle creation.
        // But for safety, we check session presence.
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
           // Retry fetching profile after a brief delay for trigger to finish?
           // For now, we assume trigger worked or handle it in Onboarding
           setIsLoggedIn(true);
        }
      }
      setIsLoadingAuth(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        const profile = await getCurrentUserProfile();
        setUser(profile);
        setIsLoggedIn(true);
        navigate(profile?.is_profile_complete ? '/' : '/onboarding');
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setUser(null);
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      Promise.all([
        getNotes(),
        getTopSellers()
      ]).then(([notesData, sellersData]) => {
        setNotes(notesData);
        setFilteredNotes(notesData);
        setTopSellers(sellersData);
      });
    }
  }, [isLoggedIn]);

  // Custom Navigation Function
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  const handleSearch = (query: string, university: string) => {
    const results = notes.filter(n => {
      const matchUni = n.university === university;
      const matchQuery = n.unit_code.includes(query) || n.title.toLowerCase().includes(query.toLowerCase());
      return matchUni && matchQuery;
    });
    setFilteredNotes(results);
    const resultsEl = document.getElementById('results-section');
    resultsEl?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleOnboardingComplete = async () => {
    const profile = await getCurrentUserProfile();
    setUser(profile);
    navigate('/');
  };

  // --- RENDER LOGIC ---

  if (isLoadingAuth) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
  }

  // 1. Auth Check
  if (!isLoggedIn) {
    // Pass empty callback as onAuthStateChange handles logic
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  // 2. Onboarding Check
  // Check if we have user data but profile is incomplete
  if (user && !user.is_profile_complete && currentPath !== '/onboarding') {
     // Force onboarding if logged in but not complete
     // (In a real app, Next.js Middleware handles this URL rewriting)
     return <OnboardingPage onComplete={handleOnboardingComplete} />;
  }
  
  if (currentPath === '/onboarding') {
    return <OnboardingPage onComplete={handleOnboardingComplete} />;
  }

  // 3. Admin Console Route
  if (currentPath === '/admin') {
    if (user?.role !== 'admin') {
      navigate('/'); 
      return null;
    }
    return <AdminDashboard onExit={() => navigate('/')} onLogout={handleLogout} />;
  }

  // 4. Marketplace App Route
  const renderMarketplaceContent = () => {
    if (selectedNote && user) {
      return <NoteDetail note={selectedNote} onBack={() => setSelectedNote(null)} user={user} />;
    }

    if (!user) return null; // Should not happen if isLoggedIn is true

    switch (activeTab) {
      case 'wallet':
        return (
          <DashboardPage 
            navigate={navigate} 
            onLogout={handleLogout} 
            onNoteSelect={setSelectedNote}
            user={user}
          />
        );
      case 'bounties':
        return <BountyBoard />;
      case 'home':
      default:
        return (
          <div className="pb-24">
            <SearchHero onSearch={handleSearch} />

            <div id="results-section" className="px-4 max-w-4xl mx-auto mt-8">
              
              <Leaderboard sellers={topSellers} />

              <div className="flex justify-between items-end mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {filteredNotes.length !== notes.length ? 'Search Results' : 'Trending Notes'}
                </h2>
                <span className="text-xs text-gray-500 font-medium cursor-pointer">View All</span>
              </div>

              {filteredNotes.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                  <p className="text-gray-500">No notes found for this Unit Code.</p>
                  <button onClick={() => setActiveTab('bounties')} className="mt-2 text-green-600 font-bold text-sm">
                    Post a Bounty Request?
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredNotes.map(note => (
                    <div 
                      key={note.id} 
                      onClick={() => setSelectedNote(note)}
                      className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 cursor-pointer hover:shadow-md transition-shadow group"
                    >
                      <div className="w-20 h-24 bg-gray-200 rounded-lg overflow-hidden shrink-0 relative">
                        <img src={note.preview_image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                             <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded uppercase tracking-wider">{note.unit_code}</span>
                             <span className="text-xs text-gray-400 border border-gray-100 px-1 rounded">{note.university}</span>
                          </div>
                          <h3 className="font-semibold text-gray-900 leading-tight mt-1 line-clamp-2">{note.title}</h3>
                        </div>
                        <div className="flex justify-between items-end mt-2">
                          <span className="text-xs text-gray-500 truncate max-w-[100px]">{note.lecturer_name}</span>
                          <span className="font-bold text-gray-900">{formatCurrency(note.price)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {renderMarketplaceContent()}
      {/* Navbar only shows in Marketplace Mode */}
      {!selectedNote && user && (
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
      )}
    </div>
  );
};

export default App;
