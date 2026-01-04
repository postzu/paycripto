import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Info, Search, X } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';

type InvestModalProduct = {
    title: string;
    subtitle: string;
    apyValue: string;
    apyLabel: string;
    summary: string[];
    apyRange: {
        min: number;
        max: number;
    };
    showStablecoinDetails?: boolean;
};

interface YieldInvestModalProps {
    isOpen: boolean;
    product: InvestModalProduct | null;
    onClose: () => void;
}

export function YieldInvestModal({ isOpen, product, onClose }: YieldInvestModalProps) {
    const [amount, setAmount] = useState('');
    const [showDetails, setShowDetails] = useState(false);
    const detailsRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setAmount('');
            setShowDetails(false);
        }
    }, [isOpen]);

    const numericAmount = useMemo(() => {
        if (!amount) return 0;
        const normalized = amount.replace(',', '.');
        const parsed = Number.parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }, [amount]);

    const monthlyRange = useMemo(() => {
        if (!product || numericAmount <= 0) return null;
        const minMonthly = (numericAmount * (product.apyRange.min / 100)) / 12;
        const maxMonthly = (numericAmount * (product.apyRange.max / 100)) / 12;
        return {
            min: minMonthly,
            max: maxMonthly,
        };
    }, [numericAmount, product]);

    const handleShowDetails = () => {
        setShowDetails(true);
        requestAnimationFrame(() => {
            detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    };

    if (!product) return null;

    const formatValue = (value: number) =>
        value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.96, opacity: 0 }}
                        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f0f0f] shadow-2xl max-h-[90vh] overflow-y-auto"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="p-6 space-y-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-white">{product.title}</h3>
                                    <p className="text-xs text-white/60">{product.subtitle}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-semibold text-amber-400">{product.apyValue}</div>
                                    <p className="text-[10px] uppercase tracking-wide text-white/40">
                                        {product.apyLabel}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 -mr-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-1 text-sm text-white/70">
                                {product.summary.map((line) => (
                                    <p key={line}>{line}</p>
                                ))}
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
                                <div className="flex items-center gap-2 text-white/80">
                                    <Info size={16} />
                                    <span className="text-sm font-semibold">Simulador simples</span>
                                </div>
                                <div className="space-y-2">
                                    <Input
                                        label="Valor para investir"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(event) => setAmount(event.target.value)}
                                    />
                                    {monthlyRange ? (
                                        <p className="text-xs text-white/60">
                                            Estimativa mensal: {formatValue(monthlyRange.min)} - {formatValue(monthlyRange.max)} USDC
                                        </p>
                                    ) : (
                                        <p className="text-xs text-white/40">Informe um valor para simular.</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button className="w-full py-6 text-base font-semibold">
                                    Confirmar investimento
                                </Button>
                                <button
                                    type="button"
                                    onClick={handleShowDetails}
                                    className="w-full flex items-center justify-center gap-2 text-xs text-white/60 hover:text-white transition-colors"
                                >
                                    <Search size={14} />
                                    Entenda riscos e funcionamento antes de investir
                                </button>
                            </div>

                            <div
                                ref={detailsRef}
                                className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3"
                            >
                                <button
                                    type="button"
                                    onClick={() => setShowDetails((prev) => !prev)}
                                    className="w-full flex items-center justify-between text-sm font-semibold text-white/80"
                                >
                                    Como funciona este investimento
                                    <ChevronDown
                                        size={16}
                                        className={`transition-transform ${showDetails ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                <AnimatePresence>
                                    {showDetails && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-4 text-xs text-white/70 overflow-hidden"
                                        >
                                            <div className="space-y-2">
                                                <p className="text-sm font-semibold text-white/80">Riscos e funcionamento</p>
                                                <p>Este investimento usa liquidez automatizada (Liquidity Pool).</p>
                                                <p className="text-white/80 font-semibold">Risco principal: Impermanent Loss</p>
                                                <ul className="space-y-1 list-disc list-inside text-white/70">
                                                    <li>Se o preço subir, parte do saldo vira USDC</li>
                                                    <li>Se o preço cair, parte do saldo vira cbBTC</li>
                                                    <li>Você continua ganhando taxas, mas o valor final pode ser menor do que manter os ativos separados</li>
                                                </ul>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-sm font-semibold text-white/80">Como o rendimento é gerado (Range de preço)</p>
                                                <p>Este investimento opera dentro de uma faixa de preço (range).</p>
                                                <p className="text-white/80">Exemplo (USDC / cbBTC):</p>
                                                <p>Definimos uma faixa onde o Bitcoin pode variar, por exemplo:</p>
                                                <p className="text-white/90 font-semibold">US$ 55.000 – US$ 75.000</p>
                                                <p>Enquanto o preço estiver dentro dessa faixa:</p>
                                                <ul className="space-y-1 list-disc list-inside text-white/70">
                                                    <li>Sua liquidez é utilizada</li>
                                                    <li>Você recebe taxas automaticamente</li>
                                                </ul>
                                                <p>Se o preço sair da faixa:</p>
                                                <ul className="space-y-1 list-disc list-inside text-white/70">
                                                    <li>As taxas pausam</li>
                                                    <li>Sua posição fica concentrada em um dos ativos</li>
                                                    <li>O sistema pode ajustar o range automaticamente</li>
                                                </ul>
                                                <p>Os "ticks" são apenas divisões técnicas dessa faixa.</p>
                                            </div>

                                            {product.showStablecoinDetails && (
                                                <div className="space-y-2">
                                                    <p className="text-sm font-semibold text-white/80">Para stablecoins (USDC / USDC)</p>
                                                    <p>Mesmo stablecoins utilizam range — pequeno e controlado.</p>
                                                    <ul className="space-y-1 list-disc list-inside text-white/70">
                                                        <li>Exemplo de range: 0,98 – 1,02</li>
                                                        <li>Ele acompanha variações normais e mantém o rendimento</li>
                                                        <li>Se houver um desvio fora do padrão (depeg), o sistema ajusta</li>
                                                    </ul>
                                                    <p>Por isso, o risco é menor e o rendimento mais estável.</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
