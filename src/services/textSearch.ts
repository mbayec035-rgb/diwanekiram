/* =========================================================
   Recherche dans le texte d'une œuvre — logique pure et testable.

   Le texte arabe porte ses voyelles : chercher « الحمد » doit trouver
   « الْحَمْدُ ». On normalise donc une seule fois, à l'indexation, et on garde
   une table de correspondance vers le texte d'origine : sans elle, le
   surlignage viserait des positions décalées par les voyelles retirées.
   ========================================================= */

import type { Verse } from '../types/domain'

export type SearchLayer = 'arabe' | 'transcription' | 'traduction'

export const SEARCH_LAYER_LABEL: Record<SearchLayer, string> = {
  arabe: 'Arabe',
  transcription: 'Transcription',
  traduction: 'Traduction',
}

/* ---- Normalisation ---- */

/* Plages Unicode en échappements : invisibles dans un éditeur. */
const ARABIC_DIACRITICS = /[ً-ٰٟۖ-ۭ]/
const TATWEEL = /ـ/
const ALEF_VARIANTS = /[آأإٱ]/
const ALEF_MAQSURA = /ى/
const WAW_WITH_HAMZA = /ؤ/
const YEH_WITH_HAMZA = /ئ/
const TA_MARBUTA = /ة/
const ARABIC_RANGE = /[؀-ۿ]/
const COMBINING_MARKS = /[̀-ͯ]/
const LATIN_KEPT = /[a-z0-9]/
/* Ayn, hamza et apostrophes : séparateurs de lettres, pas de lettres. */
const LATIN_IGNORED = /['’ʼʿʾ]/

/** Un caractère normalisé, avec la place qu'il occupait dans l'original. */
interface Origin {
  /** Début du caractère source, en index UTF-16. */
  start: number
  /** Fin du caractère source (exclue), en index UTF-16. */
  end: number
}

export interface Normalized {
  text: string
  origins: Origin[]
}

/** Normalise un caractère latin : sans diacritiques, sans casse. */
function foldLatin(char: string): string {
  /* NFD décompose 'ā' en 'a' + accent, qu'on retire ensuite. */
  const sansAccent = char.normalize('NFD').replace(COMBINING_MARKS, '')
  if (sansAccent.length === 0) return ''
  if (LATIN_IGNORED.test(sansAccent)) return ''

  /* Un seul caractère sort : la table de correspondance en compte un par
     caractère du texte normalisé. */
  const bas = sansAccent.toLowerCase()[0]
  if (!bas) return ''
  return LATIN_KEPT.test(bas) ? bas : ' '
}

/** Normalise un caractère arabe : sans voyelles, lettres équivalentes unifiées. */
function foldArabic(char: string): string {
  if (ARABIC_DIACRITICS.test(char) || TATWEEL.test(char)) return ''
  if (ALEF_VARIANTS.test(char)) return 'ا'
  if (ALEF_MAQSURA.test(char)) return 'ي'
  if (WAW_WITH_HAMZA.test(char)) return 'و'
  if (YEH_WITH_HAMZA.test(char)) return 'ي'
  if (TA_MARBUTA.test(char)) return 'ه'
  return /\p{L}|\p{N}/u.test(char) ? char : ' '
}

/**
 * Normalise en gardant la correspondance vers l'original. Le texte et les
 * origines ont toujours la même longueur : `text[i]` vient de
 * `origins[i]` dans la chaîne d'origine.
 */
export function normalizeWithOrigins(input: string, forceArabic = false): Normalized {
  const arabe = forceArabic || ARABIC_RANGE.test(input)

  let text = ''
  const origins: Origin[] = []
  let espace = true /* Supprime les espaces de tête. */
  let index = 0

  while (index < input.length) {
    /* On avance par point de code : un caractère arabe hors BMP occupe deux
       unités UTF-16, et sa place doit compter juste. */
    const codePoint = input.codePointAt(index)
    if (codePoint === undefined) break
    const size = codePoint > 0xffff ? 2 : 1
    const char = String.fromCodePoint(codePoint)
    const folded = arabe ? foldArabic(char) : foldLatin(char)

    if (folded === '') {
      index += size
      continue
    }

    if (folded === ' ') {
      if (espace) {
        index += size
        continue
      }
      espace = true
    } else {
      espace = false
    }

    text += folded
    origins.push({ start: index, end: index + size })
    index += size
  }

  /* Espace final : il ne ferait que décaler les index sans rien chercher. */
  if (text.endsWith(' ')) {
    text = text.slice(0, -1)
    origins.pop()
  }

  return { text, origins }
}

/** Normalise une requête : même alphabet, mêmes règles que le texte. */
export function normalizeQuery(input: string): string {
  return normalizeWithOrigins(input).text
}

/* ---- Index ---- */

export interface LayerText {
  layer: SearchLayer
  text: string
}

export interface IndexEntry {
  verseId: string
  chapterN: number
  verseN: number
  layers: LayerText[]
}

export interface TextIndex {
  entries: IndexEntry[]
  /** Texte normalisé de chaque entrée, dans le même ordre que `entries`. */
  haystacks: string[]
}

export interface IndexOptions {
  arabic: boolean
  transcription: boolean
  translation: boolean
}

interface FlatVerse {
  verse: Verse
  chapterN: number
}

/**
 * Construit l'index d'une œuvre. Seules les colonnes affichées y entrent : on
 * ne trouve pas un mot dans une couche cachée, qu'on ne pourrait pas surligner.
 * La normalisation se fait ici, une fois pour toutes.
 */
export function buildTextIndex(
  verses: FlatVerse[],
  translations: Record<string, string> | undefined,
  options: IndexOptions,
): TextIndex {
  const entries: IndexEntry[] = []
  const haystacks: string[] = []

  for (const { verse, chapterN } of verses) {
    const layers: LayerText[] = []

    /* Les deux hémistiches sont indexés séparément : c'est ce que la barre
       affiche, et les chercher dans `ar` décalerait les positions. */
    if (options.arabic) {
      if (verse.sadr) layers.push({ layer: 'arabe', text: verse.sadr })
      if (verse.adj) layers.push({ layer: 'arabe', text: verse.adj })
      else if (!verse.sadr && verse.ar) layers.push({ layer: 'arabe', text: verse.ar })
    }

    if (options.transcription && verse.tr.trim()) {
      layers.push({ layer: 'transcription', text: verse.tr })
    }

    if (options.translation) {
      const translated = translations?.[verse.id]?.trim()
      if (translated) layers.push({ layer: 'traduction', text: translated })
    }

    if (layers.length === 0) continue

    entries.push({ verseId: verse.id, chapterN, verseN: verse.n, layers })
    /* Chaque couche est normalisée dans son propre alphabet : forcer l'arabe sur
       une transcription garderait le « ḥ » là où la requête le réduit à « h ». */
    haystacks.push(layers.map((entry) => normalizeWithOrigins(entry.text).text).join(' '))
  }

  return { entries, haystacks }
}

/** Découpe la requête en termes : tous doivent être présents. */
function terms(query: string): string[] {
  return normalizeQuery(query).split(' ').filter(Boolean)
}

/** Indices des entrées qui contiennent tous les termes de la requête. */
export function searchIndex(index: TextIndex, query: string): number[] {
  const wanted = terms(query)
  if (wanted.length === 0) return []

  const found: number[] = []
  for (let i = 0; i < index.haystacks.length; i += 1) {
    const haystack = index.haystacks[i]
    if (wanted.every((term) => haystack.includes(term))) found.push(i)
  }
  return found
}

/* ---- Surlignage ---- */

export interface SearchSegment {
  layer: SearchLayer
  text: string
  /** Identifiant de l'occurrence, pour la colorer plus fort quand elle est active. */
  id: string | null
}

/** Un caractère que la normalisation efface : voyelle, signe ou tatweel. */
function isSkipped(char: string, arabe: boolean): boolean {
  return (arabe ? foldArabic(char) : foldLatin(char)) === ''
}

/** Étale une plage sur les caractères effacés qui l'encadrent.
 *
 *  Un mot vocalisé s'écrit الْحَمْدُ : les voyelles disparaissent du texte
 *  normalisé, et avec elles le damma final. Sans ce rattrapage, la marque
 *  resterait en dehors du surlignage — une lettre surlignée à moitié. */
function stretchOverSkipped(text: string, from: number, to: number, arabe: boolean): [number, number] {
  let start = from
  let end = to

  while (start > 0) {
    const size = charSizeBefore(text, start)
    if (size === 0) break
    const char = text.slice(start - size, start)
    if (!isSkipped(char, arabe)) break
    start -= size
  }

  while (end < text.length) {
    const codePoint = text.codePointAt(end)
    if (codePoint === undefined) break
    const size = codePoint > 0xffff ? 2 : 1
    if (!isSkipped(text.slice(end, end + size), arabe)) break
    end += size
  }

  return [start, end]
}

/** Taille en unités UTF-16 du caractère qui finit à `index`. */
function charSizeBefore(text: string, index: number): number {
  const previous = text.charCodeAt(index - 1)
  /* Bas surrégate : le caractère commence un avant. */
  if (previous >= 0xdc00 && previous <= 0xdfff) return 2
  return 1
}

/** Convertit une plage de la chaîne normalisée en plage de l'original. */
function toOriginalRange(
  normalized: Normalized,
  from: number,
  to: number,
  source: string,
  arabe: boolean,
): [number, number] | null {
  const start = normalized.origins[from]
  const end = normalized.origins[to - 1]
  if (!start || !end) return null
  return stretchOverSkipped(source, start.start, end.end, arabe)
}

/** Plages d'occurrences dans le texte normalisé, triées et sans recouvrement. */
function findRanges(haystack: string, wanted: string[]): Array<[number, number]> {
  const ranges: Array<[number, number]> = []

  for (const term of wanted) {
    let from = 0
    for (;;) {
      const index = haystack.indexOf(term, from)
      if (index === -1) break
      ranges.push([index, index + term.length])
      from = index + term.length
    }
  }

  ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1])

  /* Deux termes qui se recouvrent ne doivent pas produire deux balises
     imbriquées : on garde la plus large. */
  const merged: Array<[number, number]> = []
  for (const range of ranges) {
    const previous = merged[merged.length - 1]
    if (previous && range[0] < previous[1]) previous[1] = Math.max(previous[1], range[1])
    else merged.push([...range])
  }
  return merged
}

