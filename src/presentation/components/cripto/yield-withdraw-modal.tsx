import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Check } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { AAVE_CONSTANTS, AAVE_POOL_ABI } from '@/config/aave';
import { useAaveData } from '@/presentation/hooks/use-aave-data';

interface YieldWithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    refetchData: () => void;
}

export function YieldWithdrawModal({ isOpen, onClose, refetchData }: YieldWithdrawModalProps) {
    const { address } = useAccount();
    const [amount, setAmount] = useState('');
    const [step, setStep] = useState<'input' | 'withdrawing' | 'success'>('input');
    const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

    const { balance, rawBalance } = useAaveData();

    const { writeContractAsync: writeContract } = useWriteContract();

    const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    useEffect(() => {
        if (isTxSuccess && txHash) {
            requestAnimationFrame(() => {
                setStep('success');
                refetchData();
                setTxHash(undefined);
            });
        }
    }, [isTxSuccess, refetchData, txHash]);

    const handleWithdraw = async () => {
        if (!amount || !address) return;
        try {
            setStep('withdrawing');
            const parsedAmount = parseUnits(amount, 6);

            // If withdrawing max, simple workaround is to use a slightly higher number or type max uint256 if supported
            // But for Aave V3 withdraw, passing type(uint256).max withdraws everything.
            let amountToWithdraw = parsedAmount;
            if (parsedAmount >= rawBalance) {
                amountToWithdraw = BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935"); // UINT256 MAX
            }

            const hash = await writeContract({
                address: AAVE_CONSTANTS.base.POOL_ADDRESS,
                abi: AAVE_POOL_ABI,
                functionName: 'withdraw',
                args: [AAVE_CONSTANTS.base.USDC_ADDRESS, amountToWithdraw, address],
            });
            setTxHash(hash);
        } catch (e) {
            console.error(e);
            setStep('input');
        }
    };

    const handleMax = () => {
        setAmount(formatUnits(rawBalance, 6)); // Exact match might have dust issues, but input usually handles string.
    };

    const reset = () => {
        setAmount('');
        setStep('input');
        setTxHash(undefined);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="relative w-full max-w-sm rounded-2xl bg-dark-surface border border-white/10 p-6 shadow-2xl space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="absolute top-3 right-3 p-2 rounded-full text-white/40 hover:bg-white/5 hover:text-white transition-colors"
                            onClick={handleClose}
                        >
                            <X size={18} />
                        </button>

                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-white">Resgatar USDC</h3>
                            <p className="text-sm text-white/60">Saque seus rendimentos para sua carteira</p>
                        </div>

                        {step === 'success' ? (
                            <div className="py-8 flex flex-col items-center text-center space-y-4">
                                <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                    <Check size={32} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white">Resgate realizado!</h4>
                                    <p className="text-sm text-white/60">Os tokens foram enviados para sua carteira.</p>
                                </div>
                                <Button className="w-full" onClick={handleClose}>
                                    Fechar
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Input
                                            label="Valor"
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            disabled={step !== 'input'}
                                        />
                                        {step === 'input' && (
                                            <button
                                                onClick={handleMax}
                                                className="absolute right-3 top-[34px] text-xs font-semibold text-primary hover:text-primary/80"
                                            >
                                                MAX
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-white/50 text-right">
                                        Disponível: {typeof balance === 'number' ? balance.toLocaleString('en-US', { maximumFractionDigits: 2 }) : balance} USDC
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {step === 'input' && (
                                        <Button className="w-full" onClick={handleWithdraw} disabled={!amount || Number(amount) <= 0}>
                                            Resgatar
                                        </Button>
                                    )}

                                    {step === 'withdrawing' && (
                                        <Button className="w-full" disabled>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Resgatando...
                                        </Button>
                                    )}

                                    {isTxLoading && (
                                        <p className="text-xs text-center text-white/40 animate-pulse">Confirmando transação...</p>
                                    )}
                                </div>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
