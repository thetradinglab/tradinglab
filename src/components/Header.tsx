import { Dispatch, SetStateAction } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TestTube, BookOpen, BarChart2, Users } from 'lucide-react';
import { WalletConnect } from './WalletConnect';
import { MobileMenu } from './MobileMenu';

//interface UserStats {
//  referrer: string;
//  referralCount: bigint;
//  totalRewards: bigint;
//  isRegistered: boolean;
//  isSubscribed: boolean;
//  tokenID: bigint;
//}

interface HeaderProps {
  onConnectIsAddress: Dispatch<SetStateAction<string | null>>;
  currentAddress: string | null;  // Add this
}

export function Header({ onConnectIsAddress, currentAddress }: HeaderProps) {
  const location = useLocation();
  const isConnected = Boolean(currentAddress);
  
  const navigation = [
    { name: 'Get A Web3 Wallet!', href: '/getwallet', icon: BookOpen, requiresSubscription: false },
    { name: 'Modules', href: '/modules', icon: BookOpen, requiresSubscription: true },
    { name: 'Updates', href: '/updates', icon: BarChart2, requiresSubscription: true},
    { name: 'Users', href: '/users', icon: Users, requiresSubscription: true },
  ];

  return (
<header className="bg-[#112A45] border-b border-cyan-900/50">
  <div className="container mx-auto px-4">
    <div className="flex items-center justify-between h-16">
      {/* Logo - Far Left */}
      <div className="flex-shrink-0 flex items-center space-x-2">
        <TestTube className="w-8 h-8 text-cyan-400" />
        <span className="text-xl font-bold text-white">
          <Link to="/">Trading Lab</Link>
        </span>
      </div>

      {/* Navigation + Wallet - Far Right */}
      <div className="flex items-center justify-end flex-grow">
        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center space-x-8">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  ${location.pathname === item.href
                    ? 'border-cyan-400 text-white'
                    : 'border-transparent hover:border-gray-300 hover:text-gray-100'
                  }
                  ${
                    item.requiresSubscription 
                    ?
                      !isConnected 
                      ? 'pointer-events-none text-gray-300 opacity-50' 
                      : 'text-gray-300'
                    :
                    'cursor-pointer text-green-300'
                  }
                  inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium
                `}
                onClick={(e) => {
                  if (!isConnected) {
                    e.preventDefault();
                  }
                }}
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Wallet Connect - Farthest Right */}
        <div className="flex items-center ml-8">
          <WalletConnect onConnect={onConnectIsAddress} />
          <div className="ml-4 sm:hidden">
            <MobileMenu navigation={navigation} isConnected={isConnected} />
          </div>

        </div>
      </div>
    </div>
  </div>
</header>
  );
}