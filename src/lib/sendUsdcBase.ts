// src/lib/sendUsdcBase.ts
import { ethers } from "ethers";
import { getBaseSigner } from "./wallet";
import { BASE_USDC_ADDRESS } from "../config/baseUsdc";

type SendUsdcParams = {
    to: string;
    amount: string; // Human-readable amount, e.g. "50"
};

// Extended ABI to include balanceOf for pre-flight check
const extendedErc20Abi = [
    "function transfer(address to, uint256 amount) returns (bool)",
    "function balanceOf(address account) view returns (uint256)",
    "function decimals() view returns (uint8)"
];

export class InsufficientUsdcError extends Error {
    constructor(required: string, available: string) {
        super(`Saldo USDC insuficiente. Necessário: ${required}, Disponível: ${available}`);
        this.name = 'InsufficientUsdcError';
    }
}

export class InsufficientGasError extends Error {
    constructor() {
        super('ETH insuficiente para pagar a taxa de transação (gas).');
        this.name = 'InsufficientGasError';
    }
}

export async function sendUsdcOnBase({ to, amount }: SendUsdcParams): Promise<string> {
    const signer = await getBaseSigner();
    const signerAddress = await signer.getAddress();

    const usdc = new ethers.Contract(
        BASE_USDC_ADDRESS,
        extendedErc20Abi,
        signer
    );

    // Get decimals (USDC uses 6)
    let decimals = 6;
    try {
        decimals = await usdc.decimals();
    } catch {
        // Fallback to 6 if call fails
        decimals = 6;
    }

    const value = ethers.parseUnits(amount, decimals);

    // Pre-flight check: verify USDC balance
    try {
        const balance = await usdc.balanceOf(signerAddress);
        if (balance < value) {
            const balanceFormatted = ethers.formatUnits(balance, decimals);
            throw new InsufficientUsdcError(amount, balanceFormatted);
        }
    } catch (error) {
        // If it's our custom error, rethrow it
        if (error instanceof InsufficientUsdcError) {
            throw error;
        }
        // Otherwise, it might be a network error - let it continue and fail on transfer
        console.warn('[sendUsdcOnBase] Could not verify balance:', error);
    }

    // Pre-flight check: estimate gas to catch insufficient ETH early
    try {
        await usdc.transfer.estimateGas(to, value);
    } catch (error: unknown) {
        const err = error as Record<string, unknown>;
        const message = typeof err?.message === 'string' ? err.message.toLowerCase() : '';

        // Check if it's an insufficient funds for gas error
        if (message.includes('insufficient funds') && !message.includes('transfer amount')) {
            throw new InsufficientGasError();
        }

        // If it's a revert, it will be caught in the actual transfer call
        console.warn('[sendUsdcOnBase] Gas estimation failed:', error);
    }

    // Execute the transfer
    const tx = await usdc.transfer(to, value);
    console.log("Tx enviada:", tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("Confirmada no bloco:", receipt.blockNumber);

    return tx.hash;
}
