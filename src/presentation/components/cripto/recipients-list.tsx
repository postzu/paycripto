'use client';

import { useMemo, useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Search, Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { RecipientWithAddresses, SelectedRecipient } from './types';

interface RecipientsListProps {
    recipients: RecipientWithAddresses[];
    onSelect: (recipient: SelectedRecipient) => void;
    onAddNew: (contactId?: string) => void;
}

const shortenAddress = (address: string) => (address.length <= 10 ? address : `${address.slice(0, 6)}...${address.slice(-4)}`);

export function RecipientsList({ recipients, onSelect, onAddNew }: RecipientsListProps) {
    const t = useTranslations('Recipients');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<{ contactId: string; addressId: string } | null>(null);

    const filteredRecipients = useMemo(() => {
        const term = search.toLowerCase();
        return recipients.filter((recipient) => {
            const matchesName = recipient.name.toLowerCase().includes(term);
            const matchesAddress = recipient.addresses.some((address) =>
                address.address.toLowerCase().includes(term)
            );

            return matchesName || matchesAddress;
        });
    }, [recipients, search]);

    const handleSelectAddress = (recipient: RecipientWithAddresses, addressId: string) => {
        const address = recipient.addresses.find((item) => item.id === addressId);
        if (!address) return;

        setSelected({ contactId: recipient.id, addressId });
        onSelect({
            contactId: recipient.id,
            name: recipient.name,
            address: address.address,
            addressId: address.id,
            label: address.label,
        });
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">{t('selectRecipient')}</h2>
                <Button variant="ghost" size="sm" onClick={() => onAddNew()}>
                    <Plus size={18} className="mr-1" />
                    {t('new')}
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {search && (
                    <button
                        onClick={() => setSearch('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Frequent Contacts */}
            <div>
                <h3 className="text-sm font-medium text-white/50 mb-3">{t('frequentContacts')}</h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {recipients.slice(0, 5).map((recipient) => (
                        <button
                            key={recipient.id}
                            onClick={() => handleSelectAddress(recipient, recipient.addresses[0]?.id || '')}
                            className={cn(
                                'flex flex-col items-center gap-2 p-3 rounded-xl transition-all min-w-[80px]',
                                selected?.contactId === recipient.id ? 'bg-primary/20' : 'hover:bg-white/5'
                            )}
                            disabled={!recipient.addresses.length}
                        >
                            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-lg">
                                {recipient.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join('')
                                    .toUpperCase()}
                            </div>
                            <span className="text-xs text-white/70 truncate max-w-[70px]">
                                {recipient.name.split(' ')[0]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Full List */}
            <Card className="divide-y divide-white/10">
                <h3 className="text-sm font-medium text-white/50 px-4 py-3">{t('allContacts')}</h3>
                {filteredRecipients.length === 0 ? (
                    <div className="p-8 text-center text-white/50">
                        {t('noRecipients')}
                    </div>
                ) : (
                    filteredRecipients.map((recipient) => (
                        <div key={recipient.id} className="p-4 space-y-3 hover:bg-white/5 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                                        {recipient.name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .slice(0, 2)
                                            .join('')
                                            .toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{recipient.name}</p>
                                        <p className="text-xs text-white/50">
                                            {t('fields.addressCount', { count: recipient.addresses.length })}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => onAddNew(recipient.id)}>
                                    <Plus size={16} className="mr-1" />
                                    {t('addAddress')}
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {recipient.addresses.map((address) => {
                                    const isSelected =
                                        selected?.contactId === recipient.id && selected?.addressId === address.id;

                                    return (
                                        <button
                                            key={address.id}
                                            onClick={() => handleSelectAddress(recipient, address.id)}
                                            className={cn(
                                                'px-3 py-2 rounded-lg border text-left transition-all',
                                                'bg-white/5 border-white/5 hover:bg-white/10',
                                                isSelected && 'border-primary bg-primary/10'
                                            )}
                                        >
                                            <p className="text-xs text-white/50">
                                                {address.label || t('addressLabel')}
                                            </p>
                                            <p className="text-sm font-medium text-white">
                                                {shortenAddress(address.address)}
                                            </p>
                                        </button>
                                    );
                                })}
                                {recipient.addresses.length === 0 && (
                                    <p className="text-sm text-white/50">{t('noRecipients')}</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </Card>
        </div>
    );
}
