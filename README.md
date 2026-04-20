# gameupc-hooks

React hooks for integrating with the GameUPC API.

## Development

Install dependencies:

```bash
pnpm install
```

Build:

```bash
pnpm build
```

Run unit tests once:

```bash
pnpm test
```

Run tests in watch mode:

```bash
pnpm test:watch
```

## Test Coverage

The test suite includes:

- Public API export checks (`tests/index.test.ts`)
- Host URL helper behavior (`tests/constants.test.ts`)
- Server request contract behavior (`tests/server.test.ts`)
- React hook behavior with mocked server APIs (`tests/useGameUPC.test.ts`)

