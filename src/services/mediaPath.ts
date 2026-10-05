/** Les données stockent les portraits en chemin relatif (« authors/x.webp »).
 *
 *  Un chemin relatif se résout contre l'URL courante : sur la liste des auteurs
 *  (« /auteurs ») il tombe juste par hasard, mais sur la fiche d'un auteur
 *  (« /auteurs/ibnu-mursiyyat ») il pointe vers /auteurs/authors/x.webp et 404 —
 *  d'où des initiales sur la fiche alors que la photo existe. On ancre sur
 *  BASE_URL, exactement comme le fait le chargement des données.
 */
export function cheminPublic(chemin: string): string {
  return `${import.meta.env.BASE_URL}${chemin}`.replace(/\/{2,}/g, '/')
}