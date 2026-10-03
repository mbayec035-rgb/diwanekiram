/* Accueil : héros, reprise de lecture, auteurs, sélection, fonctionnalités. */

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  GraduationCap,
  HelpCircle,
  Layers,
  ListChecks,
  BookHeart,
  Quote,
  BookOpen,
} from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { loadCatalog } from '../services/library'
import { useLibrary, lastReadSlug } from '../store/useLibrary'
import { Reveal, Stagger, StaggerItem } from '../components/motion/Reveal'
import { TiltCard } from '../components/motion/TiltCard'
import { XassidaCard } from '../components/library/XassidaCard'
import { Avatar, Badge, ErrorState, Skeleton } from '../components/ui/Bits'

const PRACTICE = (corpusSize: number | null) => [
  {
    icon: ListChecks,
    title: 'Apprentissage vers par vers',
    body: 'Parcourez le texte un verset à la fois, avec la transcription et la traduction masquées pour tester votre mémorisation.',
  },
  {
    icon: HelpCircle,
    title: 'Deux modes de quiz',
    body: corpusSize
      ? `Complétez la fin d'un verset ou devinez l'œuvre dont il provient, sur les ${corpusSize} xassidas du corpus.`
      : "Complétez la fin d'un verset ou devinez l'œuvre dont il provient.",
  },
  {
    icon: Layers,
    title: 'Aides réglables',
    body: 'Les couches d’aide restent celles de la lecture : arabe, transcription et traduction, activables séparément.',
  },
]

