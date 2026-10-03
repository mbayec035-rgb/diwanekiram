/* Sommaire des chapitres : bouton flottant au bord droit, tiroir sur grand
   écran, feuille qui remonte du bas sur mobile.

   Le sommaire vit dans la pile de boutons du lecteur, sous le bouton
   d'affichage : il partage le même rail, donc le même style, et n'occupe
   jamais le flux de lecture. Le texte de l'œuvre reste en place pendant
   toute l'ouverture.

   Chaque commande garde son propre état d'ouverture : le rail ne coordonne
   rien, le lecteur décide que les deux ne s'ouvrent pas ensemble. Un
   composant qui n'a pas à connaître son frère pour fonctionner seul.

   Le tiroir et la feuille sont un seul composant : même liste, même
   recherche, même clavier. Seul le mode d'ouverture change, décidé par la
   largeur de la fenêtre — un composant qui change de forme plutôt que deux
   qui dupliquent la liste et divergeraient. */

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { List, Search, X } from 'lucide-react'
import type { KeyboardEvent, PointerEvent as ReactPointerEvent, RefObject } from 'react'
import type { Chapter } from '../../types/domain'
import { chapitreLabel, filterChapters } from './chapters'

/* Au-delà de ce nombre de chapitres, la liste seule ne sert plus à rien :
   on passe au clavier. */
const SEUIL_RECHERCHE = 15

/* Fermeture par glissement : le doigt descend d'autant qu'il ouvre. */
const GLISSEMENT_FERMETURE = 64

const SELECTEUR_FOCUS =
  'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'



export interface ChapterNavProps {
  chapters: Chapter[]
  chapter: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (chapter: number) => void
  /* Le bouton du rail, à qui le focus revient à la fermeture. */
  triggerRef: RefObject<HTMLButtonElement | null>
}

/** Bouton flottant « Sommaire », sous le bouton d'affichage. Sur une œuvre à un
 *  seul chapitre il n'est pas rendu : rien à choisir, donc rien à ouvrir.
 *
 *  La référence du bouton est partagée avec le tiroir : c'est lui qui rend le
 *  focus à la fermeture. Les deux composants restent donc dissociables. */
export const ChapterRailButton = forwardRef<
  HTMLButtonElement,
  { total: number; open: boolean; onToggle: () => void }
>(function ChapterRailButton({ total, open, onToggle }, ref) {
  if (total <= 1) return null

  return (
    <button
      type="button"
      ref={ref}
      className={`rail-button rail-button--chapter${open ? ' is-active' : ''}`}
      onClick={onToggle}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-controls="chapter-drawer"
      aria-label={open ? 'Fermer le sommaire des chapitres' : 'Sommaire des chapitres'}
      title="Sommaire"
    >
      <List size={20} aria-hidden="true" />
    </button>
  )
})

