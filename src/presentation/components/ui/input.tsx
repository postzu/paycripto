'use client';

import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, id, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1.5">
                {label && (
                    <label htmlFor={id} className="text-sm font-medium text-white/70">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={id}
                    className={cn(
                        'w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40',
                        'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
                        'transition-all duration-200',
                        error && 'border-error focus:ring-error/50',
                        className
                    )}
                    {...props}
                />
                {error && <span className="text-sm text-error">{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';
export { Input };
