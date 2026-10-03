/* Barre d'outils du lecteur : une pile de boutons carrés collés au bord
   droit de l'écran, l'affichage en tête. Elle reste visible au défilement.

   Le panneau des réglages s'ouvre à gauche du bouton sur grand écran, et
   remonte du bas en feuille sur mobile. L'état des couches et des tailles
   reste celui du magasin : rien n'est dupliqué, rien n'est persisté à la
   main. */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, HelpCircle, Languages, ScrollText, Settings2, Type, X } from 'lucide-react'
import type { KeyboardEvent, ReactNode } from 'react'
import { useSettings } from '../../store/useSettings'
import type { LayerScale } from '../../store/useSettings'
import { SCALE_LIMITS } from '../../store/useSettings'

const COUCHES = [
  { key: 'showArabic', label: 'Arabe', icon: <Type size={15} aria-hidden="true" /> },
  { key: 'showTranscription', label: 'Transcription', icon: <ScrollText size={15} aria-hidden="true" /> },
  { key: 'showTranslation', label: 'Traduction', icon: <Languages size={15} aria-hidden="true" /> },
] as const

type LayerKey = (typeof COUCHES)[number]['key']

const SELECTEUR_FOCUS =
  'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

interface DisplayRailProps {
  slug: string
  /* Le sommaire des chapitres partage cette pile. Le lecteur garde la main
     sur l'ouverture : c'est lui qui sait qu'un seul panneau peut être ouvert,
     donc que les deux ne se recouvrent jamais. */
  ouvert?: boolean
  onOpenChange?: (open: boolean) => void
  children?: ReactNode
}

