/* Bouton flottant « Recherche », dans la pile du rail.

   Même style que les autres boutons : c'est le rail qui décide de la forme.
   Ce composant ne garde aucun état — le lecteur seul sait si la recherche est
   ouverte, et où en est la requête. */

import { forwardRef } from 'react'
import { Search } from 'lucide-react'

export const SearchRailButton = forwardRef<
  HTMLButtonElement,
  { open: boolean; onToggle: () => void }
>(function SearchRailButton({ open, onToggle }, ref) {
  return (
    <button
      type="button"
      ref={ref}
      className={`rail-button rail-button--search${open ? ' is-active' : ''}`}
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="searchbar"
      aria-label={open ? 'Fermer la recherche dans le texte' : 'Rechercher dans le texte (Ctrl+F)'}
      title="Recherche"
    >
      <Search size={20} aria-hidden="true" />
    </button>
  )
})