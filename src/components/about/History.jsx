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
          <h3 className="about-block-title">{t.creation}</h3>
          <p className="about-text">{t.creationText}</p>
        </div>

        <div className="about-block">
          <h3 className="about-block-title">{t.context}</h3>
          <p className="about-text">{t.contextText}</p>
        </div>

        <div className="about-block">
          <h3 className="about-block-title">{t.objectives}</h3>
          <p className="about-text">{t.objectivesText}</p>
        </div>

        <div className="about-block">
          <h3 className="about-block-title">{t.activities}</h3>
          <p className="about-text">{t.activitiesText}</p>
        </div>

        <div className="about-block">
          <h3 className="about-block-title">{t.link}</h3>
          <p className="about-text">{t.linkText}</p>
        </div>
      </div>
    </section>
  );
}
