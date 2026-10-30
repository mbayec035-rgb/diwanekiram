import { describe, expect, it } from 'vitest'
import { buildOfflineFileList } from './offlineCatalog'
import type { Manifest, ManifestItem } from '../types/domain'

function item(slug: string): ManifestItem {
  return {
    id: slug,
    slug,
    chapters: 1,
    verses: 2,
    translated: 0,
    hasAudio: false,
    file: `verses/${slug}.json`,
    translationsFile: `translations/${slug}.fr.json`,
    pendingTranslations: 2,
  }
}

const manifest: Manifest = {
  generatedAt: '2026-10-30T00:00:00.000Z',
  totals: {
    xassidas: 2,
    chapters: 2,
    verses: 4,
    translations: 0,
    authors: 1,
    translationRatio: 0,
  },
  items: [item('abada'), item('haja-qalbi')],
}

describe('buildOfflineFileList', () => {
  it('inclut le manifeste, les index et chaque œuvre', () => {
    const files = buildOfflineFileList(manifest)

    expect(files).toContain('/data/manifest.json')
    expect(files).toContain('/data/xassidas.json')
    expect(files).toContain('/data/authors.json')
    expect(files).toContain('/data/audio.json')
    expect(files).toContain('/data/verses/abada.json')
    expect(files).toContain('/data/translations/abada.fr.json')
    expect(files).toContain('/data/verses/haja-qalbi.json')
    expect(files).toContain('/data/translations/haja-qalbi.fr.json')
  })

  it('ne renvoie aucun doublon', () => {
    const files = buildOfflineFileList(manifest)
    expect(new Set(files).size).toBe(files.length)
  })

  it('couvre exactement les quatre index et les deux fichiers par œuvre', () => {
    expect(buildOfflineFileList(manifest)).toHaveLength(4 + manifest.items.length * 2)
  })
})
