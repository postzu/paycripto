'use client';

import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
    arbitrumSepolia,
    optimismSepolia,
    zkSyncSepoliaTestnet,
    sepolia,
    bscTestnet,
    baseSepolia
} from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';
import { defineChain } from 'viem';

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!walletConnectProjectId || walletConnectProjectId === 'demo-project-id') {
    throw new Error(
        'Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID. Configure your own WalletConnect project id to avoid leaking connection metadata.'
    );
}

// Loopring Testnet (Custom Chain Definition)
const loopringTestnet = defineChain({
    id: 5,  // Loopring uses Goerli testnet ID for L2
    name: 'Loopring Testnet',
    nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
    },
    rpcUrls: {
        default: { http: ['https://goerli.loopring.io/rpc'] },
    },
    blockExplorers: {
        default: { name: 'Loopring Explorer', url: 'https://goerli.explorer.loopring.io' },
    },
    testnet: true,
});

const config = getDefaultConfig({
    appName: 'PayCripto',
    projectId: walletConnectProjectId,
    chains: [
        baseSepolia,          // Base Sepolia
        sepolia,              // Ethereum Sepolia
        arbitrumSepolia,      // Arbitrum Sepolia
        optimismSepolia,      // Optimism Sepolia
        zkSyncSepoliaTestnet, // zkSync Era Sepolia
        bscTestnet,           // BSC Testnet (BNB Smart Chain)
        loopringTestnet,      // Loopring Testnet
    ],
    ssr: true,
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider
                    modalSize="compact"
                    locale="pt-BR"
                    initialChain={baseSepolia}
                >
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
