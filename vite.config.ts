import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import dts from 'vite-plugin-dts'
import { isAbsolute, resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src'],
      exclude: ['src/**/*.test.ts'],
      outDir: 'dist',
      rollupTypes: false,
    }),
  ],
  build: {
    lib: {
      // Multi-entry, because the subpath exports are not reachable from the barrel:
      // `./i18n` emitted a .d.ts but no .js, so pointing that export at dist would have
      // resolved to a file the build never wrote.
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'i18n/index': resolve(__dirname, 'src/i18n/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      /*
       * Externalise every bare specifier, rather than listing them.
       *
       * The list this replaces was hand-maintained and missed transitive CJS:
       * `use-sync-external-store` was bundled in and emitted under
       * dist/node_modules/, `require` calls intact. Those throw the moment a consumer
       * loads the package outside a CJS-capable context —
       *
       *   Error: Calling `require` for "react" in an environment that doesn't expose
       *   the `require` function
       *
       * — which is how 0.22.0 broke four of AIHR's component test files. Raw source
       * never had the problem because nothing was ever bundled.
       *
       * A library declares its dependencies and lets the consumer install them; the only
       * thing it should bundle is its own modules. Anything not starting with `.` or `/`
       * is somebody else's.
       */
      // `isAbsolute`, not a leading slash: with preserveModules rollup hands this
      // resolved paths, and on Windows those start with a drive letter — so a slash
      // test externalised the library's OWN modules and emitted a 7 kB stub.
      external: (id: string) => !id.startsWith('.') && !isAbsolute(id),
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
      },
    },
    sourcemap: true,
    minify: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
