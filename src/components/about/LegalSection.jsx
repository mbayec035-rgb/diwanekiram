import { Link } from 'react-router-dom';
import { aboutTranslations } from '../../data/about';

export function LegalSection({ lang = 'fr' }) {
  const t = aboutTranslations[lang].sections.legal;

  return (
    <section id={t.id} className="about-section">
      <header className="about-section-header">
        <h2 className="about-section-title">{t.title}</h2>
        <div className="about-section-divider" />
        <p className="about-section-intro">{t.intro}</p>
      </header>

      <div className="about-section-content">
        <div className="about-legal-links">
          <Link to="/politique-de-confidentialite" className="about-legal-link">
            {t.privacy}
          </Link>
          <Link to="/conditions-utilisation" className="about-legal-link">
            {t.terms}
          </Link>
        </div>
      </div>
    </section>
  );
}
