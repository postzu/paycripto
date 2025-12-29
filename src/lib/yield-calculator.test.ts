import { describe, it, expect } from 'vitest';
import { YieldCalculator } from './yield-calculator';

// Mock types if not available in a separate file yet, or import them.
// For TDD, I'll define interfaces I expect to exist.
interface HistoryItem {
    id: string;
    amount: number;
    token: string;
    direction: 'in' | 'out';
    date: string;
    fiatRate: number;
}

describe('YieldCalculator', () => {
    // 30 days in milliseconds
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const NOW = new Date('2025-01-30T12:00:00Z').getTime(); // Fixed date for testing

    it('should calculate 0 yield if balance is 0 and no transactions', () => {
        const calculator = new YieldCalculator();
        const result = calculator.calculateMonthlyYield(0, 5.0, [], NOW);
        expect(result.yieldBrl).toBe(0);
        expect(result.percentageOfCdi).toBe(0);
    });

    it('should calculate positive yield from pure appreciation (no transactions)', () => {
        const calculator = new YieldCalculator();
        // Scenario:
        // Current Balance: 100 USD
        // Current Rate: 5.50 BRL/USD
        // Current Value: 550 BRL
        // 30 Days ago Rate: 5.00 BRL/USD
        // Start Value: 100 * 5.00 = 500 BRL
        // Yield = 550 - 500 = 50 BRL

        // We need a way to provide historical rates.
        // For simplicity in this logic, we might assume the calculator derives historical rate 
        // or we pass it. For the requirement, let's assume we pass a function or map for historical rates,
        // or the calculator infers it if we only have current data.

        // Wait, if we only have current balance and current rate, we don't know the balance 30 days ago 
        // unless we reconstruct it from transactions.
        // Let's assume the calculator reconstructs the balance.

        const currentBalance = 100;
        const currentRate = 5.50;
        const transactions: HistoryItem[] = []; // No movement
        const historicalRate = 5.00; // Rate 30 days ago

        const result = calculator.calculateMonthlyYield(
            currentBalance,
            currentRate,
            transactions,
            NOW,
            () => historicalRate
        );

        expect(result.yieldBrl).toBeCloseTo(50.00, 2);
    });


    it('should handle deposits correctly (subtracting net inflow from change)', () => {
        const calculator = new YieldCalculator();
        // Scenario:
        // Current Balance: 200 USD
        // Current Rate: 5.00 BRL/USD -> Current Value: 1000 BRL

        // Transaction: Deposit 100 USD 15 days ago.
        // 30 Days ago Balance: 200 - 100 = 100 USD.
        // Rate 30 days ago: 5.00 BRL/USD (Stable rate)
        // Start Value: 100 * 5.00 = 500 BRL.

        // Net Inflow (BRL value at time of tx? Or current? 
        // Business rule: "How much did my MONEY work?"
        // Usually Yield = EndValue - (StartValue + NetDeposits)
        // If I deposited 100 USD, that is an external flow.

        const currentRate = 5.00;
        const currentBalance = 200;
        const transactions: HistoryItem[] = [
            {
                id: '1',
                amount: 100,
                token: 'USDC',
                direction: 'in',
                date: new Date(NOW - 15 * 24 * 3600 * 1000).toISOString(),
                fiatRate: 5.00
            }
        ];

        const result = calculator.calculateMonthlyYield(
            currentBalance,
            currentRate,
            transactions,
            NOW,
            () => 5.00
        );

        // End Value: 1000
        // Start Value: 500
        // Net Flow: +500 (100 * 5.00)
        // Yield: 1000 - (500 + 500) = 0
        expect(result.yieldBrl).toBeCloseTo(0, 2);
    });

    it('should calculate CDI percentage correctly', () => {
        const calculator = new YieldCalculator();
        const currentBalance = 1000; // USD
        const currentRate = 5.05; // BRL/USD
        // End Value = 5050 BRL

        // 30 days ago:
        const historicalRate = 5.00;
        // Start Balance = 1000 USD
        // Start Value = 5000 BRL

        // Yield = 50 BRL

        // CDI Benchmark: 
        // If CDI is approx 0.85% per month.
        // Base Capital = 5000 BRL
        // Expected CDI Yield = 5000 * 0.0085 = 42.5 BRL
        // % of CDI = 50 / 42.5 = 1.176 (117.6%)

        const result = calculator.calculateMonthlyYield(
            currentBalance,
            currentRate,
            [],
            NOW,
            () => historicalRate
        );

        expect(result.yieldBrl).toBeCloseTo(50, 2);
        // We need to know what CDI constant the calculator uses. 
        // Let's assume 0.85% (approx 10.7% a.a) or make it injectable.
        // If we assume a fixed CDI of 0.85% in the calculator:
        // 50 / (5000 * 0.0085) = 1.1764...
        // 117%

        // checking broad range to allow for small CDI constant diffs
        expect(result.percentageOfCdi).toBeGreaterThan(100);
    });

    it('should calculate yield based on value at time of deposit (User Example)', () => {
        const calculator = new YieldCalculator();

        // Example: Deposited 5 USDC at 4.0 BRL (Total 20 BRL cost)
        // Now: 5 USDC at 5.0 BRL (Total 25 BRL value)
        // Yield should be 5 BRL.

        const currentBalance = 5;
        const currentRate = 5.0;
        // 30 days ago balance was 0.
        // Transaction happened during the period.

        const transactions: HistoryItem[] = [
            {
                id: 'tx-user-example',
                amount: 5,
                token: 'USDC',
                direction: 'in',
                date: new Date(NOW - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
                fiatRate: 4.0
            }
        ];

        // Start Balance (30 days ago) should be 0.
        // Start Value = 0.
        // Net Inflow = 5 * 4.0 = 20.
        // End Value = 5 * 5.0 = 25.
        // Yield = 25 - (0 + 20) = 5.

        const result = calculator.calculateMonthlyYield(
            currentBalance,
            currentRate,
            transactions,
            NOW,
            () => 4.0 // irrelevant if start balance is 0
        );

        expect(result.yieldBrl).toBeCloseTo(5.00, 2);
    });
});
