import { describe, it, expect } from 'vitest';
import { Recipient } from './recipient.entity';

describe('Recipient Entity', () => {
    it('should create a valid recipient', () => {
        const recipient = new Recipient({
            id: '123',
            name: 'John Doe',
            address: '0x1234567890123456789012345678901234567890',
            userId: 'user-1'
        });

        expect(recipient.name).toBe('John Doe');
        expect(recipient.address).toBe('0x1234567890123456789012345678901234567890');
    });

    it('should throw error if name is empty', () => {
        expect(() => {
            new Recipient({
                id: '123',
                name: '',
                address: '0x123',
                userId: 'user-1'
            });
        }).toThrow('Name is required');
    });

    it('should throw error if address is invalid', () => {
        expect(() => {
            new Recipient({
                id: '123',
                name: 'John',
                address: 'invalid-address',
                userId: 'user-1'
            });
        }).toThrow('Invalid address format');
    });
});
