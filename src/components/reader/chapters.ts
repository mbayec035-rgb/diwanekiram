/* Noms et filtres du sommaire des chapitres — la logique pure, séparée des
   composants qui l'affichent.

   Un fichier qui n'exporte que des composants se recharge à chaud sans
   perdre son état ; y ajouter des fonctions oblige le navigateur à
   recharger toute la page. */

import type { Chapter } from '../../types/domain'

/** Une œuvre à un seul chapitre n'a pas de chapitre à nommer : elle
 *  s'appelle « Texte », comme le lecteur l'a toujours appelée. */
export function chapitreLabel(n: number, total: number): string {
  return total > 1 ? `Chapitre ${n}` : 'Texte'
}

/** Filtre du sommaire : un numéro sought directement, un mot sur le libellé. */
export function filterChapters(chapters: Chapter[], query: string): Chapter[] {
  const recherche = query.trim().toLowerCase()
  if (!recherche) return chapters

  /* Numéro d'abord : « 1 » doit trouver le chapitre 1, et non les chapitres
     1, 10, 11 et 12 par hasard de sous-chaîne. Ensuite le libellé, pour qui
     cherche un mot. */
  if (/^\d+$/.test(recherche)) {
    const n = Number(recherche)
    return chapters.filter((entry) => entry.n === n)
  }

  return chapters.filter((entry) =>
    chapitreLabel(entry.n, chapters.length).toLowerCase().includes(recherche),
  )
}