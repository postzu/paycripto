import Link from "next/link";
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

const features = [
  {
    title: "Marca PayCripto",
    description: "Identidade clara e consistente em toda a experiência.",
    icon: CreditCard,
  },
  {
    title: "Envios instantâneos",
    description: "Transferências cripto com a sensação de um PIX.",
    icon: Zap,
  },
  {
    title: "Pronto para o mundo",
    description: "Interface bilíngue para quem paga em português ou inglês.",
    icon: Globe2,
  },
];

const steps = [
  {
    title: "Crie sua carteira",
    description: "Escolha uma carteira Web3 (ex.: MetaMask, Rabby) para guardar e assinar suas transações.",
    icon: Wallet,
  },
  {
    title: "Conecte ao PayCripto",
    description: "Conecte a carteira para ver saldo, nome PayCripto e liberar envios sem custódia.",
    icon: Link2,
  },
  {
    title: "Envie e receba",
    description: "Use seu nome PayCripto ou endereço para transferir com a experiência estilo PIX.",
    icon: ArrowLeftRight,
  },
];

const tutorials = [
  {
    id: "tutorial-carteira",
    title: "1 · Como criar uma carteira",
    description: "Instale a carteira, salve a frase-semente em local seguro e habilite a rede suportada.",
    bullets: [
      "Instale a extensão/app oficial (MetaMask, Rabby ou outra de confiança).",
      "Anote a seed phrase offline; nunca compartilhe.",
      "Adicione a rede usada na PayCripto e confira o saldo.",
    ],
  },
  {
    id: "tutorial-conexao",
    title: "2 · Conectar ao app",
    description: "Abra o PayCripto, clique em conectar e aceite no pop-up da sua carteira.",
    bullets: [
      "Com a carteira destravada, clique em “Conectar carteira”.",
      "Escolha a conta correta antes de autorizar.",
      "Aguarde o status “conectado” para ver saldo e nome.",
    ],
  },
  {
    id: "tutorial-envio",
    title: "3 · Enviar e receber",
    description: "Preencha o destinatário, revise taxas e assine. Recebimentos chegam direto na sua carteira.",
    bullets: [
      "Digite o nome PayCripto ou endereço cripto do destinatário.",
      "Revise rede, taxa e valor antes de assinar.",
      "Pronto: acompanhe o status e compartilhe o recibo.",
    ],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1f] via-[#0d1530] to-black text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-14">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-lg font-bold text-white">
              PC
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">PayCripto</p>
              <p className="text-sm text-white/80">Cripto simples como PIX</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/pt-BR/cripto"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-white/90"
            >
              Abrir PayCripto
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/en-US/cripto"
              className="hidden rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/30 sm:inline-flex"
            >
              Try in English
            </Link>
          </div>
        </header>

        <main className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/70">
              PayCripto
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                Envie e receba cripto com a identidade PayCripto.
              </h1>
              <p className="max-w-xl text-lg text-white/70">
                Para usar, você precisa de uma carteira cripto. Crie a carteira, conecte ao PayCripto e faça envios
                e recebimentos com a mesma fluidez do PIX, só que na Web3.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/pt-BR/cripto"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:bg-primary-hover"
              >
                Começar agora
                <Send size={16} />
              </Link>
              <Link
                href="#como-funciona"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/30"
              >
                Ver passo a passo
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/en-US/cripto"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/30"
              >
                Ver versão em inglês
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm text-white/70 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-white/50">Marca</p>
                <p className="mt-2 text-lg font-semibold text-white">PayCripto</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-white/50">Experiência</p>
                <p className="mt-2 text-lg font-semibold text-white">UX estilo PIX</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-white/50">Idiomas</p>
                <p className="mt-2 text-lg font-semibold text-white">pt-BR & en-US</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-10 -right-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-secondary/20 blur-3xl" />
            <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-primary/30 via-primary/15 to-secondary/25 p-8 shadow-2xl shadow-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-white/70">Saldo PayCripto</p>
                  <p className="mt-2 text-3xl font-bold text-white">USDT 1.240,50</p>
                </div>
                <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">Live</div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-white/60">Próximo envio</p>
                  <p className="mt-2 text-xl font-semibold text-white">0.25 ETH</p>
                  <p className="text-xs text-white/60">Para Lucas · 0x98...2f</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-white/70">Marca à vista</p>
                  <p className="mt-2 text-lg font-semibold text-white">PayCripto</p>
                  <p className="text-xs text-white/60">Interface escura exclusiva</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/25 text-sm font-semibold text-white">
                    PC
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">PayCripto pronto</p>
                    <p className="text-xs text-white/60">Seu nome visível na experiência</p>
                  </div>
                </div>
                <ShieldCheck className="text-white/60" size={20} />
              </div>
            </div>
          </div>
        </main>

        <section
          id="como-funciona"
          className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-primary/10 md:grid-cols-[1fr_2fr]"
        >
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.14em] text-white/60">Passo a passo</p>
            <h2 className="text-2xl font-semibold text-white">Crie a carteira, conecte e transacione</h2>
            <p className="text-sm text-white/70">
              PayCripto não guarda seus fundos. Você controla a carteira, conecta quando quiser e envia ou recebe
              com a mesma simplicidade do PIX.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary">
              <ShieldCheck size={16} />
              <span>Sem custódia: chaves e seed sempre com você.</span>
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

        <section id="tutoriais" className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-white/60">Tutoriais rápidos</p>
              <h3 className="text-xl font-semibold text-white">Guia prático para sair do zero</h3>
              <p className="text-sm text-white/70">
                Do setup da carteira até o primeiro envio, sem depender de suporte.
              </p>
            </div>
            <Link
              href="#como-funciona"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/30"
            >
              Voltar para o passo a passo
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
                  <span className="text-xs uppercase tracking-[0.14em] text-white/60">Tutorial</span>
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
                  <span>Seguir este passo</span>
                </div>
              </div>
            ))}
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
