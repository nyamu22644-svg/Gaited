
import React, { useState } from 'react';
import { Layout, Mail, User } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { UNIVERSITIES } from '../constants';
import { Profile } from '../types';

interface LoginPageProps {
  onLoginSuccess: (profile?: Profile) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestUniversity, setGuestUniversity] = useState('');

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) alert(error.message);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) {
      alert(error.message);
    } else {
      setMessage('Check your email for the magic link!');
    }
  };

  const handleGuestContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const profile: Profile = {
      id: `guest_${Date.now()}`,
      username: guestName.trim() || 'Student',
      avatar_url: '',
      university: guestUniversity.trim() || 'Independent',
      campus: '',
      is_verified_seller: false,
      reputation_score: 0,
      is_profile_complete: true,
      role: 'user'
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('gaited.guest.user', JSON.stringify(profile));
    }

    onLoginSuccess(profile);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-green-200/40 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-emerald-200/40 blur-3xl" />

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 text-center relative">
        <div className="mb-8 flex flex-col items-center">
          <div className="bg-green-600 p-3 rounded-xl mb-4">
            <Layout className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to GAITED</h1>
          <p className="text-slate-600 mt-2">Your exam-ready study engine.</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={handleGoogleLogin}
            className="w-full bg-white text-slate-900 font-bold py-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center"
          >
            <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5 mr-3" />
            Continue with Google
          </button>
          
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">Or with email</span>
            </div>
          </div>

          {!message ? (
            <form onSubmit={handleEmailLogin} className="space-y-2">
              <input 
                type="email" 
                placeholder="Enter your student email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:border-green-500"
                required
              />
              <button 
                 type="submit"
                 disabled={loading}
                 className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {loading ? 'Sending Link...' : 'Send Magic Link'}
              </button>
            </form>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-700 flex items-center gap-3 text-left">
              <Mail size={24} />
              <div>
                <p className="font-bold">Check your inbox</p>
                <p className="text-xs opacity-80">{message}</p>
              </div>
            </div>
          )}

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">Guest mode</span>
            </div>
          </div>

          <form onSubmit={handleGuestContinue} className="space-y-2 text-left">
            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3 py-2">
              <User className="text-slate-400" size={16} />
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Your name"
                className="flex-1 bg-transparent text-slate-900 text-sm outline-none"
              />
            </div>
            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-3 py-2">
              <input
                list="guest-uni-list"
                value={guestUniversity}
                onChange={(e) => setGuestUniversity(e.target.value)}
                placeholder="University (optional)"
                className="flex-1 bg-transparent text-slate-900 text-sm outline-none"
              />
              <datalist id="guest-uni-list">
                {UNIVERSITIES.map(uni => (
                  <option key={uni} value={uni} />
                ))}
              </datalist>
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors"
            >
              Continue as Guest (Study Only)
            </button>
          </form>
        </div>

        <p className="mt-8 text-xs text-slate-500">
          New users will be prompted to complete their seller profile immediately.
          <br/>
          By signing up, you agree to our Terms of Service.
          <br/>
          Made with love by Edgait.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
