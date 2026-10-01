/* Favoris et historique de lecture. */

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { History, Heart, Trash2 } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { loadCatalog } from '../services/library'
import { useLibrary } from '../store/useLibrary'
import { XassidaCard } from '../components/library/XassidaCard'
import { Button } from '../components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Bits'
import { Reveal } from '../components/motion/Reveal'

export function FavoritesPage() {
  const { data: catalog, error, loading, reload } = useAsync(loadCatalog, [])
  const favorites = useLibrary((state) => state.favorites)
  const history = useLibrary((state) => state.history)
  const progress = useLibrary((state) => state.progress)
  const clearFavorites = useLibrary((state) => state.clearFavorites)
  const clearHistory = useLibrary((state) => state.clearHistory)

  const favoriteItems = useMemo(
    () => (catalog ? catalog.xassidas.filter((item) => favorites.includes(item.slug)) : []),
    [catalog, favorites],
  )

  const recent = useMemo(() => {
    if (!catalog) return []
    return history
      .map((entry) => {
        const xassida = catalog.xassidas.find((item) => item.slug === entry.slug)
        return xassida
          ? {
              xassida,
              author: catalog.authorsById.get(xassida.authorId),
              verseId: entry.verseId,
              updatedAt: entry.updatedAt,
            }
          : null
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
  }, [catalog, history])

  return (
    <div className="page-stack">
      <Reveal>
        <header className="page-head">
          <p className="eyebrow">Votre espace</p>
          <h1>Favoris et historique</h1>
          <p className="muted">
            {favorites.length} favori{favorites.length > 1 ? 's' : ''} · {recent.length} lecture
            {recent.length > 1 ? 's' : ''} récente{recent.length > 1 ? 's' : ''}
          </p>
        </header>
      </Reveal>

      {error ? <ErrorState message={error.message} onRetry={reload} /> : null}

      <Reveal className="section">
        <header className="section-head">
          <div>
            <p className="eyebrow">Favoris</p>
            <h2>Vos xassidas</h2>
          </div>
          {favorites.length > 0 ? (
            <Button variant="ghost" size="sm" icon={<Trash2 size={15} />} onClick={clearFavorites}>
              Tout retirer
            </Button>
          ) : null}
        </header>

        {loading ? (
          <div className="grid grid--cards">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} height={220} radius={18} />
            ))}
          </div>
        ) : favoriteItems.length === 0 ? (
          <EmptyState
            icon={<Heart size={22} />}
            title="Aucun favori pour l'instant"
            description="Touchez le cœur sur une xassida pour la retrouver ici."
            action={{ to: '/bibliotheque', label: 'Parcourir la bibliothèque' }}
          />
        ) : (
          <div className="grid grid--cards">
            {favoriteItems.map((xassida, index) => (
              <XassidaCard
                key={xassida.slug}
                xassida={xassida}
                index={index}
                author={catalog?.authorsById.get(xassida.authorId)}
              />
            ))}
          </div>
        )}
      </Reveal>

      <Reveal className="section">
        <header className="section-head">
          <div>
            <p className="eyebrow">Reprendre</p>
            <h2>Lectures récentes</h2>
          </div>
          {history.length > 0 ? (
            <Button variant="ghost" size="sm" icon={<Trash2 size={15} />} onClick={clearHistory}>
              Vider
            </Button>
          ) : null}
        </header>

        {recent.length === 0 ? (
          <EmptyState
            icon={<History size={22} />}
            title="Aucune lecture enregistrée"
            description="Ouvrez une xassida : votre position sera mémorisée sur cet appareil."
            action={{ to: '/bibliotheque', label: 'Choisir une xassida' }}
          />
        ) : (
          <ul className="history-list">
            {recent.map((entry) => (
              <li key={`${entry.xassida.slug}-${entry.verseId}`} className="history-item">
                <div>
                  <Link to={`/xassida/${entry.xassida.slug}?v=${entry.verseId}`}>
                    {entry.xassida.name}
                  </Link>
                  <p className="muted small">
                    {entry.author?.name ?? 'Auteur inconnu'} ·{' '}
                    {new Date(entry.updatedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                    })}
                    {progress[entry.xassida.slug]
                      ? ` · reprise au verset ${progress[entry.xassida.slug].verseId}`
                      : ''}
                  </p>
                </div>
                {history[0]?.slug === entry.xassida.slug ? (
                  <span className="badge badge--mint">En cours</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Reveal>
    </div>
  )
}