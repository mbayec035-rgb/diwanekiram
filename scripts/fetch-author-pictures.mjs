/* Téléchargement des portraits d'auteurs dans public/authors/.
 *
 * Les images sont servies par le stockage du catalogue ; tant que ce
 * stockage est indisponible, le script le signale et l'interface affiche
 * un monogramme à la place. Après téléchargement, relancer :
 *   npm run data:extract
 * pour reporter les chemins dans public/data/authors.json.
 *
 * Usage : npm run authors:pictures [-- --force]
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = path.join(ROOT, 'public', 'authors')
const AUTHORS_FILE = path.join(ROOT, 'public', 'data', 'authors.json')

const MEDIA_BASES = [
  'https://api.xassida.sn/storage/v1/object/public/images',
  'https://supabasekong-x4kwswco88so0sow0kco808s.xassida.sn/storage/v1/object/public/images',
]

const force = process.argv.includes('--force')

/* Mémo du chunk de données : relu une seule fois par exécution. */
let rawAuthorsCache = null

if (!fs.existsSync(AUTHORS_FILE)) {
  console.error('public/data/authors.json est absent : lancer d\'abord npm run data:extract.')
  process.exit(1)
}

fs.mkdirSync(OUT_DIR, { recursive: true })

/* Les chemins d'origine vivent dans les données brutes du catalogue :
   on relit le chunk pour récupérer le champ `picture` de chaque auteur. */
const remotePaths = await readRawAuthors()

let downloaded = 0
let skipped = 0
const failures = []

for (const author of remotePaths) {
  const target = path.join(OUT_DIR, author.file)

  if (fs.existsSync(target) && !force) {
    console.log(`· ${author.file} (déjà présent)`)
    skipped += 1
    continue
  }

  const result = await download(author.file)
  if (result.ok) {
    console.log(`✓ ${author.file} (${(result.size / 1024).toFixed(0)} Ko)`)
    downloaded += 1
  } else {
    console.log(`✗ ${author.file} — ${result.reason}`)
    failures.push({ file: author.file, reason: result.reason })
  }
}

console.log(`\n${downloaded} téléchargé(s), ${skipped} déjà présent(s), ${failures.length} échec(s).`)

if (failures.length === remotePaths.length) {
  console.error(
    '\nLe stockage d\'images du catalogue ne répond pas (503). ' +
      'Relancer cette commande plus tard ; en attendant, les initiales font office de portrait.',
  )
  process.exitCode = 1
}

if (downloaded > 0) {
  console.log('\nRelancer `npm run data:extract` pour enregistrer les portraits dans authors.json.')
}

/* ------------------------------------------------------------------ */

async function readRawAuthors() {
  if (rawAuthorsCache) return rawAuthorsCache

  const site = 'https://www.xassida.sn'
  const html = await (await fetch(`${site}/`)).text()
  const urls = new Set()
  for (const match of html.matchAll(/\/_next\/static\/[^"']+\.js/g)) urls.add(site + match[0])

  let best = null

  for (const url of urls) {
    const code = await (await fetch(url)).text()
    let cursor = code.indexOf("JSON.parse('")
    while (cursor !== -1) {
      const literal = readJsStringLiteral(code, cursor + 'JSON.parse('.length)
      if (literal && literal.length > 100_000 && literal.includes('ar_name')) {
        if (!best || literal.length > best.size) best = { size: literal.length, literal }
      }
      cursor = code.indexOf("JSON.parse('", cursor + 1)
    }
  }

  if (!best) throw new Error('Jeu de données du catalogue introuvable.')

  const payload = JSON.parse(decodeLiteral(best.literal))
  const tables = payload?.changes ?? payload
  const rows = new Map()
  for (const row of tables.authors?.created ?? []) rows.set(String(row.id), row)
  for (const row of tables.authors?.updated ?? []) rows.set(String(row.id), { ...rows.get(String(row.id)), ...row })

  rawAuthorsCache = [...rows.values()]
    .filter((author) => author.picture)
    .map((author) => ({
      id: String(author.id),
      name: author.name,
      file: path.basename(author.picture),
    }))

  return rawAuthorsCache
}

function readJsStringLiteral(code, start) {
  if (code[start] !== "'") return null

  let out = ''
  let index = start + 1

  while (index < code.length) {
    const char = code[index]
    if (char === '\\') {
      out += code[index] + code[index + 1]
      index += 2
      continue
    }
    if (char === "'") return out
    if (char === '\n') return null
    out += char
    index += 1
  }

  return null
}

function decodeLiteral(literal) {
  return literal.replace(/\\(x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|.)/g, (_match, group) => {
    if (group[0] === 'x') return String.fromCharCode(parseInt(group.slice(1), 16))
    if (group[0] === 'u') return String.fromCodePoint(parseInt(group.slice(1), 16))
    const named = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v' }
    return group in named ? named[group] : group
  })
}

async function download(file) {
  const relative = file.split('/').map(encodeURIComponent).join('/')

  for (const base of MEDIA_BASES) {
    try {
      const response = await fetch(`${base}/authors/${relative}`, { redirect: 'follow' })
      if (!response.ok) continue

      const type = response.headers.get('content-type') ?? ''
      if (!type.startsWith('image/')) continue

      const buffer = Buffer.from(await response.arrayBuffer())
      if (buffer.length < 512) continue

      fs.writeFileSync(path.join(OUT_DIR, file), buffer)
      return { ok: true, size: buffer.length }
    } catch {
      /* on essaie la base suivante */
    }
  }

  return { ok: false, reason: 'stockage indisponible (503) ou fichier absent' }
}