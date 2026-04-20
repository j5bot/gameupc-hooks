import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
// @ts-ignore
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    peerDepsExternal(),
    dts({
      include: ['src'],
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: [
          resolve(__dirname, 'src/server.ts'),
          resolve(__dirname, 'src/useGameUPC.ts'),
      ],
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`
    },
    rollupOptions: {
      output: {
        banner: (chunkInfo) => {
          return chunkInfo.name === 'server' ? `'use server'` : ``;
        },
        globals: {
          react: 'React'
        },
      }
    },
    sourcemap: true,
  },
});

