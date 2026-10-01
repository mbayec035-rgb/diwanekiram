/* Barre supérieure : marque, recherche rapide, thème, réglages. */

import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Search, Settings, Sun, Moon, Monitor } from 'lucide-react'
import { Logo } from './Logo'
import { useSettings, applyDocumentSettings } from '../../store/useSettings'
import type { ThemePreference } from '../../types/domain'

const THEME_ORDER: ThemePreference[] = ['dark', 'light', 'system']
const THEME_ICON = { dark: Moon, light: Sun, system: Monitor }
const THEME_LABEL: Record<ThemePreference, string> = {
  dark: 'Thème nuit',
  light: 'Thème jour',
  system: 'Thème système',
}

export function TopBar() {
  const navigate = useNavigate()
  const theme = useSettings((state) => state.theme)
  const setTheme = useSettings((state) => state.setTheme)
  const [query, setQuery] = useState('')

  useEffect(() => applyDocumentSettings(useSettings.getState()), [theme])

  const Icon = THEME_ICON[theme]

  const cycleTheme = () => {
    setTheme(THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length])
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand" aria-label="DiwaneKiram — accueil">
          <span className="brand-mark">
            <Logo size={30} />
          </span>
          <span className="brand-text">
            <strong>Diwane</strong>
            <strong className="brand-accent">Kiram</strong>
          </span>
        </Link>

        <form
          className="topbar-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            const value = query.trim()
            navigate(value ? `/bibliotheque?q=${encodeURIComponent(value)}` : '/bibliotheque')
          }}
        >
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={query}
            placeholder="Rechercher une xassida, un auteur, un mot-clé…"
            aria-label="Rechercher dans la bibliothèque"
            onChange={(event) => setQuery(event.target.value)}
          />
          <kbd>/</kbd>
        </form>

        <div className="topbar-actions">
          <button
            type="button"
            className="icon-button"
            onClick={cycleTheme}
            aria-label={THEME_LABEL[theme]}
            title={THEME_LABEL[theme]}
          >
            <Icon size={18} />
          </button>
          <Link
            to="/reglages"
            className="icon-button"
            aria-label="Réglages"
            title="Réglages"
          >
            <Settings size={18} />
          </Link>
        </div>
      </div>
    </header>
  )
}