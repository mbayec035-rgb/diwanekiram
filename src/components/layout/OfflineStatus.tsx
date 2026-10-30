/* État du catalogue hors ligne : progression, confirmation, reprise. */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CloudDownload, RefreshCw } from 'lucide-react'
import {
  syncOfflineCatalog,
  useOfflineCatalog,
} from '../../services/offlineCatalog'

const READY_MESSAGE_MS = 6000

export function OfflineStatus() {
  const phase = useOfflineCatalog((state) => state.phase)
  const done = useOfflineCatalog((state) => state.done)
  const total = useOfflineCatalog((state) => state.total)
  const error = useOfflineCatalog((state) => state.error)
  const updatedAt = useOfflineCatalog((state) => state.updatedAt)

  const [online, setOnline] = useState(() => navigator.onLine)
  const [hiddenReadyAt, setHiddenReadyAt] = useState<number | null>(null)

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'ready' || updatedAt === null) return

    const timer = window.setTimeout(() => setHiddenReadyAt(updatedAt), READY_MESSAGE_MS)
    return () => window.clearTimeout(timer)
  }, [phase, updatedAt])

  if (phase === 'unsupported' || phase === 'idle' || phase === 'checking') return null
  if (phase === 'ready' && hiddenReadyAt === updatedAt) return null

  if (phase === 'downloading') {
    const percent = total > 0 ? Math.round((done / total) * 100) : 0

    return (
      <div className="offline-banner offline-banner--progress" role="status">
        <div className="offline-banner-text">
          <strong>Téléchargement du catalogue hors ligne</strong>
          <span>
            {done} / {total} fichiers · {percent} %
          </span>
        </div>
        <div
          className="offline-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-label="Progression du téléchargement hors ligne"
        >
          <span style={{ width: `${percent}%` }} />
        </div>
      </div>
    )
  }

  if (phase === 'ready') {
    return (
      <div className="offline-banner offline-banner--ready" role="status">
        <div className="offline-banner-text">
          <strong>Catalogue prêt hors ligne</strong>
          <span>{total} fichiers sont disponibles sans connexion.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="offline-banner offline-banner--error" role="alert">
      <div className="offline-banner-text">
        <strong>Catalogue hors ligne incomplet</strong>
        <span>
          {online
            ? (error ?? 'Le téléchargement a été interrompu.')
            : 'Reconnectez-vous à Internet pour terminer le téléchargement.'}
        </span>
      </div>
      <div className="offline-banner-actions">
        {online ? (
          <button
            type="button"
            className="button button--outline button--sm"
            onClick={() => void syncOfflineCatalog()}
          >
            <RefreshCw size={14} aria-hidden="true" />
            Reprendre
          </button>
        ) : (
          <Link className="button button--ghost button--sm" to="/reglages">
            <CloudDownload size={14} aria-hidden="true" />
            Réglages
          </Link>
        )}
      </div>
    </div>
  )
}
