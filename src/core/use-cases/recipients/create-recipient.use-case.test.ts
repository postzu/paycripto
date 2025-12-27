import { describe, it, expect, vi } from 'vitest';
import { CreateRecipientUseCase } from './create-recipient.use-case';
import { RecipientRepository } from '../../domain/repositories/recipient.repository';
import { Recipient } from '../../domain/entities/recipient.entity';

// Mock Repository
class InMemoryRecipientRepository implements RecipientRepository {
    public items: Recipient[] = [];
    async save(recipient: Recipient): Promise<void> {
        this.items.push(recipient);
    }
    async findByUserId(userId: string): Promise<Recipient[]> {
        return this.items.filter(r => r.userId === userId);
    }
    async findById(id: string): Promise<Recipient | null> {
        return this.items.find(r => r.id === id) || null;
    }
}

describe('CreateRecipient UseCase', () => {
    it('should create a new recipient', async () => {
        const repository = new InMemoryRecipientRepository();
        const useCase = new CreateRecipientUseCase(repository);

        const input = {
            name: 'Jane Doe',
            address: '0x1234567890123456789012345678901234567890',
            userId: 'user-1'
        };

        const output = await useCase.execute(input);

        expect(output.id).toBeDefined();
        expect(output.name).toBe(input.name);
        expect(repository.items).toHaveLength(1);
    });
});
