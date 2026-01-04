import { useAccount, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { AAVE_CONSTANTS, AAVE_DATA_PROVIDER_ABI } from '@/config/aave';
import { useEffect, useMemo, useState } from 'react';

export function useAaveData() {
    const { address } = useAccount();
    const [apiApy, setApiApy] = useState<number | null>(null);

    const { data, isLoading, refetch } = useReadContracts({
        contracts: [
            {
                address: AAVE_CONSTANTS.base.POOL_DATA_PROVIDER,
                abi: AAVE_DATA_PROVIDER_ABI,
                functionName: 'getReserveData',
                args: [AAVE_CONSTANTS.base.USDC_ADDRESS],
            },
            {
                address: AAVE_CONSTANTS.base.POOL_DATA_PROVIDER,
                abi: AAVE_DATA_PROVIDER_ABI,
                functionName: 'getUserReserveData',
                args: [AAVE_CONSTANTS.base.USDC_ADDRESS, address || '0x0000000000000000000000000000000000000000'],
            },
        ],
        query: {
            refetchInterval: 10000, // Refresh every 10s
        }
    });

    const [reserveData, userReserveData] = data || [];

    useEffect(() => {
        let isMounted = true;

        async function fetchAaveApyFromApi() {
            try {
                const response = await fetch('https://yields.llama.fi/pools');
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const payload = await response.json();
                const pools = Array.isArray(payload?.data) ? payload.data : [];
                const match = pools.find((pool: {
                    project?: string;
                    chain?: string;
                    symbol?: string;
                    apy?: number;
                    apyBase?: number;
                    underlyingTokens?: string[];
                }) => {
                    const tokens = pool?.underlyingTokens || [];
                    return pool?.project === 'aave-v3'
                        && pool?.chain === 'Base'
                        && pool?.symbol === 'USDC'
                        && tokens.some((token) => token?.toLowerCase() === AAVE_CONSTANTS.base.USDC_ADDRESS.toLowerCase());
                });

                if (isMounted && match) {
                    const apyValue = typeof match.apyBase === 'number' ? match.apyBase : match.apy;
                    if (typeof apyValue === 'number') {
                        setApiApy(apyValue / 100);
                    }
                }
            } catch {
                // Keep on-chain result if API fails.
            }
        }

        fetchAaveApyFromApi();
        const intervalId = setInterval(fetchAaveApyFromApi, 60_000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    const processedData = useMemo(() => {
        let apy = 0;
        let balance = 0;
        let rawBalance = BigInt("0");

        // Calculate APR from Aave liquidityRate (RAY, 1e27)
        if (reserveData?.result) {
            const liquidityRate = reserveData.result[5];
            const depositAPR = Number(liquidityRate) / 1e27;
            apy = depositAPR;
        }

        if (apy <= 0 && typeof apiApy === 'number') {
            apy = apiApy;
        }

        // Get User Balance
        if (userReserveData?.result) {
            // abi: [currentATokenBalance, currentStableDebt, ...]
            const currentATokenBalance = userReserveData.result[0];
            rawBalance = currentATokenBalance;
            balance = Number(formatUnits(currentATokenBalance, 6)); // USDC has 6 decimals
        }

        return {
            apy,
            balance,
            rawBalance,
        };
    }, [reserveData, userReserveData, apiApy]);

    return {
        ...processedData,
        isLoading,
        refetch,
    };
}
