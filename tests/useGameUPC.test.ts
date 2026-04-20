// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react';

const serverMocks = vi.hoisted(() => ({
    warmupGameUPCApi: vi.fn().mockResolvedValue(undefined),
    fetchGameDataForUpc: vi.fn().mockResolvedValue({ status: 'ok', upc: '001', bgg_info: [] }),
    postGameUPCMatch: vi.fn().mockResolvedValue({ status: 'ok', upc: '001', bgg_info: [] }),
    deleteGameUPCMatch: vi.fn().mockResolvedValue({ status: 'ok', upc: '001', bgg_info: [] }),
}));

vi.mock('../src/server', () => serverMocks);

import { useGameUPC } from '../src/useGameUPC';

describe('useGameUPC', () => {
    beforeEach(() => {
        serverMocks.warmupGameUPCApi.mockResolvedValue(undefined);
        serverMocks.fetchGameDataForUpc.mockResolvedValue({ status: 'ok', upc: '001', bgg_info: [] });
        serverMocks.postGameUPCMatch.mockResolvedValue({ status: 'ok', upc: '001', bgg_info: [] });
        serverMocks.deleteGameUPCMatch.mockResolvedValue({ status: 'ok', upc: '001', bgg_info: [] });
    });

    it('warms API on mount', async () => {
        renderHook(() => useGameUPC({ updaterId: 'tester' }));

        await waitFor(() => {
            expect(serverMocks.warmupGameUPCApi).toHaveBeenCalledTimes(1);
        });
    });

    it('deduplicates repeated fetches while one UPC is already fetching', async () => {
        const { result } = renderHook(() => useGameUPC({ updaterId: 'tester' }));

        await act(async () => {
            await result.current.getGameData('0123456789012');
            await result.current.getGameData('0123456789012');
        });

        await waitFor(() => {
            expect(serverMocks.fetchGameDataForUpc).toHaveBeenCalledTimes(1);
        });
    });

    it('submits with default version and updater id in request body', async () => {
        const { result } = renderHook(() => useGameUPC({ updaterId: 'service-user' }));

        await act(async () => {
            result.current.submitOrVerifyGame('99999', 101);
        });

        await waitFor(() => {
            expect(serverMocks.postGameUPCMatch).toHaveBeenCalledWith(
                '99999',
                101,
                -1,
                JSON.stringify({ user_id: 'service-user' }),
            );
        });
    });

    it('updates user_id when setUpdater is called', async () => {
        const { result } = renderHook(() => useGameUPC({ updaterId: 'service-user' }));

        await act(async () => {
            result.current.setUpdater('alice');
        });

        await act(async () => {
            result.current.submitOrVerifyGame('99999', 101, 8);
        });

        await waitFor(() => {
            expect(serverMocks.postGameUPCMatch).toHaveBeenCalledWith(
                '99999',
                101,
                8,
                JSON.stringify({ user_id: 'service-user/alice' }),
            );
        });
    });

    it('removes game using the delete helper', async () => {
        const { result } = renderHook(() => useGameUPC({ updaterId: 'service-user' }));

        await act(async () => {
            result.current.removeGame('99999', 102, 6);
        });

        await waitFor(() => {
            expect(serverMocks.deleteGameUPCMatch).toHaveBeenCalledWith(
                '99999',
                102,
                6,
                JSON.stringify({ user_id: 'service-user' }),
            );
        });
    });
});

