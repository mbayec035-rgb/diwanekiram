import { describe, expect, it } from 'vitest'
import {
  buildQuiz,
  buildStudyPath,
  isStudyable,
  normalizeAnswer,
  scoreAnswer,
  splitForCompletion,
  studyMilestones,
  type StudyVerse,
} from './quiz'

function makeVerse(partial: Partial<StudyVerse> & { id: string }): StudyVerse {
  return {
    slug: 'xassida-a',
    xassidaName: 'Xassida A',
    authorName: 'Auteur A',
    chapter: 1,
    n: 1,
    ar: 'أَمِنْ تَذَكُّرِ جِيرَانٍ بِذِي سَلَمٍ مَزَجْتَ دَمْعًا',
    tr: 'amin tadhakkuri jiran',
    fr: 'Est-ce par souvenir',
    ...partial,
  }
}

/* Chaque verset porte un texte distinct : le quiz de complétion a besoin
   de fins suffisamment différentes pour éviter des propositions redondantes. */
const ARABIC: string[] = [
  'أَمِنْ تَذَكُّرِ جِيرَانٍ بِذِي سَلَمٍ مَزَجْتَ دَمْعًا كَالشَّمَدِ',
  'وَلِلشَّيْبِ فَاةٌ قَبْلَ مَوْتِهَا وَالطَّيِّبَاتُ حُمَّى',
  'سَقَاهُما حُبٌّ فَسَقَاهَا وَأَشْرَقَ البَابُ وَالطُّرُفُ',
  'يَا رَبِّ إِنِّي لَدَيْكَ مُهْتَدٍ وَأَنْتَ خَيْرُ الوَارِثِينَ',
  'أَقِمِ الصَّلَاةَ لِذِكْرِي وَشَاكِي الْعُسْرِ وَالضَّرَّاءِ',
  'إِنَّ رَبَّنَا لَغَفُورٌ رَّحِيمٌ وَكَانَ بِالْعِبَادِ خَرِيرًا',
  'نَادَانِي أَنْ تَأْتِيَ وَأَنْتَ مُقْرٌّ بِالطَّاعُونِ',
  'وَاسْتَبِقُوا إِلَى الْمَغْفِرَةِ مِنْ رَبِّكُمْ وَجَنَّةٍ عَرْضُهَا',
]

const CORPUS: StudyVerse[] = ARABIC.map((ar, index) =>
  makeVerse({
    id: `${index + 1}`,
    ar,
    chapter: index < 4 ? 1 : 2,
    n: (index % 4) + 1,
    slug: `xassida-${String.fromCharCode(97 + (index % 3))}`,
    xassidaName: `Xassida ${String.fromCharCode(65 + (index % 3))}`,
    authorName: `Auteur ${String.fromCharCode(65 + (index % 3))}`,
  }),
)

/** Générateur déterministe pour rendre les séries reproductibles. */
function seededRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

describe('isStudyable', () => {
  it('exige de l’arabe et au moins une couche d’appui', () => {
    expect(isStudyable(makeVerse({ id: 'a' }))).toBe(true)
    expect(isStudyable(makeVerse({ id: 'b', ar: '   ' }))).toBe(false)
    expect(isStudyable(makeVerse({ id: 'c', tr: '', fr: '' }))).toBe(false)
  })

  it('accepte une traduction sans transcription', () => {
    expect(isStudyable(makeVerse({ id: 'd', tr: '', fr: 'traduit' }))).toBe(true)
  })
})

describe('buildStudyPath', () => {
  it('conserve tous les versets utilisables', () => {
    const path = buildStudyPath(CORPUS)
    expect(path).toHaveLength(CORPUS.length)
    expect(new Set(path.map((verse) => verse.id)).size).toBe(CORPUS.length)
  })

  it('ignore les versets sans contenu exploitable', () => {
    const path = buildStudyPath([...CORPUS, makeVerse({ id: 'x', ar: '' })])
    expect(path.map((verse) => verse.id)).not.toContain('x')
  })

  it('entrelace les chapitres', () => {
    const path = buildStudyPath(CORPUS)
    const chapters = path.map((verse) => verse.chapter)
    expect(chapters[0]).toBe(1)
    expect(chapters[1]).toBe(2)
    expect(chapters.filter((chapter) => chapter === 1)).toHaveLength(4)
  })

  it('trie les numéros de verset à l’intérieur d’un chapitre', () => {
    const path = buildStudyPath([
      makeVerse({ id: 'b', chapter: 1, n: 2 }),
      makeVerse({ id: 'a', chapter: 1, n: 1 }),
    ])
    expect(path.map((verse) => verse.n)).toEqual([1, 2])
  })
})

describe('studyMilestones', () => {
  it('propose des jalons proportionnels', () => {
    expect(studyMilestones(40)).toEqual([4, 10, 20, 30])
  })

  it('ignore les parcours trop courts', () => {
    expect(studyMilestones(3)).toEqual([])
  })
})

