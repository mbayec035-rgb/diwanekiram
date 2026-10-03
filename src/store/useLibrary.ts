/* Favoris, historique et position de lecture — persistés localement. */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ProgressEntry {
  verseId: string
  /* Le chapitre n'est pas toujours connu : les œuvres figées gardent les
     identifiants numériques de la source, d'où un verset muet sur son
     chapitre. Le champ reste facultatif, et absent des entrées déjà
     enregistrées. */
  chapter?: number
  updatedAt: number
}

export interface HistoryEntry extends ProgressEntry {
  slug: string
}

interface LibraryState {
  favorites: string[]
  progress: Record<string, ProgressEntry>
  history: HistoryEntry[]
  toggleFavorite: (slug: string) => void
  isFavorite: (slug: string) => boolean
  markRead: (slug: string, verseId: string, chapter?: number) => void
  clearHistory: () => void
  clearFavorites: () => void
  clearProgress: () => void
  reset: () => void
}

const HISTORY_LIMIT = 60

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      favorites: [],
      progress: {},
      history: [],

      toggleFavorite: (slug) =>
        set((state) => ({
          favorites: state.favorites.includes(slug)
            ? state.favorites.filter((item) => item !== slug)
            : [slug, ...state.favorites],
        })),

      isFavorite: (slug) => get().favorites.includes(slug),

      markRead: (slug, verseId, chapter) =>
        set((state) => {
          const now = Date.now()
          const last = state.history[0]
          if (last && last.slug === slug && last.verseId === verseId && last.chapter === chapter) {
            return state
          }

          return {
            progress: {
              ...state.progress,
              [slug]: { verseId, chapter, updatedAt: now },
            },
            history: [
              { slug, verseId, chapter, updatedAt: now },
              ...state.history.filter((item) => item.slug !== slug),
            ].slice(0, HISTORY_LIMIT),
          }
        }),

      clearHistory: () => set({ history: [] }),
      clearFavorites: () => set({ favorites: [] }),
      clearProgress: () => set({ progress: {} }),
      reset: () => set({ favorites: [], progress: {}, history: [] }),
    }),
    { name: 'dk.state' },
  ),
)

/** Dernière xassida lue, la plus récemment consultée en priorité. */
export function lastReadSlug(state: LibraryState): string | null {
  return state.history[0]?.slug ?? null
}
