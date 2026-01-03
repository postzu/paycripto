
// src/config/baseUsdc.ts

// Coloque aqui o endereço OFICIAL do USDC na Base
// (pegue em fontes oficiais: Base docs, Circle ou CoinGecko)
export const BASE_USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base Mainnet USDC

// ABI expandida para suportar fluxo de Paymaster com Permit
export const erc20Abi = [
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function nonces(address owner) view returns (uint256)",
    "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external",
    "function DOMAIN_SEPARATOR() view returns (bytes32)"
];
