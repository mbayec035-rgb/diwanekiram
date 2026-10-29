import { useSettings } from '../store/useSettings';
import { aboutTranslations } from '../data/about';
import { WhoWeAre } from '../components/about/WhoWeAre';
import { History } from '../components/about/History';
import { SocialLinks } from '../components/about/SocialLinks';
import { ContactShareLegalGrid } from '../components/about/ContactShareLegalGrid';

export function AboutPage() {
  const settings = useSettings();
  const lang: 'fr' | 'ar' = String(settings.translationLang) === 'ar' ? 'ar' : 'fr';
  const t = aboutTranslations[lang];

  return (
    <div className="page-stack about-page" lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="about-page-header" style={{ scrollBehavior: 'auto' }}>
        <h1 className="about-page-title">{t.pageTitle}</h1>
        <p className="about-page-subtitle">{t.pageSubtitle}</p>
      </header>

      <div className="about-sections">
        <WhoWeAre lang={lang} />
        <History lang={lang} />
        <SocialLinks lang={lang} />
        <ContactShareLegalGrid lang={lang} />
      </div>
    </div>
  );
}
