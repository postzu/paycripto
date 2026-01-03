'use client';

import { useCallback, useEffect, useState } from 'react';
import { Transfer } from '@/core/domain/entities/transfer.entity';
import { ListTransfersUseCase } from '@/core/use-cases/transfers/list-transfers.use-case';
import { transferRepository } from '@/infrastructure/supabase/transfer.repository';

interface UseTransferHistoryOptions {
    limit?: number;
    enabled?: boolean;
}

interface UseTransferHistoryResult {
    transfers: Transfer[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

// Create use case instance
const listTransfersUseCase = new ListTransfersUseCase(transferRepository);

/**
 * Hook for fetching and managing transfer history
 * @param userId - The wallet address of the user
 * @param options - Options for the hook
 */
export function useTransferHistory(
    userId: string | undefined,
    options: UseTransferHistoryOptions = {}
): UseTransferHistoryResult {
    const { limit = 50, enabled = true } = options;

    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchTransfers = useCallback(async () => {
        if (!userId || !enabled) {
            setTransfers([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await listTransfersUseCase.execute({
                userId: userId.toLowerCase(),
                limit,
            });
            setTransfers(result.transfers);
        } catch (err) {
            console.error('[useTransferHistory] Failed to fetch transfers:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch transfers'));
            // Keep previous transfers on error for better UX
        } finally {
            setIsLoading(false);
        }
    }, [userId, limit, enabled]);

    // Fetch on mount and when dependencies change
    useEffect(() => {
        fetchTransfers();
    }, [fetchTransfers]);

    return {
        transfers,
        isLoading,
        error,
        refetch: fetchTransfers,
    };
}
