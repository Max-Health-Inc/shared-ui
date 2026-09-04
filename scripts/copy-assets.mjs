/**
 * Copy the assets the bundler does not produce into dist.
 *
 * The stylesheets are consumed by the CONSUMER's Tailwind pipeline rather than ours —
 * theme.css carries Tailwind directives — so they ship verbatim instead of compiled. The
 * service worker helper is already plain JS with a hand-written .d.ts.
 *
 * They belong in dist because the package's entry points now resolve there: publishing a
 * package whose exports reach back into src is what this change exists to stop.
 */
import { copyFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

const assets = [
  ['src/theme.css', 'dist/theme.css'],
  ['src/scenes.css', 'dist/scenes.css'],
  ['src/vite/service-worker.js', 'dist/vite/service-worker.js'],
  ['src/vite/service-worker.d.ts', 'dist/vite/service-worker.d.ts'],
]

for (const [from, to] of assets) {
  await mkdir(dirname(to), { recursive: true })
  await copyFile(from, to)
}
