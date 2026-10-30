/* =========================================================
   Catalogue hors ligne.
   Le service worker ne précache plus que le noyau de
   l'application (HTML, JS, CSS, polices, icônes). Les JSON du
   catalogue sont téléchargés ici, par lots, avec reprise et
   progression : un réseau mobile capricieux ne peut plus
   annuler tout le précache d'un coup.
   ========================================================= */

import { create } from 'zustand'
import type { Manifest } from '../types/domain'

export const OFFLINE_CACHE = 'diwanekiram-data-v3'

const DATA_ROOT = `${import.meta.env.BASE_URL}data`.replace(/\/{2,}/g, '/')
const STATE_KEY = 'dk.offline'
const CONCURRENCY = 6
const RETRIES = 3

export type OfflinePhase =
  | 'idle'
  | 'checking'
  | 'downloading'
  | 'ready'
  | 'error'
  | 'unsupported'

export interface OfflineCatalogState {
  phase: OfflinePhase
  /** Fichiers réellement disponibles dans le cache. */
  done: number
  total: number
  error: string | null
  generatedAt: string | null
  updatedAt: number | null
}

export const useOfflineCatalog = create<OfflineCatalogState>(() => ({
  phase: 'idle',
  done: 0,
  total: 0,
  error: null,
  generatedAt: null,
  updatedAt: null,
}))

interface PersistedOfflineState {
  generatedAt: string
  updatedAt: number
  total: number
}

function readPersisted(): PersistedOfflineState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<PersistedOfflineState>
    if (!value.generatedAt || typeof value.updatedAt !== 'number') return null
    return {
      generatedAt: value.generatedAt,
      updatedAt: value.updatedAt,
      total: typeof value.total === 'number' ? value.total : 0,
    }
  } catch {
    return null
  }
}

function writePersisted(state: PersistedOfflineState): void {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state))
  } catch {
    /* Stockage plein ou navigation privée : l'état reste en mémoire. */
  }
}

/**
 * Liste des fichiers nécessaires à la lecture complète hors ligne.
 * Les fichiers orphelins du dossier public/data ne sont pas inclus :
 * le manifeste est la seule source de vérité.
 */
export function buildOfflineFileList(manifest: Manifest): string[] {
  const files = new Set<string>([
    `${DATA_ROOT}/manifest.json`,
    `${DATA_ROOT}/xassidas.json`,
    `${DATA_ROOT}/authors.json`,
    `${DATA_ROOT}/audio.json`,
  ])

  for (const item of manifest.items) {
    files.add(`${DATA_ROOT}/${item.file}`)
    files.add(`${DATA_ROOT}/${item.translationsFile}`)
  }

  return [...files]
}

function absolute(path: string): string {
  return new URL(path, window.location.origin).href
}

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    headers: { 'Content-Type': 'application/json' },
  })
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchWithRetry(url: string, attempts = RETRIES): Promise<Response> {
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      /* `reload` évite de resservir une réponse HTTP périmée ; le service
         worker, lui, reste prioritaire pour les fichiers déjà en cache. */
      const response = await fetch(url, { cache: 'reload' })
      if (response.ok) return response

      lastError = new Error(`HTTP ${response.status}`)
      if (response.status >= 400 && response.status < 500) break
    } catch (error) {
      lastError = error
    }

    if (attempt < attempts) await delay(400 * 2 ** (attempt - 1))
  }

  throw lastError instanceof Error ? lastError : new Error('Téléchargement impossible')
}

async function mapLimit<T>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const index = next
      next += 1
      if (index >= items.length) return
      await task(items[index])
    }
  })

  await Promise.all(workers)
}

let running: Promise<void> | null = null

/** Télécharge (ou vérifie) le catalogue hors ligne. Un seul lot à la fois. */
export function syncOfflineCatalog(options: { force?: boolean } = {}): Promise<void> {
  running ??= runSync(options).finally(() => {
    running = null
  })
  return running
}

/** À appeler une fois au démarrage : restaure l'état puis lance le lot. */
export function initOfflineCatalog(): void {
  const persisted = readPersisted()
  if (persisted) {
    useOfflineCatalog.setState({
      total: persisted.total,
      generatedAt: persisted.generatedAt,
      updatedAt: persisted.updatedAt,
    })
  }

  window.setTimeout(() => void syncOfflineCatalog(), 1200)
}

