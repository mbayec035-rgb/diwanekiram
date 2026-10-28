/* Vérifie le classement éditorial sur les données réellement publiées.
   Le test est hors de `src/` pour ne pas mêler les types Node au build
   TypeScript de l'application. */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  AUTHOR_PRIORITY_IDS,
  sortAuthorsByPriority,
} from '../../src/services/authorOrder.ts'

const authors = JSON.parse(
  readFileSync(new URL('../../public/data/authors.json', import.meta.url), 'utf8'),
)

describe('classement des auteurs publiés', () => {
  it('trouve une seule fiche pour chacun des identifiants prioritaires', () => {
    for (const id of AUTHOR_PRIORITY_IDS) {
      expect(
        authors.filter((author) => author.id === id),
        id,
      ).toHaveLength(1)
    }
  })

  it('applique les quatre groupes sur les données réelles', () => {
    const sorted = sortAuthorsByPriority(authors)
    const others = authors.filter((author) => !AUTHOR_PRIORITY_IDS.includes(author.id))

    expect(sorted).toHaveLength(authors.length)
    expect(sorted.map((author) => author.id)).toEqual([
      ...AUTHOR_PRIORITY_IDS,
      ...others.filter((author) => author.picture).map((author) => author.id),
      ...others.filter((author) => !author.picture).map((author) => author.id),
    ])
  })
})
