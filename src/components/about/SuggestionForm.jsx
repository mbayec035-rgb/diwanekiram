import { useState } from 'react';
import { aboutTranslations, suggestionConfig } from '../../data/about';

export function SuggestionForm({ lang = 'fr' }) {
  const t = aboutTranslations[lang].sections.suggestion;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: 'suggestion',
    message: '',
  });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.message.trim()) {
      alert(t.required);
      return;
    }

    setStatus('loading');
    
    const endpoint = import.meta.env[suggestionConfig.endpointEnvKey];
    
    if (!endpoint) {
      // If no endpoint configured, just show error as per instructions
      setStatus('error');
      return;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', type: 'suggestion', message: '' });
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
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
        <div className="about-form" onSubmit={handleSubmit}>
          <div className="about-form-group">
            <label className="about-form-label">{t.nameLabel}</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="about-form-input"
            />
          </div>

          <div className="about-form-group">
            <label className="about-form-label">{t.emailLabel}</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="about-form-input"
            />
          </div>

          <div className="about-form-group">
            <label className="about-form-label">{t.typeLabel}</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="about-form-input"
            >
              {t.typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="about-form-group">
            <label className="about-form-label">{t.messageLabel}</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              className="about-form-textarea"
              rows={5}
              required
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={status === 'loading'}
            className="about-btn"
          >
            {status === 'loading' ? t.sending : t.submit}
          </button>

          {status === 'success' && <div className="about-message success">{t.success}</div>}
          {status === 'error' && <div className="about-message error">{t.error}</div>}
        </div>
      </div>
    </section>
  );
}
