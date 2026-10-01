/* Bibliothèque : recherche, filtres, tri. */

import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, X, SlidersHorizontal, Users } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { loadCatalog } from '../services/library'
import {
  LENGTH_OPTIONS,
  SORT_OPTIONS,
  filterXassidas,
  type LengthFilter,
  type SortKey,
} from '../services/search'
import { Reveal } from '../components/motion/Reveal'
import { XassidaCard } from '../components/library/XassidaCard'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Bits'
import type { Author } from '../types/domain'

export function LibraryPage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const authorId = params.get('auteur')
  const length = (params.get('longueur') as LengthFilter | null) ?? 'all'
  const sort = (params.get('tri') as SortKey | null) ?? 'az'
  const [showFilters, setShowFilters] = useState(false)

  const { data: catalog, error, loading, reload } = useAsync(loadCatalog, [])

  const authorsById = useMemo(() => catalog?.authorsById ?? new Map<string, Author>(), [catalog])
  const visibleAuthors = useMemo(
    () =>
      [...(catalog?.authors ?? [])]
        .filter((author) => author.xassidaCount > 0)
        .sort((a, b) => b.xassidaCount - a.xassidaCount || a.name.localeCompare(b.name, 'fr')),
    [catalog],
  )
  const author = authorId ? authorsById.get(authorId) : undefined

  const results = useMemo(
    () =>
      catalog
        ? filterXassidas(catalog.xassidas, authorsById, { query, authorId, length, sort })
        : [],
    [catalog, authorsById, query, authorId, length, sort],
  )

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const clearAll = () => setParams(new URLSearchParams(), { replace: true })
  const hasFilters = Boolean(query || authorId || length !== 'all' || sort !== 'az')

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

        <button
          type="button"
          className="button button--outline button--md toolbar-toggle"
          onClick={() => setShowFilters((value) => !value)}
          aria-expanded={showFilters}
        >
          <SlidersHorizontal size={16} /> Filtres
        </button>

        <label className="toolbar-sort toolbar-author">
          <span>Auteur</span>
          <select
            value={authorId ?? ''}
            onChange={(event) => update('auteur', event.target.value || null)}
            aria-label="Filtrer la bibliothèque par auteur"
          >
            <option value="">Tous les auteurs</option>
            {visibleAuthors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name} · {author.xassidaCount}
              </option>
            ))}
          </select>
        </label>

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

      {showFilters ? (
        <Reveal className="filters">
          <fieldset className="chips">
            <legend>Longueur</legend>
            {LENGTH_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`chip${length === option.value ? ' is-active' : ''}`}
                onClick={() => update('longueur', option.value === 'all' ? null : option.value)}
                aria-pressed={length === option.value}
              >
                {option.label}
              </button>
            ))}
          </fieldset>

          <fieldset className="chips">
            <legend>Auteur</legend>
            <button
              type="button"
              className={`chip${!authorId ? ' is-active' : ''}`}
              onClick={() => update('auteur', null)}
              aria-pressed={!authorId}
            >
              Tous
            </button>
            {visibleAuthors.map((author) => (
              <button
                key={author.id}
                type="button"
                className={`chip${authorId === author.id ? ' is-active' : ''}`}
                onClick={() => update('auteur', author.id)}
                aria-pressed={authorId === author.id}
              >
                {author.name}
                <span className="chip-count">{author.xassidaCount}</span>
              </button>
            ))}
          </fieldset>

          {hasFilters ? (
            <button type="button" className="button button--ghost button--sm" onClick={clearAll}>
              Réinitialiser
            </button>
          ) : null}
        </Reveal>
      ) : null}

      {error ? <ErrorState message={error.message} onRetry={reload} /> : null}

      {loading ? (
        <div className="grid grid--cards">
          {Array.from({ length: 9 }, (_, index) => (
            <Skeleton key={index} height={220} radius={18} />
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
        <div className="grid grid--cards">
          {results.map((xassida, index) => (
            <XassidaCard
              key={xassida.slug}
              xassida={xassida}
              index={index}
              author={authorsById.get(xassida.authorId)}
            />
          ))}
        </div>
      )}
    </div>
  )
}