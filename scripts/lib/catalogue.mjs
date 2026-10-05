/* =========================================================
   DiwaneKiram — modèle de catalogue partagé
   =========================================================

   Utilisé par le script qui interroge la source en ligne et
   par le script qui lit les textes déposés dans content/.

   Un catalogue normalisé a exactement cette forme :

     {
       authors:     Author[],   // métadonnées d'auteur, sans champs dérivés
       xassidas:    Xassida[],  // métadonnées d'œuvre, sans champs dérivés
       chapters:    Chapter[],  // { xassidaId, id, n, title }
       verses:      Verse[],    // { xassidaId, chapterId, id, n, ar, tr }
       translations: Map<string, string>,  // verseId -> texte français
       audio:       AudioEntry[],
     }

   Les champs dérivés (xassidaCount, verseCount, slugs, totals…) ne sont
   jamais stockés ici : ils sont recalculés par recomputeDerived(),
   ce qui évite toute dérive entre les deux sources de données.
   ========================================================= */

import { existsSync } from 'node:fs'
import path from 'node:path'

export const TARIHA_LABEL = { tidjan: 'Tidjan' }

/** Renvoie le chemin public d'un portrait uniquement s'il est présent
    sur le disque ; sinon null (l'interface affiche des initiales). */
export function resolveLocalPortrait(candidate, portraitDir) {
  if (!candidate) return null
  const relative = String(candidate).replace(/^https?:\/\/[^/]+/, '').replace(/^\/+/, '')
  if (!relative) return null
  const name = path.basename(relative)
  return existsSync(path.join(portraitDir, name)) ? `authors/${name}` : null
}

