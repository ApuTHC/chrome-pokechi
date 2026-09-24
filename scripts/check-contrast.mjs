#!/usr/bin/env node
/**
 * S3 — WCAG 1.4.3 (AA) contrast audit for every text/background pair the
 * Pokechi surfaces actually paint.
 *
 * The token half of the list reads src/styles/tokens.css at run time, so
 * bumping a colour there is what this script judges — it can't drift from
 * the palette. Pairs that come from a page's own sheet (or from an inline
 * style in TS) are spelled out with the literal value that sheet uses.
 *
 *   node scripts/check-contrast.mjs        (or: npm run check:contrast)
 *
 * Exits 1 if any pair is below its threshold, printing the ratio and the
 * (L1+0.05)/(L2+0.05) computation for each.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/* ---------------------------------------------------------------- colors */

function parseColor(value) {
  const v = String(value).trim()
  if (v.startsWith('#')) {
    const hex = v.slice(1)
    if (hex.length === 3 || hex.length === 4) {
      const [r, g, b, a] = [...hex].map((c) => parseInt(c + c, 16))
      return [r, g, b, hex.length === 4 ? a / 255 : 1]
    }
    if (hex.length === 6 || hex.length === 8) {
      const n = parseInt(hex.slice(0, 6), 16)
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255, hex.length === 8 ? parseInt(hex.slice(6), 16) / 255 : 1]
    }
    return null
  }
  const m = v.match(/^rgba?\(([^)]+)\)$/)
  if (m) {
    const parts = m[1].split(',').map((p) => parseFloat(p.trim()))
    if (parts.length >= 3 && parts.every((p) => Number.isFinite(p))) {
      return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1]
    }
  }
  return null
}

/** Composite a (possibly translucent) layer over an opaque backdrop. */
function over(fg, bg) {
  const a = fg[3]
  return [
    fg[0] * a + bg[0] * (1 - a),
    fg[1] * a + bg[1] * (1 - a),
    fg[2] * a + bg[2] * (1 - a),
    1,
  ]
}

