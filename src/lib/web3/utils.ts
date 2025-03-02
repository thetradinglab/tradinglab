import { formatEther } from 'viem';

export function formatReward(amount: bigint): string {
  return formatEther(amount);
}

export function calculateReward(amount: bigint, level: number): bigint {
  const rewards = [500n, 300n, 100n]; // 5%, 3%, 1% in basis points
  if (level >= rewards.length) return 0n;
  
  return (amount * rewards[level]) / 10000n;
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}