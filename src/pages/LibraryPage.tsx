/* Bibliothèque : recherche, sélection d'auteur, tri. */

import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, X, Users } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { useViewMode } from '../hooks/useViewMode'
import { loadCatalog } from '../services/library'
import { SORT_OPTIONS, filterXassidas, type SortKey } from '../services/search'
import { Reveal } from '../components/motion/Reveal'
import { AuthorSelect } from '../components/library/AuthorSelect'
import { XassidaCard } from '../components/library/XassidaCard'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Bits'
import { ViewToggleButton } from '../components/ui/ViewToggleButton'
import type { Author } from '../types/domain'

export function LibraryPage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const authorId = params.get('auteur')
  const sort = (params.get('tri') as SortKey | null) ?? 'az'
  const { view, toggle } = useViewMode('dk.vue.oeuvres')

  const { data: catalog, error, loading, reload } = useAsync(loadCatalog, [])

  const authorsById = useMemo(() => catalog?.authorsById ?? new Map<string, Author>(), [catalog])
  const visibleAuthors = useMemo(
    () =>
      /* L'ordre éditorial vient de `loadAuthors()`, on ne retrie pas ici. */
      (catalog?.authors ?? []).filter((author) => author.xassidaCount > 0),
    [catalog],
  )
  const author = authorId ? authorsById.get(authorId) : undefined

  const results = useMemo(
    () =>
      catalog
        ? filterXassidas(catalog.xassidas, authorsById, { query, authorId, sort })
        : [],
    [catalog, authorsById, query, authorId, sort],
  )

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const hasFilters = Boolean(query || authorId || sort !== 'az')

  return (
    <div className="page-stack">
      <Reveal>
        <header className="page-head">
          <p className="eyebrow">Catalogue complet</p>
          <h1>Bibliothèque</h1>
          <p className="muted">
            {loading
              ? 'Chargement du catalogue…'
              : `${results.length} xassida${results.length > 1 ? 's' : ''} affichée${results.length > 1 ? 's' : ''} sur ${catalog?.manifest.totals.xassidas ?? 0}.`}
          </p>
          {author ? (
            <p className="muted">
              Œuvres de <strong>{author.name}</strong> ·{' '}
              <Link className="link" to="/auteurs">
                voir sa notice
              </Link>
            </p>
          ) : null}
        </header>
      </Reveal>

      <div className="toolbar">
        <div className="toolbar-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={query}
            placeholder="Titre, nom d'auteur, mot-clé (français ou arabe)…"
            aria-label="Rechercher dans la bibliothèque"
            onChange={(event) => update('q', event.target.value || null)}
          />
          {query ? (
            <button
              type="button"
              className="icon-button icon-button--ghost"
              onClick={() => update('q', null)}
              aria-label="Effacer la recherche"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>

        <ViewToggleButton view={view} onToggle={toggle} />

        <AuthorSelect
          authors={visibleAuthors}
          value={authorId}
          onChange={(id) => update('auteur', id)}
        />

        <label className="toolbar-sort">
          <span>Tri</span>
          <select value={sort} onChange={(event) => update('tri', event.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <ErrorState message={error.message} onRetry={reload} /> : null}

      {loading ? (
        <div className={`view-stack ${view}`}>
          {Array.from({ length: 9 }, (_, index) => (
            <Skeleton key={index} height={view === 'list' ? 84 : 220} radius={18} />
          ))}
        </div>
      ) : results.length === 0 && !error ? (
        <EmptyState
          icon={<Users size={22} />}
          title="Aucune xassida ne correspond"
          description="Essayez un autre terme, un autre auteur ou réinitialisez les filtres."
          action={hasFilters ? { to: '/bibliotheque', label: 'Réinitialiser' } : null}
        />
      ) : (
        <ul key={view} className={`view-stack ${view}`}>
          {results.map((xassida, index) => (
            <XassidaCard
              key={xassida.slug}
              xassida={xassida}
              index={index}
              author={authorsById.get(xassida.authorId)}
              view={view}
              as="li"
            />
          ))}
        </ul>
      )}
    </div>
  )
}