/**
 * Découpe chaque bloc autour des occurrences, en gardant l'ordre : le
 * résultat[i] correspond à l'entrée layers[i].
 *
 * Un même layer peut apparaître deux fois — les deux hémistiches d'un vers.
 * Les regrouper par layer les confondrait : le lecteur afficherait le texte
 * arabe en double.
 */
export function segmentBlocks<T extends LayerText>(layers: T[], query: string): Array<SearchSegment[]> {
  const wanted = terms(query)

  return layers.map((entry) => {
    if (wanted.length === 0) return [{ layer: entry.layer, text: entry.text, id: null }]

    /* L'arabe et le latin ne se mélangent pas : une requête française ne doit
       pas s'appliquer à une ligne vocalisée. */
    const arabe = ARABIC_RANGE.test(entry.text)
    const normalized = normalizeWithOrigins(entry.text, arabe)
    const ranges = findRanges(normalized.text, wanted)
      .map(([from, to]) => toOriginalRange(normalized, from, to, entry.text, arabe))
      .filter((range): range is [number, number] => range !== null)

    if (ranges.length === 0) return [{ layer: entry.layer, text: entry.text, id: null }]

    const segments: SearchSegment[] = []
    let cursor = 0

    ranges.forEach(([from, to], index) => {
      if (from > cursor) {
        segments.push({ layer: entry.layer, text: entry.text.slice(cursor, from), id: null })
      }
      segments.push({
        layer: entry.layer,
        text: entry.text.slice(from, to),
        id: `${entry.layer}:${index}`,
      })
      cursor = to
    })

    if (cursor < entry.text.length) {
      segments.push({ layer: entry.layer, text: entry.text.slice(cursor), id: null })
    }

    return segments
  })
}

