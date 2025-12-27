// Locale to fiat currency mapping
export const localeToCurrency: Record<string, { code: string; symbol: string; name: string }> = {
    'pt-BR': { code: 'BRL', symbol: 'R$', name: 'Real' },
    'en-US': { code: 'USD', symbol: '$', name: 'Dollar' },
};

// USDT/USDC contract addresses per testnet chain
// Note: Most testnets don't have official USDT, using mock/test tokens
export const USDT_CONTRACTS: Record<number, `0x${string}` | null> = {
    11155111: null,  // Sepolia
    421614: null,    // Arbitrum Sepolia
    11155420: null,  // Optimism Sepolia
    300: null,       // zkSync Era Sepolia
    97: null,        // BSC Testnet
    84532: null,     // Base Sepolia
    5: null,         // Loopring/Goerli
};

// Testnet chain configurations
export const TESTNET_CHAINS: Record<string, { id: number; name: string; icon: string }> = {
    sepolia: { id: 11155111, name: 'Sepolia', icon: '🔷' },
    arbitrumSepolia: { id: 421614, name: 'Arbitrum Sepolia', icon: '🔵' },
    optimismSepolia: { id: 11155420, name: 'Optimism Sepolia', icon: '🔴' },
    zkSyncSepolia: { id: 300, name: 'zkSync Era', icon: '🟣' },
    bscTestnet: { id: 97, name: 'BSC Testnet', icon: '🟡' },
    baseSepolia: { id: 84532, name: 'Base Sepolia', icon: '🔵' },
    loopring: { id: 5, name: 'Loopring', icon: '🔘' },
};

const ASSET_PRICE_IDS: Record<string, { id: string; fallback: number }> = {
    ETH: { id: 'ethereum', fallback: 3800 },
    USDT: { id: 'tether', fallback: 1 },
    USDC: { id: 'usd-coin', fallback: 1 },
};

// Fetch USDT price in a given fiat currency
export async function fetchUsdtPrice(fiatCode: string): Promise<number> {
    try {
        // CoinGecko free API - USDT price
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=${fiatCode.toLowerCase()}`
        );
        const data = await response.json();
        return data.tether?.[fiatCode.toLowerCase()] || 1;
    } catch (error) {
        console.error('Failed to fetch USDT price:', error);
        // Fallback: 1 USDT = ~5.0 BRL or 1 USD
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
            `https://api.coingecko.com/api/v3/simple/price?ids=${asset.id}&vs_currencies=${fiatCode.toLowerCase()}`
        );
        const data = await response.json();
        return data[asset.id]?.[fiatCode.toLowerCase()] || asset.fallback;
    } catch (error) {
        console.error(`Failed to fetch ${assetSymbol} price:`, error);
        return asset.fallback;
    }
}
