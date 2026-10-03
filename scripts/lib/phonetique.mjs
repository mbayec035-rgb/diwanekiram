/* ------------------------------------------------------------------
   Transcription phonétique de l'arabe en latin.

   Le corpus est vocalisé : c'est cette vocalisation qui porte le
   travail. Une règle de prononciation appliquée lettre par lettre,
   harakat par harakat, produit la même famille de transcription que
   les 2 420 versets déjà transcrits par la source — minuscules,
   macrons ā ī ū, ʿ pour l'ayn, ḥ ṣ ṭ ẓ ḍ, l- pour l'article,
   apostrophe pour le hamza :

     وَٱللَّهِ        ->  wallāhi
     الرَّحْمَٰنِ     ->  r-raḥmāni
     سُبْحَانَ ذِي    ->  subḥāna dhī
     بِالْحَبِيبِ     ->  bil-ḥabībi
     إِلَّا          ->  illā

   Trois principes, appliqués dans cet ordre :

     1. une voyelle n'est longue que si l'arabe la déclare longue :
        une mater nue (ا و ي ى sans signe) la suit, ou l'alif porte
        le maddah, ou c'est un yā final. Sinon elle est courte ;
     2. la tanwīn ne se prononce pas : elle disparaît, la voyelle qui
        la portait reste courte ;
     3. un verset que la règle ne sait pas rendre proprement est
        refusé, avec son drapeau. Une transcription à moitié faite est
        pire qu'absente : la première se relit, la seconde se propage.

   Module pur, sans I/O ni réseau, testé par
   scripts/lib/phonetique.test.mjs.
------------------------------------------------------------------ */

import { clean } from './catalogue.mjs'

/* ------------------------------------------------------------------ *
 * Alphabet
 * ------------------------------------------------------------------ */

const FATHA = 'َ'
const DAMMA = 'ُ'
const KASRA = 'ِ'
const FATHA_TANWIN = 'ً'
const DAMMA_TANWIN = 'ٌ'
const KASRA_TANWIN = 'ٍ'
const SHADDA = 'ّ'
const SUKUN = 'ْ'
const MADDAH = 'ٓ'
const DAGGER_ALEF = 'ٰ'
const SMALL_WAW = 'ۥ'
const SMALL_YEH = 'ۦ'
const WAQF = /[ۖ-ۭ]/

/* Ce qui dit vraiment comment une lettre se prononce. Le sukun et la
   shadda ne disent pas quelle voyelle porter. */
const VOWEL_MARKS = new Set([
  FATHA,
  DAMMA,
  KASRA,
  FATHA_TANWIN,
  DAMMA_TANWIN,
  KASRA_TANWIN,
  MADDAH,
  DAGGER_ALEF,
])

const MARKS = new Set([
  FATHA,
  DAMMA,
  KASRA,
  FATHA_TANWIN,
  DAMMA_TANWIN,
  KASRA_TANWIN,
  SHADDA,
  SUKUN,
  MADDAH,
  DAGGER_ALEF,
  SMALL_WAW,
  SMALL_YEH,
])

const VOWEL_OF = {
  [FATHA]: 'a',
  [DAMMA]: 'u',
  [KASRA]: 'i',
  [FATHA_TANWIN]: 'a',
  [DAMMA_TANWIN]: 'u',
  [KASRA_TANWIN]: 'i',
  [SMALL_WAW]: 'u',
  [SMALL_YEH]: 'i',
}

const TANWIN = new Set([FATHA_TANWIN, DAMMA_TANWIN, KASRA_TANWIN])

/* Consonnantes. La tāʾ marbūṭa est à part : sa prononciation dépend
   de la lettre qui la précède. */
const CONSONANT = {
  ب: 'b',
  ت: 't',
  ث: 'th',
  ج: 'j',
  ح: 'ḥ',
  خ: 'kh',
  د: 'd',
  ذ: 'dh',
  ر: 'r',
  ز: 'z',
  س: 's',
  ش: 'sh',
  ص: 'ṣ',
  ض: 'ḍ',
  ط: 'ṭ',
  ظ: 'ẓ',
  ع: 'ʿ',
  غ: 'gh',
  ف: 'f',
  ق: 'q',
  ك: 'k',
  گ: 'g',
  ل: 'l',
  م: 'm',
  ن: 'n',
  ه: 'h',
  و: 'w',
  ي: 'y',
  ى: 'y',
  ة: 'h',
}

