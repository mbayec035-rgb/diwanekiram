/* Bandeau de mise à jour : le service worker attend l'accord de
   l'utilisateur avant de remplacer les fichiers de la page ouverte. */

import { useEffect, useRef } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

export function UpdateBanner() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      registrationRef.current = registration ?? null
    },
  })

  /* Une application installée reste ouverte des jours : on revérifie
     périodiquement, et au retour au premier plan. */
  useEffect(() => {
    const timer = window.setInterval(() => {
      void registrationRef.current?.update()
    }, UPDATE_CHECK_INTERVAL_MS)

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void registrationRef.current?.update()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  if (!needRefresh) return null

  return (
    <div className="offline-banner offline-banner--update" role="status">
      <div className="offline-banner-text">
        <strong>Nouvelle version disponible</strong>
        <span>Rechargez pour recevoir les dernières mises à jour.</span>
      </div>
      <div className="offline-banner-actions">
        <button
          type="button"
          className="button button--primary button--sm"
          onClick={() => void updateServiceWorker(true)}
        >
          Recharger
        </button>
      </div>
    </div>
  )
}
