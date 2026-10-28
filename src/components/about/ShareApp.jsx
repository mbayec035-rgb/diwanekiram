import { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { aboutTranslations, shareData } from '../../data/about';

export function ShareApp({ lang = 'fr' }) {
  const t = aboutTranslations[lang].sections.share;
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: shareData.url,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback
    }
  };

  return (
    <section id={t.id} className="about-section">
      <header className="about-section-header">
        <h2 className="about-section-title">{t.title}</h2>
        <div className="about-section-divider" />
        <p className="about-section-intro">{t.intro}</p>
      </header>

      <div className="about-section-content">
        <div className="about-share-actions">
          <button onClick={handleShare} className="about-btn">
            <Share2 size={18} />
            {t.shareButton}
          </button>
          <button onClick={handleCopy} className="about-btn about-btn-outline">
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? t.copySuccess : t.copyButton}
          </button>
        </div>
        {copied && <div className="about-toast">{t.copySuccess}</div>}
      </div>
    </section>
  );
}
