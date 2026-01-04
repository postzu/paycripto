
export const AAVE_CONSTANTS = {
    base: {
        POOL_ADDRESS: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5' as const,
        POOL_DATA_PROVIDER: '0x174446a6741300cd2e7c1b1a636fee99c8f83502' as const,
        USDC_ADDRESS: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const,
    }
};

export const ERC20_ABI = [
    {
        constant: true,
        inputs: [{ name: '_owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: 'balance', type: 'uint256' }],
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { name: '_spender', type: 'address' },
            { name: '_value', type: 'uint256' },
        ],
        name: 'approve',
        outputs: [{ name: '', type: 'bool' }],
        type: 'function',
    },
    {
        constant: true,
        inputs: [
            { name: '_owner', type: 'address' },
            { name: '_spender', type: 'address' },
        ],
        name: 'allowance',
        outputs: [{ name: '', type: 'uint256' }],
        type: 'function',
    },
] as const;

export const AAVE_POOL_ABI = [
    {
        inputs: [
            { internalType: 'address', name: 'asset', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
            { internalType: 'address', name: 'onBehalfOf', type: 'address' },
            { internalType: 'uint16', name: 'referralCode', type: 'uint16' },
        ],
        name: 'supply',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'asset', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
            { internalType: 'address', name: 'to', type: 'address' },
        ],
        name: 'withdraw',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const;

export const AAVE_DATA_PROVIDER_ABI = [
    {
        inputs: [
            { internalType: 'address', name: 'asset', type: 'address' },
            { internalType: 'address', name: 'user', type: 'address' },
        ],
        name: 'getUserReserveData',
        outputs: [
            { internalType: 'uint256', name: 'currentATokenBalance', type: 'uint256' },
            { internalType: 'uint256', name: 'currentStableDebt', type: 'uint256' },
            { internalType: 'uint256', name: 'currentVariableDebt', type: 'uint256' },
            { internalType: 'uint256', name: 'principalStableDebt', type: 'uint256' },
            { internalType: 'uint256', name: 'scaledVariableDebt', type: 'uint256' },
            { internalType: 'uint256', name: 'stableBorrowRate', type: 'uint256' },
            { internalType: 'uint256', name: 'liquidityRate', type: 'uint256' },
            { internalType: 'uint40', name: 'stableRateLastUpdated', type: 'uint40' },
            { internalType: 'bool', name: 'usageAsCollateralEnabled', type: 'bool' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'asset', type: 'address' }],
        name: 'getReserveData',
        outputs: [
            { internalType: 'uint256', name: 'unbacked', type: 'uint256' },
            { internalType: 'uint256', name: 'accruedToTreasuryScaled', type: 'uint256' },
            { internalType: 'uint256', name: 'totalAToken', type: 'uint256' },
            { internalType: 'uint256', name: 'totalStableDebt', type: 'uint256' },
            { internalType: 'uint256', name: 'totalVariableDebt', type: 'uint256' },
            { internalType: 'uint256', name: 'liquidityRate', type: 'uint256' },
            { internalType: 'uint256', name: 'variableBorrowRate', type: 'uint256' },
            { internalType: 'uint256', name: 'stableBorrowRate', type: 'uint256' },
            { internalType: 'uint256', name: 'averageStableBorrowRate', type: 'uint256' },
            { internalType: 'uint256', name: 'liquidityIndex', type: 'uint256' },
            { internalType: 'uint256', name: 'variableBorrowIndex', type: 'uint256' },
            { internalType: 'uint40', name: 'lastUpdateTimestamp', type: 'uint40' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
] as const;
