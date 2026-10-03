/* Choix de vue — grille ou liste — mémorisé par page.

   Chaque page a sa propre clef : la liste d'auteurs et celle des œuvres
   sont deux parcours différents, on ne veut pas que l'une impose son
   point de vue à l'autre. */

import { useCallback, useState } from 'react'

export type ViewMode = 'grid' | 'list'

export interface ViewModeState {
  view: ViewMode
  setView: (view: ViewMode) => void
  toggle: () => void
}

const MODES: readonly string[] = ['grid', 'list']

/** Ne croit que les deux vues connues. Une valeur écrite à la main, ou
    venue d'une version qui connaissait un troisième mode, ne doit pas
    casser l'affichage : on retombe sur la grille. */
export function normaliseViewMode(value: unknown): ViewMode {
  return typeof value === 'string' && MODES.includes(value) ? (value as ViewMode) : 'grid'
}

function defaultStorage(): Storage | null {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    /* Navigation privée : l'objet lui-même peut refuser d'exister. */
    return null
  }
}

export function readViewMode(key: string, store: Storage | null = defaultStorage()): ViewMode {
  try {
    return normaliseViewMode(store?.getItem(key))
  } catch {
    return 'grid'
  }
}

export function writeViewMode(key: string, view: ViewMode, store: Storage | null = defaultStorage()): void {
  try {
    store?.setItem(key, view)
  } catch {
    /* Quota atteint ou écriture refusée : la vue bascule quand même,
       elle ne sera simplement pas retrouvée au prochain chargement. */
  }
}

/**
 * Vue courante, modifiable, conservée dans le navigateur.
 *
 * @param storageKey clef de stockage propre à la page
 */
export function useViewMode(storageKey: string): ViewModeState {
  const [view, setViewState] = useState<ViewMode>(() => readViewMode(storageKey))

  const setView = useCallback(
    (next: ViewMode) => {
      setViewState(next)
      writeViewMode(storageKey, next)
    },
    [storageKey],
  )

  const toggle = useCallback(() => setView(view === 'grid' ? 'list' : 'grid'), [view, setView])

  return { view, setView, toggle }
}