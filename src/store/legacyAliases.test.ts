import { describe, expect, it } from 'vitest'
import { remapLibraryState, remapVerseId, remapWorkSlug } from './legacyAliases'

describe('legacyAliases', () => {
  it('redirige un ancien slug vers l’œuvre conservée', () => {
    expect(remapWorkSlug('elhadji-malick-sy-fanajina')).toBe('fanajjina')
    expect(remapWorkSlug('fanajjina')).toBe('fanajjina')
  })

  it('reporte les identifiants numériques vers le schéma local', () => {
    expect(remapVerseId('elhadji-malick-sy-fanajina', '2229')).toBe('fanajjina-c1-v1')
    expect(remapVerseId('elhadji-malick-sy-fanajina', '2246')).toBe('fanajjina-c1-v18')
  })

  it('ramène les deux hémistiches d’Abada Buruqun au même couplet', () => {
    expect(remapVerseId('elhadji-malick-sy-abada-buruqun', '2103')).toBe(
      'abada-buruqun-tahta-junhi-zalami-c1-v1',
    )
    expect(remapVerseId('elhadji-malick-sy-abada-buruqun', '2104')).toBe(
      'abada-buruqun-tahta-junhi-zalami-c1-v1',
    )
    /* La basmala (2103) n'a pas de couplet propre : elle retombe sur le
       premier. Le couplet local 1 réunit les hémistiches 2104 et 2105. */
    expect(remapVerseId('elhadji-malick-sy-abada-buruqun', '2105')).toBe(
      'abada-buruqun-tahta-junhi-zalami-c1-v1',
    )
    expect(remapVerseId('elhadji-malick-sy-abada-buruqun', '2106')).toBe(
      'abada-buruqun-tahta-junhi-zalami-c1-v2',
    )
    expect(remapVerseId('elhadji-malick-sy-abada-buruqun', '2228')).toBe(
      'abada-buruqun-tahta-junhi-zalami-c1-v63',
    )
  })

  it('reporte un ancien identifiant local vers un identifiant numérique', () => {
    expect(
      remapVerseId(
        'abuna-abu-bakrin-wa-in-kana-fi-l-qabri',
        'abuna-abu-bakrin-wa-in-kana-fi-l-qabri-c1-v1',
      ),
    ).toBe('265')
  })

  it('dédoublonne favoris, progression et historique', () => {
    const state = remapLibraryState({
      favorites: ['serigne-babacar-sy-ya-qutbu', 'ya-qutbu', 'autre-burdu'],
      progress: {
        'serigne-babacar-sy-ya-qutbu': { verseId: '3745', chapter: 1, updatedAt: 10 },
        'ya-qutbu': { verseId: 'ya-qutbu-c1-v1', chapter: 1, updatedAt: 20 },
      },
      history: [
        { slug: 'serigne-babacar-sy-ya-qutbu', verseId: '3745', chapter: 1, updatedAt: 10 },
        { slug: 'ya-qutbu', verseId: 'ya-qutbu-c1-v1', chapter: 1, updatedAt: 20 },
        { slug: 'autre-burdu', verseId: '3399', updatedAt: 15 },
      ],
    })

    expect(state.favorites).toEqual(['ya-qutbu', 'autre-burdu'])
    expect(state.progress['ya-qutbu']?.verseId).toBe('ya-qutbu-c1-v1')
    expect(state.progress['serigne-babacar-sy-ya-qutbu']).toBeUndefined()
    expect(state.history.map((entry) => entry.slug)).toEqual(['ya-qutbu', 'autre-burdu'])
  })
})