/* Porteuses de hamza : elles portent une voyelle et s'écrivent avec
   l'apostrophe, comme « l-ʾakwāni ». Alif wasla et alif madda sont
   des maters : voir plus bas. */
const CARRIER = {
  أ: 'a',
  /* Le madda ne se met que sur un alif hamzé : c'est lui qui le dit. */
  آ: 'ā',
  إ: 'i',
  ؤ: 'u',
  ئ: 'i',
  ء: null,
}

/* Maters : lettres muettes qui allongent la voyelle qui les précède.
   ا n'est jamais une consonnante, on ne le rencontre pas seul. */
const MATER = new Set(['ا', 'و', 'ي', 'ى', 'آ', 'ٱ'])

/* Lettres solaires : l'article s'y assimile, et la tāʾ marbūṭa s'y
   prononce « t ». */
const SOLAR = new Set(['ت', 'ث', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ن'])

/* Lettres qui s'assimilent à l'article : « r-raḥmāni », « sh-shamsi ».
   Le lām s'y range aussi : ال + ل donne « ll- », la gémination. */
const SUN = {
  ت: 't',
  ث: 'th',
  د: 'd',
  ذ: 'dh',
  ر: 'r',
  ز: 'z',
  س: 's',
  ش: 'sh',
  ص: 'ṣ',
  ض: 'ḍ',
  ط: 'ṭ',
  ظ: 'ẓ',
  ن: 'n',
  ل: 'l',
}

/* Consonnes à point : une lettre nue qui les suit s'y assimile. */
const POINTS = new Set('بتثجدذرزسشصضطظفقكني')

/* Proclitiques collés à l'article : بِالْـ se dit « bil- »,
   وَٱلْـ se dit « wal- », لِلْـ se dit « lil- ». Leur voyelle se garde,
   l'alif de l'article ne se prononce pas. */
const PROCLITIC = { ب: 'b', ك: 'k', و: 'w', ف: 'f', ل: 'l' }

/* Digraphes wolofs transcrits en caractères arabes : aucune lecture
   arabe ne les restitue, on les laisse à la main. */
const WOLOF = new Set(['ݒ', 'ݧ', 'ݖ'])

const PUNCTUATION = {
  '؟': '?',
  '،': ',',
  '؛': ';',
  '۔': '.',
  '﴿': '(',
  '﴾': ')',
  '«': '«',
  '»': '»',
  '‘': '‘',
  '’': '’',
  '“': '"',
  '”': '"',
  '"': '"',
  '–': '-',
  '—': '-',
  '٫': '.',
  '٬': ',',
  '(': '(',
  ')': ')',
  '[': '[',
  ']': ']',
  '.': '.',
  ',': ',',
  ';': ';',
  ':': ':',
  '!': '!',
  '?': '?',
  '-': '-',
  '…': '…',
}

const DIGIT = /[٠-٩]/

/* Les lettres persanes, les ligatures et quelques variantes typographiques
   sont ramenées à leur équivalent arabe : on transcrit la langue, pas le
   jeu de caractères. */
const FOLD = new Map([
  ['ٱ', 'ا'],
  ['ﷲ', 'اللّٰه'],
  ['ﷻ', 'جَلَّ'],
  ['ﷺ', 'صَلَّى اللّٰهُ عَلَيْهِ وَسَلَّمَ'],
  ['ﷲ', 'اللّٰه'],
  ['ﷻ', 'جَلَّ'],
  ['ک', 'ك'],
  ['ی', 'ي'],
  ['ے', 'ي'],
  ['ھ', 'ه'],
  ['ۀ', 'ة'],
  ['ۃ', 'ة'],
  ['ۂ', 'ه'],
  ['ۧ', SMALL_YEH],
  ['ۥ', SMALL_WAW],
])

/* ------------------------------------------------------------------ *
 * Découpage
 * ------------------------------------------------------------------ */

/**
 * Découpe un texte en unités : lettres porteuses de leurs signes,
 * espaces, ponctuation, chiffres, caractères inconnus.
 *
 * En arabe les signes suivent la lettre ; on les rattache donc à la
 * lettre précédente, et à la suivante seulement s'ils la précèdent.
 */
export function tokenise(value) {
  const tokens = []
  let last = null
  let pending = new Set()

  const letter = (base) => {
    const token = { kind: 'letter', base, marks: pending }
    pending = new Set()
    tokens.push(token)
    last = token
  }

  /* Une ligature se décompose en plusieurs lettres : on déplie d'abord,
     on découpe ensuite. */
  const chars = [...String(value).normalize('NFC')].flatMap((ch) => [...(FOLD.get(ch) ?? ch)])

  /* La kashida est un allongement : « الـ ـرحمن » est « الرحمن », elle ne
     coupe donc pas le mot qu'elle prolonge. Prise dans le mot, elle ne dit
     rien de l'espace qui suit : « الرَّحْمَـٰنِ الرَّحِيمِ » garde ses deux
     mots. */
  const lettres = []
  for (let index = 0; index < chars.length; index += 1) {
    const ch = chars[index]
    if (ch === 'ـ') continue
    if (/\s/.test(ch)) {
      let avant = index - 1
      while (avant >= 0 && /\s/.test(chars[avant])) avant -= 1
      let apres = index + 1
      while (apres < chars.length && /\s/.test(chars[apres])) apres += 1
      if (chars[avant] === 'ـ' || chars[apres] === 'ـ') continue
    }
    lettres.push(ch)
  }

  for (const ch of lettres) {
    if (ch === '') continue

    if (MARKS.has(ch) || WAQF.test(ch)) {
      if (last) last.marks.add(ch)
      else pending.add(ch)
      continue
    }

    if (/\s/.test(ch)) {
      last = null
      tokens.push({ kind: 'space' })
      continue
    }

    if (CONSONANT[ch] || MATER.has(ch) || ch in CARRIER) {
      letter(ch)
      continue
    }

    if (WOLOF.has(ch)) {
      last = null
      tokens.push({ kind: 'wolof', base: ch })
      continue
    }

    if (PUNCTUATION[ch]) {
      last = null
      tokens.push({ kind: 'punct', value: PUNCTUATION[ch] })
      continue
    }

    if (DIGIT.test(ch)) {
      last = null
      tokens.push({ kind: 'digit', value: String(ch.codePointAt(0) - 0x0660) })
      continue
    }

    last = null
    tokens.push({ kind: 'unknown', base: ch })
  }

  return tokens
}

/** Découpe en suites de lettres : un mot arabe est une suite de
    lettres, sans espace ni ponctuation. */
export function wordsOf(tokens) {
  const words = []
  let run = []

  for (const token of tokens) {
    if (token.kind === 'letter') {
      run.push(token)
      continue
    }
    if (run.length > 0) {
      words.push(run)
      run = []
    }
  }
  if (run.length > 0) words.push(run)

  return words
}

/* ------------------------------------------------------------------ *
 * Un mot
 * ------------------------------------------------------------------ */

function vowelOf(marks) {
  let vowel = null
  let tanwin = false

  for (const mark of marks) {
    if (TANWIN.has(mark)) tanwin = true
    const value = VOWEL_OF[mark]
    if (value) vowel = value
  }

  return { vowel, tanwin }
}

function longForm(vowel) {
  if (vowel === 'a') return 'ā'
  if (vowel === 'i') return 'ī'
  if (vowel === 'u') return 'ū'
  return vowel
}

/** Une mater nue : ni voyelle ni sukun — elle ne se prononce pas
    seule, elle allonge ce qui la précède. */
/**
 * Un mot entierement muet se lit malgre tout quand une mater ou un siege
 * de hamza porte la voyelle : في se dit « fī », إنْ « ʾin », لا « lā ». Au-dela, la lecture
 * est indecidable — من se dit min, man ou mun — et le mot est refuse.
 */
function determinee(run) {
  let consonnes = 0
  let cariers = 0
  let maters = 0

  for (const token of run) {
    if (token.base in CARRIER) {
      cariers += 1
      continue
    }
    if (MATER.has(token.base)) {
      maters += 1
      continue
    }
    consonnes += 1
  }

  /* Siege et mater ensemble : « اوْ » se dit « aw » — la mater prend la
     voyelle du siege. « إلى » se dit ʾilā, pas ʾilī : la kasra manque, on ne
     l'invente pas. */
  if (cariers > 0 && maters > 0) {
    return run.some((token) => MATER.has(token.base) && token.marks.has(SUKUN))
  }

  return consonnes <= 1
}

function isBareMater(token) {
  return Boolean(token) && token.kind === 'letter' && MATER.has(token.base) && token.marks.size === 0
}

/** Une mater signalée par l'alif dagger : « ثَىٰ » se dit « thā ». */
function isDaggerMater(token) {
  return (
    Boolean(token) &&
    token.kind === 'letter' &&
    (token.base === 'ى' || token.base === 'ي' || token.base === 'ا') &&
    token.marks.has(DAGGER_ALEF)
  )
}

/** Latine de la consonne, tāʾ marbūṭa comprise : elle se dit « t »
    après une mater ou une lettre solaire, « ḍ » après ḍ/ẓ, « h » après
    les autres — رَحْمَة « raḥma », حُكْمَة « ḥukma », خَيْرَة « khayra ». */
function consonantOf(run, index, tendu = true) {
  const base = run[index].base
  if (base !== 'ة') return (tendu ? emphatique(run, index) : null) ?? CONSONANT[base] ?? null

  const before = run[index - 1]?.base
  const before2 = run[index - 2]?.base

  if (before === 'ذ' || before === 'ض' || before === 'ظ') return 'ḍ'
  if (MATER.has(before) || MATER.has(before2)) return 't'
  if (SOLAR.has(before)) return 't'
  return 'h'
}

/**
 * Le مَدّ — la gémination qui tend la lettre — se repère à sa marque :
 * la lettre d'avant porte le tanwīn. مُقَدَّر « muqaddar » n'en a pas,
 * حَدَّ « haḍḍa » peut s'écrire sans elle : on ne tend alors rien.
 */
function emphatique(run, index) {
  const precedent = run[index - 1]
  const tanwin = Boolean(
    precedent && [...precedent.marks].some((mark) => mark.endsWith('ٌ') || mark === 'ً'),
  )
  if (!tanwin || !run[index].marks.has(SHADDA)) return null
  if (run[index].base === 'د') return 'ḍ'
  if (run[index].base === 'س') return 'ṣ'
  return null
}

/**
 * Une lettre nue s'assimile à la précédente quand elle est prise dans
 * une gémination : مُسْتَعِدّ « mustaʿʿid », رَجْعَ reste « rajʿa ».
 */
function assimilee(run, index) {
  const base = run[index]?.base
  if (!base || !'عحهغ'.includes(base)) return null
  if (run[index].marks.has(SUKUN)) return null
  const precedent = run[index - 1]
  const suivant = run[index + 1]
  if (!precedent || !suivant || !suivant.marks.has(SHADDA)) return null
  return POINTS.has(precedent.base) ? CONSONANT[base] : null
}

/** Cette lettre a-t-elle étéprise dans une assimilation juste avant ? */
const assimilée = (run, index) => assimilee(run, index) ?? ''

const isAlif = (token) => Boolean(token) && (token.base === 'ا' || token.base === 'ٱ')

/**
 * L'article, son assimilation comprise, et l'index où reprendre.
 *
 *   الْحَمْدُ   ->  l-ḥamdu      (lettre lunaire)
 *   الرَّحْمَٰن ->  r-raḥmāni    (assimilation : la lettre se redit)
 *   ٱللَّهِ    ->  llāhi        (lam géminée, sans trait d'union)
 *   ٱلَّذِي     ->  lladhī       (lam géminée)
 *   بِالْحَبِيبِ ->  bil-ḥabībi   (proclitique collé)
 *
 * `forced` porte la consonne et la voyelle du proclitique : l'alif de
 * l'article ne se prononce pas, la voyelle du proclitique se garde.
 */
function articleOf(run, index, forced) {
  const lam = run[index + 1]
  const next = run[index + 2]
  const head = `${forced.consonant}${forced.vowel}`

  /* ا لّ : la lam de l'article est géminée — « ٱلَّذِي », « ٱللَّهِ ». */
  if (lam?.base === 'ل' && lam.marks.has(SHADDA)) {
    return {
      prefix: `${head}ll`,
      /* La voyelle manque souvent ; elle est un fatḥa, long devant hāʾ
         — c'est ainsi qu'on prononce le nom divin. */
      vowel: next?.base === 'ه' ? 'ā' : (vowelOf(lam.marks).vowel ?? 'a'),
      next: index + 2,
      joint: true,
    }
  }

  /* ا ل ل : l'article s'assimile au lām du mot, même effet. La shadda
     manque souvent — « اللهُ » s'écrit sans elle aussi souvent qu'avec. */
  if (next?.base === 'ل') {
    return {
      prefix: `${head}ll`,
      vowel: run[index + 3]?.base === 'ه' ? 'ā' : (vowelOf(next.marks).vowel ?? 'a'),
      next: index + 3,
      joint: true,
      double: index + 2,
    }
  }

  const sun = SUN[next?.base]
  if (sun) {
    return { prefix: `${head}${sun}`, vowel: '', next: index + 2, double: index + 2 }
  }

  return { prefix: `${head}l`, vowel: '', next: index + 2 }
}

/** L'article est-il là ? ا ou ٱ suivi de lām — ou un lām doubled quand
    l'alif manque à l'écriture. */
function hasArticle(run, index) {
  if (isAlif(run[index])) return run[index + 1]?.base === 'ل'
  return run[index].base === 'ل' && run[index + 1]?.base === 'ل'
}

/** La lettre porte-t-elle une voyelle déclarée longue ? */
function isLong(run, index) {
  const token = run[index]
  if (token.marks.has(DAGGER_ALEF) || token.marks.has(MADDAH)) return true
  /* Un yā final porte un ī long : « ʿabbāsi » -> « ʿabbāsī ». */
  if (index === run.length - 1 && (token.base === 'ي' || token.base === 'ى') && !token.marks.has(SUKUN)) {
    return true
  }
  return isBareMater(run[index + 1]) || isDaggerMater(run[index + 1])
}

/**
 * Transcrit un mot : une suite de lettres sans espace.
 *
 * Renvoie `{ latin, flags }`, `flags` étant l'ensemble des remarques
 * rencontrées.
 */
export function transcribeWord(run, flags = new Set()) {
  let out = ''
  /* Position de la dernière voyelle émise : c'est elle qu'une mater
     nue viendra allonger. */
  let lastVowel = -1
  let i = 0
  /* Index de la lettre que le préfixe de l'article a déjà prononcée. */
  let absorbed = -1

  const emit = (text, isVowel = false) => {
    out += text
    if (isVowel) lastVowel = out.length - 1
  }

  /* Allonge la dernière voyelle. Renvoie faux quand il n'y en a pas :
     une mater nue après une consonnante muette ouvre alors une
     syllabe — « إِلَّا » se dit « illā ». */
  const lengthen = () => {
    /* Rien n'a encore ete prononce : il n'y a pas quoi allonger. Sans
       cette sortie, le mot commençant par un alif nu perdait sa voyelle
       — « ابْنَ » se disait « bnu ». */
    if (lastVowel < 0) return false
    const vowel = out[lastVowel]
    if ('āīū'.includes(vowel)) return true
    if (!'aiu'.includes(vowel)) return false
    out = `${out.slice(0, lastVowel)}${longForm(vowel)}`
    return true
  }

  const openArticle = (index, forced) => {
    const article = articleOf(run, index, forced)
    /* La gémination reste collée : « llāhi », « billāhi ». */
    emit(article.prefix + article.vowel + (article.joint ? '' : '-'), Boolean(article.vowel))
    i = article.next
    absorbed = article.double ?? -1
  }

  if (run.length > 2 && PROCLITIC[run[0].base] && hasArticle(run, 1)) {
    /* Proclitique + article : « bil-ḥabībi », « wallāhi », « lillāhi ». */
    const { vowel } = vowelOf(run[0].marks)
    openArticle(1, { consonant: PROCLITIC[run[0].base], vowel: vowel ?? 'i' })
  } else if (hasArticle(run, 0)) {
    /* « للّ » porte la shadda : c'est l'article lui-même, il gémine.
       « لِلْـ ا » garde le sukun : c'est un proclitique qui précède
       l'article, il garde sa voyelle — لِلْإِلَهِ « lil-ʾilahi ». */
    const enclitique = !isAlif(run[0]) && !run[1].marks.has(SHADDA)
    openArticle(0, {
      consonant: enclitique ? 'l' : '',
      vowel: enclitique ? (vowelOf(run[0].marks).vowel ?? 'i') : '',
    })
  }
  /* waw et fa ne sont pas des mots : ils se collent à ce qui suit.
     وَجْهُ se dit « wajhu », فَبَلِّغْ « faballighan ». */

  /* Un mot sans une seule vocalisation n'est pas devinable : ni les
     maters ni le contexte ne disent comment le lire. Deux lettres ou
     plus — « لم » se dit lam ou līm, rien ne tranche. */
  const voyelles = run.filter((token) => [...token.marks].some((mark) => VOWEL_MARKS.has(mark)))
  if (voyelles.length === 0 && run.length >= 2 && !determinee(run)) {
    flags.add('sans-harakat')
    return { latin: '', flags }
  }

  while (i < run.length) {
    const token = run[i]
    const marks = token.marks
    const sukun = marks.has(SUKUN)
    const shadda = marks.has(SHADDA)
    let { vowel, tanwin } = vowelOf(marks)
    /* La gémination se prononce avec un fatḥa quand le texte
     n'en porte pas. */
    if (!vowel && shadda && !sukun && i !== run.length - 1) vowel = 'a'

    /* Porteuse de hamza : l'apostrophe vient avant la voyelle, comme
       dans « l-ʾakwāni ». */
    if (token.base in CARRIER) {
      const intrinsic = CARRIER[token.base]
      /* Le madda ne s'écrit que sur un alif hamzé : l'alif de l'article
         nu ne le prend jamais — الْآمَالِ se dit « l-ʾāmāli ». */
      emit('ʾ')
      if (vowel) emit(isLong(run, i) && !tanwin ? longForm(vowel) : vowel, true)
      else if (intrinsic) emit(intrinsic, true)
      else flags.add('atypique')
      i += 1
      continue
    }

    /* Mater nue : elle ne fait qu'allonger. */
    if (isBareMater(token)) {
      if (lengthen()) {
        i += 1
        continue
      }
      /* En tete de mot, elle n'allonge rien : elle ouvre la syllabe.
         يا se dit « ya » — le yā est la consonne —, اوْ « aw ». */
      if (i > 0) emit('ā', true)
      else emit(isAlif(token) ? 'a' : token.base === 'و' ? 'w' : 'y', true)
      i += 1
      continue
    }

    const reprise = assimilee(run, i)
    const consonant = reprise ?? consonantOf(run, i, i !== absorbed)

    if (consonant) {
      /* Un yā final ne porte pas de voyelle mais un alif dagger :
         « أُنْثَىٰ » -> « ʾunthā ». */
      if (!vowel && isDaggerMater(token)) {
        if (!lengthen()) emit('ā', true)
        i += 1
        continue
      }

      /* La tāʾ marbūṭa finale sans voyelle ne se prononce pas : le mot
         finit déjà sur la voyelle qui la précède — رَحْمَة « raḥma »,
         صَحْبَة « ṣaḥba ». Dès qu'elle porte un signe, elle se dit « t » :
         صَحْبَةٍ « ṣaḥbati ». */
      if (token.base === 'ة' && !vowel && !sukun && i === run.length - 1) {
        i += 1
        continue
      }

      /* hāʾ ne se gémine pas, même quand le texte met la shadda :
         c'est un artefact du nom divin, « allāhumma ». Une lettre
         assimilée, elle, se gémine : « mustaʿʿid ». */
      /* La shadda qui suit une assimilation est déjà prononcée : la gémination
         ne se compte pas deux fois — مُسْتَعِدّ « mustaʿʿid ». */
      const déjà = reprise || assimilée(run, i - 1) || i === absorbed
      if (reprise || (shadda && !déjà && consonant !== 'h')) emit(consonant + consonant)
      else emit(consonant)

      if (sukun) {
        i += 1
        continue
      }

      if (!vowel) {
        /* Une lettre sans signe au milieu d'un mot : l'arabe la passe
           souvent. Trois déductions, chacune notée ; le reste est refusé,
           qu'on ne devine pas. */
        const next = run[i + 1]
        const mater = next && (isBareMater(next) || isDaggerMater(next)) ? next.base : null

        if (i === run.length - 1) {
          /* Dernière lettre : l'arabe n'y met souvent aucun signe. */
        } else if (mater) {
          /* Une mater nue ne se prononce pas ; elle donne sa voyelle :
             فِى se dit « fī », فَاتِح « fātiḥa ». */
          emit(mater === 'ا' ? 'ā' : mater === 'و' ? 'ū' : 'ī', true)
          flags.add('harakat-déduite')
        } else if (next && next.kind === 'letter' && next.marks.has(SUKUN) === false && vowelOf(next.marks).vowel) {
          /* Suivie d'une lettre vocalisée, elle ouvre la syllabe avec elle :
             عِندَ se dit « ʿinda », le nūn ne porte pas de voyelle à lui. */
          flags.add('harakat-déduite')
        } else {
          /* Suivie d'une lettre muette, la voyelle est indécidable :
             « قَد » se dit qadd ou qad. Plutôt que de trancher, on refuse. */
          flags.add('sans-harakat')
        }

        i += 1
        continue
      }

      emit(isLong(run, i) && !tanwin ? longForm(vowel) : vowel, true)
      i += 1
      continue
    }

    /* Mater marquée : waw ou yā qui porte sa voyelle. */
    if (MATER.has(token.base)) {
      /* Devant une lettre vocalisée, elle est consonne et non allongement :
         عَلَى نَ se dit « ʿalayna ». Sa voyelle appartient à la syllabe
         d'avant, qui vient de la lui laisser. */
      const apres = run[i + 1]
      if (!isAlif(token) && apres?.kind === 'letter' && !apres.marks.has(SUKUN) && vowelOf(apres.marks).vowel) {
        emit(vowel ?? 'a', true)
        emit(token.base === 'و' ? 'w' : 'y')
        i += 1
        continue
      }
      emit(isLong(run, i) && !tanwin ? longForm(vowel ?? 'a') : (vowel ?? 'a'), true)
      i += 1
      continue
    }

    flags.add('inconnu')
    i += 1
  }

  return { latin: clean(out), flags }
}

/* ------------------------------------------------------------------ *
 * Un texte
 * ------------------------------------------------------------------ */

/**
 * Transcrit un texte arabe vocalisé.
 *
 * Renvoie `{ latin, flags }`. Les drapeaux décrivent ce qui mérite
 * l'attention : `wolof`, `sans-harakat`, `inconnu` interdisent la
 * publication ; `ornement`, `atypique` demandent seulement une relecture.
 */
export function transliterate(value) {
  const flags = new Set()
  const tokens = tokenise(value)

  let out = ''
  let run = []
  let pending = ''

  const flush = () => {
    if (run.length === 0) return
    out += pending + transcribeWord(run, flags).latin
    pending = ''
    run = []
  }

  for (const token of tokens) {
    if (token.kind === 'letter') {
      run.push(token)
      continue
    }

    flush()

    if (token.kind === 'space') pending += ' '
    else if (token.kind === 'punct' || token.kind === 'digit') pending += token.value
    else {
      if (token.kind === 'wolof') flags.add('wolof')
      else flags.add('inconnu')
      pending += ' '
    }
  }
  flush()
  out += pending

  if (/﴿/.test(value)) flags.add('ornement')

  return { latin: clean(out.toLowerCase()), flags: [...flags] }
}

/** Drapeaux qui interdisent de publier une transcription. */
export const BLOQUANTS = ['wolof', 'sans-harakat', 'inconnu']

/**
 * Transcrit un verset, ou renvoie `null` si la règle ne sait pas le
 * rendre proprement. Mieux vaut un verset sans transcription qu'une
 * transcription approchée : le premier se relit, la seconde se propage.
 */
export function transliterateVerse(value) {
  const { latin, flags } = transliterate(value)
  if (latin.length === 0) return null
  if (flags.some((flag) => BLOQUANTS.includes(flag))) return null
  return { latin, flags }
}

/** Drapeaux levés sur un verset, sans décider de son sort. */
export function inspectVerse(value) {
  const { latin, flags } = transliterate(value)
  return {
    latin,
    flags,
    blocked: latin.length === 0 || flags.some((flag) => BLOQUANTS.includes(flag)),
  }
}