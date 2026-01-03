import { createSmartAccountClient } from "permissionless";
import { toSimpleSmartAccount } from "permissionless/accounts";
import { createPaymasterClient } from "viem/account-abstraction";
import { http, createPublicClient, WalletClient, PublicClient, Transport, Chain, Account } from "viem";
import { base } from "viem/chains";

// Environment variables
const paymasterUrl = process.env.NEXT_PUBLIC_CIRCLE_PAYMASTER_URL;
const bundlerUrl = process.env.NEXT_PUBLIC_BUNDLER_URL;

if (!paymasterUrl || !bundlerUrl) {
    throw new Error("Circle Paymaster or Bundler URL not configured.");
}

// 1. Create Paymaster Client
export const paymasterClient = createPaymasterClient({
    transport: http(paymasterUrl),
});

// 2. Create Smart Account Client
export const createSmartWalletClient = async (
    walletClient: WalletClient,
    publicClient: PublicClient
) => {
    if (!bundlerUrl) throw new Error("Bundler URL is missing");
    if (!walletClient.account) throw new Error("Wallet client has no account connected");

    // Create the Smart Account (SimpleAccount v0.7)
    const simpleAccount = await toSimpleSmartAccount({
        client: publicClient,
        owner: walletClient as WalletClient<Transport, Chain, Account>,
        entryPoint: {
            address: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
            version: "0.7"
        },
        factoryAddress: "0x91E60e0613810449d098b0b5Ec8b51A0FE8c8985",
    });

    // Create the Smart Account Client
    const bundlerClient = createPublicClient({
        transport: http(bundlerUrl),
        chain: base
    });

    const smartAccountClient = createSmartAccountClient({
        account: simpleAccount,
        chain: base,
        bundlerTransport: http(bundlerUrl),
        paymaster: paymasterClient,
        userOperation: {
            estimateFeesPerGas: async () => {
                return await bundlerClient.estimateFeesPerGas();
            }
        }
    });

    return { smartAccountClient, simpleAccount };
};
