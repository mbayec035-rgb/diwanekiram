/* Réglages : apparence, lecture, données locales, installation. */

import { useEffect, useState } from 'react'
import { Download, Monitor, Moon, RotateCcw, Sun, Trash2 } from 'lucide-react'
import { useSettings, applyDocumentSettings, SCALE_LIMITS } from '../store/useSettings'
import { useLibrary } from '../store/useLibrary'
import { Button } from '../components/ui/Button'
import { Reveal } from '../components/motion/Reveal'
import type { ThemePreference } from '../types/domain'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function SettingsPage() {
  const settings = useSettings()
  const favorites = useLibrary((state) => state.favorites)
  const history = useLibrary((state) => state.history)
  const progress = useLibrary((state) => state.progress)
  const resetLibrary = useLibrary((state) => state.reset)
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    applyDocumentSettings(useSettings.getState())
  }, [settings.theme, settings.arabicFont])

  return (
    <div className="page-stack">
      <Reveal>
        <header className="page-head">
          <p className="eyebrow">Préférences</p>
          <h1>Réglages</h1>
          <p className="muted">
            Tout est enregistré sur cet appareil : aucun compte, aucune synchronisation.
          </p>
        </header>
      </Reveal>

      <Reveal className="section">
        <section className="panel">
          <h2>Apparence</h2>

          <div className="field">
            <span className="field-label">Thème</span>
            <div className="segmented">
              {(
                [
                  { value: 'dark', label: 'Nuit', icon: Moon },
                  { value: 'light', label: 'Jour', icon: Sun },
                  { value: 'system', label: 'Système', icon: Monitor },
                ] as Array<{ value: ThemePreference; label: string; icon: typeof Moon }>
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`segment${settings.theme === option.value ? ' is-active' : ''}`}
                  onClick={() => settings.setTheme(option.value)}
                  aria-pressed={settings.theme === option.value}
                >
                  <option.icon size={15} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field-label">Police du texte arabe</span>
            <div className="segmented">
              {(
                [
                  { value: 'amiri', label: 'Amiri (naskh classique)' },
                  { value: 'naskh', label: 'Noto Naskh (lisible)' },
                ] as Array<{ value: 'amiri' | 'naskh'; label: string }>
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`segment${settings.arabicFont === option.value ? ' is-active' : ''}`}
                  onClick={() => settings.setArabicFont(option.value)}
                  aria-pressed={settings.arabicFont === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal className="section">
        <section className="panel">
          <h2>Lecture</h2>

          <div className="field">
            <span className="field-label">Taille de l&apos;arabe</span>
            <div className="slider-row">
              <input
                type="range"
                min={SCALE_LIMITS.arabic[0]}
                max={SCALE_LIMITS.arabic[1]}
                step={0.1}
                value={settings.arabicScale}
                onChange={(event) => settings.setArabicScale(Number(event.target.value))}
              />
              <span className="field-value">{Math.round(settings.arabicScale * 100)} %</span>
            </div>
          </div>

          <div className="field">
            <span className="field-label">Taille de la transcription</span>
            <div className="slider-row">
              <input
                type="range"
                min={SCALE_LIMITS.transcription[0]}
                max={SCALE_LIMITS.transcription[1]}
                step={0.1}
                value={settings.transcriptionScale}
                onChange={(event) => settings.setTranscriptionScale(Number(event.target.value))}
              />
              <span className="field-value">{Math.round(settings.transcriptionScale * 100)} %</span>
            </div>
          </div>

          <div className="field">
            <span className="field-label">Taille de la traduction</span>
            <div className="slider-row">
              <input
                type="range"
                min={SCALE_LIMITS.translation[0]}
                max={SCALE_LIMITS.translation[1]}
                step={0.1}
                value={settings.translationScale}
                onChange={(event) => settings.setTranslationScale(Number(event.target.value))}
              />
              <span className="field-value">{Math.round(settings.translationScale * 100)} %</span>
            </div>
          </div>

          <div className="field">
            <span className="field-label">Couches affichées</span>
            <div className="toggles">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.showArabic}
                  onChange={() => settings.toggleLayer('showArabic')}
                />
                <span>Texte arabe</span>
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.showTranscription}
                  onChange={() => settings.toggleLayer('showTranscription')}
                />
                <span>Transcription latine</span>
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.showTranslation}
                  onChange={() => settings.toggleLayer('showTranslation')}
                />
                <span>Traduction française</span>
              </label>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal className="section">
        <section className="panel">
          <h2>Application</h2>

          <div className="panel-rows">
            <div className="panel-row">
              <div>
                <strong>Installation</strong>
                <p className="muted small">
                  {installPrompt
                    ? 'Installez DiwaneKiram pour un accès hors ligne complet.'
                    : 'Utilisez le menu du navigateur pour installer l’application.'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<Download size={15} />}
                disabled={!installPrompt}
                onClick={() => installPrompt?.prompt()}
              >
                Installer
              </Button>
            </div>

            <div className="panel-row">
              <div>
                <strong>État du réseau</strong>
                <p className="muted small">
                  {online ? 'En ligne — le catalogue est disponible.' : 'Hors ligne — le catalogue mis en cache reste lisible.'}
                </p>
              </div>
              <span className={`badge ${online ? 'badge--mint' : 'badge--warn'}`}>
                {online ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal className="section">
        <section className="panel">
          <h2>Données locales</h2>
          <div className="panel-rows">
            <div className="panel-row">
              <div>
                <strong>Favoris</strong>
                <p className="muted small">{favorites.length} élément(s)</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 size={15} />}
                disabled={favorites.length === 0}
                onClick={() => useLibrary.getState().clearFavorites()}
              >
                Vider
              </Button>
            </div>

            <div className="panel-row">
              <div>
                <strong>Historique et positions</strong>
                <p className="muted small">
                  {history.length} entrée(s) · {Object.keys(progress).length} xassida(s) en cours
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 size={15} />}
                disabled={history.length === 0 && Object.keys(progress).length === 0}
                onClick={() => {
                  useLibrary.getState().clearHistory()
                  useLibrary.getState().clearProgress()
                }}
              >
                Vider
              </Button>
            </div>
          </div>

          <div className="panel-actions">
            <Button variant="outline" size="sm" icon={<RotateCcw size={15} />} onClick={() => settings.reset()}>
              Réinitialiser l’apparence
            </Button>
            <Button variant="danger" size="sm" icon={<Trash2 size={15} />} onClick={resetLibrary}>
              Effacer toutes les données locales
            </Button>
          </div>
        </section>
      </Reveal>
    </div>
  )
}