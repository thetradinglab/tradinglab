import { useState, Dispatch, SetStateAction } from 'react';
import { getWalletClient, switchToPolygon } from '../lib/web3/contract';
import { 
  Settings, 
  Users, 
  Wallet,
  BookOpen,
  CreditCard,
  LogOut,
  User
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface WalletConnectProps {
  onConnect: Dispatch<SetStateAction<string | null>>;
}

export function WalletConnect({ onConnect }: WalletConnectProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { name: 'My Modules', href: '/my-modules', icon: BookOpen },
    { name: 'Subscription', href: '/subscription', icon: CreditCard },
    { name: 'Referrals', href: `/referrals`, icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const connectWallet = async () => {
    setLoading(true);
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await switchToPolygon();
      
      const walletClient = getWalletClient();
      const [addr] = await walletClient.getAddresses();
      setAddress(addr);
      onConnect(addr);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <div className="absolute right-0 mt-2 w-48 px-4 py-2 text-sm text-gray-400 bg-[#1A365D] rounded-md shadow-lg">
      Loading...
      </div>
  }
  return (
    <div className="relative">
      {address ? (
        <div>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-cyan-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <User className="w-6 h-6 text-gray-300" />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-[#1A365D] ring-1 ring-black ring-opacity-5 z-50">
              <div className="py-1" role="menu" aria-orientation="vertical">
                {/* Wallet Address */}
                <div className="px-4 py-2 text-sm text-gray-300 border-b border-cyan-900/50">
                  {`${address.slice(0, 6)}...${address.slice(-4)}`}
                </div>

                {/* Menu Items */}
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-cyan-800/50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}

                {/* Logout Option */}
                <button
                  className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-cyan-800/50 transition-colors"
                  onClick={() => {
                    setAddress(null);
                    onConnect(null);
                    setIsMenuOpen(false);
                  }}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={connectWallet}
          disabled={loading}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${
            loading
              ? 'bg-cyan-600 cursor-not-allowed'
              : 'bg-cyan-500 hover:bg-cyan-400'
          } text-white transition-colors`}
        >
          <Wallet className="w-5 h-5" />
          <span>{loading ? 'Connecting...' : 'Connect Wallet'}</span>
        </button>
      )}
      
      {error && (
        <div className="absolute right-0 mt-2 w-48 px-4 py-2 text-sm text-red-400 bg-[#1A365D] rounded-md shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}