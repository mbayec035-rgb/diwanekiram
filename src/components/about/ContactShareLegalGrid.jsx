import { Mail, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { aboutTranslations, contactData, shareData } from '../../data/about';

export function ContactShareLegalGrid({ lang = 'fr' }) {
  const tContact = aboutTranslations[lang].sections.contact;
  const tShare = aboutTranslations[lang].sections.share;
  const tLegal = aboutTranslations[lang].sections.legal;
  const whatsappDigits = contactData.whatsappNumber.replace(/[^0-9]/g, '');
  const whatsappUrl = whatsappDigits ? `https://wa.me/${whatsappDigits}` : undefined;
  const emailHref = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactData.email)
    ? `mailto:${contactData.email}`
    : undefined;
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: shareData.url,
        });
      } catch (err) {}
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {}
  };

  return (
    <div className="about-contact-share-grid">
      <section id={tContact.id} className="about-section">
        <header className="about-section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Mail size={20} />
            <h2 className="about-section-title" style={{ margin: 0 }}>{tContact.title}</h2>
          </div>
          <div className="about-section-divider" />
          <p className="about-section-intro">{tContact.intro}</p>
        </header>
        <div className="about-section-content">
          <a href={emailHref} aria-disabled={emailHref ? undefined : 'true'} className="about-contact-card">
            <Mail size={16} />
            <div>
              <div className="about-contact-label">{tContact.email}</div>
              <div className="about-contact-value">{contactData.email}</div>
            </div>
          </a>
          <a href={whatsappUrl} aria-disabled={whatsappUrl ? undefined : 'true'} target="_blank" rel="noopener noreferrer" className="about-contact-card">
            <MessageCircle size={16} />
            <div>
              <div className="about-contact-label">{tContact.whatsapp}</div>
              <div className="about-contact-value">{contactData.whatsappNumber}</div>
            </div>
          </a>
        </div>
      </section>

      <section id={tShare.id} className="about-section">
        <header className="about-section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Share2 size={20} />
            <h2 className="about-section-title" style={{ margin: 0 }}>{tShare.title}</h2>
          </div>
          <div className="about-section-divider" />
          <p className="about-section-intro">{tShare.intro}</p>
        </header>
        <div className="about-section-content">
          <div className="about-share-actions">
            <button onClick={handleShare} className="about-btn">
              <Share2 size={16} />
              {tShare.shareButton}
            </button>
            <button onClick={handleCopy} className="about-btn about-btn-outline">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? tShare.copySuccess : tShare.copyButton}
            </button>
          </div>
          {copied && <div className="about-toast">{tShare.copySuccess}</div>}
        </div>
      </section>

      <section id={tLegal.id} className="about-section">
        <header className="about-section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <h2 className="about-section-title" style={{ margin: 0 }}>{tLegal.title}</h2>
          </div>
          <div className="about-section-divider" />
          <p className="about-section-intro">{tLegal.intro}</p>
        </header>
        <div className="about-section-content">
          <div className="about-legal-links">
            <Link to="/politique-de-confidentialite" className="about-legal-link">
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
              </svg>
              {tLegal.privacy}
            </Link>
            <Link to="/conditions-utilisation" className="about-legal-link">
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
              </svg>
              {tLegal.terms}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
