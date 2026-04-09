
import React from 'react';
import { Home, Wallet, Search, BookOpenCheck } from 'lucide-react';
import { Profile } from '../types';
import Logo from './Logo';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: Profile;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, user }) => {
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50 md:relative md:border-t-0 md:shadow-sm">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between md:justify-start md:space-x-8 items-center h-16">
          
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center w-full md:w-auto p-2 ${activeTab === 'home' ? 'text-green-600' : 'text-gray-500'}`}
          >
            {activeTab === 'home' ? <Logo size={24} /> : <Home size={24} />}
            <span className="text-xs mt-1">Market</span>
          </button>

          <button 
            onClick={() => setActiveTab('bounties')}
            className={`flex flex-col items-center justify-center w-full md:w-auto p-2 ${activeTab === 'bounties' ? 'text-green-600' : 'text-gray-500'}`}
          >
            <Search size={24} />
            <span className="text-xs mt-1">Bounties</span>
          </button>

          <button 
            onClick={() => setActiveTab('study')}
            className={`flex flex-col items-center justify-center w-full md:w-auto p-2 ${activeTab === 'study' ? 'text-green-600' : 'text-gray-500'}`}
          >
            <BookOpenCheck size={24} />
            <span className="text-xs mt-1">Study</span>
          </button>

          <button 
            onClick={() => setActiveTab('wallet')}
            className={`flex flex-col items-center justify-center w-full md:w-auto p-2 ${activeTab === 'wallet' ? 'text-green-600' : 'text-gray-500'}`}
          >
            <Wallet size={24} />
            <span className="text-xs mt-1">Wallet</span>
          </button>

          <div className="hidden md:flex ml-auto items-center space-x-3">
             {user.avatar_url ? (
               <img src={user.avatar_url} alt="Profile" className="w-8 h-8 rounded-full border border-gray-200 object-cover" />
             ) : (
               <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                 {user.username?.charAt(0).toUpperCase()}
               </div>
             )}
             <span className="text-sm font-medium">{user.username}</span>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