export function ChapterDrawer({
  chapters,
  chapter,
  open,
  onOpenChange,
  onSelect,
  triggerRef,
}: ChapterNavProps) {
  /* Trois temps comme le panneau d'affichage : ouvert, fermé, puis
     disparu — sans quoi la fermeture serait un simple cut. */
  const [phase, setPhase] = useState<'closed' | 'open' | 'closing'>('closed')
  const [query, setQuery] = useState('')

  const drawerRef = useRef<HTMLDivElement | null>(null)

  /* Le tiroir reste monté pendant l'animation de fermeture : le retirer sur
     l'état `open` le ferait disparaître d'un coup, sans animation. */
  const visible = phase !== 'closed' && chapters.length > 1

  /* Deux temps comme le panneau d'affichage : l'ouverture est une animation
     CSS, que la préférence de mouvement réduit peut supprimer — refermer au
     chronomètre garantit la fermeture dans tous les cas. */
  useEffect(() => {
    if (phase !== 'closing') return
    const timer = window.setTimeout(() => setPhase('closed'), 200)
    return () => window.clearTimeout(timer)
  }, [phase])

  const fermer = useCallback(() => {
    setPhase('closing')
    onOpenChange(false)
    triggerRef.current?.focus()
  }, [onOpenChange, triggerRef])

  /* L'ouverture vient d'un clic : on réagit à `open`, et non à une derive de
     `phase`, pour ne pas refermer ce que l'utilisateur vient d'ouvrir. */
  if (open && phase === 'closed' && chapters.length > 1) {
    setPhase('open')
    setQuery('')
  }

  const filtrés = useMemo(() => filterChapters(chapters, query), [chapters, query])

  /* Une sélection depuis le tiroir : on ferme, puis on change de chapitre.
     Le geste reste au lecteur, qui sait où porter le défilement. */
  const choisir = useCallback(
    (n: number) => {
      onOpenChange(false)
      triggerRef.current?.focus()
      onSelect(n)
    },
    [onOpenChange, onSelect, triggerRef],
  )

  /* Focus : Entrée dans le sommaire, piégé pendant, rendu au bouton à la
     sortie. */
  useEffect(() => {
    if (phase !== 'open') return
    drawerRef.current?.focus()
  }, [phase])

  useEffect(() => {
    if (phase !== 'open') return

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        event.preventDefault()
        fermer()
        return
      }

      if (event.key !== 'Tab') return

      const elements = Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>(SELECTEUR_FOCUS) ?? [],
      )
      if (elements.length === 0) return

      /* Le piège : le focus ne sort pas du tiroir tant qu'il est ouvert. */
      event.preventDefault()
      const index = elements.indexOf(document.activeElement as HTMLElement)
      const suivant = (index + (event.shiftKey ? -1 : 1) + elements.length) % elements.length
      elements[suivant]?.focus()
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [phase, fermer])

  /* Clic sur le fond : le tiroir se referme. La liste elle-même est
     cliquable, on ne ferme donc que ce qui est vraiment hors du tiroir. */
  useEffect(() => {
    if (phase !== 'open') return

    const onPointerDown = (event: globalThis.MouseEvent) => {
      const target = event.target as Node | null
      if (target && drawerRef.current?.contains(target)) return
      fermer()
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [phase, fermer])

  const onDrawerKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      fermer()
    }
  }

  /* Le lecteur capte les flèches pour changer de verset : dans le sommaire, on
     les rend à la liste. Le champ de recherche garde les siennes. */
  const onFleches = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return

    const avant = event.key === 'ArrowUp'
    const apres = event.key === 'ArrowDown'
    if (!avant && !apres) return

    event.preventDefault()
    event.stopPropagation()

    const elements = Array.from(
      drawerRef.current?.querySelectorAll<HTMLElement>(SELECTEUR_FOCUS) ?? [],
    )
    const index = elements.indexOf(document.activeElement as HTMLElement)
    const suivant = (index + (avant ? -1 : 1) + elements.length) % elements.length
    elements[suivant]?.focus()
  }

  /* Glissement vers le bas : on ferme quand le doigt descend plus que la
     feuille ne bouge. Au-dessus, c'est un défilement de liste ordinaire. */
  const glisseRef = useRef<{ y: number; top: number } | null>(null)

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null
    if (!target?.closest('.chapter-drawer-grab')) return

    glisseRef.current = {
      y: event.clientY,
      top: drawerRef.current?.getBoundingClientRect().top ?? 0,
    }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const glisse = glisseRef.current
    const drawer = drawerRef.current
    if (!glisse || !drawer) return

    const delta = event.clientY - glisse.y
    if (delta <= 0) return

    drawer.style.transition = 'none'
    drawer.style.transform = `translateY(${delta}px)`
  }

  const onPointerUp = () => {
    const glisse = glisseRef.current
    glisseRef.current = null

    const drawer = drawerRef.current
    if (!glisse || !drawer) return

    const delta = drawer.getBoundingClientRect().top - glisse.top
    drawer.style.transition = ''
    drawer.style.transform = ''

    if (delta >= GLISSEMENT_FERMETURE) fermer()
  }

  if (chapters.length <= 1) return null

  if (!visible) return null

  /* Le tiroir part à la racine du document : dans le rail il partagerait le
     contexte d'empilement des boutons, et la barre du haut passerait par-
     dessus lui. */
  return createPortal(
    <>
      <div className="drawer-backdrop" onClick={fermer} aria-hidden="true" />
      <div
        id="chapter-drawer"
        ref={drawerRef}
        className="chapter-drawer"
        data-phase={phase}
        role="dialog"
        aria-modal="true"
        aria-label="Sommaire des chapitres"
        tabIndex={-1}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(event) => {
          onDrawerKeyDown(event)
          onFleches(event)
        }}
      >
        {/* Poignée : sur mobile, c'est par elle qu'on ferme d'un glissement. */}
        <div className="chapter-drawer-grab" aria-hidden="true">
          <span />
        </div>

        <div className="chapter-drawer-head">
          <p className="chapter-drawer-title">Sommaire</p>
          <button
            type="button"
            className="icon-button icon-button--ghost"
            onClick={fermer}
            aria-label="Fermer le sommaire"
          >
            <X size={16} />
          </button>
        </div>

        {chapters.length > SEUIL_RECHERCHE ? (
          <div className="chapter-search">
            <Search size={15} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Rechercher un chapitre (${chapters.length})`}
              aria-label="Rechercher un chapitre"
            />
          </div>
        ) : null}

        <ul className="chapter-list">
          {filtrés.map((entry) => (
            <li key={entry.n}>
              <button
                type="button"
                className={`chapter-item${entry.n === chapter ? ' is-active' : ''}`}
                aria-current={entry.n === chapter ? 'true' : undefined}
                onClick={() => choisir(entry.n)}
              >
                {/* L'œuvre n'a pas de titre de chapitre : la ligne est le nom
                    (« Chapitre 3 ») et son nombre de versets. */}
                <span className="chapter-item-label">{chapitreLabel(entry.n, chapters.length)}</span>
                <span className="chip-count">{entry.verseCount}</span>
              </button>
            </li>
          ))}

          {filtrés.length === 0 ? <li className="chapter-empty">Aucun chapitre trouvé</li> : null}
        </ul>
      </div>
    </>,
    document.body,
  )
}