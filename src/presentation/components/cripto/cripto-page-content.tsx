'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { useQrCameraScanner, parseEthereumUrl } from '@/presentation/hooks/use-qr-camera-scanner';
import { RecipientsList } from '@/presentation/components/cripto/recipients-list';
import { SendWizard } from '@/presentation/components/cripto/send-wizard';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import {
    AlertTriangle,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowDownLeft,
    ArrowUp,
    ArrowUpRight,
    List,
    Check,
    ChevronDown,
    FileDown,
    Folder,
    Copy,
    CreditCard,
    Eye,
    EyeOff,
    ExternalLink,
    Info,
    Pencil,
    Plus,
    QrCode,
    Search,
    ShieldCheck,
    Wallet,
    X,
    Zap,
    MoreHorizontal,
    Users,
    ScanLine
} from 'lucide-react';
import NextImage from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useAccount, useDisconnect, useChainId, useSwitchChain, useWalletClient, usePublicClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useUsdcBalance } from '@/presentation/hooks/use-usdc-balance';
import { RecipientWithAddresses, SelectedRecipient } from '@/presentation/components/cripto/types';
import QRCode from 'qrcode';
import { LocaleSwitchNotice } from '@/presentation/components/locale/locale-switcher';
import { AssetsSection } from '@/presentation/components/cripto/assets-section';
import { fetchAssetPrice, TESTNET_CHAINS } from '@/lib/currency';

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
const DEFAULT_CHAIN_ID = TESTNET_CHAINS.base.id;

type BaseIconSize = 'sm' | 'md' | 'lg';

const baseIconSizes: Record<BaseIconSize, { outer: string; icon: number }> = {
    sm: { outer: 'h-5 w-5', icon: 12 },
    md: { outer: 'h-6 w-6', icon: 14 },
    lg: { outer: 'h-7 w-7', icon: 16 },
};



// Standard Icon helper
function StandardIcon({ icon: Icon, bg = 'bg-white/10', color = 'text-white' }: { icon: React.ElementType; bg?: string; color?: string }) {
    return (
        <div className={`flex items-center justify-center rounded-full ${bg} h-10 w-10 ${color}`}>
            <Icon size={20} strokeWidth={2} />
        </div>
    );
}

function BaseIcon({ size = 'md' }: { size?: BaseIconSize }) {
    const { outer } = baseIconSizes[size] ?? baseIconSizes.md;

    return (
        <span className={`inline-block rounded bg-[#0052FF] ${outer}`} />
    );
}

type DepositRouteBullet = {
    text: string;
    tone?: 'positive' | 'warning' | 'neutral';
};

type DepositRouteOption = {
    title: string;
    helper?: string;
    bullets: DepositRouteBullet[];
    ctaLabel?: string;
    ctaHelper?: string;
};

type DepositRoutesCopy = {
    title: string;
    subtitle: string;
    recommended: {
        title: string;
        route: string;
        bullets: DepositRouteBullet[];
        footnote: string;
    };
    alternatives: {
        title: string;
        helper: string;
        options: DepositRouteOption[];
    };
    feeNotice: string;
    closeCta: string;
};

type PendingAsset = {
    id: string;
    label: string;
    amount?: number;
    fiatEstimate: number;
};

type PaymentGroupRecipient = {
    id: string;
    contactId: string;
    name: string;
    address: string;
    addressLabel?: string;
    value?: string; // Value in local currency (e.g., BRL)
};

type PaymentGroup = {
    id: string;
    name: string;
    token: string;
    network: string;
    exportToken?: 'USDC' | 'ETH'; // Default to USDC if undefined
    recipients: PaymentGroupRecipient[];
};

type PaymentGroupForm = {
    name: string;
    token: string;
    network: string;
    exportToken?: 'USDC' | 'ETH';
    recipients: PaymentGroupRecipient[];
};

type MultisendApp = {
    id: string;
    name: string;
    cta: string;
    helper?: string;
    description: string;
    url: string;
    recommended?: boolean;
    bgColor?: string;
    textColor?: string;
    initial?: string;
};

const INITIAL_PAYMENT_GROUPS: PaymentGroup[] = [
    {
        id: 'group-salarios',
        name: 'Salarios mensais - Empresa X',
        token: 'USDC',
        network: 'Base',
        recipients: INITIAL_RECIPIENTS.slice(0, 3).map((contact, index) => ({
            id: `sample-${index + 1}`,
            contactId: contact.id,
            name: contact.name,
            address: contact.addresses[0]?.address || '',
            addressLabel: contact.addresses[0]?.label,
        })),
    },
];

