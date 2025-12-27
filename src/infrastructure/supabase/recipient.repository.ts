import { RecipientRepository } from '../../core/domain/repositories/recipient.repository';
import { Recipient, RecipientProps } from '../../core/domain/entities/recipient.entity';
import { supabase } from './client';

interface RecipientRow {
    id: string;
    user_id: string;
    name: string;
    address: string;
    created_at: string;
}

export class SupabaseRecipientRepository implements RecipientRepository {
    async save(recipient: Recipient): Promise<void> {
        const { error } = await supabase.from('recipients').insert({
            id: recipient.id,
            user_id: recipient.userId,
            name: recipient.name,
            address: recipient.address,
        });

        if (error) {
            throw new Error(`Failed to save recipient: ${error.message}`);
        }
    }

    async findByUserId(userId: string): Promise<Recipient[]> {
        const { data, error } = await supabase
            .from('recipients')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch recipients: ${error.message}`);
        }

        return (data as RecipientRow[]).map(
            (row) =>
                new Recipient({
                    id: row.id,
                    userId: row.user_id,
                    name: row.name,
                    address: row.address,
                })
        );
    }

    async findById(id: string): Promise<Recipient | null> {
        const { data, error } = await supabase
            .from('recipients')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return null;
        }

        const row = data as RecipientRow;
        return new Recipient({
            id: row.id,
            userId: row.user_id,
            name: row.name,
            address: row.address,
        });
    }
}