async function runSync({ force = false }: { force?: boolean }): Promise<void> {
  if (typeof window === 'undefined') return

  if (!('caches' in window) || !('serviceWorker' in navigator)) {
    useOfflineCatalog.setState({ phase: 'unsupported' })
    return
  }

  useOfflineCatalog.setState({ phase: 'checking', error: null })

  const persisted = readPersisted()
  const online = navigator.onLine
  const manifestUrl = absolute(`${DATA_ROOT}/manifest.json`)

  let cache = await caches.open(OFFLINE_CACHE)
  let manifest: Manifest | null = null
  let fresh = false

  if (online) {
    try {
      /* Le paramètre `ts` empêche la route CacheFirst du service worker de
         resservir l'ancien manifeste : on veut connaître la version en ligne. */
      const response = await fetchWithRetry(`${manifestUrl}?ts=${Date.now()}`, 2)
      manifest = (await response.clone().json()) as Manifest
      fresh = true
    } catch {
      /* On retombe sur le manifeste en cache. */
    }
  }

  if (!manifest) {
    const cachedManifest = await cache.match(manifestUrl)
    if (cachedManifest) {
      try {
        manifest = (await cachedManifest.json()) as Manifest
      } catch {
        manifest = null
      }
    }
  }

  if (!manifest) {
    useOfflineCatalog.setState({
      phase: 'error',
      error: online
        ? 'Le catalogue n’a pas pu être chargé. Réessayez dans un instant.'
        : 'Connectez-vous à Internet pour télécharger le catalogue.',
    })
    return
  }

  const currentManifest = manifest

  /* Une nouvelle version du catalogue (donc des JSON) impose de vider
     l'ancien cache : les URL ne sont pas versionnées, CacheFirst les
     servirait indéfiniment. */
  const changed = Boolean(
    persisted?.generatedAt && persisted.generatedAt !== currentManifest.generatedAt,
  )
  if (fresh && (force || changed)) {
    await caches.delete(OFFLINE_CACHE)
    cache = await caches.open(OFFLINE_CACHE)
  }

  if (fresh) {
    await cache.put(manifestUrl, jsonResponse(currentManifest))
  }

  const files = buildOfflineFileList(currentManifest)
  const total = files.length
  useOfflineCatalog.setState({ total, generatedAt: currentManifest.generatedAt })

  let done = 0
  for (const file of files) {
    if (await cache.match(absolute(file))) done += 1
  }
  useOfflineCatalog.setState({ done })

  const finish = (phase: OfflinePhase, error: string | null = null) => {
    const updatedAt = Date.now()
    writePersisted({ generatedAt: currentManifest.generatedAt, updatedAt, total })
    useOfflineCatalog.setState({ phase, error, updatedAt, total, done })
  }

  if (done === total) {
    finish('ready')
    return
  }

  if (!online) {
    useOfflineCatalog.setState({
      phase: 'error',
      error: `${done} fichier(s) sur ${total} sont disponibles hors ligne. Reconnectez-vous pour terminer le téléchargement.`,
    })
    return
  }

  useOfflineCatalog.setState({ phase: 'downloading' })

  let failures = 0
  let aborted = false

  await mapLimit(files, CONCURRENCY, async (file) => {
    if (aborted) {
      failures += 1
      return
    }

    const url = absolute(file)
    if (await cache.match(url)) return

    try {
      const response = await fetchWithRetry(url)
      await cache.put(url, response)
      done += 1
      useOfflineCatalog.setState({ done })
    } catch {
      failures += 1
      if (!navigator.onLine) aborted = true
    }
  })

  if (failures > 0) {
    finish(
      'error',
      aborted
        ? 'La connexion a été interrompue. Le téléchargement reprendra automatiquement.'
        : `${failures} fichier(s) n’ont pas pu être téléchargés. Réessayez pour terminer.`,
    )
    return
  }

  finish('ready')
}

/** Nombre de fichiers présents dans le cache du catalogue. */
export async function getOfflineCacheEntries(): Promise<number | null> {
  if (typeof caches === 'undefined') return null
  if (!(await caches.has(OFFLINE_CACHE))) return 0

  const cache = await caches.open(OFFLINE_CACHE)
  return (await cache.keys()).length
}