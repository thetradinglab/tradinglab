import { useSubscriptionNFT } from '../lib/web3/hooks';
import { renewSubscription } from '../lib/web3/referral';
import { useState } from 'react';

interface Props {
  userAddress: string;
}

export function SubscriptionNFT({ userAddress }: Props) {
  const { nftData, loading } = useSubscriptionNFT(userAddress);
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

  if (loading) return <div>Loading NFT...</div>;
  if (!nftData) return null;

  const timeLeft = nftData.timeUntilExpiry

  return (
    <div className="bg-[#112A45] border border-cyan-900/50 rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">Subscription Status</h3>
      <div className="flex items-center space-x-6">
        {nftData.tokenURI && (
          <img 
            src={nftData.tokenURI} 
            alt="Subscription NFT" 
            className="w-32 h-32 rounded-lg"
          />
        )}
        <div>
          <div className={`text-lg font-medium mb-2 ${
            nftData.isSubscribed ? 'text-green-400' : 'text-red-400'
          }`}>
            {nftData.isSubscribed ? 'Active' : 'Expired'}
          </div>
          {nftData.isSubscribed && (
            <div className="text-gray-300">
              Expires in: {timeLeft.toString()} seconds
            </div>
          )}
        </div>
      </div>
      <div>
        {!nftData.isSubscribed && (
          <button
            onClick={handleRenew}
            disabled={renewing}
            className="mt-4 bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-400 disabled:opacity-50"
          >
            {renewing ? 'Renewing...' : 'Renew Subscription'}
          </button>
        )}
      </div>
    </div>
  );
}