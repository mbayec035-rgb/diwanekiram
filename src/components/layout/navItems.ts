/* Entrées de navigation partagées par la barre latérale et la barre basse. */

import { BookMarked, Compass, Heart, Info, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavEntry {
  to: string
  label: string
  short: string
  icon: LucideIcon
}

export const NAV_ENTRIES: NavEntry[] = [
  { to: '/', label: 'Accueil', short: 'Accueil', icon: Compass },
  { to: '/bibliotheque', label: 'Bibliothèque', short: 'Biblio.', icon: BookMarked },
  { to: '/auteurs', label: 'Auteurs', short: 'Auteurs', icon: Users },
  { to: '/favoris', label: 'Favoris', short: 'Favoris', icon: Heart },
  { to: '/a-propos', label: 'À propos', short: 'À propos', icon: Info },
]