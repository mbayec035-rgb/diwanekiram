/* Anciens identifiants d'œuvres fusionnées.
 *
 * Les doublons supprimés ne doivent pas faire perdre les favoris, l'historique
 * ni la position de lecture des appareils déjà utilisés. Ce module redirige
 * les anciens slugs vers l'œuvre conservée au moment où le store persisté est
 * réhydraté. Les identifiants de versets sont également reportés : les œuvres
 * figées utilisaient des identifiants numériques globaux, les œuvres déposées
 * utilisent le schéma `<slug>-c<chapitre>-v<verset>`.
 */

interface StoredProgress {
  verseId: string
  chapter?: number
  updatedAt: number
}

interface StoredHistory extends StoredProgress {
  slug: string
}

export interface StoredLibraryState {
  favorites?: string[]
  progress?: Record<string, StoredProgress>
  history?: StoredHistory[]
}

interface WorkAlias {
  /** Slug de l'œuvre conservée. */
  to: string
  /** Premier identifiant numérique global de l'ancienne œuvre. */
  numericBase?: number
  /** Nombre de versets de l'ancienne œuvre. */
  numericCount?: number
  /** Nombre de versets de l'œuvre conservée. */
  targetVerseCount: number
  /** Ancienne œuvre découpée en hémistiches : deux versets pour un couplet. */
  pairHemistichs?: boolean
  /** L'ancienne œuvre utilisait des identifiants de verset locaux ; l'œuvre
      conservée utilise des identifiants numériques à partir de cette base. */
  localToNumericBase?: number
}

const ALIASES: Record<string, WorkAlias> = {
  'elhadji-malick-sy-abada-buruqun': {
    to: 'abada-buruqun-tahta-junhi-zalami',
    numericBase: 2103,
    numericCount: 126,
    targetVerseCount: 63,
    pairHemistichs: true,
  },
  'elhadji-malick-sy-fala-budda': {
    to: 'fala-budda-min-shakwa',
    numericBase: 1782,
    numericCount: 65,
    targetVerseCount: 65,
  },
  'elhadji-malick-sy-fanajina': {
    to: 'fanajjina',
    numericBase: 2229,
    numericCount: 18,
    targetVerseCount: 18,
  },
  'elhadji-malick-sy-laqad-haja-qalbi': {
    to: 'lamiyyat-d-durru-l-yatimu-wal-jawharu-l-jasimu',
    numericBase: 1641,
    numericCount: 141,
    targetVerseCount: 142,
  },
  'elhadji-malick-sy-nuniya': {
    to: 'nuniyyat-riyyu-z-zam-ani-fi-mawlidi-sayyidi-bani-adnana',
    numericBase: 2247,
    numericCount: 119,
    targetVerseCount: 121,
  },
  'serigne-babacar-sy-haja-qalbi': {
    to: 'haja-qalbi',
    numericBase: 3477,
    numericCount: 21,
    targetVerseCount: 21,
  },
  'serigne-babacar-sy-qasad-naman': {
    to: 'qasadna-man-sama-fadla',
    numericBase: 3689,
    numericCount: 11,
    targetVerseCount: 11,
  },
  'serigne-babacar-sy-ya-hanliman': {
    to: 'ya-aliman-lana-l-jamila-azhara',
    numericBase: 3518,
    numericCount: 11,
    targetVerseCount: 11,
  },
  'serigne-babacar-sy-ya-qutbu': {
    to: 'ya-qutbu',
    numericBase: 3745,
    numericCount: 19,
    targetVerseCount: 19,
  },
  /* Doublon retiré lors du nettoyage précédent, conservé ici pour les
     appareils qui avaient déjà enregistré cette œuvre. */
  'abuna-abu-bakrin-wa-in-kana-fi-l-qabri': {
    to: 'cheikh-ahmed-tidiane-sy-abuna-abu-bakrin',
    targetVerseCount: 15,
    localToNumericBase: 265,
  },
}

export function remapWorkSlug(slug: string): string {
  return ALIASES[slug]?.to ?? slug
}

export function remapVerseId(slug: string, verseId: string): string {
  const alias = ALIASES[slug]
  if (!alias) return verseId

  if (alias.numericBase !== undefined && /^\d+$/.test(verseId)) {
    const n = Number(verseId) - alias.numericBase + 1
    const count = alias.numericCount ?? alias.targetVerseCount
    if (n >= 1 && n <= count) {
      const target = alias.pairHemistichs
        ? Math.max(1, Math.ceil((n - 1) / 2))
        : Math.min(n, alias.targetVerseCount)
      return `${alias.to}-c1-v${target}`
    }
  }

  if (alias.localToNumericBase !== undefined) {
    const match = /(?:^|-)c\d+-v(\d+)$/.exec(verseId)
    if (match) {
      const n = Number(match[1])
      if (n >= 1 && n <= alias.targetVerseCount) {
        return String(alias.localToNumericBase + n - 1)
      }
    }
  }

  return verseId
}

/** Redirige les identifiants d'œuvres supprimées dans un état persisté. */
export function remapLibraryState<T extends StoredLibraryState>(state: T): T {
  const favorites: string[] = []
  for (const slug of state.favorites ?? []) {
    const next = remapWorkSlug(slug)
    if (!favorites.includes(next)) favorites.push(next)
  }

  const progress: Record<string, StoredProgress> = {}
  for (const [slug, entry] of Object.entries(state.progress ?? {})) {
    const nextSlug = remapWorkSlug(slug)
    const nextEntry = { ...entry, verseId: remapVerseId(slug, entry.verseId) }
    const previous = progress[nextSlug]
    if (!previous || (nextEntry.updatedAt ?? 0) >= (previous.updatedAt ?? 0)) {
      progress[nextSlug] = nextEntry
    }
  }

  /* L'historique ne garde qu'une entrée par œuvre, comme markRead. */
  const latestBySlug = new Map<string, StoredHistory>()
  for (const entry of state.history ?? []) {
    const nextSlug = remapWorkSlug(entry.slug)
    const nextEntry = {
      ...entry,
      slug: nextSlug,
      verseId: remapVerseId(entry.slug, entry.verseId),
    }
    const previous = latestBySlug.get(nextSlug)
    if (!previous || (nextEntry.updatedAt ?? 0) >= (previous.updatedAt ?? 0)) {
      latestBySlug.set(nextSlug, nextEntry)
    }
  }

  const history = [...latestBySlug.values()]
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
    .slice(0, 60)

  return { ...state, favorites, progress, history }
}
