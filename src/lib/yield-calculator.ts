export interface HistoryItem {
    id: string;
    amount: number;
    token: string;
    direction: 'in' | 'out';
    date: string;
    fiatRate: number;
    title?: string;
    helper?: string;
    address?: string;
}

export interface YieldResult {
    yieldBrl: number;
    percentageOfCdi: number;
}

export class YieldCalculator {
    // Standard CDI monthly rate approximation (0.85% -> ~10.7% APY)
    private readonly CDI_MONTHLY_RATE = 0.0085;

    /**
     * Calculates the yield in BRL over the last 30 days.
     * 
     * @param currentBalanceUSDC Current USDC balance
     * @param currentRateBrl Current USDC/BRL exchange rate
     * @param transactions List of transactions (should include at least last 30 days)
     * @param nowTimestamp Optional timestamp for "now" (dependency injection for testing)
     * @param historicalRateProvider Optional provider for historical rate (for testing/simplicity), defaults to currentRate if not provided (simplified)
     */
    calculateMonthlyYield(
        currentBalanceUSDC: number,
        currentRateBrl: number,
        transactions: HistoryItem[],
        nowTimestamp: number = Date.now(),
        historicalRateProvider?: () => number
    ): YieldResult {
        const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
        const thirtyDaysAgo = nowTimestamp - THIRTY_DAYS_MS;

        // 1. Reconstruct start balance (30 days ago)
        // We traverse transactions backwards or filter those in the last 30 days.
        // If txn is 'in', we subtract from current to get previous.
        // If txn is 'out', we add to current to get previous.

        const relevantTransactions = transactions.filter(tx => {
            const txTime = new Date(tx.date).getTime();
            return txTime > thirtyDaysAgo && txTime <= nowTimestamp;
        });

        let startBalanceUSDC = currentBalanceUSDC;
        let netInflowBrl = 0;

        for (const tx of relevantTransactions) {
            // Reconstruct balance
            if (tx.direction === 'in') {
                startBalanceUSDC -= tx.amount;
                // For yield calcs, we usually use the value AT THE TIME of deposit as the basis?
                // Or simply the BRL value of the flow.
                // Yield = EndValue - (StartValue + NetDeposits)
                // NetDeposits should be in BRL.
                netInflowBrl += (tx.amount * tx.fiatRate);
            } else { // out
                startBalanceUSDC += tx.amount;
                netInflowBrl -= (tx.amount * tx.fiatRate);
            }
        }

        // 2. Determine Start Value in BRL
        // ideally we fetch the rate from 30 days ago. 
        // For this task, we can assume a simplified model or use the provider.
        // If no provider, we might estimate or fallback. 
        // Let's rely on provider or fallback.
        const startRateBrl = historicalRateProvider ? historicalRateProvider() : currentRateBrl;

        const startValueBrl = startBalanceUSDC * startRateBrl;
        const endValueBrl = currentBalanceUSDC * currentRateBrl;

        // 3. Calculate Yield
        // Total Change = End - Start
        // Appreciation = Total Change - Net Inflows
        const totalChangeBrl = endValueBrl - startValueBrl;
        const yieldBrl = endValueBrl - (startValueBrl + netInflowBrl);

        // 4. Calculate CDI Benchmark
        // The benchmark is usually applied to the average balance or the start balance?
        // Simplest: Benchmark on Start Value.
        // Average Daily Balance is more accurate but complex.
        // Let's use Start Value + time-weighted inflows if we want to be fancy, 
        // but Start Value is a good MVP baseline.
        // However, if Start Balance is 0, we can't divide by 0.
        // If Start Balance is 0, maybe we base it on the average capital exposed?

        // For MVP: Apply CDI to the (StartValueBrl).
        // If StartValue is 0, use weighted inflows.
        // Let's stick to StartValue for now, safeguard against 0.

        let cdiBenchmarkBrl = 0;
        if (startValueBrl > 0) {
            cdiBenchmarkBrl = startValueBrl * this.CDI_MONTHLY_RATE;
        } else {
            // Fallback: if started at 0, maybe use half of end value? 
            // Or just return 100% if positive yield?
            // Let's avoid NaN.
            cdiBenchmarkBrl = 0;
        }

        let percentageOfCdi = 0;
        if (cdiBenchmarkBrl > 0.01) { // Avoid division by tiny numbers
            percentageOfCdi = (yieldBrl / cdiBenchmarkBrl) * 100;
        } else if (yieldBrl > 0) {
            percentageOfCdi = 100; // Arbitrary high if benchmark is 0 but we made money
        }

        return {
            yieldBrl,
            percentageOfCdi: Math.round(percentageOfCdi)
        };
    }
}
