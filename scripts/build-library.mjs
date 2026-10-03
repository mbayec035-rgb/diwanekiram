#!/usr/bin/env node
/**
 * DiwaneKiram — construction de la bibliothèque
 *
 * Fusionne deux sources puis écrit le résultat dans public/data/ :
 *
 *   1. le catalogue publié par xassida.sn (scripts/extract-content.mjs)
 *   2. les textes déposés dans content/ (auteurs, œuvres, traductions)
 *
 *   node scripts/build-library.mjs
 *
 * L'écriture est non destructive : le script calcule la liste complète
 * des fichiers attendus, les écrit, puis supprime uniquement ceux qui
 * ne sont plus attendus. Un `rm -rf` brutal effacerait les textes
 * ajoutés à la main.
 *
 * Le build échoue si le catalogue présente une anomalie (slug en double,
 * œuvre sans auteur résolu, traduction orpheline…).
 */

import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadSourceCatalogue } from './extract-content.mjs'
import {
  addWork,
  chaptersOf,
  clean,
  emptyCatalogue,
  findIntegrityProblems,
  mergeAuthorsInto,
  mergeInto,
  normaliseWork,
  resolveLocalPortrait,
  uniqueSlug,
  versesOf,
} from './lib/catalogue.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT_DIR = path.join(ROOT, 'content')
const OUT_DIR = path.join(ROOT, 'public', 'data')
const PORTRAIT_DIR = path.join(ROOT, 'public', 'authors')

const log = (...args) => console.log(...args)
const step = (title) => log(`\n\x1b[36m▸ ${title}\x1b[0m`)
const ok = (value) => `\x1b[32m${value}\x1b[0m`

/* ------------------------------------------------------------------ *
 * 1. Lecture des textes déposés dans content/
 * ------------------------------------------------------------------ */

async function listFiles(directory, extension) {
  if (!existsSync(directory)) return []
  const names = await readdir(directory)
  return names
    .filter((name) => name.toLowerCase().endsWith(extension))
    .sort()
    .map((name) => path.join(directory, name))
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch (error) {
    throw new Error(`${path.relative(ROOT, file)} : JSON illisible (${error.message})`)
  }
}

/**
 * Découpe un texte brut en chapitres et versets.
 *
 * Convention : un verset par ligne ; une ligne vide ouvre un nouveau
 * chapitre. Le nombre de chapitres est donc flexible.
 */
function parsePlainText(text) {
  const chapters = []
  let current = null

  for (const rawLine of text.split(/\r?\n/)) {
    const line = clean(rawLine)
    if (line.length === 0) {
      if (current && current.verses.length > 0) {
        chapters.push(current)
        current = null
      }
      continue
    }
    if (!current) current = { n: chapters.length + 1, title: null, verses: [] }
    current.verses.push({ ar: line })
  }

  if (current && current.verses.length > 0) chapters.push(current)
  return chapters
}

/** Identifiant d'auteur : le champ `id` s'il est fourni, sinon le slug. */
function authorIdOf(raw, fallback) {
  const candidate = raw.id ?? raw.slug ?? fallback
  return String(candidate)
}

