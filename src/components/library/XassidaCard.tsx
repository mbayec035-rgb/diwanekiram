/* Carte de xassida — utilisée par l'accueil, la bibliothèque et les favoris. */

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Layers, BookOpen } from 'lucide-react'
import type { Author, Xassida } from '../../types/domain'
import { TiltCard } from '../motion/TiltCard'
import { Badge, ProgressBar } from '../ui/Bits'
import { useLibrary } from '../../store/useLibrary'

interface XassidaCardProps {
  xassida: Xassida
  author?: Author
  index?: number
}

export function XassidaCard({ xassida, author, index = 0 }: XassidaCardProps) {
  const isFavorite = useLibrary((state) => state.favorites.includes(xassida.slug))
  const progress = useLibrary((state) => state.progress[xassida.slug])
  const toggleFavorite = useLibrary((state) => state.toggleFavorite)
  const percent = Math.round(xassida.translatedRatio * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: Math.min(index, 8) * 0.035, ease: [0.16, 1, 0.3, 1] }}
    >
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
              <Layers size={14} aria-hidden="true" /> {xassida.chapterCount} ch.
            </span>
            <span>
              <BookOpen size={14} aria-hidden="true" /> {xassida.verseCount} vers
            </span>
          </div>

          <div className="xcard-progress">
            <ProgressBar value={xassida.translatedRatio} label={`Traduction : ${percent} %`} />
            <span className="xcard-percent">{percent} %</span>
          </div>

          {progress ? (
            <Badge tone="mint">En cours de lecture</Badge>
          ) : xassida.translatedRatio === 1 ? (
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
    </motion.div>
  )
}