/* Auteurs : fiches cliquables vers la page dédiée de chaque auteur. */

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronRight, Search } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { loadCatalog } from '../services/library'
import { normalize } from '../services/search'
import { Reveal, Stagger, StaggerItem } from '../components/motion/Reveal'
import { Avatar, Badge, ErrorState, Skeleton } from '../components/ui/Bits'

type SortMode = 'nom' | 'versets'

const SORTS: { value: SortMode; label: string }[] = [
  { value: 'nom', label: 'Ordre alphabétique' },
  { value: 'versets', label: 'Nombre de versets' },
]

export function AuthorsPage() {
  const { data: catalog, error, loading, reload } = useAsync(loadCatalog, [])
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortMode>('nom')

  const authors = useMemo(() => {
    const needle = normalize(query).trim()

    const filtered = (catalog?.authors ?? []).filter((author) => {
      if (!needle) return true
      return normalize(`${author.name} ${author.nameAr}`).includes(needle)
    })

    return filtered.sort((a, b) => {
      if (sort === 'versets') return b.verseCount - a.verseCount || a.name.localeCompare(b.name, 'fr')
      return a.name.localeCompare(b.name, 'fr')
    })
  }, [catalog, query, sort])

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

          <label className="field field--select">
            <span className="field-label">Trier</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortMode)}
              aria-label="Trier les auteurs"
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Reveal>

      {error ? <ErrorState message={error.message} onRetry={reload} /> : null}

      {loading ? (
        <div className="grid grid--authors">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} height={230} radius={20} />
          ))}
        </div>
      ) : authors.length === 0 ? (
        <p className="muted">Aucun auteur ne correspond à cette recherche.</p>
      ) : (
        <Stagger className="grid grid--authors">
          {authors.map((author) => (
            <StaggerItem key={author.id}>
              <article className="acard">
                <Link className="acard-link" to={`/auteurs/${author.slug}`}>
                  <span className="acard-head">
                    <Avatar
                      name={author.name}
                      picture={author.picture}
                      seed={author.id}
                      size={56}
                    />
                    <span className="acard-identity">
                      <span className="acard-name">{author.name}</span>
                      {author.nameAr ? (
                        <span className="acard-name-ar">{author.nameAr}</span>
                      ) : null}
                      <span className="acard-stats">
                        <Badge tone="muted">{author.tarihaLabel}</Badge>
                        {author.anonymous ? <Badge tone="muted">Auteur inconnu</Badge> : null}
                        <Badge tone="cyan">
                          {author.xassidaCount} œuvre{author.xassidaCount > 1 ? 's' : ''}
                        </Badge>
                        <Badge tone="muted">{author.verseCount} versets</Badge>
                      </span>
                    </span>
                    <ChevronRight className="acard-chevron" size={18} aria-hidden="true" />
                  </span>

                  <span className="acard-bio">
                    {author.bio ? (
                      author.bio
                    ) : (
                      'Aucune notice n’est publiée pour cette entrée : les textes restent '
                        + 'consultables, mais leur attribution est incertaine.'
                    )}
                  </span>

                  <span className="acard-cta">
                    Voir la fiche de l&rsquo;auteur
                    <ArrowRight size={15} aria-hidden="true" />
                  </span>
                </Link>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  )
}