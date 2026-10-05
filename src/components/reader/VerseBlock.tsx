/* Un verset : arabe vocalisé, transcription, traduction.

   En recherche, chaque bloc de texte est découpé autour des occurrences et
   rendu en `<mark>` : le découpage vient de `services/textSearch`, qui connaît
   le texte d'origine et ses positions normalisées. Sans lui, un mot vocalisé
   serait cherché sans ses voyelles mais surligné aux mauvais endroits.

   Les deux hémistiches sont deux blocs distincts : le découpage les garde
   séparés, sinon le texte arabe s'afficherait deux fois. */

import { memo } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Languages, Type as TypeIcon } from 'lucide-react'
import type { Verse } from '../../types/domain'
import { segmentBlocks } from '../../services/textSearch'
import type { SearchLayer, SearchSegment } from '../../services/textSearch'

/** Un morceau de texte rendu à un endroit précis de la ligne. */
type Bloc = 'sadr' | 'adj' | 'transcription' | 'traduction'

interface BlocDeTexte {
  cle: Bloc
  layer: SearchLayer
  text: string
}

interface VerseBlockProps {
  verse: Verse
  translation?: string
  chapterNumber: number
  showArabic: boolean
  showTranscription: boolean
  showTranslation: boolean
  active: boolean
  arabicScale: number
  transcriptionScale: number
  translationScale: number
  font: 'amiri' | 'naskh'
  /** Requête de recherche : vide tant que la recherche est fermée. */
  query: string
  /** Identifiant de l'occurrence à colorer plus fort, s'il y en a une. */
  activeMatchId: string | null
}

function VerseBlock({
  verse,
  translation,
  chapterNumber,
  showArabic,
  showTranscription,
  showTranslation,
  active,
  arabicScale,
  transcriptionScale,
  translationScale,
  font,
  query,
  activeMatchId,
}: VerseBlockProps) {
  /* La transcription et la traduction sont deux couches distinctes :
     la transcription ne doit jamais servir de repli à la traduction.
     Un verset sans traduction est simplement omis, sans marqueur. */
  const translated = translation?.trim() ? translation : ''

  const blocs = listeBlocs(verse, translated, showArabic, showTranscription, showTranslation)
  const parties = query ? segmentBlocks(blocs, query) : []

  /* Un rendu par bloc, retrouvé par son nom : l'ordre du JSX peut changer,
     l'association, non. */
  const rendu = new Map<Bloc, ReactNode>()
  blocs.forEach((bloc, i) => {
    rendu.set(bloc.cle, query ? <Segments segments={parties[i]} activeId={activeMatchId} /> : bloc.text)
  })

  const sadr = verse.sadr || verse.adj

  return (
    <article
      id={`verse-${verse.id}`}
      data-verse-id={verse.id}
      className={`verse${active ? ' is-active' : ''}`}
      style={
        {
          '--verse-arabic-scale': arabicScale,
          '--verse-transcription-scale': transcriptionScale,
          '--verse-translation-scale': translationScale,
        } as CSSProperties
      }
    >
      <span className="verse-ref" aria-hidden="true">
        {chapterNumber > 1 ? `${chapterNumber}.` : ''}
        {verse.n}
      </span>

      {showArabic ? (
        sadr ? (
          /* Deux hémistiches sur deux colonnes : le vers garde sa forme
             d'origine. `ar` reste la source de vérité pour les autres usages. */
          <p
            className={`verse-arabic verse-arabic--couplet verse-arabic--${font}`}
            lang="ar"
            dir="rtl"
          >
            {verse.sadr ? <span className="verse-couplet">{rendu.get('sadr')}</span> : null}
            {verse.adj ? <span className="verse-couplet">{rendu.get('adj')}</span> : null}
          </p>
        ) : (
          <p className={`verse-arabic verse-arabic--${font}`} lang="ar" dir="rtl">
            {rendu.get('sadr')}
          </p>
        )
      ) : null}

      {showTranscription && verse.tr.trim().length > 0 ? (
        <p className="verse-transcription" lang="ar-Latn" dir="ltr">
          <TypeIcon size={13} aria-hidden="true" /> {rendu.get('transcription')}
        </p>
      ) : null}

      {translated && showTranslation ? (
        <p className="verse-translation">
          <Languages size={13} aria-hidden="true" /> {rendu.get('traduction')}
        </p>
      ) : null}
    </article>
  )
}

/** Un bloc découpé : du texte, puis la ou les occurrences trouvées. */
function Segments({ segments, activeId }: { segments: SearchSegment[]; activeId: string | null }) {
  return (
    <>
      {segments.map((segment, i) =>
        segment.id === null ? (
          <span key={i}>{segment.text}</span>
        ) : (
          <mark key={i} className={`verse-mark${segment.id === activeId ? ' is-active' : ''}`}>
            {segment.text}
          </mark>
        ),
      )}
    </>
  )
}

/**
 * Les blocs affichables, dans l'ordre où le lecteur les rend. Un vers sans
 * hémistiches n'a qu'un seul bloc arabe, alimenté par `ar`.
 */
function listeBlocs(
  verse: Verse,
  translated: string,
  showArabic: boolean,
  showTranscription: boolean,
  showTranslation: boolean,
): BlocDeTexte[] {
  const blocs: BlocDeTexte[] = []

  if (showArabic) {
    if (verse.sadr) blocs.push({ cle: 'sadr', layer: 'arabe', text: verse.sadr })
    if (verse.adj) blocs.push({ cle: 'adj', layer: 'arabe', text: verse.adj })
    if (!verse.sadr && !verse.adj && verse.ar) blocs.push({ cle: 'sadr', layer: 'arabe', text: verse.ar })
  }

  if (showTranscription && verse.tr.trim()) {
    blocs.push({ cle: 'transcription', layer: 'transcription', text: verse.tr })
  }

  if (showTranslation && translated) {
    blocs.push({ cle: 'traduction', layer: 'traduction', text: translated })
  }

  return blocs
}

export const MemoVerseBlock = memo(VerseBlock)