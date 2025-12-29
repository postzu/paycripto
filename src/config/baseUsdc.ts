
// src/config/baseUsdc.ts

// Coloque aqui o endereço OFICIAL do USDC na Base
// (pegue em fontes oficiais: Base docs, Circle ou CoinGecko)
export const BASE_USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base Mainnet USDC

// ABI mínima só com a função transfer
export const erc20Abi = [
    "function transfer(address to, uint256 amount) returns (bool)"
];
