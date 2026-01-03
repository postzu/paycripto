import { isAddress, getAddress } from 'viem';

export type TransferStatus = 'pending' | 'completed' | 'failed';

export interface TransferProps {
    id: string;
    userId: string;           // wallet address do sender
    recipientId?: string;     // FK para recipients (opcional)
    recipientAddress: string; // endereço do destinatário
    recipientName?: string;   // nome do destinatário (para exibição)
    token: string;            // 'USDC' | 'ETH'
    amount: string;           // valor em formato string (preserva precisão)
    chainId: number;          // ID da chain (8453 = Base)
    feeEstimate?: string;     // taxa estimada em USD
    txHash?: string;          // hash da transação
    status: TransferStatus;
    fiatRate?: number;        // cotação no momento da transação
    fiatCurrency?: string;    // 'BRL' | 'USD'
    createdAt: Date;
}

export class Transfer {
    public readonly id: string;
    public readonly userId: string;
    public readonly recipientId?: string;
    public readonly recipientAddress: string;
    public readonly recipientName?: string;
    public readonly token: string;
    public readonly amount: string;
    public readonly chainId: number;
    public readonly feeEstimate?: string;
    public readonly txHash?: string;
    public readonly status: TransferStatus;
    public readonly fiatRate?: number;
    public readonly fiatCurrency?: string;
    public readonly createdAt: Date;

    constructor(props: TransferProps) {
        this.validate(props);

        this.id = props.id;
        this.userId = getAddress(props.userId);
        this.recipientId = props.recipientId;
        this.recipientAddress = getAddress(props.recipientAddress);
        this.recipientName = props.recipientName;
        this.token = props.token.toUpperCase();
        this.amount = props.amount;
        this.chainId = props.chainId;
        this.feeEstimate = props.feeEstimate;
        this.txHash = props.txHash;
        this.status = props.status;
        this.fiatRate = props.fiatRate;
        this.fiatCurrency = props.fiatCurrency;
        this.createdAt = props.createdAt;
    }

    private validate(props: TransferProps): void {
        if (!props.id || props.id.trim() === '') {
            throw new Error('Transfer ID is required');
        }

        if (!isAddress(props.userId, { strict: false })) {
            throw new Error('Invalid user address format');
        }

        if (!isAddress(props.recipientAddress, { strict: false })) {
            throw new Error('Invalid recipient address format');
        }

        if (!props.token || props.token.trim() === '') {
            throw new Error('Token is required');
        }

        const amount = parseFloat(props.amount);
        if (isNaN(amount) || amount <= 0) {
            throw new Error('Amount must be a positive number');
        }

        if (!props.chainId || props.chainId <= 0) {
            throw new Error('Chain ID must be a positive integer');
        }

        const validStatuses: TransferStatus[] = ['pending', 'completed', 'failed'];
        if (!validStatuses.includes(props.status)) {
            throw new Error('Invalid transfer status');
        }
    }

    /**
     * Returns the fiat value of the transfer at the time of creation
     */
    public getFiatValue(): number | null {
        if (!this.fiatRate) return null;
        return parseFloat(this.amount) * this.fiatRate;
    }

    /**
     * Returns a shortened version of the recipient address
     */
    public getShortRecipientAddress(): string {
        return `${this.recipientAddress.slice(0, 6)}...${this.recipientAddress.slice(-4)}`;
    }

    /**
     * Returns the BaseScan URL for this transaction
     */
    public getExplorerUrl(): string | null {
        if (!this.txHash) return null;

        // Only Base mainnet for now
        if (this.chainId === 8453) {
            return `https://basescan.org/tx/${this.txHash}`;
        }

        return null;
    }
}
