/* Carte de xassida — utilisée par l'accueil, la bibliothèque et les favoris. */

import { Link } from 'react-router-dom'
import { Heart, Layers } from 'lucide-react'
import type { Author, Xassida } from '../../types/domain'
import { TiltCard } from '../motion/TiltCard'
import { Badge, ProgressBar } from '../ui/Bits'
import { useLibrary } from '../../store/useLibrary'

interface XassidaCardProps {
  xassida: Xassida
  author?: Author
  index?: number
}

export function XassidaCard({ xassida, author }: XassidaCardProps) {
  const isFavorite = useLibrary((state) => state.favorites.includes(xassida.slug))
  const progress = useLibrary((state) => state.progress[xassida.slug])
  const toggleFavorite = useLibrary((state) => state.toggleFavorite)
  const percent = Math.round(xassida.translatedRatio * 100)

  return (
    <div>
      <TiltCard className="xcard">
        <Link to={`/xassida/${xassida.slug}`} className="xcard-body">
          <header className="xcard-head">
            <h3 className="xcard-title">{xassida.name}</h3>
            <p className="xcard-arabic" lang="ar" dir="rtl">
              {xassida.nameAr}
            </p>
          </header>

          <p className="xcard-author">
            {author ? `${author.name} · ${author.tarihaLabel}` : 'Auteur inconnu'}
          </p>

          <div className="xcard-meta">
            <span>
              <Layers size={14} aria-hidden="true" /> {xassida.chapterCount} chapitres
            </span>
          </div>

          <div className="xcard-progress">
            <ProgressBar value={xassida.translatedRatio} label={`Traduction : ${percent} %`} />
            <span className="xcard-percent">{percent} %</span>
          </div>

          {progress ? (
            <Badge tone="mint">En cours de lecture</Badge>
          ) : xassida.translatedCount >= xassida.verseCount ? (
            <Badge tone="cyan">Traduction complète</Badge>
          ) : (
            <Badge tone="warn" title="Certains versets n'ont pas encore de traduction">
              Traduction partielle
            </Badge>
          )}
        </Link>

        <button
          type="button"
          className={`xcard-fav${isFavorite ? ' is-active' : ''}`}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Retirer ${xassida.name} des favoris` : `Ajouter ${xassida.name} aux favoris`}
          onClick={() => toggleFavorite(xassida.slug)}
        >
          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </TiltCard>
    </div>
  )
}