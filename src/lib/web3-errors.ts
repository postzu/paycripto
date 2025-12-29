// src/lib/web3-errors.ts
// Utility to translate technical Web3/Ethers errors into user-friendly messages

import { WalletNotFoundError, WrongNetworkError } from './wallet';
import { InsufficientUsdcError, InsufficientGasError } from './sendUsdcBase';

export type Web3ErrorCode =
    | 'INSUFFICIENT_USDC'
    | 'INSUFFICIENT_GAS'
    | 'USER_REJECTED'
    | 'NETWORK_ERROR'
    | 'WRONG_NETWORK'
    | 'WALLET_NOT_FOUND'
    | 'TRANSACTION_REVERTED'
    | 'UNKNOWN_ERROR';

export interface FriendlyError {
    code: Web3ErrorCode;
    title: string;
    message: string;
    action?: string;
}

/**
 * Translates a Web3/Ethers error into a user-friendly message in Portuguese
 */
export function translateWeb3Error(error: unknown): FriendlyError {
    // --- Check for custom error classes first ---
    if (error instanceof WalletNotFoundError) {
        return {
            code: 'WALLET_NOT_FOUND',
            title: 'Carteira Não Encontrada',
            message: 'Não foi possível detectar uma carteira Web3 no seu navegador.',
            action: 'Instale MetaMask, Rabby ou outra carteira compatível e atualize a página.'
        };
    }

    if (error instanceof WrongNetworkError) {
        return {
            code: 'WRONG_NETWORK',
            title: 'Rede Incorreta',
            message: 'Sua carteira está conectada a uma rede diferente da Base.',
            action: 'Troque para a rede Base na sua carteira e tente novamente.'
        };
    }

    if (error instanceof InsufficientUsdcError) {
        return {
            code: 'INSUFFICIENT_USDC',
            title: 'Saldo USDC Insuficiente',
            message: error.message,
            action: 'Verifique seu saldo de USDC disponível e tente um valor menor.'
        };
    }

    if (error instanceof InsufficientGasError) {
        return {
            code: 'INSUFFICIENT_GAS',
            title: 'ETH Insuficiente para Taxa',
            message: 'Você não possui ETH suficiente na rede Base para pagar a taxa de transação (gas).',
            action: 'Envie uma pequena quantidade de ETH (ex: 0.001 ETH) para sua carteira na rede Base.'
        };
    }

    // Extract error properties safely
    const err = error as Record<string, unknown>;
    const rawMessage = typeof err?.message === 'string' ? err.message : '';
    const message = rawMessage.toLowerCase();
    const code = err?.code;
    const reason = typeof err?.reason === 'string' ? err.reason.toLowerCase() : '';

    // Check for nested error info (common in ethers.js v6)
    const info = err?.info as Record<string, unknown> | undefined;
    const infoError = info?.error as Record<string, unknown> | undefined;
    const nestedMessage = typeof infoError?.message === 'string' ? infoError.message.toLowerCase() : '';

    // --- Wallet Not Found ---
    if (
        message.includes('carteira não encontrada') ||
        message.includes('no provider') ||
        message.includes('window.ethereum')
    ) {
        return {
            code: 'WALLET_NOT_FOUND',
            title: 'Carteira Não Encontrada',
            message: 'Não foi possível detectar uma carteira Web3 no seu navegador.',
            action: 'Instale MetaMask, Rabby ou outra carteira compatível e atualize a página.'
        };
    }

    // --- Wrong Network ---
    if (
        message.includes('troque a rede') ||
        message.includes('switch') && message.includes('chain') ||
        message.includes('wrong network') ||
        code === 4902 // Chain not added
    ) {
        return {
            code: 'WRONG_NETWORK',
            title: 'Rede Incorreta',
            message: 'Sua carteira está conectada a uma rede diferente da Base.',
            action: 'Troque para a rede Base na sua carteira e tente novamente.'
        };
    }

    // --- User Rejected Transaction ---
    if (
        message.includes('user rejected') ||
        message.includes('user denied') ||
        message.includes('rejected by user') ||
        code === 'ACTION_REJECTED' ||
        code === 4001
    ) {
        return {
            code: 'USER_REJECTED',
            title: 'Operação Cancelada',
            message: 'Você cancelou a transação na sua carteira.',
            action: 'Clique em "Confirmar e Pagar" novamente se desejar prosseguir.'
        };
    }

    // --- Insufficient Funds for Gas ---
    if (
        message.includes('insufficient funds for intrinsic transaction cost') ||
        message.includes('insufficient funds for gas') ||
        (message.includes('insufficient') && message.includes('gas')) ||
        nestedMessage.includes('insufficient funds')
    ) {
        return {
            code: 'INSUFFICIENT_GAS',
            title: 'ETH Insuficiente para Taxa',
            message: 'Você não possui ETH suficiente na rede Base para pagar a taxa de transação (gas).',
            action: 'Envie uma pequena quantidade de ETH (ex: 0.001 ETH) para sua carteira na rede Base.'
        };
    }

    // --- Insufficient Token Balance (ERC20 transfer failure) ---
    if (
        message.includes('transfer amount exceeds balance') ||
        reason.includes('transfer amount exceeds balance') ||
        message.includes('exceeds balance') ||
        (message.includes('erc20') && message.includes('insufficient'))
    ) {
        return {
            code: 'INSUFFICIENT_USDC',
            title: 'Saldo USDC Insuficiente',
            message: 'Você não possui USDC suficiente para completar esta transferência.',
            action: 'Verifique seu saldo de USDC disponível e tente um valor menor.'
        };
    }

    // --- Network/Connection Errors ---
    if (
        message.includes('failed to fetch') ||
        message.includes('network error') ||
        message.includes('could not detect network') ||
        message.includes('httprequesterror') ||
        message.includes('enotfound') ||
        message.includes('timeout') ||
        message.includes('etimedout')
    ) {
        return {
            code: 'NETWORK_ERROR',
            title: 'Erro de Conexão',
            message: 'Não foi possível conectar à rede Base. Isso pode ser instabilidade na internet ou no servidor RPC.',
            action: 'Verifique sua conexão com a internet e tente novamente em alguns segundos.'
        };
    }

    // --- Transaction Reverted (generic) ---
    if (
        message.includes('execution reverted') ||
        message.includes('revert') ||
        message.includes('call_exception') ||
        code === 'CALL_EXCEPTION'
    ) {
        // Try to provide more context if possible
        if (message.includes('missing revert data') || nestedMessage.includes('missing revert data')) {
            return {
                code: 'INSUFFICIENT_USDC',
                title: 'Saldo Insuficiente',
                message: 'A transação foi recusada. Isso geralmente significa que você não tem saldo suficiente de USDC ou ETH.',
                action: 'Verifique se possui saldo de USDC maior que o valor a enviar, e ETH para a taxa de gas.'
            };
        }

        return {
            code: 'TRANSACTION_REVERTED',
            title: 'Transação Recusada',
            message: 'O contrato inteligente recusou esta transação. Isso pode ocorrer por saldo insuficiente ou regras do contrato.',
            action: 'Verifique seu saldo e tente novamente com um valor menor.'
        };
    }

    // --- Default / Unknown Error ---
    // Log the full error for debugging
    console.error('[web3-errors] Unhandled error:', { message: rawMessage, code, reason, info });

    return {
        code: 'UNKNOWN_ERROR',
        title: 'Erro na Transferência',
        message: 'Ocorreu um erro inesperado ao processar sua transferência.',
        action: 'Verifique se sua carteira está desbloqueada e conectada à rede Base, depois tente novamente.'
    };
}
