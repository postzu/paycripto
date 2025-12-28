'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { RecipientsList } from '@/presentation/components/cripto/recipients-list';
import { SendWizard } from '@/presentation/components/cripto/send-wizard';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    Copy,
    CreditCard,
    Eye,
    EyeOff,
    Info,
    LogOut,
    QrCode,
    Send,
    ShieldCheck,
    Wallet,
    X,
    Zap
} from 'lucide-react';
import NextImage from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useAccount, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useUsdtBalance } from '@/presentation/hooks/use-usdt-balance';
import { RecipientWithAddresses, SelectedRecipient } from '@/presentation/components/cripto/types';
import QRCode from 'qrcode';
import { LocaleSwitchNotice } from '@/presentation/components/locale/locale-switcher';
import { TESTNET_CHAINS } from '@/lib/currency';
import { getAddress } from 'viem';

type View = 'home' | 'recipients' | 'send' | 'newRecipient';
type RecipientMode = 'new' | 'existing';

interface CriptoPageContentProps {
    /** Whether this is running in testnet mode */
    isTestnet?: boolean;
}

type NewRecipientFormState = {
    mode: RecipientMode;
    contactId: string;
    name: string;
    address: string;
    label: string;
};

const INITIAL_RECIPIENTS: RecipientWithAddresses[] = [
    {
        id: '1',
        name: 'Maria Silva',
        addresses: [
            { id: '1a', address: '0x1234567890123456789012345678901234567890', label: 'Principal' },
            { id: '1b', address: '0x9876543210123456789012345678901234567890', label: 'Reserva' },
        ],
    },
    {
        id: '2',
        name: 'Joao Santos',
        addresses: [{ id: '2a', address: '0xabcdef1234567890abcdef1234567890abcdef12', label: 'Carteira 1' }],
    },
    {
        id: '3',
        name: 'Ana Costa',
        addresses: [{ id: '3a', address: '0x9876543210987654321098765432109876543210', label: 'Carteira' }],
    },
];

const ALLOWED_CHAIN_IDS = new Set<number>(Object.values(TESTNET_CHAINS).map((chain) => chain.id));
const ALLOWED_CHAIN_LIST = Object.values(TESTNET_CHAINS);
const DEFAULT_CHAIN_ID = TESTNET_CHAINS.baseSepolia.id;

type BaseIconSize = 'sm' | 'md' | 'lg';

const baseIconSizes: Record<BaseIconSize, { outer: string; inner: string }> = {
    sm: { outer: 'w-5 h-5', inner: 'w-2.5 h-2.5' },
    md: { outer: 'w-6 h-6', inner: 'w-3 h-3' },
    lg: { outer: 'w-7 h-7', inner: 'w-3.5 h-3.5' },
};

function BaseIcon({ size = 'md' }: { size?: BaseIconSize }) {
    const { outer, inner } = baseIconSizes[size] ?? baseIconSizes.md;

    return (
        <span className={`relative inline-flex items-center justify-center rounded-full bg-[#0052ff] ${outer}`}>
            <span className={`rounded-full bg-white ${inner}`} />
        </span>
    );
}

