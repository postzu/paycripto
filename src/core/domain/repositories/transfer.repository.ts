import { Transfer } from '../entities/transfer.entity';

export interface TransferRepository {
    /**
     * Saves a new transfer to the database
     */
    save(transfer: Transfer): Promise<void>;

    /**
     * Finds all transfers for a given user (wallet address)
     * @param userId - The wallet address of the user
     * @param limit - Maximum number of transfers to return (default: 50)
     */
    findByUserId(userId: string, limit?: number): Promise<Transfer[]>;

    /**
     * Finds a transfer by its ID
     */
    findById(id: string): Promise<Transfer | null>;

    /**
     * Updates the status and optionally the txHash of a transfer
     */
    updateStatus(id: string, status: 'pending' | 'completed' | 'failed', txHash?: string): Promise<void>;
}
