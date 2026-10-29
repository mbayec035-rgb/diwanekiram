/* Sélecteur d'auteur personnalisé : menu flottant sur ordinateur et tablette,
   feuille du bas sur téléphone. Le filtrage reste celui de la bibliothèque :
   `onChange` renvoie l'identifiant de l'auteur, ou `null` pour tous. */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import type { Author } from '../../types/domain'

/* Doit rester synchronisé avec la media query de `components.css`. */
const MOBILE_QUERY = '(max-width: 760px), (max-height: 500px) and (pointer: coarse)'
const PANEL_MARGIN = 8
const PANEL_WIDTH = 352

interface AuthorOption {
  id: string | null
  name: string
}

export function AuthorSelect({
  authors,
  value,
  onChange,
}: {
  authors: Author[]
  value: string | null
  onChange: (authorId: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selected = value ? authors.find((author) => author.id === value) : undefined

  const options = useMemo<AuthorOption[]>(() => {
    const term = query.trim().toLocaleLowerCase('fr')
    const matches = term
      ? authors.filter((author) => author.name.toLocaleLowerCase('fr').includes(term))
      : authors
    return [
      { id: null, name: 'Tous les auteurs' },
      ...matches.map((author) => ({ id: author.id, name: author.name })),
    ]
  }, [authors, query])

  /* Chaque ouverture repart d'une recherche vierge et place le focus dedans. */
  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  const togglePanel = () => {
    if (open) {
      setOpen(false)
      return
    }
    setQuery('')
    setActiveIndex(0)
    setOpen(true)
  }

  /* Fermeture au clic extérieur et sur Échap. */
  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      setOpen(false)
    }

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  /* Garde l'option active visible pendant la navigation au clavier. */
  useEffect(() => {
    if (!open) return
    panelRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  /* Sur ordinateur et tablette, le panneau est positionné en `fixed` et borné
     à la fenêtre : il ne déborde jamais, même près d'un bord. Sur téléphone,
     les styles sont retirés pour laisser la feuille du bas au CSS. */
  useLayoutEffect(() => {
    if (!open) return
    const panel = panelRef.current
    const trigger = triggerRef.current
    if (!panel || !trigger) return

    const place = () => {
      if (window.matchMedia(MOBILE_QUERY).matches) {
        panel.style.removeProperty('position')
        panel.style.removeProperty('top')
        panel.style.removeProperty('left')
        panel.style.removeProperty('right')
        panel.style.removeProperty('width')
        panel.style.removeProperty('max-height')
        return
      }

      const rect = trigger.getBoundingClientRect()
      const width = Math.min(PANEL_WIDTH, window.innerWidth - PANEL_MARGIN * 2)
      const left = Math.min(
        Math.max(rect.left, PANEL_MARGIN),
        window.innerWidth - width - PANEL_MARGIN,
      )

      /* On borne la hauteur à l'espace réellement disponible de chaque côté,
         puis on ouvre vers le haut si le bas manque de place. */
      panel.style.removeProperty('max-height')
      const natural = panel.offsetHeight
      const spaceBelow = window.innerHeight - rect.bottom - PANEL_MARGIN * 2
      const spaceAbove = rect.top - PANEL_MARGIN * 2
      const openUp = spaceBelow < natural && spaceAbove > spaceBelow
      const available = Math.max(openUp ? spaceAbove : spaceBelow, 0)
      const height = Math.min(natural, available)
      const top = openUp
        ? Math.max(PANEL_MARGIN, rect.top - height - PANEL_MARGIN)
        : Math.min(
            rect.bottom + PANEL_MARGIN,
            window.innerHeight - height - PANEL_MARGIN,
          )

      panel.style.position = 'fixed'
      panel.style.left = `${left}px`
      panel.style.top = `${top}px`
      panel.style.right = 'auto'
      panel.style.width = `${width}px`
      panel.style.maxHeight = `${height}px`
    }

    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, query])

  const choose = (authorId: string | null) => {
    onChange(authorId)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const onSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, options.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const option = options[activeIndex]
      if (option) choose(option.id)
    }
  }

  return (
    <div className="toolbar-sort toolbar-author">
      <span>Auteur</span>

      <div className="author-select">
        <button
          ref={triggerRef}
          type="button"
          className="author-select-trigger"
          onClick={togglePanel}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-controls="author-select-panel"
        >
          <span className="author-select-value">{selected ? selected.name : 'Tous les auteurs'}</span>
          <ChevronDown size={15} aria-hidden="true" className="author-select-chevron" />
        </button>

        {open ? (
          <>
            <button
              type="button"
              className="author-select-backdrop"
              aria-label="Fermer le sélecteur d’auteur"
              tabIndex={-1}
              onClick={() => setOpen(false)}
            />

            <div
              id="author-select-panel"
              ref={panelRef}
              className="author-select-panel"
              role="dialog"
              aria-label="Choisir un auteur"
            >
              <span className="author-select-grabber" aria-hidden="true" />

              <div className="author-select-search">
                <Search size={15} aria-hidden="true" />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setActiveIndex(0)
                  }}
                  onKeyDown={onSearchKeyDown}
                  placeholder="Rechercher un auteur…"
                  aria-label="Rechercher un auteur"
                />
              </div>

              <ul className="author-select-list">
                {options.map((option, index) => {
                  const isSelected = option.id === value
                  return (
                    <li key={option.id ?? 'all'}>
                      <button
                        type="button"
                        className={[
                          'author-select-option',
                          isSelected ? 'is-selected' : '',
                          index === activeIndex ? 'is-active' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => choose(option.id)}
                        onMouseEnter={() => setActiveIndex(index)}
                        aria-pressed={isSelected}
                        data-active={index === activeIndex ? 'true' : undefined}
                      >
                        <span className="author-select-option-name">{option.name}</span>
                        {isSelected ? <Check size={15} aria-hidden="true" /> : null}
                      </button>
                    </li>
                  )
                })}

                {query && options.length === 1 ? (
                  <li className="author-select-empty">Aucun auteur trouvé.</li>
                ) : null}
              </ul>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
