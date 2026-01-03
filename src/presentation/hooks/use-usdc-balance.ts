'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { localeToCurrency, fetchUsdcPrice, SUPPORTED_CHAINS } from '@/lib/currency';

interface UseUsdcBalanceReturn {
    usdcBalance: string;
    fiatValue: string;
    fiatSymbol: string;
    fiatCode: string;
    chainName: string;
    chainIcon: string;
    isLoading: boolean;
    error: Error | null;
}

export function useUsdcBalance(locale: string): UseUsdcBalanceReturn {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const [fiatRate, setFiatRate] = useState<number>(1);
    const [isLoadingRate, setIsLoadingRate] = useState(true);

    const fiatInfo = localeToCurrency[locale] || localeToCurrency['en-US'];

    // Get current chain info
    const chainInfo = Object.values(SUPPORTED_CHAINS).find((chain) => chain.id === chainId) || {
        name: 'Unknown',
        icon: '🌐',
    };

    // Use native balance for demo purposes
    const { data: nativeBalance, isLoading: isLoadingBalance, error } = useBalance({
        address,
        chainId,
        query: {
            enabled: isConnected && !!address,
        },
    });

    // Fetch fiat rate
    useEffect(() => {
        async function loadRate() {
            setIsLoadingRate(true);
            const rate = await fetchUsdcPrice(fiatInfo.code);
            setFiatRate(rate);
            setIsLoadingRate(false);
        }
        loadRate();
    }, [fiatInfo.code]);

    // Native balance with 18 decimals
    const balanceValue = nativeBalance ? Number(nativeBalance.value) / 10 ** nativeBalance.decimals : 0;

    // For demo: treat native as 1:1 with USDC
    const usdcBalance = balanceValue.toFixed(4);
    const fiatValue = (balanceValue * fiatRate).toFixed(2);

    return {
        usdcBalance,
        fiatValue,
        fiatSymbol: fiatInfo.symbol,
        fiatCode: fiatInfo.code,
        chainName: chainInfo.name,
        chainIcon: chainInfo.icon,
        isLoading: isLoadingBalance || isLoadingRate,
        error: error as Error | null,
    };
}
