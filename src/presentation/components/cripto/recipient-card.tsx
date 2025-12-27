'use client';

import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface RecipientCardProps {
    name: string;
    address: string;
    isSelected?: boolean;
    onClick?: () => void;
}

export function RecipientCard({ name, address, isSelected, onClick }: RecipientCardProps) {
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

    return (
        <button
            onClick={onClick}
            className={cn(
                'flex items-center gap-4 w-full p-4 rounded-xl transition-all duration-200',
                'hover:bg-white/5',
                isSelected && 'bg-primary/20 border border-primary'
            )}
        >
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                {initials || <User size={20} />}
            </div>

            {/* Info */}
            <div className="flex flex-col items-start">
                <span className="font-medium text-white">{name}</span>
                <span className="text-sm text-white/50">{shortAddress}</span>
            </div>
        </button>
    );
}
