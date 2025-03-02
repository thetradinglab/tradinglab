import { TestTube } from 'lucide-react';


interface UserStats {
  referrer: string;
  referralCount: bigint;
  totalRewards: bigint;
  isRegistered: boolean;
  isSubscribed: boolean;
  tokenID: bigint;
}

interface ReferralDashboardProps {
  stats: UserStats | null;
  address: string | null;
}

export function ReferralDashboard({ stats, address}: ReferralDashboardProps) {                           
  if (stats && address) {

  }
  return (
    <div className="py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <div className="flex items-center space-x-3 mb-6">
            <TestTube className="w-8 h-8 text-cyan-400" />
            <span className="text-cyan-400 font-mono">TRADING LAB v1.0</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">
            Scientific Trading Analysis & Research Center
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Apply scientific methods to trading. Test hypotheses, analyze data, and develop proven strategies.
          </p>
        </div>
      </div>
    <div className="top-0 right-0 w-1/3 h-full opacity-5">
      <TestTube className="w-full h-full text-cyan-400" />
    </div>
  </div>
  )
}