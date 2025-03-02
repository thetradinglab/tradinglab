import { useState, useRef, useCallback } from 'react';
import { ArrowUpRight, ArrowDownRight, Clock, MessageCircle, ChevronDown } from 'lucide-react';

interface TradingPost {
  id: number;
  type: 'buy' | 'sell' | 'update';
  title: string;
  description: string;
  timestamp: string;
  asset: string;
  price?: string;
  change?: string;
  isPositive?: boolean;
}

//interface UserStats {
//  referrer: string;
//  referralCount: bigint;
//  totalRewards: bigint;
//  isRegistered: boolean;
//  isSubscribed: boolean;
//  tokenID: bigint;
//}

//interface TradingProps {
//  stats: UserStats | null;
//  address: string | null;
//}

function TradingUpdates() {
  const [posts, setPosts] = useState<TradingPost[]>(() => 
    Array.from({ length: 20 }, (_, i) => generatePost(i))
  );
  const [loading, setLoading] = useState(false);
  const observer = useRef<IntersectionObserver>();
  const lastPostRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setLoading(true);
        // Simulate loading more posts
        setTimeout(() => {
          setPosts(prev => [...prev, ...Array.from({ length: 10 }, (_, i) => generatePost(prev.length + i))]);
          setLoading(false);
        }, 1000);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading]);

  return (
    <div className="min-h-screen bg-[#0A192F] text-white">

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {posts.map((post, index) => (
            <div
              key={post.id}
              ref={index === posts.length - 1 ? lastPostRef : undefined}
              className="bg-[#112A45] border border-cyan-900/50 rounded-xl p-6 transition-transform hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    {post.type === 'buy' && <ArrowUpRight className="w-5 h-5 text-green-400" />}
                    {post.type === 'sell' && <ArrowDownRight className="w-5 h-5 text-red-400" />}
                    {post.type === 'update' && <MessageCircle className="w-5 h-5 text-cyan-400" />}
                    <span className="text-lg font-bold">{post.title}</span>
                  </div>
                  <p className="text-gray-400">{post.description}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm text-gray-400">{post.asset}</span>
                    {post.price && (
                      <span className="font-mono">${post.price}</span>
                    )}
                  </div>
                  {post.change && (
                    <div className={`text-sm ${post.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {post.change}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{post.timestamp}</span>
                </div>
                <button className="hover:text-cyan-400 transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Helper function to generate mock posts
function generatePost(id: number): TradingPost {
  const types: ('buy' | 'sell' | 'update')[] = ['buy', 'sell', 'update'];
  const assets = ['BTC', 'ETH', 'SOL', 'AVAX', 'MATIC'];
  const type = types[Math.floor(Math.random() * types.length)];
  const asset = assets[Math.floor(Math.random() * assets.length)];
  const isPositive = Math.random() > 0.5;

  const updates = [
    'Breaking support levels',
    'Forming bullish pattern',
    'Technical analysis update',
    'Market sentiment shift',
    'Volume spike detected'
  ];

  return {
    id,
    type,
    title: type === 'update' 
      ? `${asset} ${updates[Math.floor(Math.random() * updates.length)]}` 
      : `${type.toUpperCase()} ${asset}`,
    description: type === 'update'
      ? 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
      : `${type === 'buy' ? 'Long' : 'Short'} position opened at key ${isPositive ? 'support' : 'resistance'} level`,
    timestamp: new Date(Date.now() - Math.random() * 86400000).toLocaleString(),
    asset,
    price: type !== 'update' ? (Math.random() * 1000).toFixed(2) : undefined,
    change: type !== 'update' ? `${isPositive ? '+' : '-'}${(Math.random() * 5).toFixed(2)}%` : undefined,
    isPositive
  };
}

export default TradingUpdates;