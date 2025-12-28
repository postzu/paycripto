'use client';

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
};

type RegionalEquivalent = {
  code: RegionCode;
  region: string;
  items: string[];
  summary: string;
};

const PIX_COPY: Record<LocaleKey, PixCopy> = {
  "pt-BR": {
    heroTitle: "Envie e receba cripto como voce ja usa o PIX.",
    badge: "",
    experience: "Rapido, simples e sem dor de cabeca.",
    flow: "Use seu nome PayCripto ou endereco com um fluxo instantaneo, estilo PIX.",
    uxLabel: "Experiencia estilo PIX",
    explainer:
      "Sem custodia. Suas chaves, seus fundos. Conecte a carteira, confirme e envie/receba como no PIX.",
    instantTitle: "Envios instantaneos",
    languageDescription: "Interface trilingue para quem paga em portugues, ingles ou espanhol.",
    regionHeading: "Como explicamos PIX no seu pais",
    regionSubtitle: "Detectamos sua regiao e mostramos o equivalente local. Compare outros se quiser.",
    viewAllLabel: "Ver outros paises",
    hideAllLabel: "Fechar outros paises",
    localBadge: "Como funciona onde voce mora",
    otherBadge: "Outro pais",
    detectedLabel: "Mostrando o equivalente da sua regiao",
  },
  "en-US": {
    heroTitle: "Send and receive crypto the way you already use your instant rail.",
    badge: "",
    experience: "Fast, simple, zero mental load.",
    flow: "Use your PayCripto name or address with an instant flow like your bank rail.",
    uxLabel: "Local-rail UX tuned to your region",
    explainer:
      "No custody. Your keys, your funds. Connect and move value with the instant flow you already know (Zelle, SEPA Instant, UPI...).",
    instantTitle: "Instant transfers",
    languageDescription: "Trilingual interface for payers in Portuguese, English, or Spanish.",
    regionHeading: "Your local instant rail explained",
    regionSubtitle:
      "We detect your region and show the closest equivalent (Zelle, SEPA Instant, UPI...). Open the others if you want to compare.",
    viewAllLabel: "See other countries",
    hideAllLabel: "Hide other countries",
    localBadge: "How it works where you live",
    otherBadge: "Other country",
    detectedLabel: "Showing the closest rail for you",
  },
  "es-ES": {
    heroTitle: "Envia y recibe cripto como ya usas tu pago instantaneo.",
    badge: "",
    experience: "Rapido, simple y sin friccion.",
    flow: "Usa tu nombre PayCripto o direccion con un flujo instantaneo, estilo PIX.",
    uxLabel: "Experiencia estilo rail local",
    explainer:
      "Sin custodia. Tus llaves, tus fondos. Conecta la billetera y mueve valor con el flujo instantaneo que ya conoces (Zelle, SEPA Instant, UPI...).",
    instantTitle: "Envios instantaneos",
    languageDescription: "Interfaz trilingue para quien paga en portugues, ingles o espanol.",
    regionHeading: "Tu rail instantaneo local explicado",
    regionSubtitle:
      "Detectamos tu region y mostramos el equivalente mas cercano (Zelle, SEPA Instant, UPI...). Abre los demas si quieres comparar.",
    viewAllLabel: "Ver otros paises",
    hideAllLabel: "Cerrar otros paises",
    localBadge: "Como funciona donde vives",
    otherBadge: "Otro pais",
    detectedLabel: "Mostrando el rail mas cercano para ti",
  },
};

