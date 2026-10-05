/* Appariement prudent entre nos auteurs et les fiches d'un site tiers.
 *
 * Règle : un portrait de personne réelle vaut mieux absent que faux. La
 * correspondance doit être certaine, sinon l'auteur part dans le rapport.
 */

/** Retire voyelles, tatweel, unifie alef/ya/ta marbûta. */
export function normaliserArabe(texte) {
  return String(texte ?? '')
    /* Voyelles (fathatan…sukun), alef superscript, signes coraniques, tatweel. */
    .replace(/[ً-ٰٟۖ-ۭـ]/g, '')
    .replace(/[آأإٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .toLowerCase()
}

/** Minuscules, sans accents ni ponctuation. */
export function normaliserLatin(texte) {
  return String(texte ?? '')
    .normalize('NFD')
    /* Les diacritiques latins, une fois décomposés, tiennent dans U+0300-036F. */
    .replace(/[̀-ͯ]/g, '')
    /* Lettres modificatrices : ʿ ʾ ʻ ꜣ … font partie de \p{L}, il faut les
       retirer à part, sans quoi elles séparent deux noms identiques. */
    .replace(/[ʾʻʿˀˆ-ˑ]/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .toLowerCase()
}

/** Les mots d'un nom, séparés, sans accents : pour comparer des noms. */
export function motsLatin(texte) {
  return String(texte ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[ʾʻʿˀˆ-ˑ]/g, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((mot) => mot.toLowerCase())
}

/**
 * La fiche distante n'est retenue que si le nom arabe est *exactement* égal au
 * nôtre une fois normalisé.
 *
 * Tout le reste est refusé, y compris le containment : « محمد المنصور سي »
 * est contenu dans « الشيخ الحاج محمد المنصور سي », mais ce sont deux auteurs
 * différents de notre liste. Les confondre reviendrait à afficher le visage
 * d'un autre homme sur une fiche.
 */
export function ficheCorrespondante(auteur, fiches) {
  const cible = normaliserArabe(auteur.nameAr)
  if (!cible) return null
  return fiches.find((fiche) => normaliserArabe(fiche.name) === cible) ?? null
}

/**
 * Un article Wikipédia ne vaut pas un portrait s'il ne porte pas exactement le
 * nom de l'auteur.
 *
 * La comparaison se fait mot à mot, pas sur les lettres concaténées : sans
 * cette précaution, « El Hadji Malick Sy » (1855-1922) serait accepté pour
 * « Elhadji Malick SY », notre auteur contemporain — un portrait attribué au
 * mauvais homme, précisément ce que la règle veut interdire.
 */
export function titreCompatible(titre, nom) {
  const a = motsLatin(titre)
  const b = motsLatin(nom)
  if (a.length === 0 || a.length !== b.length) return false
  return a.every((mot, i) => mot === b[i])
}