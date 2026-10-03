/* =========================================================
   Apprentissage : un verset à la fois, avec ses couches
   de lecture et un jalon à chaque progression notable.
   ========================================================= */

import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { loadCatalog, loadStudyVerses } from '../services/library'
import { buildStudyPath, studyMilestones } from '../services/quiz'
import { Reveal } from '../components/motion/Reveal'
import { Badge, EmptyState, ErrorState, ProgressBar, Skeleton } from '../components/ui/Bits'
import { Button } from '../components/ui/Button'
import { useSettings } from '../store/useSettings'

export function StudyPage() {
  const { slug = '' } = useParams()
  const { data: catalog, error: catalogError, reload } = useAsync(loadCatalog, [])

  const item = catalog?.itemsBySlug.get(slug)
  const xassida = catalog?.xassidas.find((entry) => entry.slug === slug)
  const author = xassida ? catalog?.authorsById.get(xassida.authorId) : undefined

  const {
    data: verses,
    error: versesError,
    loading,
    reload: reloadVerses,
  } = useAsync(
    () => (item && xassida ? loadStudyVerses(item, xassida, author) : Promise.resolve([])),
    [item?.file, xassida?.id],
  )

  const settings = useSettings()
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const path = useMemo(() => buildStudyPath(verses ?? []), [verses])
  const milestones = useMemo(() => studyMilestones(path.length), [path.length])
  const current = path[index] ?? null
  const percent = path.length === 0 ? 0 : Math.round(((index + 1) / path.length) * 100)

  /* Le jalon courant se déduit du parcours : aucun état supplémentaire. */
  const milestoneReached = milestones.filter((step) => index + 1 >= step).pop() ?? null

  const go = (next: number) => {
    if (next < 0 || next >= path.length) return
    setIndex(next)
    setRevealed(false)
  }

  if (catalogError) return <ErrorState message={catalogError.message} onRetry={reload} />

  if (loading || (versesError === null && verses === null)) {
    return (
      <div className="page-stack">
        <Skeleton height={40} radius={14} width="35%" />
        <Skeleton height={320} radius={22} />
        <Skeleton height={90} radius={18} />
      </div>
    )
  }

  if (versesError) {
    return <ErrorState message={versesError.message} onRetry={reloadVerses} />
  }

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

  if (path.length === 0) {
    return (
      <EmptyState
        icon={<GraduationCap size={22} />}
        title="Parcours indisponible"
        description="Aucun verset de cette œuvre ne peut servir de support d'apprentissage."
        action={{ to: '/bibliotheque', label: 'Choisir une autre œuvre' }}
      />
    )
  }

  const isLast = index === path.length - 1

  return (
    <div className="page-stack">
      <Reveal>
        <Link className="section-link back-link" to={`/xassida/${xassida.slug}`}>
          <ArrowLeft size={15} /> Retour à la lecture
        </Link>
      </Reveal>

      <Reveal delay={0.04}>
        <header className="page-head">
          <p className="eyebrow">Apprentissage vers par vers</p>
          <h1>{xassida.name}</h1>
          <p className="muted">
            {author ? `${author.name} · ${author.tarihaLabel}` : 'Auteur inconnu'} —{' '}
            {current ? `chapitre ${current.chapter}, verset ${current.n}` : ''} ·{' '}
            {index + 1} sur {path.length}
          </p>
          <div className="study-progress">
            <ProgressBar value={percent / 100} label={`Progression ${percent} %`} />
            <span className="study-percent">{percent} %</span>
          </div>
        </header>
      </Reveal>

      <Reveal delay={0.08}>
        <article className="study-card" key={current?.id}>
          {current ? (
            <>
              {settings.showArabic ? (
                <p className="study-arabic" lang="ar" dir="rtl">
                  {current.ar}
                </p>
              ) : (
                <p className="muted">Le texte arabe est masqué dans les réglages.</p>
              )}

              <div className="study-reveal">
                <Button
                  variant="outline"
                  size="sm"
                  icon={revealed ? <EyeOff size={15} /> : <Eye size={15} />}
                  onClick={() => setRevealed((value) => !value)}
                >
                  {revealed ? 'Masquer les aides' : 'Afficher les aides'}
                </Button>
                <span className="muted small">
                  Lisez d’abord l’arabe, puis utilisez la transcription et la traduction pour
                  vérifier votre compréhension.
                </span>
              </div>

              {revealed ? (
                <div className="study-hints">
                  {settings.showTranscription && current.tr ? (
                    <p className="study-hint" lang="ar-Latn" dir="ltr">
                      <strong>Transcription</strong>
                      <span>{current.tr}</span>
                    </p>
                  ) : null}
                  {settings.showTranslation && current.fr ? (
                    <p className="study-hint">
                      <strong>Traduction</strong>
                      <span>{current.fr}</span>
                    </p>
                  ) : null}
                  {!current.fr ? (
                    <p className="study-hint study-hint--empty">
                      <strong>Traduction</strong>
                      <span>Ce verset n’a pas encore de traduction française.</span>
                    </p>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}
        </article>
      </Reveal>

      <Reveal delay={0.12}>
        <div className="study-controls">
          <Button
            variant="ghost"
            size="md"
            icon={<ArrowLeft size={16} />}
            disabled={index === 0}
            onClick={() => go(index - 1)}
          >
            Verset précédent
          </Button>

          {isLast ? (
            <Button
              variant="primary"
              size="md"
              icon={<RotateCcw size={16} />}
              onClick={() => go(0)}
            >
              Recommencer
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={() => go(index + 1)}
            >
              Verset suivant
            </Button>
          )}
        </div>
      </Reveal>

      {milestoneReached !== null ? (
        <Reveal delay={0.16}>
          <div className="study-milestones">
            <Badge tone="mint">
              <Sparkles size={12} aria-hidden="true" /> Jalon atteint
            </Badge>
            <span className="muted small">
              {milestoneReached} verset{milestoneReached > 1 ? 's' : ''} parcourus sur {path.length}.
            </span>
          </div>
        </Reveal>
      ) : null}

      <Reveal delay={0.2}>
        <section className="study-next">
          <h2>Poursuivre ailleurs</h2>
          <div className="study-next-links">
            <Link className="button button--ghost button--md" to={`/xassida/${xassida.slug}?v=${current?.id ?? ''}`}>
              <BookOpen size={16} /> Ouvrir dans le lecteur
            </Link>
            <Link className="button button--ghost button--md" to={`/quiz?xassida=${xassida.slug}`}>
              <Check size={16} /> Tester mes connaissances
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  )
}