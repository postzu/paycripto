'use client';

import { useCallback, useState } from 'react';
import { Transfer } from '@/core/domain/entities/transfer.entity';
import { CreateTransferUseCase, CreateTransferInput } from '@/core/use-cases/transfers/create-transfer.use-case';
import { transferRepository } from '@/infrastructure/supabase/transfer.repository';

interface UseCreateTransferResult {
    createTransfer: (input: CreateTransferInput) => Promise<Transfer | null>;
    isCreating: boolean;
    error: Error | null;
    lastTransfer: Transfer | null;
    clearError: () => void;
}

// Create use case instance
const createTransferUseCase = new CreateTransferUseCase(transferRepository);

/**
 * Hook for creating transfer records in Supabase
 */
export function useCreateTransfer(): UseCreateTransferResult {
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [lastTransfer, setLastTransfer] = useState<Transfer | null>(null);

    const createTransfer = useCallback(async (input: CreateTransferInput): Promise<Transfer | null> => {
        setIsCreating(true);
        setError(null);

        try {
            const result = await createTransferUseCase.execute(input);
            setLastTransfer(result.transfer);
            return result.transfer;
        } catch (err) {
            console.error('[useCreateTransfer] Failed to create transfer:', err);
            const error = err instanceof Error ? err : new Error('Failed to save transfer');
            setError(error);
            return null;
        } finally {
            setIsCreating(false);
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        createTransfer,
        isCreating,
        error,
        lastTransfer,
        clearError,
    };
}
