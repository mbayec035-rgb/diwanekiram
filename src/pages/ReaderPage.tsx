/* Lecteur : navigation par chapitres, couches de texte, reprise de lecture. */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Heart,
  HelpCircle,
  Languages,
  Layers,
  ScrollText,
  Settings2,
  Type,
  X,
} from 'lucide-react'
import type { ReactNode, RefObject } from 'react'
import { useAsync } from '../hooks/useAsync'
import { fetchTranslations, fetchVerses, loadCatalog } from '../services/library'
import { useReadingProgress } from '../hooks/useReadingProgress'
import { useLibrary } from '../store/useLibrary'
import { useSettings } from '../store/useSettings'
import type { LayerScale } from '../store/useSettings'
import { SCALE_LIMITS } from '../store/useSettings'
import { Badge, ErrorState, Skeleton } from '../components/ui/Bits'
import { MemoVerseBlock } from '../components/reader/VerseBlock'
import type { Chapter, Verse } from '../types/domain'

interface FlatVerse {
  verse: Verse
  chapter: Chapter
}

export function ReaderPage() {
  const { slug = '' } = useParams()
  const [params] = useSearchParams()
  const requestedVerse = params.get('v')

  const { data: catalog, error: catalogError, reload } = useAsync(loadCatalog, [])
  const item = catalog?.itemsBySlug.get(slug)
  const xassida = catalog?.xassidas.find((entry) => entry.slug === slug)
  const author = xassida ? catalog?.authorsById.get(xassida.authorId) : undefined

  const { data: document, error: versesError } = useAsync(
    () => (item ? fetchVerses(item) : Promise.resolve(null)),
    [item?.file],
  )
  const { data: translations } = useAsync(
    () => (item ? fetchTranslations(item) : Promise.resolve(null)),
    [item?.translationsFile],
  )

  const [chapterFilter, setChapterFilter] = useState<number | null>(null)
  /* Le panneau reste ouvert tant que le slug ne change pas :
     le comparer pendant le rendu évite un effet supplémentaire. */
  const [displaySlug, setDisplaySlug] = useState<string | null>(null)
  const displayOpen = displaySlug === slug
  const displayRef = useRef<HTMLDivElement | null>(null)
  const closeDisplay = () => setDisplaySlug(null)

  const flat = useMemo<FlatVerse[]>(() => {
    if (!document) return []
    return document.chapters.flatMap((chapter) => chapter.verses.map((verse) => ({ verse, chapter })))
  }, [document])

  const visible = useMemo(
    () => (chapterFilter ? flat.filter((entry) => entry.chapter.n === chapterFilter) : flat),
    [flat, chapterFilter],
  )

  const ids = useMemo(() => visible.map((entry) => entry.verse.id), [visible])
  const { containerRef, activeId, scrollTo } = useReadingProgress(ids, flat.length > 0)

  const markRead = useLibrary((state) => state.markRead)
  const favorites = useLibrary((state) => state.favorites)
  const toggleFavorite = useLibrary((state) => state.toggleFavorite)
  const isFavorite = favorites.includes(slug)

  const settings = useSettings()

  useEffect(() => {
    if (!requestedVerse || flat.length === 0) return
    if (flat.some((entry) => entry.verse.id === requestedVerse)) scrollTo(requestedVerse)
  }, [requestedVerse, slug, flat, scrollTo])

  useEffect(() => {
    if (!displayOpen) return

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (target && displayRef.current?.contains(target)) return
      setDisplaySlug(null)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDisplaySlug(null)
    }

    /* `document` est masqué par le document des versets : on passe par globalThis. */
    globalThis.document.addEventListener('mousedown', onPointerDown)
    globalThis.document.addEventListener('keydown', onKeyDown)
    return () => {
      globalThis.document.removeEventListener('mousedown', onPointerDown)
      globalThis.document.removeEventListener('keydown', onKeyDown)
    }
  }, [displayOpen])

  useEffect(() => {
    if (!activeId || flat.length === 0) return
    const timer = window.setTimeout(() => markRead(slug, activeId), 900)
    return () => window.clearTimeout(timer)
  }, [activeId, slug, markRead, flat.length])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return

      const index = ids.indexOf(activeId ?? '')
      if (index === -1) return

      const forward = event.key === 'ArrowDown' || event.key === 'j'
      const backward = event.key === 'ArrowUp' || event.key === 'k'
      if (!forward && !backward) return

      event.preventDefault()
      const next = ids[forward ? index + 1 : index - 1]
      if (next) scrollTo(next)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [ids, activeId, scrollTo])

  if (catalogError) return <ErrorState message={catalogError.message} onRetry={reload} />

  if (!catalog || !xassida || !item) {
    return (
      <div className="page-stack">
        <Skeleton height={40} radius={14} width="40%" />
        <Skeleton height={320} radius={20} />
        <Link className="button button--ghost button--md" to="/bibliotheque">
          Retour à la bibliothèque
        </Link>
      </div>
    )
  }

  const currentIndex = ids.indexOf(activeId ?? '')
  const chapters = document?.chapters ?? []
  const currentChapter = currentIndex >= 0 ? visible[currentIndex].chapter.n : null
  const translatedPercent = Math.round(xassida.translatedRatio * 100)

  /* Le mètre, la rive et le thème n'existent que chez les sources qui les
     donnent : les 63 œuvres déjà publiées n'en ont aucune, leur absence
     doit rester invisible plutôt que d'afficher trois placeholders. */
  const poetry = [
    { key: 'meter', label: 'Mètre', value: xassida.meter },
    { key: 'rhyme', label: 'Rive', value: xassida.rhyme },
    { key: 'category', label: 'Thème', value: xassida.category },
  ].filter((entry) => Boolean(entry.value?.nameAr))

  return (
    <div className="reader">
      <aside className="reader-toc" aria-label="Chapitres">
        <p className="reader-toc-title">Chapitres</p>
        <ul>
          <li>
            <button
              type="button"
              className={`toc-item${chapterFilter === null ? ' is-active' : ''}`}
              onClick={() => setChapterFilter(null)}
            >
              Tout ({xassida.verseCount})
            </button>
          </li>
          {chapters.map((chapter) => (
            <li key={chapter.n}>
              <button
                type="button"
                className={`toc-item${chapterFilter === chapter.n ? ' is-active' : ''}`}
                onClick={() => {
                  setChapterFilter(chapters.length > 1 ? chapter.n : null)
                  const first = chapter.verses[0]
                  if (first) window.setTimeout(() => scrollTo(first.id), 60)
                }}
              >
                {chapters.length > 1 ? `Chapitre ${chapter.n}` : 'Texte'}
                <span className="chip-count">{chapter.verses.length}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="reader-main">
        <header className="reader-head">
          <div className="reader-head-main">
            <p className="eyebrow">
              {author ? `${author.name} · ${author.tarihaLabel}` : 'Auteur inconnu'}
            </p>
            <h1>{xassida.name}</h1>
            <p className="reader-arabic-title" lang="ar" dir="rtl">
              {xassida.nameAr}
            </p>
            <div className="reader-badges">
              <Badge tone="muted">
                {xassida.chapterCount} ch. · {xassida.verseCount} vers
              </Badge>
              <Badge tone={translatedPercent === 100 ? 'mint' : 'warn'}>
                Traduction {translatedPercent} %
              </Badge>
            </div>
            {poetry.length > 0 && (
              <dl className="reader-poetry">
                {poetry.map((entry) => (
                  <div key={entry.key} className="reader-poetry-item">
                    <dt>{entry.label}</dt>
                    <dd>
                      <span lang="ar" dir="rtl">
                        {entry.value?.nameAr}
                      </span>
                      {entry.value?.name ? <span> · {entry.value.name}</span> : null}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <button
            type="button"
            className={`icon-button icon-button--fav${isFavorite ? ' is-active' : ''}`}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            onClick={() => toggleFavorite(slug)}
          >
            <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </header>

        <div className="reader-display" ref={displayRef}>
          <div className="reader-toolbar" role="group" aria-label="Options de lecture">
          <div className="toolbar-group toolbar-group--display">
            <LayerToggle
              active={settings.showArabic}
              onClick={() => settings.toggleLayer('showArabic')}
              icon={<Type size={15} />}
              label="Arabe"
            />
            <LayerToggle
              active={settings.showTranscription}
              onClick={() => settings.toggleLayer('showTranscription')}
              icon={<ScrollText size={15} />}
              label="Transcription"
            />
            <LayerToggle
              active={settings.showTranslation}
              onClick={() => settings.toggleLayer('showTranslation')}
              icon={<Languages size={15} />}
              label="Traduction"
            />

            <button
              type="button"
              className={`button button--ghost button--sm display-toggle${displayOpen ? ' is-active' : ''}`}
              onClick={() => setDisplaySlug(displayOpen ? null : slug)}
              aria-expanded={displayOpen}
              aria-haspopup="dialog"
            >
              <Settings2 size={15} />
              <span>Affichage</span>
            </button>
          </div>
        </div>

        <div className="toolbar-group toolbar-group--practice">
          <Link
            className="button button--ghost button--sm"
            to={`/apprentissage/${slug}`}
            title="Apprendre cette xassida vers par vers"
          >
            <GraduationCap size={15} />
            <span>Apprendre</span>
          </Link>
          <Link
            className="button button--ghost button--sm"
            to={`/quiz?xassida=${slug}`}
            title="Quiz sur cette xassida"
          >
            <HelpCircle size={15} />
            <span>Quiz</span>
          </Link>
        </div>

        {displayOpen ? (
            <div
              className="display-panel"
              role="dialog"
              aria-label="Réglages d’affichage"
            >
              <div className="display-panel-head">
                <p className="display-panel-title">
                  <Settings2 size={15} aria-hidden="true" /> Réglages d&rsquo;affichage
                </p>
                <button
                  type="button"
                  className="icon-button icon-button--ghost"
                  onClick={closeDisplay}
                  aria-label="Fermer les réglages d’affichage"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="display-panel-rows">
                <ScaleSlider
                  icon={<Type size={15} />}
                  label="Texte arabe"
                  layer="arabic"
                  value={settings.arabicScale}
                  onChange={(value) => settings.setLayerScale('arabic', value)}
                />
                <ScaleSlider
                  icon={<ScrollText size={15} />}
                  label="Transcription"
                  layer="transcription"
                  value={settings.transcriptionScale}
                  onChange={(value) => settings.setLayerScale('transcription', value)}
                  disabled={!settings.showTranscription}
                />
                <ScaleSlider
                  icon={<Languages size={15} />}
                  label="Traduction"
                  layer="translation"
                  value={settings.translationScale}
                  onChange={(value) => settings.setLayerScale('translation', value)}
                  disabled={!settings.showTranslation}
                />
              </div>

              <div className="display-panel-toggles">
                {(
                  [
                    ['showArabic', 'Arabe'],
                    ['showTranscription', 'Transcription'],
                    ['showTranslation', 'Traduction'],
                  ] as const
                ).map(([layer, label]) => (
                  <button
                    key={layer}
                    type="button"
                    className={`chip chip--button${settings[layer] ? ' is-active' : ''}`}
                    onClick={() => settings.toggleLayer(layer)}
                    aria-pressed={settings[layer]}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
        ) : null}
        </div>

        {versesError ? <ErrorState message={versesError.message} /> : null}

        <div className="reader-scroll" ref={containerRef as RefObject<HTMLDivElement>}>
          {!document ? (
            Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} height={72} radius={14} />
            ))
          ) : (
            visible.map((entry) => (
              <div key={entry.verse.id} className="reader-item">
                {entry.chapter.n !== 1 && entry.verse.n === 1 ? (
                  <h2 className="reader-chapter">Chapitre {entry.chapter.n}</h2>
                ) : null}
                <MemoVerseBlock
                  verse={entry.verse}
                  translation={translations?.verses[entry.verse.id]}
                  chapterNumber={entry.chapter.n}
                  showArabic={settings.showArabic}
                  showTranscription={settings.showTranscription}
                  showTranslation={settings.showTranslation}
                  active={entry.verse.id === activeId}
                  arabicScale={settings.arabicScale}
                  transcriptionScale={settings.transcriptionScale}
                  translationScale={settings.translationScale}
                  font={settings.arabicFont}
                />
              </div>
            ))
          )}
        </div>

        <footer className="reader-foot">
          <button
            type="button"
            className="button button--ghost button--sm"
            disabled={currentIndex <= 0}
            onClick={() => {
              const target = ids[currentIndex - 1]
              if (target) scrollTo(target)
            }}
          >
            <ChevronLeft size={16} /> Précédent
          </button>

          <span className="reader-position">
            {currentIndex >= 0 ? `${currentIndex + 1} / ${ids.length}` : `${ids.length} versets`}
            {currentChapter && chapters.length > 1 ? ` · chapitre ${currentChapter}` : ''}
          </span>

          <button
            type="button"
            className="button button--ghost button--sm"
            disabled={currentIndex === -1 || currentIndex >= ids.length - 1}
            onClick={() => {
              const target = ids[currentIndex + 1]
              if (target) scrollTo(target)
            }}
          >
            Suivant <ChevronRight size={16} />
          </button>
        </footer>

        <p className="reader-hint muted">
          <Layers size={13} aria-hidden="true" /> Astuce : utilisez <kbd>J</kbd> et <kbd>K</kbd> ou les
          flèches pour parcourir les versets.
        </p>
      </div>
    </div>
  )
}

function LayerToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      className={`chip chip--button${active ? ' is-active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {icon}
      {label}
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