# gameupc-hooks

React-first helpers for looking up UPCs in the GameUPC API and submitting/confirming matches.

This package exports a client hook (`useGameUPC`) and server-side request helpers.

## Requirements

- React `>=19`
- React DOM `>=19`
- Runtime with `fetch` support (Node 18+ or modern browser/runtime)

## Installation

```bash
pnpm add gameupc-hooks
```

Or with npm/yarn:

```bash
npm install gameupc-hooks
yarn add gameupc-hooks
```

## Environment Setup

Set `GAMEUPC_TOKEN` in your server environment:

```bash
export GAMEUPC_TOKEN="your-api-token"
```

Behavior by token state:

- `GAMEUPC_TOKEN` present -> requests use `https://api.gameupc.com/v1`
- `GAMEUPC_TOKEN` missing -> requests use `https://api.gameupc.com/test`

## Usage

### 1) Client hook (`useGameUPC`)

```tsx
'use client';

import { useGameUPC } from 'gameupc-hooks/useGameUPC';

export function UpcLookup() {
  const {
	gameDataMap,
	getGameData,
	submitOrVerifyGame,
	removeGame,
	setUpdater,
	isWarmPending,
	isGetPending,
	isSubmitPending,
	isRemovePending,
  } = useGameUPC({ updaterId: 'shelfscan-bot' });

  const upc = '0123456789012';
  const data = gameDataMap[upc];

  return (
	<div>
	  <button onClick={() => getGameData(upc)} disabled={isGetPending || isWarmPending}>
		Lookup UPC
	  </button>

	  <button onClick={() => setUpdater('alice')}>Act as alice</button>

	  <button
		onClick={() => submitOrVerifyGame(upc, 13)}
		disabled={isSubmitPending}
	  >
		Verify Match
	  </button>

	  <button
		onClick={() => removeGame(upc, 13)}
		disabled={isRemovePending}
	  >
		Remove Match
	  </button>

	  <pre>{JSON.stringify(data, null, 2)}</pre>
	</div>
  );
}
```

`useGameUPC` behavior:

- Warms the GameUPC API on mount
- Caches UPC lookups in `gameDataMap`
- De-duplicates concurrent fetches for the same UPC
- Sends `{"user_id": "<updaterId>/<optional-username>"}` for submit/remove requests

### 2) Server helpers

```ts
import {
  warmupGameUPCApi,
  fetchGameDataForUpc,
  postGameUPCMatch,
  deleteGameUPCMatch,
} from 'gameupc-hooks/server';

await warmupGameUPCApi();

const gameData = await fetchGameDataForUpc('0123456789012', 'catan');

await postGameUPCMatch(
  '0123456789012',
  13,
  -1,
  JSON.stringify({ user_id: 'shelfscan-bot/alice' }),
);

await deleteGameUPCMatch(
  '0123456789012',
  13,
  -1,
  JSON.stringify({ user_id: 'shelfscan-bot/alice' }),
);
```

## Exports

Use subpath imports:

- `gameupc-hooks/useGameUPC`
- `gameupc-hooks/server`
- `gameupc-hooks/types`

## Types

Import shared types from `gameupc-hooks/types`:

- `GameUPCData`
- `GameUPCBggInfo`
- `GameUPCBggVersion`
- `GameUPCStatus`
- `GameUPCVersionStatusText`

## Notes

- `deleteGameUPCMatch` currently follows the same request path/method pattern as `postGameUPCMatch` in this package version.
- The package is designed to match integration patterns used in the ShelfScan app (`j5bot/shelfscan`) while remaining reusable as a standalone library.

## Local Development

```bash
pnpm install
pnpm build
pnpm test
```

