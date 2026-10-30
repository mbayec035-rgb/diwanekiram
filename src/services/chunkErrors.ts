/* =========================================================
   Erreurs de chargement de chunk (mise à jour ou hors ligne).
   Safari dit « Importing a module script failed. », Chrome
   « Failed to fetch dynamically imported module ». Dans les
   deux cas, recharger la page récupère l'index et les chunks
   de la même version : c'est la seule réparation fiable.
   ========================================================= */

const CHUNK_ERROR_PATTERNS = [
  'importing a module script failed',
  'failed to fetch dynamically imported module',
  'error loading dynamically imported module',
  'dynamically imported module',
  'chunkloaderror',
  'loading chunk',
  'unable to preload css',
]

/** Vrai si l'erreur vient d'un module (chunk) qui n'a pas pu être chargé. */
export function isChunkLoadError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  if (!message) return false

  const normalized = message.toLowerCase()
  return CHUNK_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern))
}

const RELOAD_KEY = 'dk.chunk-reload'
const RELOAD_COOLDOWN_MS = 15_000

/**
 * Autorise un rechargement automatique au plus une fois toutes les 15 s.
 * La garde évite la boucle infinie si le chunk reste introuvable.
 */
export function canAutoReload(now = Date.now()): boolean {
  try {
    const previous = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0)
    if (Number.isFinite(previous) && previous > 0 && now - previous < RELOAD_COOLDOWN_MS) {
      return false
    }
    sessionStorage.setItem(RELOAD_KEY, String(now))
    return true
  } catch {
    /* Navigation privée ou stockage bloqué : on ne recharge pas en boucle. */
    return false
  }
}
