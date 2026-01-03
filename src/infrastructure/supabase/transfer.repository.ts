import { TransferRepository } from '../../core/domain/repositories/transfer.repository';
import { Transfer, TransferProps, TransferStatus } from '../../core/domain/entities/transfer.entity';
import { supabase } from './client';

interface TransferRow {
    id: string;
    user_id: string;
    recipient_id: string | null;
    recipient_address: string;
    recipient_name: string | null;
    token: string;
    amount: string;
    chain_id: number;
    fee_estimate: string | null;
    tx_hash: string | null;
    status: string;
    fiat_rate: number | null;
    fiat_currency: string | null;
    created_at: string;
}

function rowToTransfer(row: TransferRow): Transfer {
    return new Transfer({
        id: row.id,
        userId: row.user_id,
        recipientId: row.recipient_id ?? undefined,
        recipientAddress: row.recipient_address,
        recipientName: row.recipient_name ?? undefined,
        token: row.token,
        amount: row.amount,
        chainId: row.chain_id,
        feeEstimate: row.fee_estimate ?? undefined,
        txHash: row.tx_hash ?? undefined,
        status: row.status as TransferStatus,
        fiatRate: row.fiat_rate ?? undefined,
        fiatCurrency: row.fiat_currency ?? undefined,
        createdAt: new Date(row.created_at),
    });
}

export class SupabaseTransferRepository implements TransferRepository {
    async save(transfer: Transfer): Promise<void> {
        const { error } = await supabase.from('transfers').insert({
            id: transfer.id,
            user_id: transfer.userId,
            recipient_id: transfer.recipientId ?? null,
            recipient_address: transfer.recipientAddress,
            recipient_name: transfer.recipientName ?? null,
            token: transfer.token,
            amount: transfer.amount,
            chain_id: transfer.chainId,
            fee_estimate: transfer.feeEstimate ?? null,
            tx_hash: transfer.txHash ?? null,
            status: transfer.status,
            fiat_rate: transfer.fiatRate ?? null,
            fiat_currency: transfer.fiatCurrency ?? null,
        });

        if (error) {
            throw new Error(`Failed to save transfer: ${error.message}`);
        }
    }

    async findByUserId(userId: string, limit: number = 50): Promise<Transfer[]> {
        const { data, error } = await supabase
            .from('transfers')
            .select('*')
            .eq('user_id', userId.toLowerCase())
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            throw new Error(`Failed to fetch transfers: ${error.message}`);
        }

        return (data as TransferRow[]).map(rowToTransfer);
    }

    async findById(id: string): Promise<Transfer | null> {
        const { data, error } = await supabase
            .from('transfers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null; // Not found
            }
            throw new Error(`Failed to fetch transfer: ${error.message}`);
        }

        return rowToTransfer(data as TransferRow);
    }

    async updateStatus(id: string, status: 'pending' | 'completed' | 'failed', txHash?: string): Promise<void> {
        const updateData: Record<string, unknown> = { status };
        if (txHash) {
            updateData.tx_hash = txHash;
        }

        const { error } = await supabase
            .from('transfers')
            .update(updateData)
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to update transfer status: ${error.message}`);
        }
    }
}

// Singleton instance for use in hooks and components
export const transferRepository = new SupabaseTransferRepository();
