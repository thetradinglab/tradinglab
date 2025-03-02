import { useState } from 'react';
import { registerUser } from '../lib/web3/referral';
import { Share2, ClipboardCheck, TestTube } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  userAddress: string | null;
}

export function ReferralRegistration({ userAddress }: Props) {
  const [referrerAddress, setReferrerAddress] = useState(() => {
    // Initialize with stored referrer address if available
    return localStorage.getItem('referrer') || '';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const getReferralLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}?ref=${userAddress}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getReferralLink());
      alert('Referral link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await registerUser(referrerAddress || undefined);
      if (result.success) {
        setSuccess(true);
        localStorage.removeItem('referrer');
      } else {
        setError(result.error ? String(result.error) : 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#0A1929] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <TestTube className="mx-auto h-12 w-12 text-cyan-400" />
          <h2 className="mt-6 text-3xl font-bold text-white">
            Join the Research Lab
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Register to access advanced trading research and earn rewards
          </p>
        </div>

        <div className="bg-[#112A45] border border-cyan-900/50 rounded-xl p-6 shadow-xl">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-300">
                  Your Wallet Address
                </label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400">
                  Connected
                </span>
              </div>
              <div className="mt-1 p-3 bg-[#0A1929] rounded-lg border border-cyan-900/30">
                <code className="text-sm text-gray-300 break-all">{userAddress}</code>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Referrer Address (Optional)
              </label>
              <input
                type="text"
                value={referrerAddress}
                onChange={(e) => setReferrerAddress(e.target.value)}
                placeholder="0x..."
                className="mt-1 block w-full rounded-lg border border-cyan-900/30 bg-[#0A1929] text-white px-3 py-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </span>
              ) : (
                'Register'
              )}
            </button>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="space-y-4">
                <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ClipboardCheck className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-400">
                        Successfully registered! Share your referral link:
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getReferralLink()}
                    className="flex-1 rounded-lg border border-cyan-900/30 bg-[#0A1929] text-gray-300 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-cyan-500 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </button>
                </div>

                <Link
                  to="/referrals"
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-cyan-500 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                >
                  Go to Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}