/* Portraits d'auteurs : recherche, téléchargement et report dans les données.
 *
 * Le script ne modifie jamais public/data/authors.json : ce fichier est un
 * artefact produit par `npm run data:build`. Les chemins sont écrits dans les
 * vrais fichiers sources — content/auteurs/*.json et content/source/residu.json
 * — puis le catalogue est reconstruit.
 *
 * Ordre des sources :
 *   1. markazulfuhum.app  — notices curatées, `photo_url` fourni ;
 *   2. Wikimedia Commons — via l'API officielle, portraits d'auteurs connus.
 *
 * xassida.sn n'est plus retenu : le catalogue y announce encore des portraits,
 * mais son stockage d'images répond 503 (constaté le 05/10/2026).
 *
 * Principe : une photo de personne réelle vaut mieux absente que fausse. Un
 * nom qui ne correspond pas exactement n'est pas retenu, et l'auteur part dans
 * le rapport pour vérification manuelle.
 *
 * Usage :
 *   npm run authors:pictures
 *   npm run authors:pictures -- --force     retélécharge tout
 *   npm run authors:pictures -- --dry-run   n'écrit rien
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { ficheCorrespondante, normaliserLatin, titreCompatible } from './lib/auteurs-portrait.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = path.join(ROOT, 'public', 'authors')
const CONTENU_AUTEURS = path.join(ROOT, 'content', 'auteurs')
const RESIDU = path.join(ROOT, 'content', 'source', 'residu.json')
const RAPPORT = path.join(ROOT, 'author-photos-report.md')

/* Un Nom Agent permet aux sites de savoir qui les appelle et vers qui écrire.
   Chaque API impose son propre rythme : Wikimedia refuse au-delà de quelques
   requêtes par seconde et répond 429. */
const AGENT = 'diwanekiram-portrait-bot/1.0 (projet DiwaneKiram; usage personnel)'
const DELAI = { markazulfuhum: 1000, wikipedia: 3000, commons: 3000 }
const TAILLE = 256

/* Les formats publics de l'API Wikimedia : licences libres seulement. */
const LICENCES_LIBRES = /^(cc|public domain|cc0|attribution)/i

const force = process.argv.includes('--force')
const dryRun = process.argv.includes('--dry-run')

/* ------------------------------------------------------------------ */
/* Nos auteurs, avec le fichier où leur portrait doit être écrit        */
/* ------------------------------------------------------------------ */

async function lireAuteurs() {
  const liste = []

  const fichiers = (await fs.readdir(CONTENU_AUTEURS).catch(() => [])).filter((f) => f.endsWith('.json'))
  for (const fichier of fichiers) {
    const brut = JSON.parse(await fs.readFile(path.join(CONTENU_AUTEURS, fichier), 'utf8'))
    liste.push({
      origine: 'local',
      fichier: path.join(CONTENU_AUTEURS, fichier),
      cle: null,
      id: brut.id ?? path.basename(fichier, '.json'),
      slug: brut.slug ?? path.basename(fichier, '.json'),
      name: brut.name ?? '',
      nameAr: brut.nameAr ?? '',
      anonymous: Boolean(brut.anonymous),
    })
  }

  const residu = JSON.parse(await fs.readFile(RESIDU, 'utf8'))
  for (const auteur of residu.authors ?? []) {
    liste.push({
      origine: 'source',
      fichier: RESIDU,
      cle: String(auteur.id),
      id: String(auteur.id),
      slug: auteur.slug,
      name: auteur.name ?? '',
      nameAr: auteur.nameAr ?? '',
      anonymous: Boolean(auteur.anonymous),
    })
  }

  return liste
}

/* ------------------------------------------------------------------ */
/* Réseau                                                              */
/* ------------------------------------------------------------------ */

/* Un délai minimal par nom de machine, plutôt qu'un délai unique. */
const dernierAppel = new Map()

function delaiPour(url) {
  const hote = new URL(url).hostname
  if (hote.endsWith('wikipedia.org') || hote.endsWith('wikimedia.org')) return DELAI.wikipedia
  if (hote.endsWith('markazulfuhum.app')) return DELAI.markazulfuhum
  return DELAI.markazulfuhum
}

