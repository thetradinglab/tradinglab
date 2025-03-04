import { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Clock, MessageCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export interface TradingPost {
  id: string;
  type: 'buy' | 'sell' | 'update';
  title: string;
  description: string;
  timestamp: string;
  asset: string;
  price?: string;
  change?: string;
  isPositive?: boolean;
  details?: {
    entryPoint?: string;
    stopLoss?: string;
    takeProfit?: string;
    riskRatio?: string;
    analysis?: string;
    volume?: string;
    marketCap?: string;
    content?: string;
    imageUrl?: string;
    readMoreLink?: string;
  };
}

// Initial posts data store
let posts: TradingPost[] = [];

// Helper function to create a new post with required fields
export function createPost(postData: Omit<TradingPost, 'id' | 'timestamp'>): TradingPost {
  const newPost: TradingPost = {
    id: uuidv4(),
    timestamp: new Date().toLocaleString(),
    ...postData
  };
  
  posts = [newPost, ...posts];
  return newPost;
}

// Get all posts with optional filtering
export function getPosts(filters?: {
  type?: 'buy' | 'sell' | 'update';
  asset?: string;
  limit?: number;
  offset?: number;
}): TradingPost[] {
  let filteredPosts = [...posts];
  
  if (filters?.type) {
    filteredPosts = filteredPosts.filter(post => post.type === filters.type);
  }
  
  if (filters?.asset) {
    filteredPosts = filteredPosts.filter(post => post.asset === filters.asset);
  }
  
  // Apply pagination if specified
  if (filters?.limit !== undefined) {
    const offset = filters.offset || 0;
    filteredPosts = filteredPosts.slice(offset, offset + filters.limit);
  }
  
  return filteredPosts;
}

// Get a single post by ID
export function getPostById(id: string): TradingPost | undefined {
  return posts.find(post => post.id === id);
}

// Update an existing post
export function updatePost(id: string, updates: Partial<Omit<TradingPost, 'id'>>): TradingPost | null {
  const postIndex = posts.findIndex(post => post.id === id);
  
  if (postIndex === -1) {
    return null;
  }
  
  const updatedPost = {
    ...posts[postIndex],
    ...updates
  };
  
  posts[postIndex] = updatedPost;
  return updatedPost;
}

// Delete a post
export function deletePost(id: string): boolean {
  const initialLength = posts.length;
  posts = posts.filter(post => post.id !== id);
  return posts.length < initialLength;
}

// Generate sample posts for testing
export function generateSamplePosts(count: number = 20): TradingPost[] {
  const types: ('buy' | 'sell' | 'update')[] = ['buy', 'sell', 'update'];
  const assets = ['BTC', 'ETH', 'SOL', 'AVAX', 'MATIC'];
  
  // Clear existing posts
  posts = [];
  
  // Generate new sample posts
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const asset = assets[Math.floor(Math.random() * assets.length)];
    const isPositive = Math.random() > 0.5;
    const price = (Math.random() * 1000).toFixed(2);
    
    const updates = [
      'Breaking support levels',
      'Forming bullish pattern',
      'Technical analysis update',
      'Market sentiment shift',
      'Volume spike detected'
    ];
    
    // Generate blog-like content
    const blogContents = [
      `${asset} has been showing remarkable strength in the past 24 hours, with significant buying pressure pushing the price above key resistance levels. The current market structure suggests a potential continuation of this upward momentum.\n\nTechnical indicators are aligning favorably, with the RSI showing strong bullish divergence and MACD crossing above the signal line. Volume analysis confirms genuine interest from institutional buyers.\n\nTraders should watch for consolidation above the current price level as this would confirm the breakout and potentially lead to further gains.`,
      
      `Recent price action for ${asset} indicates a potential reversal of the prevailing trend. After testing critical support at $${(parseFloat(price) * 0.92).toFixed(2)}, the asset has shown signs of exhaustion.\n\nOn-chain metrics reveal decreasing network activity, which often precedes major price movements. Funding rates across major exchanges have flipped negative, suggesting overleveraged long positions.\n\nWhile short-term volatility is expected, the medium-term outlook suggests caution for bulls until confirmation of support holds.`,
      
      `${asset} is currently at a critical juncture as it approaches a major liquidity zone. Historical price data shows this level has acted as both support and resistance multiple times over the past quarter.\n\nMarket sentiment analysis shows retail traders are predominantly bullish, while larger wallets have been gradually distributing. This divergence often precedes significant price discovery.\n\nTraders should pay close attention to the 4-hour timeframe for potential reversal signals before establishing positions.`
    ];
    
    // Select random image from Unsplash based on asset
    const imageUrls = [
      `https://source.unsplash.com/random/1200x800/?cryptocurrency,${asset.toLowerCase()},trading`,
      `https://source.unsplash.com/random/1200x800/?blockchain,${asset.toLowerCase()},finance`,
      `https://source.unsplash.com/random/1200x800/?crypto,${asset.toLowerCase()},technology`
    ];
    
    createPost({
      type,
      title: type === 'update' 
        ? `${asset} ${updates[Math.floor(Math.random() * updates.length)]}` 
        : `${type.toUpperCase()} ${asset}`,
      description: type === 'update'
        ? 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
        : `${type === 'buy' ? 'Long' : 'Short'} position opened at key ${isPositive ? 'support' : 'resistance'} level`,
      asset,
      price: type !== 'update' ? price : undefined,
      change: type !== 'update' ? `${isPositive ? '+' : '-'}${(Math.random() * 5).toFixed(2)}%` : undefined,
      isPositive,
      details: {
        entryPoint: price,
        stopLoss: type === 'buy' 
          ? (parseFloat(price) * 0.95).toFixed(2) 
          : (parseFloat(price) * 1.05).toFixed(2),
        takeProfit: type === 'buy' 
          ? (parseFloat(price) * 1.15).toFixed(2) 
          : (parseFloat(price) * 0.85).toFixed(2),
        riskRatio: '1:3',
        analysis: 'The asset is showing significant momentum with increasing volume. Key resistance levels are being tested with potential for breakout in the next 24-48 hours.',
        volume: `${(Math.random() * 10).toFixed(1)}B`,
        marketCap: `${(Math.random() * 100).toFixed(1)}B`,
        content: blogContents[Math.floor(Math.random() * blogContents.length)],
        imageUrl: imageUrls[Math.floor(Math.random() * imageUrls.length)],
        readMoreLink: `https://example.com/analysis/${asset.toLowerCase()}/${i}`
      }
    });
  }
  
  return posts;
}