function luminance([r, g, b]) {
  const lin = [r, g, b].map((c) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
}

function ratio(fg, bg) {
  const l1 = luminance(fg)
  const l2 = luminance(bg)
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

/* --------------------------------------------------------------- tokens */

// tokens.css is the palette; pokedex.css adds a handful of page-level
// aliases in its own :root (--muted, --card-bg, …). Both are read so the
// audit always runs against what the pages really resolve.
const tokenFiles = ['src/styles/tokens.css', 'src/pokedex/pokedex.css']
const TOKENS = new Map()
for (const file of tokenFiles) {
  const css = readFileSync(resolve(ROOT, file), 'utf8')
  for (const m of css.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
    if (!TOKENS.has(m[1])) TOKENS.set(m[1], m[2].trim())
  }
}

function resolveToken(name, seen = new Set()) {
  if (seen.has(name)) throw new Error(`token cycle: ${name}`)
  seen.add(name)
  const raw = TOKENS.get(name)
  if (raw === undefined) throw new Error(`unknown token: --${name}`)
  const ref = raw.match(/^var\(--([a-z0-9-]+)\)$/)
  return ref ? resolveToken(ref[1], seen) : raw
}

/** '--token' | '#hex' | 'rgba(...)' */
function colorOf(spec) {
  const raw = spec.startsWith('--') ? resolveToken(spec.slice(2)) : spec
  const color = parseColor(raw)
  if (!color) throw new Error(`not a plain colour: ${spec} -> ${raw}`)
  return color
}

/** bg: a token/hex, or a stack of layers listed topmost first. */
function backgroundOf(spec) {
  const layers = Array.isArray(spec) ? spec : [spec]
  let color = colorOf(layers[layers.length - 1])
  for (let i = layers.length - 2; i >= 0; i -= 1) color = over(colorOf(layers[i]), color)
  return color
}

/* ---------------------------------------------------------------- pairs */

// AA (WCAG 1.4.3): 4.5:1 for body text, 3:1 for large text and for the
// non-text UI components WCAG 1.4.11 covers (focus rings, borders).
const AA = 4.5
const AA_LARGE = 3

const PAIRS = [
  /* popup ------------------------------------------------------------- */
  ['popup .stat-label (9px)', '--muted-text', '--bg-secondary', AA],
  ['popup .stat-value (13px bold)', '--accent', '--bg-secondary', AA],
  ['popup .xp-details (10px)', '--text-muted', ['--card-glass', '--bg-primary'], AA],
  ['popup .level-tag (11px)', '--text-secondary', '--surface', AA],
  ['popup .control-row (12px)', '--text-secondary', '--bg-secondary', AA],
  ['popup .btn-action (11px bold)', '--text-strong', '--surface', AA],
  ['popup .btn-action:hover', '--text-strong', '--surface-raised', AA],
  ['popup .language-select (11px)', '--text-strong', '--surface', AA],
  // .btn-pokedex paints a gradient; #dc2626 is its lightest stop.
  ['popup .btn-pokedex (11px bold)', '#ffffff', '#dc2626', AA],
  // popup.ts egg badge: the one .type-badge with no type colour behind it.
  ['popup egg badge (popup.ts)', '--text-secondary', '--surface', AA],
  ['popup .pet-name (16px bold)', '--text-primary', ['--card-glass', '--bg-primary'], AA],

  /* new tab ------------------------------------------------------------ */
  ['newtab search input (15px)', '--text-primary', '--bg-secondary', AA],
  ['newtab shortcut label (11px)', '--text-secondary', ['--card-glass', '--bg-primary'], AA],
  ['newtab footer (11px)', '--muted-text', '--bg-primary', AA],
  ['newtab shortcut icon button (11px)', '--muted-text', '--bg-primary', AA],
  ['newtab #ntp-off-msg (12px)', '--muted-text', '--bg-primary', AA],
  ['newtab .shortcut:hover label (11px)', '--text-secondary', '--bg-secondary', AA],
  ['newtab .fallback-icon (14px bold)', '--accent', '--surface', AA],
  // Gradient-clipped text: the darkest stop is the worst case.
  ['brand gradient text, darkest stop', '#f97316', '--bg-primary', AA],
  ['showcase title gradient, darkest stop', '#818cf8', '--bg-primary', AA],
  ['newtab showcase title (20px bold)', '--text-primary', ['--card-glass', '--bg-primary'], AA],

  /* pokedex ------------------------------------------------------------ */
  ['pokedex .subtitle (13px)', '--muted', '--bg-primary', AA],
  ['pokedex .counter-label (11px, 85% alpha)', '--text-primary', '--bg-secondary', AA, 0.85],
  ['pokedex .bag-tab (11px)', '--muted', '--bg-secondary', AA],
  ['pokedex .bag-tab:hover (11px)', '--text-secondary', '--surface', AA],
  ['pokedex .badge-gen-tab (11px)', '--muted', '--bg-secondary', AA],
  ['pokedex .badge-gen-tab:hover (11px)', '--text-secondary', '--surface', AA],
  ['pokedex .badge-gen-tab.is-selected (11px)', '#ffffff', '--surface', AA],
  ['pokedex .filter-chip (12px)', '--muted', '--bg-primary', AA],
  ['pokedex .filter-chip:hover (12px)', '--text-secondary', '--surface', AA],
  ['pokedex .filter-chip.is-selected (12px)', '--bg-primary', '--accent', AA],
  ['pokedex .type-filter-clear (11px)', '--muted', '--bg-secondary', AA],
  ['pokedex .type-filter-option (12px)', '--text-primary', '--bg-secondary', AA],
  ['pokedex .type-filter-option:hover (12px)', '--text-primary', '--surface', AA],
  ['pokedex .search (13px)', '--text-primary', '--bg-primary', AA],
  ['pokedex .item-card-description (9.5px)', '--muted', ['rgba(15, 23, 42, 0.7)', '--bg-secondary'], AA],
  ['pokedex .item-card-count (11px bold)', '--text-primary', ['rgba(15, 23, 42, 0.7)', '--bg-secondary'], AA],
  ['pokedex .badge-requirement (9px)', '--muted', ['rgba(15, 23, 42, 0.7)', '--bg-secondary'], AA],
  ['pokedex .badge-requirement.is-met (9px)', '#6bbf6b', ['rgba(15, 23, 42, 0.7)', '--bg-secondary'], AA],
  ['pokedex .badge-card-status (9px)', '--muted', ['rgba(15, 23, 42, 0.7)', '--bg-secondary'], AA],
  ['pokedex .badge-card.is-earned status (9px bold)', '#e3a008', ['rgba(15, 23, 42, 0.7)', '--bg-secondary'], AA],
  ['pokedex .card-top (10px)', '--muted', ['--card-bg', '--bg-primary'], AA],
  ['pokedex .pokemon-name locked (12px)', '--muted', ['--card-bg', '--bg-primary'], AA],
  ['pokedex .back-stat-label (10px)', '--muted', ['--card-bg', '--bg-primary'], AA],
  ['pokedex .empty-state (13px)', '--muted', '--bg-primary', AA],
  ['pokedex .item-card-use-button (11px bold)', '#ffffff', '#2563eb', AA],
  ['pokedex .item-card-use-button:hover', '#ffffff', '#1d4ed8', AA],
  ['pokedex card control icon (11px)', '--text-muted', ['rgba(30, 41, 59, 0.9)', '--card-bg', '--bg-primary'], AA],
  ['pokedex card control icon:hover (11px)', '--text-strong', '--surface', AA],
  ['pokedex .shiny-toggle active (11px bold)', '--gold', ['rgba(250, 204, 21, 0.2)', 'rgba(30, 41, 59, 0.9)', '--card-bg', '--bg-primary'], AA],
  ['pokedex .face-toggle pressed (11px)', '--bg-primary', '--accent', AA],
  ['pokedex .bag-tab.is-selected (11px bold)', '--bg-primary', '--accent', AA],
  ['pokedex .active-badge (9px)', '--accent', ['rgba(56, 189, 248, 0.15)', '--card-bg', '--bg-primary'], AA],

  /* floating pet (shadow DOM over an arbitrary page: panelGlass is 92%
     opaque, so a white page is the worst-case backdrop) -------------- */
  ['pet .name-row (11px bold) over white page', '--text-strong', ['--panel-glass', '#ffffff'], AA],
  ['pet .xp-text (9px) over white page', '--text-muted', ['--panel-glass', '#ffffff'], AA],
  ['pet locate icon over white page', '--text-dim', ['--panel-glass', '#ffffff'], AA_LARGE],
  ['pet .xp-text (9px) over black page', '--text-muted', ['--panel-glass', '#000000'], AA],

  /* focus rings / states — WCAG 1.4.11 asks 3:1 for these -------------- */
  ['focus ring on --bg-primary', '--focus', '--bg-primary', AA_LARGE],
  ['focus ring on --bg-secondary', '--focus', '--bg-secondary', AA_LARGE],
  ['focus ring on --surface', '--focus', '--surface', AA_LARGE],
  ['xp fill on --surface (progress bar)', '--accent', '--surface', AA_LARGE],
]

/* ----------------------------------------------------------------- run */

let failed = 0
const rows = PAIRS.map(([label, fgSpec, bgSpec, min, fgAlpha]) => {
  const bg = backgroundOf(bgSpec)
  let fg = colorOf(fgSpec)
  if (fgAlpha !== undefined) fg = [fg[0], fg[1], fg[2], fgAlpha]
  // A translucent foreground (e.g. --text-dim) is measured as it actually
  // lands: composited over the very background it sits on.
  if (fg[3] < 1) fg = over(fg, bg)
  const value = ratio(fg, bg)
  const ok = value >= min
  if (!ok) failed += 1
  return { label, fg, bg, value, min, ok }
})

const hex = ([r, g, b]) =>
  '#' + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')
const lum = (c) => luminance(c).toFixed(4)

const width = Math.max(...rows.map((r) => r.label.length))
console.log('WCAG 1.4.3 contrast audit — (L1+0.05)/(L2+0.05)\n')
for (const r of rows) {
  const flag = r.ok ? 'PASS' : 'FAIL'
  console.log(
    `${flag}  ${r.label.padEnd(width)}  ${hex(r.fg)} on ${hex(r.bg)}  ` +
      `(${lum(r.fg)} / ${lum(r.bg)}) = ${r.value.toFixed(2)}:1  (min ${r.min})`
  )
}

console.log(`\n${rows.length - failed}/${rows.length} pairs meet their threshold.`)
if (failed > 0) {
  console.error(`${failed} failing pair(s).`)
  process.exit(1)
}
