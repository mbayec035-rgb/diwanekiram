/* Navigation entre chapitres : sélecteur compact en haut de la zone de
   lecture, passage précédent/suivant en bas du chapitre.

   Deux entrées pour un même état — le lecteur garde le chapitre courant et
   n'expose que les deux directions possibles. Sur une œuvre à un seul
   chapitre, aucun des deux n'est rendu : ils n'auraient rien à faire. */

import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface ChapterStepperProps {
  chapter: number
  total: number
  onPrev: () => void
  onNext: () => void
  onOpenSummary: () => void
}

export function ChapterStepper({
  chapter,
  total,
  open,
  onPrev,
  onNext,
  onOpenSummary,
}: ChapterStepperProps & { open: boolean }) {
  if (total <= 1) return null

  return (
    <div className="chapter-stepper">
      <button
        type="button"
        className="icon-button icon-button--ghost"
        onClick={onPrev}
        disabled={chapter <= 1}
        aria-label="Chapitre précédent"
      >
        <ChevronLeft size={17} aria-hidden="true" />
      </button>

      <button
        type="button"
        className={`chapter-stepper-label${open ? ' is-active' : ''}`}
        onClick={onOpenSummary}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="chapter-drawer"
        aria-label={`Chapitre ${chapter} sur ${total}. Ouvrir le sommaire`}
      >
        <span className="chapter-stepper-current">Chapitre {chapter}</span>
        <span className="chapter-stepper-total">/ {total}</span>
      </button>

      <button
        type="button"
        className="icon-button icon-button--ghost"
        onClick={onNext}
        disabled={chapter >= total}
        aria-label="Chapitre suivant"
      >
        <ChevronRight size={17} aria-hidden="true" />
      </button>
    </div>
  )
}

export function ChapterFooterNav({
  chapter,
  total,
  onPrev,
  onNext,
}: Omit<ChapterStepperProps, 'onOpenSummary'>) {
  if (total <= 1) return null

  return (
    <nav className="chapter-footer" aria-label="Navigation entre chapitres">
      <button
        type="button"
        className="button button--ghost button--sm"
        onClick={onPrev}
        disabled={chapter <= 1}
      >
        <ChevronLeft size={16} aria-hidden="true" /> Chapitre précédent
      </button>

      <span className="chapter-footer-position">
        {chapter} / {total}
      </span>

      <button
        type="button"
        className="button button--ghost button--sm"
        onClick={onNext}
        disabled={chapter >= total}
      >
        Chapitre suivant <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  )
}