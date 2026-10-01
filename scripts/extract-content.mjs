#!/usr/bin/env node
/**
 * DiwaneKiram — ingestion du catalogue
 *
 * Récupère le jeu de données embarqué dans le bundle public de xassida.sn,
 * puis l'écrit dans public/data/ aux formats consommés par l'application.
 *
 *   node scripts/extract-content.mjs
 *
 * Le script est idempotent : il écrase complètement public/data/.
 */

import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = path.join(ROOT, 'public', 'data')
const PORTRAIT_DIR = path.join(ROOT, 'public', 'authors')
const SITE = 'https://www.xassida.sn'
const TARIHA_LABEL = { tidjan: 'Tidjan' }

/* Renvoie le chemin public d'un portrait uniquement s'il est présent
   dans public/authors/ ; sinon null (l'interface affiche des initiales). */
function resolveLocalPortrait(candidate) {
  if (!candidate) return null
  const relative = String(candidate).replace(/^https?:\/\/[^/]+/, '').replace(/^\/+/, '')
  if (!relative) return null
  const name = path.basename(relative)
  return existsSync(path.join(PORTRAIT_DIR, name)) ? `authors/${name}` : null
}

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

    let cursor = code.indexOf('JSON.parse(\'')
    while (cursor !== -1) {
      const literal = readJsStringLiteral(code, cursor + 'JSON.parse('.length)
      if (literal && literal.length > 100_000 && literal.includes('ar_name')) {
        if (!best || literal.length > best.size) best = { url, code: literal }
      }
      cursor = code.indexOf('JSON.parse(\'', cursor + 1)
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
    for (const row of buckets.updated ?? []) rows.set(String(row.id), { ...rows.get(String(row.id)), ...row })
    for (const row of buckets.deleted ?? []) rows.delete(String(row.id))
    tables[table] = [...rows.values()]
  }

  return tables
}

/* ------------------------------------------------------------------ *
 * 3. Nettoyage
 * ------------------------------------------------------------------ */

