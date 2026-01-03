import { WalletClient, Hex, Hash, getAddress } from 'viem';
import { BASE_USDC_ADDRESS } from '../config/baseUsdc';

/**
 * Signs an EIP-2612 Permit for USDC on Base.
 */
export async function signUsdcPermit(
    walletClient: WalletClient,
    owner: Hex,
    spender: Hex,
    value: bigint,
    deadline: bigint,
    nonce: bigint
): Promise<Hash> {
    const chainId = 8453; // Base Mainnet

    const domain = {
        name: 'USD Coin',
        version: '2',
        chainId,
        verifyingContract: getAddress(BASE_USDC_ADDRESS),
    } as const;

    const types = {
        Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
        ],
    } as const;

    const message = {
        owner,
        spender,
        value,
        nonce,
        deadline,
    } as const;

    const signature = await walletClient.signTypedData({
        account: owner,
        domain,
        types,
        primaryType: 'Permit',
        message,
    });

    return signature;
}
