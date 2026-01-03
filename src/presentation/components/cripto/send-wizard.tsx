'use client';

import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Coins, Wallet, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { fetchAssetPrice, localeToCurrency } from '@/lib/currency';
import { SelectedRecipient } from './types';
import { translateWeb3Error, FriendlyError } from '@/lib/web3-errors';
import { logEvent } from '@/lib/analytics';
import { useCreateTransfer } from '@/presentation/hooks/use-create-transfer';
import { TransactionReceipt } from './transaction-receipt';

// Supported assets mock
const ASSETS = [
    { symbol: 'ETH', name: 'Ethereum', icon: 'ETH' },
    { symbol: 'USDC', name: 'USD Coin', icon: 'USDC' },
];

import { useReadContract } from 'wagmi';
import { BASE_USDC_ADDRESS } from '../../../config/baseUsdc';
import { formatUnits, erc20Abi } from 'viem';

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
    onConfirm: (data: { asset: string; amount: string; chainId: number }) => Promise<string>;
    initialAsset?: string;
    initialAmount?: string;
    senderAddress: string;
}

export function SendWizard({ recipient, onBack, onConfirm, initialAsset, initialAmount, senderAddress }: SendWizardProps) {
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
    const [insufficientBalance, setInsufficientBalance] = useState(false);

    const { data: usdcBalanceValue } = useReadContract({
        address: BASE_USDC_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [senderAddress as `0x${string}`],
    });

    const [feeRateError, setFeeRateError] = useState<string | null>(null);
    const [isLoadingFeeRate, setIsLoadingFeeRate] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sendError, setSendError] = useState<FriendlyError | null>(null);
    const { createTransfer, lastTransfer } = useCreateTransfer();
    const [showReceipt, setShowReceipt] = useState(false);

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

    // Initial log
    useEffect(() => {
        logEvent('send_wizard_start', {
            address: recipient.address,
            initialAsset,
            initialAmount
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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



    const estimateFee = async () => {
        setIsEstimating(true);
        setFeeEstimate(null);
        logEvent('send_wizard_estimate_fee', { asset: selectedAsset });

        try {
            if (!selectedAsset) throw new Error('No asset selected');

            const chainId = DEFAULT_CHAIN_ID;
            const { estimateEthFeeAsEth } = await import('@/lib/sendUsdcBase');

            // 1. Estimate native gas cost (in ETH)
            const baseEthFee = await estimateEthFeeAsEth({
                to: recipient.address,
                amount: amount || '0'
            });

            if (selectedAsset === 'USDC') {
                const { fetchAssetPrice } = await import('@/lib/currency');
                // 2. Fetch prices to convert ETH fee to USDC
                const ethPrice = await fetchAssetPrice('ETH', 'USD');
                const usdcPrice = await fetchAssetPrice('USDC', 'USD');

                // Fee in USD (Base cost)
                const feeInUsd = parseFloat(baseEthFee) * ethPrice;
                // Fee in USDC
                const feeInUsdc = feeInUsd / (usdcPrice || 1);
                // 3. Add 10% surcharge (Circle Paymaster requirement)
                const feeWithSurcharge = feeInUsdc * 1.10;

                // 4. Pre-flight balance check
                const totalRequiredUsdc = parseFloat(amount || '0') + feeWithSurcharge;
                if (usdcBalanceValue !== undefined) {
                    const balanceFormatted = formatUnits(usdcBalanceValue, 6);
                    setInsufficientBalance(parseFloat(balanceFormatted) < totalRequiredUsdc);
                }

                setFeeEstimate({
                    chainId,
                    fee: feeWithSurcharge.toFixed(6),
                    error: undefined
                });
            } else {
                // For ETH or others, just use baseEthFee
                setInsufficientBalance(false); // Native balance check is handled elsewhere or by wallet
                setFeeEstimate({
                    chainId,
                    fee: baseEthFee,
                    error: undefined
                });
            }

        } catch (error) {
            console.error('Fee estimation failed', error);
            const friendly = translateWeb3Error(error);

            setFeeEstimate({
                chainId: DEFAULT_CHAIN_ID,
                fee: '---',
                error: friendly.message
            });
        } finally {
            setIsEstimating(false);
        }
    };

    const handleAssetSelect = (symbol: string) => {
        logEvent('send_wizard_asset_selected', { asset: symbol });
        setSelectedAsset(symbol);
        setStep('amount');
    };

    const handleAmountSubmit = () => {
        if (!amount || parseFloat(amount) <= 0) return;
        logEvent('send_wizard_amount_entered', {
            asset: selectedAsset,
            amount: parseFloat(amount)
        });
        estimateFee();
        setStep('confirm');
    };

    const handleConfirm = async () => {
        if (!selectedAsset || !feeEstimate) return;

        setIsSending(true);
        setSendError(null);

        logEvent('send_wizard_submit', {
            asset: selectedAsset,
            amount: parseFloat(amount),
            chainId: feeEstimate.chainId,
            fee: parseFloat(feeEstimate.fee)
        });

        try {
            // DELEGATE to parent via onConfirm
            const hash = await onConfirm({
                asset: selectedAsset,
                amount: amount,
                chainId: feeEstimate.chainId
            });

            // Persist transfer
            await createTransfer({
                userId: senderAddress,
                recipientId: recipient.contactId.startsWith('temp-') ? undefined : recipient.contactId,
                recipientAddress: recipient.address,
                recipientName: recipient.name,
                token: selectedAsset,
                amount: amount,
                chainId: feeEstimate.chainId,
                feeEstimate: feeEstimate.fee,
                txHash: hash,
                fiatCurrency: fiatInfo.code
            });

            setShowReceipt(true);
            logEvent('send_wizard_success', {
                asset: selectedAsset,
                amount: parseFloat(amount),
                txHash: hash
            });

            // We don't call onConfirm immediately anymore
            // onConfirm will be called when user closes receipt
        } catch (error: unknown) {
            console.error('Payment failed', error);
            const friendly = translateWeb3Error(error);
            setSendError(friendly);
            logEvent('send_wizard_error', {
                error: friendly.title,
                message: friendly.message,
                asset: selectedAsset
            });
        } finally {
            setIsSending(false);
        }
    };

    const handleReceiptClose = () => {
        setShowReceipt(false);
        // We already called it during handleConfirm
        // But we might want to notify completion? 
        // For now just go home
        onBack();
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
                                        <p className="font-medium text-white">{feeEstimate.fee} USDC</p>
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

                        {insufficientBalance && (
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                                <AlertCircle size={20} strokeWidth={2} />
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold">Saldo Insuficiente</p>
                                    <p className="text-xs opacity-80">Seu saldo de USDC não cobre o valor do envio + taxa de gás da rede (+10%).</p>
                                </div>
                            </div>
                        )}

                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleConfirm}
                            disabled={isEstimating || !!feeEstimate?.error || insufficientBalance}
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

                            {/* Success UI replaced by TransactionReceipt overlay */}
                            {lastTransfer && showReceipt && (
                                <TransactionReceipt
                                    transfer={lastTransfer}
                                    onClose={handleReceiptClose}
                                />
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
