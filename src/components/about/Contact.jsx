import { Mail, MessageCircle } from 'lucide-react';
import { aboutTranslations, contactData } from '../../data/about';

export function Contact({ lang = 'fr' }) {
  const t = aboutTranslations[lang].sections.contact;
  const whatsappUrl = `https://wa.me/${contactData.whatsappNumber.replace(/[^0-9]/g, '')}`;

  return (
    <section id={t.id} className="about-section">
      <header className="about-section-header">
        <h2 className="about-section-title">{t.title}</h2>
        <div className="about-section-divider" />
        <p className="about-section-intro">{t.intro}</p>
      </header>

      <div className="about-section-content">
        <div className="about-contact-card">
          <Mail size={24} />
          <div>
            <div className="about-contact-label">{t.email}</div>
            <div className="about-contact-value">{contactData.email}</div>
          </div>
        </div>

        <div className="about-contact-card">
          <MessageCircle size={24} />
          <div>
            <div className="about-contact-label">{t.whatsapp}</div>
            <div className="about-contact-value">{contactData.whatsappNumber}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
