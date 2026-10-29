import { aboutTranslations } from '../../data/about';

export function History({ lang = 'fr' }) {
  const t = aboutTranslations[lang].sections.history;

  return (
    <section id={t.id} className="about-section">
      <header className="about-section-header">
        <h2 className="about-section-title">{t.title}</h2>
        <div className="about-section-divider" />
        <p className="about-section-intro">{t.intro}</p>
      </header>

      <div className="about-section-content">
        <div className="about-block">
          <h3 className="about-block-title">{t.howTitle}</h3>
          <p className="about-text">{t.howText}</p>
          <ul className="about-list">
            {t.howItems.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
