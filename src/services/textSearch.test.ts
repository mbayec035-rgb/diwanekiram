import { describe, expect, it } from 'vitest'
import {
  buildTextIndex,
  excerptAround,
  normalizeQuery,
  normalizeWithOrigins,
  searchIndex,
  segmentBlocks,
  segmentLayers,
} from './textSearch'
import type { Verse } from '../types/domain'

const TOUTES = { arabic: true, transcription: true, translation: true }

function verse(n: number, over: Partial<Verse> = {}): Verse {
  return { id: `v-${n}`, n, ar: '', tr: '', ...over }
}

describe('normalizeQuery — arabe', () => {
  it('retire les voyelles', () => {
    /* الْحَمْدُ = ال + sukun + ح + fatha + م + sukun + د + damma */
    expect(normalizeQuery('الْحَمْدُ')).toBe('الحمد')
  })

  it('retire le tatweel', () => {
    expect(normalizeQuery('كــــتــاب')).toBe('كتاب')
  })

  it('unifie les variantes de l’alef', () => {
    /* أ إ آ ا ٱ doivent tous produire ا */
    for (const char of ['أ', 'إ', 'آ', 'ا', 'ٱ']) {
      expect(normalizeQuery(char)).toBe('ا')
    }
  })

  it('normalise ى → ي, ة → ه, ؤ → و, ئ → ي', () => {
    expect(normalizeQuery('على')).toBe('علي')
    expect(normalizeQuery('رحمة')).toBe('رحمه')
    expect(normalizeQuery('مسؤول')).toBe('مسوول')
    expect(normalizeQuery('سؤال')).toBe('سوال')
    expect(normalizeQuery('سيئ')).toBe('سيي')
  })

  it('trouve un mot vocalisé en le cherchant sans voyelles', () => {
    expect(normalizeQuery('الحمد').includes(normalizeQuery('الْحَمْدُ'))).toBe(true)
  })

  it('écrase les espaces multiples', () => {
    expect(normalizeQuery('  السلام   عليكم ')).toBe('السلام عليكم')
  })
})

describe('normalizeQuery — latin', () => {
  it('ignore la casse et les accents', () => {
    expect(normalizeQuery('Al-Hamdu')).toBe(normalizeQuery('al hamdu'))
  })

  it('traite les macrons comme des accents', () => {
    /* l-'ījādi doit se normaliser comme l-ijadi */
    expect(normalizeQuery('ījādi')).toBe(normalizeQuery('ijadi'))
  })

  it('traite le h sous-pointé comme un h', () => {
    expect(normalizeQuery('ḥamdu')).toBe(normalizeQuery('hamdu'))
  })

  it('retire l’ayn et les apostrophes', () => {
    expect(normalizeQuery("d'ʿilm")).toBe(normalizeQuery('dilm'))
  })

  it('sépare les mots collés par un trait d’union', () => {
    expect(normalizeQuery('bi-wujūdi')).toBe('bi wujudi')
  })

  it('garde les chiffres', () => {
    expect(normalizeQuery('bayt 12')).toBe('bayt 12')
  })
})

describe('normalizeWithOrigins — table de correspondance', () => {
  it('renvoie autant d’origines que de caractères normalisés', () => {
    const { text, origins } = normalizeWithOrigins('الْحَمْدُ')
    expect(origins).toHaveLength(text.length)
  })

  it('pointe vers le bon caractère d’origine malgré les voyelles', () => {
    const source = 'كَتَبَ'
    const { origins } = normalizeWithOrigins(source)

    /* Le texte normalisé fait 3 caractères ; ils viennent des 1er, 3e et 5e. */
    expect(source[origins[0].start]).toBe('ك')
    expect(source[origins[1].start]).toBe('ت')
    expect(source[origins[2].start]).toBe('ب')
  })

  it('reste juste avec un caractère hors BMP', () => {
    const source = 'a\u{1F600}b'
    const { text, origins } = normalizeWithOrigins(source)

    /* L’émoji devient un séparateur, mais les lettres gardent leur place. */
    expect(text).toBe('a b')
    expect(source.slice(origins[0].start, origins[0].end)).toBe('a')
    expect(source.slice(origins[2].start, origins[2].end)).toBe('b')
  })
})