async function loadLocalCatalogue() {
  const catalogue = emptyCatalogue()
  const usedAuthorSlugs = new Set()
  const usedWorkSlugs = new Set()
  const stats = { authors: 0, works: 0, plainText: 0 }

  if (!existsSync(CONTENT_DIR)) {
    log('  content/ absent : aucune apport local')
    return { catalogue, stats }
  }

  /* --- auteurs --- */
  for (const file of await listFiles(path.join(CONTENT_DIR, 'auteurs'), '.json')) {
    const raw = await readJson(file)
    const fallback = path.basename(file, '.json')
    const id = authorIdOf(raw, fallback)

    if (catalogue.authors.some((author) => author.id === id)) {
      throw new Error(`Auteur « ${id} » déclaré deux fois dans content/auteurs/.`)
    }

    const name = clean(raw.name ?? '')
    if (!name) throw new Error(`${path.relative(ROOT, file)} : champ « name » manquant.`)

    catalogue.authors.push({
      id,
      /* Le nom du fichier fait foi pour le slug, comme pour les œuvres. */
      slug: uniqueSlug(raw.slug ?? fallback, usedAuthorSlugs),
      name,
      nameAr: clean(raw.nameAr ?? ''),
      tariha: clean(raw.tariha ?? 'tidjan'),
      anonymous: Boolean(raw.anonymous),
      bio: clean(raw.bio ?? ''),
      bioSource: clean(raw.source ?? '') ? 'local' : 'none',
      picture: raw.picture ? resolveLocalPortrait(raw.picture, PORTRAIT_DIR) : null,
    })
    stats.authors += 1
  }

  /* --- œuvres --- */
  const plainTextFiles = await listFiles(path.join(CONTENT_DIR, 'texte'), '.txt')
  const plainTextStems = new Set(
    plainTextFiles.map((file) => path.basename(file).replace(/\.txt$/i, '')),
  )

  /* Un texte brut et sa fiche ne comptent qu'une fois, et les suffixes
     « .fr.json » sont des traductions, pas des œuvres. */
  const workFiles = [
    ...(await listFiles(path.join(CONTENT_DIR, 'oeuvres'), '.json')).filter((file) => {
      const name = path.basename(file).toLowerCase()
      return !name.endsWith('.fr.json') && !plainTextStems.has(path.basename(file, '.json'))
    }),
    ...plainTextFiles,
  ]

  for (const file of workFiles) {
    const stem = path.basename(file).replace(/\.(json|txt)$/i, '')
    const isPlainText = file.toLowerCase().endsWith('.txt')

    let raw
    if (isPlainText) {
      const metaFile = path.join(CONTENT_DIR, 'oeuvres', `${stem}.json`)
      if (!existsSync(metaFile)) {
        throw new Error(
          `${path.relative(ROOT, file)} : la fiche ${path.relative(ROOT, metaFile)} est absente.`,
        )
      }
      raw = {
        ...(await readJson(metaFile)),
        /* Le texte brut prime sur les versets éventuellement décrits dans la fiche. */
        chapters: parsePlainText(await readFile(file, 'utf8')),
      }
      stats.plainText += 1
    } else {
      raw = await readJson(file)
    }

    for (const field of ['source', 'license']) {
      if (!clean(raw[field] ?? '')) {
        throw new Error(
          `${path.relative(ROOT, file)} : champ « ${field} » manquant. ` +
            `Toute œuvre versée au corpus doit être traçable.`,
        )
      }
    }

    /* Le nom du fichier fait foi pour le slug : renommer le titre d'une
       œuvre ne doit pas casser son adresse ni ses traductions. */
    addWork(
      catalogue,
      normaliseWork(
        { ...raw, id: stem, slug: stem, authorId: raw.authorId ?? raw.author },
        { origin: path.relative(ROOT, file), usedSlugs: usedWorkSlugs },
      ),
    )
    stats.works += 1
  }

  return { catalogue, stats }
}

/* ------------------------------------------------------------------ *
 * 2. Traductions françaises déposées dans content/
 * ------------------------------------------------------------------ */

