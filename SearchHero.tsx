
import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, TrendingUp, ChevronDown } from 'lucide-react';
import { UNIVERSITIES } from '../constants';
import { MOCK_BOUNTIES } from '../services/db';

interface SearchHeroProps {
  onSearch: (query: string, university: string) => void;
}

const SearchHero: React.FC<SearchHeroProps> = ({ onSearch }) => {
  const [university, setUniversity] = useState('Kirinyaga University');
  const [query, setQuery] = useState('');
  
  // Auto-suggest State
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredUnis, setFilteredUnis] = useState<string[]>(UNIVERSITIES || []);
  const [isSearching, setIsSearching] = useState(false); // New state to track if user is typing
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filter Logic
  useEffect(() => {
    if (isSearching && university) {
       const filtered = UNIVERSITIES.filter(uni => 
         uni.toLowerCase().includes(university.toLowerCase())
       );
       setFilteredUnis(filtered);
    } else {
       // Show all if not searching (e.g. initial load or just clicked to open)
       setFilteredUnis(UNIVERSITIES || []);
    }
  }, [university, isSearching]);

  // Click Outside Listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const handleUniSelect = (uni: string) => {
    setUniversity(uni);
    setIsSearching(false); // Reset search mode
    setShowSuggestions(false);
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering other clicks
    const newState = !showSuggestions;
    setShowSuggestions(newState);
    if (newState) {
       setIsSearching(false); // Reset filter when explicitly opening dropdown
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, university);
  };

  // Safe fallback for bounties if db hasn't loaded
  const bounties = MOCK_BOUNTIES || [];

  return (
    <div className="bg-green-700 text-white p-6 pb-12 rounded-b-3xl shadow-xl relative">
      {/* Background Pattern - Absolute and Clipped */}
      <div className="absolute inset-0 overflow-hidden rounded-b-3xl">
         <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <div className="absolute right-0 top-0 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
           <div className="absolute left-0 bottom-0 w-48 h-48 bg-yellow-400 rounded-full mix-blend-overlay filter blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>
         </div>
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        <h1 className="text-3xl font-bold mb-2 text-center">Find Lecture Notes</h1>
        <p className="text-green-100 mb-8 text-center text-sm md:text-base">
          Buy & Sell validated exam summaries from top Kenyan universities.
        </p>

        <form onSubmit={handleSubmit} className="bg-white p-2 rounded-2xl shadow-lg flex flex-col md:flex-row gap-2">
          {/* University Auto-Suggest */}
          <div className="relative md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200" ref={wrapperRef}>
            <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input
              type="text"
              value={university}
              onChange={(e) => {
                setUniversity(e.target.value);
                setIsSearching(true);
                setShowSuggestions(true);
              }}
              onFocus={(e) => {
                setShowSuggestions(true);
                e.target.select(); // Auto-select text for easy replacement
                // Do not set isSearching(true) here, keeps full list visible if just clicking
              }}
              className="w-full pl-10 pr-8 py-3 bg-transparent text-gray-900 outline-none font-medium text-sm placeholder-gray-400"
              placeholder="Select University"
              autoComplete="off"
            />
            
            <div 
              onClick={handleChevronClick}
              className="absolute right-0 top-0 h-full px-3 flex items-center justify-center cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
            >
               <ChevronDown size={16} />
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
               <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto z-50">
                  {filteredUnis.length > 0 ? (
                     filteredUnis.map((uni) => (
                       <div 
                         key={uni}
                         onClick={() => handleUniSelect(uni)}
                         className="px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                       >
                         {uni}
                       </div>
                     ))
                  ) : (
                     <div className="px-4 py-3 text-sm text-gray-400 italic">
                        No matches found.
                     </div>
                  )}
               </div>
            )}
          </div>

          {/* Unit Code Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
              placeholder="Enter Unit Code (e.g. SZL 101)"
              className="w-full pl-10 pr-4 py-3 bg-transparent text-gray-900 outline-none font-semibold placeholder-gray-400"
            />
          </div>

          <button 
            type="submit"
            className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors md:w-auto w-full"
          >
            Search
          </button>
        </form>

        {/* Bounties Ticker */}
        <div className="mt-8 overflow-hidden relative h-8">
           <div className="flex items-center space-x-2 absolute animate-marquee whitespace-nowrap hover:paused cursor-default">
             <span className="flex items-center text-xs font-bold text-yellow-300 uppercase tracking-wider pl-4">
               <TrendingUp size={12} className="mr-1" /> Recent Requests:
             </span>
             {/* Triple Loop for smooth marquee even on wide screens */}
             {[...bounties, ...bounties, ...bounties].map((b, i) => (
               <span key={`${b.id}-${i}`} className="text-xs text-green-100 mx-6 opacity-80 flex items-center">
                 <span className="font-bold text-white mr-1">{b.unit_code}</span> needed by {b.buyer_name}
               </span>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default SearchHero;
