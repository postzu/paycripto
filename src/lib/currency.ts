// Locale to fiat currency mapping
export const localeToCurrency: Record<string, { code: string; symbol: string; name: string }> = {
    'pt-BR': { code: 'BRL', symbol: 'R$', name: 'reais' },
    'en-US': { code: 'USD', symbol: '$', name: 'dollars' },
    'es-ES': { code: 'EUR', symbol: '€', name: 'euros' },
};

// USDT/USDC contract addresses per testnet chain
// Note: Most testnets don't have official USDT, using mock/test tokens
export const USDC_CONTRACTS: Record<number, `0x${string}` | null> = {
    11155111: null,  // Sepolia
    421614: null,    // Arbitrum Sepolia
    11155420: null,  // Optimism Sepolia
    300: null,       // zkSync Era Sepolia
    97: null,        // BSC Testnet
    84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia (Circle USDC)
};

// Testnet chain configurations
export const TESTNET_CHAINS: Record<string, { id: number; name: string; icon: string; nativeSymbol: string }> = {
    sepolia: { id: 11155111, name: 'Sepolia', icon: '🟣', nativeSymbol: 'ETH' },
    arbitrumSepolia: { id: 421614, name: 'Arbitrum Sepolia', icon: '🌀', nativeSymbol: 'ETH' },
    optimismSepolia: { id: 11155420, name: 'Optimism Sepolia', icon: '🔴', nativeSymbol: 'ETH' },
    zkSyncSepolia: { id: 300, name: 'zkSync Era', icon: '⚡', nativeSymbol: 'ETH' },
    bscTestnet: { id: 97, name: 'BSC Testnet', icon: '🟡', nativeSymbol: 'BNB' },
    baseSepolia: { id: 84532, name: 'Base Sepolia', icon: '🟦', nativeSymbol: 'ETH' },
};

const ASSET_PRICE_IDS: Record<string, { id: string; fallback: number }> = {
    ETH: { id: 'ethereum', fallback: 3800 },
    USDC: { id: 'usd-coin', fallback: 1 },
};

// Fetch USDC price in a given fiat currency
export async function fetchUsdcPrice(fiatCode: string): Promise<number> {
    try {
        // Use our own API proxy to avoid CORS issues
        const response = await fetch(
            `/api/prices?ids=usd-coin&vs_currencies=${fiatCode.toLowerCase()}`
        );
        const data = await response.json();
        return data['usd-coin']?.[fiatCode.toLowerCase()] || 1;
    } catch (error) {
        console.error('Failed to fetch USDC price:', error);
        // Fallback: 1 USDC = ~6.0 BRL or 1 USD
        return fiatCode === 'BRL' ? 6.0 : 1.0;
    }
}

// Generic asset price helper for send flow
export async function fetchAssetPrice(assetSymbol: string, fiatCode: string): Promise<number> {
    const asset = ASSET_PRICE_IDS[assetSymbol];
    if (!asset) {
        return 1;
    }

    try {
        const response = await fetch(
            `/api/prices?ids=${asset.id}&vs_currencies=${fiatCode.toLowerCase()}`
        );
        const data = await response.json();
        return data[asset.id]?.[fiatCode.toLowerCase()] || asset.fallback;
    } catch (error) {
        console.error(`Failed to fetch ${assetSymbol} price:`, error);
        return asset.fallback;
    }
}