export function CriptoPageContent({ isTestnet = false }: CriptoPageContentProps) {
    const t = useTranslations();
    const locale = useLocale();
    const [view, setView] = useState<View>('home');
    const [selectedRecipient, setSelectedRecipient] = useState<SelectedRecipient | null>(null);
    const [recipients, setRecipients] = useState<RecipientWithAddresses[]>(INITIAL_RECIPIENTS);
    const [newRecipient, setNewRecipient] = useState<NewRecipientFormState>({
        mode: 'new',
        contactId: '',
        name: '',
        address: '',
        label: '',
    });
    const [showBalance, setShowBalance] = useState(true);
    const [qrStatus, setQrStatus] = useState<{ isReading: boolean; error: string | null }>({
        isReading: false,
        error: null,
    });
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isReceiveOpen, setIsReceiveOpen] = useState(false);
    const [isDepositOpen, setIsDepositOpen] = useState(false);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
    const [hasCopiedAddress, setHasCopiedAddress] = useState(false);
    const [showWhyBase, setShowWhyBase] = useState(false);
    const [showDepositExamples, setShowDepositExamples] = useState(false);
    const copyFeedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Wallet connection
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const chainId = useChainId();
    const { chains: switchableChains, switchChain, isPending: isSwitchingChain } = useSwitchChain();
    const isAllowedChain = !chainId || ALLOWED_CHAIN_IDS.has(chainId);
    const networkBlocked = isConnected && !!chainId && !isAllowedChain;
    const canSwitchChain = Boolean(switchChain);
    const defaultChainOption = switchableChains.find((chain) => chain.id === DEFAULT_CHAIN_ID);

    // USDT balance with fiat conversion
    const { usdtBalance, fiatValue, fiatSymbol, isLoading: isLoadingBalance } = useUsdtBalance(locale);

    const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

    const defaultNetworkName = t('Home.network.defaultValue');
    const defaultNetworkMeta = t('Home.network.defaultMeta');
    const defaultBadge = t('Home.network.defaultBadge');
    const parsedBalance = Number.parseFloat(usdtBalance || '0');
    const hasBalance = Number.isFinite(parsedBalance) && parsedBalance > 0;
    const balanceValue = showBalance ? (isLoadingBalance ? '...' : usdtBalance) : '*****';
    const showFiatLine = showBalance && !isLoadingBalance;
    const balanceToggleLabel = showBalance ? t('Home.balance.hide') : t('Home.balance.show');
    const conversionNotice = t('Home.balance.conversionNotice');
    const conversionTooltip = t('Home.balance.tooltip');
    const balanceDescription = t('Home.balance.description');
    const preventionNotice = t('Home.network.compatibilityNotice');
    const supportedNetworksLabel = t('Home.network.seeSupported');
    const depositMicrocopy = t('Home.deposit.microcopy');
    const nonCustodialMessage = t('Home.security.nonCustodial');
    const allowedNetworksLabel = useMemo(
        () => ALLOWED_CHAIN_LIST.map((chain) => chain.name).join(', '),
        []
    );
    const targetChainName = defaultChainOption?.name || defaultNetworkName;
    const normalizeAddress = (value: string) => {
        try {
            return getAddress(value.trim());
        } catch {
            return null;
        }
    };
    const selectedContact = useMemo(
        () => recipients.find((recipient) => recipient.id === newRecipient.contactId),
        [recipients, newRecipient.contactId]
    );
    const normalizedFormAddress = normalizeAddress(newRecipient.address);

    const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

    const resetNewRecipient = (mode: RecipientMode = 'new', contactId = '') => {
        setNewRecipient({
            mode,
            contactId,
            name: '',
            address: '',
            label: '',
        });
        setQrStatus({ isReading: false, error: null });
    };

    useEffect(() => {
        if (!isReceiveOpen || !address) {
            setQrCodeDataUrl(null);
            return;
        }

        let isMounted = true;
        QRCode.toDataURL(address, {
            margin: 1,
            width: 256,
            color: { dark: '#0a0a0a', light: '#ffffff' },
        })
            .then((url) => {
                if (isMounted) setQrCodeDataUrl(url);
            })
            .catch(() => {
                if (isMounted) setQrCodeDataUrl(null);
            });

        return () => {
            isMounted = false;
        };
    }, [address, isReceiveOpen]);

    const handleCopyAddress = async () => {
        if (!address) return;

        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(address);
            } else {
                throw new Error('Clipboard API not available');
            }
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = address;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();

            try {
                document.execCommand('copy');
            } finally {
                document.body.removeChild(textarea);
            }
        }

        setHasCopiedAddress(true);
        if (copyFeedbackTimeout.current) {
            clearTimeout(copyFeedbackTimeout.current);
        }
        copyFeedbackTimeout.current = setTimeout(() => setHasCopiedAddress(false), 1500);
    };

    const handleSelectRecipient = (recipient: SelectedRecipient) => {
        setSelectedRecipient(recipient);
        setView('send');
    };

    useEffect(() => {
        if (!isConnected) {
            setIsReceiveOpen(false);
            setIsDepositOpen(false);
        }
    }, [isConnected]);

    useEffect(() => {
        if (networkBlocked) {
            setIsReceiveOpen(false);
            setIsDepositOpen(false);
        }
    }, [networkBlocked]);

    useEffect(() => {
        if (!isDepositOpen) {
            setShowDepositExamples(false);
        }
        if (!isReceiveOpen && !isDepositOpen) {
            setShowWhyBase(false);
        }
    }, [isDepositOpen, isReceiveOpen]);

    useEffect(() => {
        return () => {
            if (copyFeedbackTimeout.current) {
                clearTimeout(copyFeedbackTimeout.current);
            }
        };
    }, []);

    const handleConfirmSend = (data: { asset: string; amount: string; chainId: number }) => {
        if (networkBlocked) {
            return;
        }

        const recipientName = selectedRecipient?.name ?? '';
        const confirmMessage = t('Send.confirmPrompt', {
            amount: data.amount,
            asset: data.asset,
            name: recipientName,
        });

        const isConfirmed = typeof window === 'undefined' ? true : window.confirm(confirmMessage);
        if (!isConfirmed) return;

        alert(t('Send.sentStatus'));
        setView('home');
        setSelectedRecipient(null);
    };

    const decodeQrFromFile = (file: File) =>
        new Promise<string>((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                        reject(new Error('Nao foi possivel preparar a leitura.'));
                        return;
                    }

                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const result = jsQR(imageData.data, imageData.width, imageData.height);

                    if (!result) {
                        reject(new Error('Nenhum QR Code encontrado na imagem.'));
                        return;
                    }

                    resolve(result.data.trim());
                };

                img.onerror = () => reject(new Error('Erro ao carregar a imagem do QR Code.'));
                img.src = reader.result as string;
            };

            reader.onerror = () => reject(new Error('Nao foi possivel ler o arquivo.'));
            reader.readAsDataURL(file);
        });

    const handleQrFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setQrStatus({ isReading: true, error: null });

        try {
            const qrText = await decodeQrFromFile(file);
            const normalized = normalizeAddress(qrText);
            if (!normalized) {
                throw new Error(t('Recipients.qr.invalidAddress'));
            }

            setNewRecipient((prev) => ({ ...prev, address: normalized }));
            setQrStatus({ isReading: false, error: null });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao ler QR Code.';
            setQrStatus({ isReading: false, error: message });
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleAddRecipient = () => {
        const normalizedAddress = normalizeAddress(newRecipient.address);
        const trimmedName = newRecipient.name.trim();

        if (!normalizedAddress) {
            setQrStatus((prev) => ({ ...prev, error: t('Recipients.validation.invalidAddress') }));
            return;
        }

        if (newRecipient.mode === 'existing') {
            const targetContactId = newRecipient.contactId || recipients[0]?.id;
            if (!targetContactId) return;

            setRecipients((prev) =>
                prev.map((recipient) => {
                    if (recipient.id !== targetContactId) return recipient;

                    const label = newRecipient.label || `Carteira ${recipient.addresses.length + 1}`;
                    const newAddress = { id: createId('addr'), address: normalizedAddress, label };

                    return { ...recipient, addresses: [...recipient.addresses, newAddress] };
                })
            );
        } else {
            if (!trimmedName) return;

            const label = newRecipient.label || 'Principal';
            const newAddress = { id: createId('addr'), address: normalizedAddress, label };
            const contactId = createId('recipient');

            setRecipients((prev) => [
                ...prev,
                {
                    id: contactId,
                    name: trimmedName,
                    addresses: [newAddress],
                },
            ]);
        }

        resetNewRecipient('new');
        setView('recipients');
    };

    const canSaveRecipient =
        Boolean(normalizedFormAddress) &&
        (newRecipient.mode === 'new'
            ? newRecipient.name.trim().length > 0
            : Boolean(newRecipient.contactId || recipients[0]));

    const handleOpenNewRecipient = (contactId?: string) => {
        if (contactId) {
            resetNewRecipient('existing', contactId);
        } else {
            resetNewRecipient('new');
        }
        setView('newRecipient');
    };

    const viewTitle =
        view === 'home'
            ? t('Home.title')
            : view === 'recipients'
                ? t('Recipients.title')
                : view === 'send'
                    ? t('Send.title')
                    : t('Recipients.newRecipientTitle');

    return (
        <div className={`min-h-screen bg-dark text-white font-sans ${isTestnet ? 'pt-10' : ''}`}>
            {/* Header */}
            <header className="sticky top-0 z-50 bg-dark/90 backdrop-blur-lg border-b border-white/10">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
                    {view !== 'home' ? (
                        <button
                            onClick={() => {
                                if (view === 'send') setView('recipients');
                                else if (view === 'newRecipient') setView('recipients');
                                else setView('home');
                            }}
                            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                    ) : (
                        <button className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors opacity-0">
                            <ArrowLeft size={24} />
                        </button>
                    )}
                    <div className="flex flex-col items-center justify-center text-center">
                        <NextImage
                            src="/logo-appbar.png"
                            alt={viewTitle}
                            width={343}
                            height={88}
                            className="h-10 w-auto drop-shadow-[0_4px_16px_rgba(0,0,0,0.35)]"
                            priority
                        />
                        {view !== 'home' && (
                            <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/60">
                                {viewTitle}
                            </span>
                        )}
                    </div>
                    <div className="w-10" aria-hidden />
                </div>
            </header>

            <AnimatePresence>
                {networkBlocked && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                            className="w-full max-w-md rounded-2xl border border-white/10 bg-dark-surface p-6 shadow-2xl space-y-4"
                        >
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="text-primary mt-1" size={20} />
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold">{t('Home.security.unsupportedNetworkTitle')}</h3>
                                    <p className="text-sm text-white/70">
                                        {t('Home.security.unsupportedNetworkDesc', { networks: allowedNetworksLabel })}
                                    </p>
                                    <p className="text-xs text-white/60">
                                        {t('Home.security.unsupportedNetworkAdvice')}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <Button
                                    type="button"
                                    onClick={() => switchChain?.({ chainId: DEFAULT_CHAIN_ID })}
                                    isLoading={isSwitchingChain}
                                    disabled={!canSwitchChain}
                                >
                                    {t('Home.security.switchTo', { network: targetChainName })}
                                </Button>
                                <Button type="button" variant="secondary" onClick={() => disconnect()}>
                                    {t('Home.disconnect')}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
                <AnimatePresence mode="wait">
                    {/* Home View */}
                    {view === 'home' && (
                        <motion.div
                            key="home"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* Balance Card */}
                            {isConnected ? (
                                <Card
                                    className={`relative overflow-hidden border ${
                                        hasBalance
                                            ? 'border-0 bg-gradient-to-br from-primary via-primary/80 to-secondary p-6'
                                            : 'border-white/10 bg-white/5 p-4'
                                    }`}
                                >
                                    <div className="relative z-10 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-1">
                                                <span className="text-white/90 text-sm font-semibold tracking-tight">Saldo total</span>
                                                <p className="text-[11px] text-white/60">{balanceDescription}</p>
                                            </div>
                                            <button
                                                onClick={() => setShowBalance(!showBalance)}
                                                className="p-2 -mr-2 rounded-full text-white/70 hover:bg-white/10 transition-colors"
                                                aria-label={balanceToggleLabel}
                                                title={balanceToggleLabel}
                                            >
                                                {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
                                            </button>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <div className="flex items-baseline gap-1">
                                                {showBalance && <span className="text-xl font-semibold text-white/80">$</span>}
                                                <span className={`${hasBalance ? 'text-4xl' : 'text-3xl'} font-bold text-white tracking-tight`}>
                                                    {balanceValue}
                                                </span>
                                            </div>
                                            <span className="text-sm font-semibold text-white/70">USDT</span>
                                        </div>
                                        {showFiatLine && (
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                                                <span>~ {fiatSymbol} {fiatValue}</span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Info
                                                        size={14}
                                                        className="text-white/50"
                                                        aria-label={conversionTooltip}
                                                    />
                                                    <span className="hidden sm:inline">{conversionNotice}</span>
                                                </span>
                                            </div>
                                        )}
                                        {hasBalance && (
                                            <div className="pt-1 flex items-center gap-2 text-white/70 text-sm">
                                                <span>Ganhe recompensas</span>
                                                <div className="px-2 py-0.5 bg-white/20 rounded-full text-xs text-white">Novo</div>
                                            </div>
                                        )}
                                    </div>
                                    {hasBalance && (
                                        <>
                                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/30 rounded-full blur-xl" />
                                        </>
                                    )}
                                </Card>
                            ) : (
                                <Card className="bg-dark-surface border border-white/10 p-6 text-center">
                                    <Wallet className="mx-auto text-primary mb-4" size={40} />
                                    <h3 className="text-lg font-semibold mb-2">Conecte sua carteira</h3>
                                    <p className="text-white/50 text-sm mb-4">Para enviar e receber cripto</p>
                                    <ConnectButton.Custom>
                                        {({ openConnectModal }) => (
                                            <Button onClick={openConnectModal} className="w-full">
                                                Conectar Carteira
                                            </Button>
                                        )}
                                    </ConnectButton.Custom>
                                </Card>
                            )}

                            {/* Quick Actions (PIX Style) */}
                            <div className="space-y-3">
                                <Card
                                    className={`flex flex-col gap-3 border border-primary/40 bg-primary/15 p-5 transition-colors ${
                                        isConnected ? 'hover:bg-primary/20 cursor-pointer' : 'opacity-60 cursor-not-allowed'
                                    }`}
                                    onClick={() => isConnected && setIsDepositOpen(true)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/30">
                                            <CreditCard size={26} />
                                        </div>
                                        <div className="flex flex-col items-start gap-0.5">
                                            <span className="text-base font-semibold text-white">
                                                {t('Home.actions.deposit')}
                                            </span>
                                            <span className="text-xs text-white/80">{t('Home.actions.depositHelper')}</span>
                                        </div>
                                        <ArrowRight size={18} className="ml-auto text-white/80" />
                                    </div>
                                    <p className="text-xs text-white/80">{depositMicrocopy}</p>
                                    <div className="flex flex-wrap gap-2 text-[11px] text-white/90">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1">
                                            <Zap size={14} />
                                            {t('Home.deposit.highlights.instant')}
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1">
                                            <CreditCard size={14} />
                                            {t('Home.deposit.highlights.card')}
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1">
                                            <ShieldCheck size={14} />
                                            {t('Home.deposit.highlights.safe')}
                                        </span>
                                    </div>
                                </Card>

                                <div className="grid grid-cols-2 gap-3">
                                    <Card
                                        className={`flex flex-col items-start gap-2 p-5 border border-white/5 bg-dark-surface ${
                                            isConnected ? 'hover:bg-white/5 cursor-pointer' : 'opacity-60 cursor-not-allowed'
                                        }`}
                                        onClick={() => isConnected && setIsReceiveOpen(true)}
                                    >
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-white">
                                            <QrCode size={22} />
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="text-sm font-semibold text-white">
                                                {t('Home.actions.receive')}
                                            </span>
                                            <p className="text-xs text-white/60">{t('Home.actions.receiveHelper')}</p>
                                        </div>
                                    </Card>

                                    <Card
                                        className={`flex flex-col items-start gap-2 p-5 border border-white/5 bg-dark-surface ${
                                            isConnected ? 'hover:bg-white/5 cursor-pointer' : 'opacity-60 cursor-not-allowed'
                                        }`}
                                        onClick={() => isConnected && setView('recipients')}
                                    >
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-white">
                                            <Send size={22} />
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="text-sm font-semibold text-white">
                                                {t('Home.actions.transfer')}
                                            </span>
                                            <p className="text-xs text-white/60">{t('Home.actions.transferHelper')}</p>
                                        </div>
                                    </Card>
                                </div>
                            </div>

                            {/* Connected Wallet */}
                            {isConnected && (
                                <Card className="p-4 bg-white/[0.04] border border-white/5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="h-2.5 w-2.5 rounded-full bg-success shadow-[0_0_0_6px_rgba(34,197,94,0.15)]" />
                                            <div className="flex flex-col items-start">
                                                <span className="font-medium text-sm text-white">{t('Home.walletConnected')}</span>
                                                <span className="text-xs text-white/60">{shortAddress}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-white/70">
                                            <span className="text-white/60">{t('Home.network.defaultLabel')}:</span>
                                            <span className="text-sm font-semibold text-white">{defaultNetworkName}</span>
                                        </div>
                                    </div>
                                    <p className="mt-2 flex items-center gap-2 text-xs text-white/70">
                                        <ShieldCheck size={14} className="text-success" />
                                        <span>{nonCustodialMessage}</span>
                                    </p>
                                    <div className="mt-3 flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 text-xs text-white/70">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-amber-200">
                                            <AlertTriangle size={16} />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="leading-relaxed">{preventionNotice}</p>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-[11px] font-semibold text-white/80 hover:text-white"
                                                    onClick={() => setShowWhyBase(true)}
                                                >
                                                    {supportedNetworksLabel}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs"
                                            onClick={handleCopyAddress}
                                        >
                                            <Copy size={16} className="mr-1" />
                                            {hasCopiedAddress ? t('Home.receive.copied') : t('Home.receive.copy')}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-white/60 bg-white/5 hover:text-white hover:bg-white/10"
                                            onClick={() => disconnect()}
                                        >
                                            <LogOut size={16} className="mr-1" />
                                            {t('Home.disconnect')}
                                        </Button>
                                    </div>
                                </Card>
                            )}
                        </motion.div>
                    )}

                    {/* Recipients View */}
                    {view === 'recipients' && (
                        <motion.div
                            key="recipients"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <RecipientsList
                                recipients={recipients}
                                onSelect={handleSelectRecipient}
                                onAddNew={handleOpenNewRecipient}
                            />
                        </motion.div>
                    )}

                    {/* Send View */}
                    {view === 'send' && selectedRecipient && (
                        <motion.div
                            key="send"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <SendWizard
                                recipient={selectedRecipient}
                                onBack={() => setView('recipients')}
                                onConfirm={handleConfirmSend}
                            />
                        </motion.div>
                    )}

                    {/* New Recipient View */}
                    {view === 'newRecipient' && (
                        <motion.div
                            key="newRecipient"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <Card>
                                <h2 className="text-lg font-semibold mb-6">{t('Recipients.newRecipientTitle')}</h2>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            type="button"
                                            variant={newRecipient.mode === 'new' ? 'primary' : 'ghost'}
                                            onClick={() => resetNewRecipient('new')}
                                        >
                                            {t('Recipients.modes.newContact')}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={newRecipient.mode === 'existing' ? 'primary' : 'ghost'}
                                            onClick={() =>
                                                resetNewRecipient(
                                                    'existing',
                                                    newRecipient.contactId || recipients[0]?.id || ''
                                                )
                                            }
                                        >
                                            {t('Recipients.modes.newAddress')}
                                        </Button>
                                    </div>

                                    {newRecipient.mode === 'existing' ? (
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-sm font-medium text-white/70">
                                                {t('Recipients.fields.existingContact')}
                                            </label>
                                            <select
                                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 [&>option]:text-slate-900 [&>option]:bg-white"
                                                value={newRecipient.contactId || recipients[0]?.id}
                                                onChange={(e) =>
                                                    setNewRecipient({
                                                        ...newRecipient,
                                                        contactId: e.target.value,
                                                    })
                                                }
                                            >
                                                {recipients.map((recipient) => (
                                                    <option key={recipient.id} value={recipient.id}>
                                                        {recipient.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {selectedContact && (
                                                <p className="text-xs text-white/50">
                                                    {t('Recipients.fields.addressCount', {
                                                        count: selectedContact.addresses.length,
                                                    })}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <Input
                                            label={t('Recipients.fields.name')}
                                            placeholder="Ex: Joao da Silva"
                                            value={newRecipient.name}
                                            onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                                        />
                                    )}

                                    <Input
                                        label={t('Recipients.fields.label')}
                                        placeholder={t('Recipients.fields.labelPlaceholder')}
                                        value={newRecipient.label}
                                        onChange={(e) => setNewRecipient({ ...newRecipient, label: e.target.value })}
                                    />

                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-1">
                                                <Input
                                                    label={t('Recipients.fields.address')}
                                                    placeholder="0x..."
                                                    value={newRecipient.address}
                                                    onChange={(e) =>
                                                        setNewRecipient({ ...newRecipient, address: e.target.value })
                                                    }
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                className="mt-7 whitespace-nowrap"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={qrStatus.isReading}
                                            >
                                                <QrCode className="mr-2" size={18} />
                                                {qrStatus.isReading ? t('Recipients.qr.reading') : t('Recipients.qr.scan')}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-white/50">{t('Recipients.qr.helper')}</p>
                                        {!normalizedFormAddress && newRecipient.address.trim() !== '' && (
                                            <p className="text-xs text-error">{t('Recipients.validation.invalidAddress')}</p>
                                        )}
                                        {qrStatus.error && <p className="text-sm text-error">{qrStatus.error}</p>}
                                    </div>
                                </div>
                            </Card>

                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleAddRecipient}
                                disabled={!canSaveRecipient}
                            >
                                {t('Recipients.saveRecipient')}
                            </Button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={handleQrFileChange}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
                <LocaleSwitchNotice />
            </main>

            <AnimatePresence>
                {isReceiveOpen && isConnected && address && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                        onClick={() => setIsReceiveOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="relative w-full max-w-sm rounded-2xl bg-dark-surface border border-white/10 p-6 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 transition-colors"
                                onClick={() => setIsReceiveOpen(false)}
                                aria-label={t('Common.back')}
                            >
                                <X size={18} />
                            </button>

                            <div className="space-y-3 text-center">
                                <h3 className="text-lg font-semibold">{t('Home.receive.title')}</h3>
                                <p className="text-sm text-white/60">{t('Home.receive.subtitle')}</p>

                                <div className="mt-2 flex justify-center">
                                    {qrCodeDataUrl ? (
                                        <div className="rounded-2xl bg-white p-3 shadow-lg">
                                            <NextImage
                                                src={qrCodeDataUrl}
                                                alt={t('Home.receive.qrAlt')}
                                                width={208}
                                                height={208}
                                                className="h-52 w-52 object-contain"
                                                unoptimized
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-52 w-52 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
                                    )}
                                </div>

                                <div className="pt-2 space-y-2">
                                    <span className="text-xs uppercase tracking-wide text-white/50 block">
                                        {t('Home.receive.copyLabel')}
                                    </span>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="font-mono text-sm px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                                            {shortAddress}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            className="flex items-center gap-2"
                                            onClick={handleCopyAddress}
                                        >
                                            <Copy size={16} />
                                            <span className="text-xs">
                                                {hasCopiedAddress ? t('Home.receive.copied') : t('Home.receive.copy')}
                                            </span>
                                        </Button>
                                    </div>

                                    <div className="mt-3 space-y-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-left">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <BaseIcon size="md" />
                                                <div>
                                                    <span className="block text-white/80">{t('Home.network.defaultLabel')}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-white">{defaultNetworkName}</span>
                                                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] uppercase tracking-wide text-white/90">
                                                            {defaultBadge}
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] text-white/70">{defaultNetworkMeta}</span>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs"
                                                onClick={() => setShowWhyBase(true)}
                                            >
                                                {supportedNetworksLabel}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-white/70">{t('Home.network.defaultHint')}</p>
                                        <p className="text-xs text-white/70">{preventionNotice}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isDepositOpen && isConnected && address && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                        onClick={() => setIsDepositOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="relative w-full max-w-md rounded-2xl bg-dark-surface border border-white/10 p-6 shadow-2xl space-y-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 transition-colors"
                                onClick={() => setIsDepositOpen(false)}
                                aria-label={t('Common.back')}
                            >
                                <X size={18} />
                            </button>

                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold">{t('Home.deposit.title')}</h3>
                                <p className="text-sm text-white/60">{t('Home.deposit.subtitle')}</p>
                                <div className="flex flex-wrap gap-2 text-xs text-white/80">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1">
                                        <Zap size={14} />
                                        {t('Home.deposit.highlights.instant')}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1">
                                        <CreditCard size={14} />
                                        {t('Home.deposit.highlights.card')}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1">
                                        <ShieldCheck size={14} />
                                        {t('Home.deposit.highlights.safe')}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase tracking-wide text-white/50">
                                        {t('Home.deposit.addressLabel')}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => {
                                            setIsDepositOpen(false);
                                            setIsReceiveOpen(true);
                                        }}
                                    >
                                        {t('Home.deposit.openReceive')}
                                    </Button>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-sm px-2 py-1 rounded-lg bg-dark border border-white/10">
                                        {shortAddress}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="flex items-center gap-2"
                                        onClick={handleCopyAddress}
                                    >
                                        <Copy size={16} />
                                        <span className="text-xs">
                                            {hasCopiedAddress ? t('Home.receive.copied') : t('Home.receive.copy')}
                                        </span>
                                    </Button>
                                </div>
                                <div className="flex items-start justify-between gap-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <BaseIcon size="md" />
                                        <div className="space-y-0.5">
                                            <span className="text-white/80">{t('Home.deposit.networkLabel')}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-white">{t('Home.deposit.networkValue')}</span>
                                                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] uppercase tracking-wide text-white/90">
                                                    {defaultBadge}
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-white/70">{defaultNetworkMeta}</span>
                                        </div>
                                    </div>
                                    <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => setShowWhyBase(true)}>
                                        {supportedNetworksLabel}
                                    </Button>
                                </div>
                                <p className="text-xs text-white/70">{t('Home.network.defaultHint')}</p>
                                <div className="flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-50">
                                    <AlertTriangle size={14} className="mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="leading-relaxed text-amber-50">{preventionNotice}</p>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-[11px] font-semibold text-amber-50 hover:text-white"
                                            onClick={() => setShowWhyBase(true)}
                                        >
                                            {supportedNetworksLabel}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-white/80">{t('Home.deposit.examplesTitle')}</p>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => setShowDepositExamples((prev) => !prev)}
                                    >
                                        {t('Home.deposit.examplesToggle')}
                                    </Button>
                                </div>
                                {showDepositExamples && (
                                    <ul className="list-disc pl-4 text-sm text-white/80 space-y-1">
                                        <li>{t('Home.deposit.examples.buyWithPix')}</li>
                                        <li>{t('Home.deposit.examples.exchangeWithdraw')}</li>
                                    </ul>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showWhyBase && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                        onClick={() => setShowWhyBase(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="relative w-full max-w-sm rounded-2xl bg-dark-surface border border-white/10 p-6 shadow-2xl space-y-3"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 transition-colors"
                                onClick={() => setShowWhyBase(false)}
                                aria-label={t('Common.back')}
                            >
                                <X size={18} />
                            </button>
                            <div className="space-y-2">
                                <h4 className="text-lg font-semibold">{t('Home.network.whyBaseTitle')}</h4>
                                <p className="text-sm text-white/70">{t('Home.network.whyBaseDesc')}</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