const INVISIBLE = /[\u00A0\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g
const DIACRITICS = /[\u0300-\u036f]/g

export function clean(value) {
  return typeof value === 'string'
    ? value.replace(INVISIBLE, '').replace(/[ \t]{2,}/g, ' ').trim()
    : value
}

/* Un texte arabe réduit à ses lettres : diacritiques et tatweel retirés,
   alif/hamza et ta marbuta unifiés. Les plages sont écrites en
   échappements Unicode — une plage littérale peut englober les lettres
   elles-mêmes et vider le texte qu'on cherche à comparer.
   Les lettres arabes occupent U+0620-064A, les marques commencent à U+064B. */
const ARABIC_MARKS = /[ً-ٰٟۖ-ۭـ]/g

export function foldArabic(value) {
  return clean(
    String(value ?? '')
      .replace(ARABIC_MARKS, '')
      .replace(/[آأإاٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/[ىئ]/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/[.,،؛:؟!"'()[\]/—–-]/g, ' ')
      .replace(/\s+/g, ' '),
  ).toLowerCase()
}

/* Le texte du catalogue arrive en markdown : on retire la syntaxe
   pour n'afficher que des paragraphes de texte brut. */
export function cleanRichText(value) {
  return typeof value === 'string'
    ? value
        .replace(/\\n/g, '\n')
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/^\s{0,3}#{1,6}\s+/gm, '')
        .replace(/^\s{0,3}>\s?/gm, '')
        .replace(/(\*\*|__|\*|_|`)/g, '')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    : value
}

export function titleCase(value) {
  return clean(value.replace(/_/g, ' '))
    .split(' ')
    .filter(Boolean)
    .map((word) =>
      /^(al|el|ab|as|ad|an|ar|as|ay|az|ch|dh|gh|kh|mr|nd|ny|ou|sr|st|sy|th|wa|ye|zi)$/i.test(word)
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ')
}

export function slugify(value) {
  return clean(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Construit un slug unique : suffixe numéroté si le slug est déjà pris. */
export function uniqueSlug(base, used) {
  const root = base || 'sans-titre'
  if (!used.has(root)) {
    used.add(root)
    return root
  }
  for (let n = 2; ; n += 1) {
    const candidate = `${root}-${n}`
    if (!used.has(candidate)) {
      used.add(candidate)
      return candidate
    }
  }
}

/** Normalise les repères poétiques (mètre, rive, thème), sachant que la
    source ne les fournit pas toujours. Les noms arabes sont conservés tels
    quels, avec leur translittération quand elle existe.
    Le nom du champ est `meter` partout ailleurs : l'écrire `metre` ici
    faisait disparaître les trois repères sans laisser de trace. */
function normaliseMetre(raw) {
  if (!raw || typeof raw !== 'object') return {}

  const pick = (value) => {
    if (value === null || value === undefined) return null
    if (typeof value === 'object') {
      return {
        nameAr: clean(value.nameAr ?? value.name ?? ''),
        name: clean(value.name ?? value.nameTranscription ?? ''),
      }
    }
    return { nameAr: clean(String(value)), name: '' }
  }

  const meter = pick(raw.meter)
  const rhyme = pick(raw.rhyme)
  const category = pick(raw.category)

  return {
    ...(meter && meter.nameAr ? { meter } : {}),
    ...(rhyme && rhyme.nameAr ? { rhyme } : {}),
    ...(category && category.nameAr ? { category } : {}),
  }
}

/** Identifiant de chapitre namespacé et stable. */
export function makeChapterId(workKey, chapterN) {
  return `${workKey}-ch${chapterN}`
}

/** Identifiant de verset namespacé, stable et unique dans tout le corpus.
    Le séparateur ne doit jamais être « # » : ces identifiants circulent
    dans les URL (?v=…) et le navigateur couperait la chaîne au caractère
    de début de fragment. */
export function makeVerseId(workKey, chapterN, verseN) {
  return `${workKey}-c${chapterN}-v${verseN}`
}

/* ------------------------------------------------------------ *
   Normalisation
   ------------------------------------------------------------ */

/** Renvoie un catalogue vide, structurellement valide. */
export function emptyCatalogue() {
  return { authors: [], xassidas: [], chapters: [], verses: [], translations: new Map(), audio: [] }
}

/**
 * Normalise un objet brut (source en ligne ou content/) en entrée de catalogue.
 * Accepte plusieurs formes de clés pour rester tolérant aux fichiers déposés.
 */
export function normaliseWork(raw, { origin, usedSlugs }) {
  const name = clean(raw.name ?? raw.title ?? '')
  if (!name) throw new Error(`Œuvre sans nom (${origin}).`)

  const slug = uniqueSlug(slugify(raw.slug ?? name), usedSlugs)
  const id = String(raw.id ?? slug)

  const authorId = String(raw.authorId ?? raw.author ?? '')
  if (!authorId) throw new Error(`« ${name} » n'a pas d'auteur.`)

  const chapters = []
  const verses = []
  const translations = new Map()

  const rawChapters =
    raw.chapters?.length > 0
      ? raw.chapters
      : [{ n: 1, verses: raw.verses ?? [] }]

  rawChapters.forEach((rawChapter, index) => {
    const chapterN = Number(rawChapter.n ?? index + 1) || index + 1
    const chapterId = String(rawChapter.id ?? makeChapterId(id, chapterN))

    chapters.push({
      xassidaId: id,
      id: chapterId,
      n: chapterN,
      title: clean(rawChapter.title ?? '') || null,
    })

    const rawVerses = rawChapter.verses ?? []
    rawVerses.forEach((rawVerse, verseIndex) => {
      const verseN = Number(rawVerse.n ?? verseIndex + 1) || verseIndex + 1
      const verseId = rawVerse.id ?? makeVerseId(id, chapterN, verseN)

      /* Les deux hémistiches sont facultatifs : une source qui ne les fournit
         pas laisse le verset se lire sur une seule ligne, comme avant. */
      const sadr = clean(rawVerse.sadr ?? '')
      const adj = clean(rawVerse.adj ?? '')

      verses.push({
        xassidaId: id,
        chapterId,
        id: String(verseId),
        n: verseN,
        ar: clean(rawVerse.ar ?? rawVerse.text ?? '') || (sadr ? `${sadr} ${adj}`.trim() : ''),
        tr: clean(rawVerse.tr ?? rawVerse.transcription ?? ''),
        ...(sadr ? { sadr } : {}),
        ...(adj ? { adj } : {}),
      })

      const fr = clean(rawVerse.fr ?? rawVerse.translation ?? '')
      if (fr) translations.set(String(verseId), fr)
    })
  })

  if (verses.length === 0) throw new Error(`« ${name} » ne contient aucun verset.`)

  const firstVerse = verses.find((verse) => verse.ar.length > 0)?.ar ?? ''

  /* Repères poétiques : présents uniquement chez les sources qui les fournissent.
     L'absence en est un cas normal, pas une donnée vide.
     On passe la fiche entière, pas `raw.meter` : normaliseMetre lit les trois
     champs nommés, et lui donner le seul mètre laissait rive et thème vides. */
  const metres = normaliseMetre(raw.metrics ?? raw)
  const previousAuthor = clean(raw.previousAuthor ?? '')

  return {
    work: {
      id,
      slug,
      name: titleCase(name),
      nameAr: clean(raw.nameAr ?? raw.ar_name ?? '') || (firstVerse.length <= 90 ? firstVerse : ''),
      nameSearch: slug.replace(/-/g, ' '),
      authorId,
      origin,
      ...metres,
      /* Porté jusqu'à la fusion, et pas plus loin : ce champ autorise une
         réattribution explicite, il n'a pas sa place dans le catalogue
         public. */
      ...(previousAuthor ? { previousAuthor } : {}),
    },
    chapters,
    verses,
    translations,
    provenance: {
      source: clean(raw.source ?? '') || null,
      license: clean(raw.license ?? '') || null,
      providedBy: clean(raw.providedBy ?? '') || null,
      note: clean(raw.note ?? '') || null,
    },
  }
}

/** Ajoute une œuvre normalisée à un catalogue. */
export function addWork(catalogue, normalised) {
  catalogue.xassidas.push(normalised.work)
  catalogue.chapters.push(...normalised.chapters)
  catalogue.verses.push(...normalised.verses)
  for (const [verseId, text] of normalised.translations) catalogue.translations.set(verseId, text)
  return catalogue
}

/* ------------------------------------------------------------ *
   Fusion
   ------------------------------------------------------------ */

/** Identifiant de l'auteur anonyme du catalogue de destination. */
export function findAnonymousId(catalogue) {
  return catalogue.authors.find((author) => author.anonymous)?.id ?? null
}

/**
 * Fusionne un catalogue externe dans un catalogue de destination.
 * Les slugs d'œuvres sont uniquifiés ; les ids d'auteur inconnus sont
 * rejetés plutôt que silencieusement rattachés à l'auteur anonyme.
 */
/**
 * Fusionne les notices d'auteurs d'un catalogue externe.
 * Un identifiant déjà pris est une erreur : deux notices pour le même
 * auteur ne peuvent pas coexister silencieusement.
 */
export function mergeAuthorsInto(target, incoming, origin) {
  const usedIds = new Set(target.authors.map((author) => author.id))
  const usedSlugs = new Set(target.authors.map((author) => author.slug))

  for (const author of incoming.authors) {
    if (usedIds.has(author.id)) {
      throw new Error(
        `Auteur « ${author.id} » (${origin}) : une notice de ce nom existe déjà. ` +
          `Choisissez un autre identifiant pour la notice locale.`,
      )
    }
    const slug = uniqueSlug(author.slug, usedSlugs)
    usedIds.add(author.id)
    usedSlugs.add(slug)
    target.authors.push({ ...author, slug })
  }

  return target
}

export function mergeInto(target, incoming, origin) {
  const authorIds = new Set(target.authors.map((author) => author.id))

  const usedSlugs = new Set(target.xassidas.map((xassida) => xassida.slug))
  const usedIds = new Set(target.xassidas.map((xassida) => xassida.id))

  const chaptersByWork = new Map()
  for (const chapter of incoming.chapters) {
    if (!chaptersByWork.has(chapter.xassidaId)) chaptersByWork.set(chapter.xassidaId, [])
    chaptersByWork.get(chapter.xassidaId).push(chapter)
  }

  const versesByWork = new Map()
  for (const verse of incoming.verses) {
    if (!versesByWork.has(verse.xassidaId)) versesByWork.set(verse.xassidaId, [])
    versesByWork.get(verse.xassidaId).push(verse)
  }

  const workBySlug = new Map(target.xassidas.map((xassida) => [xassida.slug, xassida]))
  for (const xassida of incoming.xassidas) {
    const { authorId, ...rest } = xassida
    const sourceId = xassida.id

    if (!authorIds.has(authorId)) {
      throw new Error(
        `Auteur inconnu « ${authorId} » pour l'œuvre « ${xassida.name} » (${origin}). ` +
          `Ajoutez sa notice dans content/auteurs/<slug>.json avant de relancer le build.`,
      )
    }
    /* L'auteur anonyme est une cible d'attribution valide : c'est le cas
       normal des textes transmis sans indication d'auteur. */

    /* Une œuvre locale portant le slug d'une œuvre existante la remplace,
       à condition que ce soit bien le même auteur. Sans ce garde-fou,
       deux œuvres sans rapport partageant un slug se contamineraient.

       Exception assumée : une réattribution. Plusieurs textes étaient
       catalogués « auteur inconnu » faute de mieux ; une source qui les
       rattache à un auteur réel doit pouvoir corriger cela sans casser
       les adresses. Dans ce cas l'œuvre locale déclare `previousAuthor`,
       qui doit correspondre à l'attribution en place : c'est la preuve
       que le changement est voulu, et non une collision de slug. */
    const incumbent = workBySlug.get(xassida.slug)

    if (incumbent && incumbent.authorId !== authorId) {
      const declared = rest.previousAuthor
      if (!declared || declared !== incumbent.authorId) {
        throw new Error(
          `Le slug « ${xassida.slug} » (${origin}) désigne déjà « ${incumbent.name} », ` +
            `attribuée à l'auteur ${incumbent.authorId}, et non à ${authorId}. ` +
            `Changez le nom du fichier pour lever l'ambiguïté, ou déclarez ` +
            `« previousAuthor » si cette réattribution est voulue.`,
        )
      }
    }

    /* Avant de laisser partir l'œuvre remplacée, on met de côté ses
       traductions, indexées par texte et non par identifiant : une
       traduction ne vaut que pour les mots qu'elle traduit. Les versets
       dont le texte revient à l'identique la conservent donc, et les
       seuls versets réellement nouveaux perdent leur français — ce qui est
      exact, plutôt que de laisser une traduction orpheline ou collée au
       mauvais verset. */
    let carriedTranslations = null
    if (incumbent) {
      carriedTranslations = new Map()
      for (const verse of target.verses) {
        if (verse.xassidaId !== incumbent.id) continue
        const text = target.translations.get(verse.id)
        if (!text) continue
        const key = foldArabic(verse.ar)
        if (key && !carriedTranslations.has(key)) carriedTranslations.set(key, text)
      }
      dropWork(target, incumbent)
      workBySlug.delete(incumbent.slug)
      usedSlugs.delete(incumbent.slug)
    }

    const slug = uniqueSlug(xassida.slug, usedSlugs)
    const id = usedIds.has(sourceId) ? `${sourceId}-${slug}` : sourceId
    usedIds.add(id)

    for (const chapter of chaptersByWork.get(sourceId) ?? []) {
      chapter.xassidaId = id
      target.chapters.push(chapter)
    }
    for (const verse of versesByWork.get(sourceId) ?? []) {
      verse.xassidaId = id
      target.verses.push(verse)
      const text = incoming.translations.get(verse.id) ?? carriedTranslations?.get(foldArabic(verse.ar))
      if (text) target.translations.set(verse.id, text)
    }

    const inserted = { ...rest, id, slug, authorId }
    target.xassidas.push(inserted)
    workBySlug.set(slug, inserted)
  }

  return target
}

/** Retire une œuvre et tout ce qui en dépend : chapitres, versets,
    traductions, et son audio. Sans cela, un remplacement laisserait
    derrière lui des versets orphelins dans le catalogue. */
export function dropWork(catalogue, xassida) {
  const chapterIds = new Set(
    catalogue.chapters.filter((c) => c.xassidaId === xassida.id).map((c) => c.id),
  )

  for (const chapterId of chapterIds) {
    for (const verse of catalogue.verses.filter((v) => v.chapterId === chapterId)) {
      catalogue.translations.delete(verse.id)
    }
  }

  catalogue.xassidas = catalogue.xassidas.filter((w) => w.id !== xassida.id)
  catalogue.chapters = catalogue.chapters.filter((c) => c.xassidaId !== xassida.id)
  catalogue.verses = catalogue.verses.filter((v) => v.chapterId && !chapterIds.has(v.chapterId))
  catalogue.audio = (catalogue.audio ?? []).filter(
    (entry) => String(entry.xassidaId ?? entry.id) !== String(xassida.id),
  )
}

/* ------------------------------------------------------------ *
   Champs dérivés
   ------------------------------------------------------------ */

export function chaptersOf(catalogue, xassidaId) {
  return catalogue.chapters
    .filter((chapter) => chapter.xassidaId === xassidaId)
    .sort((a, b) => a.n - b.n)
}

export function versesOf(catalogue, chapterId) {
  return catalogue.verses
    .filter((verse) => verse.chapterId === chapterId)
    .sort((a, b) => a.n - b.n)
}

/**
 * Recalcule tous les champs dérivés et renvoie une vue prête à écrire.
 * Les objets d'origine ne sont pas mutés sur le plan des métadonnées :
 * on produit de nouveaux objets pour éviter les effets de bord.
 */
export function recomputeDerived(catalogue) {
  const collator = new Intl.Collator('fr', { sensitivity: 'base' })
  const audioIds = new Set(catalogue.audio.map((entry) => entry.xassidaId))

  const xassidas = catalogue.xassidas
    .map((raw) => {
      const chapters = chaptersOf(catalogue, raw.id)
      const verseRecords = chapters.flatMap((chapter) => versesOf(catalogue, chapter.id))
      const translatedCount = verseRecords.filter((verse) => catalogue.translations.has(verse.id)).length

      return {
        id: raw.id,
        slug: raw.slug,
        name: raw.name,
        nameAr: clean(raw.nameAr ?? ''),
        nameSearch: raw.nameSearch ?? '',
        authorId: raw.authorId,
        chapterCount: chapters.length,
        verseCount: verseRecords.length,
        translatedCount,
        hasAudio: audioIds.has(raw.id),
        /* Métrique : absente pour les sources qui ne la fournissent pas. */
        ...(raw.meter ? { meter: raw.meter } : {}),
        ...(raw.rhyme ? { rhyme: raw.rhyme } : {}),
        ...(raw.category ? { category: raw.category } : {}),
        /* Fraction 0..1 : c'est le contrat attendu par l'interface. */
        translatedRatio:
          verseRecords.length > 0
            ? Math.round((translatedCount / verseRecords.length) * 1000) / 1000
            : 0,
      }
    })
    .sort((a, b) => collator.compare(a.name, b.name))

  const authors = catalogue.authors
    .map((raw) => {
      const owned = xassidas.filter((xassida) => xassida.authorId === raw.id)
      return {
        id: raw.id,
        slug: raw.slug,
        name: raw.name,
        nameAr: clean(raw.nameAr ?? '') || raw.name,
        tariha: raw.tariha ?? 'tidjan',
        tarihaLabel: TARIHA_LABEL[raw.tariha] ?? raw.tariha ?? 'Tidjan',
        anonymous: Boolean(raw.anonymous),
        bio: clean(raw.bio ?? ''),
        bioSource: raw.bioSource ?? 'none',
        picture: raw.picture ?? null,
        /* La provenance n'est utile que s'il y a une photo à créditer. */
        photoSource: raw.picture ? (raw.photoSource ?? null) : null,
        xassidaCount: owned.length,
        verseCount: owned.reduce((total, xassida) => total + xassida.verseCount, 0),
        slugs: owned.map((xassida) => xassida.slug),
      }
    })
    .sort((a, b) => Number(a.anonymous) - Number(b.anonymous) || collator.compare(a.name, b.name))

  /* Les pistes audio ne sont conservées que pour les œuvres présentes. */
  const audio = catalogue.audio
    .filter((entry) => audioIds.has(entry.xassidaId))
    .map((entry) => ({
      xassidaId: entry.xassidaId,
      tracks: entry.tracks.map((track) => ({ ...track })),
    }))

  return { xassidas, authors, audio }
}

/* ------------------------------------------------------------ *
   Contrôles d'intégrité
   ------------------------------------------------------------ */

function countDuplicates(values) {
  const seen = new Map()
  for (const value of values) seen.set(value, (seen.get(value) ?? 0) + 1)
  return [...seen.entries()].filter(([, count]) => count > 1).map(([value]) => value)
}

/** Renvoie la liste des anomalies bloquantes ; vide = catalogue conforme. */
export function findIntegrityProblems(catalogue) {
  const problems = []
  const derived = recomputeDerived(catalogue)

  const duplicateWorkSlugs = countDuplicates(derived.xassidas.map((xassida) => xassida.slug))
  if (duplicateWorkSlugs.length > 0) {
    problems.push(`slug d'œuvre dupliqué : ${duplicateWorkSlugs.join(', ')}`)
  }

  const duplicateAuthorSlugs = countDuplicates(derived.authors.map((author) => author.slug))
  if (duplicateAuthorSlugs.length > 0) {
    problems.push(`slug d'auteur dupliqué : ${duplicateAuthorSlugs.join(', ')}`)
  }

  const duplicateWorkIds = countDuplicates(derived.xassidas.map((xassida) => xassida.id))
  if (duplicateWorkIds.length > 0) {
    problems.push(`identifiant d'œuvre dupliqué : ${duplicateWorkIds.join(', ')}`)
  }

  const duplicateChapterIds = countDuplicates(catalogue.chapters.map((chapter) => chapter.id))
  if (duplicateChapterIds.length > 0) {
    problems.push(`identifiant de chapitre dupliqué : ${duplicateChapterIds.join(', ')}`)
  }

  const duplicateVerseIds = countDuplicates(catalogue.verses.map((verse) => verse.id))
  if (duplicateVerseIds.length > 0) {
    problems.push(`identifiant de verset dupliqué : ${duplicateVerseIds.slice(0, 10).join(', ')}`)
  }

  const authorIds = new Set(derived.authors.map((author) => author.id))
  const orphans = derived.xassidas.filter((xassida) => !authorIds.has(xassida.authorId))
  if (orphans.length > 0) {
    problems.push(
      `œuvre(s) sans auteur résolu : ${orphans.map((xassida) => xassida.name).join(', ')}`,
    )
  }

  const empty = derived.xassidas.filter((xassida) => xassida.verseCount === 0)
  if (empty.length > 0) {
    problems.push(`œuvre(s) sans verset : ${empty.map((xassida) => xassida.name).join(', ')}`)
  }

  const badChapters = derived.xassidas.filter((xassida) => xassida.chapterCount < 1)
  if (badChapters.length > 0) {
    problems.push(`œuvre(s) sans chapitre : ${badChapters.map((xassida) => xassida.name).join(', ')}`)
  }

  /* Une traduction qui ne correspond à aucun verset est une faute de frappe :
     elle disparaîtrait silencieusement à l'écriture. */
  const verseIdSet = new Set(catalogue.verses.map((verse) => verse.id))
  const strayTranslations = [...catalogue.translations.keys()].filter((id) => !verseIdSet.has(id))
  if (strayTranslations.length > 0) {
    problems.push(
      `traduction(s) rattachée(s) à un verset inconnu : ${strayTranslations.slice(0, 10).join(', ')}`,
    )
  }

  const anonymousWithoutName = derived.authors.filter((author) => !author.nameAr)
  if (anonymousWithoutName.length > 0) {
    problems.push(`auteur(s) sans nom arabe : ${anonymousWithoutName.map((a) => a.name).join(', ')}`)
  }

  return { problems, derived }
}