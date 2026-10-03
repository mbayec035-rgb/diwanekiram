#!/usr/bin/env node
/* ------------------------------------------------------------------
   Import des œuvres depuis markazulfuhum.app vers content/

   L'API publique est un Django REST ouvert. Ce script ne fait qu'une
   chose : traduire cette API en fichiers versionnables. Il lit le site
   une fois, puis n'est plus nécessaire : les textes qu'il écrit dans
   content/ sont la référence, et le build ne dépend plus du réseau.

     node scripts/import-markaz.mjs --rapport     analyse, n'écrit rien
     node scripts/import-markaz.mjs --write       écrit content/
     node scripts/import-markaz.mjs --rapport --author=2

   Le rapprochement d'une œuvre déjà présente se fait sur le texte, pas
   sur le titre ni sur le slug : deux sources nomment différemment les
   mêmes vers. L'empreinte est calculée sur l'arabe réduit à ses lettres,
   diacritiques retirés, alif/hamza unifiés.
   ------------------------------------------------------------------ */

import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { clean, foldArabic, slugify, titleCase } from './lib/catalogue.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT_DIR = path.join(ROOT, 'content')
const DATA_DIR = path.join(ROOT, 'public', 'data')

const API = 'https://markazulfuhum.app/api'
const SITE = 'https://markazulfuhum.app'

const LICENCE = 'Domaine public'

/* L'auteur anonyme est nommé différemment par les deux sources ; sans
   cette table, il serait traité comme deux auteurs distincts. */
const AUTHOR_ALIASES = new Map([
  ['29', '9'],
])

/* ------------------------------------------------------------------ *
 * Arguments
 * ------------------------------------------------------------------ */

