/* Lecteur : navigation par chapitres, couches de texte, reprise de lecture. */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Heart, Layers } from 'lucide-react'
import type { RefObject } from 'react'
import { useAsync } from '../hooks/useAsync'
import { fetchTranslations, fetchVerses, loadCatalog } from '../services/library'
import { useReadingProgress } from '../hooks/useReadingProgress'
import { useLibrary } from '../store/useLibrary'
import { useSettings } from '../store/useSettings'
import { Badge, ErrorState, Skeleton } from '../components/ui/Bits'
import { DisplayRail } from '../components/reader/DisplayRail'
import { ChapterDrawer, ChapterRailButton } from '../components/reader/ChapterNav'
import { ChapterFooterNav, ChapterStepper } from '../components/reader/ChapterStepper'
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

  const chapters = useMemo(() => document?.chapters ?? [], [document])

  const progress = useLibrary((state) => state.progress[slug])

  /* Le chapitre courant vit dans la page, pas dans l'URL : c'est un état de
     navigation, et il est mémorisé par markRead comme la position de lecture.
     `null` signifie « aucun chapitre choisi » — c'est alors la reprise qui
     tranche, et elle n'a lieu qu'une fois le document arrivé. */
  const [choisi, setChoisi] = useState<number | null>(null)
  const [slugAffichage, setSlugAffichage] = useState(slug)
  /* Un seul panneau à la fois : le sommaire et les réglages d'affichage
     occupent la même zone du rail, ils ne peuvent pas se recouvrir. */
  const [panneau, setPanneau] = useState<'sommaire' | 'affichage' | null>(null)
  const sommaireOpen = panneau === 'sommaire'
  const affichageOpen = panneau === 'affichage'
  const setSommaireOpen = useCallback(
    (open: boolean | ((previous: boolean) => boolean)) =>
      setPanneau((previous) => {
        const suivant = typeof open === 'function' ? open(previous === 'sommaire') : open
        return suivant ? 'sommaire' : null
      }),
    [],
  )
  const setAffichageOpen = useCallback((open: boolean) => setPanneau(open ? 'affichage' : null), [])

  const boutonSommaire = useRef<HTMLButtonElement | null>(null)

  const flat = useMemo<FlatVerse[]>(() => {
    if (!document) return []
    return document.chapters.flatMap((chapter) => chapter.verses.map((verse) => ({ verse, chapter })))
  }, [document])

  /* Changement d'œuvre : le chapitre choisi et le panneau ouvert appartiennent
     à l'œuvre précédente. On les oublie pendant le rendu, au moment exact où
     le nouveau document s'affiche — sans effet, donc sans rendu intermédiaire
     montrant le sommaire de l'ancienne œuvre. */
  if (slugAffichage !== slug) {
    setSlugAffichage(slug)
    setChoisi(null)
    setPanneau(null)
  }

  /* Reprise de lecture : le chapitre mémorisé, si l'œuvre en a toujours un
     aussi — elle a pu être complétée entre-temps. Sinon le premier. */
  const memorise = useMemo(() => {
    const n = progress?.chapter
    if (n === undefined) return null
    return chapters.some((entry) => entry.n === n) ? n : null
  }, [progress?.chapter, chapters])

  /* Un verset demandé par l'URL l'emporte sur la reprise, et peut être dans un
     autre chapitre que le chapitre mémorisé : on l'ouvre d'abord, puis le
     défilement rejoint le verset. Dérivé pendant le rendu — c'est une position
     de départ, pas un changement de chapitre demandé par l'utilisateur. */
  const chapterDemande = useMemo(() => {
    if (!requestedVerse) return null
    return flat.find((entry) => entry.verse.id === requestedVerse)?.chapter.n ?? null
  }, [requestedVerse, flat])

  const chapter = choisi ?? chapterDemande ?? memorise ?? 1

  const currentChapter = useMemo(
    () => chapters.find((entry) => entry.n === chapter) ?? chapters[0],
    [chapters, chapter],
  )

  const visible = useMemo(
    () => (currentChapter ? flat.filter((entry) => entry.chapter.n === currentChapter.n) : flat),
    [flat, currentChapter],
  )

  const ids = useMemo(() => visible.map((entry) => entry.verse.id), [visible])
  const { containerRef, activeId, scrollTo } = useReadingProgress(ids, flat.length > 0)

  const markRead = useLibrary((state) => state.markRead)
  const favorites = useLibrary((state) => state.favorites)
  const toggleFavorite = useLibrary((state) => state.toggleFavorite)
  const isFavorite = favorites.includes(slug)

  const settings = useSettings()

  /* Le changement de chapitre est demandé par l'utilisateur ou par la reprise,
     jamais par le défilement : on replace le début du chapitre choisi. */
  /* Le changement de chapitre est demandé par l'utilisateur ou par la reprise,
     jamais par le défilement : on replace le début du chapitre choisi. */
  useEffect(() => {
    if (flat.length === 0) return
    const premier = flat.find((entry) => entry.chapter.n === chapter)?.verse.id
    if (!premier) return
    scrollTo(premier)
  }, [chapter, flat, scrollTo])

  /* Le chapitre affiché est à l'écran : on rejoint ensuite le verset demandé
     par l'URL, qui prime sur le début du chapitre. */
  useEffect(() => {
    if (!requestedVerse || flat.length === 0) return
    const cible = flat.find((entry) => entry.verse.id === requestedVerse)
    if (!cible || cible.chapter.n !== chapter) return
    scrollTo(requestedVerse)
  }, [requestedVerse, flat, chapter, scrollTo])

  useEffect(() => {
    if (!activeId || flat.length === 0) return
    const timer = window.setTimeout(() => markRead(slug, activeId, chapter), 900)
    return () => window.clearTimeout(timer)
  }, [activeId, slug, chapter, markRead, flat.length])

  /* Aller au chapitre voisin sans passer par le sommaire. */
  const changeChapter = useCallback(
    (n: number) => {
      if (n < 1 || n > chapters.length) return
      setChoisi(n)
    },
    [chapters.length],
  )

  useEffect(() => {
    /* Le sommaire a le focus pendant qu'il est ouvert : j et k doivent y
       rester des frappes de liste, pas des changements de verset. */
    if (sommaireOpen) return

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
  }, [ids, activeId, scrollTo, sommaireOpen])

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

        <DisplayRail slug={slug} ouvert={affichageOpen} onOpenChange={setAffichageOpen}>
          <ChapterRailButton
            ref={boutonSommaire}
            total={chapters.length}
            open={sommaireOpen}
            onToggle={() => setSommaireOpen((open) => !open)}
          />
          <ChapterDrawer
            chapters={chapters}
            chapter={chapter}
            open={sommaireOpen}
            onOpenChange={setSommaireOpen}
            onSelect={changeChapter}
            triggerRef={boutonSommaire}
          />
        </DisplayRail>

        {versesError ? <ErrorState message={versesError.message} /> : null}

        <ChapterStepper
          chapter={chapter}
          total={chapters.length}
          open={sommaireOpen}
          onPrev={() => changeChapter(chapter - 1)}
          onNext={() => changeChapter(chapter + 1)}
          onOpenSummary={() => setSommaireOpen(true)}
        />

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

        <ChapterFooterNav
          chapter={chapter}
          total={chapters.length}
          onPrev={() => changeChapter(chapter - 1)}
          onNext={() => changeChapter(chapter + 1)}
        />

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
