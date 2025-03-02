import { useState } from 'react';
import {Navigate } from 'react-router-dom';
import { TestTube,  } from 'lucide-react';
import { useSubscriptionNFT } from '../lib/web3/hooks';
import { renewSubscription } from '../lib/web3/referral';

interface UserStats {
  referrer: string;
  referralCount: bigint;
  totalRewards: bigint;
  isRegistered: boolean;
  isSubscribed: boolean;
  tokenID: bigint;
}

interface SubscriptionProps {
  stats: UserStats | null;
  address: string | null;
}
const SubscriptionPage = ({ stats, address}: SubscriptionProps) => {
  if (!address) {
    return <Navigate to="/" />;
  }
  const { nftData, loading } = useSubscriptionNFT(address);

  const [renewing, setRenewing] = useState(false);

  const handleRenew = async () => {
    setRenewing(true);
    try {
      await renewSubscription();
      window.location.reload();
    } catch (err: any) {
      console.error('Failed to renew:', err);
      const errorMessage = err.message?.includes("reason: ") 
        ? err.message.split("reason: ")[1].split('"')[0]
        : "Unknown error occurred";
      alert(`Renewal failed: ${errorMessage}`);
    } finally {
      setRenewing(false);
    }
  };

  if (loading && renewing) {
    return  <div className="container mx-auto px-4 py-8">
    <div className="text-center text-white">Loading...</div>
  </div>
  }
  return (
    <div className="min-h-screen bg-[#0A1929] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <TestTube className="mx-auto h-12 w-12 text-cyan-400" />
          <h2 className="mt-6 text-3xl font-bold text-white">
            Research Lab Subscription
          </h2>
        </div>

        <div className="bg-[#112A45] border border-cyan-900/50 rounded-xl p-6 shadow-xl">
          {!stats?.isRegistered ? (
            <Navigate to="/register"/>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center mb-6">
                <img
                  src={nftData?.tokenURI}
                  alt="Membership NFT"
                  className="w-48 h-48 rounded-lg border-2 border-cyan-500/30"
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#0A1929] rounded-lg border border-cyan-900/30">
                  <span className="text-gray-300">Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    stats?.isSubscribed ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {stats?.isSubscribed ? 'Active' : 'Expired'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#0A1929] rounded-lg border border-cyan-900/30">
                  <span className="text-gray-300">Expires in:</span>
                  <span className="text-cyan-400">
                  {Number(nftData?.timeUntilExpiry) / 86400} days
                  </span>
                </div>

                <button
                  disabled={stats?.isSubscribed}
                  onClick={handleRenew}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {stats?.isSubscribed ? 'Subscription Active' : 'Renew Subscription'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;