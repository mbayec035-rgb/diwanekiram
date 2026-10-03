/* Bascule grille / liste — un seul bouton.

   Le bouton montre la vue vers laquelle on va, pas celle qu'on quitte :
   depuis la grille il propose la liste, depuis la liste il propose la
   grille. Le libellé dit la même chose que l'icône. */

import { LayoutGrid, List } from 'lucide-react'
import type { ViewMode } from '../../hooks/useViewMode'

const LABEL: Record<ViewMode, string> = {
  grid: 'Vue liste',
  list: 'Vue grille',
}

export function ViewToggleButton({
  view,
  onToggle,
  className = '',
}: {
  view: ViewMode
  onToggle: () => void
  className?: string
}) {
  const label = LABEL[view]

  return (
    <button
      type="button"
      className={`button button--outline button--md view-toggle ${className}`.trim()}
      onClick={onToggle}
      aria-label={label}
      title={label}
    >
      {view === 'grid' ? (
        <List size={16} aria-hidden="true" />
      ) : (
        <LayoutGrid size={16} aria-hidden="true" />
      )}
      {label}
    </button>
  )
}