describe('splitForCompletion', () => {
  it('découpe en gardant au moins deux mots de chaque côté', () => {
    const parts = splitForCompletion('un deux trois quatre cinq six')
    expect(parts).not.toBeNull()
    expect(parts!.prefix.split(' ').length).toBeGreaterThanOrEqual(2)
    expect(parts!.suffix.split(' ').length).toBeGreaterThanOrEqual(2)
  })

  it('rejette les textes trop courts', () => {
    expect(splitForCompletion('un deux')).toBeNull()
  })

  it('reconstitue le texte d’origine', () => {
    const text = 'أَمِنْ تَذَكُّرِ جِيرَانٍ بِذِي سَلَمٍ مَزَجْتَ دَمْعًا'
    const parts = splitForCompletion(text)!
    expect(`${parts.prefix} ${parts.suffix}`).toBe(text)
  })
})

describe('buildQuiz', () => {
  it('produit des questions avec des propositions uniques contenant la réponse', () => {
    const questions = buildQuiz(CORPUS, { count: 5, random: seededRandom(7) })
    expect(questions.length).toBeGreaterThan(0)
    for (const question of questions) {
      expect(new Set(question.options).size).toBe(question.options.length)
      expect(question.options).toContain(question.answer)
      expect(question.options).not.toContain('')
    }
  })

  it('mode suite : propose la fin du verset, pas le nom de l’œuvre', () => {
    const questions = buildQuiz(CORPUS, { count: 8, mode: 'suite', random: seededRandom(3) })
    expect(questions.length).toBeGreaterThan(0)
    for (const question of questions) {
      const parts = splitForCompletion(question.verse.ar)!
      expect(question.prefix).toBe(parts.prefix)
      expect(question.answer).toBe(parts.suffix)
      expect(question.answer).not.toBe(question.answerName)
    }
  })

  it('mode auteur : affiche le verset entier et attend le nom de l’œuvre', () => {
    const questions = buildQuiz(CORPUS, { count: 8, mode: 'auteur', random: seededRandom(3) })
    expect(questions.length).toBeGreaterThan(0)
    for (const question of questions) {
      expect(question.prefix).toBe(question.verse.ar)
      expect(question.answer).toBe(question.verse.xassidaName)
    }
  })

  it('ne présente l’œuvre attendue qu’une seule fois', () => {
    const questions = buildQuiz(CORPUS, { count: 8, mode: 'auteur', random: seededRandom(11) })
    expect(questions.length).toBeGreaterThan(0)
    for (const question of questions) {
      expect(question.options.filter((option) => option === question.answer)).toHaveLength(1)
    }
  })

  it('tire les mauvaises fins d’autres versets', () => {
    const suffixes = new Set(CORPUS.map((verse) => splitForCompletion(verse.ar)!.suffix))
    const questions = buildQuiz(CORPUS, { count: 8, mode: 'suite', random: seededRandom(11) })
    expect(questions.length).toBeGreaterThan(0)
    for (const question of questions) {
      for (const option of question.options) expect(suffixes.has(option)).toBe(true)
    }
  })

  it('respecte le nombre demandé sans dépasser le corpus', () => {
    expect(buildQuiz(CORPUS, { count: 3, random: seededRandom(1) }).length).toBeLessThanOrEqual(3)
    expect(buildQuiz(CORPUS, { count: 99, random: seededRandom(1) }).length).toBeLessThanOrEqual(
      CORPUS.length,
    )
  })

  it('ignore les versets trop courts pour être complétés', () => {
    const questions = buildQuiz([makeVerse({ id: 'court', ar: 'أَمِنْ دَمْعٍ' })], {
      random: seededRandom(2),
    })
    expect(questions).toHaveLength(0)
  })

  it('donne des séries reproductibles à random fixé', () => {
    const first = buildQuiz(CORPUS, { count: 4, random: seededRandom(42) })
    const second = buildQuiz(CORPUS, { count: 4, random: seededRandom(42) })
    expect(first.map((question) => question.id)).toEqual(second.map((question) => question.id))
  })
})

describe('normalizeAnswer', () => {
  it('ignore casse, accents et ponctuation', () => {
    expect(normalizeAnswer('  Xassida,  A! ')).toBe(normalizeAnswer('xassida a'))
  })
})

describe('scoreAnswer', () => {
  const [suite] = buildQuiz(CORPUS, { count: 1, random: seededRandom(5) })
  const [auteur] = buildQuiz(CORPUS, { count: 1, mode: 'auteur', random: seededRandom(5) })

  it('accepte la bonne œuvre en mode auteur', () => {
    expect(scoreAnswer(auteur, auteur.answer)).toBe(true)
    expect(scoreAnswer(auteur, 'Autre œuvre')).toBe(false)
  })

  it('tolère la ponctuation en mode suite', () => {
    expect(scoreAnswer(suite, `${suite.answer} `)).toBe(true)
    expect(scoreAnswer(suite, 'Autre œuvre')).toBe(false)
  })

  it('refuse une réponse vide', () => {
    expect(scoreAnswer(suite, null)).toBe(false)
    expect(scoreAnswer(suite, '')).toBe(false)
  })
})