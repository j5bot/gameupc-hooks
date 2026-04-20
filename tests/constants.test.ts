import { makeGameUPCHost } from '../src/constants';

describe('makeGameUPCHost', () => {
    it('returns production host by default', () => {
        expect(makeGameUPCHost()).toBe('https://api.gameupc.com/v1');
    });

    it('returns test host when isTest is true', () => {
        expect(makeGameUPCHost(true)).toBe('https://api.gameupc.com/test');
    });
});

