import { Recipient } from '../entities/recipient.entity';

export interface RecipientRepository {
    save(recipient: Recipient): Promise<void>;
    findByUserId(userId: string): Promise<Recipient[]>;
    findById(id: string): Promise<Recipient | null>;
}
