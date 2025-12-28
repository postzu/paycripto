'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { createPublicClient, http, formatUnits, Chain } from 'viem';
import {
    arbitrumSepolia,
    optimismSepolia,
    zkSyncSepoliaTestnet,
    sepolia,
    bscTestnet,
    baseSepolia
} from 'viem/chains';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { TESTNET_CHAINS, USDC_CONTRACTS, fetchAssetPrice, fetchUsdcPrice, localeToCurrency } from '@/lib/currency';

const CHAIN_MAP: Record<number, Chain> = {
    [sepolia.id]: sepolia,
    [arbitrumSepolia.id]: arbitrumSepolia,
    [optimismSepolia.id]: optimismSepolia,
    [zkSyncSepoliaTestnet.id]: zkSyncSepoliaTestnet,
    [bscTestnet.id]: bscTestnet,
    [baseSepolia.id]: baseSepolia,
};

type Asset = {
    symbol: string;
    balance: number;
    valueUsdc: number;
    iconColor: string;
};

type NetworkAssets = {
    chainId: number;
    chainName: string;
    chainIcon: string;
    totalValueUsdc: number;
    assets: Asset[];
};

interface AssetsSectionProps {
    address?: `0x${string}`;
}

export function AssetsSection({ address }: AssetsSectionProps) {
    const t = useTranslations('Home.assetsSection');
    const locale = useLocale();
    const fiatInfo = localeToCurrency[locale as string] || localeToCurrency['en-US'];

    const [networkAssets, setNetworkAssets] = useState<NetworkAssets[]>([]);
    const [prices, setPrices] = useState<{ [symbol: string]: number }>({ ETH: 0, BNB: 0, USDC: 1 });
    const [fiatRate, setFiatRate] = useState<number | null>(null);
    const [expandedChainId, setExpandedChainId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSectionExpanded, setIsSectionExpanded] = useState(false);

    // Fetch Prices once
    useEffect(() => {
        const loadPrices = async () => {
            const eth = await fetchAssetPrice('ETH', 'usd');
            const bnb = await fetchAssetPrice('BNB', 'usd');
            setPrices(prev => ({ ...prev, ETH: eth, BNB: bnb }));
        };
        loadPrices();
    }, []);

    useEffect(() => {
        const loadFiatRate = async () => {
            const rate = await fetchUsdcPrice(fiatInfo.code);
            setFiatRate(rate);
        };
        loadFiatRate();
    }, [fiatInfo.code]);

    // Fetch Balances
    useEffect(() => {
        if (!address) return;

        const fetchBalances = async () => {
            setLoading(true);
            // Parallelize requests for better performance
            const promises = Object.values(TESTNET_CHAINS).map(async (chainConfig) => {
                const chainDef = CHAIN_MAP[chainConfig.id];
                if (!chainDef) return null;

                try {
                    const client = createPublicClient({
                        chain: chainDef,
                        transport: http(),
                    });

                    // 1. Native Balance
                    const nativeBalanceWei = await client.getBalance({ address });
                    const nativeBalance = Number(formatUnits(nativeBalanceWei, chainDef.nativeCurrency.decimals));

                    // 2. USDC Balance (if contract exists)
                    let usdcBalance = 0;
                    const usdcContract = USDC_CONTRACTS[chainConfig.id];
                    if (usdcContract) {
                        try {
                            const data = await client.readContract({
                                address: usdcContract,
                                abi: [{
                                    name: 'balanceOf',
                                    type: 'function',
                                    stateMutability: 'view',
                                    inputs: [{ name: 'account', type: 'address' }],
                                    outputs: [{ name: '', type: 'uint256' }],
                                }] as const,
                                functionName: 'balanceOf',
                                args: [address],
                            });
                            usdcBalance = Number(formatUnits(data, 6)); // Assume USDC is 6 decimals
                        } catch (e) {
                            console.warn(`Failed to fetch USDC on ${chainConfig.name}`, e);
                        }
                    }

                    // Calculate Values
                    const nativeSymbol = chainConfig.nativeSymbol;
                    const nativePrice = prices[nativeSymbol] || 0;
                    const nativeValue = nativeBalance * nativePrice;
                    const usdcValue = usdcBalance * 1; // USDC = 1 USD

                    const assets: Asset[] = [];

                    if (nativeValue > 0) {
                        assets.push({
                            symbol: nativeSymbol,
                            balance: nativeBalance,
                            valueUsdc: nativeValue,
                            iconColor: 'bg-white/30',
                        });
                    }

                    if (usdcValue > 0) {
                        assets.push({
                            symbol: 'USDC',
                            balance: usdcBalance,
                            valueUsdc: usdcValue,
                            iconColor: 'bg-white/30',
                        });
                    }

                    // Filter small balances for cleaner UI (User requested > 1 USDC)
                    // We keep the asset if it contributes, but the requirement says "Mostramos apenas ativos com valor acima de 1 USDC"
                    // However, we still want to show the network if TOTAL is > 0? Or strictly per token?
                    // User Rule: "Filtro >= 1 USDC". Assuming per token or total. Let's filter tokens < 1 USDC.
                    const filteredAssets = assets.filter(a => a.valueUsdc >= 1);
                    const filteredTotal = filteredAssets.reduce((acc, curr) => acc + curr.valueUsdc, 0);

                    if (filteredTotal > 0) {
                        return {
                            chainId: chainConfig.id,
                            chainName: chainConfig.name,
                            chainIcon: chainConfig.icon,
                            totalValueUsdc: filteredTotal,
                            assets: filteredAssets,
                        };
                    }
                    return null;

                } catch (error) {
                    console.error(`Error fetching for ${chainConfig.name}`, error);
                    return null;
                }
            });

            const resolved = await Promise.all(promises);
            setNetworkAssets(resolved.filter((r): r is NetworkAssets => r !== null));
            setLoading(false);
        };

        fetchBalances();
    }, [address, prices]); // Re-run if address or prices change

    const formatCurrencyUsd = (val: number) =>
        new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(val);

    const formatNumber = (val: number) =>
        new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(val);

    const formatCurrencyFiat = (val: number) =>
        new Intl.NumberFormat(locale, { style: 'currency', currency: fiatInfo.code }).format(val);

    const totalAssetsUsdc = useMemo(
        () => networkAssets.reduce((acc, network) => acc + network.totalValueUsdc, 0),
        [networkAssets]
    );

    const totalAssetsFiat = useMemo(
        () => (fiatRate !== null ? totalAssetsUsdc * fiatRate : null),
        [totalAssetsUsdc, fiatRate]
    );

    const fiatDisplay =
        totalAssetsUsdc === 0
            ? formatCurrencyFiat(0)
            : totalAssetsFiat !== null
                ? formatCurrencyFiat(totalAssetsFiat)
                : '...';

    const conversionLabel = t('conversionLabel', { currency: fiatInfo.name });

    const handleToggleSection = () => {
        setIsSectionExpanded((prev) => {
            const next = !prev;
            if (!next) {
                setExpandedChainId(null);
            }
            return next;
        });
    };

    if (!address) return null; // Don't show if not connected

    return (
        <div className="space-y-4">
            {/* Header */}
            {/* Header */}
            <button
                onClick={handleToggleSection}
                className={`w-full flex items-center justify-between group py-3 px-1 transition-colors rounded-lg ${isSectionExpanded ? 'bg-white/5' : 'hover:bg-white/5'
                    }`}
            >
                <div className="space-y-1 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-white/90 text-sm font-medium">{t('title')}</h2>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/60">
                            {conversionLabel}:
                            <span className="text-white/80">{fiatDisplay}</span>
                        </span>
                    </div>
                </div>
                <div className={`p-1 rounded-full transition-colors`}>
                    <ChevronDown
                        size={16}
                        strokeWidth={2}
                        className={`text-white/40 transition-transform duration-200 ${isSectionExpanded ? 'rotate-180' : ''}`}
                    />
                </div>
            </button>

            {/* List */}
            <AnimatePresence>
                {isSectionExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-2">
                            {loading && networkAssets.length === 0 ? (
                                <div className="text-center py-4 text-xs text-white/30 animate-pulse">
                                    {t('loading')}
                                </div>
                            ) : networkAssets.length === 0 ? (
                                <div className="p-4 rounded-xl border border-dashed border-white/10 text-center">
                                    <p className="text-xs text-white/40">{t('empty')}</p>
                                </div>
                            ) : (
                                networkAssets.map((network) => (
                                    <div
                                        key={network.chainId}
                                        className="overflow-hidden rounded-xl border border-white/5 bg-white/5"
                                    >
                                        <button
                                            onClick={() => setExpandedChainId(expandedChainId === network.chainId ? null : network.chainId)}
                                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg">{network.chainIcon}</span>
                                                <div className="flex flex-col items-start">
                                                    <span className="text-sm font-medium text-white/90">{network.chainName}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-mono text-white/80">
                                                    {t('estimatedTotal')}: <span className="text-white font-bold">{formatCurrencyUsd(network.totalValueUsdc)}</span>
                                                </span>
                                                <ChevronDown
                                                    size={16}
                                                    strokeWidth={1.75}
                                                    className={`text-white/50 transition-transform duration-200 ${expandedChainId === network.chainId ? 'rotate-180' : ''}`}
                                                />
                                            </div>
                                        </button>

                                        <AnimatePresence>
                                            {expandedChainId === network.chainId && (
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: 'auto' }}
                                                    exit={{ height: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-4 pb-4 pt-0 space-y-3 border-t border-white/5 mt-1">
                                                        {/* Header row for tokens */}
                                                        <div className="flex items-center justify-between text-[10px] uppercase text-white/40 pt-3 px-1">
                                                            <span>{t('token')}</span>
                                                            <span>{t('value')}</span>
                                                        </div>

                                                        {network.assets.map((asset) => (
                                                            <div key={asset.symbol} className="flex items-center justify-between py-1 group">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-2 h-2 rounded-sm ${asset.iconColor}`} />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-medium text-white/90">{asset.symbol}</span>
                                                                        <span className="text-[10px] text-white/50">{formatNumber(asset.balance)} {asset.symbol}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-sm font-mono text-white/80">{formatCurrencyUsd(asset.valueUsdc)}</span>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* Example "View Explorer" link */}
                                                        <div className="pt-2 flex justify-end">
                                                            <a
                                                                href={`${CHAIN_MAP[network.chainId]?.blockExplorers?.default.url}/address/${address}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-white/60 transition-colors"
                                                            >
                                                                {t('viewExplorer')} <ExternalLink size={10} strokeWidth={1.75} />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
