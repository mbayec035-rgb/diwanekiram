/* Accueil : héros, reprise de lecture, auteurs, sélection, fonctionnalités. */

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Sparkles,
  WifiOff,
  Type,
  SlidersHorizontal,
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

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Un catalogue complet',
    body: "L'intégralité des xassidas du corpus, chapters et versets compris, consultable entièrement hors ligne.",
  },
  {
    icon: Type,
    title: 'Trois couches de lecture',
    body: 'Texte arabe vocalisé, transcription latine et traduction française, activables séparément.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Confort de lecture',
    body: 'Police et taille réglables couche par couche, reprise exacte au dernier verset lu.',
  },
  {
    icon: WifiOff,
    title: 'Application installable',
    body: 'Le catalogue est mis en cache : la lecture reste possible sans connexion.',
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
        <motion.p
          className="eyebrow"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="eyebrow-dot" aria-hidden="true" />
          Bibliothèque de poésie dévotionnelle
        </motion.p>

        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 22, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        >
          Diwane<span className="text-grad">Kiram</span>
        </motion.h1>

        <motion.p
          className="hero-arabic"
          lang="ar"
          dir="rtl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.2 }}
        >
          ديوان كرام
        </motion.p>

        <motion.p
          className="hero-sub"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24 }}
        >
          Lisez et annotez vos xassidas favorites en arabe vocalisé, en transcription et en traduction
          française, même sans connexion.
        </motion.p>

        <motion.div
          className="hero-actions"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.32 }}
        >
          <Link className="button button--primary button--lg" to="/bibliotheque">
            Commencer à lire
            <ArrowRight size={18} />
          </Link>
          <Link className="button button--ghost button--lg" to="/auteurs">
            Découvrir les auteurs
          </Link>
        </motion.div>
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
        <section className="features">
          <header className="section-head">
            <div>
              <p className="eyebrow">Pourquoi DiwaneKiram</p>
              <h2>Une expérience de lecture complète</h2>
            </div>
          </header>
          <Stagger className="grid grid--features">
            {FEATURES.map((feature) => (
              <StaggerItem key={feature.title}>
                <TiltCard className="feature">
                  <span className="feature-icon">
                    <feature.icon size={20} />
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </TiltCard>
              </StaggerItem>
            ))}
          </Stagger>
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