const INVISIBLE = /[\u00A0\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g
const DIACRITICS = /[\u0300-\u036f]/g

const clean = (value) =>
  typeof value === 'string'
    ? value
        .replace(INVISIBLE, '')
        .replace(/[ \t]{2,}/g, ' ')
        .trim()
    : value

/* Le texte du catalogue arrive en markdown : on retire la syntaxe
   pour n'afficher que des paragraphes de texte brut. */
const cleanRichText = (value) =>
  typeof value === 'string'
    ? value
        .replace(/\\n/g, '\n')
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/^\s{0,3}#{1,6}\s+/gm, '')
        .replace(/^\s{0,3}>\s?/gm, '')
        .replace(/(\*\*|__|\*|_|`)/g, '')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    : value

const titleCase = (value) =>
  clean(value.replace(/_/g, ' '))
    .split(' ')
    .filter(Boolean)
    .map((word) =>
      /^(al|el|ab|as|ad|an|ar|as|ay|az|ch|dh|gh|kh|mr|nd|ny|ou|sr|st|sy|th|wa|ye|zi)$/i.test(word)
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ')

const slugify = (value) =>
  clean(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const ANONYMOUS = { id: 'anonymous', name: 'Auteur anonyme', nameFr: 'Auteur anonyme' }

function resolveAuthor(raw) {
  if (!raw || raw.name === 'autre' || raw.name === 'Autre') {
    return {
      id: raw?.id ?? 'unknown',
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

/* ------------------------------------------------------------------ *
 * 4. Extraction
 * ------------------------------------------------------------------ */

async function loadAuthorNotes() {
  const file = path.join(ROOT, 'src', 'data', 'author-notes.json')
  if (!existsSync(file)) return {}
  return JSON.parse(await readFile(file, 'utf8'))
}

async function extract() {
  step('Localisation du catalogue source')
  const chunk = await findDataChunk()
  const payload = parseEmbeddedJson(chunk.code)
  const tables = flattenTables(payload)

  const rawAuthors = tables.authors ?? []
  const rawXassidas = tables.xassidas ?? []
  const rawChapters = tables.chapters ?? []
  const rawVerses = tables.verses ?? []
  const rawTranslations = tables.verse_translations ?? []
  const rawBios = tables.author_infos ?? []
  const rawAudios = tables.audios ?? []
  const rawReciters = tables.reciters ?? []

  log(`  source : ${chunk.url}`)
  log(
    `  ${rawXassidas.length} xassidas · ${rawVerses.length} versets · ${rawTranslations.length} traductions · ${rawAuthors.length} auteurs`,
  )

  step('Nettoyage et structuration')
  const notes = await loadAuthorNotes()

  /* --- auteurs --- */
  const biosByAuthor = new Map()
  for (const bio of rawBios) {
    if (!biosByAuthor.has(String(bio.author_id))) biosByAuthor.set(String(bio.author_id), [])
    biosByAuthor.get(String(bio.author_id)).push(bio)
  }

  const recitersById = new Map(rawReciters.map((reciter) => [String(reciter.id), reciter]))

  const authorIds = new Set(rawAuthors.map((author) => String(author.id)))
  const authorIndex = new Map()

  for (const raw of rawAuthors) {
    const author = resolveAuthor(raw)
    const bios = biosByAuthor.get(author.id) ?? []
    const frBio = bios.find((bio) => bio.lang === 'fr')
    const note = notes[author.id] ?? notes[author.name] ?? null

    authorIndex.set(author.id, {
      id: author.id,
      slug: author.anonymous ? 'auteur-anonyme' : slugify(author.name),
      name: author.name,
      nameAr: author.nameAr,
      tariha: author.tariha,
      tarihaLabel: TARIHA_LABEL[author.tariha] ?? author.tariha,
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
      picture: resolveLocalPortrait(raw.picture),
    })
  }

  const anonymousAuthor = [...authorIndex.values()].find((author) => author.anonymous)

  /* --- traductions --- */
  const translationByVerse = new Map()
  for (const translation of rawTranslations) {
    if (translation.lang !== 'fr') continue
    const verseId = String(translation.verse_id)
    const previous = translationByVerse.get(verseId)
    if (previous && previous.text.trim().length >= clean(translation.text).length) continue
    translationByVerse.set(verseId, { id: String(translation.id), text: clean(translation.text) })
  }

  /* --- chapitres et versets --- */
  const chaptersByXassida = new Map()
  for (const chapter of rawChapters) {
    const key = String(chapter.xassida_id)
    if (!chaptersByXassida.has(key)) chaptersByXassida.set(key, [])
    chaptersByXassida.get(key).push(chapter)
  }

  const versesByChapter = new Map()
  for (const verse of rawVerses) {
    const key = String(verse.chapter_id)
    if (!versesByChapter.has(key)) versesByChapter.set(key, [])
    versesByChapter.get(key).push(verse)
  }

  const audioByXassida = new Map()
  for (const audio of rawAudios) {
    const key = String(audio.xassida_id)
    if (!audioByXassida.has(key)) audioByXassida.set(key, [])
    audioByXassida.get(key).push({
      id: String(audio.id),
      file: audio.file,
      reciterId: String(audio.reciter_id),
      reciter: recitersById.get(String(audio.reciter_id))?.name ?? null,
    })
  }

  const usedSlugs = new Set()
  const xassidas = []
  const authors = []

  for (const raw of rawXassidas) {
    const xassidaId = String(raw.id)
    const chapters = (chaptersByXassida.get(xassidaId) ?? []).sort((a, b) => Number(a.number) - Number(b.number))

    const verseRecords = []
    const skeleton = {}

    for (const chapter of chapters) {
      const verses = (versesByChapter.get(String(chapter.id)) ?? []).sort((a, b) => Number(a.number) - Number(b.number))

      for (const verse of verses) {
        const verseId = String(verse.id)
        const text = clean(verse.text)
        const transcription = clean(verse.transcription ?? '')
        const translation = translationByVerse.get(verseId)

        verseRecords.push({
          id: verseId,
          chapterId: String(chapter.id),
          n: Number(verse.number),
          ar: text,
          tr: transcription,
          frId: translation ? translation.id : null,
        })

        skeleton[verseId] = translation ? translation.text : ''
      }
    }

    if (verseRecords.length === 0) continue

    /* Nom arabe de repli : on utilise le premier verset s'il est court. */
    const firstVerse = verseRecords.find((verse) => verse.ar.length > 0)?.ar ?? ''
    let slug = slugify(raw.slug || raw.name).replace(/^tidjan-/, '')
    if (!slug || usedSlugs.has(slug)) slug = `${slug}-${xassidaId}`
    usedSlugs.add(slug)

    const xassida = {
      id: xassidaId,
      slug,
      name: titleCase(raw.name),
      nameAr: clean(raw.ar_name ?? '') || (firstVerse.length <= 90 ? firstVerse : ''),
      nameSearch: slug.replace(/-/g, ' '),
      authorId: authorIds.has(String(raw.author_id))
        ? String(raw.author_id)
        : (anonymousAuthor?.id ?? String(raw.author_id)),
      chapterCount: chapters.length,
      verseCount: verseRecords.length,
      translatedCount: verseRecords.filter((verse) => verse.frId).length,
      hasAudio: audioByXassida.has(xassidaId),
    }
    xassida.translatedRatio =
      xassida.verseCount > 0 ? Math.round((xassida.translatedCount / xassida.verseCount) * 100) : 0
    xassidas.push({ xassida, chapters, verseRecords, skeleton })
  }

  xassidas.sort((a, b) => a.xassida.name.localeCompare(b.xassida.name, 'fr'))

  /* --- index auteurs enrichi --- */
  const byAuthor = new Map()
  for (const { xassida } of xassidas) {
    if (!byAuthor.has(xassida.authorId)) byAuthor.set(xassida.authorId, [])
    byAuthor.get(xassida.authorId).push(xassida)
  }

  for (const author of authorIndex.values()) {
    const owned = byAuthor.get(author.id) ?? []
    authors.push({
      ...author,
      xassidaCount: owned.length,
      verseCount: owned.reduce((total, item) => total + item.verseCount, 0),
      slugs: owned.map((item) => item.slug),
    })
  }

  authors.sort((a, b) => Number(a.anonymous) - Number(b.anonymous) || a.name.localeCompare(b.name, 'fr'))

  /* ---------------------------------------------------------------- *
   * 5. Écriture
   * ---------------------------------------------------------------- */

  step('Écriture de public/data/')
  if (existsSync(OUT_DIR)) await rm(OUT_DIR, { recursive: true, force: true })
  await mkdir(path.join(OUT_DIR, 'verses'), { recursive: true })
  await mkdir(path.join(OUT_DIR, 'translations'), { recursive: true })

  const write = async (relative, value) => {
    const target = path.join(OUT_DIR, relative)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, `${JSON.stringify(value)}\n`, 'utf8')
    return Buffer.byteLength(JSON.stringify(value), 'utf8')
  }

  const manifestEntries = []
  let totalBytes = 0

  for (const { xassida, chapters, verseRecords, skeleton } of xassidas) {
    const hasTranslation = xassida.translatedCount > 0

    const file = await write(`verses/${xassida.slug}.json`, {
      id: xassida.id,
      slug: xassida.slug,
      chapters: chapters.map((chapter) => ({
        id: String(chapter.id),
        n: Number(chapter.number),
        verseCount: (versesByChapter.get(String(chapter.id)) ?? []).length,
        verses: verseRecords
          .filter((verse) => verse.chapterId === String(chapter.id))
          .map(({ id, n, ar, tr }) => ({ id, n, ar, tr })),
      })),
    })
    totalBytes += file

    /* Un fichier de traduction est toujours écrit : il sert de squelette
       éditable pour les xassidas qui n'ont pas encore de version française. */
    const translationBytes = await write(`translations/${xassida.slug}.fr.json`, {
      id: xassida.id,
      slug: xassida.slug,
      lang: 'fr',
      verses: skeleton,
    })
    totalBytes += translationBytes

    manifestEntries.push({
      id: xassida.id,
      slug: xassida.slug,
      chapters: chapters.length,
      verses: xassida.verseCount,
      translated: xassida.translatedCount,
      hasAudio: xassida.hasAudio,
      file: `verses/${xassida.slug}.json`,
      translationsFile: `translations/${xassida.slug}.fr.json`,
      pendingTranslations: hasTranslation ? 0 : xassida.verseCount,
    })
  }

  totalBytes += await write('authors.json', authors)
  totalBytes += await write('xassidas.json', xassidas.map(({ xassida }) => xassida))
  totalBytes += await write('audio.json', [...audioByXassida.entries()].map(([xassidaId, tracks]) => ({
    xassidaId,
    tracks: tracks.map(({ reciter, ...track }) => ({ ...track, reciter })),
  })))

  const totals = {
    xassidas: xassidas.length,
    chapters: xassidas.reduce((total, item) => total + item.xassida.chapterCount, 0),
    verses: xassidas.reduce((total, item) => total + item.xassida.verseCount, 0),
    translations: xassidas.reduce((total, item) => total + item.xassida.translatedCount, 0),
    authors: authors.length,
  }
  totals.translationRatio = Math.round((totals.translations / totals.verses) * 100)

  const generatedAt = new Date().toISOString()
  await write('manifest.json', { generatedAt, totals, items: manifestEntries })

  /* ---------------------------------------------------------------- *
   * 6. Contrôles
   * ---------------------------------------------------------------- */

  step('Contrôles')

  const slugSet = new Set(xassidas.map((item) => item.xassida.slug))
  if (slugSet.size !== xassidas.length) throw new Error('Slugs dupliqués détectés.')

  const missingAuthor = xassidas.filter((item) => !item.xassida.authorId)
  if (missingAuthor.length > 0) throw new Error(`${missingAuthor.length} xassida(s) sans auteur.`)

  const orphanVerses = xassidas.filter((item) => item.verseRecords.length === 0)
  if (orphanVerses.length > 0) throw new Error(`${orphanVerses.length} xassida(s) sans verset.`)

  const files = (await readdir(path.join(OUT_DIR, 'verses'))).length
  log(`  ${files} fichier(s) de versets, ${slugSet.size} slug(s) unique(s)`)
  log(`  ${authors.filter((author) => author.bioSource !== 'none').length}/${authors.length} auteur(s) avec notice`)

  step('Résumé')
  log(`  xassidas       ${totals.xassidas}`)
  log(`  chapitres      ${totals.chapters}`)
  log(`  versets        ${totals.verses}`)
  log(`  traductions fr ${totals.translations} (${totals.translationRatio} %)`)
  log(`  auteurs        ${totals.authors}`)
  log(`  poids json     ${(totalBytes / 1024 / 1024).toFixed(2)} Mo`)
  log(`\n  ${manifestEntries.filter((item) => item.translated === 0).length} xassida(s) sans traduction FR`)
  log('  données écrites dans public/data/\n')
}

extract().catch((error) => {
  console.error(`\n\x1b[31m✖ ${error.message}\x1b[0m`)
  process.exitCode = 1
})
