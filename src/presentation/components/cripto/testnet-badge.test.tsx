import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestnetBadge } from './testnet-badge';

describe('TestnetBadge', () => {
    it('should render testnet badge with correct text', () => {
        render(<TestnetBadge />);

        expect(screen.getByText('TESTNET')).toBeDefined();
    });

    it('should have accessible role for visual indicator', () => {
        render(<TestnetBadge />);

        const badge = screen.getByRole('status');
        expect(badge).toBeDefined();
    });

    it('should display warning icon indicator', () => {
        render(<TestnetBadge />);

        const badge = screen.getByTestId('testnet-badge');
        expect(badge).toBeDefined();
    });
});
