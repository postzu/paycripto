import { useMemo, useState } from 'react';
import { TrendingUp, ArrowDown, ArrowUp, Wallet } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { YieldDepositModal } from './yield-deposit-modal';
import { YieldWithdrawModal } from './yield-withdraw-modal';
import { YieldInvestModal } from './yield-invest-modal';
import { useAaveData } from '@/presentation/hooks/use-aave-data';

type YieldTone = 'low' | 'moderate' | 'high' | 'neutral';
type YieldAction = 'deposit' | 'withdraw' | 'invest' | 'disabled';

type YieldTag = {
    label: string;
    tone: YieldTone;
};

type InvestDetails = {
    summary: string[];
    apyRange: {
        min: number;
        max: number;
    };
    showStablecoinDetails?: boolean;
};

type YieldProduct = {
    id: string;
    title: string;
    subtitle: string;
    helper?: string;
    apyValue: string;
    apyLabel: string;
    apyTone: YieldTone;
    balanceLabel: string;
    balanceValue: string;
    tags: YieldTag[];
    primaryLabel: string;
    secondaryLabel: string;
    primaryAction: YieldAction;
    secondaryAction: YieldAction;
    investDetails?: InvestDetails;
};

const toneStyles: Record<YieldTone, { text: string; mutedText: string; dot: string; chip: string }> = {
    low: {
        text: 'text-emerald-400',
        mutedText: 'text-emerald-400/70',
        dot: 'bg-emerald-400',
        chip: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200',
    },
    moderate: {
        text: 'text-amber-400',
        mutedText: 'text-amber-400/70',
        dot: 'bg-amber-400',
        chip: 'bg-amber-500/10 border-amber-500/20 text-amber-200',
    },
    high: {
        text: 'text-sky-400',
        mutedText: 'text-sky-400/70',
        dot: 'bg-sky-400',
        chip: 'bg-sky-500/10 border-sky-500/20 text-sky-200',
    },
    neutral: {
        text: 'text-white/70',
        mutedText: 'text-white/40',
        dot: 'bg-white/40',
        chip: 'bg-white/5 border-white/10 text-white/70',
    },
};

