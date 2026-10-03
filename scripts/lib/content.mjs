/* ------------------------------------------------------------------
   Lecture des données de la bibliothèque.

   Le générateur de transcriptions (`scripts/transcrire.mjs`) et la
   construction de la bibliothèque (`scripts/build-library.mjs`) lisent
   les mêmes fichiers : ils passent donc par ici. Une seule règle de
   lecture, sinon les identifiants divergent et une transcription se
   range sous une clé que l'application ne cherche pas.

   Le corpus publié (`public/data/`) fait foi pour les identifiants :
   c'est le seul endroit où ils sont définitifs, après fusion.
------------------------------------------------------------------ */

import { existsSync } from 'node:fs'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { clean } from './catalogue.mjs'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const DATA_DIR = path.join(ROOT, 'public', 'data')
export const PHONETIQUE_DIR = path.join(ROOT, 'content', 'phonetique')

/**
 * Fichiers d'une extension donnée, triés : le tri fait l'ordre de
 * lecture, donc l'ordre des slugs.
 */
export async function listFiles(directory, extension) {
  if (!existsSync(directory)) return []
  const names = await readdir(directory)
  return names
    .filter((name) => name.toLowerCase().endsWith(extension))
    .sort()
    .map((name) => path.join(directory, name))
}

export async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch (error) {
    throw new Error(`${path.relative(ROOT, file)} : JSON illisible (${error.message})`)
  }
}

/* ------------------------------------------------------------------ *
 * Corpus publié
 * ------------------------------------------------------------------ */

/**
 * Le corpus tel qu'il est servi : tout ce que le lecteur peut ouvrir.
 *
 * Chaque verset porte son identifiant publié, qui est la clef sous
 * laquelle une transcription doit être rangée.
 */
export async function loadPublishedWorks() {
  const manifest = await readJson(path.join(DATA_DIR, 'manifest.json'))
  const works = []

  for (const item of manifest.items ?? []) {
    const document = await readJson(path.join(DATA_DIR, item.file))
    const verses = []

    for (const chapter of document.chapters ?? []) {
      for (const verse of chapter.verses ?? []) {
        verses.push({
          id: verse.id,
          chapterN: chapter.n,
          verseN: verse.n,
          ar: clean(verse.ar ?? ''),
          tr: clean(verse.tr ?? ''),
        })
      }
    }

    works.push({ slug: item.slug, id: document.id ?? item.id, verses })
  }

  return { generatedAt: manifest.generatedAt ?? null, totals: manifest.totals ?? null, works }
}

/* ------------------------------------------------------------------ *
 * Transcriptions phonétiques
 * ------------------------------------------------------------------ */

/** Fichiers de transcription présents dans content/phonetique/. */
export async function listPhonetique() {
  return listFiles(PHONETIQUE_DIR, '.json')
}

/** Transcription déposée pour une œuvre, ou `null`. */
export async function readPhonetique(slug) {
  const file = path.join(PHONETIQUE_DIR, `${slug}.json`)
  if (!existsSync(file)) return null
  return readJson(file)
}

/** Dépose la transcription d'une œuvre. */
export async function writePhonetique(slug, payload) {
  await writeFile(
    path.join(PHONETIQUE_DIR, `${slug}.json`),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8',
  )
}