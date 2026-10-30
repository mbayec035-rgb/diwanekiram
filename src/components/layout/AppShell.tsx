/* Coquille applicative : navigation + zone de contenu. */

import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { TopBar } from './TopBar'
import { SideNav, MobileTabBar } from './Nav'
import { UpdateBanner } from './UpdateBanner'
import { Ambience } from '../ambience/Ambience'
import { PageTransition, ScrollProgress } from '../motion/Feedback'
import { useAppliedSettings } from '../../store/useSettings'
import { initOfflineCatalog, syncOfflineCatalog } from '../../services/offlineCatalog'

export function AppShell() {
  useAppliedSettings()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      if (event.key === '/' && !typing) {
        event.preventDefault()
        document.querySelector<HTMLInputElement>('.topbar-search input')?.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  /* Le catalogue se télécharge en arrière-plan, par lots. Au retour de la
     connexion, on reprend là où le lot précédent s'est arrêté. */
  useEffect(() => {
    initOfflineCatalog()
    const onOnline = () => void syncOfflineCatalog()

    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  return (
    <div className="shell">
      <Ambience />
      <ScrollProgress />
      <TopBar />
      <SideNav />
      <main className="shell-main" id="contenu">
        <div className="app-notices">
          <UpdateBanner />
        </div>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <MobileTabBar />
    </div>
  )
}