const argv = process.argv.slice(2)
const flag = (name) => argv.some((arg) => arg === `--${name}`)
const option = (name) => {
  const hit = argv.find((arg) => arg.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : null
}

const reportOnly = flag('rapport')
const write = flag('write')
const authorFilter = option('author')
const limit = Number(option('limit') ?? 0) || Infinity

if (!reportOnly && !write) {
  console.error('Usage : node scripts/import-markaz.mjs --rapport | --write [--author=N] [--limit=N]')
  process.exit(1)
}

const log = (...args) => console.log(...args)
const step = (title) => log(`\n\x1b[36m▸ ${title}\x1b[0x`)

/* ------------------------------------------------------------------ *
 * HTTP
 * ------------------------------------------------------------------ */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let requests = 0

/* Le site limite les requêtes. 482 appels à la file suffisent
   pour déclencher un 429 : on espace franchement, et en cas de refus on
   attend ce que le serveur demande au lieu de réessayer tout de suite.
   Les réponses sont mises en cache sous node_modules/.cache : une relance
   du rapport ne reclame plus rien au site. */
const DELAY_MS = 1200
const CACHE_DIR = path.join(ROOT, 'node_modules', '.cache', 'markaz')

async function readCache(key) {
  try {
    return JSON.parse(await readFile(path.join(CACHE_DIR, `${hash(key)}.json`), 'utf8'))
  } catch {
    return undefined
  }
}

async function writeCache(key, value) {
  try {
    await mkdir(CACHE_DIR, { recursive: true })
    await writeFile(path.join(CACHE_DIR, `${hash(key)}.json`), value, 'utf8')
  } catch {
    /* Le cache est une commodité, jamais une condition de réussite. */
  }
}

const useCache = !flag('rafraichir')

async function getJson(url) {
  const cached = useCache ? await readCache(url) : undefined
  if (cached !== undefined) return cached

  for (let attempt = 1; ; attempt += 1) {
    let wait = 0

    try {
      const response = await fetch(url, { headers: { accept: 'application/json' } })

      if (response.status === 429) {
        const told = Number(response.headers.get('retry-after'))
        wait = Number.isFinite(told) && told > 0 ? told * 1000 : 8000 * attempt
        throw new Error(`limite de débit, nouvelle tentative dans ${Math.round(wait / 1000)} s`)
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      requests += 1
      const text = await response.text()
      await writeCache(url, text)
      return JSON.parse(text)
    } catch (error) {
      if (attempt >= 6) throw new Error(`${url} : ${error.message}`)
      const delay = wait || 1000 * 2 ** (attempt - 1)
      await sleep(delay)
    }
  }
}

async function walkPages(firstUrl, onPage) {
  let url = firstUrl
  let page = 0
  while (url) {
    const target = url.includes('format=json') ? url : `${url}${url.includes('?') ? '&' : '?'}format=json`
    const body = await getJson(target)
    onPage(body.results ?? [], body)
    url = body.next
    page += 1
    await sleep(DELAY_MS)
    if (page > 200) throw new Error('Pagination sans fin.')
  }
}

/* ------------------------------------------------------------------ *
 * Réduction de l'arabe, pour comparer deux sources
 * ------------------------------------------------------------------ */

/* `foldArabic` vient de lib/catalogue.mjs : c'est le build qui s'en sert
   pour rattacher les traductions aux versets, il faut que les deux
   comparaisons tombent sur la même réduction. */
const COMBINING_MARKS = /[̀-ͯ]/g

function foldLatin(value) {
  return clean(
    String(value ?? '')
      .normalize('NFD')
      .replace(COMBINING_MARKS, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' '),
  )
}

function hash(value) {
  return createHash('sha1').update(value).digest('hex').slice(0, 16)
}

/** Empreintes d'une œuvre : sur 3, 2 puis 1 verset, pour tolérer qu'une
    source ait un verset de plus ou de moins que l'autre. */
function fingerprints(verses) {
  const texts = verses.map((verse) => foldArabic(verse.ar)).filter(Boolean)
  const prints = new Map()
  for (const depth of [3, 2, 1]) {
    const head = texts.slice(0, depth).join(' ')
    if (!head) continue
    const key = `${depth}:${hash(head)}`
    if (!prints.has(key)) prints.set(key, texts.length)
  }
  /* `prints` ne porte que l'empreinte : le nombre de versets appartient à
     l'appelant. Mélanger les deux avait laissé un spread écraser le compte
     réel, et le rapport annonçait « 1 verset » pour une œuvre de 69. */
  return { prints }
}

/* ------------------------------------------------------------------ *
 * Corpus déjà publié
 * ------------------------------------------------------------------ */

async function loadCurrentCorpus() {
  const manifest = JSON.parse(await readFile(path.join(DATA_DIR, 'manifest.json'), 'utf8'))
  const authors = JSON.parse(await readFile(path.join(DATA_DIR, 'authors.json'), 'utf8'))
  const xassidas = JSON.parse(await readFile(path.join(DATA_DIR, 'xassidas.json'), 'utf8'))

  const works = []
  for (const item of manifest.items) {
    const document = JSON.parse(await readFile(path.join(DATA_DIR, item.file), 'utf8'))
    const verses = document.chapters.flatMap((chapter) => chapter.verses)
    works.push({
      slug: item.slug,
      name: xassidas.find((x) => x.slug === item.slug)?.name ?? item.slug,
      authorId: xassidas.find((x) => x.slug === item.slug)?.authorId ?? '',
      verseCount: verses.length,
      ...fingerprints(verses),
    })
  }

  return { works, authors, index: new Map(works.map((work) => [work.slug, work])) }
}

/** Correspondance d'auteurs : le nom arabe fait foi, la translittération
    ne sert que de secours et son résultat est signalé comme probable. */
function matchAuthor(author, currentAuthors) {
  const alias = AUTHOR_ALIASES.get(String(author.id))
  if (alias) return { authorId: alias, confidence: 'alias' }

  const foldedAr = foldArabic(author.name)
  const byArabic = currentAuthors.find((candidate) => foldArabic(candidate.nameAr) === foldedAr)
  if (byArabic) return { authorId: byArabic.id, confidence: 'certain', ours: byArabic }

  const folded = new Set(foldLatin(author.name_transcription).split(' ').filter(Boolean))
  if (folded.size === 0) return { authorId: null, confidence: 'aucun' }

  let best = null
  for (const candidate of currentAuthors) {
    const tokens = new Set(
      `${foldLatin(candidate.name)} ${foldLatin(candidate.nameAr)}`.split(' ').filter(Boolean),
    )
    let shared = 0
    for (const token of tokens) if (folded.has(token)) shared += 1
    if (shared === 0) continue
    const score = shared / Math.max(tokens.size, 1)
    if (!best || score > best.score) best = { candidate, score }
  }

  if (best && best.score >= 0.6) {
    return { authorId: best.candidate.id, confidence: 'probable', ours: best.candidate }
  }
  return { authorId: null, confidence: 'aucun' }
}

/* ------------------------------------------------------------------ *
 * Nettoyage des notices (HTML avec renvois de notes)
 * ------------------------------------------------------------------ */

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&laquo;|&raquo;/g, '«')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
}

