'use client';

import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
    base
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
        base,                 // Base Mainnet
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
                    initialChain={base}
                >
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
