#!/usr/bin/env node
/**
 * DiwaneKiram — lecture du catalogue publié par xassida.sn
 *
 * Récupère le jeu de données embarqué dans le bundle public du site,
 * puis renvoie un catalogue normalisé. Ce module n'écrit rien :
 * c'est scripts/build-library.mjs qui fusionne le résultat avec les
 * textes déposés dans content/ puis produit public/data/.
 *
 *   node scripts/extract-content.mjs      # résumé seul
 *
 * L'API du site (api.xassida.sn) n'est pas utilisée : elle est hors
 * service de façon récurrente. Seul le bundle statique est lu.
 */

import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import {
  addWork,
  clean,
  cleanRichText,
  emptyCatalogue,
  normaliseWork,
  resolveLocalPortrait,
  slugify,
  uniqueSlug,
} from './lib/catalogue.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PORTRAIT_DIR = path.join(ROOT, 'public', 'authors')
const SITE = 'https://www.xassida.sn'

const log = (...args) => console.log(...args)
const step = (title) => log(`\n\x1b[36m▸ ${title}\x1b[0m`)

/* ------------------------------------------------------------------ *
 * 1. Localisation du bundle de données
 * ------------------------------------------------------------------ */

async function findDataChunk() {
  const html = await (await fetch(`${SITE}/`)).text()

  const urls = new Set()
  for (const match of html.matchAll(/\/_next\/static\/[^"']+\.js/g)) {
    urls.add(`${SITE}${match[0]}`)
  }

  log(`  ${urls.size} chunk(s) référencé(s) sur la page d'accueil`)

  let best = null

  for (const url of urls) {
    const response = await fetch(url)
    if (!response.ok) continue
    const code = await response.text()

    let cursor = code.indexOf("JSON.parse('")
    while (cursor !== -1) {
      const literal = readJsStringLiteral(code, cursor + 'JSON.parse('.length)
      if (literal && literal.length > 100_000 && literal.includes('ar_name')) {
        if (!best || literal.length > best.size) best = { url, code: literal }
      }
      cursor = code.indexOf("JSON.parse('", cursor + 1)
    }
  }

  if (!best) throw new Error('Aucun jeu de données trouvé dans les chunks publics.')
  return best
}

/** Lit un littéral JavaScript (guillemets simples) à partir du caractère d'ouverture. */
function readJsStringLiteral(code, start) {
  if (code[start] !== "'") return null

  let out = ''
  let i = start + 1

  while (i < code.length) {
    const char = code[i]

    if (char === '\\') {
      out += code[i] + code[i + 1]
      i += 2
      continue
    }
    if (char === "'") return out
    if (char === '\n') return null

    out += char
    i += 1
  }

  return null
}

/** Décode les échappements d'un littéral JavaScript, puis décode le JSON. */
function parseEmbeddedJson(literal) {
  const decoded = literal.replace(
    /\\(x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|.)/g,
    (_match, group) => {
      if (group[0] === 'x') return String.fromCharCode(parseInt(group.slice(1), 16))
      if (group[0] === 'u') return String.fromCodePoint(parseInt(group.slice(1), 16))
      const named = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v' }
      return group in named ? named[group] : group
    },
  )
  return JSON.parse(decoded)
}

/* ------------------------------------------------------------------ *
 * 2. Aplatissement des tables
 * ------------------------------------------------------------------ */

function flattenTables(payload) {
  const changes = payload?.changes ?? payload
  const tables = {}

  for (const [table, buckets] of Object.entries(changes)) {
    const rows = new Map()
    for (const row of buckets.created ?? []) rows.set(String(row.id), row)
    for (const row of buckets.updated ?? [])
      rows.set(String(row.id), { ...rows.get(String(row.id)), ...row })
    for (const row of buckets.deleted ?? []) rows.delete(String(row.id))
    tables[table] = [...rows.values()]
  }

  return tables
}

/* ------------------------------------------------------------------ *
 * 3. Résolution des auteurs
 * ------------------------------------------------------------------ */

const ANONYMOUS = {
  name: 'Auteur anonyme',
  nameAr: 'مؤلَّفٌ مجهول',
}

function resolveAuthor(raw) {
  if (!raw || raw.name === 'autre' || raw.name === 'Autre') {
    return {
      id: raw?.id ?? 'anonymous',
      name: ANONYMOUS.name,
      nameAr: clean(raw?.ar_name ?? '') || ANONYMOUS.nameAr,
      tariha: raw?.tariha ?? 'tidjan',
      anonymous: true,
    }
  }
  return {
    id: String(raw.id),
    name: clean(raw.name),
    nameAr: clean(raw.ar_name ?? ''),
    tariha: raw.tariha ?? 'tidjan',
    anonymous: false,
  }
}

async function loadAuthorNotes() {
  const file = path.join(ROOT, 'src', 'data', 'author-notes.json')
  if (!existsSync(file)) return {}
  return JSON.parse(await readFile(file, 'utf8'))
}

/* ------------------------------------------------------------------ *
 * 4. Lecture
 * ------------------------------------------------------------------ */

/**
 * Charge le catalogue de xassida.sn.
 * @returns {Promise<import('./lib/catalogue.mjs').Catalogue>}
 */
export async function loadSourceCatalogue() {
  const chunk = await findDataChunk()
  const tables = flattenTables(parseEmbeddedJson(chunk.code))

  const rawBios = tables.author_infos ?? []
  const notes = await loadAuthorNotes()

  /* --- auteurs --- */
  const biosByAuthor = new Map()
  for (const bio of rawBios) {
    const key = String(bio.author_id)
    if (!biosByAuthor.has(key)) biosByAuthor.set(key, [])
    biosByAuthor.get(key).push(bio)
  }

  const recitersById = new Map(
    (tables.reciters ?? []).map((reciter) => [String(reciter.id), reciter]),
  )

  const catalogue = emptyCatalogue()
  const usedAuthorSlugs = new Set()

  for (const raw of tables.authors ?? []) {
    const author = resolveAuthor(raw)
    const bios = biosByAuthor.get(author.id) ?? []
    const frBio = bios.find((bio) => bio.lang === 'fr')
    const note = notes[author.id] ?? notes[author.name] ?? null

    catalogue.authors.push({
      id: author.id,
      /* Slug unique : deux auteurs au nom proche ne doivent pas
         se retrouver sur la même route /auteurs/:slug. */
      slug: uniqueSlug(author.anonymous ? 'auteur-anonyme' : slugify(author.name), usedAuthorSlugs),
      name: author.name,
      nameAr: author.nameAr,
      tariha: author.tariha,
      anonymous: author.anonymous,
      /* L'auteur inconnu reste sans notice : on n'invente pas d'attribution. */
      bio: author.anonymous ? '' : note?.bio || cleanRichText(frBio?.text ?? ''),
      bioSource: author.anonymous
        ? 'none'
        : note?.bio
          ? note.source || 'diwanekiram'
          : frBio?.text
            ? 'catalogue'
            : 'none',
      /* Les portraits du catalogue source ne sont pas redistribués :
         on ne conserve le chemin que s'il existe localement dans public/authors/. */
      picture: resolveLocalPortrait(raw.picture, PORTRAIT_DIR),
    })
  }

  const anonymousAuthor = catalogue.authors.find((author) => author.anonymous)

  /* --- traductions --- */
  const translationByVerse = new Map()
  for (const translation of tables.verse_translations ?? []) {
    if (translation.lang !== 'fr') continue
    const verseId = String(translation.verse_id)
    const previous = translationByVerse.get(verseId)
    if (previous && previous.length >= clean(translation.text).length) continue
    translationByVerse.set(verseId, clean(translation.text))
  }

  /* --- chapitres et versets --- */
  const chaptersByXassida = new Map()
  for (const chapter of tables.chapters ?? []) {
    const key = String(chapter.xassida_id)
    if (!chaptersByXassida.has(key)) chaptersByXassida.set(key, [])
    chaptersByXassida.get(key).push({
      id: String(chapter.id),
      n: Number(chapter.number),
      verses: [],
    })
  }

  const versesByChapter = new Map()
  for (const verse of tables.verses ?? []) {
    const key = String(verse.chapter_id)
    if (!versesByChapter.has(key)) versesByChapter.set(key, [])
    versesByChapter.get(key).push({
      id: String(verse.id),
      n: Number(verse.number),
      ar: clean(verse.text),
      tr: clean(verse.transcription ?? ''),
    })
  }

  for (const chapters of chaptersByXassida.values()) {
    for (const chapter of chapters) {
      chapter.verses = (versesByChapter.get(chapter.id) ?? []).sort((a, b) => a.n - b.n)
    }
  }

  /* --- audio --- */
  const audioByXassida = new Map()
  for (const audio of tables.audios ?? []) {
    const key = String(audio.xassida_id)
    if (!audioByXassida.has(key)) audioByXassida.set(key, [])
    audioByXassida.get(key).push({
      id: String(audio.id),
      file: audio.file,
      reciterId: String(audio.reciter_id),
      reciter: recitersById.get(String(audio.reciter_id))?.name ?? null,
    })
  }

  /* --- œuvres --- */
  const usedWorkSlugs = new Set()
  const knownAuthorIds = new Set(catalogue.authors.map((author) => author.id))
  let skipped = 0

  for (const raw of tables.xassidas ?? []) {
    const chapters = (chaptersByXassida.get(String(raw.id)) ?? []).sort((a, b) => a.n - b.n)
    const totalVerses = chapters.reduce((total, chapter) => total + chapter.verses.length, 0)

    /* Une œuvre sans aucun verset n'a rien à publier dans le corpus. */
    if (totalVerses === 0) {
      skipped += 1
      continue
    }

    const authorId = knownAuthorIds.has(String(raw.author_id))
      ? String(raw.author_id)
      : (anonymousAuthor?.id ?? String(raw.author_id))

    const normalised = normaliseWork(
      {
        id: raw.id,
        slug: slugify(raw.slug || raw.name).replace(/^tidjan-/, ''),
        name: raw.name,
        nameAr: raw.ar_name,
        authorId,
        chapters: chapters.map((chapter) => ({
          id: chapter.id,
          n: chapter.n,
          verses: chapter.verses,
        })),
      },
      { origin: 'xassida.sn', usedSlugs: usedWorkSlugs },
    )

    addWork(catalogue, normalised)
  }

  for (const [verseId, text] of translationByVerse) {
    catalogue.translations.set(verseId, text)
  }

  for (const [xassidaId, tracks] of audioByXassida) {
    catalogue.audio.push({ xassidaId, tracks })
  }

  catalogue.skippedWithoutVerses = skipped
  catalogue.source = chunk.url

  return catalogue
}

/* ------------------------------------------------------------------ *
 * 5. Exécution directe : résumé seulement
 * ------------------------------------------------------------------ */

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectRun) {
  step('Lecture du catalogue xassida.sn')
  const catalogue = await loadSourceCatalogue()
  step('Résumé')
  log(`  source        ${catalogue.source}`)
  log(`  auteurs        ${catalogue.authors.length}`)
  log(`  œuvres         ${catalogue.xassidas.length}`)
  log(`  chapitres      ${catalogue.chapters.length}`)
  log(`  versets        ${catalogue.verses.length}`)
  log(`  traductions fr ${catalogue.translations.size}`)
  if (catalogue.skippedWithoutVerses > 0) {
    log(`  ignorées       ${catalogue.skippedWithoutVerses} œuvre(s) sans verset`)
  }
  log('\n  Ce module ne construit rien : utilisez `npm run data:build`.\n')
}