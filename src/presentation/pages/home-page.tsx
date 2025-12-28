'use client';

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Globe2,
  Link2,
  Send,
  ShieldCheck,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { LocaleSwitchNotice } from "@/presentation/components/locale/locale-switcher";

type LocaleKey = "pt-BR" | "en-US" | "es-ES";
const SUPPORTED_LOCALES: LocaleKey[] = ["pt-BR", "en-US", "es-ES"];
type RegionCode = "us" | "eu" | "gb" | "in" | "sg" | "br";

type PixCopy = {
  heroTitle: string;
  badge: string;
  experience: string;
  flow: string;
  uxLabel: string;
  explainer: string;
  instantTitle: string;
  languageDescription: string;
  regionHeading: string;
  regionSubtitle: string;
  viewAllLabel: string;
  hideAllLabel: string;
  localBadge: string;
  otherBadge: string;
  detectedLabel: string;
  globalPhrase: string;
  secondaryHint: string;
};

type RegionalEquivalent = {
  code: RegionCode;
  region: string;
  lead?: string;
  items: string[];
  summary: string;
};

const PIX_COPY: Record<LocaleKey, PixCopy> = {
  "pt-BR": {
    heroTitle: "Envie, receba e concentre sua renda em cripto - com a simplicidade do PIX.",
    badge: "",
    experience: "Rapido, simples e sem banco.",
    flow: "Use seu nome PayCripto ou endereco com fluxo instantaneo para enviar e receber.",
    uxLabel: "Experiencia estilo PIX",
    explainer:
      "Sem custodia. Suas chaves, seus fundos. Conecte a carteira, confirme e mova valor como no PIX.",
    instantTitle: "Envios instantaneos",
    languageDescription: "Interface trilingue para quem paga em portugues, ingles ou espanhol.",
    regionHeading: "Receba dinheiro do mundo todo como se fosse um PIX",
    regionSubtitle: "Um unico endereco cripto. Sem banco. Sem fronteiras. No seu controle.",
    viewAllLabel: "Ver equivalentes globais",
    hideAllLabel: "Ocultar equivalentes",
    localBadge: "Brasil em destaque",
    otherBadge: "Equivalentes globais (opcional)",
    detectedLabel: "Mesmo conceito do PIX, agora em cripto",
    globalPhrase: "Nao importa o pais de quem paga. Voce recebe direto na sua carteira.",
    secondaryHint: "Opcional, so para contexto.",
  },
  "en-US": {
    heroTitle: "Send, receive, and centralize your income in crypto - as easy as your instant rail.",
    badge: "",
    experience: "Fast, simple, no banks.",
    flow: "Use your PayCripto name or address with an instant flow for sending and getting paid.",
    uxLabel: "Local-rail UX tuned to your region",
    explainer:
      "No custody. Your keys, your funds. Connect and move value with the instant flow you already know (Zelle, SEPA Instant, UPI...).",
    instantTitle: "Instant transfers",
    languageDescription: "Trilingual interface for payers in Portuguese, English, or Spanish.",
    regionHeading: "Get paid from anywhere as if it were PIX",
    regionSubtitle: "One crypto address. No bank. Borderless. You stay in control.",
    viewAllLabel: "See global equivalents",
    hideAllLabel: "Hide equivalents",
    localBadge: "Brazil highlighted",
    otherBadge: "Global equivalents (optional)",
    detectedLabel: "PIX-style, global and crypto",
    globalPhrase: "No matter who pays, it lands straight in your wallet.",
    secondaryHint: "Optional, just context.",
  },
  "es-ES": {
    heroTitle: "Envia, recibe y concentra tus ingresos en cripto - como tu pago instantaneo.",
    badge: "",
    experience: "Rapido, simple y sin banco.",
    flow: "Usa tu nombre PayCripto o direccion con un flujo instantaneo para enviar y cobrar.",
    uxLabel: "Experiencia estilo rail local",
    explainer:
      "Sin custodia. Tus llaves, tus fondos. Conecta la billetera y mueve valor con el flujo instantaneo que ya conoces (Zelle, SEPA Instant, UPI...).",
    instantTitle: "Envios instantaneos",
    languageDescription: "Interfaz trilingue para quien paga en portugues, ingles o espanol.",
    regionHeading: "Recibe dinero de todo el mundo como si fuera un PIX",
    regionSubtitle: "Una sola direccion cripto. Sin banco. Sin fronteras. En tu control.",
    viewAllLabel: "Ver equivalentes globales",
    hideAllLabel: "Ocultar equivalentes",
    localBadge: "Brasil en destaque",
    otherBadge: "Equivalentes globales (opcional)",
    detectedLabel: "Mismo concepto del PIX, ahora en cripto",
    globalPhrase: "No importa el pais de quien paga. Recibes directo en tu billetera.",
    secondaryHint: "Opcional, solo contexto.",
  },
};

