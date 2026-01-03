'use client';

import { motion } from 'framer-motion';
import { Check, Copy, ExternalLink, Share2, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Transfer } from '@/core/domain/entities/transfer.entity';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface TransactionReceiptProps {
    transfer: Transfer;
    onClose: () => void;
}

export function TransactionReceipt({ transfer, onClose }: TransactionReceiptProps) {
    const t = useTranslations('Receipt');
    const locale = useLocale();
    const [hasCopied, setHasCopied] = useState(false);

    const fiatValue = transfer.getFiatValue();
    const explorerUrl = transfer.getExplorerUrl();
    const shortAddress = transfer.getShortRecipientAddress();

    const currencyFormatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: transfer.fiatCurrency || 'BRL',
    });

    const dateFormatter = new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });

    const handleCopyHash = useCallback(async () => {
        if (!transfer.txHash) return;

        try {
            await navigator.clipboard.writeText(transfer.txHash);
            setHasCopied(true);
            setTimeout(() => setHasCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }, [transfer.txHash]);

    const handleShare = useCallback(async () => {
        if (!navigator.share) {
            // Fallback: copy to clipboard
            const text = `${t('shareText', {
                amount: transfer.amount,
                token: transfer.token,
                recipient: transfer.recipientName || shortAddress,
            })}${explorerUrl ? `\n${explorerUrl}` : ''}`;

            try {
                await navigator.clipboard.writeText(text);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
            return;
        }

        try {
            await navigator.share({
                title: t('shareTitle'),
                text: t('shareText', {
                    amount: transfer.amount,
                    token: transfer.token,
                    recipient: transfer.recipientName || shortAddress,
                }),
                url: explorerUrl || undefined,
            });
        } catch (err) {
            // User cancelled or share failed
            console.error('Share failed:', err);
        }
    }, [transfer, shortAddress, explorerUrl, t]);

    const handleOpenExplorer = useCallback(() => {
        if (explorerUrl) {
            window.open(explorerUrl, '_blank', 'noopener,noreferrer');
        }
    }, [explorerUrl]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <Card className="relative overflow-hidden">
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X size={20} className="text-white/70" />
                    </button>

                    {/* Success animation */}
                    <div className="flex justify-center pt-6 pb-4">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                            className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
                            >
                                <Check size={32} className="text-emerald-400" strokeWidth={2.5} />
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-semibold text-white text-center mb-1">
                        {t('title')}
                    </h2>
                    <p className="text-sm text-white/60 text-center mb-6">
                        {dateFormatter.format(transfer.createdAt)}
                    </p>

                    {/* Amount */}
                    <div className="text-center mb-6">
                        <p className="text-3xl font-bold text-white">
                            {transfer.amount} {transfer.token}
                        </p>
                        {fiatValue && (
                            <p className="text-sm text-white/60 mt-1">
                                ≈ {currencyFormatter.format(fiatValue)}
                            </p>
                        )}
                    </div>

                    {/* Details */}
                    <div className="space-y-3 mb-6">
                        {/* Recipient */}
                        <div className="flex justify-between items-center py-2 border-b border-white/10">
                            <span className="text-sm text-white/60">{t('recipient')}</span>
                            <div className="text-right">
                                {transfer.recipientName && (
                                    <p className="text-sm font-medium text-white">{transfer.recipientName}</p>
                                )}
                                <p className="text-xs text-white/50">{shortAddress}</p>
                            </div>
                        </div>

                        {/* Network */}
                        <div className="flex justify-between items-center py-2 border-b border-white/10">
                            <span className="text-sm text-white/60">{t('network')}</span>
                            <span className="text-sm text-white">Base</span>
                        </div>

                        {/* Fee */}
                        {transfer.feeEstimate && (
                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                <span className="text-sm text-white/60">{t('fee')}</span>
                                <span className="text-sm text-white">${transfer.feeEstimate}</span>
                            </div>
                        )}

                        {/* Status */}
                        <div className="flex justify-between items-center py-2 border-b border-white/10">
                            <span className="text-sm text-white/60">{t('status')}</span>
                            <span className={`text-sm font-medium ${transfer.status === 'completed' ? 'text-emerald-400' :
                                    transfer.status === 'failed' ? 'text-red-400' :
                                        'text-amber-400'
                                }`}>
                                {t(`statusLabels.${transfer.status}`)}
                            </span>
                        </div>

                        {/* TX Hash */}
                        {transfer.txHash && (
                            <div className="py-2">
                                <p className="text-sm text-white/60 mb-1">{t('txHash')}</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 text-xs text-white/70 bg-white/5 rounded px-2 py-1 truncate">
                                        {transfer.txHash}
                                    </code>
                                    <button
                                        onClick={handleCopyHash}
                                        className="p-1.5 rounded hover:bg-white/10 transition-colors"
                                    >
                                        {hasCopied ? (
                                            <Check size={16} className="text-emerald-400" />
                                        ) : (
                                            <Copy size={16} className="text-white/70" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        {explorerUrl && (
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={handleOpenExplorer}
                            >
                                <ExternalLink size={16} className="mr-2" />
                                {t('viewOnExplorer')}
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleShare}
                        >
                            <Share2 size={16} className="mr-2" />
                            {t('share')}
                        </Button>
                    </div>
                </Card>
            </motion.div>
        </motion.div>
    );
}
