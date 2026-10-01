/* Préférences de lecture — persistées dans localStorage. */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ArabicFont, ThemePreference, TranslationLang } from '../types/domain'

/** Échelles de taille des trois couches de lecture. */
export type LayerScale = 'arabic' | 'transcription' | 'translation'

export interface SettingsState {
  theme: ThemePreference
  arabicFont: ArabicFont
  arabicScale: number
  transcriptionScale: number
  translationScale: number
  showArabic: boolean
  showTranscription: boolean
  showTranslation: boolean
  translationLang: TranslationLang
  setTheme: (theme: ThemePreference) => void
  setArabicFont: (font: ArabicFont) => void
  setArabicScale: (scale: number) => void
  setTranscriptionScale: (scale: number) => void
  setTranslationScale: (scale: number) => void
  setLayerScale: (layer: LayerScale, scale: number) => void
  toggleLayer: (layer: 'showArabic' | 'showTranscription' | 'showTranslation') => void
  setTranslationLang: (lang: TranslationLang) => void
  reset: () => void
}

const DEFAULTS = {
  theme: 'dark' as ThemePreference,
  arabicFont: 'amiri' as ArabicFont,
  arabicScale: 1,
  transcriptionScale: 1,
  translationScale: 1,
  showArabic: true,
  showTranscription: true,
  showTranslation: true,
  translationLang: 'fr' as TranslationLang,
}

/* Bornes par couche : l'arabe supporte un agrandissement plus large,
   la transcription et la traduction restent plus compactes. */
export const SCALE_LIMITS: Record<LayerScale, [number, number]> = {
  arabic: [0.8, 2],
  transcription: [0.8, 1.6],
  translation: [0.8, 1.6],
}

export function clampScale(layer: LayerScale, value: number): number {
  const [min, max] = SCALE_LIMITS[layer]
  if (Number.isNaN(value)) return 1
  return Math.min(max, Math.max(min, Math.round(value * 20) / 20))
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setTheme: (theme) => set({ theme }),
      setArabicFont: (arabicFont) => set({ arabicFont }),
      setArabicScale: (arabicScale) => set({ arabicScale: clampScale('arabic', arabicScale) }),
      setTranscriptionScale: (transcriptionScale) =>
        set({ transcriptionScale: clampScale('transcription', transcriptionScale) }),
      setTranslationScale: (translationScale) =>
        set({ translationScale: clampScale('translation', translationScale) }),
      setLayerScale: (layer, scale) =>
        set({
          [layer === 'arabic'
            ? 'arabicScale'
            : layer === 'transcription'
              ? 'transcriptionScale'
              : 'translationScale']: clampScale(layer, scale),
        } as Partial<SettingsState>),
      toggleLayer: (layer) => set((state) => ({ [layer]: !state[layer] }) as Partial<SettingsState>),
      setTranslationLang: (translationLang) => set({ translationLang }),
      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: 'dk.settings',
      partialize: ({
        theme,
        arabicFont,
        arabicScale,
        transcriptionScale,
        translationScale,
        showArabic,
        showTranscription,
        showTranslation,
        translationLang,
      }) => ({
        theme,
        arabicFont,
        arabicScale,
        transcriptionScale,
        translationScale,
        showArabic,
        showTranscription,
        showTranslation,
        translationLang,
      }),
      /* Les préférences enregistrées avant l'ajout de la transcription
         sont complétées par les valeurs par défaut. */
      merge: (persisted, current) => ({ ...current, ...(persisted as Partial<SettingsState>) }),
    },
  ),
)

/** Applique le thème et les préférences typographiques au document. */
export function applyDocumentSettings(state: Pick<SettingsState, 'theme' | 'arabicFont'>) {
  if (typeof document === 'undefined') return

  const resolved =
    state.theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark'
      : state.theme

  document.documentElement.dataset.theme = resolved
  document.documentElement.dataset.font = state.arabicFont
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', resolved === 'light' ? '#eef4f7' : '#05070a')
}