const REGIONAL_EQUIVALENTS: Record<LocaleKey, RegionalEquivalent[]> = {
  "pt-BR": [
    {
      code: "br",
      region: "Brasil",
      lead: "No Brasil, e como um PIX",
      items: ["Transferencia instantanea", "Disponivel 24/7", "Modelo que voce ja conhece"],
      summary: "Se voce ja usa PIX, ja sabe usar PayCripto para receber salario e pagamentos recorrentes.",
    },
    {
      code: "us",
      region: "Estados Unidos",
      lead: "Zelle / Venmo / Cash App",
      items: ["Modelo mental parecido: enviar -> confirmar -> pronto"],
      summary: "Instantaneo entre contas, direto no app.",
    },
    {
      code: "eu",
      region: "Europa",
      lead: "SEPA Instant",
      items: ["Transferencias bancarias instantaneas"],
      summary: "Cai na hora, qualquer dia.",
    },
    {
      code: "gb",
      region: "Reino Unido",
      lead: "Faster Payments",
      items: ["Transferencias bancarias rapidas"],
      summary: "Instantaneo entre bancos britanicos.",
    },
    {
      code: "in",
      region: "India",
      lead: "UPI (Google Pay / PhonePe)",
      items: ["Transferencia instantanea entre bancos"],
      summary: "Fluxo de enviar -> confirmar -> pago.",
    },
    {
      code: "sg",
      region: "Singapura",
      lead: "PayNow",
      items: ["Pagamentos instantaneos"],
      summary: "Modelo rapido para contas locais.",
    },
  ],
  "en-US": [
    {
      code: "br",
      region: "Brazil",
      lead: "In Brazil, it's just like PIX",
      items: ["Instant bank transfers", "Available 24/7", "Tap -> confirm -> done"],
      summary: "If you know PIX, you already know PayCripto for salary and recurring payouts.",
    },
    {
      code: "us",
      region: "United States",
      lead: "Zelle / Venmo / Cash App",
      items: ["Similar mental model: send -> confirm -> done"],
      summary: "Instant bank-to-bank, 24/7 in the app.",
    },
    {
      code: "eu",
      region: "Europe",
      lead: "SEPA Instant",
      items: ["Instant bank transfers"],
      summary: "Hits the account immediately, any day.",
    },
    {
      code: "gb",
      region: "United Kingdom",
      lead: "Faster Payments",
      items: ["Instant bank rail"],
      summary: "Fast between UK banks.",
    },
    {
      code: "in",
      region: "India",
      lead: "UPI (Google Pay / PhonePe)",
      items: ["Instant bank-to-bank transfer"],
      summary: "Send -> confirm -> paid.",
    },
    {
      code: "sg",
      region: "Singapore",
      lead: "PayNow",
      items: ["Instant payments"],
      summary: "Quick flow for local accounts.",
    },
  ],
  "es-ES": [
    {
      code: "br",
      region: "Brasil",
      lead: "En Brasil, es como un PIX",
      items: ["Transferencia instantanea", "Disponible 24/7", "Modelo que ya conoces"],
      summary: "Si ya usas PIX, ya sabes usar PayCripto para salario y pagos recurrentes.",
    },
    {
      code: "us",
      region: "Estados Unidos",
      lead: "Zelle / Venmo / Cash App",
      items: ["Modelo mental parecido: enviar -> confirmar -> listo"],
      summary: "Instantaneo entre cuentas, directo en la app.",
    },
    {
      code: "eu",
      region: "Europa",
      lead: "SEPA Instant",
      items: ["Transferencias bancarias instantaneas"],
      summary: "Llega al momento, cualquier dia.",
    },
    {
      code: "gb",
      region: "Reino Unido",
      lead: "Faster Payments",
      items: ["Transferencias rapidas entre bancos"],
      summary: "Instantaneo en bancos del Reino Unido.",
    },
    {
      code: "in",
      region: "India",
      lead: "UPI (Google Pay / PhonePe)",
      items: ["Transferencia instantanea entre bancos"],
      summary: "Flujo de enviar -> confirmar -> pagado.",
    },
    {
      code: "sg",
      region: "Singapur",
      lead: "PayNow",
      items: ["Pagos instantaneos"],
      summary: "Flujo rapido para cuentas locales.",
    },
  ],
};

type Tutorial = {
  id: string;
  title: string;
  description: string;
  bullets: string[];
  cta: string;
};

type StepCard = {
  title: string;
  description: string;
  icon: typeof ArrowLeftRight;
};

type FeatureCard = {
  title: string;
  description: string;
  icon: typeof CreditCard;
};

type IncomeCard = {
  title: string;
  description: string;
  icon: typeof CreditCard;
};

type FaqItem = {
  question: string;
  answer: string;
};

type LandingCopy = {
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  heroLead: string;
  heroSupport: string;
  flowLegend: string;
  guideSubtitle: string;
  trustTitle: string;
  trustSubtitle: string;
  trustBadge: string;
  trustManifestoTitle: string;
  trustReasons: string[];
  salaryConnection: string;
  faqTitle: string;
  tutorialsLabel: string;
  guideTitle: string;
  tutorialBackCta: string;
  stats: {
    brand: string;
    experience: string;
    languages: string;
    languagesValue: string;
  };
  incomeSection: {
    tag: string;
    title: string;
    subtitle: string;
    cards: IncomeCard[];
    securityCopy: string;
    ctaLabel: string;
  };
  stepsSection: {
    tag: string;
    title: string;
    helper: string;
    badge: string;
    steps: StepCard[];
  };
  regionLabel: string;
  regionDetectedLabel: string;
  tutorialBadge: string;
  securityLabel: string;
  featureCards: FeatureCard[];
  heroCard: {
    accountState: string;
    balanceLabel: string;
    balanceValue: string;
    balanceFiatHint: string;
    primaryAction: string;
    secondaryAction: string;
    lastTransactionLabel: string;
    lastTransactionValue: string;
    lastTransactionMeta: string;
    statusCopy: string;
    liveLabel: string;
  };
  faqItems: FaqItem[];
};

type TransactionDirection = "recebido" | "enviado";
type TransactionFilter = "todos" | TransactionDirection;

type TransactionRecord = {
  id: string;
  direction: TransactionDirection;
  asset: string;
  amount: string;
  fiatAmount: string;
  dateLabel: string;
  time: string;
  dateFull: string;
  status: string;
  network: string;
  origin: string;
  destination: string;
  txId: string;
  explorerUrl: string;
};

const STATEMENT_COPY = {
  title: "EXTRATO",
  subtitle: "Movimentacoes da sua carteira",
  microcopy: "Mostramos apenas valores confirmados na blockchain.",
  viewAllLabel: "Ver tudo ->",
  viewLessLabel: "Ver menos",
  filters: [
    { value: "todos" as TransactionFilter, label: "Todos" },
    { value: "recebido" as TransactionFilter, label: "Recebidos" },
    { value: "enviado" as TransactionFilter, label: "Enviados" },
  ],
};

