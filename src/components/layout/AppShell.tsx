/* Coquille applicative : navigation + zone de contenu. */

import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { TopBar } from './TopBar'
import { SideNav, MobileTabBar } from './Nav'
import { Ambience } from '../ambience/Ambience'
import { PageTransition, ScrollProgress } from '../motion/Feedback'
import { useSettings, applyDocumentSettings } from '../../store/useSettings'

export function AppShell() {
  const theme = useSettings((state) => state.theme)
  const arabicFont = useSettings((state) => state.arabicFont)

  useEffect(() => {
    applyDocumentSettings({ theme, arabicFont })
  }, [theme, arabicFont])

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

  return (
    <div className="shell">
      <Ambience />
      <ScrollProgress />
      <TopBar />
      <SideNav />
      <main className="shell-main" id="contenu">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <MobileTabBar />
    </div>
  )
}