describe('buildTextIndex', () => {
  const vers = [
    { verse: verse(1, { ar: 'الْحَمْدُ لِلَّهِ' }), chapterN: 1 },
    { verse: verse(2, { ar: 'مُمِدِّنَا بِوُجُودِ' }), chapterN: 1 },
    { verse: verse(3, { ar: 'الْحَمْدُ' }), chapterN: 2 },
  ]

  it('n’indexe que les colonnes affichées', () => {
    const index = buildTextIndex(vers, undefined, { arabic: false, transcription: false, translation: false })
    expect(index.entries).toHaveLength(0)
  })

  it('indexe les chapitres, pas seulement le premier', () => {
    const found = searchIndex(buildTextIndex(vers, undefined, TOUTES), 'الحمد')
    expect(found).toEqual([0, 2])
  })

  it('ignore une couche masquée', () => {
    const avec = [{ verse: verse(1, { tr: 'l-hamdu' }), chapterN: 1 }]
    const ouvert = buildTextIndex(avec, undefined, TOUTES)
    const masque = buildTextIndex(avec, undefined, { ...TOUTES, transcription: false })

    expect(searchIndex(ouvert, 'hamdu')).toHaveLength(1)
    expect(searchIndex(masque, 'hamdu')).toHaveLength(0)
  })

  it('cherche dans la traduction quand elle est affichée', () => {
    const avec = [{ verse: verse(1, { ar: 'الحمد' }), chapterN: 1 }]
    const translations = { 'v-1': 'Louange à Dieu' }

    expect(searchIndex(buildTextIndex(avec, translations, TOUTES), 'louange')).toHaveLength(1)
    expect(
      searchIndex(buildTextIndex(avec, translations, { ...TOUTES, translation: false }), 'louange'),
    ).toHaveLength(0)
  })

  it('indexe les deux hémistiches séparément', () => {
    const avec = [{ verse: verse(1, { ar: 'الم.alpha', sadr: 'الشَّمْسُ', adj: 'القَمَرُ' }), chapterN: 1 }]
    const index = buildTextIndex(avec, undefined, TOUTES)

    expect(index.entries[0].layers).toHaveLength(2)
    expect(searchIndex(index, 'الشمس')).toHaveLength(1)
    expect(searchIndex(index, 'القمر')).toHaveLength(1)
  })

  it('exige tous les termes d’une requête à plusieurs mots', () => {
    const index = buildTextIndex(vers, undefined, TOUTES)
    expect(searchIndex(index, 'الحمد لله')).toHaveLength(1)
    expect(searchIndex(index, 'الحمد وداعا')).toHaveLength(0)
  })

  it('renvoie rien pour une requête vide', () => {
    expect(searchIndex(buildTextIndex(vers, undefined, TOUTES), '   ')).toEqual([])
  })
})