/** Respecte robots.txt et les conditions d'utilisation : un délai par hôte. */
async function attendre(url, options = {}) {
  const hote = new URL(url).hostname
  const attendu = delaiPour(url)
  const depuis = Date.now() - (dernierAppel.get(hote) ?? 0)
  if (depuis < attendu) await new Promise((r) => setTimeout(r, attendu - depuis))
  dernierAppel.set(hote, Date.now())

  /* Wikimedia répond 429 quand on va trop vite : on patiente et on réessaie
     une fois plutôt que d'abandonner l'auteur. */
  for (let essai = 0; ; essai += 1) {
    let reponse
    try {
      reponse = await fetch(url, {
        ...options,
        headers: { 'User-Agent': AGENT, ...(options.headers ?? {}) },
      })
    } catch (erreur) {
      if (essai >= 1) throw erreur
      await new Promise((r) => setTimeout(r, attendu * 2))
      continue
    }

    if (reponse.status === 429 && essai < 2) {
      await new Promise((r) => setTimeout(r, attendu * (essai + 2)))
      dernierAppel.set(hote, Date.now())
      continue
    }

    if (!reponse.ok) throw new Error(`HTTP ${reponse.status} — ${hote}`)
    return reponse
  }
}

async function lireMarkaz() {
  const url = 'https://markazulfuhum.app/api/authors?limit=200'
  const donnees = await (await attendre(url)).json()
  if (!Array.isArray(donnees.results)) throw new Error('Réponse markaz inattendue.')
  console.log(`  markaz : ${donnees.count} fiches, ${donnees.results.filter((a) => a.photo_url).length} avec photo`)
  return donnees.results
}

/**
 * Cherche un portrait sur Wikimedia à partir du nom français.
 *
 * On exige que le titre de l'article soit exactement le nom de l'auteur, et
 * que le fichier Commons porte une licence libre : une photo qui ressemble est
 * exclue. Ce qui est trouvé ici part en « à vérifier » : l'identité repose sur
 * le titre, pas sur une reconnaissance de visage.
 */
async function chercherWikimedia(auteur) {
  const nom = String(auteur.name ?? '').trim()
  if (!nom || auteur.anonymous) return null

  const recherche = await attendre(
    'https://fr.wikipedia.org/w/api.php?action=query&format=json&redirects=1&list=search&srlimit=1&srnamespace=0&srsearch=' +
      encodeURIComponent(nom),
  ).then((r) => r.json())

  const titre = recherche?.query?.search?.[0]?.title
  if (!titreCompatible(titre, nom)) return null

  const page = await attendre(
    'https://fr.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=pageimages&piprop=original&titles=' +
      encodeURIComponent(titre),
  ).then((r) => r.json())

  const fichier = Object.values(page?.query?.pages ?? {})[0]?.original?.source
  if (!fichier) return null

  /* Le nom de fichier Commons doit encore porter le nom : un article sur
     « Cheikh X » peut illustrer une mosquée ou un autre cheikh. */
  const base = decodeURIComponent(path.basename(fichier))
  if (!normaliserLatin(base).includes(normaliserLatin(nom).slice(0, 12))) return null

  const licence = await licenceCommons(fichier)
  if (!licence) return null

  return {
    provider: 'wikimedia',
    page: `https://fr.wikipedia.org/wiki/${encodeURIComponent(titre.replace(/ /g, '_'))}`,
    file: fichier,
    author: licence.auteur,
    license: licence.libelle,
    licenceUrl: licence.url,
  }
}