/** Version à plat de `segmentBlocks`, quand l'ordre des blocs n'importe pas. */
export function segmentLayers(layers: LayerText[], query: string): SearchSegment[] {
  return segmentBlocks(layers, query).flat()
}

/** Extrait court autour de la première occurrence, pour la liste des résultats. */
export function excerptAround(text: string, query: string, radius = 42): string {
  const wanted = terms(query)
  if (wanted.length === 0) return text.slice(0, radius * 2).trim()

  const arabe = ARABIC_RANGE.test(text)
  const normalized = normalizeWithOrigins(text, arabe)
  const ranges = findRanges(normalized.text, wanted)

  const first = ranges[0]
  if (!first) return text.slice(0, radius * 2).trim()

  const original = toOriginalRange(normalized, first[0], first[1], text, arabe)
  if (!original) return text.slice(0, radius * 2).trim()

  const [from, to] = original
  const debut = Math.max(0, from - radius)
  const fin = Math.min(text.length, to + radius)

  return `${debut > 0 ? '…' : ''}${text.slice(debut, fin).trim()}${fin < text.length ? '…' : ''}`
}

/**
 * Couche où se trouve le terme, pour n'extraire que ce qui a réellement
 * été trouvé. Avec plusieurs termes, ils peuvent se répartir sur des couches
 * différentes : on retombe alors sur la première.
 */
export function layerWithMatch(layers: LayerText[], query: string): LayerText | undefined {
  const wanted = terms(query)
  if (wanted.length === 0) return layers[0]

  for (const entry of layers) {
    const haystack = normalizeWithOrigins(entry.text).text
    if (wanted.every((term) => haystack.includes(term))) return entry
  }
  return layers[0]
}