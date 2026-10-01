/* =========================================================
   Modèle de domaine — aligné sur la sortie de
   scripts/extract-content.mjs (public/data/**)
   ========================================================= */

export interface Author {
  id: string
  slug: string
  name: string
  nameAr: string
  tariha: string
  tarihaLabel: string
  anonymous: boolean
  bio: string
  bioSource: 'catalogue' | 'diwanekiram' | 'none'
  picture: string | null
  xassidaCount: number
  verseCount: number
  slugs: string[]
}

export interface Xassida {
  id: string
  slug: string
  name: string
  nameAr: string
  nameSearch: string
  authorId: string
  chapterCount: number
  verseCount: number
  translatedCount: number
  translatedRatio: number
  hasAudio: boolean
}

export interface Verse {
  id: string
  n: number
  ar: string
  tr: string
}

export interface Chapter {
  id: string
  n: number
  verseCount: number
  verses: Verse[]
}

export interface VersesDocument {
  id: string
  slug: string
  chapters: Chapter[]
}

export interface TranslationsDocument {
  id: string
  slug: string
  lang: string
  verses: Record<string, string>
}

export interface ManifestItem {
  id: string
  slug: string
  chapters: number
  verses: number
  translated: number
  hasAudio: boolean
  file: string
  translationsFile: string
  pendingTranslations: number
}

export interface CatalogTotals {
  xassidas: number
  chapters: number
  verses: number
  translations: number
  authors: number
  translationRatio: number
}

export interface Manifest {
  generatedAt: string
  totals: CatalogTotals
  items: ManifestItem[]
}

export interface AudioTrack {
  id: string
  file: string
  reciterId: string
  reciter: string | null
}

export interface AudioEntry {
  xassidaId: string
  tracks: AudioTrack[]
}

export type ThemePreference = 'dark' | 'light' | 'system'
export type ArabicFont = 'amiri' | 'naskh'
export type TranslationLang = 'fr'