type HistoryItem = {
    id: string;
    title: string;
    helper: string;
    amount: number;
    token: string;
    direction: 'in' | 'out';
    date: string;
    fiatRate: number;
    address?: string; // Simulated address for renaming feature
};

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
    const [showDepositAlternatives, setShowDepositAlternatives] = useState(false);
    const [showOtherAssetsModal, setShowOtherAssetsModal] = useState(false);
    const [showConversionModal, setShowConversionModal] = useState(false);
    const [showExternalConversionConfirm, setShowExternalConversionConfirm] = useState(false);
    const [showConversionAlternatives, setShowConversionAlternatives] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [transactionLabels, setTransactionLabels] = useState<Record<string, string>>({});
    const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
    const [tempLabel, setTempLabel] = useState('');
    const copyFeedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isDisconnectConfirmOpen, setIsDisconnectConfirmOpen] = useState(false);
    const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);

    const [selectedProvider, setSelectedProvider] = useState<typeof DEPOSIT_PROVIDERS[0] | null>(null);
    const [showSaveAddressModal, setShowSaveAddressModal] = useState(false);
    const [showYieldModal, setShowYieldModal] = useState(false);

    const [pendingScanAddress, setPendingScanAddress] = useState<string | null>(null);
    const [pendingScanAmount, setPendingScanAmount] = useState<string | undefined>(undefined);
    const [pendingScanAsset, setPendingScanAsset] = useState<string | undefined>(undefined);

    // QR Camera Scanner Hook - Following SOLID principles (SRP)
    const qrScanner = useQrCameraScanner({
        onScan: useCallback((result) => {
            setPendingScanAmount(result.amount);
            setPendingScanAsset(result.asset);

            const existingContact = recipients.find(r =>
                r.addresses.some(a => a.address.toLowerCase() === result.address.toLowerCase())
            );

            if (existingContact) {
                setSelectedRecipient({
                    id: existingContact.id,
                    name: existingContact.name,
                    address: result.address,
                    label: existingContact.addresses.find(
                        a => a.address.toLowerCase() === result.address.toLowerCase()
                    )?.label
                });
                setView('send');
            } else {
                setPendingScanAddress(result.address);
                setShowSaveAddressModal(true);
            }
        }, [recipients]),
        normalizeAddress: useCallback((address: string) => {
            try {
                const { getAddress } = require('viem');
                return getAddress(address.trim());
            } catch {
                return null;
            }
        }, []),
    });

    // Alias for backwards compatibility
    const isQrScanModalOpen = qrScanner.isOpen;
    const setIsQrScanModalOpen = useCallback((open: boolean) => {
        if (open) qrScanner.open();
        else qrScanner.close();
    }, [qrScanner]);
    const cameraError = qrScanner.error;
    const videoRef = qrScanner.videoRef;
    const canvasRef = qrScanner.canvasRef;

    const handleProviderClick = (provider: typeof DEPOSIT_PROVIDERS[0]) => {
        window.open(provider.url, '_blank', 'noopener,noreferrer');
        setIsDepositOpen(false);
        setSelectedProvider(provider);
        setIsProviderModalOpen(true);
    };

    const handleExternalConversionClick = () => {
        setShowExternalConversionConfirm(true);
    };

    const handleExternalConversionConfirm = () => {
        if (typeof window !== 'undefined') {
            window.open('https://ff.io', '_blank', 'noopener,noreferrer');
        }
        setShowExternalConversionConfirm(false);
        setIsDepositOpen(false);
    };

    // Load transaction labels from local storage
    useEffect(() => {
        const saved = localStorage.getItem('paycripto-labels');
        if (saved) {
            try {
                setTransactionLabels(JSON.parse(saved));
            } catch { }
        }
    }, []);



    // Wallet connection
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const chainId = useChainId();
    const { chains: switchableChains, switchChain, isPending: isSwitchingChain } = useSwitchChain();
    const isAllowedChain = !chainId || ALLOWED_CHAIN_IDS.has(chainId);
    const networkBlocked = isConnected && !!chainId && !isAllowedChain;
    const canSwitchChain = Boolean(switchChain);
    const defaultChainOption = switchableChains.find((chain) => chain.id === DEFAULT_CHAIN_ID);
    const isPreview = !isConnected;

    // USDC balance with fiat conversion
    const { usdcBalance, fiatValue, fiatSymbol, fiatCode, isLoading: isLoadingBalance } = useUsdcBalance(locale);

    // Wagmi Clients for Paymaster
    // Wagmi Clients for Paymaster
    const { data: wagmiWalletClient } = useWalletClient();
    const wagmiPublicClient = usePublicClient();



    const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

    const defaultNetworkName = t('Home.network.defaultValue');
    const defaultNetworkMeta = t('Home.network.defaultMeta');
    const defaultBadge = t('Home.network.defaultBadge');
    const createGroupMemberFromContact = (contact: RecipientWithAddresses, existingId?: string): PaymentGroupRecipient | null => {
        const primaryAddress = contact.addresses[0];
        if (!primaryAddress) return null;

        return {
            id: existingId || `member-${Math.random().toString(36).slice(2, 8)}`,
            contactId: contact.id,
            name: contact.name,
            address: primaryAddress.address,
            addressLabel: primaryAddress.label,
        };
    };
    const createEmptyGroupForm = (): PaymentGroupForm => ({
        name: '',
        token: 'USDC',
        network: defaultNetworkName,
        exportToken: 'USDC',
        recipients: [],
    });
    const [paymentGroups, setPaymentGroups] = useState<PaymentGroup[]>(INITIAL_PAYMENT_GROUPS);
    const [groupForm, setGroupForm] = useState<PaymentGroupForm>(createEmptyGroupForm);
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [groupContactSearch, setGroupContactSearch] = useState('');
    const [isGroupsOpen, setIsGroupsOpen] = useState(false);
    const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
    const [isMultisendModalOpen, setIsMultisendModalOpen] = useState(false);
    const [showNextStepsModal, setShowNextStepsModal] = useState(false);
    const [lastExportedGroupName, setLastExportedGroupName] = useState<string>('');
    const [lastExportedFileName, setLastExportedFileName] = useState<string>('');
    const [showQuickInstructions, setShowQuickInstructions] = useState(false);
    const [lastExportedTotalValue, setLastExportedTotalValue] = useState<number>(0);
    const [lastExportedDate, setLastExportedDate] = useState<string>('');
    const [lastExportedRate, setLastExportedRate] = useState<number | null>(null);
    const [lastExportedToken, setLastExportedToken] = useState<string>('USDC');

    // Currency Conversion State
    const [currentExportRate, setCurrentExportRate] = useState<number | null>(null);
    const [isExportRateLoading, setIsExportRateLoading] = useState(false);

    useEffect(() => {
        if (!isGroupModalOpen) return;

        const loadRate = async () => {
            setIsExportRateLoading(true);
            const token = groupForm.exportToken || 'USDC';
            // For UI display, we use the current rate
            const rate = await fetchAssetPrice(token, 'BRL'); // Assuming BRL as per user context
            setCurrentExportRate(rate);
            setIsExportRateLoading(false);
        };

        loadRate();
    }, [isGroupModalOpen, groupForm.exportToken]);
    // Sub-modal para criar novo contato dentro do modal de grupo
    const [isGroupNewContactOpen, setIsGroupNewContactOpen] = useState(false);
    const [groupNewContact, setGroupNewContact] = useState({ name: '', address: '', label: '' });
    const parsedBalance = Number.parseFloat(usdcBalance || '0');
    const hasBalance = Number.isFinite(parsedBalance) && parsedBalance > 0;
    const balanceValue = showBalance ? (isLoadingBalance ? '...' : usdcBalance) : '*****';
    const showFiatLine = showBalance && !isLoadingBalance;
    const balanceToggleLabel = showBalance ? t('Home.balance.hide') : t('Home.balance.show');
    const conversionNotice = t('Home.balance.conversionNotice');
    const conversionTooltip = t('Home.balance.tooltip');
    const balanceDescription = t('Home.balance.description');
    const preventionNotice = t('Home.network.compatibilityNotice');
    const supportedNetworksLabel = t('Home.network.seeSupported');
    const depositRoutes = useMemo<DepositRoutesCopy>(() => {
        return {
            title: t('Home.deposit.examplesTitle'),
            subtitle: t('Home.deposit.examplesSubtitle'),
            recommended: {
                title: t('Home.deposit.examplesRecommended.title'),
                route: t('Home.deposit.examplesRecommended.route'),
                bullets: [
                    { text: t('Home.deposit.examplesRecommended.bullets.speed'), tone: 'positive' },
                    { text: t('Home.deposit.examplesRecommended.bullets.cost'), tone: 'positive' },
                    { text: t('Home.deposit.examplesRecommended.bullets.risk'), tone: 'neutral' },
                ],
                footnote: t('Home.deposit.examplesRecommended.footnote'),
            },
            alternatives: {
                title: t('Home.deposit.examplesAlternatives.title'),
                helper: t('Home.deposit.examplesAlternatives.helper'),
                options: [
                    {
                        title: t('Home.deposit.examplesAlternatives.option1.title'),
                        bullets: [
                            { text: t('Home.deposit.examplesAlternatives.option1.bullets.fast'), tone: 'positive' },
                            { text: t('Home.deposit.examplesAlternatives.option1.bullets.cost'), tone: 'neutral' },
                            { text: t('Home.deposit.examplesAlternatives.option1.bullets.use'), tone: 'neutral' },
                        ],
                    },
                    {
                        title: t('Home.deposit.examplesAlternatives.option2.title'),
                        helper: t('Home.deposit.examplesAlternatives.option2.helper'),
                        bullets: [
                            { text: t('Home.deposit.examplesAlternatives.option2.bullets.tech'), tone: 'positive' },
                            { text: t('Home.deposit.examplesAlternatives.option2.bullets.cost'), tone: 'warning' },
                            { text: t('Home.deposit.examplesAlternatives.option2.bullets.alert'), tone: 'warning' },
                        ],
                        ctaLabel: t('Home.deposit.examplesAlternatives.option2.cta'),
                        ctaHelper: t('Home.deposit.examplesAlternatives.option2.ctaHelper'),
                    },
                    {
                        title: t('Home.deposit.examplesAlternatives.option3.title'),
                        bullets: [
                            { text: t('Home.deposit.examplesAlternatives.option3.bullets.safe'), tone: 'positive' },
                            { text: t('Home.deposit.examplesAlternatives.option3.bullets.cost'), tone: 'neutral' },
                            { text: t('Home.deposit.examplesAlternatives.option3.bullets.time'), tone: 'warning' },
                        ],
                    },
                ],
            },
            feeNotice: t('Home.deposit.examplesFeeNotice'),
            closeCta: t('Home.deposit.examplesClose'),
        };
    }, [t]);
    const multisendApps = useMemo<MultisendApp[]>(() => {
        return [
            {
                id: 'cryptosender',
                name: 'CryptoSender',
                cta: t('Home.paymentGroups.nextSteps.apps.cryptosender.cta'),
                helper: t('Home.paymentGroups.nextSteps.apps.cryptosender.helper'),
                description: t('Home.paymentGroups.nextSteps.apps.cryptosender.description'),
                url: 'https://cryptosender.io/',
                recommended: true,
                bgColor: 'bg-[#7C3AED]',
                textColor: 'text-white',
                initial: 'C',
            },
            {
                id: 'multisender',
                name: 'MultiSender Classic',
                cta: t('Home.paymentGroups.nextSteps.apps.multisender.cta'),
                description: t('Home.paymentGroups.nextSteps.apps.multisender.description'),
                url: 'https://classic.multisender.app/',
                bgColor: 'bg-[#0052FF]',
                textColor: 'text-white',
                initial: 'M',
            },
        ];
    }, [t]);

    const DEPOSIT_PROVIDERS = [
        {
            id: 'moonpay',
            name: 'MoonPay',
            description: 'PIX, Debit Card, Apple Pay, Google Pay',
            url: 'https://buy.moonpay.com/?apiKey=pk_live_uQG4BJC4w3cxnqpcSqAfohdBFDTsY6E&baseCurrencyAmount=100&baseCurrencyCode=usd&currencyCode=usdc_base&defaultCurrencyCode=eth&externalCustomerId=0x40b48E8123faC68BE56F40Ad7ba01aC49F6936Cb&externalTransactionId=MOONPAYeeaa7243-ebf6-4973-986f-7e4f80b0555c&walletAddress=0x40b48E8123faC68BE56F40Ad7ba01aC49F6936Cb&colorCode=0xFFFC72FF&redirectURL=https%3A%2F%2Fapp.uniswap.org%2Fbuy&areFeesIncluded=true&requestSource=uniswap-web&signature=0wW5n1gOVlxEWwGvWEP4UeNunhqQlzc%2F3ECQBFSVvFc%3D',
            bgColor: 'bg-[#7C3AED]',
            textColor: 'text-white',
            initial: 'M'
        },
        {
            id: 'coinbase',
            name: 'Coinbase',
            description: 'Debit Card, Coinbase Cash Balance',
            url: 'https://pay.coinbase.com/buy?defaultPaymentMethod=CARD&fiatCurrency=USD&presetFiatAmount=100&quoteId=552a0fd2-82b0-4467-9e9e-5ae4f195fb0e&sessionToken=MWYwZTRjNDAtMTFjYi02MmNiLTk4MDYtOTJjNzY5YTdhNDNm&partnerUserId=a8b7ebce-ec65-4d4f-9c27-0808912d50bc',
            bgColor: 'bg-[#0052FF]',
            textColor: 'text-white',
            initial: 'C'
        },
        {
            id: 'topper',
            name: 'Topper',
            description: 'Debit Card, Apple Pay, Google Pay e outras opções',
            url: 'https://meldcrypto.com/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJtZWxkLmlvIiwiaWF0IjoxNzY3MDE4ODU3LCJzdWIiOiJjcnlwdG8iLCJleHAiOjE3NjcwMjA2NTcsImFjY291bnRJZCI6IldYRUU1TWlzbjh2WjloQ2RxWVRBejMiLCJzZXNzaW9uSWQiOiJXZVE1amZQZWNjdUEzN0dlSEM4R0p3In0.0vNrmIyhQUdXH-5E_xBVFFgAycnDXKhMNiYRiCCC-Ic',
            bgColor: 'bg-[#000000]',
            textColor: 'text-white',
            initial: 'T'
        }
    ];
    const currencyFormatter = useMemo(() => {
        try {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: fiatCode || 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        } catch {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        }
    }, [fiatCode, locale]);
    const numberFormatter = useMemo(
        () =>
            new Intl.NumberFormat(locale, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }),
        [locale]
    );
    const formatCurrency = (value: number) => currencyFormatter.format(value);
    const historyItems = useMemo<HistoryItem[]>(
        () => [
            {
                id: 'tx-1',
                title: t('Home.historySection.sample.incoming'),
                helper: `${defaultNetworkName} - Empresa X`,
                address: '0x123...abc', // Mock address
                amount: 320,
                token: 'USDC',
                direction: 'in',
                date: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
                fiatRate: 5.82,
            },
            {
                id: 'tx-2',
                title: t('Home.historySection.sample.outgoing'),
                helper: `${defaultNetworkName} - Joao Santos`,
                address: '0x456...def', // Mock address
                amount: 45,
                token: 'USDC',
                direction: 'out',
                date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.5).toISOString(), // 1.5 days ago
                fiatRate: 5.79,
            },
            {
                id: 'tx-3',
                title: t('Home.historySection.sample.deposit'),
                helper: `${defaultNetworkName} - On-ramp`,
                amount: 180,
                token: 'USDC',
                direction: 'in',
                date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
                fiatRate: 5.75,
            },
        ],
        [defaultNetworkName, t]
    );

    // Yield Calculation
    const yieldResult = useMemo(() => {
        if (!usdcBalance || isLoadingBalance) return null;

        const currentBalance = Number.parseFloat(usdcBalance);
        const currentFiat = Number.parseFloat(fiatValue.replace(/[^0-9.-]+/g, ''));
        const currentRate = currentBalance > 0 ? currentFiat / currentBalance : 0; // Derived approximation

        if (currentRate === 0) return null;

        const calculator = new YieldCalculator();
        // Use a mock provider for historical rate slightly lower to ensure positive yield for demo if current rate is used as fallback
        // Or better yet, simply rely on the logic. 
        // For the sake of the "Concept", let's assume the rate 30 days ago was slightly lower (appreciation).
        // If we strictly use 0 yield it might not show the feature. 
        // Let's create a "realistic" demo scenario where rate appreciated by 0.5% if we can't determine it.
        const mockHistoricalRate = currentRate * 0.995;

        return calculator.calculateMonthlyYield(
            currentBalance,
            currentRate,
            historyItems,
            Date.now(),
            () => mockHistoricalRate
        );
    }, [usdcBalance, fiatValue, isLoadingBalance, historyItems]);

    const futureYieldResult = useMemo(() => {
        if (!usdcBalance || isLoadingBalance) return null;
        const currentBalance = Number.parseFloat(usdcBalance);
        const currentFiat = Number.parseFloat(fiatValue.replace(/[^0-9.-]+/g, ''));
        const currentRate = currentBalance > 0 ? currentFiat / currentBalance : 0;

        if (currentBalance <= 0) return null;

        const annualYieldUsdc = currentBalance * 0.06;
        const annualYieldFiat = annualYieldUsdc * currentRate;

        return {
            annualYieldUsdc,
            annualYieldFiat,
            formattedFiat: currencyFormatter.format(annualYieldFiat)
        };
    }, [usdcBalance, fiatValue, isLoadingBalance, currencyFormatter]);

    // Pending assets: until we fetch real token balances, keep it empty to avoid fake values
    const pendingAssets = useMemo<PendingAsset[]>(() => [], []);
    const pendingAssetsTotal = useMemo(
        () => pendingAssets.reduce((sum, asset) => sum + asset.fiatEstimate, 0),
        [pendingAssets]
    );
    const pendingAssetsTotalLabel = showBalance ? formatCurrency(pendingAssetsTotal) : '*****';
    const otherAssetsHelper = t('Home.otherAssets.lineTooltip');
    const bulletToneClass = (tone?: DepositRouteBullet['tone']) => {
        if (tone === 'positive') return 'bg-emerald-400';
        if (tone === 'warning') return 'bg-amber-400';
        return 'bg-white/70';
    };
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
    const normalizeText = (value: string) =>
        value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    const selectedContact = useMemo(
        () => recipients.find((recipient) => recipient.id === newRecipient.contactId),
        [recipients, newRecipient.contactId]
    );
    const normalizedFormAddress = normalizeAddress(newRecipient.address);
    const matchingExistingRecipients = useMemo(() => {
        if (newRecipient.mode !== 'new') return [];
        const term = normalizeText(newRecipient.name);
        if (!term) return [];

        return recipients
            .filter((recipient) => normalizeText(recipient.name).includes(term))
            .slice(0, 3);
    }, [newRecipient.mode, newRecipient.name, recipients]);

    const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
    const shortenWalletAddress = (value: string) =>
        value.length <= 10 ? value : `${value.slice(0, 6)}...${value.slice(-4)}`;
    const getInitials = (name: string) =>
        name
            .split(' ')
            .filter(Boolean)
            .map((part) => part[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    const getRecipientAddressPreview = (recipient: RecipientWithAddresses) => {
        const primaryAddress = recipient.addresses[0];
        if (!primaryAddress) {
            return t('Recipients.suggestions.noAddress');
        }
        const shortened = shortenWalletAddress(primaryAddress.address);
        return primaryAddress.label ? `${primaryAddress.label} · ${shortened}` : shortened;
    };

    const saveTransactionLabel = (id: string, label: string) => {
        const newLabels = { ...transactionLabels, [id]: label };
        setTransactionLabels(newLabels);
        localStorage.setItem('paycripto-labels', JSON.stringify(newLabels));
        setEditingTransactionId(null);

        // Smart Address Saving
        const tx = historyItems.find(item => item.id === id);
        if (tx && tx.address) {
            const normalizedAddr = normalizeAddress(tx.address);
            if (normalizedAddr) {
                const exists = recipients.some(r => r.addresses.some(a => a.address.toLowerCase() === normalizedAddr.toLowerCase()));
                if (!exists) {
                    const newContact: RecipientWithAddresses = {
                        id: createId('recipient'),
                        name: label,
                        addresses: [{ id: createId('addr'), address: normalizedAddr, label: 'Principal' }]
                    };
                    setRecipients(prev => [...prev, newContact]);
                }
            }
        }
    };

    const contactMapById = useMemo(
        () =>
            recipients.reduce<Record<string, RecipientWithAddresses>>((acc, contact) => {
                acc[contact.id] = contact;
                return acc;
            }, {}),
        [recipients]
    );
    const groupSelectedContactIds = useMemo(
        () => new Set(groupForm.recipients.map((recipient) => recipient.contactId)),
        [groupForm.recipients]
    );
    const filteredGroupContacts = useMemo(() => {
        const term = normalizeText(groupContactSearch);
        if (!term) return recipients;
        return recipients.filter((contact) => {
            const normalizedName = normalizeText(contact.name);
            const matchesName = normalizedName.includes(term);
            const matchesAddress = contact.addresses.some((address) => {
                const label = normalizeText(address.label || '');
                const normalizedAddress = normalizeText(address.address);
                return label.includes(term) || normalizedAddress.includes(term);
            });
            return matchesName || matchesAddress;
        });
    }, [groupContactSearch, recipients]);

    const resetGroupForm = (group?: PaymentGroup) => {
        if (group) {
            const normalizedRecipients = group.recipients
                .map((recipient) => {
                    const contact = contactMapById[recipient.contactId];
                    if (contact) {
                        const member = createGroupMemberFromContact(contact, recipient.id);
                        return member ? { ...member, value: recipient.value } : null;
                    }
                    if (!recipient.address) return null;
                    return {
                        ...recipient,
                        id: recipient.id || createId('member'),
                    };
                })
                .filter(Boolean) as PaymentGroupRecipient[];
            setGroupForm({
                name: group.name,
                token: group.token,
                network: group.network || defaultNetworkName,
                exportToken: group.exportToken || 'USDC',
                recipients: normalizedRecipients,
            });
            setEditingGroupId(group.id);
            setGroupContactSearch('');
            return;
        }
        setGroupForm(createEmptyGroupForm());
        setEditingGroupId(null);
        setGroupContactSearch('');
    };
    const handleOpenCreateGroup = () => {
        resetGroupForm();
        setIsGroupModalOpen(true);
    };
    const handleOpenEditGroup = (group: PaymentGroup) => {
        resetGroupForm(group);
        setIsGroupModalOpen(true);
    };



    const handleToggleContactInGroup = (contact: RecipientWithAddresses) => {
        const member = createGroupMemberFromContact(contact);
        if (!member) return;
        setGroupForm((prev) => {
            const exists = prev.recipients.some((recipient) => recipient.contactId === contact.id);
            if (exists) {
                return {
                    ...prev,
                    recipients: prev.recipients.filter((recipient) => recipient.contactId !== contact.id),
                };
            }
            return {
                ...prev,
                recipients: [...prev.recipients, member],
            };
        });
    };
    const canSaveGroup = groupForm.name.trim().length > 0 && groupForm.recipients.length > 0;
    const handleSaveGroup = () => {
        const sanitizedRecipients = groupForm.recipients
            .map((recipient) => ({
                ...recipient,
                name: recipient.name.trim(),
                address: recipient.address.trim(),
            }))
            .filter((recipient) => recipient.address !== '' && recipient.contactId);

        if (!groupForm.name.trim() || sanitizedRecipients.length === 0) {
            return;
        }

        const payload: PaymentGroup = {
            id: editingGroupId || createId('group'),
            name: groupForm.name.trim(),
            token: groupForm.token || 'USDC',
            network: groupForm.network || defaultNetworkName,
            exportToken: groupForm.exportToken,
            recipients: sanitizedRecipients,
        };

        setPaymentGroups((prev) => {
            if (editingGroupId) {
                return prev.map((group) => (group.id === editingGroupId ? payload : group));
            }
            return [payload, ...prev];
        });

        setIsGroupModalOpen(false);
        resetGroupForm();
    };
    const openMultisendApp = (url: string) => {
        if (typeof window === 'undefined') return;
        window.open(url, '_blank', 'noopener,noreferrer');
    };
    const handleExportGroup = async (group: PaymentGroup) => {
        const validRecipients = group.recipients.filter((recipient) => recipient.address);
        if (!validRecipients.length) return;

        let exportPrice = 1;
        const targetToken = group.exportToken || 'USDC';

        // If converting BRL to a token, we need the token price in BRL
        // amount = value_in_brl / price_of_token_in_brl
        if (targetToken) {
            // Use current rate for export as requested
            // We force 'BRL' here because the input is explicitly "Value (R$)"
            exportPrice = await fetchAssetPrice(targetToken, 'BRL');
        }

        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR');
        const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const scanId = `PAY-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
        const simulatedBlock = Math.floor(Math.random() * 1000000) + 18000000;

        setScanDetails({
            id: scanId,
            date: dateStr,
            time: timeStr,
            block: simulatedBlock
        });

        const metadataHeader = [
            `# PayCrypto Scan: ${scanId}`,
            `# Data: ${dateStr} ${timeStr}`,
            `# Rate: 1 ${targetToken} = ${currencyFormatter.format(exportPrice || 0)} (BRL)`,
            `# Block Height: ${simulatedBlock}`,
            `# ----------------------------------------`
        ].join('\n');

        const header = '# address,amount'; // Commented out as requested
        const rows = validRecipients.map((recipient) => {
            let amount = '';
            if (recipient.value) {
                const val = parseFloat(recipient.value.replace(',', '.'));
                if (!isNaN(val) && exportPrice > 0) {
                    amount = (val / exportPrice).toFixed(6);
                }
            }
            return `${recipient.address},${amount}`;
        });

        const csvContent = [metadataHeader, header, ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const fileName = `${group.name.replace(/\s+/g, '-').toLowerCase()}-paycrypto.csv`;
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);

        // Calculate Total Value
        const total = group.recipients.reduce((sum, recipient) => {
            const val = parseFloat(recipient.value || '0');
            return sum + (isNaN(val) ? 0 : val);
        }, 0);
        setLastExportedTotalValue(total);

        // Set Date
        setLastExportedDate(now.toLocaleString(locale, {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }));

        setLastExportedGroupName(group.name);
        setLastExportedFileName(fileName);

        // Set Token & Rate
        const token = group.exportToken || group.token || 'USDC';
        setLastExportedToken(token);

        // Try to use current rate if available and matching, otherwise fetch or use fallback
        // Since this is sync, we'll trigger a background fetch if needed or just use what we have
        const fetchRateForExport = async () => {
            try {
                const rate = await fetchAssetPrice(token, 'BRL');
                setLastExportedRate(rate);
            } catch (e) {
                console.error('Failed to fetch export rate', e);
                setLastExportedRate(null);
            }
        };
        fetchRateForExport();

        setShowQuickInstructions(false);
        setShowNextStepsModal(true);
    };
    const handleCloseGroupModal = () => {
        setIsGroupModalOpen(false);
        setIsGroupNewContactOpen(false);
        setGroupNewContact({ name: '', address: '', label: '' });
        resetGroupForm();
    };

    // Função para abrir o sub-modal de novo contato dentro do modal de grupo
    const handleOpenGroupNewContact = () => {
        setGroupNewContact({ name: '', address: '', label: '' });
        setIsGroupNewContactOpen(true);
    };

    // Função para adicionar um contato a partir do modal de grupo
    const handleAddContactFromGroup = () => {
        const normalizedAddress = normalizeAddress(groupNewContact.address);
        const trimmedName = groupNewContact.name.trim();

        if (!normalizedAddress || !trimmedName) return;

        const label = groupNewContact.label.trim() || 'Principal';
        const newAddress = { id: createId('addr'), address: normalizedAddress, label };
        const contactId = createId('recipient');

        const newContact: RecipientWithAddresses = {
            id: contactId,
            name: trimmedName,
            addresses: [newAddress],
        };

        // Adiciona o contato à lista de recipients
        setRecipients((prev) => [...prev, newContact]);

        // Fecha o sub-modal e reseta o formulário
        setIsGroupNewContactOpen(false);
        setGroupNewContact({ name: '', address: '', label: '' });
    };

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
    const handleUseExistingRecipient = (contactId: string) => {
        setNewRecipient((prev) => ({
            ...prev,
            mode: 'existing',
            contactId,
            name: '',
        }));
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

    const copyToClipboard = async (value: string) => {
        if (!value) return;
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(value);
            } else {
                throw new Error('Clipboard API not available');
            }
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = value;
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
    };

    const handleCopyAddress = async () => {
        if (!address) return;

        await copyToClipboard(address);

        setHasCopiedAddress(true);
        if (copyFeedbackTimeout.current) {
            clearTimeout(copyFeedbackTimeout.current);
        }
        copyFeedbackTimeout.current = setTimeout(() => setHasCopiedAddress(false), 1500);
    };

    const handleSelectRecipient = useCallback((recipient: SelectedRecipient) => {
        setSelectedRecipient(recipient);
        setView('send');
    }, []);

    useEffect(() => {
        if (!isConnected) {
            setIsReceiveOpen(false);
            setIsDepositOpen(false);
            setShowOtherAssetsModal(false);
            setShowConversionModal(false);
            setIsMultisendModalOpen(false);
            setIsGroupsOpen(false);
        }
    }, [isConnected]);

    useEffect(() => {
        if (networkBlocked) {
            setIsReceiveOpen(false);
            setIsDepositOpen(false);
            setShowOtherAssetsModal(false);
            setShowConversionModal(false);
            setIsMultisendModalOpen(false);
            setIsGroupsOpen(false);
        }
    }, [networkBlocked]);

    useEffect(() => {
        if (!isGroupsOpen) {
            setExpandedGroupId(null);
            return;
        }

        const hasValidGroup = paymentGroups.some((group) => group.id === expandedGroupId);
        if (!hasValidGroup) {
            setExpandedGroupId(paymentGroups[0]?.id ?? null);
        }
    }, [expandedGroupId, isGroupsOpen, paymentGroups]);

    useEffect(() => {
        if (!isDepositOpen) {
            setShowDepositAlternatives(false);
        }
        if (!isReceiveOpen && !isDepositOpen) {
            setShowWhyBase(false);
        }
    }, [isDepositOpen, isReceiveOpen]);

    useEffect(() => {
        if (!showConversionModal) {
            setShowConversionAlternatives(false);
        }
    }, [showConversionModal]);

    useEffect(() => {
        return () => {
            if (copyFeedbackTimeout.current) {
                clearTimeout(copyFeedbackTimeout.current);
            }
        };
    }, []);

    const handleConfirmSend = async (data: { asset: string; amount: string; chainId: number }) => {
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

        try {
            // Import dynamically to avoid loading on server
            const { createSmartWalletClient } = await import('@/lib/paymaster');
            // const { getPublicClient, getWalletClient } = await import('@wagmi/core');
            // const { config } = await import('@/presentation/providers/web3-provider'); 
            const { getAddress } = await import('viem'); // Import everything needed

            // We need the wallet client. since we are in a click handler, we can fetch it async if not available in state.
            // However, useWalletClient hook is better. Let's assume we add it to the component.
            // For now, to minimize component refactor, we attempt to get it from wagmi core actions if possible, 
            // or better, rely on the hook I will add.

            // We need the wallet client. since we are in a click handler, we can fetch it async if not available in state.
            // However, useWalletClient hook is better. Let's assume we add it to the component.
            // For now, to minimize component refactor, we attempt to get it from wagmi core actions if possible, 
            // or better, rely on the hook I will add.

            if (!wagmiWalletClient) throw new Error('Wallet not connected');

            const { smartAccountClient } = await createSmartWalletClient(wagmiWalletClient, wagmiPublicClient);

            // Construct the transaction
            // If asset is ETH/Native
            let txHash;

            if (data.asset === 'ETH') {
                txHash = await smartAccountClient.sendTransaction({
                    to: getAddress(selectedRecipient!.address),
                    value: parseUnits(data.amount, 18),
                    data: '0x'
                });
            } else if (data.asset === 'USDC') {
                // ERC20 Transfer
                // We need the USDC contract address. 
                const tokenAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'; // Base Sepolia

                // Encode transfer(to, amount)
                const { encodeFunctionData, parseUnits, erc20Abi } = await import('viem');
                const callData = encodeFunctionData({
                    abi: erc20Abi,
                    functionName: 'transfer',
                    args: [getAddress(selectedRecipient!.address), parseUnits(data.amount, 6)] // USDC has 6 decimals
                });

                txHash = await smartAccountClient.sendTransaction({
                    to: tokenAddress,
                    value: 0n,
                    data: callData
                });
            } else {
                throw new Error('Unsupported asset for Paymaster demo');
            }

            alert(`Transaction sent via Circle Paymaster! UserOp Hash: ${txHash}`);
            setView('home');
            setSelectedRecipient(null);

        } catch (error) {
            console.error('Paymaster transaction failed:', error);
            alert(`Error sending transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
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
                    const result = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: 'attemptBoth',
                    });

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
            // Reuse the same parsing used for camera scans
            handleScanResult(qrText);
            setQrStatus({ isReading: false, error: null });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao ler QR Code.';
            setQrStatus({ isReading: false, error: message });
            setCameraError(message);
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
        <div className={`min-h-screen bg-dark text-white font-sans ${isTestnet ? 'pt-10' : ''} flex flex-col`}>
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
                                <ShieldCheck className="mt-1 text-white/80" size={20} strokeWidth={1.75} />
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
            <main className="max-w-lg mx-auto px-4 py-6 space-y-4 flex-1 w-full">
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
                                <>
                                    <Card
                                        className={`relative overflow-hidden border ${hasBalance
                                            ? 'border-0 bg-gradient-to-br from-primary via-primary/80 to-secondary p-6'
                                            : 'border-white/10 bg-white/5 p-4'
                                            }`}
                                    >
                                        <div className="relative z-10 space-y-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-1">
                                                    <span className="text-white/80 text-sm font-medium tracking-tight">Saldo total</span>
                                                    <p className="text-[11px] text-white/50">{balanceDescription}</p>
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
                                                <span className="text-sm font-semibold text-white/70">USDC</span>
                                            </div>
                                            {showFiatLine && (
                                                <div className="flex flex-col gap-1">
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
                                                    {yieldResult && (yieldResult.yieldBrl > 0 || yieldResult.percentageOfCdi > 0) && (
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="text-emerald-400 font-medium">
                                                                +{currencyFormatter.format(yieldResult.yieldBrl)} este mês
                                                            </span>
                                                            <div className="h-3 w-px bg-white/20" />
                                                            <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                                                                {yieldResult.percentageOfCdi}% do CDI
                                                                <ArrowUp size={10} strokeWidth={3} />
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {pendingAssetsTotal > 0 && (
                                                <div className="flex flex-col gap-1 text-xs text-white/65">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowOtherAssetsModal(true)}
                                                        className="group inline-flex items-center gap-1 text-left text-white/70 hover:text-white"
                                                        title={otherAssetsHelper}
                                                    >
                                                        <span className="font-semibold text-white/80">+ {pendingAssetsTotalLabel}</span>
                                                        <span>{t('Home.otherAssets.lineSuffix')}</span>
                                                        <Info size={14} className="text-white/50 group-hover:text-white/70" />
                                                    </button>
                                                    <span className="text-[11px] text-white/50">
                                                        {t('Home.otherAssets.lineDisclaimer')}
                                                    </span>
                                                </div>
                                            )}
                                            {hasBalance && (
                                                <div className="pt-1 flex items-center gap-2 text-white/60 text-sm">
                                                    <span>Ganhe recompensas</span>
                                                    <div className="px-2 py-0.5 bg-white/15 rounded-full text-xs text-white/80">Novo</div>
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

                                    {/* Yield Section (99Pay Style) */}
                                    {hasBalance && futureYieldResult && (
                                        <button
                                            onClick={() => setShowYieldModal(true)}
                                            className="w-full text-left group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10 active:scale-[0.98]"
                                        >
                                            <div className="relative z-10 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                                                        <ArrowUpRight size={20} strokeWidth={2.5} />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="text-sm font-semibold text-white/90">{t('Home.yield.title')}</p>
                                                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400">
                                                                {t('Home.yield.estimatedRate')}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-white/50">{t('Home.yield.subtitle')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end text-right">
                                                    <p className="text-sm font-bold text-white">~ {futureYieldResult.formattedFiat}</p>
                                                    <p className="text-[10px] text-white/40">{t('Home.yield.fiatSuffix')}</p>
                                                </div>
                                            </div>
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <ArrowUpRight size={60} strokeWidth={2} />
                                            </div>
                                        </button>
                                    )}
                                </>
                            ) : (
                                <Card className="bg-dark-surface border border-white/10 p-6 text-center">
                                    <Wallet className="mx-auto mb-4 text-white/80" size={40} strokeWidth={1.75} />
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

                            {/* Deposit - Primary Action */}
                            <button
                                onClick={() => isConnected && setIsDepositOpen(true)}
                                disabled={!isConnected}
                                className={`w-full group relative overflow-hidden rounded-2xl bg-white text-black p-4 transition-all ${isConnected ? 'hover:brightness-110 active:scale-[0.98]' : 'opacity-60 cursor-not-allowed'
                                    }`}
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Plus size={80} strokeWidth={2} />
                                </div>
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800 text-white">
                                            <Plus size={20} strokeWidth={2} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-lg font-bold leading-tight uppercase tracking-tight">{t('Home.actions.deposit')}</p>
                                            <p className="text-xs font-medium text-black/60">{t('Home.actions.depositHelper')}</p>
                                        </div>
                                    </div>
                                </div>
                            </button>

                            {/* Quick Actions Grid */}
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => isConnected && setIsReceiveOpen(true)}
                                    disabled={!isConnected}
                                    className={`flex flex-col items-center justify-center gap-2 rounded-2xl bg-transparent p-4 transition-all ${isConnected ? 'hover:bg-white/10 active:scale-[0.98]' : 'opacity-60 cursor-not-allowed'
                                        }`}
                                >
                                    <StandardIcon icon={ArrowDown} />
                                    <span className="text-sm font-medium text-white">{t('Home.actions.receive')}</span>
                                </button>

                                <button
                                    onClick={() => isConnected && setView('recipients')}
                                    disabled={!isConnected}
                                    className={`flex flex-col items-center justify-center gap-2 rounded-2xl bg-transparent p-4 transition-all ${isConnected ? 'hover:bg-white/10 active:scale-[0.98]' : 'opacity-60 cursor-not-allowed'
                                        }`}
                                >
                                    <StandardIcon icon={ArrowUpRight} />
                                    <span className="text-sm font-medium text-white">{t('Home.actions.transfer')}</span>
                                </button>

                                <button
                                    onClick={() => isConnected && setIsQrScanModalOpen(true)}
                                    disabled={!isConnected}
                                    className={`flex flex-col items-center justify-center gap-2 rounded-2xl bg-transparent p-4 transition-all ${isConnected ? 'hover:bg-white/10 active:scale-[0.98]' : 'opacity-60 cursor-not-allowed'
                                        }`}
                                >
                                    <StandardIcon icon={ScanLine} />
                                    <span className="text-sm font-medium text-white">QR Code</span>
                                </button>
                            </div>

                            {/* Divider for Collapsed Sections */}
                            <div className="pt-2 space-y-1">
                                {/* Payment Groups (Row) */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-1 py-1">
                                        <div className="flex items-center gap-3">
                                            <Users size={20} className="text-white/70" />
                                            <p className="text-sm font-semibold text-white/90">{t('Home.paymentGroups.title')}</p>
                                        </div>
                                        {paymentGroups.length > 0 && (
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => !isPreview && setIsGroupsOpen(!isGroupsOpen)}
                                                    disabled={isPreview}
                                                    className={`text-xs font-medium ${isPreview ? 'text-white/30 cursor-not-allowed' : 'text-white/60 hover:text-white transition-colors'}`}
                                                >
                                                    {isGroupsOpen ? 'Mostrar menos' : 'Ver todos'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (isPreview) return;
                                                        handleOpenCreateGroup();
                                                    }}
                                                    disabled={isPreview}
                                                    className={`flex h-7 w-7 items-center justify-center rounded-full ${isPreview ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20 text-white transition-colors'}`}
                                                    title={t('Home.paymentGroups.create')}
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="px-1 py-1">
                                        {paymentGroups.length === 0 ? (
                                            <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-6 text-center space-y-4">
                                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/40">
                                                    <Folder size={24} strokeWidth={1.5} />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-base font-semibold text-white">Criar grupo de pagamento</h3>
                                                    <p className="text-xs text-white/50">Pague várias pessoas de uma vez via CSV</p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        if (isPreview) return;
                                                        handleOpenCreateGroup();
                                                    }}
                                                    disabled={isPreview}
                                                    className="w-full"
                                                >
                                                    Criar grupo
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {(isGroupsOpen ? paymentGroups : paymentGroups.slice(0, 2)).map((group, index) => {
                                                    // Cycle through the requested premium colors: Dark Blue, Dark Purple, Deep Green
                                                    const bgColors = ['bg-[#2E3A59]', 'bg-[#3B2F4A]', 'bg-[#1F3D2B]'];
                                                    const bgColor = bgColors[index % bgColors.length];

                                                    return (
                                                        <div
                                                            key={group.id}
                                                            className="group relative rounded-xl bg-white/5 p-4 hover:bg-white/10 transition-all border border-transparent hover:border-white/5"
                                                        >
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className="flex items-center gap-3 overflow-hidden">
                                                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bgColor} text-white/90`}>
                                                                        <span className="text-sm font-bold">{group.name.charAt(0).toUpperCase()}</span>
                                                                    </div>
                                                                    <div className="space-y-0.5 min-w-0">
                                                                        <p className="text-base font-semibold text-white leading-tight truncate">{group.name}</p>
                                                                        <p className="text-[13px] font-normal text-white/70 leading-tight truncate">
                                                                            {group.recipients.length} contatos · {group.token}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        disabled={isPreview}
                                                                        onClick={(e) => {
                                                                            if (isPreview) return;
                                                                            e.stopPropagation();
                                                                            handleExportGroup(group);
                                                                        }}
                                                                        className={`h-8 px-3 text-xs font-medium ${isPreview ? 'text-white/40 bg-white/5 cursor-not-allowed' : 'text-white/80 hover:text-white bg-white/5 hover:bg-white/10'}`}
                                                                    >
                                                                        Exportar
                                                                    </Button>
                                                                    <button
                                                                        disabled={isPreview}
                                                                        onClick={(e) => {
                                                                            if (isPreview) return;
                                                                            e.stopPropagation();
                                                                            handleOpenEditGroup(group);
                                                                        }}
                                                                        className={`p-1.5 rounded-full ${isPreview ? 'text-white/30 cursor-not-allowed' : 'text-white/40 hover:text-white hover:bg-white/10 transition-colors'}`}
                                                                    >
                                                                        <MoreHorizontal size={18} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Assets (Row) - No Card wrapper needed as component handles it */}
                                {isConnected && address ? (
                                    <AssetsSection address={address} />
                                ) : (
                                    <AssetsSection preview />
                                )}

                                {/* History (Row) */}
                                <div className="overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setIsHistoryOpen((prev) => !prev)}
                                        className={`w-full flex items-center justify-between group py-3 px-1 transition-colors rounded-lg ${isHistoryOpen ? 'bg-white/5' : 'hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="">
                                                <StandardIcon icon={List} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-white/90">{t('Home.actions.history')}</p>
                                            </div>
                                        </div>
                                        <ChevronDown
                                            size={16}
                                            className={`text-white/40 transition-transform duration-200 ${isHistoryOpen ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    <AnimatePresence initial={false}>
                                        {isHistoryOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="px-1 py-1"
                                            >
                                                <div className="space-y-2 pt-2">
                                                    {historyItems.length === 0 ? (
                                                        <p className="text-xs text-white/50">{t('Home.historySection.empty')}</p>
                                                    ) : (
                                                        historyItems.map((item) => {
                                                            const amountLabel = `${item.direction === 'out' ? '-' : '+'} ${numberFormatter.format(item.amount)} ${item.token}`;
                                                            const fiatAmount = item.amount * item.fiatRate;
                                                            const formattedFiat = currencyFormatter.format(fiatAmount);
                                                            const dateObj = new Date(item.date);
                                                            const dateLabel = dateObj.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
                                                            const timeLabel = dateObj.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

                                                            return (
                                                                <div
                                                                    key={item.id}
                                                                    className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${item.direction === 'in' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/8 text-white/70'}`}>
                                                                            {item.direction === 'in' ? <ArrowDownLeft size={16} strokeWidth={1.75} /> : <ArrowUpRight size={16} strokeWidth={1.75} />}
                                                                        </div>
                                                                        <div className="text-left group/item relative">
                                                                            {editingTransactionId === item.id ? (
                                                                                <div className="flex items-center gap-2">
                                                                                    <input
                                                                                        type="text"
                                                                                        value={tempLabel}
                                                                                        onChange={(e) => setTempLabel(e.target.value)}
                                                                                        className="bg-black/20 border border-white/10 rounded px-1 py-0 text-sm text-white w-32 focus:outline-none focus:border-primary/50"
                                                                                        autoFocus
                                                                                        onKeyDown={(e) => {
                                                                                            if (e.key === 'Enter') saveTransactionLabel(item.id, tempLabel);
                                                                                            if (e.key === 'Escape') setEditingTransactionId(null);
                                                                                        }}
                                                                                        onBlur={() => saveTransactionLabel(item.id, tempLabel)}
                                                                                    />
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex items-center gap-2">
                                                                                    <p className="text-sm font-medium text-white">
                                                                                        {transactionLabels[item.id] || item.title}
                                                                                    </p>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setEditingTransactionId(item.id);
                                                                                            setTempLabel(transactionLabels[item.id] || item.title);
                                                                                        }}
                                                                                        className="opacity-0 group-hover/item:opacity-100 text-white/30 hover:text-white/80 transition-opacity p-0.5"
                                                                                        title="Renomear"
                                                                                    >
                                                                                        <Pencil size={10} />
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                            <div className="flex flex-col text-[10px] sm:text-[11px] text-white/50 leading-tight">
                                                                                <span>{item.helper}</span>
                                                                                <span>{dateLabel} - {timeLabel}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col items-end">
                                                                        <span className={`text-sm font-semibold ${item.direction === 'out' ? 'text-white/80' : 'text-emerald-300'}`}>
                                                                            {amountLabel}
                                                                        </span>
                                                                        <span className="text-[10px] text-white/40">
                                                                            ~ {formattedFiat}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Receive address (technical card) */}
                            {isConnected && address ? (
                                <Card className="rounded-2xl border border-white/5 bg-black/20 p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] border border-blue-500/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            <span className="font-semibold text-blue-400">{defaultNetworkName}</span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowWhyBase(true)}
                                            className="h-6 text-[10px] text-white/40 hover:text-white/80 px-2 gap-1"
                                        >
                                            <Info size={12} />
                                            <span>Como funciona?</span>
                                        </Button>
                                    </div>

                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-2xl font-bold font-mono tracking-tight text-white">
                                                    {shortAddress}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button
                                                type="button"
                                                variant="primary"
                                                size="sm"
                                                onClick={handleCopyAddress}
                                                className="px-4 h-9 font-medium"
                                            >
                                                {hasCopiedAddress ? t('Home.receive.copied') : t('Home.receive.copy')}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsReceiveOpen(true)}
                                                className="h-9 px-3 border-white/10 text-white/60 hover:text-white hover:bg-white/5 hover:border-white/20"
                                                title="Mostrar QR Code"
                                            >
                                                <QrCode size={18} />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Disconnect Button / Divider */}
                                    <div className="border-t border-white/5 pt-3 -mx-4 px-4 bg-black/20">
                                        <button
                                            type="button"
                                            onClick={() => setIsDisconnectConfirmOpen(true)}
                                            className="w-full flex items-center gap-2 text-red-400/70 hover:text-red-400 transition-colors text-xs font-medium p-1 opacity-80 hover:opacity-100"
                                        >
                                            <AlertTriangle size={13} />
                                            <span>Desconectar carteira</span>
                                        </button>
                                    </div>
                                </Card>
                            ) : null}
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
                                initialAmount={pendingScanAmount}
                                initialAsset={pendingScanAsset}
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
                                        <div className="space-y-2">
                                            <Input
                                                label={t('Recipients.fields.name')}
                                                placeholder="Ex: Joao da Silva"
                                                value={newRecipient.name}
                                                onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                                            />
                                            {matchingExistingRecipients.length > 0 && (
                                                <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-semibold text-white/80">
                                                            {t('Recipients.suggestions.title')}
                                                        </p>
                                                        <p className="text-[11px] text-white/60">
                                                            {t('Recipients.suggestions.helper')}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        {matchingExistingRecipients.map((recipient) => (
                                                            <button
                                                                key={recipient.id}
                                                                type="button"
                                                                onClick={() => handleUseExistingRecipient(recipient.id)}
                                                                className="flex w-full items-center gap-3 rounded-lg bg-white/5 px-3 py-2 text-left transition hover:-translate-y-0.5 hover:bg-white/10"
                                                            >
                                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-white">
                                                                    {getInitials(recipient.name)}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-semibold text-white">{recipient.name}</p>
                                                                    <p className="text-xs text-white/60">
                                                                        {getRecipientAddressPreview(recipient)}
                                                                    </p>
                                                                </div>
                                                                <span className="text-xs font-semibold text-white/70">
                                                                    {t('Recipients.suggestions.useExisting')}
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
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
            </main>
            {view !== 'recipients' && (
                <div className="w-full max-w-lg mx-auto px-4 pb-6 mt-auto">
                    <LocaleSwitchNotice />
                </div>
            )}
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
                                className="absolute top-3 right-3 p-2 rounded-full text-white/40 hover:bg-white/5 hover:text-white transition-colors"
                                onClick={() => setIsReceiveOpen(false)}
                                aria-label={t('Common.back')}
                            >
                                <X size={18} />
                            </button>

                            <div className="space-y-6">
                                {/* Header: título + badge rede */}
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">{t('Home.receive.title')}</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowWhyBase(true)}
                                        className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2 py-1 text-[10px] text-white/40 hover:bg-white/10 transition-colors"
                                    >
                                        <BaseIcon size="sm" />
                                        <span>{defaultNetworkName}</span>
                                    </button>
                                </div>

                                {/* QR Code */}
                                <div id="receive-qr-container" className="flex flex-col items-center justify-center">
                                    {qrCodeDataUrl ? (
                                        <div className="rounded-2xl bg-white p-3 shadow-lg">
                                            <NextImage
                                                src={qrCodeDataUrl}
                                                alt={t('Home.receive.qrAlt')}
                                                width={180}
                                                height={180}
                                                className="h-44 w-44 object-contain"
                                                unoptimized
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-44 w-44 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
                                    )}

                                    {/* Microcopy Warning */}
                                    <p className="mt-4 text-center text-[11px] text-white/40">
                                        Envie apenas tokens na rede Base
                                    </p>
                                </div>

                                {/* Dois botões: Copiar + Receber (QR) */}
                                <div className="flex items-center justify-center gap-3">
                                    <Button
                                        type="button"
                                        variant="primary"
                                        size="sm"
                                        className="flex items-center gap-2 px-6"
                                        onClick={handleCopyAddress}
                                    >
                                        <Copy size={16} />
                                        <span>{hasCopiedAddress ? t('Home.receive.copied') : t('Home.receive.copy')}</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-2 px-4 border-white/10 text-white/60 hover:bg-white/5 hover:text-white"
                                        onClick={() => {
                                            // Scroll to QR or show QR inline
                                            const qrContainer = document.getElementById('receive-qr-container');
                                            if (qrContainer) {
                                                qrContainer.scrollIntoView({ behavior: 'smooth' });
                                            }
                                        }}
                                    >
                                        <QrCode size={16} />
                                        <span>{t('Home.receive.qrLabel')}</span>
                                    </Button>
                                </div>

                                {/* Endereço (agora por último e discreto) */}
                                <div className="text-center -mt-2">
                                    <span className="font-mono text-xs tracking-wide text-white/40">
                                        {shortAddress}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isDisconnectConfirmOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                        onClick={() => setIsDisconnectConfirmOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="relative w-full max-w-sm rounded-2xl bg-dark-surface border border-white/10 p-6 shadow-2xl space-y-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-white">Desconectar carteira?</h3>
                                <div className="space-y-1 text-sm text-white/60">
                                    <p>Você precisará reconectar para:</p>
                                    <ul className="list-disc list-inside space-y-0.5 text-red-400/80">
                                        <li>ver saldo</li>
                                        <li>enviar ou receber pagamentos</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsDisconnectConfirmOpen(false)}
                                    className="w-full hover:bg-white/5"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        disconnect();
                                        setIsDisconnectConfirmOpen(false);
                                    }}
                                    className="w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20"
                                >
                                    Desconectar
                                </Button>
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
                        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 backdrop-blur-sm px-4 py-6"
                        onClick={() => setIsDepositOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="relative w-full max-w-md rounded-2xl bg-dark-surface border border-white/10 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
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

                            <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-white/80">{depositRoutes.title}</p>
                                    <p className="text-xs text-white/60">{depositRoutes.subtitle}</p>
                                </div>

                                <div className="space-y-3">
                                    {DEPOSIT_PROVIDERS.map((provider) => (
                                        <button
                                            key={provider.id}
                                            onClick={() => handleProviderClick(provider)}
                                            className="w-full group relative flex items-center gap-4 rounded-2xl border border-white/10 bg-white p-4 transition-all hover:brightness-110 active:scale-[0.98]"
                                        >
                                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${provider.bgColor} ${provider.textColor} text-xl font-bold shadow-sm`}>
                                                {provider.initial}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-base font-bold text-slate-900">{provider.name}</span>
                                                    <ExternalLink className="text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" size={16} />
                                                </div>
                                                <p className="text-xs font-medium text-slate-500 line-clamp-1">{provider.description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="my-2 h-px w-full bg-white/10" />

                                <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/25 via-primary/12 to-black/35 p-4 shadow-lg shadow-primary/20">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-2">
                                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">
                                                <Zap size={14} strokeWidth={1.75} />
                                                <span>{depositRoutes.recommended.title}</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white">
                                                {depositRoutes.recommended.route.split('->').map((segment, index, arr) => (
                                                    <div key={`${segment}-${index}`} className="flex items-center gap-2">
                                                        <span className="rounded-full bg-black/30 px-2 py-1 uppercase tracking-wide text-[11px] border border-white/15">
                                                            {segment.trim()}
                                                        </span>
                                                        {index < arr.length - 1 && <ArrowRight size={14} className="text-white/60" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <ShieldCheck className="text-white/80" size={20} strokeWidth={1.75} />
                                    </div>
                                    <div className="mt-3 space-y-2">
                                        {depositRoutes.recommended.bullets.map((bullet) => (
                                            <div key={bullet.text} className="flex items-center gap-2 text-sm text-white/85">
                                                <span className={`h-2 w-2 rounded-full ${bulletToneClass(bullet.tone)}`} />
                                                <span>{bullet.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-2 text-xs italic text-white/70">{depositRoutes.recommended.footnote}</p>
                                </div>

                                <Button
                                    type="button"
                                    size="sm"
                                    className="w-full bg-primary/80 text-white/90 hover:bg-primary/65 py-1.5 text-[13px]"
                                    onClick={() => setIsDepositOpen(false)}
                                >
                                    {depositRoutes.closeCta}
                                </Button>

                                <div className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-white">{depositRoutes.alternatives.title}</p>
                                            <p className="text-xs text-white/60">{depositRoutes.alternatives.helper}</p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs"
                                            onClick={() => setShowDepositAlternatives((prev) => !prev)}
                                        >
                                            {showDepositAlternatives ? t('Home.deposit.examplesHide') : t('Home.deposit.examplesToggle')}
                                        </Button>
                                    </div>
                                    {showDepositAlternatives && (
                                        <div className="space-y-3">
                                            {depositRoutes.alternatives.options.map((option) => (
                                                <div
                                                    key={option.title}
                                                    className={`rounded-lg border p-3 ${option.ctaLabel ? 'border-primary/35 bg-primary/5 shadow-lg shadow-primary/10' : 'border-white/10 bg-white/5'}`}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-semibold text-white">{option.title}</p>
                                                            {option.helper && <p className="text-xs text-white/70">{option.helper}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 space-y-1.5">
                                                        {option.bullets.map((bullet) => (
                                                            <div key={bullet.text} className="flex items-center gap-2 text-sm text-white/80">
                                                                <span className={`h-2 w-2 rounded-full ${bulletToneClass(bullet.tone)}`} />
                                                                <span>{bullet.text}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {option.ctaLabel && (
                                                        <div className="mt-3 space-y-2">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="secondary"
                                                                className="w-full justify-center border-white/25 bg-white/10 text-[13px] font-semibold text-white hover:bg-white/15"
                                                                onClick={handleExternalConversionClick}
                                                            >
                                                                {option.ctaLabel}
                                                            </Button>
                                                            {option.ctaHelper && (
                                                                <p className="text-[11px] text-center text-white/70">
                                                                    {option.ctaHelper}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-50">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle size={16} className="mt-0.5" />
                                        <p className="leading-relaxed text-amber-50">{depositRoutes.feeNotice}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isProviderModalOpen && selectedProvider && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                        onClick={() => setIsProviderModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl text-center space-y-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="absolute top-3 right-3 p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                                onClick={() => setIsProviderModalOpen(false)}
                            >
                                <X size={20} />
                            </button>

                            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ${selectedProvider.bgColor} text-white shadow-xl`}>
                                <span className="text-4xl font-bold">{selectedProvider.initial}</span>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-slate-900">
                                    Concluir transação com {selectedProvider.name}
                                </h3>
                                <p className="text-sm text-slate-500 leading-relaxed px-4">
                                    Acesse a aba {selectedProvider.name} para continuar. Você já pode fechar este modal.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showExternalConversionConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
                        onClick={() => setShowExternalConversionConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="relative w-full max-w-sm rounded-2xl border border-white/15 bg-dark-surface p-6 shadow-2xl space-y-5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 transition-colors text-white/70"
                                onClick={() => setShowExternalConversionConfirm(false)}
                                aria-label={t('Common.back')}
                            >
                                <X size={18} />
                            </button>

                            <div className="space-y-2">
                                <p className="text-lg font-semibold text-white">{t('Home.deposit.externalConversion.title')}</p>
                                <p className="text-sm text-white/70 leading-relaxed">
                                    {t('Home.deposit.externalConversion.text')}
                                </p>
                            </div>

                            <div className="rounded-xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm text-amber-50">
                                <p className="font-semibold">{t('Home.deposit.externalConversion.highlight')}</p>
                            </div>

                            <div className="space-y-2 text-sm text-white/80">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle size={14} className="mt-0.5 text-amber-400" />
                                    <span>{t('Home.deposit.externalConversion.notes.fees')}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <AlertTriangle size={14} className="mt-0.5 text-amber-400" />
                                    <span>{t('Home.deposit.externalConversion.notes.network')}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <AlertTriangle size={14} className="mt-0.5 text-amber-400" />
                                    <span>{t('Home.deposit.externalConversion.notes.experience')}</span>
                                </div>
                            </div>

                            <div className="grid gap-3">
                                <Button className="w-full" onClick={handleExternalConversionConfirm}>
                                    {t('Home.deposit.externalConversion.continue')}
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="w-full"
                                    onClick={() => setShowExternalConversionConfirm(false)}
                                >
                                    {t('Home.deposit.externalConversion.cancel')}
                                </Button>
                            </div>

                            <p className="text-xs text-white/50 text-center">
                                {t('Home.deposit.externalConversion.legal')}
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isGroupModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-6"
                        onClick={handleCloseGroupModal}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="relative w-full max-w-2xl rounded-2xl bg-dark-surface border border-white/10 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 transition-colors"
                                onClick={handleCloseGroupModal}
                                aria-label={t('Common.back')}
                            >
                                <X size={18} />
                            </button>

                            <p className="text-sm text-white/70">{t('Home.paymentGroups.modal.subtitle')}</p>


                            <Input
                                label={t('Home.paymentGroups.modal.name')}
                                placeholder={t('Home.paymentGroups.modal.namePlaceholder')}
                                value={groupForm.name}
                                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                            />

                            <div className="grid gap-3 sm:grid-cols-2">
                                <Input
                                    label={t('Home.paymentGroups.modal.token')}
                                    value={groupForm.token}
                                    onChange={(e) => setGroupForm({ ...groupForm, token: e.target.value })}
                                />
                                <Input
                                    label={t('Home.paymentGroups.modal.network')}
                                    value={groupForm.network}
                                    onChange={(e) => setGroupForm({ ...groupForm, network: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/80">
                                    Conversão final para
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setGroupForm({ ...groupForm, exportToken: 'USDC' })}
                                        className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 transition-colors ${groupForm.exportToken === 'USDC'
                                            ? 'border-primary bg-primary/10 text-white'
                                            : 'border-white/10 bg-black/20 text-white/60 hover:bg-black/40'
                                            }`}
                                    >
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0052FF] text-[10px] font-bold text-white">
                                            $
                                        </div>
                                        <span className="text-sm font-medium">USDC (Dólar)</span>
                                        {groupForm.exportToken === 'USDC' && (
                                            <span className="ml-auto text-[10px] opacity-70">
                                                {isExportRateLoading ? '...' : currentExportRate ? `1 USDC ≈ ${currencyFormatter.format(currentExportRate)}` : ''}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setGroupForm({ ...groupForm, exportToken: 'ETH' })}
                                        className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 transition-colors ${groupForm.exportToken === 'ETH'
                                            ? 'border-primary bg-primary/10 text-white'
                                            : 'border-white/10 bg-black/20 text-white/60 hover:bg-black/40'
                                            }`}
                                    >
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#627EEA] text-[10px] font-bold text-white">
                                            Ξ
                                        </div>
                                        <span className="text-sm font-medium">ETH (Ether)</span>
                                        {groupForm.exportToken === 'ETH' && (
                                            <span className="ml-auto text-[10px] opacity-70">
                                                {isExportRateLoading ? '...' : currentExportRate ? `1 ETH ≈ ${currencyFormatter.format(currentExportRate)}` : ''}
                                            </span>
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-white/50">
                                    Ao exportar, o valor em R$ será convertido automaticamente para a moeda selecionada.
                                </p>
                            </div>

                            <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-white">
                                            {t('Home.paymentGroups.modal.peopleTitle')}
                                        </p>
                                        <p className="text-xs text-white/60">
                                            {t('Home.paymentGroups.modal.peopleHelper')}
                                        </p>
                                        <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-white/70">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1">
                                                <ShieldCheck size={12} className="text-white/75" strokeWidth={1.75} />
                                                <span>{t('Home.paymentGroups.modal.networkHint', { network: groupForm.network || defaultNetworkName })}</span>
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1">
                                                <Check size={12} />
                                                <span>{t('Home.paymentGroups.modal.noManual')}</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" onClick={handleOpenGroupNewContact}>
                                            <Plus size={16} strokeWidth={1.75} className="mr-1" />
                                            {t('Recipients.new')}
                                        </Button>
                                        <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">
                                            {t('Home.paymentGroups.modal.selectedCount', { count: groupForm.recipients.length })}
                                        </div>
                                    </div>
                                </div>


                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                    <input
                                        type="text"
                                        value={groupContactSearch}
                                        onChange={(e) => setGroupContactSearch(e.target.value)}
                                        placeholder={t('Home.paymentGroups.modal.searchPlaceholder')}
                                        className="w-full rounded-lg border border-white/10 bg-black/40 py-3 pl-10 pr-3 text-sm text-white placeholder:text-white/40 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                                    />
                                </div>

                                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                                    {filteredGroupContacts.map((contact) => {
                                        const primary = contact.addresses[0];
                                        const isSelected = groupSelectedContactIds.has(contact.id);
                                        const isDisabled = !primary;
                                        return (
                                            <div key={contact.id} className="w-full">
                                                <button
                                                    type="button"
                                                    disabled={isDisabled}
                                                    onClick={() => handleToggleContactInGroup(contact)}
                                                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${isSelected ? 'border-primary bg-primary/10' : 'border-white/10 bg-black/30 hover:border-white/20 hover:bg-black/40'} ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <span
                                                            className={`mt-1 flex h-4 w-4 items-center justify-center rounded border ${isSelected ? 'border-primary bg-primary text-black' : 'border-white/40 text-white/60'} ${isDisabled ? 'border-white/20' : ''}`}
                                                        >
                                                            {isSelected && <Check size={12} />}
                                                        </span>
                                                        <div className="flex-1 space-y-1">
                                                            <p className="text-sm font-semibold text-white">{contact.name}</p>
                                                            <p className="text-xs text-white/60">
                                                                {primary ? getRecipientAddressPreview(contact) : t('Home.paymentGroups.modal.noAddress')}
                                                            </p>
                                                        </div>
                                                        <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/70">
                                                            {groupForm.network || defaultNetworkName}
                                                        </span>
                                                    </div>
                                                </button>
                                                {isSelected && (
                                                    <div className="mt-2 pl-7 pr-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-white/60 shrink-0">Valor (R$):</span>
                                                            <input
                                                                type="number"
                                                                placeholder="0,00"
                                                                value={groupForm.recipients.find(r => r.contactId === contact.id)?.value || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setGroupForm(prev => ({
                                                                        ...prev,
                                                                        recipients: prev.recipients.map(r =>
                                                                            r.contactId === contact.id ? { ...r, value: val } : r
                                                                        )
                                                                    }));
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="w-full rounded bg-black/30 border border-white/10 px-2 py-1 text-sm text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {filteredGroupContacts.length === 0 && (
                                        <p className="text-sm text-white/60">{t('Recipients.noRecipients')}</p>
                                    )}
                                </div>

                                <div className="rounded-lg border border-dashed border-white/15 bg-black/20 p-3 text-xs text-white/60">
                                    <p>{t('Home.paymentGroups.modal.csvHint')}</p>
                                </div>
                            </div>

                            <Button
                                type="button"
                                className="w-full"
                                disabled={!canSaveGroup}
                                onClick={handleSaveGroup}
                            >
                                {editingGroupId ? t('Home.paymentGroups.modal.saveEdit') : t('Home.paymentGroups.modal.save')}
                            </Button>

                            {/* Sub-modal para criar novo contato */}
                            <AnimatePresence>
                                {isGroupNewContactOpen && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-2xl"
                                        onClick={() => setIsGroupNewContactOpen(false)}
                                    >
                                        <motion.div
                                            initial={{ scale: 0.95, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.95, opacity: 0 }}
                                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                            className="w-full max-w-sm rounded-xl bg-dark-surface border border-white/10 p-5 shadow-2xl space-y-4 mx-4"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-base font-semibold text-white">
                                                    {t('Recipients.newRecipientTitle')}
                                                </h4>
                                                <button
                                                    type="button"
                                                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                                                    onClick={() => setIsGroupNewContactOpen(false)}
                                                    aria-label={t('Common.back')}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                <Input
                                                    label={t('Recipients.fields.name')}
                                                    placeholder="Ex: Joao da Silva"
                                                    value={groupNewContact.name}
                                                    onChange={(e) => setGroupNewContact({ ...groupNewContact, name: e.target.value })}
                                                />
                                                <Input
                                                    label={t('Recipients.fields.address')}
                                                    placeholder="0x..."
                                                    value={groupNewContact.address}
                                                    onChange={(e) => setGroupNewContact({ ...groupNewContact, address: e.target.value })}
                                                />
                                                <Input
                                                    label={t('Recipients.fields.label')}
                                                    placeholder={t('Recipients.fields.labelPlaceholder')}
                                                    value={groupNewContact.label}
                                                    onChange={(e) => setGroupNewContact({ ...groupNewContact, label: e.target.value })}
                                                />
                                            </div>

                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    className="flex-1"
                                                    onClick={() => setIsGroupNewContactOpen(false)}
                                                >
                                                    {t('Common.back')}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    className="flex-1"
                                                    disabled={!groupNewContact.name.trim() || !normalizeAddress(groupNewContact.address)}
                                                    onClick={handleAddContactFromGroup}
                                                >
                                                    {t('Recipients.save')}
                                                </Button>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>


            <AnimatePresence>
                {isMultisendModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                        onClick={() => setIsMultisendModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="relative w-full max-w-xl rounded-2xl bg-dark-surface border border-white/10 p-6 shadow-2xl space-y-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 transition-colors"
                                onClick={() => setIsMultisendModalOpen(false)}
                                aria-label={t('Common.back')}
                            >
                                <X size={18} />
                            </button>

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
                                        {t('Home.paymentGroups.toolsModal.appsLabel')}
                                    </p>
                                    <h3 className="text-lg font-semibold text-white">
                                        {t('Home.paymentGroups.toolsModal.title')}
                                    </h3>
                                    <p className="text-sm text-white/70">
                                        {t('Home.paymentGroups.toolsModal.description')}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    {multisendApps.map((app) => (
                                        <div
                                            key={app.id}
                                            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
                                        >
                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold text-white">{app.name}</p>
                                                <p className="text-xs text-white/70">{app.description}</p>
                                                {app.helper && <p className="text-[11px] text-white/60">{app.helper}</p>}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="shrink-0"
                                                onClick={() => openMultisendApp(app.url)}
                                            >
                                                {t('Home.paymentGroups.toolsModal.open', { app: app.name })}
                                                <ExternalLink size={14} className="ml-2" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-start gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3">
                                    <AlertTriangle size={16} className="mt-0.5 text-amber-100" />
                                    <p className="text-xs text-amber-50">
                                        {t('Home.paymentGroups.toolsModal.warning')}
                                    </p>
                                </div>

                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="w-full"
                                    onClick={() => setIsMultisendModalOpen(false)}
                                >
                                    {t('Home.paymentGroups.toolsModal.close')}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showNextStepsModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-6"
                        onClick={() => setShowNextStepsModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                            className="relative w-full max-w-3xl rounded-2xl bg-dark-surface border border-white/10 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 transition-colors"
                                onClick={() => setShowNextStepsModal(false)}
                                aria-label={t('Common.back')}
                            >
                                <X size={18} />
                            </button>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80">
                                        <FileDown size={18} strokeWidth={1.75} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
                                            {t('Home.paymentGroups.nextSteps.exported', {
                                                group: lastExportedGroupName || t('Home.paymentGroups.title'),
                                            })}
                                        </p>
                                        <h3 className="text-xl font-semibold text-white">
                                            {t('Home.paymentGroups.nextSteps.title')}
                                        </h3>
                                        <p className="text-sm text-white/70">
                                            {t('Home.paymentGroups.nextSteps.description')}
                                        </p>
                                        {lastExportedFileName && (
                                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/70">
                                                <span className="rounded-full bg-emerald-400/15 px-2 py-1 font-semibold uppercase tracking-[0.12em] text-emerald-100">
                                                    {t('Home.paymentGroups.nextSteps.downloadCompleted')}
                                                </span>
                                                <span className="rounded bg-white/5 px-2 py-1 font-medium text-white/90">
                                                    {t('Home.paymentGroups.nextSteps.downloadFileName', {
                                                        filename: lastExportedFileName,
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-wider text-white/50">Valor Total</span>
                                            <span className="text-lg font-bold text-emerald-400">
                                                {currencyFormatter.format(lastExportedTotalValue)}
                                            </span>
                                        </div>
                                        <div className="hidden h-8 w-px bg-white/10 sm:block" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-wider text-white/50">Cotação ({lastExportedToken})</span>
                                            <span className="text-sm font-semibold text-white/80">
                                                {lastExportedRate
                                                    ? `1 ${lastExportedToken} ≈ ${currencyFormatter.format(lastExportedRate)}`
                                                    : 'Calculando...'}
                                            </span>
                                        </div>
                                        <div className="hidden h-8 w-px bg-white/10 sm:block" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-wider text-white/50">Data</span>
                                            <span className="text-sm font-semibold text-white/80">{lastExportedDate}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-100">
                                        {t('Home.paymentGroups.nextSteps.checklistTitle')}
                                    </p>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {[t('Home.paymentGroups.nextSteps.checklist.token'), t('Home.paymentGroups.nextSteps.checklist.network'), t('Home.paymentGroups.nextSteps.checklist.format'), t('Home.paymentGroups.nextSteps.checklist.wallet')].map((item) => (
                                            <div key={item} className="flex items-center gap-2 text-sm text-white/85">
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-emerald-200">
                                                    <Check size={14} />
                                                </span>
                                                <span>{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4">
                                    <AlertTriangle size={20} className="text-amber-200" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-amber-50">
                                            {t('Home.paymentGroups.nextSteps.warningTitle')}
                                        </p>
                                        <p className="text-sm text-amber-50/90">
                                            {t('Home.paymentGroups.nextSteps.warningDescription')}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-semibold text-white">
                                            {t('Home.paymentGroups.nextSteps.appsTitle')}
                                        </p>
                                        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/75">
                                            CSV
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {multisendApps.map((app) => (
                                            <button
                                                key={app.id}
                                                onClick={() => openMultisendApp(app.url)}
                                                className="w-full group relative flex items-center gap-4 rounded-2xl border border-white/10 bg-white p-4 transition-all hover:brightness-110 active:scale-[0.98]"
                                            >
                                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${app.bgColor || 'bg-slate-500'} ${app.textColor || 'text-white'} text-xl font-bold shadow-sm`}>
                                                    {app.initial}
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-base font-bold text-slate-900">{app.name}</span>
                                                        <ExternalLink className="text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" size={16} />
                                                    </div>
                                                    <p className="text-xs font-medium text-slate-500 line-clamp-1">
                                                        {app.description}
                                                    </p>
                                                    {app.recommended && (
                                                        <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                                            {t('Home.deposit.examplesRecommended.title')}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2 rounded-xl border border-white/10 bg-black/40 p-4">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-semibold text-white">
                                            {t('Home.paymentGroups.nextSteps.quickGuide.stepsTitle')}
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="text-xs"
                                            onClick={() => setShowQuickInstructions((prev) => !prev)}
                                        >
                                            {t('Home.paymentGroups.nextSteps.quickGuide.cta')}
                                        </Button>
                                    </div>
                                    {showQuickInstructions && (
                                        <div className="space-y-2 text-sm text-white/80">
                                            <ol className="list-decimal list-inside space-y-1">
                                                <li>{t('Home.paymentGroups.nextSteps.quickGuide.step1')}</li>
                                                <li>{t('Home.paymentGroups.nextSteps.quickGuide.step2')}</li>
                                                <li>{t('Home.paymentGroups.nextSteps.quickGuide.step3')}</li>
                                            </ol>
                                        </div>
                                    )}
                                </div>

                                <p className="text-xs text-white/60">{t('Home.paymentGroups.nextSteps.footer')}</p>

                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="w-full"
                                    onClick={() => setShowNextStepsModal(false)}
                                >
                                    {t('Common.back')}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showOtherAssetsModal && pendingAssetsTotal > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                        onClick={() => setShowOtherAssetsModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="relative w-full max-w-sm rounded-2xl bg-dark-surface border border-white/10 p-6 shadow-2xl space-y-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 transition-colors"
                                onClick={() => setShowOtherAssetsModal(false)}
                                aria-label={t('Common.back')}
                            >
                                <X size={18} />
                            </button>

                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">{t('Home.otherAssets.modal.title')}</h3>
                                <p className="text-sm text-white/70">{t('Home.otherAssets.modal.subtitle')}</p>
                            </div>

                            <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
                                {pendingAssets.map((asset) => (
                                    <div key={asset.id} className="flex items-center justify-between gap-3 text-sm text-white/80">
                                        <div className="flex items-center gap-3">
                                            <BaseIcon size="sm" />
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-white">{asset.label}</span>
                                                    {typeof asset.amount === 'number' && (
                                                        <span className="text-white/60">- {numberFormatter.format(asset.amount)}</span>
                                                    )}
                                                </div>
                                                <span className="text-[11px] text-white/50">
                                                    {t('Home.otherAssets.modal.estimatedTag')}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="font-semibold text-white">
                                            ~ {formatCurrency(asset.fiatEstimate)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-1 text-xs text-white/60">
                                <p>{t('Home.otherAssets.modal.helper')}</p>
                                <p>{t('Home.otherAssets.modal.helperSecondary')}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-2 pt-1">
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setShowOtherAssetsModal(false);
                                        setShowConversionModal(true);
                                    }}
                                >
                                    {t('Home.otherAssets.modal.primaryCta')}
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setShowOtherAssetsModal(false)}
                                >
                                    {t('Home.otherAssets.modal.secondaryCta')}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showConversionModal && pendingAssetsTotal > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                        onClick={() => setShowConversionModal(false)}
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
                                onClick={() => setShowConversionModal(false)}
                                aria-label={t('Common.back')}
                            >
                                <X size={18} />
                            </button>

                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">{t('Home.otherAssets.conversion.title')}</h3>
                                <p className="text-sm text-white/70">{t('Home.otherAssets.conversion.subtitle')}</p>
                            </div>

                            <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/10 p-4 shadow-lg shadow-primary/10">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">
                                            <ShieldCheck size={14} strokeWidth={1.75} />
                                            <span>{t('Home.otherAssets.conversion.recommended.pill')}</span>
                                        </div>
                                        <p className="text-sm font-semibold text-white">
                                            {t('Home.otherAssets.conversion.recommended.title')}
                                        </p>
                                    </div>
                                    <ShieldCheck className="text-white/80" size={20} strokeWidth={1.75} />
                                </div>
                                <div className="space-y-1 text-sm text-white/80">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-white/50" />
                                        <span>{t('Home.otherAssets.conversion.recommended.bullets.route')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-white/50" />
                                        <span>{t('Home.otherAssets.conversion.recommended.bullets.cost')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-white/50" />
                                        <span>{t('Home.otherAssets.conversion.recommended.bullets.execution')}</span>
                                    </div>
                                </div>
                                <p className="text-xs italic text-white/70">
                                    {t('Home.otherAssets.conversion.recommended.microcopy')}
                                </p>
                                <Button
                                    type="button"
                                    className="w-full"
                                    onClick={() => {
                                        setShowConversionModal(false);
                                        if (typeof window !== 'undefined') {
                                            window.open('https://app.1inch.io', '_blank', 'noopener,noreferrer');
                                        }
                                    }}
                                >
                                    {t('Home.otherAssets.conversion.recommended.cta')}
                                </Button>
                            </div>

                            <div className="rounded-lg border border-white/10 bg-black/30 p-3 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            {t('Home.otherAssets.conversion.alternatives.title')}
                                        </p>
                                        <p className="text-xs text-white/60">
                                            {t('Home.otherAssets.conversion.alternatives.helper')}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => setShowConversionAlternatives((prev) => !prev)}
                                    >
                                        {showConversionAlternatives
                                            ? t('Home.otherAssets.conversion.alternatives.hide')
                                            : t('Home.otherAssets.conversion.alternatives.show')}
                                    </Button>
                                </div>
                                {showConversionAlternatives && (
                                    <div className="space-y-2 text-sm text-white/75">
                                        <div className="flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                                            <span>{t('Home.otherAssets.conversion.alternatives.option1')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                                            <span>{t('Home.otherAssets.conversion.alternatives.option2')}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-50">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle size={16} className="mt-0.5" />
                                    <p className="leading-relaxed text-amber-50">
                                        {t('Home.otherAssets.conversion.warning')}
                                    </p>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="secondary"
                                className="w-full"
                                onClick={() => setShowConversionModal(false)}
                            >
                                {t('Home.otherAssets.conversion.ack')}
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Yield Info Modal */}
            <AnimatePresence>
                {showYieldModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f0f0f] overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                                        <Zap size={20} />
                                    </div>
                                    <button
                                        onClick={() => setShowYieldModal(false)}
                                        className="p-2 -mr-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-white">{t('Home.yield.modal.title')}</h3>
                                    <p className="text-sm text-white/50">{t('Home.yield.subtitle')}</p>
                                </div>

                                <div className="space-y-3">
                                    {[
                                        t('Home.yield.modal.bullets.automatic'),
                                        t('Home.yield.modal.bullets.liquidity'),
                                        t('Home.yield.modal.bullets.noTerm'),
                                        t('Home.yield.modal.bullets.risk'),
                                    ].map((bullet, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
                                                <Check size={12} className="text-emerald-400" />
                                            </div>
                                            <span className="text-sm text-white/80">{bullet}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Comparison Table */}
                                <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                                    <div className="bg-white/5 px-4 py-2 border-b border-white/10">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-white/40">
                                            {t('Home.yield.modal.comparison.title')}
                                        </p>
                                    </div>
                                    <div className="divide-y divide-white/5">
                                        <div className="px-4 py-3 flex items-center justify-between">
                                            <span className="text-sm text-white/60">{t('Home.yield.modal.comparison.savings')}</span>
                                            <span className="text-sm font-medium text-white/40">{t('Home.yield.modal.comparison.savingsRate')}</span>
                                        </div>
                                        <div className="px-4 py-3 flex items-center justify-between bg-emerald-500/5">
                                            <span className="text-sm font-bold text-emerald-400">{t('Home.yield.modal.comparison.paycrypto')}</span>
                                            <span className="text-sm font-bold text-emerald-400">{t('Home.yield.modal.comparison.paycryptoRate')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Links / Sources */}
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                                        {t('Home.yield.modal.links.title')}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <a
                                            href="https://app.aave.com/reserve-overview/?underlyingAsset=0x833589fcd6edb6e08f4c7c32d4f71b54bda02913&marketName=proto_base_v3"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                                        >
                                            <span className="text-white/70">{t('Home.yield.modal.links.aave')}</span>
                                            <ExternalLink size={12} className="text-white/30" />
                                        </a>
                                        <a
                                            href="https://app.uniswap.org/explore/pools/base/0xd0bDe473E72a9F0054ff0911feDC694589326889"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                                        >
                                            <span className="text-white/70">{t('Home.yield.modal.links.uniswap')}</span>
                                            <ExternalLink size={12} className="text-white/30" />
                                        </a>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => setShowYieldModal(false)}
                                    className="w-full py-6 text-base font-bold"
                                >
                                    {t('Home.yield.modal.continue')}
                                </Button>
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

            <AnimatePresence>
                {/* QR Scanner Modal */}
                {isQrScanModalOpen && (
                    <motion.div
                        key="qr-scanner"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white"
                    >
                        <div className="flex items-center justify-between p-4 bg-black/50 z-10 backdrop-blur-sm">
                            <button
                                onClick={() => setIsQrScanModalOpen(false)}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <h3 className="text-lg font-semibold">Escanear QR Code</h3>
                            <div className="w-10"></div>
                        </div>

                        <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-neutral-900">
                            <video
                                ref={videoRef}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            <canvas ref={canvasRef} className="hidden" />

                            <div className="relative px-10 w-full max-w-sm aspect-square">
                                <div className="absolute inset-0 border-2 border-primary/50 rounded-3xl animate-pulse shadow-[0_0_50px_rgba(37,99,235,0.3)]"></div>
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl"></div>
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl"></div>
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl"></div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl"></div>
                            </div>

                            {cameraError && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-8 text-center z-20">
                                    <div className="space-y-4">
                                        <AlertTriangle className="mx-auto text-amber-500" size={40} />
                                        <p className="text-white/80">{cameraError}</p>
                                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                                            <Button variant="secondary" onClick={() => startCamera()}>
                                                Tentar novamente
                                            </Button>
                                            <Button onClick={() => setIsQrScanModalOpen(false)}>Fechar</Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-8 pb-12 bg-black/50 backdrop-blur-sm space-y-4">
                            <div className="text-center text-sm text-white/50 mb-4">
                                Aponte a câmera para um código QR
                            </div>
                            <div className="relative">
                                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-white/10"></div>
                                <span className="relative z-10 block w-fit mx-auto px-4 bg-black text-xs text-white/40 uppercase font-medium tracking-wider">
                                    Ou
                                </span>
                            </div>
                            <Button
                                variant="secondary"
                                className="w-full relative"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <FileDown className="mr-2" size={18} />
                                Carregar imagem
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleQrFileChange}
                                />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {/* Smart Save Address Modal */}
                {showSaveAddressModal && pendingScanAddress && (
                    <motion.div
                        key="save-address"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-sm rounded-2xl bg-dark-surface border border-white/10 p-6 shadow-2xl space-y-6"
                        >
                            <div className="text-center space-y-2">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                                    <Users size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-white">Novo Endereço</h3>
                                <p className="text-white/60 text-sm">
                                    Identificamos um novo endereço na leitura.
                                </p>
                                <div className="p-3 bg-white/5 rounded-lg break-all font-mono text-xs text-white/80 border border-white/5">
                                    {pendingScanAddress}
                                </div>
                                <p className="text-white/60 text-sm pt-2">
                                    Deseja salvar este endereço nos seus contatos para facilitar futuras transações?
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <Button
                                    onClick={() => {
                                        // Handle "Save and Continue"
                                        handleOpenNewRecipient();
                                        setNewRecipient(prev => ({
                                            ...prev,
                                            address: pendingScanAddress,
                                            mode: 'new'
                                        }));
                                        setShowSaveAddressModal(false);
                                        // Ensure we are in the correct view
                                        // handleOpenNewRecipient already sets view to 'newRecipient'
                                    }}
                                    className="w-full"
                                >
                                    Salvar e Continuar
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        // Skip saving, just go to send wizard
                                        const tempRecipient: SelectedRecipient = {
                                            id: 'temp-' + Date.now(),
                                            name: 'Endereço Escaneado',
                                            address: pendingScanAddress,
                                            label: 'QR Code'
                                        };
                                        setSelectedRecipient(tempRecipient);
                                        setShowSaveAddressModal(false);
                                        setView('send');
                                    }}
                                    className="w-full text-white/60 hover:text-white"
                                >
                                    Agora não, apenas enviar
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
