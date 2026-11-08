/**
 * Copy the assets the bundler does not produce into dist.
 *
 * The stylesheets are consumed by the CONSUMER's Tailwind pipeline rather than ours —
 * theme.css carries Tailwind directives — so they ship verbatim instead of compiled. The
 * Vite plugins under src/vite are already plain JS with hand-written .d.ts files.
 *
 * They belong in dist because the package's entry points now resolve there: publishing a
 * package whose exports reach back into src is what this change exists to stop.
 */
import { copyFile, mkdir, readdir } from 'node:fs/promises'
import { dirname } from 'node:path'

const vitePlugins = (await readdir('src/vite'))
  .filter((name) => /\.(js|d\.ts)$/.test(name))
  .map((name) => [`src/vite/${name}`, `dist/vite/${name}`])

const assets = [
  ['src/theme.css', 'dist/theme.css'],
  ['src/scenes.css', 'dist/scenes.css'],
  ...vitePlugins,
]

for (const [from, to] of assets) {
  await mkdir(dirname(to), { recursive: true })
  await copyFile(from, to)
}
