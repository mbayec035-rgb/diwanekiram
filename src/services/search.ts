/* =========================================================
   Recherche, filtres et tri — logique pure et testable.
   ========================================================= */

import type { Author, Xassida } from '../types/domain'

/* Plages Unicode écrites en échappements pour rester lisibles. */
const ARABIC_DIACRITICS = /[ً-ٰٟۖ-ۭ]/g
const TATWEEL = /ـ/g
const ALEF_VARIANTS = /[آأإٱ]/g
const ALEF_MAQSURA = /ى/g
const WAW_WITH_HAMZA = /ؤ/g
const YEH_WITH_HAMZA = /ئ/g
const TA_MARBUTA = /ة/g
const ARABIC_RANGE = /[؀-ۿ]/
const LATIN_DIACRITICS = /[̀-ͯ]/g

/** Normalise l'arabe : retire les voyelles, unifie les lettres équivalentes. */
export function normalizeArabic(input: string): string {
  return input
    .replace(ARABIC_DIACRITICS, '')
    .replace(TATWEEL, '')
    .replace(ALEF_VARIANTS, 'ا')
    .replace(ALEF_MAQSURA, 'ي')
    .replace(WAW_WITH_HAMZA, 'و')
    .replace(YEH_WITH_HAMZA, 'ي')
    .replace(TA_MARBUTA, 'ه')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/** Normalise un texte latin (titres translittérés, noms d'auteur). */
export function normalizeLatin(input: string): string {
  return input
    .normalize('NFD')
    .replace(LATIN_DIACRITICS, '')
    .replace(/['’]/g, ' ')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function normalize(input: string): string {
  return ARABIC_RANGE.test(input) ? normalizeArabic(input) : normalizeLatin(input)
}

/** Index de recherche pré-calculé pour une xassida. */
export function buildIndex(xassida: Xassida, author: Author | undefined): string {
  return normalize(
    [xassida.name, xassida.nameAr, xassida.nameSearch, author?.name ?? '', author?.nameAr ?? ''].join(' '),
  )
}

export type LengthFilter = 'all' | 'short' | 'medium' | 'long'
export type SortKey = 'az' | 'za' | 'verses-desc' | 'verses-asc' | 'translation'

export interface FilterOptions {
  query?: string
  authorId?: string | null
  length?: LengthFilter
  sort?: SortKey
}

const LENGTH_RANGES: Record<Exclude<LengthFilter, 'all'>, [number, number]> = {
  short: [0, 30],
  medium: [31, 120],
  long: [121, Number.MAX_SAFE_INTEGER],
}

const collator = new Intl.Collator('fr', { sensitivity: 'base' })

export function filterXassidas(
  xassidas: Xassida[],
  authorsById: Map<string, Author>,
  options: FilterOptions = {},
): Xassida[] {
  const { query = '', authorId = null, length = 'all', sort = 'az' } = options
  const terms = normalize(query).split(' ').filter(Boolean)

  const filtered = xassidas.filter((xassida) => {
    if (authorId && xassida.authorId !== authorId) return false

    if (length !== 'all') {
      const [min, max] = LENGTH_RANGES[length]
      if (xassida.verseCount < min || xassida.verseCount > max) return false
    }

    if (terms.length === 0) return true

    const haystack = buildIndex(xassida, authorsById.get(xassida.authorId))
    return terms.every((term) => haystack.includes(term))
  })

  const sorted = [...filtered]

  switch (sort) {
    case 'za':
      sorted.sort((a, b) => collator.compare(b.name, a.name))
      break
    case 'verses-desc':
      sorted.sort((a, b) => b.verseCount - a.verseCount || collator.compare(a.name, b.name))
      break
    case 'verses-asc':
      sorted.sort((a, b) => a.verseCount - b.verseCount || collator.compare(a.name, b.name))
      break
    case 'translation':
      sorted.sort(
        (a, b) =>
          a.translatedRatio - b.translatedRatio ||
          a.translatedCount - b.translatedCount ||
          collator.compare(a.name, b.name),
      )
      break
    default:
      sorted.sort((a, b) => collator.compare(a.name, b.name))
  }

  return sorted
}

/** Correspondances d'un terme sur une xassida (pour surligner dans l'UI). */
export function highlightRanges(text: string, query: string): Array<[number, number]> {
  const terms = normalize(query).split(' ').filter((term) => term.length > 1)
  if (terms.length === 0) return []

  const haystack = normalize(text)
  const ranges: Array<[number, number]> = []

  for (const term of terms) {
    let from = 0
    for (;;) {
      const index = haystack.indexOf(term, from)
      if (index === -1) break
      ranges.push([index, index + term.length])
      from = index + term.length
    }
  }

  return ranges.sort((a, b) => a[0] - b[0])
}

export const LENGTH_OPTIONS: Array<{ value: LengthFilter; label: string }> = [
  { value: 'all', label: 'Toutes' },
  { value: 'short', label: 'Courtes' },
  { value: 'medium', label: 'Moyennes' },
  { value: 'long', label: 'Longues' },
]

export const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'az', label: 'A → Z' },
  { value: 'za', label: 'Z → A' },
  { value: 'verses-desc', label: 'Plus longues' },
  { value: 'verses-asc', label: 'Plus courtes' },
  { value: 'translation', label: 'Traduction' },
]