const TRANSACTIONS: TransactionRecord[] = [
  {
    id: "tx-01",
    direction: "recebido",
    asset: "USDC",
    amount: "120,00",
    fiatAmount: "≈ R$ 612,40",
    dateLabel: "Hoje",
    time: "09:32",
    dateFull: "27/12/2025 as 09:32",
    status: "Confirmada",
    network: "Base",
    origin: "Carteira externa",
    destination: "Sua carteira PayCripto",
    txId: "0x4b2f38c2a9ac8e2b1f5d4a938dc89aa09ad09a2c9b12f44c8a2c9b3e9a1d0f",
    explorerUrl: "https://basescan.org/tx/0x4b2f38c2a9ac8e2b1f5d4a938dc89aa09ad09a2c9b12f44c8a2c9b3e9a1d0f",
  },
  {
    id: "tx-02",
    direction: "enviado",
    asset: "BRL",
    amount: "3.850,00",
    fiatAmount: "≈ R$ 3.850,00",
    dateLabel: "Ontem",
    time: "18:10",
    dateFull: "26/12/2025 as 18:10",
    status: "Confirmada",
    network: "Base",
    origin: "Sua carteira PayCripto",
    destination: "Carteira externa",
    txId: "0xe9a1d6c0f33ba21d5af8c42d1bd3ec2a7c9f0c12e4bd9fd86a2c4a33d3c2a8d1",
    explorerUrl: "https://basescan.org/tx/0xe9a1d6c0f33ba21d5af8c42d1bd3ec2a7c9f0c12e4bd9fd86a2c4a33d3c2a8d1",
  },
  {
    id: "tx-03",
    direction: "recebido",
    asset: "USDC",
    amount: "75,00",
    fiatAmount: "≈ R$ 382,60",
    dateLabel: "27/12",
    time: "07:56",
    dateFull: "27/12/2025 as 07:56",
    status: "Confirmada",
    network: "Base",
    origin: "Carteira externa",
    destination: "Sua carteira PayCripto",
    txId: "0xa7134bf19a7c2ed1abf8d21f1c73a0b9dfc92ba5f5bb1a7a6c1da2ff1bafc02e",
    explorerUrl: "https://basescan.org/tx/0xa7134bf19a7c2ed1abf8d21f1c73a0b9dfc92ba5f5bb1a7a6c1da2ff1bafc02e",
  },
  {
    id: "tx-04",
    direction: "enviado",
    asset: "USDC",
    amount: "30,00",
    fiatAmount: "≈ R$ 153,10",
    dateLabel: "26/12",
    time: "14:22",
    dateFull: "26/12/2025 as 14:22",
    status: "Confirmada",
    network: "Base",
    origin: "Sua carteira PayCripto",
    destination: "Carteira externa",
    txId: "0x7cc4831a0f2b9d8a1c2d3e4f5a6b7c8d9e0f18273b4c5d6e7f8a9b0c1d2e3f4a",
    explorerUrl: "https://basescan.org/tx/0x7cc4831a0f2b9d8a1c2d3e4f5a6b7c8d9e0f18273b4c5d6e7f8a9b0c1d2e3f4a",
  },
  {
    id: "tx-05",
    direction: "recebido",
    asset: "BRLx",
    amount: "280,00",
    fiatAmount: "≈ R$ 280,00",
    dateLabel: "25/12",
    time: "11:05",
    dateFull: "25/12/2025 as 11:05",
    status: "Confirmada",
    network: "Base",
    origin: "Carteira externa",
    destination: "Sua carteira PayCripto",
    txId: "0xf5d2471bc3ea9d17c4ab8e2f039c5d8a1e2f3b4c5d6e7f8a9b0c1d2e3f4a5b6c",
    explorerUrl: "https://basescan.org/tx/0xf5d2471bc3ea9d17c4ab8e2f039c5d8a1e2f3b4c5d6e7f8a9b0c1d2e3f4a5b6c",
  },
];

const TUTORIALS: Record<LocaleKey, Tutorial[]> = {
  "pt-BR": [
    {
      id: "tutorial-carteira",
      title: "1) Crie sua carteira",
      description: "MetaMask, Rabby ou outra Web3. Anote a seed offline e habilite a rede suportada.",
      bullets: ["Instale o app oficial.", "Guarde a seed em um lugar seguro.", "Ative a rede que vamos usar na PayCripto."],
      cta: "Fazer agora",
    },
    {
      id: "tutorial-conexao",
      title: "2) Conecte ao PayCripto",
      description: "Abra o site, clique em conectar e autorize no pop-up para ver saldo e nome.",
      bullets: ["Deixe a carteira destravada.", "Escolha a conta certa antes de aceitar.", "Espere o status conectado."],
      cta: "Conectar minha carteira",
    },
    {
      id: "tutorial-envio",
      title: "3) Envie e receba",
      description: "Digite o nome, coloque o valor e confirme. Recebimentos caem direto na carteira.",
      bullets: ["Use nome PayCripto ou endereco.", "Revise rede, taxa e valor.", "Confirme e compartilhe o recibo."],
      cta: "Enviar agora",
    },
  ],
  "en-US": [
    {
      id: "tutorial-wallet",
      title: "1) Create your wallet",
      description: "MetaMask, Rabby or another Web3 wallet. Save the seed offline and enable the right network.",
      bullets: ["Install the official app.", "Store your seed phrase safely.", "Turn on the network we use on PayCripto."],
      cta: "Do it now",
    },
    {
      id: "tutorial-connect",
      title: "2) Connect to PayCripto",
      description: "Open the site, hit connect, and approve the pop-up to see your balance and name.",
      bullets: ["Keep the wallet unlocked.", "Pick the right account before accepting.", "Wait for the connected status."],
      cta: "Connect my wallet",
    },
    {
      id: "tutorial-send",
      title: "3) Send and receive",
      description: "Type the name, enter the amount, and confirm. Incoming funds land in your wallet.",
      bullets: ["Use a PayCripto name or address.", "Review network, fee, and amount.", "Confirm and share the receipt."],
      cta: "Send now",
    },
  ],
  "es-ES": [
    {
      id: "tutorial-cartera",
      title: "1) Crea tu billetera",
      description: "MetaMask, Rabby u otra Web3. Guarda la seed offline y habilita la red correcta.",
      bullets: ["Instala la app oficial.", "Guarda tu seed en un lugar seguro.", "Activa la red que usamos en PayCripto."],
      cta: "Hacer ahora",
    },
    {
      id: "tutorial-conectar",
      title: "2) Conecta a PayCripto",
      description: "Abre el sitio, toca conectar y aprueba el pop-up para ver tu saldo y nombre.",
      bullets: ["Deja la billetera desbloqueada.", "Elige la cuenta correcta antes de aceptar.", "Espera el estado conectado."],
      cta: "Conectar mi billetera",
    },
    {
      id: "tutorial-enviar",
      title: "3) Envia y recibe",
      description: "Escribe el nombre, pon el monto y confirma. Los fondos entran directo en tu billetera.",
      bullets: ["Usa un nombre PayCripto o direccion.", "Revisa red, tarifa y monto.", "Confirma y comparte el recibo."],
      cta: "Enviar ahora",
    },
  ],
};

