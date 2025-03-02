import { useState, useEffect, useCallback} from 'react';
import { getUserStats, getUserReferrals, getReferralTree, getNFTTokenURI, getNFTSubscriptionStatus, getNFTExpiryTime, getBatchUserStats, getAddress } from './referral';

interface UserStats {
  referrer: string;
  referralCount: bigint;
  totalRewards: bigint;
  isRegistered: boolean;
  isSubscribed: boolean;
  tokenID: bigint;
}

interface ReferralInfo {
  addr: string;
  level:  number;
  rewardsEarned: bigint;
}


export function useUserStats(address: string | null) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch stats function
  const fetchStats = useCallback(async () => {
    if (!address) {
      setLoading(false);
      setStats(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getUserStats(address);
      setStats(data);
    } catch (err) {
      setError(err as Error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Fetch stats when address changes
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);


  return { stats, loading, error };
}
export function useUserReferrals(address: string) {
  const [referrals, setReferrals] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReferrals = useCallback(async () => {
    if (!address) {
      setLoading(false);
      return;
    }

    try {
      const data = await getUserReferrals(address);
      setReferrals(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  return { referrals, loading, error };
}

export function useReferralTree(address: string) {
  const [tree, setTree] = useState<ReferralInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTree = useCallback(async () => {
    if (!address) {
      setLoading(false);
      return;
    }

    try {
      const data = await getReferralTree(address);
      setTree(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  return { tree, loading, error };
}
export function useSubscriptionNFT(address: string | null) {
  const [nftData, setNftData] = useState<{
    timeUntilExpiry: bigint;
    isSubscribed: boolean;
    tokenURI: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    async function fetchNFTData() {
      try {
        const [timeUntilExpiry, isSubscribed, tokenURI] = await Promise.all([
          getNFTExpiryTime(address),
          getNFTSubscriptionStatus(address),
          getNFTTokenURI(address)
        ]);

        setNftData({
          timeUntilExpiry,
          isSubscribed,
          tokenURI,
        });
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchNFTData();

  }, [address]);

  return { nftData, loading, error };
}



export function useBatchUserStats(addresses: string[]) {
  const [stats, setStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const [ data ] = await Promise.all([
        getBatchUserStats(addresses)
      ]);
      console.log(data);
      setStats(data);
    } catch (error) {
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  }, [addresses]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error };
}

export function useGetAddress() {
  const [addr, setAddr] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchAddr = useCallback(async () => {
    try {
      const [data] = await Promise.all([getAddress()]);
      setAddr(data);
    } catch (error) {
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since this seems like a one-time fetch
  
  useEffect(() => {
    fetchAddr();
  }, [fetchAddr]);

  return { addr, loading, error };
}