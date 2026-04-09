
import React, { useState, useEffect } from 'react';
import { UNIVERSITIES } from '../constants';
import { User, Smartphone, School, ArrowRight, AlertTriangle } from 'lucide-react';
import { updateUserProfile } from '../services/db';

interface OnboardingPageProps {
  onComplete: () => void;
}

const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    username: '',
    university: '',
    mpesaNumber: ''
  });
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Capture referral code from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateMpesa = (phone: string): string | null => {
    // Remove spaces, dashes
    const clean = phone.replace(/[\s-]/g, '');
    
    // Check formats: 07xx, 01xx, 2547xx
    if (/^(07|01)\d{8}$/.test(clean)) {
      return '254' + clean.substring(1);
    }
    if (/^254(7|1)\d{8}$/.test(clean)) {
      return clean;
    }
    return null; // Invalid
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters.');
      setLoading(false);
      return;
    }

    if (!formData.university) {
      setError('Please select or type your university.');
      setLoading(false);
      return;
    }

    const validPhone = validateMpesa(formData.mpesaNumber);
    if (!validPhone) {
      setError('Invalid M-Pesa Number. Use format 0712345678.');
      setLoading(false);
      return;
    }

    // Save details to the mock database
    updateUserProfile({
        username: formData.username,
        university: formData.university,
        mpesa_number: validPhone,
        is_profile_complete: true,
        // Store the referrer code if present
        referred_by: referralCode || undefined
    });

    setTimeout(() => {
      setLoading(false);
      onComplete();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-green-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-green-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="text-gray-500 text-sm mt-2">
            To buy and sell notes, we need your M-Pesa details for payments.
          </p>
          {referralCode && (
            <div className="mt-2 text-xs bg-indigo-50 text-indigo-600 py-1 px-2 rounded-lg inline-block font-medium border border-indigo-100">
               Invited by user with code: {referralCode}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="e.g. Scholar_Kim"
                required
              />
            </div>
          </div>

          {/* University - Searchable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
            <div className="relative">
              <School className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                list="universities-list"
                name="university"
                value={formData.university}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
                placeholder="Search or Select University..."
              />
              <datalist id="universities-list">
                {UNIVERSITIES.map(uni => (
                  <option key={uni} value={uni} />
                ))}
              </datalist>
            </div>
          </div>

          {/* M-Pesa Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Number</label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                name="mpesaNumber"
                type="tel"
                value={formData.mpesaNumber}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="0712 345 678"
                required
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Used for receiving earnings and receipts.</p>
          </div>

          {error && (
            <div className="flex items-center text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertTriangle size={16} className="mr-2 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors flex justify-center items-center disabled:opacity-70"
          >
            {loading ? 'Saving Profile...' : 'Start Earning'}
            {!loading && <ArrowRight size={18} className="ml-2" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;
