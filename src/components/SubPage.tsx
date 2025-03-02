import SubscriptionPage from './SubscriptionPage'

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

function SubPage({stats, address} : SubscriptionProps) {
  return (
    <SubscriptionPage stats={stats} address={address}></SubscriptionPage>
  )
}

export default SubPage