function htmlToText(value) {
  if (!value) return ''
  let out = String(value)
  /* Les renvois de notes de bas de page (react-footnotes) sont des ancres
     vides dont le texte n'est pas exposé par l'API : il ne reste que des
     repères orphelins, à retirer. */
  out = out.replace(/<a[^>]*id="_[^"]*"[^>]*>\s*<\/a>/gi, '')
  out = out.replace(/<a[^>]*>\s*<\/a>/gi, '')
  out = out.replace(/<h([1-6])[^>]*>(.*?)<\/h\1>/gi, '\n\n$2\n')
  out = out.replace(/<li[^>]*>(.*?)<\/li>/gi, '\n- $1')
  out = out.replace(/<\/(p|div|ol|ul|br)>/gi, '\n')
  out = out.replace(/<(br|hr)\s*\/?>/gi, '\n')
  out = out.replace(/<[^>]+>/g, '')
  out = decodeEntities(out)
  return clean(out)
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/* ------------------------------------------------------------------ *
 * Import
 * ------------------------------------------------------------------ */

step('Lecture de markazulfuhum.app')

const qasidas = []
await walkPages(`${API}/qasidas/`, (results) => {
  qasidas.push(...results)
  log(`  ${qasidas.length} œuvre(s) recensée(s)`)
})

const siteAuthors = []
await walkPages(`${API}/authors/`, (results) => {
  siteAuthors.push(...results)
  log(`  ${siteAuthors.length} auteur(s) recensé(s)`)
})

step('Correspondance des auteurs')

const current = await loadCurrentCorpus()
const resolvedAuthors = new Map()
const newAuthors = []

for (const author of siteAuthors) {
  const match = matchAuthor(author, current.authors)
  resolvedAuthors.set(String(author.id), match)
  if (match.authorId === null) {
    newAuthors.push({ ...author, match })
  } else if (match.confidence === 'probable') {
    log(`  ~ ${author.name_transcription} → ${match.ours.name} (probable)`)
  }
}

/* Un auteur absent du corpus sera créé : son identifiant local est le stem
   du fichier qui sera écrit. Il faut le réserver ici, sinon les œuvres de
   cet auteur seraient comptées comme orphelines et porteraient « null ». */
for (const author of newAuthors) {
  const slug = slugify(foldLatin(author.name_transcription)) || `auteur-${author.id}`
  author.slug = slug
  author.localId = slug
  resolvedAuthors.set(String(author.id), {
    authorId: slug,
    confidence: 'nouveau',
  })
}

const matched = siteAuthors.length - newAuthors.length
log(`  ${matched} auteur(s) déjà dans le corpus, ${newAuthors.length} à créer`)

step('Analyse des œuvres')

const usedSlugs = new Set(current.works.map((work) => work.slug))

const analysed = []
let fetched = 0

for (const raw of qasidas) {
  if (authorFilter && String(raw.author) !== authorFilter) continue
  if (analysed.length >= limit) break

  const detail = await getJson(`${API}/qasidas/${raw.id}/?format=json`)

  /* Les lignes sont paginées par 100. Ne pas suivre `next` tronquerait
     silencieusement toute œuvre plus longue : burdu s'arrêtait à 100 sur
     167, zajrul-qulub à 100 sur 128 — et le rapport ne montrait qu'un
     « écart de version » imaginaire. */
  const ordered = []
  await walkPages(`${API}/qasida-lines/?qasida=${raw.id}`, (results) => {
    ordered.push(...results)
  })
  await sleep(DELAY_MS)
  fetched += 1
  if (fetched % 25 === 0) log(`  ${fetched} œuvre(s) analysée(s)`)

  /* `line_number` est un index global à l'œuvre : le tri réassemble
     l'ordre, que la pagination ait pu entremêler ou non. */
  ordered.sort((a, b) => a.line_number - b.line_number)

  const chapters = []
  for (const line of ordered) {
    const text = clean(line.full_line ?? `${line.sadr_text ?? ''} ${line.adj_text ?? ''}`)
    if (!text) continue
    const chapterId = String(line.chapter)
    let chapter = chapters.find((entry) => entry.id === chapterId)
    if (!chapter) {
      chapter = {
        id: chapterId,
        n: chapters.length + 1,
        title: clean(line.chapter_info?.title ?? ''),
        verses: [],
      }
      chapters.push(chapter)
    }
    chapter.verses.push({
      ar: text,
      sadr: clean(line.sadr_text ?? ''),
      adj: clean(line.adj_text ?? ''),
    })
  }

  const authorMatch = resolvedAuthors.get(String(raw.author))
  const allVerses = chapters.flatMap((chapter) => chapter.verses)
  const { prints } = fingerprints(allVerses)

  /* Le rapprochement se fait sur le texte. Le premier print qui
     coïncide avec une œuvre publiée désigne l'œuvre à remplacer. */
  let incumbent = null
  for (const key of prints.keys()) {
    const hit = current.works.find((work) => work.prints.has(key))
    if (hit) {
      incumbent = hit
      break
    }
  }

  /* Une œuvre remplacée garde le slug publié : son adresse et celle de
     son auteur ne doivent pas changer sous les favoris existants.
     Le slug du remplacé est donc libéré avant le test d'unicité, sinon
     la reprise se retrouvait suffixée « -303 » et perdait son adresse. */
  const proposedSlug = incumbent ? incumbent.slug : slugify(foldLatin(detail.title_transcription))
  if (incumbent) usedSlugs.delete(incumbent.slug)
  const slug = usedSlugs.has(proposedSlug) ? `${proposedSlug}-${raw.id}` : proposedSlug

  analysed.push({
    id: String(raw.id),
    raw,
    detail,
    chapters,
    verseCount: allVerses.length,
    prints,
    incumbent,
    slug,
    authorId: authorMatch?.authorId ?? null,
    authorConfidence: authorMatch?.confidence ?? 'aucun',
  })

  usedSlugs.add(slug)
}

/* Deux œuvres du site qui se ressemblent : on garde la première. */
const seen = new Map()
for (const work of analysed) {
  let duplicateOf = null
  for (const key of work.prints.keys()) {
    if (seen.has(key)) {
      duplicateOf = seen.get(key)
      break
    }
  }
  work.duplicateOf = duplicateOf
  if (!duplicateOf) for (const key of work.prints.keys()) if (!seen.has(key)) seen.set(key, work.id)
}

const replacements = analysed.filter((work) => work.incumbent && !work.duplicateOf)
const fresh = analysed.filter((work) => !work.incumbent && !work.duplicateOf)
const internalDuplicates = analysed.filter((work) => work.duplicateOf)
const empty = analysed.filter((work) => work.verseCount === 0)
const orphanAuthors = analysed.filter((work) => work.authorId === null && work.verseCount > 0)
const withMetre = analysed.filter((work) => work.detail.bahrName).length

log(`  ${analysed.length} œuvre(s) analysée(s) en ${fetched} requêtes`)
log(`  ${fresh.length} nouvelle(s), ${replacements.length} remplacement(s)`)
log(`  ${internalDuplicates.length} doublon(s) interne(s) au site, ${empty.length} sans verset`)
log(`  ${withMetre} avec mètre poétique`)
log(`  ${orphanAuthors.length} œuvre(s) sans auteur identifiable`)

/* ------------------------------------------------------------------ *
 * Rapport
 * ------------------------------------------------------------------ */

if (reportOnly) {
  step('Rapport')

  log("\nRemplacements — l'adresse est conservée, le texte vient du site :\n")
  for (const work of replacements) {
    const before = work.incumbent.verseCount
    const delta = work.verseCount - before
    /* Un écart minime est une ponctuation ou un verset de clôture. Un écart
       de plus de 10 % signale deux versions différentes : c'est le seul
       endroit où l'import peut perdre du texte sans bruit. */
    const swing = before > 0 && Math.abs(delta) / before > 0.1
    log(
      `  ${work.slug}${swing ? '  \x1b[33m\x1b[1m<- à relire\x1b[0m' : ''}\n` +
        `    « ${work.incumbent.name} » : ${before} versets` +
        `  ->  qasida ${work.id} « ${work.detail.title_transcription} » : ${work.verseCount} lignes` +
        `${delta === 0 ? '' : `  (${delta > 0 ? '+' : ''}${delta})`}`,
    )
  }

  log(`\nNouvelles œuvres (${fresh.length}) :\n`)
  for (const work of fresh.slice(0, 40)) {
    log(`  ${work.slug.padEnd(52)} ${String(work.verseCount).padStart(4)} lignes`)
  }
  if (fresh.length > 40) log(`  … et ${fresh.length - 40} de plus`)

  if (internalDuplicates.length > 0) {
    log(`\nDoublons internes au site — ignorés (${internalDuplicates.length}) :\n`)
    for (const work of internalDuplicates) {
      log(`  ${work.slug} doublon de la qasida ${work.duplicateOf}`)
    }
  }

  if (empty.length > 0) {
    log(`\nSans aucun verset — ignorées (${empty.length}) :\n`)
    for (const work of empty) log(`  ${work.detail.title_transcription}`)
  }

  log(`\nAuteurs à créer (${newAuthors.length}) :\n`)
  for (const author of newAuthors) {
    const years = [author.date_of_birth, author.date_of_death].filter(Boolean).join(' – ')
    log(`  ${slugify(foldLatin(author.name_transcription)).padEnd(38)} ${author.name_transcription}${years ? `  (${years})` : ''}`)
  }

  log(`\n${requests} requêtes. Aucun fichier écrit.`)
  log(`Relancez avec --write pour écrire ${fresh.length} œuvre(s) et ${replacements.length} remplacement(s) dans content/.\n`)
  process.exit(0)
}

/* ------------------------------------------------------------------ *
 * Écriture
 * ------------------------------------------------------------------ */

step('Écriture dans content/')

await mkdir(path.join(CONTENT_DIR, 'oeuvres'), { recursive: true })
await mkdir(path.join(CONTENT_DIR, 'auteurs'), { recursive: true })

const metreOf = (nameAr, name) => (nameAr ? { nameAr: clean(nameAr), name: clean(name ?? '') } : null)

let writtenWorks = 0

for (const work of [...fresh, ...replacements]) {
  if (work.verseCount === 0) continue

  const meter = metreOf(work.detail.bahrName, work.detail.bahrNameTranscription)
  const rhyme = metreOf(work.detail.qafiyahName, work.detail.qafiyahNameTranscription)
  const category = metreOf(work.detail.categoryName, work.detail.categoryNameTranscription)

  const payload = {
    name: titleCase(clean(work.detail.title_transcription ?? '')) || clean(work.detail.title),
    nameAr: clean(work.detail.title),
    author: work.authorId,
    ...(work.incumbent && work.incumbent.authorId !== work.authorId
      ? { previousAuthor: work.incumbent.authorId }
      : {}),
    source: `${SITE}/qasidas/${work.id}`,
    license: LICENCE,
    providedBy: 'markazulfuhum.app',
    ...(meter ? { meter } : {}),
    ...(rhyme ? { rhyme } : {}),
    ...(category ? { category } : {}),
    chapters: work.chapters.map((chapter) => ({
      n: chapter.n,
      verses: chapter.verses.map((verse) => ({
        ar: verse.ar,
        ...(verse.sadr ? { sadr: verse.sadr } : {}),
        ...(verse.adj ? { adj: verse.adj } : {}),
      })),
    })),
  }

  const target = path.join(CONTENT_DIR, 'oeuvres', `${work.slug}.json`)
  await writeFile(target, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  writtenWorks += 1
}

let writtenAuthors = 0

for (const author of newAuthors) {
  const slug = author.slug
  if (usedSlugs.has(slug)) {
    log(`  ! ${slug} : slug d'œuvre déjà pris, notice d'auteur ignorée`)
    continue
  }
  usedSlugs.add(slug)

  const bio = htmlToText(author.biography)
  const years = [author.date_of_birth, author.date_of_death].filter(Boolean).join(' – ')

  const payload = {
    name: titleCase(clean(author.name_transcription ?? '')) || clean(author.name),
    nameAr: clean(author.name),
    tariha: 'tidjan',
    ...(bio ? { bio: years ? `${years}\n\n${bio}` : bio } : {}),
    source: `${SITE}/authors/${author.id}`,
    license: LICENCE,
  }

  await writeFile(
    path.join(CONTENT_DIR, 'auteurs', `${slug}.json`),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8',
  )
  writtenAuthors += 1
}

log(`  ${writtenWorks} œuvre(s), dont ${replacements.length} remplacement(s)`)
log(`  ${writtenAuthors} notice(s) d'auteur`)
log(`  ${requests} requêtes`)
log(`\n  Relancez \x1b[1mnpm run data:build\x1b[0m pour publier.\n`)