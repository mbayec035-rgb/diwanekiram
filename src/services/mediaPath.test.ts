import { describe, expect, it } from 'vitest'

import { cheminPublic } from './mediaPath'

/* BASE_URL vaut '/' en test comme en production. */
describe('cheminPublic', () => {
  it('ancre un chemin relatif sur la racine', () => {
    expect(cheminPublic('authors/ibnu-mursiyyat.webp')).toBe('/authors/ibnu-mursiyyat.webp')
  })

  it('ne double pas la barre quand le chemin est déjà absolu', () => {
    expect(cheminPublic('/authors/ibnu-mursiyyat.webp')).toBe('/authors/ibnu-mursiyyat.webp')
  })

  it('reste correct quelle que soit la profondeur de la route', () => {
    const photo = cheminPublic('authors/ibnu-mursiyyat.webp')
    for (const route of ['/', '/auteurs', '/auteurs/ibnu-mursiyyat', '/recherche']) {
      expect(new URL(photo, `https://diwanekiram.app${route}`).pathname).toBe(
        '/authors/ibnu-mursiyyat.webp',
      )
    }
  })
})