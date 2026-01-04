import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Check } from 'lucide-react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { AAVE_CONSTANTS, ERC20_ABI, AAVE_POOL_ABI } from '@/config/aave';

interface YieldDepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    refetchData: () => void;
}

export function YieldDepositModal({ isOpen, onClose, refetchData }: YieldDepositModalProps) {
    const { address } = useAccount();
    const [amount, setAmount] = useState('');
    const [step, setStep] = useState<'input' | 'approving' | 'supplying' | 'success'>('input');
    const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

    // Read USDC Balance
    const { data: usdcBalance } = useReadContract({
        address: AAVE_CONSTANTS.base.USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address!],
        query: { enabled: !!address },
    });

    // Read Allowance
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: AAVE_CONSTANTS.base.USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address!, AAVE_CONSTANTS.base.POOL_ADDRESS],
        query: { enabled: !!address },
    });

    const { writeContractAsync: writeContract } = useWriteContract();

    // Wait for Tx
    const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    useEffect(() => {
        if (isTxSuccess && txHash) {
            requestAnimationFrame(() => {
                if (step === 'approving') {
                    refetchAllowance().then(() => {
                        setStep('input');
                        setTxHash(undefined);
                    });
                } else if (step === 'supplying') {
                    setStep('success');
                    refetchData();
                    setTxHash(undefined);
                }
            });
        }
    }, [isTxSuccess, step, refetchAllowance, refetchData, txHash]);

    const handleApprove = async () => {
        if (!amount) return;
        try {
            setStep('approving');
            const parsedAmount = parseUnits(amount, 6);
            const hash = await writeContract({
                address: AAVE_CONSTANTS.base.USDC_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [AAVE_CONSTANTS.base.POOL_ADDRESS, parsedAmount],
            });
            setTxHash(hash);
        } catch (e) {
            console.error(e);
            setStep('input');
        }
    };

    const handleSupply = async () => {
        if (!amount || !address) return;
        try {
            setStep('supplying');
            const parsedAmount = parseUnits(amount, 6);
            const hash = await writeContract({
                address: AAVE_CONSTANTS.base.POOL_ADDRESS,
                abi: AAVE_POOL_ABI,
                functionName: 'supply',
                args: [AAVE_CONSTANTS.base.USDC_ADDRESS, parsedAmount, address, 0],
            });
            setTxHash(hash);
        } catch (e) {
            console.error(e);
            setStep('input');
        }
    };

    const handleMax = () => {
        if (usdcBalance !== undefined && usdcBalance !== null) {
            setAmount(formatUnits(usdcBalance as bigint, 6));
        }
    };

    const needsApproval = () => {
        if (!amount || allowance === undefined || allowance === null) return true;
        try {
            const parsed = parseUnits(amount, 6);
            return (allowance as bigint) < parsed;
        } catch {
            return true;
        }
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
                            <h3 className="text-lg font-semibold text-white">Depositar USDC</h3>
                            <p className="text-sm text-white/60">Comece a render automaticamente</p>
                        </div>

                        {step === 'success' ? (
                            <div className="py-8 flex flex-col items-center text-center space-y-4">
                                <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                    <Check size={32} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white">Depósito realizado!</h4>
                                    <p className="text-sm text-white/60">Seus USDC já estão rendendo.</p>
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

                                    {usdcBalance !== undefined && usdcBalance !== null && (
                                        <p className="text-xs text-white/50 text-right">
                                            Saldo: {Number(formatUnits(usdcBalance as unknown as bigint, 6)).toLocaleString('en-US', { maximumFractionDigits: 2 })} USDC
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {step === 'input' && (
                                        needsApproval() ? (
                                            <Button className="w-full" onClick={handleApprove} disabled={!amount || Number(amount) <= 0}>
                                                Aprovar USDC
                                            </Button>
                                        ) : (
                                            <Button className="w-full" onClick={handleSupply} disabled={!amount || Number(amount) <= 0}>
                                                Depositar
                                            </Button>
                                        )
                                    )}

                                    {(step === 'approving' || step === 'supplying') && (
                                        <Button className="w-full" disabled>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {step === 'approving' ? 'Aprovando...' : 'Depositando...'}
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
