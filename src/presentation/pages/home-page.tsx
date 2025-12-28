'use client';

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  CreditCard,
  Globe2,
  Link2,
  Send,
  ShieldCheck,
  Wallet,
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
  exampleLabel: string;
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
    balanceLabel: string;
    nextSendLabel: string;
    nextSendMeta: string;
    brandTitle: string;
    brandDesc: string;
    nameReadyTitle: string;
    nameReadyDesc: string;
    liveLabel: string;
    incomeHint: string;
  };
  faqItems: FaqItem[];
};

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
    exampleLabel: "Exemplo real de envio",
    flowLegend: "Fluxo simples para enviar e receber: digita o nome -> insere valor -> confirma.",
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
      balanceLabel: "Saldo PayCripto",
      nextSendLabel: "Proximo envio",
      nextSendMeta: "Para Lucas - 0x98...2f",
      brandTitle: "Marca a vista",
      brandDesc: "Interface focada em clareza e zero distracoes.",
      nameReadyTitle: "PayCripto pronto",
      nameReadyDesc: "Seu nome visivel na experiencia",
      liveLabel: "Ao vivo",
      incomeHint: "Ideal para receber salario e pagamentos recorrentes",
    },
  },
  "en-US": {
    primaryCtaLabel: "Create PayCripto",
    secondaryCtaLabel: "See how it works",
    heroLead: "Fast, simple, no banks. Get paid straight to your Base wallet.",
    heroSupport: "Non-custodial. No banks. You stay in control.",
    exampleLabel: "Real send example",
    flowLegend: "Simple flow to send and get paid: type the name -> enter amount -> confirm.",
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
      balanceLabel: "PayCripto balance",
      nextSendLabel: "Next send",
      nextSendMeta: "To Lucas - 0x98...2f",
      brandTitle: "Brand up front",
      brandDesc: "Interface tuned for clarity and zero distraction.",
      nameReadyTitle: "PayCripto ready",
      nameReadyDesc: "Your name visible in the experience",
      liveLabel: "Live",
      incomeHint: "Great for salary and recurring payments",
    },
  },
  "es-ES": {
    primaryCtaLabel: "Crear PayCripto",
    secondaryCtaLabel: "Ver como funciona",
    heroLead: "Rapido, simple y sin banco. Recibe pagos directo en tu billetera Base.",
    heroSupport: "Sin custodia. Sin banco. En tu control.",
    exampleLabel: "Ejemplo real de envio",
    flowLegend: "Flujo simple para enviar y cobrar: escribe el nombre -> pon el monto -> confirma.",
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
      balanceLabel: "Saldo PayCripto",
      nextSendLabel: "Proximo envio",
      nextSendMeta: "Para Lucas - 0x98...2f",
      brandTitle: "Marca visible",
      brandDesc: "Interfaz enfocada en claridad y cero distracciones.",
      nameReadyTitle: "PayCripto listo",
      nameReadyDesc: "Tu nombre visible en la experiencia",
      liveLabel: "En vivo",
      incomeHint: "Ideal para salario y pagos recurrentes",
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
  const [showGlobalExamples, setShowGlobalExamples] = useState(false);

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
                    <ShieldCheck size={16} className="text-primary" />
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
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{landingCopy.exampleLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-white/70">{landingCopy.heroCard.balanceLabel}</p>
                  <p className="mt-2 text-3xl font-bold text-white">USDT 1.240,50</p>
                  <p className="mt-1 text-xs text-primary/80">{landingCopy.heroCard.incomeHint}</p>
                </div>
                <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                  {landingCopy.heroCard.liveLabel}
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-white/60">{landingCopy.heroCard.nextSendLabel}</p>
                  <p className="mt-2 text-xl font-semibold text-white">0.25 ETH</p>
                  <p className="text-xs text-white/60">{landingCopy.heroCard.nextSendMeta}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-white/70">{landingCopy.heroCard.brandTitle}</p>
                  <p className="mt-2 text-lg font-semibold text-white">PayCripto</p>
                  <p className="text-xs text-white/60">{landingCopy.heroCard.brandDesc}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                    <Image
                      src="/logo-icon.png"
                      alt="PayCripto"
                      width={78}
                      height={72}
                      className="h-7 w-auto"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{landingCopy.heroCard.nameReadyTitle}</p>
                    <p className="text-xs text-white/60">{landingCopy.heroCard.nameReadyDesc}</p>
                  </div>
                </div>
                <ShieldCheck className="text-white/60" size={20} />
              </div>
              <p className="mt-4 text-xs text-white/70">{landingCopy.flowLegend}</p>
            </div>
          </div>
        </main>

        <div className="sm:hidden">
          <LocaleSwitchNotice className="w-full" />
        </div>

        <section
          id="como-funciona"
          className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-primary/10 md:grid-cols-[1fr_2fr]"
        >
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.14em] text-white/60">{landingCopy.stepsSection.tag}</p>
            <h2 className="text-2xl font-semibold text-white">{landingCopy.stepsSection.title}</h2>
            <p className="text-sm text-white/70">{landingCopy.stepsSection.helper}</p>
            <div className="flex items-center gap-2 text-sm text-primary">
              <ShieldCheck size={16} />
              <span>{landingCopy.stepsSection.badge}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.title}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:-translate-y-1 hover:border-white/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                  <step.icon size={18} />
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
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                  <card.icon size={18} />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-white">{card.title}</p>
                  <p className="text-sm text-white/70">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-white/15 bg-black/30 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <ShieldCheck size={18} />
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                    <BookOpen size={18} />
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
                      <span className="mt-[6px] inline-block h-2 w-2 rounded-full bg-primary/70" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <ArrowRight size={16} />
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
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-2 text-sm font-semibold text-primary">
              <ShieldCheck size={16} />
              <span>{landingCopy.trustBadge}</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.14em] text-white/60">{landingCopy.trustManifestoTitle}</p>
              <ul className="space-y-2 text-sm text-white/75">
                {landingCopy.trustReasons.map((reason) => (
                  <li key={reason} className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <ShieldCheck size={14} />
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
                      <ArrowRight size={14} className="mt-1 text-primary" />
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <feature.icon size={18} />
              </div>
              <div>
                <p className="text-base font-semibold text-white">{feature.title}</p>
                <p className="text-sm text-white/70">{feature.description}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