async function loadLocalTranslations(catalogue) {
  const files = [
    ...(await listFiles(path.join(CONTENT_DIR, 'traductions'), '.json')),
    ...(await listFiles(path.join(CONTENT_DIR, 'oeuvres'), '.fr.json')),
  ]

  if (files.length === 0) return 0

  const slugByVerseId = new Map()
  for (const verse of catalogue.verses) slugByVerseId.set(verse.id, verse.xassidaId)

  const knownWorks = new Map(catalogue.xassidas.map((xassida) => [xassida.slug, xassida.id]))
  let applied = 0

  for (const file of files) {
    const name = path.basename(file)
    const slug = name.replace(/\.fr\.json$/i, '').replace(/\.json$/i, '')
    const workId = knownWorks.get(slug)

    if (!workId) {
      throw new Error(
        `${path.relative(ROOT, file)} : aucune œuvre « ${slug} » dans le catalogue. ` +
          `Le nom du fichier doit correspondre au slug de l'œuvre.`,
      )
    }

    const raw = await readJson(file)
    const entries = raw.verses ?? raw
    if (typeof entries !== 'object' || entries === null || Array.isArray(entries)) {
      throw new Error(`${path.relative(ROOT, file)} : objet « verses » attendu.`)
    }

    /* Une clef qui ne correspond à aucun verset de l'œuvre est une faute de
       frappe. La signaler évite de perdre une traduction en silence. */
    const orphans = []

    for (const [verseId, text] of Object.entries(entries)) {
      if (slugByVerseId.get(verseId) !== workId) {
        orphans.push(verseId)
        continue
      }
      const cleaned = clean(String(text))
      if (cleaned.length === 0) continue
      catalogue.translations.set(verseId, cleaned)
      applied += 1
    }

    if (orphans.length > 0) {
      throw new Error(
        `${path.relative(ROOT, file)} : ${orphans.length} clef(s) de traduction ` +
          `ne correspondent à aucun verset de « ${slug} » — ${orphans.slice(0, 5).join(', ')}` +
          `${orphans.length > 5 ? ', …' : ''}`,
      )
    }
  }

  return applied
}

/* ------------------------------------------------------------------ *
 * 3. Écriture
 * ------------------------------------------------------------------ */

function serialise(value) {
  return `${JSON.stringify(value)}\n`
}

/** Liste récursive des fichiers présents sous un répertoire. */
async function walk(directory, prefix = '') {
  if (!existsSync(directory)) return []
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name
    const absolute = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await walk(absolute, relative)))
    } else if (entry.isFile()) {
      const info = await stat(absolute)
      files.push({ relative, bytes: info.size })
    }
  }

  return files
}

async function writeData() {
  const { problems, derived } = findIntegrityProblems(catalogue)
  if (problems.length > 0) {
    log('\n\x1b[31m✖ Catalogue non conforme — rien n’a été écrit.\x1b[0m')
    for (const problem of problems) log(`  · ${problem}`)
    throw new Error(`${problems.length} anomalie(s) bloquante(s).`)
  }

  step('Écriture de public/data/')

  const expected = new Map()
  let totalBytes = 0

  const write = async (relative, value) => {
    const payload = serialise(value)
    const target = path.join(OUT_DIR, relative)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, payload, 'utf8')
    expected.set(relative, Buffer.byteLength(payload, 'utf8'))
    totalBytes += Buffer.byteLength(payload, 'utf8')
  }

  const items = []

  for (const xassida of derived.xassidas) {
    const chapters = chaptersOf(catalogue, xassida.id)

    await write(`verses/${xassida.slug}.json`, {
      id: xassida.id,
      slug: xassida.slug,
      chapters: chapters.map((chapter) => {
        const verses = versesOf(catalogue, chapter.id)
        return {
          id: chapter.id,
          n: chapter.n,
          verseCount: verses.length,
          verses: verses.map((verse) => ({
            id: verse.id,
            n: verse.n,
            ar: verse.ar,
            tr: verse.tr,
            /* Les hémistiches ne sont émis que lorsqu'ils existent : les
               œuvres qui ne les fournissent pas gardent la forme d'avant. */
            ...(verse.sadr ? { sadr: verse.sadr } : {}),
            ...(verse.adj ? { adj: verse.adj } : {}),
          })),
        }
      }),
    })

    /* Le fichier de traduction est toujours écrit, avec une entrée par
       verset : il sert de squelette éditable aux textes non traduits. */
    const translationSkeleton = {}
    for (const chapter of chapters) {
      for (const verse of versesOf(catalogue, chapter.id)) {
        translationSkeleton[verse.id] = catalogue.translations.get(verse.id) ?? ''
      }
    }

    await write(`translations/${xassida.slug}.fr.json`, {
      id: xassida.id,
      slug: xassida.slug,
      lang: 'fr',
      verses: translationSkeleton,
    })

    items.push({
      id: xassida.id,
      slug: xassida.slug,
      chapters: xassida.chapterCount,
      verses: xassida.verseCount,
      translated: xassida.translatedCount,
      hasAudio: derived.audio.some((entry) => entry.xassidaId === xassida.id),
      file: `verses/${xassida.slug}.json`,
      translationsFile: `translations/${xassida.slug}.fr.json`,
      pendingTranslations: xassida.verseCount - xassida.translatedCount,
    })
  }

  await write('authors.json', derived.authors)
  await write('xassidas.json', derived.xassidas)
  await write('audio.json', derived.audio)

  const totals = {
    xassidas: derived.xassidas.length,
    chapters: derived.xassidas.reduce((total, xassida) => total + xassida.chapterCount, 0),
    verses: derived.xassidas.reduce((total, xassida) => total + xassida.verseCount, 0),
    translations: derived.xassidas.reduce((total, xassida) => total + xassida.translatedCount, 0),
    authors: derived.authors.length,
  }
  totals.translationRatio =
    totals.verses > 0 ? Math.round((totals.translations / totals.verses) * 100) : 0

  await write('manifest.json', {
    generatedAt: new Date().toISOString(),
    totals,
    items,
  })

  /* Suppression ciblée : seuls les fichiers qui ne sont plus attendus
     sont effacés. Rien d'autre n'est touché. */
  const stale = (await walk(OUT_DIR))
    .filter((file) => !expected.has(file.relative))
    .map((file) => file.relative)

  for (const relative of stale) {
    await rm(path.join(OUT_DIR, relative), { force: true })
  }

  return { totals, items, expected, stale, totalBytes, derived }
}

