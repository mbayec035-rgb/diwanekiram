/**
 * Figeage de la source : content/source/residu.json
 * ---------------------------------------------------------------------------
 * Le site markazulfuhum.app a migré de Next.js vers une API. La nouvelle API
 * n'expose plus que 241 œuvres / 8 867 lignes, alors que le corpus construit en
 * compte 277 œuvres / 11 287 versets. Les 36 œuvres disparues vivent encore
 * uniquement dans public/data/ : sans ce figeage, le prochain `npm run
 * data:build` les effacerait.
 *
 * Ce script fige donc le strict nécessaire pour que le build reste complet et
 * hors ligne :
 *   - les œuvres que content/oeuvres/ ne dépose pas (texte intégral) ;
 *   - les traductions françaises qu'aucun dépôt ne porte déjà : les fichiers
 *     de traduction sont rares dans content/, et la plupart de ceux qui
 *     existent dans public/data/ n'ont nulle part ailleurs leur texte ;
 *   - les auteurs et les pistes audio.
 *
 * Le texte des 241 œuvres déposées reste la propriété de content/oeuvres/ : il
 * n'est pas dupliqué ici. Il en va de même pour une traduction déjà déposée
 * dans content/traductions/ ou content/oeuvres/<slug>.fr.json : la figer une
 * seconde fois créerait deux sources de vérité pour le même texte.
 *
 * Usage : node scripts/snapshot-source.mjs [--check]
 */

