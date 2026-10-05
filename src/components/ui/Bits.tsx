/* Petits éléments d'interface partagés. */

import { useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { cheminPublic } from '../../services/mediaPath'

export type BadgeTone = 'cyan' | 'mint' | 'muted' | 'warn'

export function Badge({
  children,
  tone = 'muted',
  title,
}: {
  children: ReactNode
  tone?: BadgeTone
  title?: string
}) {
  return (
    <span className={`badge badge--${tone}`} title={title}>
      {children}
    </span>
  )
}

export function ProgressBar({
  value,
  label,
}: {
  value: number
  label?: string
}) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Progression de traduction'}
      title={label}
    >
      <span className="progress-fill" style={{ width: `${percent}%` }} />
    </div>
  )
}

export function Skeleton({ height = 18, radius = 10, width }: { height?: number; radius?: number; width?: string }) {
  return (
    <span
      className="skeleton"
      style={{ height, borderRadius: radius, width: width ?? '100%' }}
      aria-hidden="true"
    />
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: { to: string; label: string } | null
}) {
  return (
    <div className="empty-state">
      {icon ? <span className="empty-icon">{icon}</span> : null}
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action ? (
        <Link className="button button--primary button--md" to={action.to}>
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="empty-state">
      <span className="empty-icon empty-icon--warn">!</span>
      <h3>Catalogue indisponible</h3>
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="button button--outline button--md" onClick={onRetry}>
          Réessayer
        </button>
      ) : null}
    </div>
  )
}

/** Portrait d'un auteur : photo si le fichier est présent, sinon monogramme.
 *
 *  L'image reste décorative — le nom de l'auteur est toujours écrit juste à
 *  côté dans les trois usages (carte, fiche, accueil). Lui donner un `alt`
 *  ferait annoncer le nom deux fois de suite par un lecteur d'écran.
 */
export function Avatar({
  name,
  picture,
  seed,
  size = 56,
  className = '',
}: {
  name: string
  picture?: string | null
  seed?: string
  size?: number
  className?: string
}) {
  const initials = useMemo(() => monogram(name), [name])
  const hue = useMemo(() => hueFrom(seed ?? name), [seed, name])

  /* Un fichier annoncé peut manquer : on retombe sur les initiales plutôt que
     d'afficher une image cassée. Le monogramme reste dessous, ce qui évite
     aussi le vide pendant le chargement. */
  const [enPanne, setEnPanne] = useState(false)
  /* Le chemin est ancré sur BASE_URL : sur une route plus profonde que la
     racine (« /auteurs/ibnu-mursiyyat »), un chemin relatif ne pointerait pas
     vers le dossier public. */
  const photo = picture && !enPanne ? cheminPublic(picture) : null

  return (
    <span
      className={`avatar ${className}${photo ? ' avatar--photo' : ''}`}
      style={{ width: size, height: size, '--avatar-hue': hue } as CSSProperties}
      aria-hidden="true"
    >
      <span className="avatar-initials">{initials}</span>
      {photo ? (
        <img
          src={photo}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setEnPanne(true)}
        />
      ) : null}
    </span>
  )
}

function monogram(name: string) {
  const words = name
    .replace(/\(.*?\)/g, ' ')
    .split(/[\s-]+/)
    .filter(Boolean)

  const skip = new Set(['sy', 'el', 'al', 'abdou', 'cheikh', 'serigne', 'hadj', 'hadji', 'autre'])
  const kept = words.filter((word) => !skip.has(word.toLowerCase()))
  const source = (kept.length > 0 ? kept : words).slice(0, 2)

  return source.map((word) => word.charAt(0).toUpperCase()).join('') || '?'
}

/** Teinte stable dérivée du nom : chaque auteur garde la même couleur. */
function hueFrom(seed: string) {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 360
  }
  return hash
}