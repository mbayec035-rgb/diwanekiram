/* Fiche d'un auteur : notice biographique et toutes ses œuvres. */

import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Search } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { loadCatalog } from '../services/library'
import { Reveal, Stagger, StaggerItem } from '../components/motion/Reveal'
import { XassidaCard } from '../components/library/XassidaCard'
import { Avatar, Badge, EmptyState, ErrorState, Skeleton } from '../components/ui/Bits'

export function AuthorPage() {
  const { slug = '' } = useParams()
  const { data: catalog, error, loading, reload } = useAsync(loadCatalog, [])

  const author = catalog?.authors.find((entry) => entry.slug === slug)

  const works = useMemo(
    () =>
      (catalog?.xassidas ?? [])
        .filter((xassida) => xassida.authorId === author?.id)
        .sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    [catalog, author],
  )

  const totalVerses = works.reduce((sum, xassida) => sum + xassida.verseCount, 0)
  const totalTranslated = works.reduce((sum, xassida) => sum + xassida.translatedCount, 0)

  /* Le crédit n'apparaît que pour une photo dont on connaît la source. */
  const credit = useMemo(() => {
    const source = author?.photoSource
    if (!author?.picture || !source) return null

    if (source.provider === 'wikimedia') {
      return {
        href: source.licenceUrl || source.page,
        label: source.author && source.author !== 'Auteur non précisé' ? source.author : source.page,
        traite: source.license ? `Licence ${source.license}` : null,
      }
    }

    if (source.provider === 'local') {
      /* Image fournie à la main : on ne peut attribuer ni lien, ni licence.
         Avertir serait honnête, inventer une source ne le serait pas. */
      return { href: null, label: 'origine non précisée', traite: null }
    }

    return { href: source.page, label: 'Markazulfuhum', traite: null }
  }, [author])

  if (error) return <ErrorState message={error.message} onRetry={reload} />

  if (loading) {
    return (
      <div className="page-stack">
        <Skeleton height={40} radius={14} width="30%" />
        <Skeleton height={140} radius={20} />
        <div className="grid grid--cards">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} height={220} radius={18} />
          ))}
        </div>
      </div>
    )
  }

  if (!author) {
    return (
      <EmptyState
        icon={<Search size={22} />}
        title="Auteur introuvable"
        description="Cette fiche n’existe pas ou n’est plus référencée dans le catalogue."
        action={{ to: '/auteurs', label: 'Voir tous les auteurs' }}
      />
    )
  }

  return (
    <div className="page-stack">
      <Reveal>
        <Link className="section-link back-link" to="/auteurs">
          <ArrowLeft size={15} /> Tous les auteurs
        </Link>
      </Reveal>

      <Reveal delay={0.04}>
        <section className="author-hero">
          <Avatar name={author.name} picture={author.picture} seed={author.id} size={84} />
          <div className="author-hero-body">
            <p className="eyebrow">{author.tarihaLabel}</p>
            <h1 className="author-name">{author.name}</h1>
            {author.nameAr ? (
              <p className="author-name-ar" lang="ar" dir="rtl">
                {author.nameAr}
              </p>
            ) : null}

            <div className="acard-stats">
              <Badge tone="cyan">
                {works.length} œuvre{works.length > 1 ? 's' : ''}
              </Badge>
              <Badge tone={totalVerses > 0 && totalTranslated === totalVerses ? 'mint' : 'warn'}>
                Traduction {totalVerses > 0 ? Math.round((totalTranslated / totalVerses) * 100) : 0} %
              </Badge>
              {author.anonymous ? <Badge tone="muted">Auteur inconnu</Badge> : null}
            </div>

            {author.bio ? (
              <p className="author-bio">{author.bio}</p>
            ) : (
              <p className="author-bio author-bio--empty">
                Aucune notice n’est publiée pour cette entrée : les textes sont consultables, mais
                leur attribution reste incertaine.
              </p>
            )}

            {credit ? (
              /* Crédit discret : la provenance d'une photo reste accessible sans
                 voler la place à la notice. */
              <p className="author-credit">
                Portrait :{' '}
                {credit.href ? (
                  <a href={credit.href} target="_blank" rel="noreferrer noopener">
                    {credit.label}
                  </a>
                ) : (
                  credit.label
                )}
                {credit.traite ? `. ${credit.traite}` : null}
              </p>
            ) : null}
          </div>
        </section>
      </Reveal>

      <Reveal className="section">
        <header className="section-head">
          <div>
            <p className="eyebrow">Œuvres</p>
            <h2>Toutes les xassidas de cet auteur</h2>
          </div>
        </header>

        {works.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={22} />}
            title="Aucune œuvre rattachée"
            description="Cette entrée ne porte encore aucune xassida dans le catalogue."
          />
        ) : (
          <Stagger className="grid grid--cards">
            {works.map((xassida, index) => (
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
    </div>
  )
}