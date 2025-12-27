import { isAddress } from 'viem';

export interface RecipientProps {
    id: string;
    name: string;
    address: string;
    userId: string;
}

export class Recipient {
    public id: string;
    public name: string;
    public address: string;
    public userId: string;

    constructor(props: RecipientProps) {
        this.validate(props);
        this.id = props.id;
        this.name = props.name;
        this.address = props.address;
        this.userId = props.userId;
    }

    private validate(props: RecipientProps) {
        if (!props.name || props.name.trim() === '') {
            throw new Error('Name is required');
        }

        // Simple check for now, can be improved with viem's isAddress for EVM
        if (!props.address.startsWith('0x') || props.address.length < 42) {
            throw new Error('Invalid address format');
        }
    }
}
