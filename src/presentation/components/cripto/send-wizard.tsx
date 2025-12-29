'use client';

import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Coins, Wallet, AlertCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { fetchAssetPrice, localeToCurrency } from '@/lib/currency';
import { SelectedRecipient } from './types';
import { usePublicClient } from 'wagmi';
import { sendUsdcOnBase } from '@/lib/sendUsdcBase';
import { translateWeb3Error, FriendlyError } from '@/lib/web3-errors';

// Supported assets mock
const ASSETS = [
    { symbol: 'ETH', name: 'Ethereum', icon: 'ETH' },
    { symbol: 'USDC', name: 'USD Coin', icon: 'USDC' },
];

// Network icons
const NETWORKS: Record<number, { name: string; icon: string }> = {
    11155111: { name: 'Ethereum', icon: 'ETH' },
    421614: { name: 'Arbitrum', icon: 'ARB' },
    11155420: { name: 'Optimism', icon: 'OPT' },
    300: { name: 'zkSync Era', icon: 'ZK' },
    97: { name: 'BSC', icon: 'BSC' },
    8453: { name: 'Base', icon: 'BASE' },
};

const DEFAULT_CHAIN_ID = 8453;
// const FALLBACK_CHAINS = [421614, 11155420, 300];

interface SendWizardProps {
    recipient: SelectedRecipient;
    onBack: () => void;
    onConfirm: (data: { asset: string; amount: string; chainId: number }) => void;
    initialAsset?: string;
    initialAmount?: string;
}