/* ------------------------------------------------------------------ *
 * 6. Exécution
 * ------------------------------------------------------------------ */

step('Lecture du catalogue xassida.sn')
const catalogue = await loadSourceCatalogue()

step('Apport local (content/)')
const { catalogue: local, stats } = await loadLocalCatalogue()
const localTranslations = await loadLocalTranslations(local)

step('Fusion')
log(`  source en ligne ${catalogue.xassidas.length} œuvre(s)`)
log(`  apport local     ${stats.works} œuvre(s), ${stats.authors} auteur(s)`)
log(`  textes bruts     ${stats.plainText}`)
log(`  traductions fr   ${localTranslations} verset(s)`)
mergeAuthorsInto(catalogue, local, 'content/')

/* Une œuvre locale peut prendre la place d'une œuvre de la source qui porte
   le même slug. On compte ces remplacements avant la fusion pour l'annoncer :
   elles modifient des œuvres déjà publiées, donc cela doit être visible. */
const sourceSlugsByWork = new Map(catalogue.xassidas.map((w) => [w.slug, w]))
const replaced = []
for (const work of local.xassidas) {
  const incumbent = sourceSlugsByWork.get(work.slug)
  if (incumbent) replaced.push({ slug: work.slug, name: work.name, was: incumbent.name })
}
mergeInto(catalogue, local, 'content/')

step('Contrôles')
const result = await writeData()
const { totals, derived, stale } = result

log(`  ${derived.xassidas.length} slug(s) unique(s)`)
log(
  `  ${derived.authors.filter((author) => author.bioSource !== 'none').length}/${derived.authors.length} auteur(s) avec notice`,
)
if (stale.length > 0) log(`  ${stale.length} fichier(s) obsolète(s) supprimé(s)`)
if (replaced.length > 0) {
  log(`  ${replaced.length} œuvre(s) remplacée(s) par l'apport local`)
  for (const item of replaced) log(`    ${item.slug} : « ${item.was} » -> « ${item.name} »`)
}

step('Résumé')
log(`  xassidas        ${totals.xassidas}`)
log(`  chapitres       ${totals.chapters}`)
log(`  versets         ${totals.verses}`)
log(`  traductions fr  ${totals.translations} (${totals.translationRatio} %)`)
log(`  auteurs         ${totals.authors}`)
log(`  poids json      ${(result.totalBytes / 1024 / 1024).toFixed(2)} Mo`)
log(`\n  ${result.items.filter((item) => item.translated === 0).length} œuvre(s) sans traduction FR`)
log(`  ${ok('bibliothèque écrite dans public/data/')}\n`)