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

export class InvalidAddressError extends Error {
    constructor() {
        super('Endereço de destino inválido (checksum falhou).');
        this.name = 'InvalidAddressError';
    }
}

/**
 * Validates and returns the checksummed address.
 * Throws InvalidAddressError if invalid.
 */
function validateAddress(address: string): string {
    try {
        return ethers.getAddress(address);
    } catch {
        throw new InvalidAddressError();
    }
}

/**
 * Estimates the gas cost for a USDC transfer.
 * Returns the estimated fee in ETH (as a string).
 */
export async function estimateEthFeeAsEth({ to, amount }: SendUsdcParams): Promise<string> {
    const signer = await getBaseSigner();

    // Validate address
    const toAddress = validateAddress(to);

    const usdc = new ethers.Contract(
        BASE_USDC_ADDRESS,
        extendedErc20Abi,
        signer
    );

    // Get decimals
    let decimals = 6;
    try {
        decimals = await usdc.decimals();
    } catch {
        decimals = 6;
    }

    const value = ethers.parseUnits(amount, decimals);

    // Estimate gas limit
    let gasLimit: bigint;
    try {
        gasLimit = await usdc.transfer.estimateGas(toAddress, value);
    } catch (error: unknown) {
        const err = error as Record<string, unknown>;
        const message = typeof err?.message === 'string' ? err.message.toLowerCase() : '';

        if (message.includes('insufficient funds') && !message.includes('transfer amount')) {
            throw new InsufficientGasError();
        }

        // Fallback for estimation failure: use a safe default for ERC20 transfer
        // usually 65000 is enough for a transfer
        console.warn('[estimateUsdcGas] Estimation failed, using fallback:', error);
        gasLimit = BigInt(65000);
    }

    // Get fee data (gas price)
    // Ethers v6 uses getFeeData()
    const feeData = await signer.provider?.getFeeData();
    const gasPrice = feeData?.gasPrice ?? BigInt(0);

    // Calculate total fee in Wei
    const totalFeeWei = gasLimit * gasPrice;

    // Convert to ETH
    return ethers.formatEther(totalFeeWei);
}

export const estimateUsdcGas = estimateEthFeeAsEth;

export async function sendUsdcOnBase({ to, amount }: SendUsdcParams): Promise<string> {
    const signer = await getBaseSigner();
    const signerAddress = await signer.getAddress();

    // Validate address
    const toAddress = validateAddress(to);

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
        await usdc.transfer.estimateGas(toAddress, value);
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
    const tx = await usdc.transfer(toAddress, value);
    console.log("Tx enviada:", tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("Confirmada no bloco:", receipt.blockNumber);

    return tx.hash;
}