export function SendWizard({ recipient, onBack, onConfirm, initialAsset, initialAmount }: SendWizardProps) {
    const t = useTranslations('Send');
    const locale = useLocale();
    const fiatInfo = localeToCurrency[locale] || localeToCurrency['en-US'];
    const [step, setStep] = useState<'asset' | 'amount' | 'confirm'>('amount');
    const [selectedAsset, setSelectedAsset] = useState<string>(initialAsset || 'USDC');
    const [amount, setAmount] = useState(initialAmount || '');
    const [isEstimating, setIsEstimating] = useState(false);
    const [feeEstimate, setFeeEstimate] = useState<{
        chainId: number;
        fee: string;
        error?: string;
    } | null>(null);
    const [assetPrice, setAssetPrice] = useState<number | null>(null);
    const [isLoadingPrice, setIsLoadingPrice] = useState(false);
    const [priceError, setPriceError] = useState<string | null>(null);
    const [feeFiatRate, setFeeFiatRate] = useState<number | null>(null);
    const [isLoadingFeeRate, setIsLoadingFeeRate] = useState(false);
    const [feeRateError, setFeeRateError] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [sendError, setSendError] = useState<FriendlyError | null>(null);

    const selectedAssetData = ASSETS.find((a) => a.symbol === selectedAsset);
    const shortRecipientAddress = `${recipient.address.slice(0, 6)}...${recipient.address.slice(-4)}`;
    const numericAmount = parseFloat(amount || '0');
    const fiatAmount = !Number.isNaN(numericAmount) && assetPrice
        ? (numericAmount * assetPrice).toFixed(2)
        : '0.00';
    const fiatFee = feeEstimate?.fee && feeFiatRate
        ? (parseFloat(feeEstimate.fee) * feeFiatRate).toFixed(2)
        : '0.00';
    const formattedFeeFiat = (() => {
        const numericFee = parseFloat(fiatFee);
        if (Number.isNaN(numericFee)) return null;
        const formattedThreshold = (0.01).toLocaleString(locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        if (numericFee > 0 && numericFee < 0.01) {
            return `< ${fiatInfo.symbol} ${formattedThreshold}`;
        }
        return `${fiatInfo.symbol} ${numericFee.toLocaleString(locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    })();

    useEffect(() => {
        if (!selectedAsset) {
            return;
        }

        let isMounted = true;
        setIsLoadingPrice(true);
        setAssetPrice(null);
        setPriceError(null);
        fetchAssetPrice(selectedAsset, fiatInfo.code)
            .then((price) => {
                if (!isMounted) return;
                setAssetPrice(price);
                setPriceError(null);
            })
            .catch(() => {
                if (!isMounted) return;
                setAssetPrice(null);
                setPriceError('conversion-unavailable');
            })
            .finally(() => {
                if (isMounted) setIsLoadingPrice(false);
            });

        return () => {
            isMounted = false;
        };
    }, [selectedAsset, fiatInfo.code]);

    // Load fiat rate for fee (use USDC as baseline)
    useEffect(() => {
        let isMounted = true;
        setIsLoadingFeeRate(true);
        setFeeFiatRate(null);
        setFeeRateError(null);
        fetchAssetPrice('USDC', fiatInfo.code)
            .then((price) => {
                if (!isMounted) return;
                setFeeFiatRate(price);
            })
            .catch(() => {
                if (!isMounted) return;
                setFeeRateError('conversion-unavailable');
            })
            .finally(() => {
                if (isMounted) setIsLoadingFeeRate(false);
            });

        return () => {
            isMounted = false;
        };
    }, [fiatInfo.code]);

    const publicClient = usePublicClient();

    const estimateFee = async () => {
        setIsEstimating(true);
        setFeeEstimate(null);

        try {
            if (!selectedAsset) throw new Error('No asset selected');

            const chainId = DEFAULT_CHAIN_ID;

            if (!publicClient) {
                // Fallback simulation if no public client
                await new Promise((resolve) => setTimeout(resolve, 500));
                // Base has very low fees, typically < $0.01
                setFeeEstimate({ chainId, fee: '0.001' });
                return;
            }

            // Simple gas estimation for ERC-20 transfer on Base
            // ERC-20 transfers typically use ~65,000 gas
            const estimatedGas = BigInt(65000);
            const gasPrice = await publicClient.getGasPrice();
            const feeInWei = estimatedGas * gasPrice;

            // Convert ETH fee to USD
            // Base has very low fees, so this will be a small amount
            try {
                const { fetchAssetPrice } = await import('@/lib/currency');
                const ethPrice = await fetchAssetPrice('ETH', 'USD');
                const feeInUsd = (Number(feeInWei) / 1e18) * ethPrice;

                setFeeEstimate({
                    chainId,
                    fee: feeInUsd < 0.0001 ? '< 0.001' : feeInUsd.toFixed(4)
                });
            } catch {
                // If price fetch fails, show a typical Base fee
                setFeeEstimate({ chainId, fee: '0.001' });
            }

        } catch (error) {
            console.error('Fee estimation failed', error);
            // Fallback to typical Base fee
            setFeeEstimate({ chainId: DEFAULT_CHAIN_ID, fee: '0.001' });
        } finally {
            setIsEstimating(false);
        }
    };

    const handleAssetSelect = (symbol: string) => {
        setSelectedAsset(symbol);
        setStep('amount');
    };

    const handleAmountSubmit = () => {
        if (!amount || parseFloat(amount) <= 0) return;
        estimateFee();
        setStep('confirm');
    };

    const handleConfirm = async () => {
        if (!selectedAsset || !feeEstimate) return;

        setIsSending(true);
        setSendError(null);

        try {
            const hash = await sendUsdcOnBase({
                to: recipient.address,
                amount: amount
            });
            setTxHash(hash);
            onConfirm({
                asset: selectedAsset,
                amount,
                chainId: feeEstimate.chainId,
            });
        } catch (error: unknown) {
            console.error('Payment failed', error);
            const friendly = translateWeb3Error(error);
            setSendError(friendly);
        } finally {
            setIsSending(false);
        }
    };

    const handleEditAmount = () => {
        setStep('amount');
    };

    const recipientMeta = `${recipient.label ? `${recipient.label} - ` : ''}${shortRecipientAddress}`;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold text-white">{t('sendCrypto')}</h2>
                        <p className="text-sm text-white/60">
                            {t('to')}: <span className="text-white font-medium">{recipient.name}</span>
                        </p>
                        <p className="text-xs text-white/50">{recipientMeta}</p>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-white/70 hover:text-white"
                        onClick={onBack}
                    >
                        {t('changeRecipient')}
                    </Button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* Step 1: Select Asset */}
                {step === 'asset' && (
                    <motion.div
                        key="asset"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <Card>
                            <h3 className="text-lg font-medium text-white mb-4">{t('chooseCrypto')}</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {ASSETS.map((asset) => (
                                    <button
                                        key={asset.symbol}
                                        onClick={() => handleAssetSelect(asset.symbol)}
                                        className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                                    >
                                        <span className="text-2xl">{asset.icon}</span>
                                        <div className="text-left">
                                            <p className="font-medium text-white">{asset.symbol}</p>
                                            <p className="text-xs text-white/50">{asset.name}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Step 2: Enter Amount */}
                {step === 'amount' && selectedAssetData && (
                    <motion.div
                        key="amount"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        <Card className="text-center py-8">
                            <div className="flex items-center justify-center gap-2 mb-6">
                                <span className="text-3xl">{selectedAssetData.icon}</span>
                                <span className="text-xl font-medium text-white">{selectedAssetData.symbol}</span>
                            </div>

                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full text-center text-5xl font-bold bg-transparent text-white outline-none placeholder:text-white/30"
                                autoFocus
                            />

                            <p className="text-white/50 mt-4">{t('howMuch')}</p>

                            <div className="mt-3 flex justify-end">
                                {isLoadingPrice ? (
                                    <span className="flex items-center gap-2 text-xs text-white/60">
                                        <div className="w-3 h-3 border border-white/40 border-t-transparent rounded-full animate-spin" />
                                        {t('calculating')}
                                    </span>
                                ) : priceError ? (
                                    <span className="text-xs text-error">{t('conversionUnavailable')}</span>
                                ) : (
                                    <span className="text-xs text-white/60">~ {fiatInfo.symbol} {fiatAmount}</span>
                                )}
                            </div>
                        </Card>

                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleAmountSubmit}
                            disabled={!amount || parseFloat(amount) <= 0}
                        >
                            {t('continue')}
                        </Button>
                    </motion.div>
                )}

                {/* Step 3: Confirm */}
                {step === 'confirm' && selectedAssetData && (
                    <motion.div
                        key="confirm"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        <Card className="text-center py-8">
                            <p className="text-white/50 text-sm">{t('youAreSending')}</p>
                            <div className="flex flex-col items-center justify-center gap-1 my-4">
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-4xl">{selectedAssetData.icon}</span>
                                    <span className="text-4xl font-bold text-white">
                                        {amount} {selectedAssetData.symbol}
                                    </span>
                                </div>
                                <span className="text-sm text-white/60">
                                    ~ {fiatInfo.symbol} {fiatAmount}
                                </span>
                            </div>
                            <p className="text-white/50">para <span className="text-white font-medium">{recipient.name}</span></p>
                        </Card>

                        <div className="flex justify-end">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs text-white/70 hover:text-white"
                                onClick={handleEditAmount}
                            >
                                {t('editAmount')}
                            </Button>
                        </div>

                        {/* Fee Badge */}
                        <Card className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Coins className="text-white/80" size={20} strokeWidth={1.75} />
                                <span className="text-white/70">{t('estimatedCost')}</span>
                            </div>

                            {isEstimating ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <span className="text-white/50">{t('calculating')}</span>
                                </div>
                            ) : feeEstimate?.error ? (
                                <div className="flex items-center gap-2 text-error">
                                    <AlertCircle size={16} strokeWidth={1.75} />
                                    <span className="text-sm">{t('unableToEstimate')}</span>
                                </div>
                            ) : feeEstimate ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{NETWORKS[feeEstimate.chainId]?.icon}</span>
                                    <div className="text-right">
                                        <p className="font-medium text-white">${feeEstimate.fee}</p>
                                        <p className="text-xs text-white/50">{NETWORKS[feeEstimate.chainId]?.name}</p>
                                        <div className="text-xs text-white/60">
                                            {isLoadingFeeRate ? (
                                                <span className="flex items-center gap-1 justify-end">
                                                    <div className="w-3 h-3 border border-white/40 border-t-transparent rounded-full animate-spin" />
                                                    {t('calculating')}
                                                </span>
                                            ) : feeRateError ? (
                                                <span className="text-error">{t('conversionUnavailable')}</span>
                                            ) : (
                                                <span>~ {formattedFeeFiat}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </Card>

                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleConfirm}
                            disabled={isEstimating || !!feeEstimate?.error}
                            isLoading={isEstimating}
                        >
                            <Wallet className="mr-2" size={20} strokeWidth={1.75} />
                            {t('confirmAndPay')}
                        </Button>

                        {/* Status UI */}
                        <AnimatePresence>
                            {isSending && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center justify-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400"
                                >
                                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm font-medium">Enviando pagamento...</span>
                                </motion.div>
                            )}

                            {txHash && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                >
                                    <div className="flex items-center gap-2">
                                        <Check size={18} />
                                        <span className="text-sm font-medium">Pagamento Confirmado!</span>
                                    </div>
                                    <p className="text-xs break-all opacity-70">Hash: {txHash}</p>
                                </motion.div>
                            )}

                            {sendError && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                            <AlertCircle size={22} className="text-red-400" strokeWidth={2} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-base text-red-400">
                                                {sendError.title}
                                            </h4>
                                            <p className="text-sm text-red-300/80 mt-1 leading-relaxed">
                                                {sendError.message}
                                            </p>
                                        </div>
                                    </div>

                                    {sendError.action && (
                                        <div className="ml-13 pl-13 pt-2 border-t border-red-500/10">
                                            <p className="text-xs text-red-400/60 font-medium uppercase tracking-wider mb-1">
                                                O que fazer:
                                            </p>
                                            <p className="text-sm text-red-300/90">
                                                {sendError.action}
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-2 mt-1">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                                            onClick={() => setSendError(null)}
                                        >
                                            Tentar Novamente
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
