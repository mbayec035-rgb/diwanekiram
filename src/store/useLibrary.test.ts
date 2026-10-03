import { beforeEach, describe, expect, it } from 'vitest'
import { useLibrary } from './useLibrary'

describe('useLibrary', () => {
  beforeEach(() => {
    useLibrary.setState({ favorites: [], progress: {}, history: [] })
  })

  it('ajoute et retire un favori', () => {
    useLibrary.getState().toggleFavorite('autre-burdu')
    expect(useLibrary.getState().favorites).toEqual(['autre-burdu'])
    expect(useLibrary.getState().isFavorite('autre-burdu')).toBe(true)

    useLibrary.getState().toggleFavorite('autre-burdu')
    expect(useLibrary.getState().favorites).toEqual([])
  })

  it('enregistre la position de lecture et l’historique', () => {
    useLibrary.getState().markRead('autre-burdu', '3398')
    useLibrary.getState().markRead('autre-burdu', '3399')

    const state = useLibrary.getState()
    expect(state.progress['autre-burdu']?.verseId).toBe('3399')
    expect(state.history.map((entry) => entry.verseId)).toEqual(['3399'])
  })

  it('mémorise le chapitre avec la position', () => {
    useLibrary.getState().markRead('autre-burdu', '3398', 7)

    const entry = useLibrary.getState().progress['autre-burdu']
    expect(entry?.chapter).toBe(7)
    expect(useLibrary.getState().history[0]?.chapter).toBe(7)
  })

  it('accepte une position sans chapitre', () => {
    useLibrary.getState().markRead('autre-burdu', '3398')

    expect(useLibrary.getState().progress['autre-burdu']?.chapter).toBeUndefined()
  })

  it('ignore un marquage identique au dernier', () => {
    useLibrary.getState().markRead('autre-burdu', '3398')
    const first = useLibrary.getState().history
    useLibrary.getState().markRead('autre-burdu', '3398')
    expect(useLibrary.getState().history).toBe(first)
  })

  it('remplace une entrée déjà présente dans l’historique', () => {
    useLibrary.getState().markRead('autre-burdu', '3398')
    useLibrary.getState().markRead('autre-bushra-laqad-nilnal-muna', '4000')
    useLibrary.getState().markRead('autre-burdu', '3400')

    const slugs = useLibrary.getState().history.map((entry) => `${entry.slug}:${entry.verseId}`)
    expect(slugs).toEqual(['autre-burdu:3400', 'autre-bushra-laqad-nilnal-muna:4000'])
  })

  it('vide les données locales', () => {
    useLibrary.getState().toggleFavorite('a')
    useLibrary.getState().markRead('a', '1')
    useLibrary.getState().reset()

    const state = useLibrary.getState()
    expect(state.favorites).toEqual([])
    expect(state.history).toEqual([])
    expect(state.progress).toEqual({})
  })
})