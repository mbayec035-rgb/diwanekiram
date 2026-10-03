#!/usr/bin/env node
/**
 * DiwaneKiram — import de chapitres manquants dans une œuvre déposée
 * ---------------------------------------------------------------------------
 * La source en ligne est incomplète : Khilāṣu Dh-dhahabi Fī Sīrati Khayri
 * L-ʿarabi y est arrêtée au chapitre 12 alors que l'édition imprimée en compte
 * environ 30. Ce script ajoute les chapitres suivants à
 * content/oeuvres/<slug>.json, sans toucher à ceux qui existent déjà.
 *
 *   node scripts/import-chapters.mjs <slug> <source.json> [--from 13] [--dry-run]
 *
 * Le fichier source peut prendre ces formes :
 *
 *   { "chapters": [ { "n": 13, "verses": [ { "ar": "…" } ] } ] }
 *   [ { "n": 13, "verses": [ { "ar": "…" } ] } ]
 *   { "license": "…", "source": "…", "providedBy": "…", "chapters": [ … ] }
 *
 * Un verset peut porter `ar`, `sadr`, `adj`, `tr` (transcription) et `fr`
 * (traduction). Les deux hémistiches sont facultatifs : sans eux, le verset se
 * lit sur une seule ligne. `ar` est obligatoire.
 *
 * Le script refuse d'écrire quoi que ce soit si un contrôle échoue :
 *   - numérotation de chapitre continue, sans doublon, sans collision ;
 *   - numérotation de verset redémarrant à 1 dans chaque chapitre ;
 *   - aucun verset sans texte arabe ;
 *   - aucun identifiant de verset déjà utilisé (les transcriptions
 *     phonétiques sont indexées sur ces identifiants : les réutiliser
 *     attacherait une transcription au mauvais verset).
 */

import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { clean } from './lib/catalogue.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const WORKS_DIR = path.join(ROOT, 'content', 'oeuvres')

const log = (...args) => console.log(...args)
const step = (title) => log(`\n\x1b[36m▸ ${title}\x1b[0m`)

/** Signale un refus et sort en code 1, sans trace d'appels. */
function fail(message) {
  log(`\n\x1b[31m✗ ${message}\x1b[0m\n`)
  process.exit(1)
}

/* ------------------------------------------------------------------ *
 * 1. Arguments
 * ------------------------------------------------------------------ */

const args = process.argv.slice(2)
const flags = new Set(args.filter((a) => a.startsWith('--')))
const positional = args.filter((a) => !a.startsWith('--'))

const dryRun = flags.has('--dry-run')
const fromArg = args.indexOf('--from')

const slug = positional[0]
const sourceFile = positional[1]

if (!slug || !sourceFile) {
  log(`Usage : node scripts/import-chapters.mjs <slug> <source.json> [--from 13] [--dry-run]`)
  log('')
  log('Exemples :')
  log('  node scripts/import-chapters.mjs khilasu-dh-dhahabi-fi-sirati-khayri-l-arabi ./ch13-30.json --dry-run')
  process.exit(1)
}

const from = fromArg === -1 ? null : Number(args[fromArg + 1])

const workFile = path.join(WORKS_DIR, `${slug}.json`)

if (!existsSync(workFile)) fail(`Œuvre inconnue : ${path.relative(ROOT, workFile)}`)
if (!existsSync(sourceFile)) fail(`Source introuvable : ${sourceFile}`)

const work = JSON.parse(await readFile(workFile, 'utf8'))
const payload = JSON.parse(await readFile(sourceFile, 'utf8'))

/* ------------------------------------------------------------------ *
 * 2. Lecture de la source
 * ------------------------------------------------------------------ */

step('Lecture de la source')

const rawChapters = Array.isArray(payload) ? payload : (payload.chapters ?? [])
if (rawChapters.length === 0) {
  fail('Aucun chapitre trouvé dans le fichier source.')
}

const existing = work.chapters ?? []
const lastN = existing.reduce((max, c) => Math.max(max, Number(c.n) || 0), 0)

log(`  œuvre            ${work.name}`)
log(`  chapitres        ${existing.length} (dernier n=${lastN})`)
log(`  chapitres lus    ${rawChapters.length}`)

/* ------------------------------------------------------------------ *
 * 3. Contrôles
 * ------------------------------------------------------------------ */

step('Contrôles')

const existingNumbers = new Set(existing.map((c) => Number(c.n)))
const usedVerseIds = new Set()
for (const chapter of existing) {
  for (const verse of chapter.verses ?? []) usedVerseIds.add(`${slug}-c${chapter.n}-v${verse.n}`)
}

const problems = []
const imported = []

let expectedN = from ?? lastN + 1
if (from !== null && (!Number.isInteger(from) || from < 1)) {
  problems.push(`--from doit être un entier positif (reçu « ${args[fromArg + 1]} »).`)
}

