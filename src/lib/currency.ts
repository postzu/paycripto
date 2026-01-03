// Locale to fiat currency mapping
export const localeToCurrency: Record<string, { code: string; symbol: string; name: string }> = {
    'pt-BR': { code: 'BRL', symbol: 'R$', name: 'reais' },
    'en-US': { code: 'USD', symbol: '$', name: 'dollars' },
    'es-ES': { code: 'EUR', symbol: '€', name: 'euros' },
};

// USDC contract addresses per chain
export const USDC_CONTRACTS: Record<number, `0x${string}` | null> = {
    8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base Mainnet (Circle USDC)
};

// Supported chain configurations
export const SUPPORTED_CHAINS: Record<string, { id: number; name: string; icon: string; nativeSymbol: string }> = {
    base: { id: 8453, name: 'Base', icon: '🟦', nativeSymbol: 'ETH' },
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
        if (!response.ok) return fiatCode === 'BRL' ? 6.0 : 1.0;

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
        if (!response.ok) return asset.fallback;

        const data = await response.json();
        return data[asset.id]?.[fiatCode.toLowerCase()] || asset.fallback;
    } catch (error) {
        console.error(`Failed to fetch ${assetSymbol} price:`, error);
        return asset.fallback;
    }
}

// Fetch historical asset price for a specific date (dd-mm-yyyy)
export async function fetchHistoricalAssetPrice(assetSymbol: string, fiatCode: string, date: string): Promise<number> {
    const asset = ASSET_PRICE_IDS[assetSymbol];
    if (!asset) {
        return 1;
    }

    try {
        const response = await fetch(
            `/api/prices?ids=${asset.id}&vs_currencies=${fiatCode.toLowerCase()}&date=${date}`
        );

        if (!response.ok) return asset.fallback;

        const data = await response.json();
        const price = data[asset.id]?.[fiatCode.toLowerCase()];

        // Log for debugging since historical data can be tricky
        console.log(`Historical price for ${assetSymbol} on ${date}: ${price} ${fiatCode}`);

        return price || asset.fallback;
    } catch (error) {
        console.error(`Failed to fetch historical ${assetSymbol} price:`, error);
        return asset.fallback;
    }
}
