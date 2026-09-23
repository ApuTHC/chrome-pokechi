const esbuild = require('esbuild')
const path = require('path')

const isWatch = process.argv.includes('--watch')

const buildOptions = [
  // 1. Background Service Worker
  {
    entryPoints: [path.join(__dirname, 'src/background/service-worker.ts')],
    outfile: path.join(__dirname, 'dist/background.js'),
    bundle: true,
    format: 'esm',
    target: 'es2022',
    sourcemap: true,
  },
  // 2. Content Script
  {
    entryPoints: [path.join(__dirname, 'src/content/content-main.ts')],
    outfile: path.join(__dirname, 'dist/content.js'),
    bundle: true,
    format: 'iife',
    target: 'es2022',
    sourcemap: true,
  },
  // 3. Popup
  {
    entryPoints: [path.join(__dirname, 'src/popup/popup.ts')],
    outfile: path.join(__dirname, 'dist/popup.js'),
    bundle: true,
    format: 'iife',
    target: 'es2022',
    sourcemap: true,
  },
  // 4. Pokedex
  {
    entryPoints: [path.join(__dirname, 'src/pokedex/pokedex.ts')],
    outfile: path.join(__dirname, 'dist/pokedex.js'),
    bundle: true,
    format: 'iife',
    target: 'es2022',
    sourcemap: true,
  },
]

async function run() {
  console.log('[Pokechi Build] Compiling TypeScript bundles with esbuild...')
  try {
    for (const opt of buildOptions) {
      if (isWatch) {
        const ctx = await esbuild.context(opt)
        await ctx.watch()
        console.log(`[Watch] Watching ${opt.entryPoints[0]}...`)
      } else {
        await esbuild.build(opt)
        console.log(`[Success] Built ${opt.outfile}`)
      }
    }
    console.log('[Pokechi Build] All bundles compiled successfully!')
  } catch (err) {
    console.error('[Pokechi Build] Build failed:', err)
    process.exit(1)
  }
}

run()
