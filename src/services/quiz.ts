/* =========================================================
   Apprentissage et quiz — logique pure et testable.
   Aucun accès réseau ici : les versets sont fournis par
   l'appelant, ce qui garde les règles de jeu vérifiables.
   ========================================================= */

import { normalizeArabic } from './search'

export interface StudyVerse {
  id: string
  slug: string
  xassidaName: string
  authorName: string
  chapter: number
  n: number
  ar: string
  tr: string
  fr: string
}

/* ------------------------------------------------------------------ *
 * Apprentissage vers par vers
 * ------------------------------------------------------------------ */

/** Un verset est Apprentissable s'il porte assez de matière (arabe ou latin). */
export function isStudyable(verse: StudyVerse): boolean {
  return verse.ar.trim().length > 0 && (verse.tr.trim().length > 0 || verse.fr.trim().length > 0)
}

/**
 * Construit un parcours d'apprentissage : progression vers par vers,
 * en alternant les chapitres quand la xassida en compte plusieurs.
 */
export function buildStudyPath(verses: StudyVerse[]): StudyVerse[] {
  const usable = verses.filter(isStudyable)

  const byChapter = new Map<number, StudyVerse[]>()
  for (const verse of usable) {
    const list = byChapter.get(verse.chapter)
    if (list) list.push(verse)
    else byChapter.set(verse.chapter, [verse])
  }

  const chapters = [...byChapter.keys()].sort((a, b) => a - b)
  for (const list of byChapter.values()) list.sort((a, b) => a.n - b.n)

  /* Entrelacement des chapitres : évite les longues suites monotones
     tout en conservant l'ordre alphabétique des numéros de verset. */
  const path: StudyVerse[] = []
  const cursors = new Map(chapters.map((chapter) => [chapter, 0]))
  let remaining = usable.length

  while (remaining > 0) {
    let progressed = false
    for (const chapter of chapters) {
      const cursor = cursors.get(chapter) ?? 0
      const list = byChapter.get(chapter) ?? []
      const verse = list[cursor]
      if (!verse) continue
      path.push(verse)
      cursors.set(chapter, cursor + 1)
      remaining -= 1
      progressed = true
    }
    if (!progressed) break
  }

  return path
}

/** Indices des jalons à partager pendant le parcours (10 %, 25 %, 50 %…). */
export function studyMilestones(total: number): number[] {
  if (total < 4) return []
  return [0.1, 0.25, 0.5, 0.75].map((ratio) => Math.max(1, Math.round(total * ratio)))
}

/* ------------------------------------------------------------------ *
 * Quiz
 * ------------------------------------------------------------------ */

export type QuizMode = 'suite' | 'auteur'

export interface QuizQuestion {
  id: string
  mode: QuizMode
  verse: StudyVerse
  prompt: string
  /** Amorce affichée à l'écran : début du verset, ou texte intégral. */
  prefix: string
  /** Œuvre à laquelle appartient le verset. */
  answerName: string
  /** Proposition attendue : la fin du verset ou le nom de l'œuvre. */
  answer: string
  options: string[]
}

export interface QuizOptions {
  count?: number
  mode?: QuizMode
  /** Injecté pour rendre les séries reproductibles (tests). */
  random?: () => number
}

const SUITE_MIN_WORDS = 4

/** Nombre de mots d'un texte, en ignorant la ponctuation. */
function wordCount(text: string): number {
  return text
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean).length
}

/** Découpe un texte arabe en deux moitiés, jamais trop courtes d'un côté. */
export function splitForCompletion(text: string, ratio = 0.55) {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length < SUITE_MIN_WORDS) return null

  const cut = Math.min(words.length - 2, Math.max(2, Math.round(words.length * ratio)))

  return {
    prefix: words.slice(0, cut).join(' '),
    suffix: words.slice(cut).join(' '),
  }
}

function shuffle<T>(values: T[], random: () => number): T[] {
  const copy = [...values]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}



/** Propositions incorrectes pour le mode « suite » : fins d'autres versets. */
function wrongSuffixes(
  verse: StudyVerse,
  verses: StudyVerse[],
  pool: number,
  random: () => number,
): string[] {
  const candidates: string[] = []
  for (const item of shuffle(verses, random)) {
    if (item.id === verse.id) continue
    const parts = splitForCompletion(item.ar)
    if (parts) candidates.push(parts.suffix)
  }
  return [...new Set(candidates)].slice(0, pool)
}

/** Propositions incorrectes pour le mode « auteur » : autres œuvres du corpus. */
function wrongWorks(
  verse: StudyVerse,
  verses: StudyVerse[],
  pool: number,
  random: () => number,
): string[] {
  const candidates = shuffle(
    verses.filter((item) => item.slug !== verse.slug).map((item) => item.xassidaName),
    random,
  )
  return [...new Set(candidates)].slice(0, pool)
}

export function buildQuiz(
  verses: StudyVerse[],
  options: QuizOptions = {},
): QuizQuestion[] {
  const { count = 10, mode = 'suite', random = Math.random } = options

  const usable = verses.filter((verse) => isStudyable(verse) && wordCount(verse.ar) >= SUITE_MIN_WORDS)
  const chosen = shuffle(usable, random).slice(0, Math.min(count, usable.length))
  const WRONG_POOL = 3

  return chosen
    .map<QuizQuestion | null>((verse) => {
      if (mode === 'suite') {
        const parts = splitForCompletion(verse.ar)
        if (!parts) return null

        const wrong = wrongSuffixes(verse, verses, WRONG_POOL, random)
        if (wrong.length < 2) return null

        return {
          id: `${mode}-${verse.id}`,
          mode,
          verse,
          prompt: 'Complétez la fin de ce verset.',
          prefix: parts.prefix,
          answerName: verse.xassidaName,
          answer: parts.suffix,
          options: shuffle([parts.suffix, ...wrong], random),
        }
      }

      const wrong = wrongWorks(verse, verses, WRONG_POOL, random)
      if (wrong.length < 2) return null

      return {
        id: `${mode}-${verse.id}`,
        mode,
        verse,
        prompt: 'De quelle œuvre provient ce verset ?',
        prefix: verse.ar,
        answerName: verse.xassidaName,
        answer: verse.xassidaName,
        options: shuffle([verse.xassidaName, ...wrong], random),
      }
    })
    .filter((question): question is QuizQuestion => question !== null)
}

/** Correspondance souple : ponctuation, casse et espaces ignorés. */
export function normalizeAnswer(value: string): string {
  return normalizeArabic(value).replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()
}

export function scoreAnswer(question: QuizQuestion, given: string | null): boolean {
  if (!given) return false
  return normalizeAnswer(given) === normalizeAnswer(question.answer)
}