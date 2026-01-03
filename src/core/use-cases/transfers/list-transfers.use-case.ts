import { Transfer } from '../../domain/entities/transfer.entity';
import { TransferRepository } from '../../domain/repositories/transfer.repository';

export interface ListTransfersInput {
    userId: string;
    limit?: number;
}

export interface ListTransfersOutput {
    transfers: Transfer[];
}

export class ListTransfersUseCase {
    constructor(private transferRepository: TransferRepository) { }

    async execute(input: ListTransfersInput): Promise<ListTransfersOutput> {
        const transfers = await this.transferRepository.findByUserId(
            input.userId,
            input.limit ?? 50
        );

        return { transfers };
    }
}
