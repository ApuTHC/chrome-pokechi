const esbuild = require('esbuild')
const path = require('path')
const fs = require('fs')

const isWatch = process.argv.includes('--watch')
// Production build: minified, no sourcemaps (`npm run build:prod`).
// Dev build stays unminified with maps so debugging is unchanged.
const isProd = process.argv.includes('--prod')

const sharedOptions = {
  bundle: true,
  target: 'es2022',
  minify: isProd,
  sourcemap: !isProd,
}

const buildOptions = [
  // 1. Background Service Worker
  {
    ...sharedOptions,
    entryPoints: [path.join(__dirname, 'src/background/service-worker.ts')],
    outfile: path.join(__dirname, 'dist/background.js'),
    format: 'esm',
  },
  // 2. Content Script (general: floating pet + click/typing activity)
  {
    ...sharedOptions,
    entryPoints: [path.join(__dirname, 'src/content/content-main.ts')],
    outfile: path.join(__dirname, 'dist/content.js'),
    format: 'iife',
  },
  // 2b. Site-specific trackers (YouTube / Gmail), injected only on their
  // own hosts by manifest.json (R10: minimum privilege).
  {
    ...sharedOptions,
    entryPoints: [path.join(__dirname, 'src/content/content-sites.ts')],
    outfile: path.join(__dirname, 'dist/content-sites.js'),
    format: 'iife',
  },
  // 3. Popup
  {
    ...sharedOptions,
    entryPoints: [path.join(__dirname, 'src/popup/popup.ts')],
    outfile: path.join(__dirname, 'dist/popup.js'),
    format: 'iife',
  },
  // 4. Pokedex (ESM + code splitting: dynamic `import()` of the per-language
  // dictionaries lands in separate chunks instead of bloating pokedex.js).
  // Splitting requires `outdir`; the entry still emits dist/pokedex.js.
  {
    ...sharedOptions,
    entryPoints: [path.join(__dirname, 'src/pokedex/pokedex.ts')],
    outdir: path.join(__dirname, 'dist'),
    chunkNames: 'chunks/[name]-[hash]',
    format: 'esm',
    splitting: true,
  },
  // 5. New Tab page
  {
    ...sharedOptions,
    entryPoints: [path.join(__dirname, 'src/newtab/newtab.ts')],
    outfile: path.join(__dirname, 'dist/newtab.js'),
    format: 'iife',
  },
]

// S2 — emit the TypeScript colour tables as real stylesheets: the pages link
// dist/type-badges.css and dist/rarity-borders.css instead of duplicating
// hex values (or running JS to paint base colours). The module is bundled for
// Node and evaluated in place, so there is no extra build tooling.
function makeStyleSheetsPlugin() {
  return {
    name: 'emit-style-sheets',
    setup(build) {
      build.onEnd((result) => {
        if (result.errors.length > 0) return
        const sheetModule = { exports: {} }
        const code = result.outputFiles[0].text
        Function('module', 'exports', 'require', code)(sheetModule, sheetModule.exports, require)
        fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true })
        fs.writeFileSync(
          path.join(__dirname, 'dist/type-badges.css'),
          sheetModule.exports.TYPE_BADGES_CSS
        )
        fs.writeFileSync(
          path.join(__dirname, 'dist/rarity-borders.css'),
          sheetModule.exports.RARITY_BORDERS_CSS
        )
        console.log('[Success] Wrote dist/type-badges.css + dist/rarity-borders.css')
      })
    },
  }
}

const styleSheetOptions = {
  entryPoints: [path.join(__dirname, 'src/common/style-sheets.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  write: false,
  logLevel: 'silent',
  plugins: [makeStyleSheetsPlugin()],
}

async function run() {
  console.log('[Pokechi Build] Compiling TypeScript bundles with esbuild...')
  try {
    // Fresh dist on full builds so hashed chunks from a previous build
    // don't accumulate (watch mode keeps dist untouched).
    if (!isWatch) {
      fs.rmSync(path.join(__dirname, 'dist'), { recursive: true, force: true })
    }
    for (const opt of buildOptions) {
      if (isWatch) {
        const ctx = await esbuild.context(opt)
        await ctx.watch()
        console.log(`[Watch] Watching ${opt.entryPoints[0]}...`)
      } else {
        await esbuild.build(opt)
        console.log(`[Success] Built ${opt.outfile ?? opt.outdir}`)
      }
    }
    // Colour sheets (S2) — emitted on every build, and re-emitted on change
    // while watching, so dist/*.css never goes stale against the TS tables.
    if (isWatch) {
      const sheetCtx = await esbuild.context(styleSheetOptions)
      await sheetCtx.watch()
      console.log('[Watch] Watching src/common/style-sheets.ts (colour sheets)...')
    } else {
      await esbuild.build(styleSheetOptions)
    }
    console.log('[Pokechi Build] All bundles compiled successfully!')
  } catch (err) {
    console.error('[Pokechi Build] Build failed:', err)
    process.exit(1)
  }
}

run()
