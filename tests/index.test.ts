import * as publicApi from '../src/index';

describe('public exports', () => {
    it('re-exports hook and type constants', () => {
        expect(typeof publicApi.useGameUPC).toBe('function');
        expect(publicApi.GameUPCStatus.verified).toBe('verified');
        expect(publicApi.GameUPCVersionStatusText.none).toBe('Not found');
    });
});

