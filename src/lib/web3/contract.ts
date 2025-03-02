declare global {
  interface Window {
    ethereum: any;
  }
}

import { createPublicClient, http, createWalletClient, custom } from 'viem';
import { polygon } from 'viem/chains';
import { RPC_URL } from './config';
///import { contractABI } from './abi';
export async function switchToPolygon() {
  if (!window.ethereum) throw new Error('No Web3 provider found');

  try {
    // Try to switch to Polygon Amoy
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${polygon.id.toString(16)}` }],
    });
  } catch (switchError: any) {
    // Chain hasn't been added yet
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${polygon.id.toString(16)}`,
          chainName: 'Polygon',
          nativeCurrency: {
            name: 'POL',
            symbol: 'POL',
            decimals: 18
          },
          rpcUrls: [RPC_URL],
          blockExplorerUrls: ['https://polygonscan.com/']
        }],
      });
    } else {
      throw switchError;
    }
  }
}

export const publicClient = createPublicClient({
  chain: polygon,
  transport: http(RPC_URL)
});

export function getWalletClient() {
  if (!window.ethereum) throw new Error('No Web3 provider found');
  
  return createWalletClient({
    chain: polygon,
    transport: custom(window.ethereum)
  });
}