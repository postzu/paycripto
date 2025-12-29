// src/lib/wallet.ts
import { ethers } from "ethers";

declare global {
    interface Window {
        ethereum?: EthereumProvider;
    }
}

interface EthereumProvider {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on?: (event: string, callback: (...args: unknown[]) => void) => void;
    removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
    isMetaMask?: boolean;
    isRabby?: boolean;
}

export class WalletNotFoundError extends Error {
    constructor() {
        super('Carteira não encontrada. Abra via MetaMask/Rabby.');
        this.name = 'WalletNotFoundError';
    }
}

export class WrongNetworkError extends Error {
    constructor() {
        super('Troque a rede para Base na carteira e tente novamente.');
        this.name = 'WrongNetworkError';
    }
}

const BASE_CHAIN_ID = 8453;
const BASE_CHAIN_ID_HEX = '0x2105';

// Base Mainnet chain configuration for adding the network
const BASE_CHAIN_CONFIG = {
    chainId: BASE_CHAIN_ID_HEX,
    chainName: 'Base',
    nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
    },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org']
};

/**
 * Gets an ethers Signer connected to Base network.
 * Will prompt user to switch networks if needed.
 */
export async function getBaseSigner(): Promise<ethers.JsonRpcSigner> {
    if (!window.ethereum) {
        throw new WalletNotFoundError();
    }

    const provider = new ethers.BrowserProvider(window.ethereum);

    // Request account access first
    try {
        await provider.send('eth_requestAccounts', []);
    } catch (error: unknown) {
        const err = error as Record<string, unknown>;
        if (err?.code === 4001) {
            throw new Error('Você precisa autorizar a conexão com a carteira.');
        }
        throw error;
    }

    // Check current network
    const network = await provider.getNetwork();
    const currentChainId = Number(network.chainId);

    if (currentChainId !== BASE_CHAIN_ID) {
        // Try to switch to Base network
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: BASE_CHAIN_ID_HEX }]
            });
        } catch (switchError: unknown) {
            const err = switchError as Record<string, unknown>;

            // Error 4902 means the chain hasn't been added to the wallet
            if (err?.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [BASE_CHAIN_CONFIG]
                    });
                } catch {
                    throw new WrongNetworkError();
                }
            } else if (err?.code === 4001) {
                // User rejected the switch
                throw new WrongNetworkError();
            } else {
                throw new WrongNetworkError();
            }
        }

        // Re-create provider after network switch
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        return newProvider.getSigner();
    }

    return provider.getSigner();
}
