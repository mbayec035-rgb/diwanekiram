/* =========================================================
   Classement éditorial des auteurs.
   L'ordre est explicitement fixé par identifiant : il ne
   dépend ni des noms, ni du nombre d'œuvres, ni de la locale
   du navigateur. Les auteurs qui ne figurent pas dans la
   liste gardent leur ordre d'origine dans les données.
   ========================================================= */

import type { Author } from '../types/domain'

/**
 * Ordre permanent de la liste des auteurs.
 *
 * 1. Al Hadji Oumar Foutiyou Tall.
 * 2. Seydi El Hadji Malick Sy, puis ses fils, puis ses petits-fils
 *    (famille de Tivaouane), classés par génération puis par naissance.
 * 3. Les autres auteurs, ceux qui ont un portrait d'abord.
 * 4. Les auteurs sans portrait.
 *
 * Dans les groupes 3 et 4, l'ordre du fichier `authors.json` est conservé.
 */
export const AUTHOR_PRIORITY_IDS: readonly string[] = [
  /* Al Hadji Oumar Foutiyou Tall */
  '12',
  /* Seydi El Hadji Malick Sy */
  '6',
  /* Fils : Babacar Sy (1886), Mansour Sy Malick (1900),
     Abdou Aziz Sy Dabakh (1904), Ahmed Tidiane Sy (1910) */
  '10',
  '11',
  '7',
  '4',
  /* Petits-fils : Mansour Sy (1925), Maodo Sy Dabakh (1942),
     Mouhammadoul Moustapha Sy (1952) */
  '8',
  '5',
  'seydi-mouhammadoul-moustapha-sy-al-maktoum',
]

const priorityRank = new Map(AUTHOR_PRIORITY_IDS.map((id, index) => [id, index]))

/**
 * Vraie photo de profil ou avatar généré ?
 *
 * Le catalogue ne stocke que le chemin d'un portrait réel dans `picture` :
 * l'avatar par défaut (cercle coloré + initiales) n'existe que dans le
 * composant `Avatar`, qui bascule dessus quand `picture` est vide ou quand
 * l'image ne charge pas. Un chemin renseigné désigne donc bien une photo.
 *
 * `photoSource` ne peut pas servir de critère : plusieurs portraits réels
 * n'ont pas de provenance documentée.
 */
function hasPortrait(author: Author): boolean {
  return typeof author.picture === 'string' && author.picture.trim() !== ''
}

/**
 * Renvoie une copie de `authors` triée selon les priorités éditoriales.
 * Le tri est stable : à rang égal (ou au sein d'un même groupe de photos),
 * l'ordre d'entrée est conservé. Le tableau source n'est pas muté.
 */
export function sortAuthorsByPriority(authors: readonly Author[]): Author[] {
  return authors
    .map((author, index) => {
      const rank = priorityRank.get(author.id)
      return {
        author,
        index,
        /* Groupe 0 : famille prioritaire, classée par rang.
           Groupe 1 : autres auteurs avec portrait.
           Groupe 2 : auteurs sans portrait. */
        group: rank !== undefined ? 0 : hasPortrait(author) ? 1 : 2,
        rank: rank ?? index,
      }
    })
    .sort((a, b) => a.group - b.group || a.rank - b.rank)
    .map(({ author }) => author)
}
