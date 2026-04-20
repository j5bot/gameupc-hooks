const JSON_RESPONSE = { status: 'ok' };

type EnvValue = string | undefined;
type Env = { GAMEUPC_TOKEN?: EnvValue };

const setEnv = (key: string, value: EnvValue) => {
    if (value === undefined) {
        delete process.env[key];
        return;
    }
    process.env[key] = value;
};

const importServer = async (env?: Env) => {
    vi.resetModules();
    setEnv('GAMEUPC_TOKEN', env?.GAMEUPC_TOKEN);
    return import('../src/server');
};

const createFetchMock = () => {
    const json = vi.fn().mockResolvedValue(JSON_RESPONSE);
    const fetchMock = vi.fn().mockResolvedValue({ json });
    vi.stubGlobal('fetch', fetchMock);
    return { fetchMock, json };
};

describe('server api helpers', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('warms up test endpoint when GAMEUPC_TOKEN is missing', async () => {
        const { fetchMock } = createFetchMock();
        const { warmupGameUPCApi } = await importServer();

        await warmupGameUPCApi();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://api.gameupc.com/test/warmup',
            expect.any(Object),
        );
    });

    it('warms up test endpoint when GAMEUPC_TOKEN is present', async () => {
        const { fetchMock } = createFetchMock();
        const { warmupGameUPCApi } = await importServer({
            GAMEUPC_TOKEN: 'token',
        });

        await warmupGameUPCApi();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://api.gameupc.com/v1/warmup',
            expect.any(Object),
        );
    });

    it('fetches game data from v1 with optional search', async () => {
        const { fetchMock } = createFetchMock();
        const { fetchGameDataForUpc } = await importServer({
            GAMEUPC_TOKEN: 'secret-key',
        });

        await fetchGameDataForUpc('12345', 'catan');

        const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe('https://api.gameupc.com/v1/upc/12345?search=catan');
        expect((options.headers as Headers).get('x-api-key')).toBe('secret-key');
    });

    it('posts a match with version info and request body', async () => {
        const { fetchMock } = createFetchMock();
        const { postGameUPCMatch } = await importServer();

        await postGameUPCMatch('00001', 100, 7, '{"user_id":"bot"}');

        const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe('https://api.gameupc.com/test/upc/00001/bgg_id/100/version/7');
        expect(options.method).toBe('POST');
        expect(options.body).toBe('{"user_id":"bot"}');
    });

    it('short-circuits when bggId is NaN', async () => {
        const { fetchMock } = createFetchMock();
        const { postGameUPCMatch } = await importServer();

        const result = await postGameUPCMatch('00001', Number.NaN, -1, '{}');

        expect(result).toBeUndefined();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('delete helper currently delegates to the POST path', async () => {
        const { fetchMock } = createFetchMock();
        const { deleteGameUPCMatch } = await importServer();

        await deleteGameUPCMatch('00001', 100, -1, '{}');

        const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(options.method).toBe('POST');
    });
});

