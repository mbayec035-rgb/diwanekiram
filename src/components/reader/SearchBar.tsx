/* Recherche dans le texte de l'œuvre : barre collée en haut de la lecture,
   compteur, navigation d'un résultat à l'autre, et liste de tous les vers
   trouvés.

   Le composant ne connaît pas l'indexation : il reçoit l'index, les résultats
   et les extraits, déjà calculés. La normalisation vit dans
   `services/textSearch` — ici on ne fait que du clavier et du rendu.

   La liste des résultats est un seul et même bloc : un menu déroulant sous la
   barre sur grand écran, une feuille qui remonte du bas sur mobile. Le même
   balisage, deux formes — comme le sommaire des chapitres. */

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, List, Search, X } from 'lucide-react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { IndexEntry } from '../../services/textSearch'

/* Une frappe n'a pas à relancer la recherche : on attend que le mot soit
   écrit. */
const DELAI_SAISIE = 200
const DUREE_FERMETURE = 180

export interface SearchResult {
  entry: IndexEntry
  /** Extrait du vers, centré sur le terme trouvé. */
  excerpt: string
}

interface SearchBarProps {
  open: boolean
  /** Signature des colonnes indexables : elle change quand l'index change. */
  cle: string
  results: SearchResult[]
  /** Position du résultat actif dans `results`, -1 s'il n'y en a pas. */
  active: number
  /** La requête déjà appliquée, retardée par le debounce. */
  query: string
  onQueryChange: (query: string) => void
  onActiveChange: (index: number) => void
  onClose: () => void
  /** Va au vers d'un résultat : le lecteur change de chapitre si besoin. */
  onGoToVerse: (verseId: string) => void
}

