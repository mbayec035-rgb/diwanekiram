/* Barre supérieure : marque, recherche rapide, thème, réglages. */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Search, Settings, Sun, Moon, X } from 'lucide-react'
import { Logo } from './Logo'
import { useSettings, resolveTheme } from '../../store/useSettings'
import { loadCatalog, searchXassidas } from '../../services/library'
import type { Xassida, Author } from '../../types/domain'
import type { ThemePreference } from '../../types/domain'

const THEME_ORDER: ThemePreference[] = ['dark', 'light', 'system']
const THEME_LABEL: Record<ThemePreference, string> = {
  dark: 'Thème nuit',
  light: 'Thème jour',
  system: 'Thème système',
}

const SUGGESTION_LIMIT = 6

interface Suggestion {
  xassida: Xassida
  author?: Author
}

export function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useSettings((state) => state.theme)
  const setTheme = useSettings((state) => state.setTheme)

  /* Le champ suit l'URL quand on est déjà dans la bibliothèque, mais reste
     libre ailleurs : d'où une valeur d Queries pilotée par l'événement. */
  const [draft, setDraft] = useState<string | null>(null)
  const [catalog, setCatalog] = useState<{
    xassidas: Xassida[]
    authorsById: Map<string, Author>
  } | null>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  /* L'icône reflète le thème réellement appliqué, y compris en mode
     « Système » où la préférence seule ne dit rien de l'affichage. */
  const resolved = resolveTheme(theme)
  const Icon = resolved === 'light' ? Sun : Moon
  const nextTheme = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length]
  const label =
    theme === 'system' ? `${THEME_LABEL[theme]} (${THEME_LABEL[resolved]})` : THEME_LABEL[theme]

  /* Le catalogue est léger et nécessaire aux suggestions : on le charge une fois. */
  useEffect(() => {
    let alive = true
    loadCatalog()
      .then((loaded) => {
        if (alive) setCatalog({ xassidas: loaded.xassidas, authorsById: loaded.authorsById })
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  /* La recherche de la barre suit les filtres de la bibliothèque. */
  const libraryQuery =
    location.pathname === '/bibliotheque' ? (new URLSearchParams(location.search).get('q') ?? '') : null
  const query = draft ?? libraryQuery ?? ''

  const suggestions = useMemo<Suggestion[]>(() => {
    const needle = query.trim()
    if (needle.length < 2 || !catalog) return []
    return searchXassidas(needle, catalog.xassidas, catalog.authorsById)
      .slice(0, SUGGESTION_LIMIT)
      .map((xassida) => ({ xassida, author: catalog.authorsById.get(xassida.authorId) }))
  }, [query, catalog])

  const showSuggestions = open && suggestions.length > 0

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (target && searchRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    globalThis.document.addEventListener('mousedown', onPointerDown)
    globalThis.document.addEventListener('keydown', onKeyDown)
    return () => {
      globalThis.document.removeEventListener('mousedown', onPointerDown)
      globalThis.document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const submit = (value = query) => {
    const trimmed = value.trim()
    setDraft(null)
    setOpen(false)
    navigate(trimmed ? `/bibliotheque?q=${encodeURIComponent(trimmed)}` : '/bibliotheque')
  }

  const choose = (slug: string) => {
    setDraft(null)
    setOpen(false)
    navigate(`/xassida/${slug}`)
  }

  const clear = () => {
    setDraft('')
    setActiveIndex(-1)
    inputRef.current?.focus()
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

        <div className="topbar-search-wrap" ref={searchRef}>
          <form
            className="topbar-search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault()
              if (activeIndex >= 0 && suggestions[activeIndex]) {
                choose(suggestions[activeIndex].xassida.slug)
                return
              }
              submit()
            }}
          >
            <Search size={16} aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              placeholder="Rechercher une xassida, un auteur, un mot-clé…"
              aria-label="Rechercher dans la bibliothèque"
              autoComplete="off"
              role="combobox"
              aria-expanded={showSuggestions}
              aria-controls="topbar-suggestions"
              onChange={(event) => {
                setDraft(event.target.value)
                setActiveIndex(-1)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(event) => {
                if (!suggestions.length) return
                if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  setActiveIndex((index) => (index + 1) % suggestions.length)
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault()
                  setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1))
                }
              }}
            />
            {query ? (
              <button
                type="button"
                className="topbar-search-clear"
                onClick={clear}
                aria-label="Effacer la recherche"
              >
                <X size={14} />
              </button>
            ) : null}
            <kbd>/</kbd>
          </form>

          {showSuggestions ? (
            <ul className="topbar-suggestions" id="topbar-suggestions" role="listbox">
              {suggestions.map((item, index) => (
                <li key={item.xassida.slug}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    className={`topbar-suggestion${index === activeIndex ? ' is-active' : ''}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(item.xassida.slug)}
                  >
                    <span className="topbar-suggestion-name">{item.xassida.name}</span>
                    <span className="topbar-suggestion-author">
                      {item.author?.name ?? 'Auteur inconnu'}
                    </span>
                  </button>
                </li>
              ))}
              <li>
                <button type="button" className="topbar-suggestion-all" onClick={() => submit()}>
                  Voir tous les résultats pour « {query.trim()} »
                </button>
              </li>
            </ul>
          ) : null}
        </div>

        <div className="topbar-actions">
          <button
            type="button"
            className="icon-button"
            onClick={() => setTheme(nextTheme)}
            aria-label={`${label} — passer à ${THEME_LABEL[nextTheme].toLowerCase()}`}
            title={`${label} → ${THEME_LABEL[nextTheme]}`}
          >
            <Icon size={18} />
          </button>
          <Link to="/reglages" className="icon-button" aria-label="Réglages" title="Réglages">
            <Settings size={18} />
          </Link>
        </div>
      </div>
    </header>
  )
}