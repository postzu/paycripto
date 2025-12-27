'use client';

import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { ArrowLeft, Coins, Wallet, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { fetchAssetPrice, localeToCurrency } from '@/lib/currency';
import { SelectedRecipient } from './types';

// Supported assets mock
const ASSETS = [
    { symbol: 'ETH', name: 'Ethereum', icon: 'ETH' },
    { symbol: 'USDT', name: 'Tether USD', icon: 'USDT' },
    { symbol: 'USDC', name: 'USD Coin', icon: 'USDC' },
];

// Network icons
const NETWORKS: Record<number, { name: string; icon: string }> = {
    11155111: { name: 'Ethereum', icon: 'ETH' },
    421614: { name: 'Arbitrum', icon: 'ARB' },
    11155420: { name: 'Optimism', icon: 'OPT' },
    300: { name: 'zkSync Era', icon: 'ZK' },
    97: { name: 'BSC', icon: 'BSC' },
    84532: { name: 'Base', icon: 'BASE' },
    5: { name: 'Loopring', icon: 'LRC' },
};

const DEFAULT_CHAIN_ID = 84532;
const FALLBACK_CHAINS = [421614, 11155420, 300];

interface SendWizardProps {
    recipient: SelectedRecipient;
    onBack: () => void;
    onConfirm: (data: { asset: string; amount: string; chainId: number }) => void;
}

export function SendWizard({ recipient, onBack, onConfirm }: SendWizardProps) {
    const t = useTranslations('Send');
    const locale = useLocale();
    const fiatInfo = localeToCurrency[locale] || localeToCurrency['en-US'];
    const [step, setStep] = useState<'asset' | 'amount' | 'confirm'>('amount');
    const [selectedAsset, setSelectedAsset] = useState<string>('USDT');
    const [amount, setAmount] = useState('');
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

    // Load fiat rate for fee (use USDT as baseline)
    useEffect(() => {
        let isMounted = true;
        setIsLoadingFeeRate(true);
        setFeeFiatRate(null);
        setFeeRateError(null);
        fetchAssetPrice('USDT', fiatInfo.code)
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

    const estimateFee = async () => {
        setIsEstimating(true);
        setFeeEstimate(null);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Prefer Base as default network; keep other L2s as secondary options
        const chainCandidates = [DEFAULT_CHAIN_ID, ...FALLBACK_CHAINS];
        const chainId = chainCandidates[0];
        const fee = (Math.random() * 0.001 + 0.0001).toFixed(6); // Demo fee simulation

        setFeeEstimate({ chainId, fee });
        setIsEstimating(false);
    };

    const handleAssetSelect = (symbol: string) => {
        setSelectedAsset(symbol);
        setStep('amount');
    };

    const handleBack = () => {
        if (step === 'confirm') {
            setStep('amount');
            return;
        }

        // For the MVP we keep USDT as the default asset, so skip the asset selector
        onBack();
    };

    const handleAmountSubmit = () => {
        if (!amount || parseFloat(amount) <= 0) return;
        estimateFee();
        setStep('confirm');
    };

    const handleConfirm = () => {
        if (!selectedAsset || !feeEstimate) return;
        onConfirm({
            asset: selectedAsset,
            amount,
            chainId: feeEstimate.chainId,
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={handleBack}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft className="text-white" size={24} />
                </button>
                <div>
                    <h2 className="text-xl font-semibold text-white">{t('sendCrypto')}</h2>
                    <p className="text-sm text-white/50">{t('to')}: {recipient.name}</p>
                    <p className="text-xs text-white/50">
                        {recipient.label ? `${recipient.label} · ` : ''}{shortRecipientAddress}
                    </p>
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
                            <div className="flex items-center justify-center gap-2 my-4">
                                <span className="text-4xl">{selectedAssetData.icon}</span>
                                <span className="text-4xl font-bold text-white">
                                    {amount} {selectedAssetData.symbol}
                                </span>
                            </div>
                            <p className="text-white/50">para <span className="text-white font-medium">{recipient.name}</span></p>
                        </Card>

                        {/* Fee Badge */}
                        <Card className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Coins className="text-primary" size={20} />
                                <span className="text-white/70">{t('estimatedCost')}</span>
                            </div>

                            {isEstimating ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <span className="text-white/50">{t('calculating')}</span>
                                </div>
                            ) : feeEstimate?.error ? (
                                <div className="flex items-center gap-2 text-error">
                                    <AlertCircle size={16} />
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
                            <Wallet className="mr-2" size={20} />
                            {t('confirmAndPay')}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
