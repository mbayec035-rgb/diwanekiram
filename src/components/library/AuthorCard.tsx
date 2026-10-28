/* Fiche auteur — en grille ou en ligne.

   Même gabarit pour tous : portrait, nom français, nom arabe sur sa propre
   ligne (RTL), puis une rangée de repères, la notice et l'appel à action.
   La ligne reprend les mêmes données que la carte : c'est la présentation
   qui change, pas ce qu'on sait de l'auteur. */

import { Link } from 'react-router-dom'
import { ArrowRight, ChevronRight } from 'lucide-react'
import type { Author } from '../../types/domain'
import type { ViewMode } from '../../hooks/useViewMode'
import { Avatar, Badge } from '../ui/Bits'

const SANS_NOTICE =
  'Aucune notice n’est publiée pour cette entrée : les textes restent '
  + 'consultables, mais leur attribution est incertaine.'

export function AuthorCard({ author, view = 'grid' }: { author: Author; view?: ViewMode }) {
  const lien = `/auteurs/${author.slug}`
  const bio = author.bio || SANS_NOTICE

  const portrait = (
    <Avatar name={author.name} picture={author.picture} seed={author.id} size={view === 'list' ? 44 : 56} />
  )

  const stats = (
    <span className="acard-stats">
      {author.tarihaLabel ? <Badge tone="muted">{author.tarihaLabel}</Badge> : null}
      {author.anonymous ? <Badge tone="muted">Auteur inconnu</Badge> : null}
      {Number.isFinite(author.xassidaCount) ? (
        <Badge tone="cyan">
          {author.xassidaCount} œuvre{author.xassidaCount === 1 ? '' : 's'}
        </Badge>
      ) : null}
    </span>
  )

  if (view === 'list') {
    return (
      <article className="acard acard--row">
        <Link className="acard-link" to={lien}>
          {portrait}
          <span className="acard-identity">
            <span className="acard-name" title={author.name}>{author.name}</span>
            {/* La ligne arabe reste même vide : les fiches s'alignent. */}
            <span className="acard-name-ar" lang="ar" dir="rtl" title={author.nameAr}>
              {author.nameAr}
            </span>
            {stats}
          </span>
          <span className="acard-bio">{bio}</span>
          <ChevronRight className="acard-chevron" size={18} aria-hidden="true" />
        </Link>
      </article>
    )
  }

  return (
    <article className="acard">
      <Link className="acard-link" to={lien}>
        <span className="acard-head">
          {portrait}
          <span className="acard-identity">
            <span className="acard-name" title={author.name}>{author.name}</span>
            {/* La ligne arabe reste même vide : les fiches s'alignent. */}
            <span className="acard-name-ar" lang="ar" dir="rtl" title={author.nameAr}>
              {author.nameAr}
            </span>
          </span>
          <ChevronRight className="acard-chevron" size={18} aria-hidden="true" />
        </span>

        {/* Zone de badges dédiée, identique sur toutes les fiches. */}
        {stats}

        <span className="acard-bio">{bio}</span>

        <span className="acard-cta">
          Voir la fiche de l&rsquo;auteur
          <ArrowRight size={15} aria-hidden="true" />
        </span>
      </Link>
    </article>
  )
}