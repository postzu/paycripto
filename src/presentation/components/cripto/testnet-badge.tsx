'use client';

import { AlertTriangle } from 'lucide-react';

/**
 * TestnetBadge Component
 * 
 * Single Responsibility: Display a visual indicator that the user is on testnet
 * Open/Closed: Extensible via className prop for custom styling
 * Liskov Substitution: Follows React component interface
 * Interface Segregation: Minimal props interface
 * Dependency Inversion: Depends on abstractions (React, lucide-react)
 */

interface TestnetBadgeProps {
    /** Optional additional CSS classes */
    className?: string;
}

export function TestnetBadge({ className = '' }: TestnetBadgeProps) {
    return (
        <div
            role="status"
            data-testid="testnet-badge"
            className={`
                fixed top-0 left-0 right-0 z-[100]
                bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500
                px-4 py-2
                flex items-center justify-center gap-2
                text-black font-bold text-sm
                shadow-lg shadow-orange-500/30
                ${className}
            `}
        >
            <AlertTriangle size={16} className="animate-pulse" />
            <span>TESTNET</span>
            <span className="text-xs font-normal opacity-75">
                — Tokens sem valor real
            </span>
            <AlertTriangle size={16} className="animate-pulse" />
        </div>
    );
}
