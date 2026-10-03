/* À propos : présentation, catalogue, accessibilité, raccourcis. */

import { useAsync } from '../hooks/useAsync'
import { loadCatalog } from '../services/library'
import { CountUpText } from '../components/motion/Feedback'
import { Reveal, Stagger, StaggerItem } from '../components/motion/Reveal'
import { TiltCard } from '../components/motion/TiltCard'
import { ErrorState } from '../components/ui/Bits'
import { Logo } from '../components/layout/Logo'

const PILLARS = [
  {
    title: 'Un catalogue figé et fiable',
    body: 'Le texte est stocké dans l’application : aucune coupure réseau, aucune recherche qui échoue.',
  },
  {
    title: 'La lecture avant tout',
    body: 'Une seule colonne aérée, un verset actif mis en évidence, et la reprise là où vous vous êtes arrêté.',
  },
  {
    title: 'Un respect du texte',
    body: 'Arabe vocalisé, transcription latine et traduction française présentés côte à côte, sans jamais masquer l’original.',
  },
  {
    title: 'Légère et rapide',
    body: 'Chaque xassida n’est chargée que lorsqu’elle est ouverte, puis conservée en cache pour les lectures suivantes.',
  },
]

const SHORTCUTS = [
  { keys: '/', action: 'Aller à la recherche' },
  { keys: 'J / ↓', action: 'Verset suivant' },
  { keys: 'K / ↑', action: 'Verset précédent' },
]

export function AboutPage() {
  const { data: catalog, error, reload } = useAsync(loadCatalog, [])
  const totals = catalog?.manifest.totals

  return (
    <div className="page-stack">
      <Reveal>
        <header className="about-hero">
          <Logo size={54} />
          <h1>
            Diwane<span className="text-grad">Kiram</span>
          </h1>
          <p className="muted">
            Une application de lecture de xassidas pensée pour la concentration : texte arabe vocalisé,
            transcription, traduction française et reprise de lecture — le tout disponible hors ligne.
          </p>
        </header>
      </Reveal>

      {error ? <ErrorState message={error.message} onRetry={reload} /> : null}

      <Reveal className="section">
        <dl className="hero-stats hero-stats--centered">
          {[
            { label: 'Xassidas', value: totals?.xassidas },
            { label: 'Chapitres', value: totals?.chapters },
            { label: 'Versets', value: totals?.verses },
            { label: 'Auteurs', value: totals?.authors },
            { label: 'Traductions', value: totals?.translations },
          ].map((stat) => (
            <div key={stat.label} className="hero-stat">
              <dt>{stat.label}</dt>
              <dd>
                <CountUpText value={stat.value ?? 0} />
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>

      <Reveal className="section">
        <Stagger className="grid grid--features">
          {PILLARS.map((pillar) => (
            <StaggerItem key={pillar.title}>
              <TiltCard className="feature">
                <h3>{pillar.title}</h3>
                <p>{pillar.body}</p>
              </TiltCard>
            </StaggerItem>
          ))}
        </Stagger>
      </Reveal>

      <Reveal className="section">
        <section className="panel">
          <h2>À propos du texte</h2>
          <p className="muted">
            L’arabe est présenté avec ses voyelles (tashkīl) et la ponctuation du texte de référence. La
            transcription latine accompagne chaque verset pour faciliter la lecture des non-arabophones, et
            la traduction française couvre une partie du corpus : les versets encore sans traduction sont
            clairement signalés plutôt que remplacés par du vide.
          </p>
          {totals ? (
            <p className="muted small">
              {totals.translationRatio} % du corpus dispose d’une traduction française. Le reste est
              progressivement complété.
            </p>
          ) : null}
        </section>
      </Reveal>

      <Reveal className="section">
        <section className="panel">
          <h2>Raccourcis clavier</h2>
          <ul className="shortcuts">
            {SHORTCUTS.map((shortcut) => (
              <li key={shortcut.keys}>
                <kbd>{shortcut.keys}</kbd>
                <span>{shortcut.action}</span>
              </li>
            ))}
          </ul>
          <p className="muted small">
            Les animations respectent la préférence système « réduire les animations » : elles sont
            désactivées automatiquement.
          </p>
        </section>
      </Reveal>
    </div>
  )
}