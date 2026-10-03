import { describe, expect, it } from 'vitest'
import { chapitreLabel, filterChapters } from './chapters'
import type { Chapter } from '../../types/domain'

function chapitres(n: number): Chapter[] {
  return Array.from({ length: n }, (_, index) => ({
    id: `œuvre-ch${index + 1}`,
    n: index + 1,
    verseCount: index + 3,
    verses: [],
  }))
}

describe('chapitreLabel', () => {
  it('nomme le chapitre quand l’œuvre en a plusieurs', () => {
    expect(chapitreLabel(3, 12)).toBe('Chapitre 3')
  })

  it('appelle « Texte » une œuvre à un seul chapitre', () => {
    expect(chapitreLabel(1, 1)).toBe('Texte')
  })
})

describe('filterChapters', () => {
  const douze = chapitres(12)

  it('renvoie tout quand la recherche est vide', () => {
    expect(filterChapters(douze, '   ')).toHaveLength(12)
  })

  it('trouve un chapitre par son numéro', () => {
    expect(filterChapters(douze, '3').map((c) => c.n)).toEqual([3])
  })

  it('ne confond pas un numéro avec un préfixe', () => {
    /* « 1 » doit trouver le chapitre 1, pas le 1 et le 10, 11, 12. */
    expect(filterChapters(douze, '1').map((c) => c.n)).toEqual([1])
  })

  it('ignore la casse sur le libellé', () => {
    expect(filterChapters(douze, 'CHAPITRE 7').map((c) => c.n)).toEqual([7])
  })

  it('renvoie une liste vide pour une recherche sans résultat', () => {
    expect(filterChapters(douze, 'zzz')).toEqual([])
  })

  it('cherche sur le libellé « Texte » d’une œuvre unique', () => {
    const une = chapitres(1)
    expect(filterChapters(une, 'texte')).toHaveLength(1)
    expect(filterChapters(une, '2')).toEqual([])
  })
})