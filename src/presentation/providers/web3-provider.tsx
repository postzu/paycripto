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

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!walletConnectProjectId || walletConnectProjectId === 'demo-project-id') {
    throw new Error(
        'Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID. Configure your own WalletConnect project id to avoid leaking connection metadata.'
    );
}

export const config = getDefaultConfig({
    appName: 'PayCripto',
    projectId: walletConnectProjectId,
    chains: [
        baseSepolia,          // Base Sepolia
        sepolia,              // Ethereum Sepolia
        arbitrumSepolia,      // Arbitrum Sepolia
        optimismSepolia,      // Optimism Sepolia
        zkSyncSepoliaTestnet, // zkSync Era Sepolia
        bscTestnet,           // BSC Testnet (BNB Smart Chain)
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
