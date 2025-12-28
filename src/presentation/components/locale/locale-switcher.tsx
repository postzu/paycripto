'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Globe2, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/src/i18n/routing';

type LocaleKey = 'pt-BR' | 'en-US' | 'es-ES';

const LOCALES: LocaleKey[] = ['pt-BR', 'en-US', 'es-ES'];

const localeLabels: Record<LocaleKey, { label: string; short: string }> = {
    'pt-BR': { label: 'Portugues (Brasil)', short: 'pt-BR' },
    'en-US': { label: 'English (US)', short: 'en-US' },
    'es-ES': { label: 'Espanol', short: 'es-ES' }
};

function normalizeLocale(value?: string | null): LocaleKey | null {
    if (!value) return null;
    const lowered = value.toLowerCase();

    if (lowered.startsWith('pt')) return 'pt-BR';
    if (lowered.startsWith('en')) return 'en-US';
    if (lowered.startsWith('es')) return 'es-ES';

    return null;
}

interface LocaleSwitchNoticeProps {
    className?: string;
}

export function LocaleSwitchNotice({ className }: LocaleSwitchNoticeProps) {
    const t = useTranslations('Locale');
    const currentLocale = (useLocale() as LocaleKey) || 'pt-BR';
    const router = useRouter();
    const pathname = usePathname();

    const [browserLocale, setBrowserLocale] = useState<LocaleKey | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const detected = normalizeLocale(navigator.languages?.[0] ?? navigator.language);
        if (detected) setBrowserLocale(detected);
    }, []);

    const mismatchLocale =
        browserLocale && browserLocale !== currentLocale ? browserLocale : null;

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const activeLocaleLabel = localeLabels[currentLocale]?.label ?? currentLocale;

    const handleSelectLocale = (nextLocale: LocaleKey) => {
        if (nextLocale === currentLocale) {
            setIsModalOpen(false);
            return;
        }

        router.replace(pathname, { locale: nextLocale });
        setIsModalOpen(false);
    };

    return (
        <>
            <div
                className={`rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-2.5 shadow-sm backdrop-blur-sm ${className ?? ''
                    }`}
            >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/80">
                            <Globe2 size={18} />
                        </div>
                        <div className="leading-tight text-white/80">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">
                                {t('title')}
                            </p>
                            <p className="text-sm font-semibold">
                                {t('active', { label: activeLocaleLabel })}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={openModal}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/0 px-3 py-2 text-sm font-semibold text-white/80 transition hover:-translate-y-0.5 hover:border-white/30 hover:text-white"
                    >
                        {t('changeCta')}
                    </button>
                </div>

                {mismatchLocale && (
                    <div className="mt-3 flex flex-col gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-amber-50 sm:flex-row sm:items-center sm:gap-3">
                        <div className="flex items-center gap-2 text-amber-100">
                            <AlertTriangle size={16} />
                            <p className="text-xs sm:text-sm">
                                {t('browserMismatch', {
                                    browserLocale: localeLabels[mismatchLocale].label
                                })}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 sm:ml-auto">
                            <button
                                type="button"
                                onClick={() => handleSelectLocale(mismatchLocale)}
                                className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-50 transition hover:bg-amber-500/30"
                            >
                                {t('switch', {
                                    targetLocale: localeLabels[mismatchLocale].label
                                })}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-dark-surface/95 p-6 shadow-2xl">
                        <button
                            type="button"
                            className="absolute right-3 top-3 rounded-full p-2 text-white/70 transition hover:bg-white/10"
                            onClick={closeModal}
                            aria-label="Fechar"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                                <Globe2 size={18} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-white">{t('modalTitle')}</p>
                                <p className="text-xs text-white/60">{t('modalSubtitle')}</p>
                                <p className="text-xs text-white/60">
                                    {t('active', { label: activeLocaleLabel })}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-white/5 p-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/50">
                                    {t('selectLocale')}
                                </p>
                                <p className="text-[11px] text-white/60">{t('switchHint')}</p>
                            </div>
                            <div className="space-y-2">
                                {LOCALES.map((locale) => {
                                    const labels = localeLabels[locale];
                                    const isActive = locale === currentLocale;

                                    return (
                                        <button
                                            key={locale}
                                            type="button"
                                            onClick={() => handleSelectLocale(locale)}
                                            className={`w-full rounded-lg border px-3 py-3 text-left transition ${isActive
                                                ? 'border-emerald-300/40 bg-emerald-400/10 text-white shadow-sm'
                                                : 'border-white/10 text-white/80 hover:border-white/25 hover:text-white'
                                                }`}
                                            aria-current={isActive ? 'true' : undefined}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">{labels.label}</span>
                                                    <span className="text-[11px] uppercase text-white/50">
                                                        {labels.short}
                                                    </span>
                                                </div>
                                                {isActive && (
                                                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-200">
                                                        <Check size={14} />
                                                        {t('current')}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
