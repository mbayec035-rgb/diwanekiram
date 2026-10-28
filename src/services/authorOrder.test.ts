import { describe, expect, it } from 'vitest'
import { AUTHOR_PRIORITY_IDS, sortAuthorsByPriority } from './authorOrder'
import type { Author } from '../types/domain'

function makeAuthor(id: string, partial: Partial<Author> = {}): Author {
  return {
    id,
    slug: id,
    name: id,
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

describe('sortAuthorsByPriority', () => {
  it('place Al Hadji Oumar Foutiyou Tall puis Seydi El Hadji Malick Sy en tête', () => {
    const sorted = sortAuthorsByPriority([makeAuthor('a'), makeAuthor('6'), makeAuthor('12')])

    expect(sorted.map((author) => author.id)).toEqual(['12', '6', 'a'])
  })

  it('respecte les générations de la famille de Malick Sy', () => {
    const family = [
      'seydi-mouhammadoul-moustapha-sy-al-maktoum',
      '8',
      '5',
      '4',
      '7',
      '11',
      '10',
      '6',
      '12',
    ].map((id) => makeAuthor(id))

    expect(sortAuthorsByPriority(family).map((author) => author.id)).toEqual([
      '12',
      '6',
      '10',
      '11',
      '7',
      '4',
      '8',
      '5',
      'seydi-mouhammadoul-moustapha-sy-al-maktoum',
    ])
  })

  it('place les autres auteurs avec portrait avant ceux sans portrait', () => {
    const others = [
      makeAuthor('sans-photo-1'),
      makeAuthor('avec-photo-1', { picture: 'authors/photo-1.webp' }),
      makeAuthor('12'),
      makeAuthor('sans-photo-2'),
      makeAuthor('avec-photo-2', { picture: 'authors/photo-2.webp' }),
      makeAuthor('6'),
    ]

    expect(sortAuthorsByPriority(others).map((author) => author.id)).toEqual([
      '12',
      '6',
      'avec-photo-1',
      'avec-photo-2',
      'sans-photo-1',
      'sans-photo-2',
    ])
  })

  it('ne prend pas un chemin vide ou blanc pour une photo', () => {
    const sorted = sortAuthorsByPriority([
      makeAuthor('vide', { picture: '' }),
      makeAuthor('blanc', { picture: '   ' }),
      makeAuthor('photo', { picture: 'authors/photo.webp' }),
    ])

    expect(sorted.map((author) => author.id)).toEqual(['photo', 'vide', 'blanc'])
  })

  it('conserve l’ordre des autres auteurs, sans tri alphabétique ni par œuvres', () => {
    const others = [
      makeAuthor('zebre', { xassidaCount: 1 }),
      makeAuthor('alpha', { xassidaCount: 99 }),
      makeAuthor('12', { xassidaCount: 6 }),
      makeAuthor('beta', { xassidaCount: 3 }),
    ]

    expect(sortAuthorsByPriority(others).map((author) => author.id)).toEqual([
      '12',
      'zebre',
      'alpha',
      'beta',
    ])
  })

  it('ne perd aucun auteur et ne mute pas le tableau source', () => {
    const source = [makeAuthor('b'), makeAuthor('12'), makeAuthor('a'), makeAuthor('6')]
    const snapshot = source.map((author) => author.id)

    const sorted = sortAuthorsByPriority(source)

    expect(sorted).toHaveLength(source.length)
    expect(new Set(sorted.map((author) => author.id))).toEqual(new Set(snapshot))
    expect(source.map((author) => author.id)).toEqual(snapshot)
  })

  it('ignore les identifiants prioritaires absents des données', () => {
    const sorted = sortAuthorsByPriority([makeAuthor('x'), makeAuthor('y')])

    expect(sorted.map((author) => author.id)).toEqual(['x', 'y'])
  })

  it('ne contient aucun doublon dans la liste prioritaire', () => {
    expect(new Set(AUTHOR_PRIORITY_IDS).size).toBe(AUTHOR_PRIORITY_IDS.length)
  })
})
