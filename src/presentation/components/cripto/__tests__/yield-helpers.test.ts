import { describe, expect, it } from 'vitest';
import { computeYieldFiatAvailable } from '../yield-helpers';

const makeFormatter = () => ({
    format: (value: number) => `fmt-${value}`,
});

describe('computeYieldFiatAvailable', () => {
    it('returns masked value when balance is hidden', () => {
        const result = computeYieldFiatAvailable({
            showBalance: false,
            isLoadingBalance: false,
            hasBalance: true,
            fiatValue: '123.45',
            formatter: makeFormatter(),
            zeroBalanceMessage: 'no-balance',
            availablePrefix: 'from ',
        });

        expect(result).toEqual({ display: '*****', showApproxSymbol: false });
    });

    it('returns loading placeholder while fetching', () => {
        const result = computeYieldFiatAvailable({
            showBalance: true,
            isLoadingBalance: true,
            hasBalance: true,
            fiatValue: '123.45',
            formatter: makeFormatter(),
            zeroBalanceMessage: 'no-balance',
            availablePrefix: 'from ',
        });

        expect(result).toEqual({ display: '...', showApproxSymbol: false });
    });

    it('returns prefixed formatted fiat when balance is available', () => {
        const result = computeYieldFiatAvailable({
            showBalance: true,
            isLoadingBalance: false,
            hasBalance: true,
            fiatValue: '100',
            formatter: makeFormatter(),
            zeroBalanceMessage: 'no-balance',
            availablePrefix: 'from ',
        });

        expect(result).toEqual({ display: 'from fmt-30', showApproxSymbol: true });
    });

    it('returns zero balance message when no balance', () => {
        const result = computeYieldFiatAvailable({
            showBalance: true,
            isLoadingBalance: false,
            hasBalance: false,
            fiatValue: '0',
            formatter: makeFormatter(),
            zeroBalanceMessage: 'no-balance',
            availablePrefix: 'from ',
        });

        expect(result).toEqual({ display: 'no-balance', showApproxSymbol: false });
    });
});