describe('segmentLayers — surlignage', () => {
  it('découpe autour de l’occurrence et garde le texte intact', () => {
    const segments = segmentLayers([{ layer: 'arabe', text: 'الْحَمْدُ لِلَّهِ' }], 'الحمد')

    expect(segments.map((s) => s.text).join('')).toBe('الْحَمْدُ لِلَّهِ')
    expect(segments.filter((s) => s.id !== null)).toHaveLength(1)
  })

  it('ne confond pas les deux hémistiches d’un même layer', () => {
    /* Les deux blocs sont un seul layer « arabe ». Les aplatir mettrait le
       premier hémistiche dans les deux colonnes. */
    const blocs = segmentBlocks(
      [
        { layer: 'arabe', text: 'الْحَمْدُ' },
        { layer: 'arabe', text: 'لِلَّهِ رَبِّ' },
      ],
      'الحمد',
    )

    expect(blocs).toHaveLength(2)
    expect(blocs[0].filter((s) => s.id !== null).map((s) => s.text)).toEqual(['الْحَمْدُ'])
    expect(blocs[1].filter((s) => s.id !== null)).toHaveLength(0)
  })

  it('conserve l’ordre des blocs, même sans occurrence', () => {
    const blocs = segmentBlocks(
      [
        { layer: 'arabe', text: 'السَّلامُ' },
        { layer: 'transcription', text: 'as-salāmu' },
      ],
      'الحمد',
    )

    expect(blocs.map((b) => b.map((s) => s.text).join(''))).toEqual(['السَّلامُ', 'as-salāmu'])
  })

it('donne à l’occurrence le texte vocalisé, pas sa version normalisée', () => {
    const segments = segmentLayers([{ layer: 'arabe', text: 'الْحَمْدُ' }], 'الحمد')
    const mark = segments.find((s) => s.id !== null)
    /* Les voyelles d'origine sont là : la damma finale fait partie du mot. */
    expect(mark?.text).toBe('الْحَمْدُ')
  })

it('inclut les voyelles intérieures dans le surlignage', () => {
    const segments = segmentLayers([{ layer: 'arabe', text: 'الْحَمْدُ لِلَّهِ' }], 'الحمد')
    expect(segments.find((s) => s.id !== null)?.text).toBe('الْحَمْدُ')
  })

it('surligne la couche qui contient le mot, pas les autres', () => {
    /* « hamd » est latin : il ne touche que la transcription. */
    const segments = segmentLayers(
      [
        { layer: 'arabe', text: 'الْحَمْدُ' },
        { layer: 'transcription', text: 'l-hamdu' },
      ],
      'hamd',
    )

    expect(segments.filter((s) => s.id !== null).map((s) => s.layer)).toEqual(['transcription'])
  })

it('surligne l’arabe et la transcription avec deux requêtes', () => {
    const segments = segmentLayers(
      [
        { layer: 'arabe', text: 'الْحَمْدُ' },
        { layer: 'transcription', text: 'l-hamdu' },
      ],
      'الحمد hamd',
    )

    expect(segments.filter((s) => s.id !== null).map((s) => s.layer)).toEqual(['arabe', 'transcription'])
  })

  it('n’applique pas une requête française à une ligne vocalisée', () => {
    const segments = segmentLayers([{ layer: 'arabe', text: 'الْحَمْدُ' }], 'hamdu')
    expect(segments.every((s) => s.id === null)).toBe(true)
  })

  it('donne un identifiant distinct à chaque occurrence', () => {
    const segments = segmentLayers([{ layer: 'arabe', text: 'الحمد الحمد' }], 'الحمد')
    const ids = segments.filter((s) => s.id !== null).map((s) => s.id)
    expect(ids).toEqual(['arabe:0', 'arabe:1'])
  })

  it('ne produit pas de balises imbriquées sur des termes qui se recouvrent', () => {
    const segments = segmentLayers([{ layer: 'traduction', text: 'remplir' }], 'remplir empli')
    const marks = segments.filter((s) => s.id !== null)

    /* Un seul « empli » et un seul « remplir » : deux segments qui ne se
       chevauchent pas. */
    expect(marks).toHaveLength(1)
    expect(marks[0].text).toBe('remplir')
  })

  it('renvoie le texte entier quand rien ne correspond', () => {
    const segments = segmentLayers([{ layer: 'arabe', text: 'السَّلامُ' }], 'الحمد')
    expect(segments).toHaveLength(1)
    expect(segments[0].id).toBeNull()
  })
})

describe('excerptAround', () => {
  it('centre l’extrait sur l’occurrence', () => {
    const source = `${'x'.repeat(80)} mot cible ${'y'.repeat(80)}`
    const extrait = excerptAround(source, 'cible', 20)

    expect(extrait).toContain('cible')
    expect(extrait.startsWith('…')).toBe(true)
    expect(extrait.endsWith('…')).toBe(true)
  })

  it('tombe sur le début du texte sans occurrence', () => {
    const extrait = excerptAround('a'.repeat(200), 'zzz', 10)
    expect(extrait.startsWith('…')).toBe(false)
    expect(extrait).toBe('a'.repeat(20))
  })
})