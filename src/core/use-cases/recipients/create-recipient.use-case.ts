import { Recipient } from '../../domain/entities/recipient.entity';
import { RecipientRepository } from '../../domain/repositories/recipient.repository';

interface InputDto {
    name: string;
    address: string;
    userId: string;
}

export class CreateRecipientUseCase {
    constructor(private recipientRepository: RecipientRepository) { }

    async execute(input: InputDto): Promise<Recipient> {
        const recipient = new Recipient({
            id: crypto.randomUUID(), // Assuming crypto global is available or polyfilled, else use uuid lib
            name: input.name,
            address: input.address,
            userId: input.userId
        });

        await this.recipientRepository.save(recipient);
        return recipient;
    }
}