export function SearchBar({
  open,
  cle,
  results,
  active,
  query,
  onQueryChange,
  onActiveChange,
  onClose,
  onGoToVerse,
}: SearchBarProps) {
  /* Trois temps : ouverte, fermée, puis disparue — sans quoi la barre ferait
     remonter d'un coup tout le texte du dessous. */
  const [phase, setPhase] = useState<'closed' | 'open' | 'closing'>('closed')
  const [listeOuverte, setListeOuverte] = useState(false)
  const [brut, setBrut] = useState(query)

  const champRef = useRef<HTMLInputElement | null>(null)

  /* L'ouverture et la fermeture viennent d'un clic sur le rail ou d'un Ctrl+F :
     on dérive l'état pendant le rendu, plutôt qu'un effet qui refermerait ce
     que l'utilisateur vient d'ouvrir — ou rouvrirait ce qu'il vient de fermer. */
  if (open && phase === 'closed') {
    setPhase('open')
    setListeOuverte(false)
  }
  if (!open && phase === 'open') {
    setPhase('closing')
    setListeOuverte(false)
  }

  const visible = phase !== 'closed'

  useEffect(() => {
    if (phase !== 'closing') return undefined
    const timer = window.setTimeout(() => setPhase('closed'), DUREE_FERMETURE)
    return () => window.clearTimeout(timer)
  }, [phase])

  /* Le champ prend le focus : on tape tout de suite. */
  useEffect(() => {
    if (phase === 'open') champRef.current?.focus()
  }, [phase])

  /* Les colonnes affichées changent la liste des vers à fouiller : la requête
     ne vaut plus rien, on repart d'un champ vide. On ajuste l'état pendant le
     rendu, au moment où l'index change — pas un rendu plus tard. */
  const [cleVue, setCleVue] = useState(cle)
  if (cleVue !== cle) {
    setCleVue(cle)
    if (brut !== '') setBrut('')
  }

  /* Un seul aller-retour pour la frappe, jamais un calcul à chaque lettre. */
  useEffect(() => {
    const timer = window.setTimeout(() => onQueryChange(brut), DELAI_SAISIE)
    return () => window.clearTimeout(timer)
  }, [brut, onQueryChange])

  const total = results.length
  const enCours = query.trim().length > 0

  /* Naviguer, c'est aller vers : chaque pas demande le déplacement, même dans
     un autre chapitre — le clavier seul doit suffire. */
  const deplacer = useCallback(
    (delta: number) => {
      if (total === 0) return
      const suivant = (active + delta + total) % total
      onActiveChange(suivant)
      onGoToVerse(results[suivant].entry.verseId)
    },
    [active, total, results, onActiveChange, onGoToVerse],
  )

  const suivant = useCallback(() => deplacer(1), [deplacer])
  const precedent = useCallback(() => deplacer(-1), [deplacer])

  /* Entrée et Maj+Entrée : le clavier seul permet de parcourir tous les
     résultats sans quitter le champ. */
  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (event.shiftKey) precedent()
      else suivant()
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }

  const choisir = (i: number) => {
    onActiveChange(i)
    setListeOuverte(false)
    onGoToVerse(results[i].entry.verseId)
  }

  if (!visible) return null

  const compteur = !enCours ? '' : total === 0 ? 'Aucun résultat' : `${active + 1} / ${total}`

  return (
    <div
      className="searchbar-ring"
      data-phase={phase}
      role="search"
      aria-label="Recherche dans le texte"
    >
      <div className="searchbar">
        <Search size={17} aria-hidden="true" className="searchbar-icon" />

        <input
          ref={champRef}
          type="search"
          className="searchbar-input"
          value={brut}
          onChange={(event) => setBrut(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Rechercher un mot ou un vers (bayt)…"
          aria-label="Rechercher un mot ou un vers dans le texte"
          aria-describedby="searchbar-count"
          autoComplete="off"
          spellCheck={false}
        />

        {/* Le compteur est annoncé à chaque frappe. */}
        <span id="searchbar-count" className="searchbar-count" aria-live="polite">
          {compteur || '—'}
        </span>

        <div className="searchbar-nav">
          <button
            type="button"
            className="icon-button icon-button--ghost"
            onClick={precedent}
            disabled={total === 0}
            aria-label="Résultat précédent"
          >
            <ChevronUp size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-button icon-button--ghost"
            onClick={suivant}
            disabled={total === 0}
            aria-label="Résultat suivant"
          >
            <ChevronDown size={16} aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          className={`icon-button icon-button--ghost${listeOuverte ? ' is-active' : ''}`}
          onClick={() => setListeOuverte((ouverte) => !ouverte)}
          disabled={total === 0}
          aria-expanded={listeOuverte}
          aria-label={`Voir la liste des ${total} résultat${total > 1 ? 's' : ''}`}
          title="Liste des résultats"
        >
          <List size={17} aria-hidden="true" />
        </button>

        <button
          type="button"
          className="icon-button icon-button--ghost"
          onClick={onClose}
          aria-label="Fermer la recherche"
        >
          <X size={17} aria-hidden="true" />
        </button>
      </div>

      {listeOuverte && total > 0 ? (
        <SearchResults
          results={results}
          active={active}
          onPick={choisir}
          onClose={() => setListeOuverte(false)}
        />
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function SearchResults({
  results,
  active,
  onPick,
  onClose,
}: {
  results: SearchResult[]
  active: number
  onPick: (index: number) => void
  onClose: () => void
}) {
  /* Échap referme la liste : elle est au-dessus de la barre. */
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      onClose()
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [onClose])

  return (
    <div className="search-results" role="dialog" aria-label="Liste des résultats">
      <header className="search-results-head">
        <p className="search-results-title">
          {results.length} résultat{results.length > 1 ? 's' : ''}
        </p>
        <button
          type="button"
          className="icon-button icon-button--ghost"
          onClick={onClose}
          aria-label="Fermer la liste des résultats"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </header>

      <ul className="search-results-list">
        {results.map((result, i) => {
          const { entry } = result
          return (
            <li key={entry.verseId}>
              <button
                type="button"
                className={`search-result${i === active ? ' is-active' : ''}`}
                onClick={() => onPick(i)}
                aria-current={i === active ? 'true' : undefined}
              >
                <span className="search-result-ref">
                  {entry.chapterN > 1 ? `${entry.chapterN}.${entry.verseN}` : `${entry.verseN}`}
                </span>
                <span className="search-result-excerpt">{result.excerpt}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}