export function HomePage() {
  const { data: catalog, error, loading, reload } = useAsync(loadCatalog, [])
  const progress = useLibrary((state) => state.progress)
  const resumeSlug = lastReadSlug(useLibrary.getState())

  const featured = (catalog?.xassidas ?? []).slice(0, 8)

  /* Les auteurs avec notice sont mis en avant sur l'accueil,
     avec un accès direct à quelques-unes de leurs œuvres. */
  const highlightedAuthors = (catalog?.authors ?? [])
    .filter((author) => author.bio && !author.anonymous)
    .sort((a, b) => b.xassidaCount - a.xassidaCount || a.name.localeCompare(b.name, 'fr'))
    .slice(0, 4)

  const worksByAuthor = useMemo(() => {
    const index = new Map<string, typeof featured>()
    for (const xassida of catalog?.xassidas ?? []) {
      const list = index.get(xassida.authorId)
      if (list) list.push(xassida)
    }
    return index
  }, [catalog])

  /* Quelques œuvres proposées pour démarrer immédiatement un parcours. */
  const practiceTargets = (catalog?.xassidas ?? [])
    .slice()
    .sort((a, b) => b.verseCount - a.verseCount || a.name.localeCompare(b.name, 'fr'))
    .slice(0, 5)
    .map((item) => ({
      slug: item.slug,
      name: item.name,
      authorName: catalog?.authorsById.get(item.authorId)?.name ?? 'Auteur inconnu',
    }))

  const resumeXassida = catalog?.xassidas.find((item) => item.slug === resumeSlug)
  const resumeVerseId = resumeSlug ? progress[resumeSlug]?.verseId : undefined
  const resume = resumeXassida
    ? {
        xassida: resumeXassida,
        author: catalog?.authorsById.get(resumeXassida.authorId),
        verseId: resumeVerseId,
      }
    : undefined

  return (
    <div className="page-stack">
      <section className="hero">
        <p className="eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          Bibliothèque de poésie dévotionnelle
        </p>

        <h1 className="hero-title">
          Diwane<span className="text-grad">Kiram</span>
        </h1>

        <p className="hero-arabic" lang="ar" dir="rtl">
          ديوان كرام
        </p>

        <p className="hero-sub">
          Lisez et annotez vos xassidas favorites en arabe vocalisé, en transcription et en traduction
          française, même sans connexion.
        </p>

        <div className="hero-actions">
          <Link className="button button--primary button--lg" to="/bibliotheque">
            Commencer à lire
            <ArrowRight size={18} />
          </Link>
          <Link className="button button--ghost button--lg" to="/auteurs">
            Découvrir les auteurs
          </Link>
        </div>
      </section>

      {error ? <ErrorState message={error.message} onRetry={reload} /> : null}

      <Reveal className="section">
        <section className="section authors-spotlight">
          <header className="section-head">
            <div>
              <p className="eyebrow">Les voix du corpus</p>
              <h2>Les auteurs et leurs biographies</h2>
            </div>
            <Link className="section-link" to="/auteurs">
              Tous les auteurs <ArrowRight size={15} />
            </Link>
          </header>

          {loading ? (
            <div className="grid grid--spotlight">
              {Array.from({ length: 2 }, (_, index) => (
                <Skeleton key={index} height={200} radius={20} />
              ))}
            </div>
          ) : (
            <Stagger className="grid grid--spotlight">
              {highlightedAuthors.map((author) => {
                const authorWorks = (worksByAuthor.get(author.id) ?? []).slice(0, 3)
                return (
                <StaggerItem key={author.id} className="spotlight-item">
                  <Link className="spotlight" to={`/auteurs/${author.slug}`}>
                    <span className="spotlight-quote" aria-hidden="true">
                      <Quote size={16} />
                    </span>
                    <Avatar name={author.name} picture={author.picture} seed={author.id} size={52} />
                    <div className="spotlight-body">
                      <h3>{author.name}</h3>
                      {author.nameAr ? (
                        <p className="spotlight-arabic" lang="ar" dir="rtl">
                          {author.nameAr}
                        </p>
                      ) : null}
                      <p className="spotlight-bio">{author.bio}</p>
                      <p className="spotlight-meta">
                        {author.xassidaCount} œuvre{author.xassidaCount > 1 ? 's' : ''}
                      </p>
                    </div>
                  </Link>

                  {authorWorks.length > 0 ? (
                    <div className="spotlight-works">
                      <span className="spotlight-works-label">Œuvres</span>
                      <ul>
                        {authorWorks.map((xassida) => (
                          <li key={xassida.slug}>
                            <Link to={`/xassida/${xassida.slug}`}>
                              <BookOpen size={13} aria-hidden="true" />
                              <span>{xassida.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </StaggerItem>
                )
              })}
            </Stagger>
          )}
        </section>
      </Reveal>

      {resume ? (
        <Reveal className="section">
          <section className="resume-card">
            <div>
              <Badge tone="mint">Reprendre la lecture</Badge>
              <h2>{resume.xassida.name}</h2>
              <p className="muted">{resume.author?.name ?? 'Auteur inconnu'}</p>
              <Link
                className="button button--primary button--md"
                to={`/xassida/${resume.xassida.slug}${resume.verseId ? `?v=${resume.verseId}` : ''}`}
              >
                Continuer
                <ArrowRight size={16} />
              </Link>
            </div>
            <p className="resume-arabic" lang="ar" dir="rtl" aria-hidden="true">
              {resume.xassida.nameAr}
            </p>
          </section>
        </Reveal>
      ) : null}

      <Reveal className="section">
        <header className="section-head">
          <div>
            <p className="eyebrow">Pour commencer</p>
            <h2>Une sélection du catalogue</h2>
          </div>
          <Link className="section-link" to="/bibliotheque">
            Tout voir <ArrowRight size={15} />
          </Link>
        </header>

        {loading ? (
          <div className="grid grid--cards">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} height={220} radius={18} />
            ))}
          </div>
        ) : (
          <Stagger className="grid grid--cards">
            {featured.map((xassida, index) => (
              <StaggerItem key={xassida.slug}>
                <XassidaCard
                  xassida={xassida}
                  index={index}
                  author={catalog?.authorsById.get(xassida.authorId)}
                />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </Reveal>

      <Reveal className="section">
        <section className="practice">
          <header className="section-head">
            <div>
              <p className="eyebrow">Apprendre et mémoriser</p>
              <h2>Étudiez le corpus vers par vers</h2>
            </div>
          </header>

          <Stagger className="grid grid--features">
            {PRACTICE(catalog?.manifest.totals.xassidas ?? null).map((entry) => (
              <StaggerItem key={entry.title}>
                <TiltCard className="feature">
                  <span className="feature-icon">
                    <entry.icon size={20} />
                  </span>
                  <h3>{entry.title}</h3>
                  <p>{entry.body}</p>
                </TiltCard>
              </StaggerItem>
            ))}
          </Stagger>

          {practiceTargets.length > 0 ? (
            <div className="practice-links">
              <p className="practice-links-label">Choisir une œuvre à pratiquer</p>
              <ul>
                {practiceTargets.map((item) => (
                  <li key={item.slug}>
                    <Link className="practice-link" to={`/apprentissage/${item.slug}`}>
                      <GraduationCap size={15} aria-hidden="true" />
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.authorName}</small>
                      </span>
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                    <Link
                      className="practice-link practice-link--quiz"
                      to={`/quiz?xassida=${item.slug}`}
                      title={`Quiz sur ${item.name}`}
                      aria-label={`Quiz sur ${item.name}`}
                    >
                      <HelpCircle size={15} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </Reveal>

      <Reveal className="section">
        <section className="cta-panel">
          <BookHeart size={26} aria-hidden="true" />
          <h2>Votre bibliothèque vous suit</h2>
          <p className="muted">
            Favoris, historique et position de lecture restent sur cet appareil, jamais perdus.
          </p>
          <Link className="button button--outline button--md" to="/reglages">
            Régler l'application
          </Link>
        </section>
      </Reveal>
    </div>
  )
}