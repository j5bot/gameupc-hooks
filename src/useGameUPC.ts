'use client';

import {
    deleteGameUPCMatch,
    fetchGameDataForUpc,
    postGameUPCMatch,
    warmupGameUPCApi
} from './server';
import { GameUPCData, GameUPCStatuses } from './types';
import { useEffect, useRef, useState, useTransition } from 'react';

export const GameUPCStatus: Record<GameUPCStatuses, GameUPCStatuses> = {
    verified: 'verified',
    none: 'none',
    choose_from_versions: 'choose_from_versions',
    choose_from_bgg_info_or_search: 'choose_from_bgg_info_or_search',
    choose_from_versions_or_search: 'choose_from_versions_or_search',
};

export const GameUPCVersionStatusText: Record<GameUPCStatuses, string> = {
    verified: 'Verified',
    none: 'Not found',
    choose_from_versions: 'Choose from the available versions',
    choose_from_bgg_info_or_search: 'Choose a game, or search for something not in the list',
    choose_from_versions_or_search: `Choose from the available versions, or search for something not in the list`
};

export type UseGameUPCOptions = {
    updaterId: string;
};

export const useGameUPC = (options?: UseGameUPCOptions) => {
    const { updaterId } = options ?? {};

    const [gameUPCUserId, setGameUPCUserId] = useState<string | undefined>(updaterId);

    const setUpdater = (username?: string) => {
        setGameUPCUserId(updaterId + (username ? `/${username}` : ''));
    };

    const [isGetPending, startGetTransition] = useTransition();
    const [isWarmPending, startWarmTransition] = useTransition();
    const [isSubmitPending, startSubmitTransition] = useTransition();
    const [isRemovePending, startRemoveTransition] = useTransition();

    const [warmed, setWarmed] = useState<boolean>(false);
    const [gameDataMap, setGameDataMap] = useState<Record<string, GameUPCData>>({});
    const [gameUPCs, setGameUPCs] = useState<string[]>([]);
    const fetchingGameUPCs = useRef<string[]>([]);

    const gameUPCApiPostUserBody = JSON.stringify({
        user_id: gameUPCUserId,
    });

    useEffect(() => {
        let warming = false;
        if (!(warmed || warming)) {
            warming = true;
            startWarmTransition(async () =>
                await warmupGameUPCApi().then(() => setWarmed(true))
            );
        }
        return () => { warming = false; };
    }, [warmed]);

    const getGameData = async (upc: string, search?: string): Promise<GameUPCData | undefined> => {
        if (gameUPCs.includes(upc) && (!search || search?.length === 0)) {
            return gameDataMap[upc];
        }
        if (fetchingGameUPCs.current.includes(upc)) {
            console.info('[getGameData] is fetching: ', fetchingGameUPCs.current, upc);
            return undefined;
        }

        fetchingGameUPCs.current.push(upc);

        startGetTransition(async () => {
            const gameData = fetchGameDataForUpc(upc, search)
                .then(data => {
                    console.info('[getGameData] data: ', data);
                    gameUPCs.push(upc);
                    setGameUPCs(gameUPCs);
                    gameDataMap[upc] = data;
                    setGameDataMap({ ...gameDataMap });
                    return data;
                });

            await gameData;
            fetchingGameUPCs.current = fetchingGameUPCs.current.filter(gameUPC => gameUPC !== upc);
            console.info('[getGameData]', gameUPCs, fetchingGameUPCs);
        });

        const now = new Date().valueOf();
        return new Promise<GameUPCData | undefined>(resolve => {
            if (gameDataMap[upc]) {
                resolve(gameDataMap[upc]);
                return;
            }
            const interval = setInterval(() => {
                if (Date.now().valueOf() > now + 5000) {
                    clearInterval(interval);
                    resolve(undefined);
                }
                if (!gameDataMap[upc]) {
                    return;
                }
                resolve(gameDataMap[upc]);
                clearInterval(interval);
            }, 50);
        });
    };

    const submitOrVerifyGame = (upc: string, bggId: number, version: number = -1) => {
        startSubmitTransition(async () => {
            gameDataMap[upc] = await postGameUPCMatch(upc, bggId, version, gameUPCApiPostUserBody);
            setGameDataMap(gameDataMap);
        });
    };

    const removeGame = (upc: string, bggId: number, version: number = -1) => {
        startRemoveTransition(async () => {
            gameDataMap[upc] = await deleteGameUPCMatch(upc, bggId, version, gameUPCApiPostUserBody);
            setGameDataMap(gameDataMap);
        });
    };

    return {
        gameDataMap,
        getGameData,
        removeGame,
        setUpdater,
        submitOrVerifyGame,
        isWarmPending,
        isGetPending,
        isSubmitPending,
        isRemovePending,
    };
};
