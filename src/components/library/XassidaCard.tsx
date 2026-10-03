/* Carte de xassida — utilisée par l'accueil, la bibliothèque et les favoris.

   Gabarit commun aux deux vues : titre, puis le texte arabe sur sa propre
   ligne, puis l'auteur et le chapitre/catégorie. Chaque bloc garde sa
   place même vide ou trop long, pour que toutes les cartes se ressemblent.
   `view="list"` transforme la carte en ligne sans rien changer à ses
   données ni à son bouton favori : c'est la présentation qui varie. */

import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Layers, Tag } from 'lucide-react'
import type { Author, Xassida } from '../../types/domain'
import type { ViewMode } from '../../hooks/useViewMode'
import { TiltCard } from '../motion/TiltCard'
import { Badge, ProgressBar } from '../ui/Bits'
import { useLibrary } from '../../store/useLibrary'

interface XassidaCardProps {
  xassida: Xassida
  author?: Author
  index?: number
  view?: ViewMode
  /** Élément racine : `li` quand la carte vit dans une liste de résultats. */
  as?: 'div' | 'li'
}

export function XassidaCard({
  xassida,
  author,
  index = 0,
  view = 'grid',
  as: Racine = 'div',
}: XassidaCardProps) {
  const isFavorite = useLibrary((state) => state.favorites.includes(xassida.slug))
  const progress = useLibrary((state) => state.progress[xassida.slug])
  const toggleFavorite = useLibrary((state) => state.toggleFavorite)
  const percent = Math.round(xassida.translatedRatio * 100)
  const enLigne = view === 'list'
  const initiale = xassida.nameAr.trim().charAt(0) || xassida.name.trim().charAt(0)

  const etat = progress ? (
    <Badge tone="mint">En cours de lecture</Badge>
  ) : xassida.translatedCount >= xassida.verseCount ? (
    <Badge tone="cyan">Traduction complète</Badge>
  ) : (
    <Badge tone="warn" title="Certains versets n'ont pas encore de traduction">
      Traduction partielle
    </Badge>
  )

  return (
    <Racine className="xcard-item" style={{ '--i': index } as CSSProperties}>
      <TiltCard className={`xcard${enLigne ? ' xcard--row' : ''}`}>
        <Link to={`/xassida/${xassida.slug}`} className="xcard-body">
          {enLigne ? (
            <span className="xcard-thumb" lang="ar" dir="rtl" aria-hidden="true">
              {initiale}
            </span>
          ) : null}

          <div className="xcard-head">
            <h3 className="xcard-title">{xassida.name}</h3>

            {/* Vide ou non, la ligne est là : les cartes restent alignées. */}
            <p className="xcard-arabic" lang="ar" dir="rtl">
              {xassida.nameAr}
            </p>
          </div>

          <p className="xcard-author">
            {author ? `${author.name} · ${author.tarihaLabel}` : 'Auteur inconnu'}
          </p>

          <div className="xcard-meta">
            <span>
              <Layers size={14} aria-hidden="true" /> {xassida.chapterCount} chapitre
              {xassida.chapterCount > 1 ? 's' : ''}
            </span>
            <span className={xassida.category ? '' : 'is-empty'}>
              <Tag size={14} aria-hidden="true" />
              {xassida.category?.name ?? 'Sans catégorie'}
            </span>
          </div>

          <div className="xcard-progress">
            <ProgressBar value={xassida.translatedRatio} label={`Traduction : ${percent} %`} />
            <span className="xcard-percent">{percent} %</span>
          </div>

          {etat}
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
    </Racine>
  )
}