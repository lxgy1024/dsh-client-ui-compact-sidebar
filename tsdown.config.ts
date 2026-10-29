/**
 * Standalone tsdown config (not part of the dsh-web monorepo).
 *
 * Emits two halves:
 *  - lib/index.js  (host, ESM): the plugin Config schema and inert apply.
 *  - lib/client.js (browser, CJS closure factory): loaded by the DSH Web GUI
 *    module loader through window.__ModuleLoader__.load({ id, factory }).
 *
 * Browser externals are exactly the modules the GUI shell seeds into its
 * frozen require table; everything else is bundled in so the plugin has no
 * runtime dependency of its own.
 */
import { defineConfig } from 'tsdown'

const ID = '@dshx/dsh-client-ui-compact-sidebar'

/** Modules the DSH Web shell resolves through the loader's module table. */
const PLATFORM_MODULES = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
]

export default defineConfig([
  {
    name: `${ID}/host`,
    entry: { index: 'src/index.ts' },
    outDir: 'lib',
    format: 'esm',
    platform: 'node',
    target: 'node22',
    dts: false,
    clean: false,
    sourcemap: true,
    external: ['@deepseek-ai/cordis', '@deepseek-ai/schemastery'],
    outputOptions: { entryFileNames: 'index.js' },
  },
  {
    name: `${ID}/client`,
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    target: 'es2022',
    dts: false,
    clean: false,
    sourcemap: true,
    external: PLATFORM_MODULES,
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    },
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
])
