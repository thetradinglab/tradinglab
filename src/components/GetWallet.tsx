//import { useState } from 'react';

interface UserStats {
    referrer: string;
    referralCount: bigint;
    totalRewards: bigint;
    isRegistered: boolean;
    isSubscribed: boolean;
    tokenID: bigint;
  }
  
  interface GetWalletProps {
    stats: UserStats | null;
    address: string | null;
  }
  
  function GetWallet({stats, address}: GetWalletProps) {
    //const [currentModule, setCurrentModule] = useState(0);
    stats
    address
    return (
         <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                How to connect your function 
          </div>
        </main>
    );
  }
  
  export default GetWallet;