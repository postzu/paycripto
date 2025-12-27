export interface RecipientAddress {
    id: string;
    address: string;
    label?: string;
}

export interface RecipientWithAddresses {
    id: string;
    name: string;
    addresses: RecipientAddress[];
}

export interface SelectedRecipient {
    contactId: string;
    name: string;
    address: string;
    addressId: string;
    label?: string;
}
