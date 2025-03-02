import { useSubscriptionNFT } from '../lib/web3/hooks';

interface Props {
  userAddress: string;
}

export function SubscriptionNFT({ userAddress }: Props) {
  const { nftData, loading } = useSubscriptionNFT(userAddress);

  if (loading) return <div>Loading NFT...</div>;
  if (!nftData) return null;

  const timeLeft = nftData.timeUntilExpiry

  return (
    <div>
      <h3 className="text-xl font-bold text-white mb-4">Subscription Status</h3>
      <div className="flex items-center space-x-6">
        <div>
          <div className={`text-lg font-medium mb-2 ${
            nftData.isSubscribed ? 'text-green-400' : 'text-red-400'
          }`}>
            {nftData.isSubscribed ? 'Active' : 'Expired'}
          </div>
          {nftData && (
            <div className="text-gray-300">
              Expires in: {Number(timeLeft) / 86400} days
            </div>
          )}
        </div>
      </div>
      <div>
      </div>
    </div>
  );
}