export function DisplayRail({ slug, ouvert, onOpenChange, children }: DisplayRailProps) {
  const settings = useSettings()

  /* Trois temps : le panneau s'ouvre, se ferme, puis disparaît — sans quoi
     la fermeture serait un simple cuts. */
  const [phase, setPhase] = useState<'closed' | 'open' | 'closing'>('closed')
  const [dernierOuvert, setDernierOuvert] = useState(false)
  const [panneauSlug, setPanneauSlug] = useState<string | null>(null)

  const railRef = useRef<HTMLDivElement | null>(null)
  const panneauRef = useRef<HTMLDivElement | null>(null)
  const boutonRef = useRef<HTMLButtonElement | null>(null)

  /* L'ouverture vient du lecteur : l'animation d'entrée et de sortie est
     dérivée de cet état pendant le rendu, sans effet ni second état. */
  if (ouvert !== undefined && ouvert !== dernierOuvert) {
    setDernierOuvert(ouvert)
    if (ouvert) setPanneauSlug(slug)
    setPhase(ouvert ? 'open' : 'closing')
  }

  /* Ce qui est réellement à l'écran : pendant la fermeture, l'animation doit
     encore avoir lieu. */
  const visible = phase !== 'closed'

  /* Le panneau reste ouvert tant que le slug ne change pas. */
  const ouvrir = useCallback(() => {
    setPanneauSlug(slug)
    onOpenChange?.(true)
  }, [slug, onOpenChange])

  const fermer = useCallback(
    (rendreFocus = false) => {
      onOpenChange?.(false)
      if (rendreFocus) boutonRef.current?.focus()
    },
    [onOpenChange],
  )

  /* La fin de l'animation est une animation CSS, que la préférence de
     mouvement réduit peut supprimer : on referme au chronomètre. */
  useEffect(() => {
    if (phase !== 'closing') return
    const timer = window.setTimeout(() => setPhase('closed'), 200)
    return () => window.clearTimeout(timer)
  }, [phase])

  useEffect(() => {
    if (phase !== 'open') return
    panneauRef.current?.focus()
  }, [phase])

  useEffect(() => {
    if (phase === 'closed') return

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (target && railRef.current?.contains(target)) return
      fermer()
    }

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      fermer(true)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [phase, fermer])

  /* Les flèches font défiler les réglages sans quitter le clavier. */
  const onPanneauKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const avant = event.key === 'ArrowUp' || event.key === 'ArrowLeft'
    const apres = event.key === 'ArrowDown' || event.key === 'ArrowRight'
    if (!avant && !apres) return

    /* Un curseur garde ses flèches : elles lui servent à changer la taille.
       On n'intercepte que la navigation entre les autres contrôles. */
    const target = event.target as HTMLElement | null
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return

    const elements = Array.from(panneauRef.current?.querySelectorAll<HTMLElement>(SELECTEUR_FOCUS) ?? [])
    if (elements.length === 0) return

    /* Le lecteur interprete les flèches comme « verset suivant » : on
       s'arrête ici pour que le panneau n'en déclenche pas un changement. */
    event.preventDefault()
    event.stopPropagation()

    const index = elements.indexOf(document.activeElement as HTMLElement)
    const suivant = (index + (avant ? -1 : 1) + elements.length) % elements.length
    elements[suivant]?.focus()
  }

  return (
    <div className="display-rail" ref={railRef}>
      <button
        type="button"
        ref={boutonRef}
        className={`rail-button rail-button--display${visible ? ' is-active' : ''}`}
        onClick={visible ? () => fermer(true) : ouvrir}
        aria-expanded={visible}
        aria-haspopup="dialog"
        aria-controls={visible ? 'display-panel' : undefined}
        aria-label={visible ? 'Fermer les réglages d’affichage' : 'Réglages d’affichage'}
        title="Affichage"
      >
        <Settings2 size={20} aria-hidden="true" />
      </button>

      {children}

      <Link
        className="rail-button rail-button--learn"
        to={`/apprentissage/${slug}`}
        aria-label="Apprendre cette xassida vers par vers"
        title="Apprendre cette xassida vers par vers"
      >
        <GraduationCap size={20} aria-hidden="true" />
      </Link>

      <Link
        className="rail-button rail-button--quiz"
        to={`/quiz?xassida=${slug}`}
        aria-label="Quiz sur cette xassida"
        title="Quiz sur cette xassida"
      >
        <HelpCircle size={20} aria-hidden="true" />
      </Link>

      {visible && panneauSlug === slug ? (
        <div
          id="display-panel"
          ref={panneauRef}
          className="display-panel"
          data-phase={phase}
          role="dialog"
          aria-label="Réglages d’affichage"
          tabIndex={-1}
          onKeyDown={onPanneauKeyDown}
        >
          <div className="display-panel-head">
            <p className="display-panel-title">
              <Settings2 size={15} aria-hidden="true" /> Réglages d&rsquo;affichage
            </p>
            <button
              type="button"
              className="icon-button icon-button--ghost"
              onClick={() => fermer(true)}
              aria-label="Fermer les réglages d’affichage"
            >
              <X size={16} />
            </button>
          </div>

          <div className="display-panel-rows">
            <ScaleSlider
              icon={COUCHES[0].icon}
              label="Texte arabe"
              layer="arabic"
              value={settings.arabicScale}
              onChange={(value) => settings.setLayerScale('arabic', value)}
            />
            <ScaleSlider
              icon={COUCHES[1].icon}
              label="Transcription"
              layer="transcription"
              value={settings.transcriptionScale}
              onChange={(value) => settings.setLayerScale('transcription', value)}
              disabled={!settings.showTranscription}
            />
            <ScaleSlider
              icon={COUCHES[2].icon}
              label="Traduction"
              layer="translation"
              value={settings.translationScale}
              onChange={(value) => settings.setLayerScale('translation', value)}
              disabled={!settings.showTranslation}
            />
          </div>

          <div className="display-panel-toggles">
            {COUCHES.map((couche) => (
              <LayerSwitch key={couche.key} couche={couche} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function LayerSwitch({ couche }: { couche: { key: LayerKey; label: string; icon: ReactNode } }) {
  const show = useSettings((state) => state[couche.key])
  const toggleLayer = useSettings((state) => state.toggleLayer)

  return (
    <button
      type="button"
      role="switch"
      aria-checked={show}
      className={`chip chip--button${show ? ' is-active' : ''}`}
      onClick={() => toggleLayer(couche.key)}
    >
      {couche.icon}
      {couche.label}
    </button>
  )
}

/** Curseur de taille « façon volume » pour une couche de lecture. */
function ScaleSlider({
  icon,
  label,
  layer,
  value,
  onChange,
  disabled = false,
}: {
  icon: ReactNode
  label: string
  layer: LayerScale
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}) {
  const [min, max] = SCALE_LIMITS[layer]

  return (
    <div className={`scale-slider${disabled ? ' is-disabled' : ''}`}>
      <span className="scale-slider-label">
        {icon}
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.05}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={`Taille : ${label.toLowerCase()}`}
      />
      <output className="scale-slider-value">{Math.round(value * 100)} %</output>
    </div>
  )
}