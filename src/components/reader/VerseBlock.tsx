/* Un verset : arabe vocalisé, transcription, traduction. */

import { memo } from 'react'
import type { CSSProperties } from 'react'
import { Languages, Type as TypeIcon } from 'lucide-react'
import type { Verse } from '../../types/domain'

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
}: VerseBlockProps) {
  /* La transcription et la traduction sont deux couches distinctes :
     la transcription ne doit jamais servir de repli à la traduction.
     Un verset sans traduction est simplement omis, sans marqueur. */
  const translated = translation?.trim() ? translation : ''

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
        verse.sadr || verse.adj ? (
          /* Deux hémistiches sur deux colonnes : le vers garde sa forme
             d'origine. `ar` reste la source de vérité pour les autres usages. */
          <p
            className={`verse-arabic verse-arabic--couplet verse-arabic--${font}`}
            lang="ar"
            dir="rtl"
          >
            {verse.sadr ? <span className="verse-couplet">{verse.sadr}</span> : null}
            {verse.adj ? <span className="verse-couplet">{verse.adj}</span> : null}
          </p>
        ) : (
          <p className={`verse-arabic verse-arabic--${font}`} lang="ar" dir="rtl">
            {verse.ar}
          </p>
        )
      ) : null}

      {showTranscription ? (
        <p className="verse-transcription" lang="ar-Latn" dir="ltr">
          <TypeIcon size={13} aria-hidden="true" /> {verse.tr}
        </p>
      ) : null}

      {translated && showTranslation ? (
        <p className="verse-translation">
          <Languages size={13} aria-hidden="true" /> {translated}
        </p>
      ) : null}
    </article>
  )
}

export const MemoVerseBlock = memo(VerseBlock)