for (const raw of rawChapters) {
  const n = Number(raw.n ?? raw.number ?? expectedN)

  if (n !== expectedN) {
    problems.push(
      `Numérotation discontinue : attendu le chapitre ${expectedN}, reçu ${n}. ` +
        `Les chapitres doivent se suivre sans trou.`,
    )
  }
  if (existingNumbers.has(n)) {
    problems.push(`Le chapitre ${n} existe déjà. Utilisez un fichier limité aux chapitres absents.`)
  }
  existingNumbers.add(n)
  expectedN += 1

  const rawVerses = raw.verses ?? raw.lines ?? []
  if (rawVerses.length === 0) {
    problems.push(`Chapitre ${n} : aucun verset.`)
    continue
  }

  const verses = []
  rawVerses.forEach((rawVerse, index) => {
    const v = Number(rawVerse.n ?? rawVerse.number ?? index + 1)
    const ar = clean(rawVerse.ar ?? rawVerse.text ?? '')
    const sadr = clean(rawVerse.sadr ?? '')
    const adj = clean(rawVerse.adj ?? '')

    if (v !== index + 1) {
      problems.push(`Chapitre ${n} : numérotation de verset discontinue (attendu ${index + 1}, reçu ${v}).`)
    }

    const text = ar || (sadr ? `${sadr} ${adj}`.trim() : '')
    if (!text) {
      problems.push(`Chapitre ${n}, verset ${v} : texte arabe vide.`)
      return
    }
    if (!/[؀-ۿ]/.test(text)) {
      problems.push(`Chapitre ${n}, verset ${v} : aucun caractère arabe — le texte est probablement erroné.`)
    }

    const verseId = `${slug}-c${n}-v${v}`
    if (usedVerseIds.has(verseId)) {
      problems.push(`Chapitre ${n}, verset ${v} : identifiant ${verseId} déjà utilisé.`)
      return
    }
    usedVerseIds.add(verseId)

    const verse = { ar: text }
    if (sadr) verse.sadr = sadr
    if (adj) verse.adj = adj

    const tr = clean(rawVerse.tr ?? rawVerse.transcription ?? '')
    if (tr) verse.tr = tr

    const fr = clean(rawVerse.fr ?? rawVerse.translation ?? '')
    if (fr) verse.fr = fr

    verses.push(verse)
  })

  imported.push({ n, verses })
}

if (problems.length > 0) {
  log('')
  for (const problem of problems) log(`  \x1b[31m✗\x1b[0m ${problem}`)
  log('')
  fail(`${problems.length} problème(s) détaillés ci-dessus : aucune écriture.`)
}

const lastImported = imported.at(-1)
const newVerses = imported.reduce((t, c) => t + c.verses.length, 0)

log(`  \x1b[32m✓\x1b[0m numérotation continue de ${from ?? lastN + 1} à ${lastImported.n}`)
log(`  \x1b[32m✓\x1b[0m ${newVerses} verset(s), aucun identifiant en collision`)

/* ------------------------------------------------------------------ *
 * 4. Écriture
 * ------------------------------------------------------------------ */

step(dryRun ? 'Simulation' : 'Écriture')

if (dryRun) {
  log(`  ${imported.length} chapitre(s) seraient ajoutés à ${path.relative(ROOT, workFile)}.`)
  log('  Rien n’a été écrit.\n')
  process.exit(0)
}

work.chapters = [...existing, ...imported]
work.chapters.sort((a, b) => a.n - b.n)

/* La provenance compte : on veut savoir de quelle édition viennent les
   chapitres ajoutés, et ne pas laisser croire qu'ils viennent du site. */
for (const key of ['license', 'source', 'providedBy']) {
  const value = payload[key]
  if (value === undefined) continue
  if (key === 'source' && Array.isArray(value)) {
    work.sources = [...new Set([...(work.sources ?? [work.source].filter(Boolean)), ...value])]
    continue
  }
  work[key] = value
}

if (payload.edition) work.edition = payload.edition

await writeFile(workFile, `${JSON.stringify(work, null, 2)}\n`, 'utf8')

log(`  ${imported.length} chapitre(s) ajouté(s), ${newVerses} verset(s).`)
log(`  total chapitres  : ${work.chapters.length}`)

const totalVerses = work.chapters.reduce((t, c) => t + c.verses.length, 0)
log(`  total versets    : ${totalVerses}`)
log('')
log('  Étapes suivantes :')
log('   1. node scripts/snapshot-source.mjs   # si des œuvres non déposées sont concernées')
log('   2. npm run data:build                 # regénère public/data/')
log('   3. npm run data:transcrire            # transcrit les nouveaux versets')
log('')