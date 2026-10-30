/* =========================================================
   Écran d'erreur de route.
   Remplace le message brut de React Router (« Unexpected
   Application Error! ») par une explication utile, et
   récupère automatiquement une mise à jour quand un chunk
   JavaScript n'a pas pu être chargé.
   ========================================================= */

import { useEffect, useState } from 'react'
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { canAutoReload, isChunkLoadError } from '../../services/chunkErrors'

export function RouteError() {
  const error = useRouteError()
  const chunkError = isChunkLoadError(error)
  const [online, setOnline] = useState(() => navigator.onLine)

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

  /* Un chunk obsolète (ancienne page + nouveau service worker) se répare
     en rechargeant l'index. La garde empêche la boucle si le fichier
     reste réellement introuvable. */
  useEffect(() => {
    if (!chunkError || !online) return
    if (!canAutoReload()) return

    window.location.reload()
  }, [chunkError, online])

  const status = isRouteErrorResponse(error) ? error.status : null

  const { title, message } = describe(chunkError, online, status)

  return (
    <div className="error-screen">
      <div className="error-card">
        <span className="error-mark" aria-hidden="true">
          !
        </span>
        <p className="eyebrow">DiwaneKiram</p>
        <h1>{title}</h1>
        <p className="muted">{message}</p>

        <div className="error-actions">
          <button
            type="button"
            className="button button--primary button--md"
            onClick={() => window.location.reload()}
          >
            Recharger
          </button>
          <Link className="button button--outline button--md" to="/">
            Retour à l’accueil
          </Link>
          <Link className="button button--ghost button--md" to="/reglages">
            Réglages
          </Link>
        </div>

        {import.meta.env.DEV && error ? (
          <pre className="error-detail">{formatDetail(error)}</pre>
        ) : null}
      </div>
    </div>
  )
}

function describe(
  chunkError: boolean,
  online: boolean,
  status: number | null,
): { title: string; message: string } {
  if (chunkError && !online) {
    return {
      title: 'Catalogue hors ligne incomplet',
      message:
        'L’application n’a pas encore terminé de télécharger ses fichiers. Reconnectez-vous à Internet, laissez l’application ouverte quelques instants, puis réessayez.',
    }
  }

  if (chunkError) {
    return {
      title: 'Mise à jour nécessaire',
      message:
        'Une nouvelle version de l’application est disponible. Rechargez la page pour récupérer ses fichiers.',
    }
  }

  if (status === 404) {
    return {
      title: 'Page introuvable',
      message: 'Cette page n’existe pas ou a été déplacée.',
    }
  }

  return {
    title: 'Une erreur est survenue',
    message:
      'L’application n’a pas pu afficher cette page. Rechargez-la pour réessayer ; vos favoris et votre progression sont conservés.',
  }
}

function formatDetail(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`
  }
  if (error instanceof Error) {
    return error.stack ?? error.message
  }
  return String(error)
}
