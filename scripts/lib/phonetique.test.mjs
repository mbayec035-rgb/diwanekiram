import { describe, expect, it } from 'vitest'

import { transliterate, transliterateVerse, inspectVerse, tokenise, wordsOf } from './phonetique.mjs'

/* La règle se lit dans ces cas : chacun d'eux est une phrase qu'on peut
   lire à voix haute et dire si elle est juste. */
const CAS = [
  /* l'article */
  ['ٱلْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', 'l-ḥamdu llāhi rabbi l-ʿālamīna'],
  ['سُبْحَانَ ذِي الْمُلْكِ', 'subḥāna dhī l-mulki'],
  ['ٱلرَّحْمَٰنِ الرَّحِيمِ', 'r-raḥmāni r-raḥīmi'],
  ['ٱلَّذِي قَدْ قَالَ', 'lladhī qad qāla'],
  ['وَٱللَّهِ', 'wallāhi'],
  ['بِالْحَبِيبِ', 'bil-ḥabībi'],
  ['لِلْإِلَهِ', 'lil-ʾilahi'],

  /* mater et longueur */
  ['يَا أَمَلِي', 'yā ʾamalī'],
  ['مَا شَاءَ اللَّهُ', 'mā shāʾa llāhu'],
  ['إِلَّا بِاللَّهِ', 'ʾillā billāhi'],
  ['أُنْثَىٰ', 'ʾunthā'],
  ['لَا يُسْأَلُ', 'lā yusʾalu'],

  /* gémination */
  ['إِنَّ الدِّينَ', 'ʾinna d-dīna'],
  ['رَبِّ الْعَالَمِينَ', 'rabbi l-ʿālamīna'],
  ['قُوَّةَ', 'quwwata'],

  /* tanwīn : elle ne se prononce pas */
  ['وَمَلِكٌ مُقَدَّرٌ', 'wamaliku muqaddaru'],
  ['بُرُوقٌ', 'burūqu'],

  /* tāʾ marbūṭa */
  /* La tāʾ marbūṭa finale sans signe ne se prononce pas ; avec un
     signe, elle se dit « t ». */
  ['رَحْمَة', 'raḥma'],
  ['حُكْمَة', 'ḥukma'],
  ['أُخْتَة', 'ʾukhta'],
  ['أُخْتَةٍ', 'ʾukhtati'],

  /* hamza */
  ['أَبَدَا بُرُوقٌ', 'ʾabadā burūqu'],
  ['الْأَرْضِ', 'l-ʾarḍi'],
  ['مُسْتَعِدّ', 'mustaʿʿid'],

  /* waw et fa se collent */
  ['وَجْهُ مَيَّةَ', 'wajhu mayyata'],
  /* Le sukun de l'arrêt se respecte : « faballigh ». */
  ['فَبَلِّغْ', 'faballigh'],

  /* ponctuation et chiffres */
  ['أَمْ وَجْهُ مَيَّةَ أَمْ رُبُوعُ شَمَامِ؟', 'ʾam wajhu mayyata ʾam rubūʿu shamāmi?'],
  ['الفَصْلُ ٢', 'l-faṣlu 2'],
]

describe('transliterate', () => {
  it.each(CAS)('transcrit %s', (arabe, attendu) => {
    expect(transliterate(arabe).latin).toBe(attendu)
  })

  it('minuscules, sans espace double', () => {
    expect(transliterate('الْحَمْدُ  لِلَّهِ').latin).toBe('l-ḥamdu llāhi')
  })
})