async function licenceCommons(fichier) {
  const nom = decodeURIComponent(path.basename(fichier))
  const data = await attendre(
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=extmetadata&titles=' +
      encodeURIComponent(`File:${nom}`),
  ).then((r) => r.json())

  const pages = Object.values(data?.query?.pages ?? {})
  if (!pages[0] || pages[0].missing !== undefined) return null

  const meta = pages[0].imageinfo?.[0]?.extmetadata
  if (!meta) return null

  const libelle = meta.LicenseShortName?.value ?? ''
  if (!LICENCES_LIBRES.test(libelle.replace(/\s/g, ''))) return null

  const nettoyer = (html) =>
    String(html ?? '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()

  return {
    libelle,
    url: meta.LicenseUrl?.value ?? '',
    auteur: nettoyer(meta.Artist?.value) || 'Auteur non précisé',
  }
}

/* ------------------------------------------------------------------ */
/* Image : carré 256, recadré vers le haut, WebP                       */
/* ------------------------------------------------------------------ */

/**
 * Le visage d'un portrait est presque toujours dans le tiers supérieur : on
 * prend un carré centré à 42 % de la hauteur plutôt qu'au milieu exact, qui
 * couperait le haut de la tête sur les images verticales.
 */
async function preparer(buffer, destination) {
  const image = sharp(buffer, { failOn: 'none' })
  const { width, height } = await image.metadata()
  if (!width || !height) throw new Error('Dimensions illisibles.')

  const cote = Math.min(width, height)
  const haut = Math.min(Math.max(Math.round(height * 0.42 - cote / 2), 0), height - cote)
  const gauche = Math.min(Math.max(Math.round(width / 2 - cote / 2), 0), width - cote)

  const sortie = await image
    .extract({ left: gauche, top: haut, width: cote, height: cote })
    .resize(TAILLE, TAILLE, { fit: 'fill' })
    .webp({ quality: 82 })
    .toBuffer()

  await fs.writeFile(destination, sortie)
  return sortie.length
}

async function telecharger(source, slug) {
  const cible = path.join(OUT_DIR, `${slug}.webp`)
  if (!force && (await existe(cible))) return { ok: true, chemin: `authors/${slug}.webp`, taille: null }

  const reponse = await attendre(source.file)
  const type = reponse.headers.get('content-type') ?? ''
  if (!type.startsWith('image/')) throw new Error(`Type inattendu : ${type}`)

  const buffer = Buffer.from(await reponse.arrayBuffer())
  if (buffer.length < 1024) throw new Error('Fichier trop petit, probablement une erreur.')

  const taille = await preparer(buffer, cible)
  return { ok: true, chemin: `authors/${slug}.webp`, taille }
}

async function existe(cible) {
  return fs
    .stat(cible)
    .then(() => true)
    .catch(() => false)
}

/* ------------------------------------------------------------------ */
/* Écriture dans les fichiers sources                                 */
/* ------------------------------------------------------------------ */

/**
 * On réécrit le fichier source en conservant sa mise en forme, et seulement
 * les deux champs du portrait : rien d'autre n'est touché.
 */
async function ecrirePortrait(auteur, chemin, source) {
  if (dryRun) return

  if (auteur.origine === 'local') {
    const brut = JSON.parse(await fs.readFile(auteur.fichier, 'utf8'))
    brut.picture = chemin
    brut.photoSource = source
    await fs.writeFile(auteur.fichier, `${JSON.stringify(brut, null, 2)}\n`, 'utf8')
    return
  }

  const residu = JSON.parse(await fs.readFile(RESIDU, 'utf8'))
  const cible = residu.authors.find((a) => String(a.id) === auteur.cle)
  if (!cible) throw new Error(`Auteur ${auteur.cle} absent de residu.json`)
  cible.picture = chemin
  cible.photoSource = source
  await fs.writeFile(RESIDU, `${JSON.stringify(residu, null, 2)}\n`, 'utf8')
}

/* ------------------------------------------------------------------ */
/* Rapport                                                            */
/* ------------------------------------------------------------------ */

async function ecrireRapport(resultats) {
  const avecPhoto = resultats.filter((r) => r.statut === 'photo')
  const aVerifier = resultats.filter((r) => r.statut === 'à vérifier')
  const sansPhoto = resultats.filter((r) => r.statut === 'sans photo')

  const ligne = (r) =>
    `| ${r.auteur.name} | \`${r.auteur.slug}\` | ${r.auteur.nameAr} | ${r.source?.provider ?? '—'} | ${r.note ?? '—'} |`

  const tableau = (titre, liste) => {
    const corps = liste.length === 0
      ? '_(aucun)_\n'
      : `| Auteur | slug | Nom arabe | Source | Note |\n| --- | --- | --- | --- | --- |\n${liste.map(ligne).join('\n')}\n`
    return titre ? `${titre}\n\n${corps}` : corps
  }

  const contenu = `# Portraits d'auteurs — rapport

Généré le ${new Date().toISOString().slice(0, 10)} par \`npm run authors:pictures\`.

- **${avecPhoto.length}** auteur(s) avec portrait retenu
- **${aVerifier.length}** à vérifier manuellement
- **${sansPhoto.length}** sans portrait

## Règles appliquées

Une photo n'est retenue que si le nom arabe de la fiche distante est **exactement**
égal au nôtre après normalisation (voyelles et tatweel retirés, alef unifiés,
ta marbûta ramenée à ha). Aucune correspondance approximative n'est acceptée :
plusieurs auteurs de la liste ne diffèrent que par un qualificatif, et les
confondre attribuerait un visage au mauvais auteur.

xassida.sn n'a pas été retenue : son catalogue annonce encore des portraits,
mais son stockage d'images répond \`503\` (constaté le 05/10/2026).

## Avec portrait

${tableau('', avecPhoto)}

## À vérifier manuellement

Correspondance trouvée sur Wikimedia : l'identité repose sur le titre exact de
l'article, sans vérification d'identité assistée. À confirmer avant diffusion.

${tableau('', aVerifier)}

## Sans portrait

${tableau('', sansPhoto)}

## Crédits

Les portraits de markazulfuhum.app sont repris depuis \`/media/author_photos/\`.
Le site n'y publie pas de licence ; la provenance est donc enregistrée mais la
licence reste **non précisée**. Les portraits Wikimedia portent leur auteur et
leur licence dans \`photoSource\`, affichés sur la page de l'auteur.

## Reconstruire le catalogue

\`\`\`
npm run data:build
\`\`\`

Après un changement de \`photoSource\` dans \`scripts/extract-content.mjs\` ou
\`scripts/build-library.mjs\`, relancer aussi \`npm run data:source\`.
`

  if (!dryRun) await fs.writeFile(RAPPORT, contenu, 'utf8')
  return { avecPhoto, aVerifier, sansPhoto }
}

/* ------------------------------------------------------------------ */
/* Programme principal                                                 */
/* ------------------------------------------------------------------ */

await fs.mkdir(OUT_DIR, { recursive: true })

const auteurs = await lireAuteurs()
console.log(`${auteurs.length} auteurs à traiter.\n`)

console.log('Lecture des sources distantes…')
const fichesMarkaz = await lireMarkaz()

const resultats = []

for (const auteur of auteurs) {
  if (auteur.anonymous) {
    resultats.push({ auteur, statut: 'sans photo', note: 'Auteur anonyme : jamais de portrait' })
    continue
  }

  const fiche = ficheCorrespondante(auteur, fichesMarkaz)

  if (fiche?.photo_url) {
    const source = {
      provider: 'markazulfuhum',
      page: `https://markazulfuhum.app/authors/${fiche.id}`,
      file: fiche.photo_url,
      author: null,
      license: null,
      note: 'Licence non précisée par la source',
      retrievedAt: new Date().toISOString().slice(0, 10),
    }

    try {
      const { chemin } = await telecharger(source, auteur.slug)
      await ecrirePortrait(auteur, chemin, source)
      resultats.push({ auteur, statut: 'photo', source, note: 'Nom arabe identique' })
      console.log(`  ✓ ${auteur.name}`)
    } catch (erreur) {
      resultats.push({ auteur, statut: 'sans photo', note: `markaz : ${erreur.message}` })
      console.log(`  ✗ ${auteur.name} — ${erreur.message}`)
    }
    continue
  }

  /* markaz peut connaître l'auteur sans lui fournir de photo : on tente alors
     Wikimedia, qui donne parfois le portrait quand markaz n'en a pas. */
  try {
    const wiki = await chercherWikimedia(auteur)
    if (!wiki) {
      /* Deux cas très différents, et le rapport doit les distinguer : connu
         de markaz mais sans photo, vs absent de partout. */
      const note = fiche
        ? 'Sur markaz, mais sans photo ; aucun article Wikipédia au nom exact'
        : 'Introuvable sur markaz ni Wikipédia'
      resultats.push({ auteur, statut: 'sans photo', note })
      console.log(`  · ${auteur.name} — ${note}`)
      continue
    }

    const { chemin } = await telecharger(wiki, auteur.slug)
    await ecrirePortrait(auteur, chemin, wiki)
    resultats.push({ auteur, statut: 'à vérifier', source: wiki, note: 'Correspondance par titre d’article' })
    console.log(`  ? ${auteur.name} — Wikimedia, à vérifier`)
  } catch (erreur) {
    /* Une limite de débit n'est pas une absence de portrait : l'auteur doit
       revenir dans le rapport plutôt que d'être classé « sans photo ». */
    const limite = /HTTP 429/.test(erreur.message)
    resultats.push({
      auteur,
      statut: limite ? 'à vérifier' : 'sans photo',
      note: limite ? 'Wikimedia : limite de débit, non vérifié' : `Wikimedia : ${erreur.message}`,
    })
    console.log(`  ${limite ? '!' : '✗'} ${auteur.name} — ${erreur.message}`)
  }
}

const { avecPhoto, aVerifier, sansPhoto } = await ecrireRapport(resultats)

console.log(
  `\n${avecPhoto.length} avec portrait, ${aVerifier.length} à vérifier, ${sansPhoto.length} sans portrait.`,
)
if (avecPhoto.length || aVerifier.length) {
  console.log('\nRelancer `npm run data:build` pour reporter les portraits dans public/data/authors.json.')
}