const LANDING_COPY: Record<LocaleKey, LandingCopy> = {
  "pt-BR": {
    primaryCtaLabel: "Criar PayCripto",
    secondaryCtaLabel: "Ver como funciona",
    heroLead: "Rapido, simples e sem banco. Receba pagamentos direto na sua carteira Base.",
    heroSupport: "Sem custodia. Sem banco. No seu controle.",
    flowLegend: "Receba pagamentos globais direto na sua carteira.",
    guideSubtitle: "Comece agora, mesmo sem saber nada de cripto.",
    trustTitle: "Voce no controle. Sempre.",
    trustSubtitle: "Sem custodia. Sem banco. Sem intermediarios.",
    trustBadge: "Seu dinheiro. Suas chaves. Suas regras.",
    trustManifestoTitle: "Manifesto de confianca",
    trustReasons: [
      "Voce controla suas chaves: o PayCripto nunca acessa seus fundos. Voce aprova tudo direto na sua carteira.",
      "Nao somos banco: nao bloqueamos saldo, nao congelamos contas, nao pedimos permissao.",
      "Infraestrutura verificavel: Base, contratos publicos e integracoes verificaveis.",
    ],
    salaryConnection: "Ideal para receber salario, freelas e pagamentos recorrentes - sem depender de bancos.",
    faqTitle: "Perguntas rapidas",
    faqItems: [
      {
        question: "Posso receber salario no PayCripto?",
        answer:
          "Sim. Empresas ou pessoas podem enviar pagamentos recorrentes direto para sua carteira Base - como um PIX mensal, so que em cripto.",
      },
      {
        question: "Preciso de banco para usar?",
        answer: "Nao. O PayCripto funciona direto com carteira cripto. Voce decide se, quando e onde converter para moeda local.",
      },
      {
        question: "Posso perder meus fundos?",
        answer: "Nao guardamos seus fundos. Voce conecta sua carteira e aprova cada operacao. Seus ativos ficam sempre sob seu controle.",
      },
    ],
    tutorialsLabel: "Tutoriais rapidos",
    guideTitle: "Guia pratico para sair do zero",
    tutorialBackCta: "Voltar para o passo a passo",
    stats: {
      brand: "Marca",
      experience: "Experiencia",
      languages: "Idiomas",
      languagesValue: "pt-BR, en-US e es-ES",
    },
    incomeSection: {
      tag: "Receba em cripto",
      title: "Receba salario e pagamentos direto na sua carteira Base",
      subtitle: "Empresas, clientes ou plataformas podem pagar voce direto em cripto - sem banco, sem bloqueios, sem espera.",
      cards: [
        { title: "Salario internacional", description: "Receba de empresas no Brasil ou fora, direto na sua carteira.", icon: Globe2 },
        { title: "Freelancers e criadores", description: "Pagamentos globais sem depender de banco ou plataforma.", icon: Zap },
        { title: "No seu controle", description: "Sem custodia. As chaves sao suas. O dinheiro tambem.", icon: ShieldCheck },
      ],
      securityCopy: "O PayCripto nao guarda seus fundos. Voce apenas conecta sua carteira e usa a interface.",
      ctaLabel: "Ver como receber pagamentos",
    },
    stepsSection: {
      tag: "Passo a passo",
      title: "Como funciona em 3 passos",
      helper: "Fluxo simples: digita o nome -> insere valor -> confirma.",
      badge: "Sem escolher rede. Sem taxa confusa. Sem custodia.",
      steps: [
        { title: "Crie sua carteira", description: "MetaMask, Rabby ou outra Web3. Guarde a seed e ative a rede.", icon: Wallet },
        { title: "Conecte ao PayCripto", description: "Autorize no pop-up e veja saldo e nome PayCripto.", icon: Link2 },
        { title: "Envie e receba", description: "Use nome PayCripto ou endereco com fluxo estilo PIX.", icon: ArrowLeftRight },
      ],
    },
    regionLabel: "Equivalentes ao PIX em outros paises (opcional)",
    regionDetectedLabel: "Pais detectado automaticamente: {region}",
    tutorialBadge: "Tutorial",
    securityLabel: "Seguranca",
    featureCards: [
      { title: "Marca PayCripto", description: "Identidade clara e consistente em toda a experiencia.", icon: CreditCard },
      { title: PIX_COPY["pt-BR"].instantTitle, description: PIX_COPY["pt-BR"].experience, icon: Zap },
      { title: "Pronto para o mundo", description: PIX_COPY["pt-BR"].languageDescription, icon: Globe2 },
    ],
    heroCard: {
      accountState: "Conta ativa",
      balanceLabel: "Saldo disponivel",
      balanceValue: "USDC 1.240,50",
      balanceFiatHint: "\u2248 R$ 6.380,00",
      primaryAction: "Receber pagamento",
      secondaryAction: "Transferir",
      lastTransactionLabel: "Ultima transacao",
      lastTransactionValue: "+ USDC 720,00",
      lastTransactionMeta: "De Lucas \u2022 agora",
      statusCopy: "Conta pronta para receber pagamentos",
      liveLabel: "Ao vivo",
    },
  },
  "en-US": {
    primaryCtaLabel: "Create PayCripto",
    secondaryCtaLabel: "See how it works",
    heroLead: "Fast, simple, no banks. Get paid straight to your Base wallet.",
    heroSupport: "Non-custodial. No banks. You stay in control.",
    flowLegend: "Receive global payments straight to your wallet.",
    guideSubtitle: "Start now, even if you're new to crypto.",
    trustTitle: "You stay in control. Always.",
    trustSubtitle: "No custody. No banks. No intermediaries.",
    trustBadge: "Your money. Your keys. Your rules.",
    trustManifestoTitle: "Trust manifesto",
    trustReasons: [
      "You hold your keys: PayCripto never touches your funds. You approve every action in your wallet.",
      "We are not a bank: no balance holds, no frozen accounts, no permission needed.",
      "Open, verifiable stack: Base, public contracts, and verifiable integrations.",
    ],
    salaryConnection: "Built for salary, freelance, and recurring payouts - without relying on banks.",
    faqTitle: "Quick questions",
    faqItems: [
      {
        question: "Can I get my salary in PayCripto?",
        answer:
          "Yes. Companies or individuals can send recurring payments straight to your Base wallet - like a monthly salary in crypto.",
      },
      {
        question: "Do I need a bank to use it?",
        answer: "No. PayCripto works directly with your crypto wallet. You decide if, when, and where to convert to local currency.",
      },
      {
        question: "Can I lose my funds?",
        answer: "We do not custody your funds. You connect your wallet and approve each operation. Your assets stay under your control.",
      },
    ],
    tutorialsLabel: "Quick tutorials",
    guideTitle: "Practical guide to get started",
    tutorialBackCta: "Back to how it works",
    stats: {
      brand: "Brand",
      experience: "Experience",
      languages: "Languages",
      languagesValue: "pt-BR, en-US and es-ES",
    },
    incomeSection: {
      tag: "Get paid in crypto",
      title: "Get salary and payments straight to your Base wallet",
      subtitle: "Companies, clients, or platforms can pay you directly in crypto - no banks, no holds, no waiting.",
      cards: [
        { title: "International salary", description: "Get paid by companies in Brazil or abroad straight to your wallet.", icon: Globe2 },
        { title: "Freelancers & creators", description: "Global payments without depending on banks or platforms.", icon: Zap },
        { title: "In your control", description: "Non-custodial. Your keys. Your money.", icon: ShieldCheck },
      ],
      securityCopy: "PayCripto never holds your funds. You just connect your wallet and use the interface.",
      ctaLabel: "See how to get paid",
    },
    stepsSection: {
      tag: "Step by step",
      title: "How it works in 3 steps",
      helper: "Simple flow: type the name -> enter amount -> confirm.",
      badge: "No network picking. No confusing fees. No custody.",
      steps: [
        { title: "Create your wallet", description: "MetaMask, Rabby or another Web3 wallet. Keep the seed safe and enable the network.", icon: Wallet },
        { title: "Connect to PayCripto", description: "Approve the pop-up to see your balance and PayCripto name.", icon: Link2 },
        { title: "Send and receive", description: "Use a PayCripto name or address with a PIX-style flow.", icon: ArrowLeftRight },
      ],
    },
    regionLabel: "PIX equivalents worldwide (optional)",
    regionDetectedLabel: "Detected automatically: {region}",
    tutorialBadge: "Tutorial",
    securityLabel: "Security",
    featureCards: [
      { title: "PayCripto brand", description: "Clear, consistent identity across the experience.", icon: CreditCard },
      { title: PIX_COPY["en-US"].instantTitle, description: PIX_COPY["en-US"].experience, icon: Zap },
      { title: "Ready for the world", description: PIX_COPY["en-US"].languageDescription, icon: Globe2 },
    ],
    heroCard: {
      accountState: "Account active",
      balanceLabel: "Available balance",
      balanceValue: "USDC 1,240.50",
      balanceFiatHint: "\u2248 $6,380.00",
      primaryAction: "Receive payment",
      secondaryAction: "Transfer",
      lastTransactionLabel: "Last transaction",
      lastTransactionValue: "+ USDC 720.00",
      lastTransactionMeta: "From Lucas \u2022 now",
      statusCopy: "Account ready to receive payments",
      liveLabel: "Live",
    },
  },
  "es-ES": {
    primaryCtaLabel: "Crear PayCripto",
    secondaryCtaLabel: "Ver como funciona",
    heroLead: "Rapido, simple y sin banco. Recibe pagos directo en tu billetera Base.",
    heroSupport: "Sin custodia. Sin banco. En tu control.",
    flowLegend: "Recibe pagos globales directo en tu billetera.",
    guideSubtitle: "Empieza ahora, incluso si eres nuevo en cripto.",
    trustTitle: "Tu en control. Siempre.",
    trustSubtitle: "Sin custodia. Sin banco. Sin intermediarios.",
    trustBadge: "Tu dinero. Tus llaves. Tus reglas.",
    trustManifestoTitle: "Manifiesto de confianza",
    trustReasons: [
      "Tu controlas tus llaves: PayCripto nunca toca tus fondos. Apruebas todo directo en tu billetera.",
      "No somos banco: no bloqueamos saldo, no congelamos cuentas, no pedimos permiso.",
      "Infraestructura verificable: Base, contratos publicos e integraciones verificables.",
    ],
    salaryConnection: "Ideal para recibir salario, freelas y pagos recurrentes - sin depender de bancos.",
    faqTitle: "Preguntas rapidas",
    faqItems: [
      {
        question: "Puedo recibir salario en PayCripto?",
        answer:
          "Si. Empresas o personas pueden enviar pagos recurrentes directo a tu billetera Base - como un salario mensual en cripto.",
      },
      {
        question: "Necesito banco para usar?",
        answer: "No. PayCripto funciona directo con tu billetera cripto. Tu decides si, cuando y donde convertir a moneda local.",
      },
      {
        question: "Puedo perder mis fondos?",
        answer: "No custodiamos tus fondos. Conectas tu billetera y apruebas cada operacion. Tus activos quedan bajo tu control.",
      },
    ],
    tutorialsLabel: "Tutoriales rapidos",
    guideTitle: "Guia practica para empezar",
    tutorialBackCta: "Volver al paso a paso",
    stats: {
      brand: "Marca",
      experience: "Experiencia",
      languages: "Idiomas",
      languagesValue: "pt-BR, en-US y es-ES",
    },
    incomeSection: {
      tag: "Cobra en cripto",
      title: "Recibe salario y pagos directo en tu billetera Base",
      subtitle: "Empresas, clientes o plataformas pueden pagarte directo en cripto - sin banco, sin bloqueos, sin espera.",
      cards: [
        { title: "Salario internacional", description: "Recibe de empresas en Brasil o fuera, directo en tu billetera.", icon: Globe2 },
        { title: "Freelancers y creadores", description: "Pagos globales sin depender de banco o plataforma.", icon: Zap },
        { title: "En tu control", description: "Sin custodia. Las llaves son tuyas. El dinero tambien.", icon: ShieldCheck },
      ],
      securityCopy: "PayCripto no guarda tus fondos. Solo conectas tu billetera y usas la interfaz.",
      ctaLabel: "Ver como cobrar pagos",
    },
    stepsSection: {
      tag: "Paso a paso",
      title: "Como funciona en 3 pasos",
      helper: "Flujo simple: escribe el nombre -> pon el monto -> confirma.",
      badge: "Sin elegir red. Sin tarifas confusas. Sin custodia.",
      steps: [
        { title: "Crea tu billetera", description: "MetaMask, Rabby u otra Web3. Guarda la seed y activa la red correcta.", icon: Wallet },
        { title: "Conecta a PayCripto", description: "Aprueba el pop-up para ver tu saldo y nombre PayCripto.", icon: Link2 },
        { title: "Envia y recibe", description: "Usa nombre PayCripto o direccion con flujo estilo PIX.", icon: ArrowLeftRight },
      ],
    },
    regionLabel: "Equivalentes al PIX en otros paises (opcional)",
    regionDetectedLabel: "Pais detectado automaticamente: {region}",
    tutorialBadge: "Tutorial",
    securityLabel: "Seguridad",
    featureCards: [
      { title: "Marca PayCripto", description: "Identidad clara y consistente en toda la experiencia.", icon: CreditCard },
      { title: PIX_COPY["es-ES"].instantTitle, description: PIX_COPY["es-ES"].experience, icon: Zap },
      { title: "Lista para el mundo", description: PIX_COPY["es-ES"].languageDescription, icon: Globe2 },
    ],
    heroCard: {
      accountState: "Cuenta activa",
      balanceLabel: "Saldo disponible",
      balanceValue: "USDC 1.240,50",
      balanceFiatHint: "\u2248 $6.380,00",
      primaryAction: "Recibir pago",
      secondaryAction: "Transferir",
      lastTransactionLabel: "Ultima transaccion",
      lastTransactionValue: "+ USDC 720,00",
      lastTransactionMeta: "De Lucas \u2022 ahora",
      statusCopy: "Cuenta lista para recibir pagos",
      liveLabel: "En vivo",
    },
  },
};