import { existsSync } from 'node:fs'
import { readFile, readdir, writeFile, mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA_DIR = path.join(ROOT, 'public', 'data')
const WORKS_DIR = path.join(ROOT, 'content', 'oeuvres')
const AUTHORS_DIR = path.join(ROOT, 'content', 'auteurs')
const OUT_FILE = path.join(ROOT, 'content', 'source', 'residu.json')

const isCheck = process.argv.includes('--check')

const log = (...args) => console.log(...args)
const step = (title) => log(`\n\x1b[36m▸ ${title}\x1b[0m`)

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'))

/* ------------------------------------------------------------------ *
 * 1. Inventaire
 * ------------------------------------------------------------------ */

step('Inventaire du corpus construit')

if (!existsSync(DATA_DIR)) {
  throw new Error('public/data/ absent : lancez d’abord un build sur une base saine.')
}

const manifest = await readJson(path.join(DATA_DIR, 'xassidas.json'))
const builtAuthors = await readJson(path.join(DATA_DIR, 'authors.json'))
const audio = await readJson(path.join(DATA_DIR, 'audio.json'))

/* Un dépôt peut être l'œuvre seule (slug.json) ou porter aussi ses
   traductions (slug.fr.json). Seuls les fichiers slug.json sont des œuvres :
   compter les .fr.json ici ferait dire au journal qu'il reste une œuvre de
   moins à figer qu'il n'y en a réellement. */
const deposited = new Set(
  (await readdir(WORKS_DIR))
    .filter((file) => file.endsWith('.json') && !file.endsWith('.fr.json'))
    .map((file) => file.replace(/\.json$/, '')),
)

log(`  œuvres construites  ${manifest.length}`)
log(`  œuvres déposées      ${deposited.size}`)
log(`  résidu à figer       ${manifest.length - deposited.size} œuvre(s)`)

/* ------------------------------------------------------------------ *
 * 2. Textes des œuvres absentes de content/
 * ------------------------------------------------------------------ */

step('Figeage des œuvres non déposées')

const works = []
let verseCount = 0

for (const meta of manifest) {
  if (deposited.has(meta.slug)) continue

  const file = path.join(DATA_DIR, 'verses', `${meta.slug}.json`)
  if (!existsSync(file)) {
    throw new Error(`public/data/verses/${meta.slug}.json manquant : corpus incohérent.`)
  }

  const built = await readJson(file)
  const chapters = []
  let verses = 0

  for (const chapter of built.chapters) {
    const list = (chapter.verses ?? []).map((verse) => {
      verses += 1
      const out = { id: verse.id, n: verse.n, ar: verse.ar, tr: verse.tr ?? '' }
      if (verse.sadr) out.sadr = verse.sadr
      if (verse.adj) out.adj = verse.adj
      return out
    })

    chapters.push({ id: chapter.id, n: chapter.n, verses: list })
  }

  verseCount += verses
  works.push({
    id: meta.id,
    slug: meta.slug,
    name: meta.name,
    nameAr: meta.nameAr,
    authorId: meta.authorId,
    ...(meta.meter ? { meter: meta.meter } : {}),
    ...(meta.rhyme ? { rhyme: meta.rhyme } : {}),
    ...(meta.category ? { category: meta.category } : {}),
    chapters,
  })
}

log(`  ${works.length} œuvre(s), ${verseCount} verset(s)`)

/* ------------------------------------------------------------------ *
 * 3. Traductions françaises
 * ------------------------------------------------------------------ */

step('Figeage des traductions')

const translations = {}
const translationDir = path.join(DATA_DIR, 'translations')
const translationFiles = existsSync(translationDir)
  ? (await readdir(translationDir)).filter((file) => file.endsWith('.json'))
  : []

let ignorees = 0

/* Une traduction n'est figée que si aucun dépôt ne la porte : c'est le
   build qui fait foi sur ce point, il lit content/traductions/ et
   content/oeuvres/<slug>.fr.json. Figer aussi celles-là donnerait deux
   sources de vérité au même texte — et, à l'inverse, écarter celles d'une
   œuvre simplement déposée ferait perdre 242 traductions qui n'existent
   que dans ce figeage. */
const translationsDeposees = new Set()

for (const file of await readdir(WORKS_DIR)) {
  if (file.endsWith('.fr.json')) translationsDeposees.add(file.replace(/\.fr\.json$/, ''))
}

const traductionsDir = path.join(ROOT, 'content', 'traductions')
if (existsSync(traductionsDir)) {
  for (const file of await readdir(traductionsDir)) {
    if (!file.endsWith('.json')) continue
    translationsDeposees.add(file.replace(/\.fr\.json$/i, '').replace(/\.json$/i, ''))
  }
}

for (const file of translationFiles) {
  const slug = file.replace(/\.fr\.json$/, '')

  if (translationsDeposees.has(slug)) {
    ignorees += 1
    continue
  }

  const payload = await readJson(path.join(translationDir, file))
  for (const [verseId, text] of Object.entries(payload.verses ?? {})) {
    if (!text) continue
    translations[verseId] = text
  }
}

log(`  ${Object.keys(translations).length} traduction(s) depuis ${translationFiles.length - ignorees} fichier(s)${ignorees > 0 ? `, ${ignorees} déjà déposé(s) écarté(s)` : ''}`)

/* ------------------------------------------------------------------ *
 * 4. Auteurs et audio
 * ------------------------------------------------------------------ */

step('Figeage des auteurs et de l’audio')

/* Même logique que pour les œuvres : une notice présente dans content/auteurs/
   est la propriété du dépôt. La figer aussi ferait entrer l'auteur en
   collision avec sa propre notice locale au moment de la fusion. */
const depositedAuthors = new Set(
  existsSync(AUTHORS_DIR)
    ? (await readdir(AUTHORS_DIR))
        .filter((file) => file.endsWith('.json'))
        .map((file) => file.replace(/\.json$/, ''))
    : [],
)

const authors = builtAuthors
  .filter((author) => !depositedAuthors.has(author.slug))
  .map((author) => ({
    id: author.id,
    slug: author.slug,
    name: author.name,
    nameAr: author.nameAr,
    tariha: author.tariha ?? 'tidjan',
    anonymous: Boolean(author.anonymous),
    bio: author.bio ?? '',
    bioSource: author.bioSource ?? 'none',
    picture: author.picture ?? '',
  }))

log(
  `  ${authors.length} auteur(s) figé(s) sur ${builtAuthors.length} ` +
    `(${depositedAuthors.size} notice(s) restent la propriété de content/auteurs/) | ` +
    `${audio.length} œuvre(s) avec audio`,
)

/* ------------------------------------------------------------------ *
 * 5. Écriture
 * ------------------------------------------------------------------ */

const snapshot = {
  generatedAt: new Date().toISOString(),
  note:
    "Works, translations and metadata that the markazulfuhum.app API no longer " +
    'serves. Frozen from public/data so that `npm run data:build` stays complete ' +
    'and works offline. Do not hand-edit: regenerate with node scripts/snapshot-source.mjs',
  origin: 'public/data (figeage local)',
  totals: { works: works.length, verses: verseCount, translations: Object.keys(translations).length, authors: authors.length },
  authors,
  audio,
  translations,
  xassidas: works,
}

const serialised = `${JSON.stringify(snapshot, null, 2)}\n`

if (isCheck) {
  if (!existsSync(OUT_FILE)) {
    log('\n  aucun figeage : lancez sans --check\n')
    process.exitCode = 1
  } else {
    /* generatedAt est un horodatage : le neutraliser, sinon la comparaison ne
       peut jamais aboutir. */
    const stored = JSON.parse(await readFile(OUT_FILE, 'utf8'))
    delete stored.generatedAt
    delete snapshot.generatedAt

    const { size } = await stat(OUT_FILE)
    const identical =
      JSON.stringify(stored, null, 2) === JSON.stringify(snapshot, null, 2)

    if (identical) {
      log(`\n  à jour (${Math.round(size / 1024)} Ko)`)
    } else {
      log('\n  le figeage diffère du corpus construit : relancez sans --check')
      process.exitCode = 1
    }
  }
} else {
  await mkdir(path.dirname(OUT_FILE), { recursive: true })
  await writeFile(OUT_FILE, serialised, 'utf8')
  const { size } = await stat(OUT_FILE)
  log(`\n  écrit : content/source/residu.json (${Math.round(size / 1024)} Ko)`)
  log('  Vérifiez avec : node scripts/snapshot-source.mjs --check\n')
}