export function YieldSection() {
    const [isDepositOpen, setIsDepositOpen] = useState(false);
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [isInvestOpen, setIsInvestOpen] = useState(false);
    const [selectedInvestProduct, setSelectedInvestProduct] = useState<YieldProduct | null>(null);

    const { apy, balance, refetch, isLoading } = useAaveData();

    const formattedAPY = (apy * 100).toFixed(2);
    const formattedBalance = balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const products = useMemo<YieldProduct[]>(() => ([
        {
            id: 'usd-yield',
            title: 'Rendimento em Dólar',
            subtitle: 'USDC -> USDC',
            helper: 'Aave V3 - Base Network',
            apyValue: `${formattedAPY}%`,
            apyLabel: 'APY atual',
            apyTone: 'low',
            balanceLabel: 'Saldo aplicado',
            balanceValue: isLoading ? '...' : formattedBalance,
            tags: [
                { label: 'Baixo risco', tone: 'low' },
                { label: 'Estável', tone: 'neutral' },
            ],
            primaryLabel: 'Depositar',
            secondaryLabel: 'Resgatar',
            primaryAction: 'deposit',
            secondaryAction: 'withdraw',
        },
        {
            id: 'usd-plus',
            title: 'Dólar Rendido Plus',
            subtitle: 'USDC / USDC em LP',
            helper: 'Estratégia com maior rendimento em dólar',
            apyValue: '4% - 10%',
            apyLabel: 'Rendimento estimado',
            apyTone: 'moderate',
            balanceLabel: 'Saldo aplicado',
            balanceValue: '0.00',
            tags: [
                { label: 'Risco moderado', tone: 'moderate' },
                { label: 'Mais rendimento', tone: 'moderate' },
            ],
            primaryLabel: 'Investir',
            secondaryLabel: 'Resgatar',
            primaryAction: 'invest',
            secondaryAction: 'disabled',
            investDetails: {
                summary: [
                    'Estratégia em dólar com mais rendimento, usando liquidez automatizada.',
                    'Pode haver variação de saldo conforme o mercado.',
                ],
                apyRange: { min: 4, max: 10 },
                showStablecoinDetails: true,
            },
        },
        {
            id: 'usd-btc',
            title: 'Dólar + Bitcoin',
            subtitle: 'USDC / cbBTC',
            helper: 'Estratégia balanceada entre dólar e Bitcoin',
            apyValue: '8% - 18%',
            apyLabel: 'Rendimento estimado',
            apyTone: 'high',
            balanceLabel: 'Saldo aplicado',
            balanceValue: '0.00',
            tags: [
                { label: 'Maior potencial', tone: 'high' },
                { label: 'Maior variação', tone: 'high' },
            ],
            primaryLabel: 'Investir',
            secondaryLabel: 'Resgatar',
            primaryAction: 'invest',
            secondaryAction: 'disabled',
            investDetails: {
                summary: [
                    'Estratégia balanceada entre dólar e Bitcoin.',
                    'Maior potencial de retorno, com maior variação de valor.',
                ],
                apyRange: { min: 8, max: 18 },
            },
        },
    ]), [formattedAPY, formattedBalance, isLoading]);

    return (
        <>
            <div className="space-y-5">
                {products.map((product) => {
                    const apyTone = toneStyles[product.apyTone];
                    return (
                        <Card
                            key={product.id}
                            className="p-5 border-white/10 bg-linear-to-br from-white/5 to-white/0 overflow-hidden relative group"
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <TrendingUp size={80} />
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`flex h-8 w-8 items-center justify-center rounded-full ${apyTone.chip}`}>
                                                <TrendingUp size={16} className={apyTone.text} />
                                            </span>
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">{product.title}</h3>
                                                <p className="text-xs text-white/60">{product.subtitle}</p>
                                            </div>
                                        </div>
                                        {product.helper && (
                                            <p className="text-xs text-white/40">{product.helper}</p>
                                        )}
                                        <div className="flex flex-wrap gap-2">
                                            {product.tags.map((tag) => {
                                                const tagTone = toneStyles[tag.tone];
                                                return (
                                                    <span
                                                        key={`${product.id}-${tag.label}`}
                                                        className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${tagTone.chip}`}
                                                    >
                                                        <span className={`h-1.5 w-1.5 rounded-full ${tagTone.dot}`} />
                                                        {tag.label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-2xl font-bold ${apyTone.text}`}>{product.apyValue}</div>
                                        <p className={`text-[10px] uppercase font-semibold ${apyTone.mutedText}`}>
                                            {product.apyLabel}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                            <Wallet size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/50">{product.balanceLabel}</p>
                                            <p className="text-lg font-mono font-medium text-white">
                                                {product.balanceValue} <span className="text-sm text-white/40">USDC</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant="primary"
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                                        onClick={
                                            product.primaryAction === 'deposit'
                                                ? () => setIsDepositOpen(true)
                                                : product.primaryAction === 'invest'
                                                    ? () => {
                                                        setSelectedInvestProduct(product);
                                                        setIsInvestOpen(true);
                                                    }
                                                    : undefined
                                        }
                                        disabled={product.primaryAction === 'disabled'}
                                    >
                                        <ArrowDown size={16} className="mr-2" />
                                        {product.primaryLabel}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="w-full"
                                        onClick={product.secondaryAction === 'withdraw' ? () => setIsWithdrawOpen(true) : undefined}
                                        disabled={product.secondaryAction === 'disabled'}
                                    >
                                        <ArrowUp size={16} className="mr-2" />
                                        {product.secondaryLabel}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <YieldDepositModal
                isOpen={isDepositOpen}
                onClose={() => setIsDepositOpen(false)}
                refetchData={refetch}
            />

            <YieldWithdrawModal
                isOpen={isWithdrawOpen}
                onClose={() => setIsWithdrawOpen(false)}
                refetchData={refetch}
            />

            <YieldInvestModal
                isOpen={isInvestOpen}
                product={
                    selectedInvestProduct?.investDetails
                        ? {
                            title: selectedInvestProduct.title,
                            subtitle: selectedInvestProduct.subtitle,
                            apyValue: selectedInvestProduct.apyValue,
                            apyLabel: selectedInvestProduct.apyLabel,
                            summary: selectedInvestProduct.investDetails.summary,
                            apyRange: selectedInvestProduct.investDetails.apyRange,
                            showStablecoinDetails: selectedInvestProduct.investDetails.showStablecoinDetails,
                        }
                        : null
                }
                onClose={() => {
                    setIsInvestOpen(false);
                    setSelectedInvestProduct(null);
                }}
            />
        </>
    );
}
