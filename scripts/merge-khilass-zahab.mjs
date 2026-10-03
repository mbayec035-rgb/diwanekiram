#!/usr/bin/env node
/**
 * DiwaneKiram — fusion du doublon « Khilass Zahab »
 * ---------------------------------------------------------------------------
 * Deux entrées se superposent pour la même œuvre du même auteur (id 6,
 * Elhadji Malick SY) et le même titre arabe :
 *
 *   A  khilasu-dh-dhahabi-fi-sirati-khayri-l-arabi   12 ch / 427 versets
 *   B  elhadji-malick-sy-khilass-zahab                30 ch / 1 056 versets
 *
 * Ce sont deux recensions du même poème : mêmes nombres de versets pour les
 * chapitres 1 à 11, variantes orthographiques et lexicales çà et là. B est
 * simplement plus complète (son chapitre 12 va jusqu'à 116 versets contre 80)
 * et porte 1 056 traductions françaises dont A ne dispose pas.
 *
 * L'entrée A est conservée : c'est elle qui a l'identifiant lisible, le slug
 * publié, les repères poétiques (Al-Basīt / Mīmiyya / Muhammadiyyāt) et
 * la séparation des deux hémistiches. B est supprimée.
 *
 *   node scripts/merge-khilass-zahab.mjs            # simulation
 *   node scripts/merge-khilass-zahab.mjs --appliquer
 *
 * Ce que fait la fusion, dans l'ordre :
 *   1. les 30 chapitres de B deviennent ceux de A, texte et transcription ;
 *   2. la séparation des deux hémistiches est reportée de A sur le texte de B,
 *      en la ventillant au même endroit : les mots viennent de B, la coupe
 *      structurelle vient de A ;
 *   3. les 1 056 traductions de B sont réindexées sur les identifiants de A et
 *      déposées dans content/oeuvres/<A>.fr.json ;
 *   4. B est retirée du figeage source, et son sidecar de transcription supprimé
 *      : ses identifiants numériques n'existent plus.
 */

import { existsSync } from 'node:fs'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { foldArabic } from './lib/catalogue.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const CIBLE = 'khilasu-dh-dhahabi-fi-sirati-khayri-l-arabi'
const DOUBLON = 'elhadji-malick-sy-khilass-zahab'

const CIBLE_FILE = path.join(ROOT, 'content', 'oeuvres', `${CIBLE}.json`)
const CIBLE_FR_FILE = path.join(ROOT, 'content', 'oeuvres', `${CIBLE}.fr.json`)
const CIBLE_PHONO_FILE = path.join(ROOT, 'content', 'phonetique', `${CIBLE}.json`)
const DOUBLON_PHONO_FILE = path.join(ROOT, 'content', 'phonetique', `${DOUBLON}.json`)
const SNAPSHOT_FILE = path.join(ROOT, 'content', 'source', 'residu.json')

const appliquer = process.argv.includes('--appliquer')

const log = (...args) => console.log(...args)
const step = (title) => log(`\n\x1b[36m▸ ${title}\x1b[0m`)
const vert = (s) => `\x1b[32m${s}\x1b[0m`

function fail(message) {
  log(`\n\x1b[31m✗ ${message}\x1b[0m\n`)
  process.exit(1)
}

const rel = (file) => path.relative(ROOT, file)
const mots = (s) => String(s ?? '').trim().split(/\s+/).filter(Boolean)

/** Texte réduit à ses lettres, sans espace : sert à comparer deux récensions
 *  qui hachent différemment la phrase (B détache « وَ الْقِدَمِ » là où A
 *  attache « وَالْقِدَمِ », ce qui décale tout comptage de mots). */
const lettres = (s) => foldArabic(s).replace(/\s+/g, '')

/** Distance de Levenshtein, deux lignes suffisent : les chaînes comparées
 *  sont un hémistiche, pas un chapitre. */
