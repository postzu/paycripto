import { Transfer } from '../../domain/entities/transfer.entity';
import { TransferRepository } from '../../domain/repositories/transfer.repository';
import { fetchAssetPrice } from '@/lib/currency';

export interface CreateTransferInput {
    userId: string;           // sender wallet address
    recipientId?: string;     // FK to recipients table (optional)
    recipientAddress: string;
    recipientName?: string;
    token: string;            // 'USDC' | 'ETH'
    amount: string;
    chainId: number;
    feeEstimate?: string;
    txHash?: string;
    fiatCurrency?: string;    // 'BRL' | 'USD' - for fetching rate
}

export interface CreateTransferOutput {
    transfer: Transfer;
}

export class CreateTransferUseCase {
    constructor(private transferRepository: TransferRepository) { }

    async execute(input: CreateTransferInput): Promise<CreateTransferOutput> {
        // Fetch current fiat rate for the token
        let fiatRate: number | undefined;
        if (input.fiatCurrency) {
            try {
                fiatRate = await fetchAssetPrice(input.token, input.fiatCurrency);
            } catch (error) {
                console.warn('[CreateTransferUseCase] Failed to fetch fiat rate:', error);
                // Continue without fiat rate
            }
        }

        const transfer = new Transfer({
            id: crypto.randomUUID(),
            userId: input.userId,
            recipientId: input.recipientId,
            recipientAddress: input.recipientAddress,
            recipientName: input.recipientName,
            token: input.token,
            amount: input.amount,
            chainId: input.chainId,
            feeEstimate: input.feeEstimate,
            txHash: input.txHash,
            status: input.txHash ? 'completed' : 'pending',
            fiatRate,
            fiatCurrency: input.fiatCurrency,
            createdAt: new Date(),
        });

        await this.transferRepository.save(transfer);

        return { transfer };
    }
}
