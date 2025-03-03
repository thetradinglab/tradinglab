//import { useState } from 'react';
import {Wallet, ArrowRight, Info, Shield, Zap } from 'lucide-react';

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
         <div className="container mx-auto px-4 py-8">
          <div className="bg-gray-800 rounded-xl shadow-xl p-8 border border-gray-700 backdrop-blur-sm">
            <div className="text-center mb-8">
              <Wallet className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Connect Your Web3 Wallet</h2>
              <p className="text-gray-300">To access Trading Lab features, please connect a supported Web3 wallet</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-700 p-6 rounded-lg">
                <div className="flex justify-center mb-4">
                  <img src="/api/placeholder/80/80" alt="MetaMask logo" className="rounded-lg" />
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-2">MetaMask</h3>
                <p className="text-gray-300 text-sm">The most popular Ethereum wallet with browser extension and mobile app</p>
              </div>
              
              <div className="bg-gray-700 p-6 rounded-lg">
                <div className="flex justify-center mb-4">
                  <img src="/api/placeholder/80/80" alt="WalletConnect logo" className="rounded-lg" />
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-2">WalletConnect</h3>
                <p className="text-gray-300 text-sm">Connect to mobile wallets by scanning a QR code</p>
              </div>
              
              <div className="bg-gray-700 p-6 rounded-lg">
                <div className="flex justify-center mb-4">
                  <img src="/api/placeholder/80/80" alt="Coinbase Wallet logo" className="rounded-lg" />
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-2">Coinbase</h3>
                <p className="text-gray-300 text-sm">Use your Coinbase Wallet for seamless trading integration</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-cyan-400 rounded-full p-2 mt-1 flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-gray-900" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">Step 1: Install a Web3 Wallet</h4>
                  <p className="text-gray-300">If you don't already have one, install MetaMask or another supported wallet from your browser's extension store or app store.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-cyan-400 rounded-full p-2 mt-1 flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-gray-900" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">Step 2: Create or Import a Wallet</h4>
                  <p className="text-gray-300">Follow the wallet's instructions to create a new wallet or import an existing one. Be sure to securely store your seed phrase.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-cyan-400 rounded-full p-2 mt-1 flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-gray-900" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">Step 3: Connect to Trading Lab</h4>
                  <p className="text-gray-300">Click one of the wallet options above and approve the connection request in your wallet.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-700">
              <div className="flex items-start mb-4">
                <Info className="w-5 h-5 text-cyan-400 mr-2 flex-shrink-0 mt-1" />
                <p className="text-gray-400 text-sm">Your keys always remain secure in your wallet. We never have access to your funds or private keys.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center p-4 bg-gray-700/50 rounded-lg">
                  <Shield className="w-6 h-6 text-cyan-400 mr-3" />
                  <span className="text-gray-300 text-sm">Enhanced security with full ownership</span>
                </div>
                <div className="flex items-center p-4 bg-gray-700/50 rounded-lg">
                  <Zap className="w-6 h-6 text-cyan-400 mr-3" />
                  <span className="text-gray-300 text-sm">Instant access to trading features</span>
                </div>
              </div>
            </div>
          </div>
        </div>
    );
  }
  
  export default GetWallet;