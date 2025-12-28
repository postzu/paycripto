import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Inter } from "next/font/google"; // Keep Inter
import "./globals.css";
import { Web3Provider } from "@/presentation/providers/web3-provider";
import { notFound } from 'next/navigation';
import { routing } from '@/src/i18n/routing';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PayCripto - TransferǦncias cripto simples",
  description: "Envie cripto como se fosse PIX. Simples, rǭpido e seguro.",
  icons: {
    icon: "/logo-icon.png",
    shortcut: "/logo-icon.png",
    apple: "/logo-icon.png",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  // In Next 15/16 App Router, `params` can be a Promise in layouts.
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  setRequestLocale(locale);

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <Web3Provider>
            {children}
          </Web3Provider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
