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
import { SearchBar } from '../components/reader/SearchBar'
import type { SearchResult } from '../components/reader/SearchBar'
import { SearchRailButton } from '../components/reader/SearchRailButton'
import { MemoVerseBlock } from '../components/reader/VerseBlock'
import { buildTextIndex, excerptAround, layerWithMatch, searchIndex } from '../services/textSearch'
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
  /* Un seul panneau à la fois : le sommaire, la recherche et les réglages
     d'isplay occupent la même zone du rail, ils ne peuvent pas se recouvrir. */
  const [panneau, setPanneau] = useState<'sommaire' | 'affichage' | 'recherche' | null>(null)
  const sommaireOpen = panneau === 'sommaire'
  const affichageOpen = panneau === 'affichage'
  const rechercheOpen = panneau === 'recherche'
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

  /* ---- Recherche dans le texte ---- */

  const [requete, setRequete] = useState('')
  const [resultatActif, setResultatActif] = useState(0)
  /* Vers vers lequel l'utilisateur a navigué, et compteur de navigations : la
     ref porte la cible, l'état sert uniquement à réveiller l'effet. */
  const verseCible = useRef<string | null>(null)
  const [navigation, setNavigation] = useState(0)
  const boutonRecherche = useRef<HTMLButtonElement | null>(null)

  /* L'index ne porte que sur les colonnes affichées, et se reconstruit
     seulement quand elles changent : la normalisation se fait ici, une fois,
     jamais à la frappe. */
  const indexTexte = useMemo(
    () =>
      buildTextIndex(
        flat.map((entry) => ({ verse: entry.verse, chapterN: entry.chapter.n })),
        translations?.verses,
        {
          arabic: settings.showArabic,
          transcription: settings.showTranscription,
          translation: settings.showTranslation,
        },
      ),
    [flat, translations, settings.showArabic, settings.showTranscription, settings.showTranslation],
  )

  /* Une requête qui survit au changement de colonnes chercherait dans un texte
     qui n'est plus affiché : la signature oblige la barre à repartir vide. */
  const cleIndexTexte = `${flat.length}:${settings.showArabic}:${settings.showTranscription}:${settings.showTranslation}`

  const resultats = useMemo<SearchResult[]>(() => {
    const trouve = searchIndex(indexTexte, requete)
    return trouve.map((i) => {
      const entry = indexTexte.entries[i]
      const couche = layerWithMatch(entry.layers, requete)
      return {
        entry,
        excerpt: couche ? excerptAround(couche.text, requete) : '',
      }
    })
  }, [indexTexte, requete])

  /* Une nouvelle requête repart du premier résultat. */
  const cleResultats = `${requete}:${resultats.length}`
  const [cleVue, setCleVue] = useState(cleResultats)
  if (cleVue !== cleResultats) {
    setCleVue(cleResultats)
    if (resultatActif !== 0) setResultatActif(0)
  }

  const resultat = resultats[resultatActif] ?? null

  /* Ctrl+F / Cmd+F : on prend la place du navigateur, mais seulement ici, et
     seulement si aucun dialogue ne capte déjà la frappe. */
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'f' && event.key !== 'F') return
      if (!event.ctrlKey && !event.metaKey) return
      /* Le champ de la recherche a déjà le focus : ne pas lui voler. */
      const target = event.target as HTMLElement | null
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return

      event.preventDefault()
      setPanneau('recherche')
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const fermerRecherche = useCallback(() => {
    setPanneau(null)
    boutonRecherche.current?.focus()
  }, [])

  /* Le résultat actif n'existe plus après un changement de requête : le
     rappel ci-dessus le remet à zéro, inutile de défiler sur un résultat
     disparu. */

  /* Aller au résultat : c'est le lecteur qui décide du chapitre, la barre ne
     fait que dire où l'utilisateur veut aller. Une frappe ne déplace rien —
     seulement une navigation explicite (flèches, Entrée, liste). */
  const allerAuResultat = useCallback(
    (verseId: string) => {
      const cible = flat.find((entry) => entry.verse.id === verseId)
      if (!cible) return
      /* Le vers visé vit dans une ref : il ne sert qu'à l'effet de défilement.
         C'est le compteur qui déclenche l'effet, ce qui évite de remettre
         l'état à zéro depuis l'effet lui-même. */
      verseCible.current = verseId
      setNavigation((n) => n + 1)
      if (cible.chapter.n !== chapter) changeChapter(cible.chapter.n)
    },
    [flat, chapter, changeChapter],
  )

  /* Le défilement attend que le vers soit à l'écran : un résultat d'un autre
     chapitre n'existe pas dans le DOM tant que le chapitre n'a pas changé.
     L'effet repasse seul au changement de chapitre, sans boucle. */
  useEffect(() => {
    if (navigation === 0) return
    const cible = verseCible.current
    if (!cible) return
    if (!flat.some((entry) => entry.verse.id === cible && entry.chapter.n === chapter)) return
    scrollTo(cible)
  }, [navigation, chapter, flat, scrollTo])

  /* L'occurrence mise en avant : la première de la couche où le mot a été
     trouvé, dans le chapitre affiché seulement. */
  const matchActif = useMemo(() => {
    if (!resultat || !requete) return null
    if (resultat.entry.chapterN !== chapter) return null
    const couche = layerWithMatch(resultat.entry.layers, requete)
    return couche ? `${couche.layer}:0` : null
  }, [resultat, requete, chapter])

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
          <SearchRailButton
            ref={boutonRecherche}
            open={rechercheOpen}
            onToggle={() => setPanneau(rechercheOpen ? null : 'recherche')}
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

        {/* La recherche se colle sous l'en-tête de l'œuvre : le texte passe
            dessous, il ne saute pas. */}
        <SearchBar
          open={rechercheOpen}
          cle={cleIndexTexte}
          results={resultats}
          active={resultatActif}
          query={requete}
          onQueryChange={setRequete}
          onActiveChange={setResultatActif}
          onClose={fermerRecherche}
          onGoToVerse={allerAuResultat}
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
                  query={requete}
                  activeMatchId={matchActif}
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