function TradingUpdates() {
  const [posts, setPosts] = useState<TradingPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  
  // Initialize with sample data
  useEffect(() => {
    // Generate sample posts for initial display
    generateSamplePosts(20);
    
    // Get the generated posts
    setPosts(getPosts({ limit: 20 }));
  }, []);
  
  const observer = useRef<IntersectionObserver>();
  const lastPostRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setLoading(true);
        // Simulate loading more posts
        setTimeout(() => {
          const currentCount = posts.length;
          generateSamplePosts(currentCount + 10);
          setPosts(getPosts({ limit: currentCount + 10 }));
          setLoading(false);
        }, 1000);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, posts.length]);

  const togglePostExpansion = (postId: string) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

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
              
              {expandedPosts[post.id] && (
                <div className="mt-4 mb-4 bg-[#0A192F]/50 rounded-lg border border-cyan-900/30 overflow-hidden">
                  {/* Featured Image */}
                  {post.details?.imageUrl && (
                    <div className="w-full h-48 md:h-64 overflow-hidden">
                      <img 
                        src={post.details.imageUrl} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                      />
                    </div>
                  )}
                  
                  <div className="p-5">
                    {/* Blog-style content */}
                    <div className="prose prose-invert prose-sm max-w-none mb-6">
                      {post.type !== 'update' && (
                        <div className="grid grid-cols-2 gap-4 mb-6 bg-[#0D2137] p-4 rounded-lg">
                          <div>
                            <p className="text-gray-400 text-xs uppercase font-semibold">Entry Point</p>
                            <p className="font-medium text-lg">${post.details?.entryPoint || post.price}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs uppercase font-semibold">Stop Loss</p>
                            <p className={`font-medium text-lg ${post.type === 'buy' ? 'text-red-400' : 'text-green-400'}`}>
                              ${post.details?.stopLoss}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs uppercase font-semibold">Take Profit</p>
                            <p className={`font-medium text-lg ${post.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                              ${post.details?.takeProfit}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs uppercase font-semibold">Risk/Reward</p>
                            <p className="font-medium text-lg">{post.details?.riskRatio || '1:3'}</p>
                          </div>
                        </div>
                      )}
                      
                      {post.type === 'update' && (
                        <div className="flex flex-wrap gap-4 mb-6 bg-[#0D2137] p-4 rounded-lg">
                          <div className="flex-1 min-w-[120px]">
                            <p className="text-gray-400 text-xs uppercase font-semibold">Market Cap</p>
                            <p className="font-medium text-lg">${post.details?.marketCap || '45.2B'}</p>
                          </div>
                          <div className="flex-1 min-w-[120px]">
                            <p className="text-gray-400 text-xs uppercase font-semibold">24h Volume</p>
                            <p className="font-medium text-lg">${post.details?.volume || '3.8B'}</p>
                          </div>
                        </div>
                      )}
                      
                      <h3 className="text-xl font-bold mb-3 text-cyan-300">Analysis</h3>
                      <p className="mb-4 leading-relaxed">{post.details?.content?.split('\n\n')[0] || 'The asset is showing significant momentum with increasing volume. Key resistance levels are being tested with potential for breakout in the next 24-48 hours.'}</p>
                      
                      {post.details?.content?.split('\n\n')[1] && (
                        <p className="mb-4 leading-relaxed">{post.details.content.split('\n\n')[1]}</p>
                      )}
                      
                      {post.details?.content?.split('\n\n')[2] && (
                        <p className="mb-4 leading-relaxed">{post.details.content.split('\n\n')[2]}</p>
                      )}
                    </div>
                    
                    {/* Read more link */}
                    <a 
                      href={post.details?.readMoreLink || `#post-${post.id}`} 
                      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Read full analysis <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{post.timestamp}</span>
                </div>
                <button 
                  className="hover:text-cyan-400 transition-colors flex items-center space-x-1"
                  onClick={() => togglePostExpansion(post.id)}
                >
                  <span>{expandedPosts[post.id] ? 'Hide details' : 'Show details'}</span>
                  {expandedPosts[post.id] ? 
                    <ChevronUp className="w-4 h-4" /> : 
                    <ChevronDown className="w-4 h-4" />
                  }
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

export default TradingUpdates;