export default function Home() {
  const params = useParams<{ locale?: string }>();
  const localeParam = params?.locale;
  const selectedLocale = (Array.isArray(localeParam) ? localeParam[0] : localeParam) as LocaleKey | undefined;
  const locale = SUPPORTED_LOCALES.includes(selectedLocale as LocaleKey) ? (selectedLocale as LocaleKey) : "pt-BR";
  const pixCopy = PIX_COPY[locale];
  const landingCopy = LANDING_COPY[locale];
  const equivalents = REGIONAL_EQUIVALENTS[locale];
  const appPath = `/${locale}/cripto`;
  const tutorials = TUTORIALS[locale];
  const features = landingCopy.featureCards;
  const incomeSection = landingCopy.incomeSection;
  const steps = landingCopy.stepsSection.steps;
  const openAppCta = locale === "en-US" ? "Open PayCripto" : "Abrir PayCripto";
  const statementCopy = STATEMENT_COPY;
  const [showGlobalExamples, setShowGlobalExamples] = useState(false);
  const [statementFilter, setStatementFilter] = useState<TransactionFilter>("todos");
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null);

  const primaryEquivalent = useMemo(
    () => equivalents.find((equivalent) => equivalent.code === "br") ?? equivalents[0],
    [equivalents]
  );

  const otherEquivalents = useMemo(
    () => equivalents.filter((equivalent) => equivalent.code !== primaryEquivalent?.code),
    [equivalents, primaryEquivalent?.code]
  );

  const visibleGlobalEquivalents = useMemo(
    () => (showGlobalExamples ? otherEquivalents : []),
    [otherEquivalents, showGlobalExamples]
  );

  const hasMoreRegions = otherEquivalents.length > 0;
  const filteredTransactions = useMemo(
    () => TRANSACTIONS.filter((transaction) => {
      if (statementFilter === "todos") return true;
      return transaction.direction === statementFilter;
    }),
    [statementFilter]
  );
  const visibleTransactions = useMemo(
    () => (showAllTransactions ? filteredTransactions : filteredTransactions.slice(0, 3)),
    [filteredTransactions, showAllTransactions]
  );
  const getTxIdPreview = (txId: string) => `${txId.slice(0, 6)}...${txId.slice(-4)}`;
  const handleCopyTxId = () => {
    if (!selectedTransaction?.txId) return;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(selectedTransaction.txId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1f] via-[#0d1530] to-black text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-6 py-14 md:gap-16">
        <header className="flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-landing.png"
              alt="PayCripto"
              width={155}
              height={119}
              className="h-10 w-auto drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)] sm:h-12"
              priority
            />
            <p className="hidden text-sm text-white/80 sm:block">{pixCopy.badge}</p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <LocaleSwitchNotice className="hidden sm:block" />
            <Link
              href={appPath}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-white/90"
            >
              {openAppCta}
              <ArrowRight size={16} />
            </Link>
          </div>
        </header>

        <main className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/70">
              <Image
                src="/logo-icon.png"
                alt="PayCripto"
                width={78}
                height={72}
                className="h-4 w-auto"
                priority
              />
              <span>PayCripto</span>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                {pixCopy.heroTitle}
              </h1>
              <div className="space-y-2">
                <p className="max-w-xl text-lg text-white/70">
                  {landingCopy.heroLead}
                </p>
                <p className="max-w-xl text-sm text-white/60 sm:text-base">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2 py-1 text-white">
                    <ShieldCheck size={16} className="text-white/80" strokeWidth={1.75} />
                    <span>{landingCopy.heroSupport}</span>
                  </span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={appPath}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:bg-primary-hover"
              >
                {landingCopy.primaryCtaLabel}
                <Send size={16} />
              </Link>
              <Link
                href="#como-funciona"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/30"
              >
                {landingCopy.secondaryCtaLabel}
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm text-white/70 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-white/50">{landingCopy.stats.experience}</p>
                <p className="mt-2 text-lg font-semibold text-white">{pixCopy.uxLabel}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-white/50">{landingCopy.stats.languages}</p>
                <p className="mt-2 text-lg font-semibold text-white">{landingCopy.stats.languagesValue}</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-10 -right-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-secondary/20 blur-3xl" />
            <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-primary/30 via-primary/15 to-secondary/25 p-8 shadow-2xl shadow-primary/20">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>{landingCopy.heroCard.accountState}</span>
                </div>
                <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                  {landingCopy.heroCard.liveLabel}
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <p className="text-xs uppercase tracking-[0.14em] text-white/70">{landingCopy.heroCard.balanceLabel}</p>
                <p className="text-4xl font-bold text-white">{landingCopy.heroCard.balanceValue}</p>
                <p className="text-sm text-white/70">{landingCopy.heroCard.balanceFiatHint}</p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={appPath}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-white/90"
                >
                  {landingCopy.heroCard.primaryAction}
                </Link>
                <Link
                  href={appPath}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/40"
                >
                  {landingCopy.heroCard.secondaryAction}
                </Link>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-white/60">{landingCopy.heroCard.lastTransactionLabel}</p>
                <p className="mt-2 text-xl font-semibold text-white">{landingCopy.heroCard.lastTransactionValue}</p>
                <p className="text-xs text-white/60">{landingCopy.heroCard.lastTransactionMeta}</p>
              </div>

              <div className="mt-6 space-y-2">
                <div className="inline-flex items-center gap-2 text-xs text-white/60">
                  <CheckCircle2 size={14} className="text-white/80" strokeWidth={1.75} />
                  <span>{landingCopy.heroCard.statusCopy}</span>
                </div>
                <p className="text-sm text-white/70">{landingCopy.flowLegend}</p>
              </div>
            </div>
          </div>
        </main>

        <div className="sm:hidden">
          <LocaleSwitchNotice className="w-full" />
        </div>

        <section className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-primary/10">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.14em] text-white/60">{statementCopy.title}</p>
              <h3 className="text-2xl font-semibold text-white">{statementCopy.subtitle}</h3>
              <p className="text-sm text-white/70">Sem hashes, sem enderecos completos. So o que importa.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAllTransactions((prev) => !prev)}
              className="inline-flex w-fit items-center gap-2 self-start rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/30"
            >
              {showAllTransactions ? statementCopy.viewLessLabel : statementCopy.viewAllLabel}
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {statementCopy.filters.map((filter) => {
              const isActive = statementFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => {
                    setStatementFilter(filter.value);
                    setShowAllTransactions(false);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/30"
                      : "border border-white/15 bg-white/5 text-white hover:-translate-y-0.5 hover:border-white/30"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="grid gap-3">
            {visibleTransactions.map((transaction) => {
              const isReceived = transaction.direction === "recebido";
              return (
                <button
                  key={transaction.id}
                  type="button"
                  onClick={() => setSelectedTransaction(transaction)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-left transition hover:-translate-y-1 hover:border-white/20"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 flex h-10 w-10 items-center justify-center rounded-xl ${
                        isReceived ? "bg-emerald-500/10 text-emerald-400" : "bg-sky-500/10 text-sky-400"
                      }`}
                    >
                      {isReceived ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">{isReceived ? "Recebido" : "Enviado"}</p>
                      <p className="text-sm text-white/80">
                        {transaction.asset} {transaction.amount}
                      </p>
                      <p className="text-xs text-white/60">
                        {transaction.dateLabel} {"\u2022"} {transaction.time}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm font-semibold text-white">
                    {isReceived ? "+" : "-"}
                    {transaction.asset} {transaction.amount}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-white/60">{statementCopy.microcopy}</p>
        </section>

        <section
          id="como-funciona"
          className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-primary/10 md:grid-cols-[1fr_2fr]"
        >
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.14em] text-white/60">{landingCopy.stepsSection.tag}</p>
            <h2 className="text-2xl font-semibold text-white">{landingCopy.stepsSection.title}</h2>
            <p className="text-sm text-white/70">{landingCopy.stepsSection.helper}</p>
            <div className="flex items-center gap-2 text-sm text-white/75">
              <ShieldCheck size={16} strokeWidth={1.75} />
              <span>{landingCopy.stepsSection.badge}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.title}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:-translate-y-1 hover:border-white/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80">
                  <step.icon size={18} strokeWidth={1.75} />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-white">{step.title}</p>
                  <p className="text-sm text-white/70">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="receba"
          className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-primary/10"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.14em] text-white/70">
                <Zap size={14} />
                {incomeSection.tag}
              </span>
              <h2 className="text-2xl font-semibold text-white">{incomeSection.title}</h2>
              <p className="text-sm text-white/70">{incomeSection.subtitle}</p>
            </div>
            <Link
              href="#tutoriais"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/30"
            >
              {incomeSection.ctaLabel}
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {incomeSection.cards.map((card) => (
              <div
                key={card.title}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:-translate-y-1 hover:border-white/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80">
                  <card.icon size={18} strokeWidth={1.75} />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-white">{card.title}</p>
                  <p className="text-sm text-white/70">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-white/15 bg-black/30 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80">
              <ShieldCheck size={18} strokeWidth={1.75} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">{landingCopy.heroSupport}</p>
              <p className="text-sm text-white/70">{incomeSection.securityCopy}</p>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-primary/10">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                <Globe2 size={14} />
                <span>{landingCopy.regionLabel}</span>
              </div>
              <h3 className="text-2xl font-semibold text-white">{pixCopy.regionHeading}</h3>
              <p className="text-sm text-white/70">{pixCopy.regionSubtitle}</p>
            </div>
            {hasMoreRegions && (
              <button
                type="button"
                onClick={() => setShowGlobalExamples((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/30"
              >
                {showGlobalExamples ? pixCopy.hideAllLabel : pixCopy.viewAllLabel}
                <ArrowRight size={16} className={showGlobalExamples ? "rotate-45 transition" : "transition"} />
              </button>
            )}
          </div>

          <div className={`grid gap-4 ${showGlobalExamples ? "lg:grid-cols-[1.1fr_1fr]" : ""}`}>
            {primaryEquivalent && (
              <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/15 p-4 shadow-lg shadow-primary/15">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-[0.14em] text-white/50">{primaryEquivalent.code}</span>
                    <p className="text-sm font-semibold text-white">{primaryEquivalent.region}</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">
                    {pixCopy.localBadge}
                  </span>
                </div>
                {primaryEquivalent.lead && (
                  <p className="text-lg font-semibold text-white">{primaryEquivalent.lead}</p>
                )}
                <div className="space-y-2 text-sm text-white/75">
                  {primaryEquivalent.items.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <span className="mt-[6px] inline-block h-1.5 w-1.5 rounded-full bg-white/70" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                  {primaryEquivalent.summary}
                </div>
              </div>
            )}

            {showGlobalExamples && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/60">
                  <span className="inline-flex h-2 w-2 rounded-full bg-primary/60" />
                  <span>{pixCopy.otherBadge}</span>
                  <span className="text-white/50">({pixCopy.secondaryHint})</span>
                </div>
                <div className="grid gap-3">
                  {visibleGlobalEquivalents.map((equivalent) => (
                    <div
                      key={equivalent.region}
                      className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-white/5 p-3 text-sm text-white/80 transition hover:-translate-y-1 hover:border-white/15"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] uppercase tracking-[0.14em] text-white/50">{equivalent.code}</span>
                          <p className="text-sm font-semibold text-white">{equivalent.region}</p>
                        </div>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/70">
                          {pixCopy.otherBadge}
                        </span>
                      </div>
                      {equivalent.lead && (
                        <p className="text-sm font-semibold text-white/80">{equivalent.lead}</p>
                      )}
                      <div className="space-y-1 text-[13px] text-white/70">
                        {equivalent.items.map((item) => (
                          <div key={item} className="flex items-start gap-2">
                            <span className="mt-[6px] inline-block h-1.5 w-1.5 rounded-full bg-white/30" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[13px] text-white/60">{equivalent.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/80">
            <span className="inline-flex h-2 w-2 rounded-full bg-primary/70" />
            <span>{pixCopy.globalPhrase}</span>
          </div>
        </section>

        <section id="tutoriais" className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-white/60">{landingCopy.tutorialsLabel}</p>
              <h3 className="text-xl font-semibold text-white">{landingCopy.guideTitle}</h3>
              <p className="text-sm text-white/70">{landingCopy.guideSubtitle}</p>
            </div>
            <Link
              href="#como-funciona"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/30"
            >
              {landingCopy.tutorialBackCta}
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {tutorials.map((tutorial) => (
              <div
                key={tutorial.id}
                id={tutorial.id}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-primary/5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80">
                    <BookOpen size={18} strokeWidth={1.75} />
                  </div>
                  <span className="text-xs uppercase tracking-[0.14em] text-white/60">{landingCopy.tutorialBadge}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-white">{tutorial.title}</p>
                  <p className="text-sm text-white/70">{tutorial.description}</p>
                </div>
                <div className="space-y-2">
                  {tutorial.bullets.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-white/70">
                      <span className="mt-[6px] inline-block h-2 w-2 rounded-full bg-white/50" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <ArrowRight size={16} strokeWidth={1.75} />
                  <span>{tutorial.cta}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-primary/10">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.14em] text-white/60">{landingCopy.securityLabel}</p>
              <h3 className="text-xl font-semibold text-white">{landingCopy.trustTitle}</h3>
              <p className="text-sm text-white/70">{landingCopy.trustSubtitle}</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white/80">
              <ShieldCheck size={16} strokeWidth={1.75} />
              <span>{landingCopy.trustBadge}</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.14em] text-white/60">{landingCopy.trustManifestoTitle}</p>
              <ul className="space-y-2 text-sm text-white/75">
                {landingCopy.trustReasons.map((reason) => (
                  <li key={reason} className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/80">
                      <ShieldCheck size={14} strokeWidth={1.75} />
                    </span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-white">{landingCopy.faqTitle}</h4>
              <ul className="space-y-2 text-sm text-white/75">
                {landingCopy.faqItems.map((item) => (
                  <li
                    key={item.question}
                    className="rounded-xl border border-white/10 bg-black/30 p-3"
                  >
                    <div className="flex items-start gap-2">
                      <ArrowRight size={14} className="mt-1 text-white/70" strokeWidth={1.75} />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-white">{item.question}</p>
                        <p className="text-sm text-white/70">{item.answer}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-sm text-white/70">{landingCopy.salaryConnection}</p>

          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href={appPath}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:bg-primary-hover"
            >
              {landingCopy.primaryCtaLabel}
              <Send size={16} />
            </Link>
            <Link
              href="#como-funciona"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/30"
            >
              {landingCopy.secondaryCtaLabel}
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:border-white/20"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80">
                <feature.icon size={18} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-base font-semibold text-white">{feature.title}</p>
                <p className="text-sm text-white/70">{feature.description}</p>
              </div>
            </div>
          ))}
        </section>
      </div>

      {selectedTransaction && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 py-6 sm:items-center"
          onClick={() => setSelectedTransaction(null)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b1224] shadow-2xl shadow-primary/20"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-white/5 bg-white/5 px-5 py-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Transacao concluida</p>
                <p className="text-xs text-white/70">Comprovante direto, sem complicar.</p>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                    selectedTransaction.direction === "recebido"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-sky-500/10 text-sky-400"
                  }`}
                >
                  <CheckCircle2 size={20} />
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTransaction(null)}
                  className="rounded-full border border-white/10 p-2 text-white transition hover:-translate-y-0.5 hover:border-white/30"
                  aria-label="Fechar"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-1 border-b border-white/5 bg-gradient-to-br from-primary/10 via-white/5 to-black/40 px-5 py-4">
              <p className="text-sm text-white/70">
                {selectedTransaction.direction === "recebido" ? "Recebimento" : "Envio"}
              </p>
              <p className="text-3xl font-bold text-white">
                {selectedTransaction.asset} {selectedTransaction.amount}
              </p>
              <p className="text-sm text-white/60">{selectedTransaction.fiatAmount}</p>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-white">Detalhes da transacao</p>
                <div className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white/80">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Tipo</span>
                    <span className="font-semibold text-white">
                      {selectedTransaction.direction === "recebido" ? "Recebimento" : "Envio"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Data</span>
                    <span className="font-semibold text-white">{selectedTransaction.dateFull}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Status</span>
                    <span className="font-semibold text-white">{selectedTransaction.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Rede</span>
                    <span className="font-semibold text-white">{selectedTransaction.network}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-white">Origem / Destino</p>
                <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white/80">
                  <div className="space-y-1">
                    <p className="text-white/60">Origem</p>
                    <p className="font-semibold text-white">{selectedTransaction.origin}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-white/60">Destino</p>
                    <p className="font-semibold text-white">{selectedTransaction.destination}</p>
                  </div>
                  <p className="text-[11px] text-white/50">
                    Nunca mostramos endereco completo aqui. So se o usuario pedir.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-white">Identificador (modo humano)</p>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                  <div>
                    <p className="text-xs text-white/60">ID da transacao</p>
                    <p className="text-sm font-semibold text-white">{getTxIdPreview(selectedTransaction.txId)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyTxId}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/30"
                  >
                    <Copy size={16} />
                    Copiar ID
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-white/5 bg-black/40 px-5 py-4">
              <a
                href={selectedTransaction.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:bg-primary-hover"
              >
                Ver na blockchain
                <ExternalLink size={16} />
              </a>
              <p className="text-xs text-white/60">Link oficial para o explorador da rede Base.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