function distance(a, b) {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  let precedente = Array.from({ length: b.length + 1 }, (_, i) => i)

  for (let i = 1; i <= a.length; i += 1) {
    const courante = [i]
    for (let j = 1; j <= b.length; j += 1) {
      courante[j] = Math.min(
        precedente[j] + 1,
        courante[j - 1] + 1,
        precedente[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
    precedente = courante
  }

  return precedente[b.length]
}

/** Écart relatif entre deux chaînes de lettres. */
function ecart(a, b) {
  const plusLong = Math.max(a.length, b.length)
  return plusLong === 0 ? 0 : distance(a, b) / plusLong
}

/**
 * Retrouve dans le texte de B la coupe des deux hémistiches que A indique.
 *
 * A donne sadr/adj, B ne les donne pas. On cherche le point de coupe de B qui
 * se rapproche le plus des deux hémistiches de A, en comparant les lettres et
 * non les mots. Le texte affiché reste celui de B : seuls les mots changent de
 * ligne. Une coupe qui ne retrouverait pas les deux hémistiches est refusée
 * plutôt que devinée — un verset sans séparation vaut mieux qu'une séparation
 * fausse.
 */
function retrouverLaCoupe(arB, sadrA, adjA) {
  const motsB = mots(arB)
  if (motsB.length < 2) return null

  const cibleSadr = lettres(sadrA)
  const cibleAdj = lettres(adjA)
  if (cibleSadr.length === 0 || cibleAdj.length === 0) return null

  let meilleure = null

  for (let k = 1; k < motsB.length; k += 1) {
    const sadr = lettres(motsB.slice(0, k).join(' '))
    const adj = lettres(motsB.slice(k).join(' '))
    const score = Math.max(ecart(sadr, cibleSadr), ecart(adj, cibleAdj))
    if (meilleure === null || score < meilleure.score) meilleure = { k, score, sadr, adj }
  }

  if (meilleure === null || meilleure.score > 0.34) return null

  return {
    sadr: motsB.slice(0, meilleure.k).join(' '),
    adj: motsB.slice(meilleure.k).join(' '),
  }
}

/* ------------------------------------------------------------------ *
 * 1. Lecture
 * ------------------------------------------------------------------ */

step('Lecture')

if (!existsSync(CIBLE_FILE)) fail(`œuvre cible introuvable : ${rel(CIBLE_FILE)}`)
if (!existsSync(SNAPSHOT_FILE)) fail(`figeage introuvable : ${rel(SNAPSHOT_FILE)}`)

const cible = JSON.parse(await readFile(CIBLE_FILE, 'utf8'))
const snapshot = JSON.parse(await readFile(SNAPSHOT_FILE, 'utf8'))
const doublon = snapshot.xassidas.find((w) => w.slug === DOUBLON)

if (!doublon) fail(`« ${DOUBLON} » est absent du figeage : la fusion est peut-être déjà faite.`)
if (cible.chapters.length >= doublon.chapters.length) {
  fail(
    `« ${CIBLE} » compte déjà ${cible.chapters.length} chapitres ` +
      `(doublon : ${doublon.chapters.length}) : fusion déjà appliquée.`,
  )
}

log(`  cible    ${cible.name}`)
log(`           ${cible.chapters.length} chapitres, ${cible.chapters.reduce((t, c) => t + c.verses.length, 0)} versets`)
log(`  doublon  ${doublon.name}`)
log(`           ${doublon.chapters.length} chapitres, ${doublon.chapters.reduce((t, c) => t + c.verses.length, 0)} versets`)

/* ------------------------------------------------------------------ *
 * 2. Fusion des chapitres
 * ------------------------------------------------------------------ */

step('Fusion des chapitres')

const doublonVerseIds = new Set()
for (const chapter of doublon.chapters) {
  for (const verse of chapter.verses) doublonVerseIds.add(String(verse.id))
}

let avecHemisstiches = 0
let sansHemisstiches = 0
let traduitees = 0
let sansTraduction = 0
let transcrites = 0

const traductions = new Map()
const transcriptions = new Map()

const chapters = doublon.chapters.map((chapter, chapterIndex) => {
  const ancien = cible.chapters[chapterIndex]
  const n = chapterIndex + 1

  const verses = chapter.verses.map((verse, verseIndex) => {
    const sortie = { ar: verse.ar }
    const verseId = `${CIBLE}-c${n}-v${verseIndex + 1}`

    if (verse.tr) {
      sortie.tr = verse.tr
      transcriptions.set(verseId, verse.tr)
      transcrites += 1
    }

    /* Report de la coupe des deux hémistiches. A donne sadr/adj, B ne les
       donne pas : on la retrouve dans le texte de B, aux mots près. */
    const precedent = ancien?.verses?.[verseIndex]

    if (precedent?.sadr && precedent?.adj) {
      const coupe = retrouverLaCoupe(verse.ar, precedent.sadr, precedent.adj)
      if (coupe) {
        sortie.sadr = coupe.sadr
        sortie.adj = coupe.adj
        avecHemisstiches += 1
      } else {
        sansHemisstiches += 1
      }
    } else {
      sansHemisstiches += 1
    }

    const fr = snapshot.translations?.[String(verse.id)]
    if (fr) {
      traductions.set(verseId, fr)
      traduitees += 1
    } else {
      sansTraduction += 1
    }

    return sortie
  })

  return { n, verses }
})

const totalVerses = chapters.reduce((t, c) => t + c.verses.length, 0)

log(`  ${vert('✓')} ${chapters.length} chapitres, ${totalVerses} versets`)
log(`  ${vert('✓')} deux hémistiches conservés pour ${avecHemisstiches} versets`)
log(`  ${avecHemisstiches === 0 ? '\x1b[31m✗' : '\x1b[33m!'} ${sansHemisstiches} versets sans coupe (aucun repère dans l'ancienne entrée)`)
log(`  ${vert('✓')} ${transcrites} transcriptions reprises`)
log(`  ${vert('✓')} ${traduitees} traductions réindexées${sansTraduction ? `, ${sansTraduction} sans traduction` : ''}`)

if (chapters.length !== 30) fail(`le doublon devrait compter 30 chapitres, il en compte ${chapters.length}`)

/* ------------------------------------------------------------------ *
 * 3. Sidecar de transcription
 * ------------------------------------------------------------------ */

step('Transcriptions')

let sidecar = { slug: CIBLE, convention: 'v1', verses: {} }
if (existsSync(CIBLE_PHONO_FILE)) {
  sidecar = JSON.parse(await readFile(CIBLE_PHONO_FILE, 'utf8'))
  sidecar.verses = sidecar.verses ?? {}
}

let ecrites = 0
let reecrites = 0
for (const [verseId, latin] of transcriptions) {
  if (sidecar.verses[verseId]) reecrites += 1
  else ecrites += 1
  sidecar.verses[verseId] = latin
}

sidecar.slug = CIBLE
log(`  ${ecrites} ajout(s), ${reecrites} réécrite(s) dans ${rel(CIBLE_PHONO_FILE)}`)

/* ------------------------------------------------------------------ *
 * 4. Figeage source : retrait du doublon
 * ------------------------------------------------------------------ */

step('Retrait du doublon du figeage')

const avantWorks = snapshot.xassidas.length
snapshot.xassidas = snapshot.xassidas.filter((w) => w.slug !== DOUBLON)

let avantTr = Object.keys(snapshot.translations ?? {}).length
for (const verseId of doublonVerseIds) delete snapshot.translations[verseId]
let apresTr = Object.keys(snapshot.translations ?? {}).length

snapshot.audio = (snapshot.audio ?? []).filter((a) => String(a.xassidaId) !== String(doublon.id))

log(`  œuvres   ${avantWorks} → ${snapshot.xassidas.length}`)
log(`  traductions ${avantTr} → ${apresTr}`)
log(`  sidecar ${rel(DOUBLON_PHONO_FILE)} ${existsSync(DOUBLON_PHONO_FILE) ? 'supprimé' : 'déjà absent'}`)

/* ------------------------------------------------------------------ *
 * 5. Écriture
 * ------------------------------------------------------------------ */

step(appliquer ? 'Écriture' : 'Simulation')

const oeuvre = {
  ...cible,
  /* Les chapitres 13 à 30 et le texte des chapitres 1 à 12 viennent de
     l'ancienne entrée « elhadji-malick-sy-khilass-zahab », issue de
     xassida.sn : le signaler vaut mieux que de laisser croire que les
     30 chapitres sortent de markazulfuhum.app. */
  providedBy: 'markazulfuhum.app, xassida.sn',
  chapters,
  note:
    `Texte, transcription et traduction repris de l'ancienne entrée « ${DOUBLON} » ` +
    `(${doublon.chapters.length} chapitres, même auteur id ${cible.author}, même ` +
    'titre arabe), fusionnée dans cette entrée puis supprimée : même œuvre, deux ' +
    'recensions. La coupe des deux hémistiches, absente de cette recension, a été ' +
    `reprise de l'ancienne pour les ${avecHemisstiches} versets qui en avaient une.`,
}

const serialise = (value) => `${JSON.stringify(value, null, 2)}\n`

if (!appliquer) {
  log('')
  log('  Simulation : rien n’a été écrit. Relancez avec --appliquer.')
  log('')
  log('  Étapes suivantes :')
  log('   1. npm run data:build')
  log('   2. node scripts/snapshot-source.mjs   # re-fige le résidu sans le doublon')
  log('   3. npm run typecheck && npm test && npm run build')
  log('')
  process.exit(0)
}

await writeFile(CIBLE_FILE, serialise(oeuvre), 'utf8')
await writeFile(
  CIBLE_FR_FILE,
  serialise({
    slug: CIBLE,
    lang: 'fr',
    verses: Object.fromEntries(traductions),
  }),
  'utf8',
)
await writeFile(SNAPSHOT_FILE, serialise(snapshot), 'utf8')
await writeFile(CIBLE_PHONO_FILE, serialise(sidecar), 'utf8')

if (existsSync(DOUBLON_PHONO_FILE)) await unlink(DOUBLON_PHONO_FILE)

log(`  ${rel(CIBLE_FILE)} : ${chapters.length} chapitres`)
log(`  ${rel(CIBLE_FR_FILE)} : ${traduitees} traductions`)
log(`  ${rel(CIBLE_PHONO_FILE)} : ${Object.keys(sidecar.verses).length} transcriptions`)
log(`  ${rel(SNAPSHOT_FILE)} : doublon retiré`)
log(`  ${rel(DOUBLON_PHONO_FILE)} : supprimé`)
log('')
log('  Étapes suivantes :')
log('   1. npm run data:build')
log('   2. node scripts/snapshot-source.mjs   # re-fige le résidu sans le doublon')
log('   3. npm run typecheck && npm test && npm run build')
log('')