import { aboutTranslations } from '../../data/about';

export function WhoWeAre({ lang = 'fr' }) {
  const t = aboutTranslations[lang].sections.whoWeAre;

  return (
    <section id={t.id} className="about-section">
      <header className="about-section-header">
        <h2 className="about-section-title">{t.title}</h2>
        <div className="about-section-divider" />
        <p className="about-section-intro">{t.intro}</p>
      </header>

      <div className="about-section-content">
        <p className="about-text">{t.body1}</p>

        <div className="about-subsection">
          <h3 className="about-subsection-title">{t.missionTitle}</h3>
          {t.missionParagraphs.map((paragraph, idx) => (
            <p key={idx} className="about-text">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="about-grid">
          <div className="about-card">
            <h3 className="about-card-title">{t.whatYouFindTitle}</h3>
            <ul className="about-list">
              {t.whatYouFindItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="about-card">
            <h3 className="about-card-title">{t.valuesTitle}</h3>
            <ul className="about-list">
              {t.valuesItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
