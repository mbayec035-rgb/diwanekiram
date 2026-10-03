import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'

/* Les transcriptions phonétiques utilisent des macrons et des lettres
   pointées (ā, ḥ, ṣ, ṭ, ẓ, ʿ) : le jeu `latin` ne les couvre pas, il faut
   `latin-ext` à côté, sinon le navigateur passe à la police suivante. */
import '@fontsource/space-grotesk/latin-400.css'
import '@fontsource/space-grotesk/latin-500.css'
import '@fontsource/space-grotesk/latin-600.css'
import '@fontsource/space-grotesk/latin-ext-400.css'
import '@fontsource/space-grotesk/latin-ext-500.css'
import '@fontsource/space-grotesk/latin-ext-600.css'
import '@fontsource/amiri/arabic-400.css'
import '@fontsource/amiri/arabic-700.css'
import '@fontsource/noto-naskh-arabic/arabic-400.css'
import '@fontsource/noto-naskh-arabic/arabic-700.css'

import './styles/index.css'
import { router } from './router'

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)