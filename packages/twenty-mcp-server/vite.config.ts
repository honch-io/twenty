import * as path from 'path';
import { builtinModules } from 'module';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// The bin (cli) needs a shebang; the library entry (index) does not.
const shebang = '#!/usr/bin/env node\n';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/twenty-mcp-server',

  resolve: {
    alias: {
      '@/': path.resolve(__dirname, 'src') + '/',
      'src/': path.resolve(__dirname, 'src') + '/',
    },
  },

  plugins: [tsconfigPaths({ root: __dirname })],

  build: {
    outDir: './dist',
    target: 'node24',
    ssr: true,
    reportCompressedSize: false,
    lib: {
      entry: {
        index: 'src/index.ts',
        cli: 'src/cli.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      // The MCP SDK is ESM-only and ships its own deps; resolve everything from
      // node_modules at runtime rather than bundling it.
      external: [
        '@modelcontextprotocol/sdk',
        /^@modelcontextprotocol\/sdk\//,
        'zod',
        /^zod\//,
        'dotenv',
        'twenty-shared',
        /^twenty-shared\//,
        ...builtinModules,
        ...builtinModules.map((m) => `node:${m}`),
      ],
      output: {
        entryFileNames: '[name].mjs',
        chunkFileNames: '[name]-[hash].mjs',
        banner: (chunk) => (chunk.fileName === 'cli.mjs' ? shebang : ''),
      },
    },
  },
});
