/* Auteurs : fiches cliquables vers la page dédiée de chaque auteur. */

import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { useViewMode } from '../hooks/useViewMode'
import { loadCatalog } from '../services/library'
import { normalize } from '../services/search'
import { Reveal, Stagger, StaggerItem } from '../components/motion/Reveal'
import { ErrorState, Skeleton } from '../components/ui/Bits'
import { ViewToggleButton } from '../components/ui/ViewToggleButton'
import { AuthorCard } from '../components/library/AuthorCard'

export function AuthorsPage() {
  const { data: catalog, error, loading, reload } = useAsync(loadCatalog, [])
  const [query, setQuery] = useState('')
  const { view, toggle } = useViewMode('dk.vue.auteurs')

  const authors = useMemo(() => {
    const needle = normalize(query).trim()

    const filtered = (catalog?.authors ?? []).filter((author) => {
      if (!needle) return true
      return normalize(`${author.name} ${author.nameAr ?? ''}`).includes(needle)
    })

    return [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }, [catalog, query])

  return (
    <div className="page-stack">
      <Reveal>
        <header className="page-head">
          <p className="eyebrow">Le corpus</p>
          <h1>Auteurs</h1>
          <p className="muted">
            Chaque auteur est présenté avec sa notice et sa bibliographie. Cliquez sur une fiche
            pour accéder à toutes ses œuvres.
          </p>
        </header>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="authors-toolbar">
          <label className="field field--search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={query}
              placeholder="Rechercher un auteur"
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Rechercher un auteur"
            />
          </label>
          <span className="authors-count">{authors.length} auteurs</span>
          <ViewToggleButton view={view} onToggle={toggle} />
        </div>
      </Reveal>

      {error ? <ErrorState message={error.message} onRetry={reload} /> : null}

      {loading ? (
        <div className={`view-stack ${view}`}>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} height={view === 'list' ? 74 : 230} radius={20} />
          ))}
        </div>
      ) : authors.length === 0 ? (
        <p className="muted">Aucun auteur ne correspond à cette recherche.</p>
      ) : (
        <Stagger key={view} as="ul" className={`view-stack ${view}`}>
          {authors.map((author, index) => (
            <StaggerItem key={author.id} style={{ '--i': index } as CSSProperties}>
              <AuthorCard author={author} view={view} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  )
}