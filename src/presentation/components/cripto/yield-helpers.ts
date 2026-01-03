export type YieldFiatAvailableParams = {
    showBalance: boolean;
    isLoadingBalance: boolean;
    hasBalance: boolean;
    fiatValue: string;
    formatter: { format: (value: number) => string };
    zeroBalanceMessage: string;
    availablePrefix: string;
    percentage?: number;
};

export type YieldFiatAvailableResult = {
    display: string;
    showApproxSymbol: boolean;
};

export function computeYieldFiatAvailable({
    showBalance,
    isLoadingBalance,
    hasBalance,
    fiatValue,
    formatter,
    zeroBalanceMessage,
    availablePrefix,
    percentage = 0.3,
}: YieldFiatAvailableParams): YieldFiatAvailableResult {
    if (!showBalance) return { display: '*****', showApproxSymbol: false };
    if (isLoadingBalance) return { display: '...', showApproxSymbol: false };

    if (hasBalance) {
        const parsedFiat = Number.parseFloat(fiatValue || '0');
        if (Number.isFinite(parsedFiat) && parsedFiat > 0) {
            const availableValue = parsedFiat * percentage;
            return {
                display: `${availablePrefix}${formatter.format(availableValue)}`,
                showApproxSymbol: true,
            };
        }
    }

    return { display: zeroBalanceMessage, showApproxSymbol: false };
}
