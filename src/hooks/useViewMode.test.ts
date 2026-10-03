/* Choix de vue — le stockage, sans le DOM. */

import { describe, expect, it } from 'vitest'
import { normaliseViewMode, readViewMode, writeViewMode } from './useViewMode'

/** localStorage de poche : le hook est écrit pour un navigateur, les
    tests n'en ont pas. */
function store(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed))

  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
  } as unknown as Storage & { data: Map<string, string> }
}

function refuse() {
  return {
    getItem: () => {
      throw new Error('refusé')
    },
    setItem: () => {
      throw new Error('refusé')
    },
  } as unknown as Storage
}

describe('normaliseViewMode', () => {
  it('accepte les deux vues', () => {
    expect(normaliseViewMode('grid')).toBe('grid')
    expect(normaliseViewMode('list')).toBe('list')
  })

  it('retombe sur la grille devant tout le reste', () => {
    expect(normaliseViewMode('carte')).toBe('grid')
    expect(normaliseViewMode('LIST')).toBe('grid')
    expect(normaliseViewMode('')).toBe('grid')
    expect(normaliseViewMode(null)).toBe('grid')
    expect(normaliseViewMode(undefined)).toBe('grid')
    expect(normaliseViewMode(3)).toBe('grid')
  })
})

describe('readViewMode', () => {
  it('relit ce qui a été écrit sous la clef', () => {
    expect(readViewMode('dk.vue.oeuvres', store({ 'dk.vue.oeuvres': 'list' }))).toBe('list')
  })

  it('défaut grille quand la clef est absente', () => {
    expect(readViewMode('dk.vue.auteurs', store())).toBe('grid')
  })

  it('défaut grille quand le stockage refuse de répondre', () => {
    expect(readViewMode('dk.vue.auteurs', refuse())).toBe('grid')
    expect(readViewMode('dk.vue.auteurs', null)).toBe('grid')
  })

  it('sépare les deux pages', () => {
    const local = store({ 'dk.vue.auteurs': 'list' })
    expect(readViewMode('dk.vue.auteurs', local)).toBe('list')
    expect(readViewMode('dk.vue.oeuvres', local)).toBe('grid')
  })
})

describe('writeViewMode', () => {
  it('écrit sous la clef demandée', () => {
    const local = store()
    writeViewMode('dk.vue.auteurs', 'list', local)
    expect(local.data.get('dk.vue.auteurs')).toBe('list')
  })

  it('ne casse rien quand le stockage refuse', () => {
    expect(() => writeViewMode('dk.vue.auteurs', 'list', refuse())).not.toThrow()
    expect(() => writeViewMode('dk.vue.auteurs', 'list', null)).not.toThrow()
  })
})