describe('drapeaux', () => {
  it('refuse un verset sans vocalisation', () => {
    const { flags, blocked } = inspectVerse('والرأي سائس ما يأتيه من كلم')
    expect(blocked).toBe(true)
    expect(flags).toContain('sans-harakat')
    expect(transliterateVerse('والرأي سائس ما يأتيه من كلم')).toBeNull()
  })

  it('refuse les digraphes wolofs', () => {
    const wolof = 'مَنْصُورُ سَنْتَلْ يَالَ ݖـَنْتَ گـُ ݧـَـݒَ خَمْ'
    expect(transliterateVerse(wolof)).toBeNull()
    expect(transliterate(wolof).flags).toContain('wolof')
  })

  it('signale un ornement sans le refuser', () => {
    const { latin, flags, blocked } = inspectVerse('﴿وَاتُوا البُيُوتَ﴾')
    expect(blocked).toBe(false)
    expect(latin).toBe('(wātū l-buyūta)')
    expect(flags).toContain('ornement')
  })

  it('note une vocalisation déduite sans bloquer', () => {
    // أَفِى : le fâ' ne porte aucun signe, c'est la mater nue qui le dit.
    const { latin, flags, blocked } = inspectVerse('أَفى')
    expect(blocked).toBe(false)
    expect(latin).toBe('ʾafī')
    expect(flags).toContain('harakat-déduite')
  })

  it('ne met pas de voyelle sur une lettre qui ouvre la syllabe', () => {
    // عِندَ : le nūn ne porte pas de voyelle, c'est le dāl qui la porte.
    expect(transliterate('عِندَ').latin).toBe('ʿinda')
  })

  it('ne devine pas une voyelle que rien ne dit', () => {
    // Un « قد » sans signe : « qadd » ou « qad », la règle refuse.
    expect(transliterateVerse('لم يَكُنْ قَد')).toBeNull()
  })

  it('refuse un mot sans aucune vocalisation', () => {
    expect(transliterateVerse('کیتاب')).toBeNull()
    expect(transliterate('کیتاب').flags).toContain('sans-harakat')
  })

  it('ne confond pas la gémination de l’article avec le مَدّ', () => {
    expect(transliterate('الدِّينَ').latin).toBe('d-dīna')
    expect(transliterate('مُقَدَّرٌ').latin).toBe('muqaddaru')
  })

  it('déduit la mater quand elle est nue', () => {
    // فِى se dit « fī » grâce au kasra, فَاتِح « fātiḥa » grâce à la mater.
    expect(transliterate('فِى').latin).toBe('fī')
    expect(transliterate('فَاتِحَ').latin).toBe('fātiḥa')
    expect(transliterate('أَفى').latin).toBe('ʾafī')
  })

  it('déplie les ligatures pieuses', () => {
    expect(transliterate('ﷲ').latin).toBe('llāh')
    expect(transliterate('ﷺ').latin).toBe('ṣallā llāhu ʿalayhi wasallama')
  })

  it('garde la voyelle d’un alif nu en tête de mot', () => {
    // Longueur typo : l'alif nu de t��te de mot ne s'etait pas prononce.
    // ابْنَ se disait « bnu », اتَّمَرَتْ « ttamarat ».
    expect(transliterate('ابْنَ عُثْمَانَ').latin).toBe('abna ʿuthmāna')
    expect(transliterate('اتَّمَرَتْ').latin).toBe('attamarat')
    expect(transliterate('ٱضْطِرَابِ').latin).toBe('aḍṭirābi')
  })

  it('lit un mot muet quand une mater porte la voyelle', () => {
    expect(transliterate('فِي').latin).toBe('fī')
    expect(transliterate('لا').latin).toBe('lā')
    expect(transliterate('ما').latin).toBe('mā')
    expect(transliterate('يا').latin).toBe('yā')
  })

  it('lit un mot muet quand un siège de hamza porte la voyelle', () => {
    expect(transliterate('إنْ').latin).toBe('ʾin')
    expect(transliterate('أَنْ').latin).toBe('ʾan')
    expect(transliterate('إذْ').latin).toBe('ʾidh')
    expect(transliterate('أوْ').latin).toBe('ʾaw')
    expect(transliterate('اوْ').latin).toBe('aw')
  })

  it('refuse quand le siège et la mater se contredisent', () => {
    // إلى se dit ʾilā grâce au kasra du lām : absent, la machine ne le
    // surely invente pas.
    expect(transliterateVerse('حتى إلى')).toBeNull()
    expect(transliterateVerse('لم')).toBeNull()
    expect(transliterateVerse('على')).toBeNull()
    expect(transliterateVerse('الخير')).toBeNull()
  })
})

describe('kashida', () => {
  it('ne coupe pas le mot qu’elle prolonge', () => {
    // « الـ ـرحمن » est « الرحمن ».
    expect(transliterate('بِالْـ ـإِكْرَامِ').latin).toBe('bil-ʾikrāmi')
    expect(transliterate('عَلَيْنَا').latin).toBe('ʿalaynā')
    expect(transliterate('عَلَيْهِ').latin).toBe('ʿalayhi')
    expect(transliterate('وَأَنْـ ـتَ').latin).toBe('waʾanta')
  })

  it('laisse l’espace quand la kashida est dans le mot', () => {
    expect(transliterate('الرَّحْمَـٰنِ الرَّحِيمِ').latin).toBe('r-raḥmāni r-raḥīmi')
  })

  it('ne tokens plus les mots', () => {
    const mots = wordsOf(tokenise('الرَّحْمَـٰنِ الرَّحِيمِ'))
    expect(mots).toHaveLength(2)
  })
})

describe('tokenise', () => {
  it('rattache les signes à la lettre qui les précède', () => {
    const mots = wordsOf(tokenise('جَاءَنَا'))
    expect(mots).toHaveLength(1)
    expect(mots[0].map((lettre) => lettre.base).join('')).toBe('جاءنا')
    expect(mots[0][0].marks.has('َ')).toBe(true)
  })

  it('déplie une ligature', () => {
    const mots = wordsOf(tokenise('ﷲ'))
    expect(mots[0].map((lettre) => lettre.base).join('')).toBe('الله')
  })

  it('reconnaît les caractères persans', () => {
    expect(transliterate('کِتَاب').latin).toBe('kitāb')
  })
})