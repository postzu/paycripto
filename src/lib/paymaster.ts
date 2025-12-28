import { createSmartAccountClient } from "permissionless";
import { toSimpleSmartAccount } from "permissionless/accounts";
import { createPaymasterClient } from "viem/account-abstraction";
import { http, createPublicClient, WalletClient } from "viem";
import { baseSepolia } from "viem/chains";

// Environment variables
const paymasterUrl = process.env.NEXT_PUBLIC_CIRCLE_PAYMASTER_URL;
const bundlerUrl = process.env.NEXT_PUBLIC_BUNDLER_URL;

if (!paymasterUrl || !bundlerUrl) {
    console.error("Circle Paymaster or Bundler URL not configured.");
}

// 1. Create Paymaster Client
export const paymasterClient = createPaymasterClient({
    transport: http(paymasterUrl),
});

// 2. Create Smart Account Client
export const createSmartWalletClient = async (
    walletClient: WalletClient,
    publicClient: any
) => {
    if (!bundlerUrl) throw new Error("Bundler URL is missing");
    if (!walletClient.account) throw new Error("Wallet client has no account connected");

    // Create the Smart Account (SimpleAccount v0.6)
    const simpleAccount = await toSimpleSmartAccount({
        client: publicClient,
        owner: walletClient,
        entryPoint: {
            address: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
            version: "0.6"
        },
        factoryAddress: "0x9406Cc6185a346906296840746125a0E44976454",
    });

    // Create the Smart Account Client
    const smartAccountClient = createSmartAccountClient({
        account: simpleAccount,
        chain: baseSepolia,
        bundlerTransport: http(bundlerUrl),
        paymaster: paymasterClient,
        userOperation: {
            estimateFeesPerGas: async () => {
                const bundlerClient = createPublicClient({
                    transport: http(bundlerUrl),
                    chain: baseSepolia
                });
                return await bundlerClient.estimateFeesPerGas();
            }
        }
    });

    return { smartAccountClient, simpleAccount };
};
