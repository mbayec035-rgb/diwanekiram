/* Petits éléments d'interface partagés. */

import { useMemo } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'

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

/** Portrait d'un auteur : photo si le fichier est présent, sinon monogramme. */
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

  return (
    <span
      className={`avatar ${className}`}
      style={{ width: size, height: size, '--avatar-hue': hue } as CSSProperties}
      aria-hidden="true"
    >
      {picture ? <img src={picture} alt="" loading="lazy" decoding="async" /> : <span>{initials}</span>}
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