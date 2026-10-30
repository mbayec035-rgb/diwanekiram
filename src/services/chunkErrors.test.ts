import { describe, expect, it } from 'vitest'
import { isChunkLoadError } from './chunkErrors'

describe('isChunkLoadError', () => {
  it('reconnaît le message de Safari', () => {
    expect(isChunkLoadError(new Error('Importing a module script failed.'))).toBe(true)
  })

  it('reconnaît le message de Chrome', () => {
    expect(
      isChunkLoadError(
        new TypeError('Failed to fetch dynamically imported module: /assets/ReaderPage.js'),
      ),
    ).toBe(true)
  })

  it('reconnaît un ChunkLoadError de webpack', () => {
    const error = new Error('Loading chunk 12 failed.')
    error.name = 'ChunkLoadError'
    expect(isChunkLoadError(error)).toBe(true)
  })

  it('ignore les erreurs applicatives ordinaires', () => {
    expect(isChunkLoadError(new Error('Catalogue indisponible (503)'))).toBe(false)
    expect(isChunkLoadError('TypeError: x is undefined')).toBe(false)
    expect(isChunkLoadError(null)).toBe(false)
    expect(isChunkLoadError(undefined)).toBe(false)
  })
})