const REGIONAL_EQUIVALENTS: Record<LocaleKey, RegionalEquivalent[]> = {
  "pt-BR": [
    {
      code: "br",
      region: "Brasil",
      items: ["PIX", "Transferencia instantanea banco a banco", "Disponivel 24/7 nos apps dos bancos"],
      summary:
        "Voce ja usa PIX: transferencia instantanea entre contas bancarias, todos os dias. Fora do Brasil, mostramos o equivalente local.",
    },
    {
      code: "us",
      region: "Estados Unidos",
      items: ["Zelle", "Venmo (modelo mental mais proximo)", "Cash App"],
      summary: "PIX e como o Zelle: transferencia instantanea entre bancos, 24/7. (Veja outros equivalentes no mundo).",
    },
    {
      code: "eu",
      region: "Europa",
      items: ["SEPA Instant"],
      summary: "PIX e como SEPA Instant: cai na hora, qualquer dia.",
    },
    {
      code: "gb",
      region: "Reino Unido",
      items: ["Faster Payments"],
      summary: "No Reino Unido, PIX equivale ao Faster Payments.",
    },
    {
      code: "in",
      region: "India",
      items: ["UPI (Google Pay / PhonePe)"],
      summary: "Na India, PIX funciona como o UPI.",
    },
    {
      code: "sg",
      region: "Sudeste Asiatico / Singapura",
      items: ["PayNow"],
      summary: "Em Singapura, o paralelo e PayNow.",
    },
  ],
  "en-US": [
    {
      code: "us",
      region: "United States",
      items: ["Zelle", "Venmo (closest mental model)", "Cash App"],
      summary: "Closest match: Zelle - instant bank-to-bank transfers, 24/7. (PIX is the Brazilian version.)",
    },
    {
      code: "eu",
      region: "Europe",
      items: ["SEPA Instant"],
      summary: "Closest match: SEPA Instant - hits the account immediately, any day. (In Brazil this is PIX.)",
    },
    {
      code: "gb",
      region: "United Kingdom",
      items: ["Faster Payments"],
      summary: "Closest match: Faster Payments - the UK's instant bank rail. (Brazil uses PIX.)",
    },
    {
      code: "in",
      region: "India",
      items: ["UPI (Google Pay / PhonePe)"],
      summary: "Closest match: UPI (Google Pay / PhonePe) - real-time transfers, 24/7. (PIX is Brazil's version.)",
    },
    {
      code: "sg",
      region: "Southeast Asia / Singapore",
      items: ["PayNow"],
      summary: "Closest match: PayNow - Singapore's instant rail. (PIX is the Brazilian equivalent.)",
    },
    {
      code: "br",
      region: "Brazil",
      items: ["PIX"],
      summary: "In Brazil, you already have PIX. We mirror that experience for people abroad.",
    },
  ],
  "es-ES": [
    {
      code: "us",
      region: "Estados Unidos",
      items: ["Zelle", "Venmo (modelo mental cercano)", "Cash App"],
      summary: "PIX funciona como Zelle: transferencia banco a banco al instante, 24/7. (Ve otros equivalentes en el mundo).",
    },
    {
      code: "eu",
      region: "Europa",
      items: ["SEPA Instant"],
      summary: "PIX es como SEPA Instant: llega al momento, cualquier dia.",
    },
    {
      code: "gb",
      region: "Reino Unido",
      items: ["Faster Payments"],
      summary: "En el Reino Unido, PIX se parece a Faster Payments.",
    },
    {
      code: "in",
      region: "India",
      items: ["UPI (Google Pay / PhonePe)"],
      summary: "En India, PIX equivale a UPI.",
    },
    {
      code: "sg",
      region: "Sudeste Asiatico / Singapur",
      items: ["PayNow"],
      summary: "En Singapur, el paralelo es PayNow.",
    },
    {
      code: "br",
      region: "Brasil",
      items: ["PIX"],
      summary: "En Brasil ya usas PIX. Replicamos esa experiencia para otros paises.",
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

type LandingCopy = {
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  heroLead: string;
  heroSupport: string;
  exampleLabel: string;
  flowLegend: string;
  guideSubtitle: string;
  trustTitle: string;
  trustReasons: string[];
  faqTitle: string;
  faqQuestions: string[];
  tutorialsLabel: string;
  guideTitle: string;
  tutorialBackCta: string;
  stats: {
    brand: string;
    experience: string;
    languages: string;
    languagesValue: string;
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
  };
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
    heroLead: "Rapido, simples e sem dor de cabeca. Envie como usa o PIX.",
    heroSupport: "Sem custodia - suas chaves, seus fundos.",
    exampleLabel: "Exemplo real de envio",
    flowLegend: "Fluxo simples: digita o nome -> insere valor -> confirma.",
    guideSubtitle: "Comece agora, mesmo sem saber nada de cripto.",
    trustTitle: "Por que confiar?",
    trustReasons: ["Auditoria", "Codigo aberto (se for)", "Roadmap simples"],
    faqTitle: "Perguntas rapidas",
    faqQuestions: ["Posso perder meus fundos?", "Tem taxa?", "Funciona fora do Brasil?"],
    tutorialsLabel: "Tutoriais rapidos",
    guideTitle: "Guia pratico para sair do zero",
    tutorialBackCta: "Voltar para o passo a passo",
    stats: {
      brand: "Marca",
      experience: "Experiencia",
      languages: "Idiomas",
      languagesValue: "pt-BR, en-US e es-ES",
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
    regionLabel: "PIX pelo mundo",
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
    },
  },
  "en-US": {
    primaryCtaLabel: "Create PayCripto",
    secondaryCtaLabel: "See how it works",
    heroLead: "Fast, simple, headache-free. Send like your local instant rail.",
    heroSupport: "Non-custodial - your keys, your funds.",
    exampleLabel: "Real send example",
    flowLegend: "Simple flow: type the name -> enter amount -> confirm.",
    guideSubtitle: "Start now, even if you're new to crypto.",
    trustTitle: "Why trust PayCripto?",
    trustReasons: ["Audit", "Open source (if applicable)", "Simple roadmap"],
    faqTitle: "Quick questions",
    faqQuestions: ["Can I lose my funds?", "Are there fees?", "Does it work outside Brazil?"],
    tutorialsLabel: "Quick tutorials",
    guideTitle: "Practical guide to get started",
    tutorialBackCta: "Back to how it works",
    stats: {
      brand: "Brand",
      experience: "Experience",
      languages: "Languages",
      languagesValue: "pt-BR, en-US and es-ES",
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
    regionLabel: "PIX worldwide",
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
    },
  },
  "es-ES": {
    primaryCtaLabel: "Crear PayCripto",
    secondaryCtaLabel: "Ver como funciona",
    heroLead: "Rapido, simple y sin friccion. Envia como usas tu rail instantaneo.",
    heroSupport: "Sin custodia: tus llaves, tus fondos.",
    exampleLabel: "Ejemplo real de envio",
    flowLegend: "Flujo simple: escribe el nombre -> pon el monto -> confirma.",
    guideSubtitle: "Empieza ahora, incluso si eres nuevo en cripto.",
    trustTitle: "Por que confiar?",
    trustReasons: ["Auditoria", "Codigo abierto (si aplica)", "Roadmap simple"],
    faqTitle: "Preguntas rapidas",
    faqQuestions: ["Puedo perder mis fondos?", "Hay tarifas?", "Funciona fuera de Brasil?"],
    tutorialsLabel: "Tutoriales rapidos",
    guideTitle: "Guia practica para empezar",
    tutorialBackCta: "Volver al paso a paso",
    stats: {
      brand: "Marca",
      experience: "Experiencia",
      languages: "Idiomas",
      languagesValue: "pt-BR, en-US y es-ES",
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
    regionLabel: "PIX por el mundo",
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
    },
  },
};

function detectRegionFromNavigator(selectedLocale: LocaleKey): RegionCode | null {
  if (typeof window === "undefined") return null;
  const locales = navigator.languages?.length ? navigator.languages : [navigator.language];

  for (const raw of locales) {
    const locale = raw?.toLowerCase();
    if (!locale) continue;

    // Honor the language the user selected: if they chose English, don't force Brazil/PIX.
    if (locale.startsWith("pt-br")) return selectedLocale === "pt-BR" ? "br" : null;
    if (locale.startsWith("en-us")) return "us";
    if (locale.startsWith("en-gb") || locale.startsWith("en-uk")) return "gb";
    if (locale.startsWith("hi") || locale.startsWith("en-in")) return "in";
    if (locale.startsWith("en-sg") || locale.startsWith("ms") || locale.startsWith("id")) return "sg";
    if (
      locale.startsWith("de") ||
      locale.startsWith("fr") ||
      locale.startsWith("es") ||
      locale.startsWith("it") ||
      locale.startsWith("pt-pt") ||
      locale.startsWith("nl")
    )
      return "eu";
  }

  return null;
}

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
  const steps = landingCopy.stepsSection.steps;
  const openAppCta = locale === "en-US" ? "Open PayCripto" : "Abrir PayCripto";
  const defaultRegion: RegionCode = locale === "pt-BR" ? "br" : locale === "en-US" ? "us" : "eu";
  const [preferredRegion, setPreferredRegion] = useState<RegionCode>(defaultRegion);
  const [showAllRegions, setShowAllRegions] = useState(false);

  useEffect(() => {
    const detected = detectRegionFromNavigator(locale);
    if (detected) {
      setPreferredRegion(detected);
    } else {
      setPreferredRegion(defaultRegion);
    }
  }, [defaultRegion, locale]);

  const primaryEquivalent = useMemo(
    () => equivalents.find((equivalent) => equivalent.code === preferredRegion) ?? equivalents[0],
    [equivalents, preferredRegion]
  );

  const otherEquivalents = useMemo(
    () => equivalents.filter((equivalent) => equivalent.code !== primaryEquivalent?.code),
    [equivalents, primaryEquivalent?.code]
  );

  const visibleEquivalents = useMemo(() => {
    if (!primaryEquivalent) return [];
    return showAllRegions ? [primaryEquivalent, ...otherEquivalents] : [primaryEquivalent];
  }, [primaryEquivalent, otherEquivalents, showAllRegions]);

  const hasMoreRegions = otherEquivalents.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1f] via-[#0d1530] to-black text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-6 py-14 md:gap-16">
        <header className="flex items-center justify-between">
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
          <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
            <LocaleSwitchNotice className="w-full sm:w-auto" />
            <Link
              href={appPath}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-white/90"
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
            <div className="grid grid-cols-1 gap-3 text-sm text-white/70 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-white/50">{landingCopy.stats.brand}</p>
                <p className="mt-2 text-lg font-semibold text-white">PayCripto</p>
              </div>
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

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-primary/10">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-white/80">
                  <Globe2 size={14} />
                  <span>{landingCopy.regionDetectedLabel.replace("{region}", primaryEquivalent?.region ?? "")}</span>
                </span>
                <span className="rounded-full bg-primary/15 px-3 py-1 text-[11px] font-semibold text-primary">
                  {pixCopy.detectedLabel}
                </span>
              </div>
              <p className="text-xs uppercase tracking-[0.14em] text-white/60">
                {landingCopy.regionLabel}
              </p>
              <h3 className="text-xl font-semibold text-white">{pixCopy.regionHeading}</h3>
              <p className="text-sm text-white/70">{pixCopy.regionSubtitle}</p>
            </div>
            {hasMoreRegions && (
              <button
                type="button"
                onClick={() => setShowAllRegions((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/30"
              >
                {showAllRegions ? pixCopy.hideAllLabel : pixCopy.viewAllLabel}
                <ArrowRight size={16} className={showAllRegions ? "rotate-45 transition" : "transition"} />
              </button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {visibleEquivalents.map((equivalent) => {
              const isPrimary = equivalent.code === primaryEquivalent?.code;
              return (
                <div
                  key={equivalent.region}
                  className={`flex flex-col gap-3 rounded-2xl border p-4 transition hover:-translate-y-1 ${
                    isPrimary
                      ? "border-white/20 bg-white/10 shadow-lg shadow-primary/15"
                      : "border-white/10 bg-black/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-[0.14em] text-white/50">{equivalent.code}</span>
                      <p className="text-sm font-semibold text-white">{equivalent.region}</p>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-[11px] ${
                        isPrimary ? "bg-primary/25 text-white" : "bg-white/10 text-white/70"
                      }`}
                    >
                      {isPrimary ? pixCopy.localBadge : pixCopy.otherBadge}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-white/75">
                    {equivalent.items.map((item) => (
                      <div key={item} className="flex items-start gap-2">
                        <span className="mt-[6px] inline-block h-1.5 w-1.5 rounded-full bg-primary/70" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                    {equivalent.summary}
                  </div>
                </div>
              );
            })}
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
              <p className="text-sm text-white/70">{landingCopy.heroSupport}</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-2 text-sm font-semibold text-primary">
              <ShieldCheck size={16} />
              <span>{landingCopy.heroSupport}</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-white">{landingCopy.trustTitle}</h4>
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
                {landingCopy.faqQuestions.map((question) => (
                  <li key={question} className="flex items-center gap-2">
                    <ArrowRight size={14} className="text-primary" />
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

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
