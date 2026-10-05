import { describe, expect, it } from 'vitest'
import { filterXassidas, highlightRanges, normalizeArabic, normalizeLatin } from './search'
import type { Author, Xassida } from '../types/domain'

function makeXassida(partial: Partial<Xassida> & { id: string }): Xassida {
  return {
    slug: partial.id,
    name: partial.id,
    nameAr: '',
    nameSearch: partial.id.replace(/-/g, ' '),
    authorId: '1',
    chapterCount: 1,
    verseCount: 10,
    translatedCount: 0,
    translatedRatio: 0,
    hasAudio: false,
    ...partial,
  }
}

function makeAuthor(partial: Partial<Author> & { id: string }): Author {
  return {
    slug: partial.id,
    name: partial.id,
    nameAr: '',
    tariha: 'tidjan',
    tarihaLabel: 'Tidjan',
    anonymous: false,
    bio: '',
    bioSource: 'none',
    picture: null,
    photoSource: null,
    xassidaCount: 1,
    verseCount: 10,
    slugs: [],
    ...partial,
  }
}

describe('normalizeArabic', () => {
  it('retire les voyelles et le tatweel', () => {
    expect(normalizeArabic('أَمِنْ تَذَكُّرِ')).toBe('امن تذكر')
    expect(normalizeArabic('مـــرحبا')).toBe('مرحبا')
  })

  it('unifie les lettres équivalentes', () => {
    expect(normalizeArabic('إسلام')).toBe(normalizeArabic('اسلام'))
    expect(normalizeArabic('أحمد')).toBe(normalizeArabic('احمد'))
    expect(normalizeArabic('مصطفى')).toBe(normalizeArabic('مصطفي'))
  })
})

describe('normalizeLatin', () => {
  it('ignore accents, apostrophes et ponctuation', () => {
    expect(normalizeLatin('El Hadji Malick Sy')).toBe('el hadji malick sy')
    expect(normalizeLatin("Serigne Maodo Sy Dabakh")).toBe('serigne maodo sy dabakh')
    expect(normalizeLatin('Khilass-Zahab')).toBe('khilass zahab')
  })
})

describe('filterXassidas', () => {
  const authors = new Map<string, Author>([['1', makeAuthor({ id: '1', name: 'Elhadji Malick Sy' })]])
  const catalogue = [
    makeXassida({ id: 'burdu', name: 'Burdu', authorId: '1', verseCount: 227, translatedRatio: 0.67 }),
    makeXassida({ id: 'bushra', name: 'Bushra Laqad Nilnal Muna', authorId: '1', verseCount: 106, translatedRatio: 1 }),
    makeXassida({ id: 'nuniya', name: 'Nuniya', authorId: '2', verseCount: 119, translatedRatio: 0 }),
  ]

  it('filtre par auteur', () => {
    expect(filterXassidas(catalogue, authors, { authorId: '2' })).toHaveLength(1)
  })

  it('filtre par longueur', () => {
    expect(filterXassidas(catalogue, authors, { length: 'long' }).map((x) => x.name)).toEqual(['Burdu'])
    expect(filterXassidas(catalogue, authors, { length: 'short' })).toEqual([])
    expect(filterXassidas(catalogue, authors, { length: 'medium' }).map((x) => x.name)).toEqual([
      'Bushra Laqad Nilnal Muna',
      'Nuniya',
    ])
  })

  it('cherche sans tenir compte des accents ni de la casse', () => {
    expect(filterXassidas(catalogue, authors, { query: 'bushra' }).map((x) => x.id)).toEqual(['bushra'])
    expect(filterXassidas(catalogue, authors, { query: 'BURRDU' })).toHaveLength(0)
  })

  it('cherche sur le nom de l’auteur', () => {
    expect(filterXassidas(catalogue, authors, { query: 'malick' }).map((x) => x.id)).toEqual([
      'burdu',
      'bushra',
    ])
  })

  it('trie par nombre de versets', () => {
    expect(filterXassidas(catalogue, authors, { sort: 'verses-asc' }).map((x) => x.name)).toEqual([
      'Bushra Laqad Nilnal Muna',
      'Nuniya',
      'Burdu',
    ])
    expect(filterXassidas(catalogue, authors, { sort: 'verses-desc' })[0].name).toBe('Burdu')
  })

  it('trie par taux de traduction croissant', () => {
    expect(filterXassidas(catalogue, authors, { sort: 'translation' })[0].name).toBe('Nuniya')
  })
})

describe('highlightRanges', () => {
  it('trouve les plages du terme recherché', () => {
    const ranges = highlightRanges('Bushra Laqad Nilnal Muna', 'bushra')
    expect(ranges).toEqual([[0, 6]])
  })

  it('ignore les termes trop courts', () => {
    expect(highlightRanges('Nuniya', 'n')).toEqual([])
  })
})