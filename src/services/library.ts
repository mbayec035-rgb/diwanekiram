/* =========================================================
   Accès au catalogue.
   Point d'entrée unique : le jour où une API externe prend
   le relais, il suffit de réimplémenter les fonctions de
   ce fichier — aucun composant n'en dépend directement.
   ========================================================= */

import type {
  AudioEntry,
  Author,
  Manifest,
  ManifestItem,
  TranslationsDocument,
  VersesDocument,
  Xassida,
} from '../types/domain'
import { filterXassidas } from './search'
import type { StudyVerse } from './quiz'

const DATA_ROOT = `${import.meta.env.BASE_URL}data`.replace(/\/{2,}/g, '/')

const cache = new Map<string, Promise<unknown>>()

async function getJson<T>(file: string): Promise<T> {
  const cached = cache.get(file)
  if (cached) return cached as Promise<T>

  const request = fetch(`${DATA_ROOT}/${file}`)
    .then((response) => {
      if (!response.ok) throw new Error(`Catalogue indisponible (${response.status}) — ${file}`)
      return response.json() as Promise<T>
    })
    .catch((error: unknown) => {
      cache.delete(file)
      throw error
    })

  cache.set(file, request)
  return request
}

export const loadManifest = () => getJson<Manifest>('manifest.json')
export const loadXassidas = () => getJson<Xassida[]>('xassidas.json')
export const loadAuthors = () => getJson<Author[]>('authors.json')
export const loadAudio = () => getJson<AudioEntry[]>('audio.json').catch(() => [] as AudioEntry[])

/**
 * Verse-set plat pour l'apprentissage et le quiz.
 * La charge est faite à la demande : seuls les fichiers réellement ouverts
 * sont téléchargés, et le cache JSON évite les allers-retours.
 */
export async function loadStudyVerses(
  item: ManifestItem,
  xassida: Xassida,
  author?: Author,
): Promise<StudyVerse[]> {
  const [verses, translations] = await Promise.all([
    fetchVerses(item),
    fetchTranslations(item).catch(() => null),
  ])

  const out: StudyVerse[] = []
  for (const chapter of verses.chapters) {
    for (const verse of chapter.verses) {
      out.push({
        id: verse.id,
        slug: xassida.slug,
        xassidaName: xassida.name,
        authorName: author?.name ?? 'Auteur inconnu',
        chapter: chapter.n,
        n: verse.n,
        ar: verse.ar,
        tr: verse.tr,
        fr: translations?.verses?.[verse.id] ?? '',
      })
    }
  }
  return out
}

const loadVerses = (file: string) => getJson<VersesDocument>(file)
const loadTranslations = (file: string) => getJson<TranslationsDocument>(file)

/** Charge les versets d'une xassida à partir de son entrée de manifeste. */
export function fetchVerses(item: ManifestItem) {
  return loadVerses(item.file)
}

/** Charge les traductions disponibles ; le squelette vide est renvoyé tel quel. */
export function fetchTranslations(item: ManifestItem) {
  return loadTranslations(item.translationsFile)
}

/* ------------------------------------------------------------------ *
 * Index
 * ------------------------------------------------------------------ */

export interface Catalog {
  manifest: Manifest
  xassidas: Xassida[]
  authors: Author[]
  authorsById: Map<string, Author>
  itemsBySlug: Map<string, ManifestItem>
}

let catalogPromise: Promise<Catalog> | null = null

export function loadCatalog(): Promise<Catalog> {
  catalogPromise ??= Promise.all([loadManifest(), loadXassidas(), loadAuthors()]).then(
    ([manifest, xassidas, authors]) => ({
      manifest,
      xassidas,
      authors,
      authorsById: new Map(authors.map((author) => [author.id, author])),
      itemsBySlug: new Map(manifest.items.map((item) => [item.slug, item])),
    }),
  )
  return catalogPromise
}

export const getItem = (catalog: Catalog, slug: string) => catalog.itemsBySlug.get(slug)

export const getXassida = (catalog: Catalog, slug: string) =>
  catalog.xassidas.find((xassida) => xassida.slug === slug)

export const getAuthor = (catalog: Catalog, authorId: string) => catalog.authorsById.get(authorId)

/** Recherche rapide par titre, nom d'auteur ou mot-clé (français ou arabe). */
export function searchXassidas(
  query: string,
  xassidas: Xassida[],
  authorsById: Map<string, Author>,
): Xassida[] {
  return filterXassidas(xassidas, authorsById, { query, sort: 'az' })
}

/** Toutes les œuvres d'un auteur, triées par nom (utilisé par la fiche auteur). */
export function worksOfAuthor(catalog: Catalog, authorId: string): Xassida[] {
  return catalog.xassidas
    .filter((xassida) => xassida.authorId === authorId)
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}
