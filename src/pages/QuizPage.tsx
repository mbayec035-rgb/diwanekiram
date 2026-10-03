/* =========================================================
   Quiz : compléter la fin d'un verset ou deviner l'œuvre.
   ========================================================= */

import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Check,
  GraduationCap,
  RefreshCw,
  Trophy,
  X,
} from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { loadCatalog, loadStudyVerses } from '../services/library'
import { buildQuiz, scoreAnswer, type QuizMode } from '../services/quiz'
import { Reveal } from '../components/motion/Reveal'
import { Badge, EmptyState, ErrorState, Skeleton } from '../components/ui/Bits'
import { Button } from '../components/ui/Button'
import { useSettings } from '../store/useSettings'

const QUESTION_COUNT = 10

const MODES: { value: QuizMode; label: string; hint: string }[] = [
  {
    value: 'suite',
    label: 'Compléter le verset',
    hint: 'L’amorce du verset est affichée : choisissez l’œuvre à laquelle appartient la suite.',
  },
  {
    value: 'auteur',
    label: 'Deviner l’œuvre',
    hint: 'Le verset complet est affiché : identifiez l’œuvre dont il est extrait.',
  },
]

export function QuizPage() {
  const [params] = useSearchParams()
  const slug = params.get('xassida') ?? ''
  const [mode, setMode] = useState<QuizMode>('suite')
  const [round, setRound] = useState(0)

  const { data: catalog, error: catalogError, reload } = useAsync(loadCatalog, [])
  const item = catalog?.itemsBySlug.get(slug)
  const xassida = catalog?.xassidas.find((entry) => entry.slug === slug)
  const author = xassida ? catalog?.authorsById.get(xassida.authorId) : undefined
  const settings = useSettings()

  const { data: verses, error: versesError, loading, reload: reloadVerses } = useAsync(
    () => (item && xassida ? loadStudyVerses(item, xassida, author) : Promise.resolve([])),
    [item?.file, xassida?.id],
  )

  const questions = useMemo(
    () => buildQuiz(verses ?? [], { count: QUESTION_COUNT, mode, random: Math.random }),
    // `round` relance une nouvelle série à mode identique.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [verses, mode, round],
  )

  const [step, setStep] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const question = questions[step] ?? null
  const answered = picked !== null
  const correct = answered && question ? scoreAnswer(question, picked) : false

  const restart = (nextMode: QuizMode = mode) => {
    setStep(0)
    setPicked(null)
    setScore(0)
    setFinished(false)
    setRound((value) => value + 1)
    if (nextMode !== mode) setMode(nextMode)
  }

  const pick = (option: string) => {
    if (answered || !question) return
    setPicked(option)
    if (scoreAnswer(question, option)) setScore((value) => value + 1)
  }

  const next = () => {
    if (step + 1 >= questions.length) {
      setFinished(true)
      return
    }
    setStep((value) => value + 1)
    setPicked(null)
  }

  if (catalogError) return <ErrorState message={catalogError.message} onRetry={reload} />

  if (!slug) {
    return (
      <EmptyState
        icon={<GraduationCap size={22} />}
        title="Choisissez une œuvre"
        description="Le quiz porte sur une xassida : ouvrez-en une depuis la bibliothèque pour lancer l’entraînement."
        action={{ to: '/bibliotheque', label: 'Ouvrir la bibliothèque' }}
      />
    )
  }

  if (loading) {
    return (
      <div className="page-stack">
        <Skeleton height={40} radius={14} width="35%" />
        <Skeleton height={280} radius={22} />
      </div>
    )
  }

  if (versesError) return <ErrorState message={versesError.message} onRetry={reloadVerses} />

  if (!xassida) {
    return (
      <EmptyState
        icon={<BookOpen size={22} />}
        title="Œuvre introuvable"
        description="Cette xassida n'existe pas ou n'est plus référencée dans le catalogue."
        action={{ to: '/bibliotheque', label: 'Ouvrir la bibliothèque' }}
      />
    )
  }

  if (questions.length === 0) {
    return (
      <EmptyState
        icon={<GraduationCap size={22} />}
        title="Quiz indisponible"
        description="Cette œuvre ne contient pas assez de versets exploitables pour construire une série."
        action={{ to: `/apprentissage/${xassida.slug}`, label: 'Apprendre vers par vers' }}
      />
    )
  }

  return (
    <div className="page-stack">
      <Reveal>
        <header className="page-head">
          <p className="eyebrow">Quiz · {xassida.name}</p>
          <h1>{finished ? 'Résultat' : 'Testez votre mémoire'}</h1>
          <p className="muted">
            {author ? `${author.name} · ${author.tarihaLabel}` : 'Auteur inconnu'}
            {!finished ? ` · question ${step + 1} sur ${questions.length}` : ''}
          </p>
        </header>
      </Reveal>

      <Reveal delay={0.04}>
        <div className="quiz-modes">
          {MODES.map((entry) => (
            <button
              key={entry.value}
              type="button"
              className={`quiz-mode${mode === entry.value ? ' is-active' : ''}`}
              onClick={() => restart(entry.value)}
              aria-pressed={mode === entry.value}
            >
              <strong>{entry.label}</strong>
              <span className="muted small">{entry.hint}</span>
            </button>
          ))}
        </div>
      </Reveal>

      {finished ? (
        <Reveal delay={0.08}>
          <section className="quiz-result">
            <Trophy size={26} aria-hidden="true" />
            <p className="quiz-result-score">
              {score} / {questions.length}
            </p>
            <p className="muted">
              {score === questions.length
                ? 'Sans faute : ce corpus n’a plus de secret pour vous.'
                : score >= questions.length / 2
                  ? 'Bonne maîtrise. Reprenez les versets manqués pour consolider.'
                  : 'Reprenez le mode apprentissage vers par vers, puis retentez le quiz.'}
            </p>
            <div className="panel-actions">
              <Button variant="primary" size="md" icon={<RefreshCw size={16} />} onClick={() => restart()}>
                Rejouer
              </Button>
              <Link className="button button--ghost button--md" to={`/apprentissage/${xassida.slug}`}>
                <ArrowRight size={16} /> Revenir à l’apprentissage
              </Link>
            </div>
          </section>
        </Reveal>
      ) : (
        <Reveal delay={0.08}>
            <section
              key={question?.id}
              className="quiz-card"
            >
              {question ? (
                <>
                  <Badge tone="cyan">{question.prompt}</Badge>

                  <p
                    className="quiz-verse"
                    lang="ar"
                    dir="rtl"
                    style={{
                      fontFamily:
                        settings.arabicFont === 'naskh' ? 'var(--font-arabic-alt)' : 'var(--font-arabic)',
                    }}
                  >
                    {question.prefix}
                    {question.mode === 'suite' ? <span className="quiz-ellipsis"> …</span> : null}
                  </p>

                  <ul className="quiz-options">
                    {question.options.map((option) => {
                      const isPicked = picked === option
                      const isAnswer = option === question.answer
                      const state = !answered
                        ? ''
                        : isAnswer
                          ? ' is-correct'
                          : isPicked
                            ? ' is-wrong'
                            : ''
                      return (
                        <li key={option}>
                          <button
                            type="button"
                            className={`quiz-option${state}`}
                            onClick={() => pick(option)}
                            disabled={answered}
                            aria-pressed={isPicked}
                          >
                            {option}
                            {answered && isAnswer ? <Check size={16} aria-hidden="true" /> : null}
                            {answered && isPicked && !isAnswer ? (
                              <X size={16} aria-hidden="true" />
                            ) : null}
                          </button>
                        </li>
                      )
                    })}
                  </ul>

                  {answered ? (
                    <p className={`quiz-feedback${correct ? ' is-correct' : ' is-wrong'}`}>
                      {correct ? 'Bonne réponse.' : null}
                      {!correct && question.mode === 'suite'
                        ? `Réponse attendue : ${question.answer} (${question.answerName}).`
                        : null}
                      {!correct && question.mode === 'auteur'
                        ? `Ce verset appartient à « ${question.answerName} ».`
                        : null}
                      {question.verse.fr ? ` ${question.verse.fr}` : ''}
                    </p>
                  ) : null}

                  <div className="panel-actions">
                    <Button
                      variant="primary"
                      size="md"
                      disabled={!answered}
                      onClick={next}
                    >
                      {step + 1 >= questions.length ? 'Voir le résultat' : 'Question suivante'}
                    </Button>
                    {answered ? (
                      <span className="muted small">Score : {score}</span>
                    ) : null}
                  </div>
                </>
              ) : null}
            </section>
        </Reveal>
      )}
    </div>
  )
}