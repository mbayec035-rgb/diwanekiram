/* Routage : toutes les pages sont chargées à la demande. */

import { lazy, Suspense, useEffect } from 'react'
import { createBrowserRouter, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AppShell } from './components/layout/AppShell'
import { Skeleton } from './components/ui/Bits'

const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })))
const LibraryPage = lazy(() => import('./pages/LibraryPage').then((m) => ({ default: m.LibraryPage })))
const ReaderPage = lazy(() => import('./pages/ReaderPage').then((m) => ({ default: m.ReaderPage })))
const FavoritesPage = lazy(() =>
  import('./pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })),
)
const AuthorsPage = lazy(() => import('./pages/AuthorsPage').then((m) => ({ default: m.AuthorsPage })))
const AuthorPage = lazy(() => import('./pages/AuthorPage').then((m) => ({ default: m.AuthorPage })))
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

function ScrollToTop({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return <Suspense fallback={<PageFallback />}>{children}</Suspense>
}

function PageFallback() {
  return (
    <div className="page-stack">
      <Skeleton height={48} radius={16} width="45%" />
      <Skeleton height={220} radius={20} />
      <Skeleton height={220} radius={20} />
    </div>
  )
}

const withSuspense = (element: ReactNode) => (
  <ScrollToTop>{element}</ScrollToTop>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: withSuspense(<HomePage />) },
      { path: 'bibliotheque', element: withSuspense(<LibraryPage />) },
      { path: 'xassida/:slug', element: withSuspense(<ReaderPage />) },
      { path: 'favoris', element: withSuspense(<FavoritesPage />) },
      { path: 'auteurs', element: withSuspense(<AuthorsPage />) },
      { path: 'auteurs/:slug', element: withSuspense(<AuthorPage />) },
      { path: 'a-propos', element: withSuspense(<AboutPage />) },
      { path: 'reglages', element: withSuspense(<SettingsPage />) },
      { path: '*', element: withSuspense(<NotFoundPage />) },
    ],
  },
])