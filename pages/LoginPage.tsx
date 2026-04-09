
import React, { useState } from 'react';
import { Layout, Mail } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 text-center">
        <div className="mb-8 flex flex-col items-center">
          <div className="bg-green-600 p-3 rounded-xl mb-4">
            <Layout className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome to GAITED</h1>
          <p className="text-gray-400 mt-2">The Academic Marketplace for Kenya</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={handleGoogleLogin}
            className="w-full bg-white text-gray-900 font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center"
          >
            <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5 mr-3" />
            Continue with Google
          </button>
          
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-800 px-2 text-gray-400">Or with email</span>
            </div>
          </div>

          {!message ? (
            <form onSubmit={handleEmailLogin} className="space-y-2">
              <input 
                type="email" 
                placeholder="Enter your student email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-900 border border-gray-600 text-white outline-none focus:border-green-500"
                required
              />
              <button 
                 type="submit"
                 disabled={loading}
                 className="w-full bg-gray-700 text-white font-bold py-3 rounded-xl hover:bg-gray-600 transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {loading ? 'Sending Link...' : 'Send Magic Link'}
              </button>
            </form>
          ) : (
            <div className="bg-green-900/30 border border-green-500/30 p-4 rounded-xl text-green-400 flex items-center gap-3 text-left">
              <Mail size={24} />
              <div>
                <p className="font-bold">Check your inbox</p>
                <p className="text-xs opacity-80">{message}</p>
              </div>
            </div>
          )}
        </div>

        <p className="mt-8 text-xs text-gray-500">
          New users will be prompted to complete their seller profile immediately.
          <br/>
          By signing up, you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
