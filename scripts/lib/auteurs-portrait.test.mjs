/* L'appariement est la seule chose qui empêche d'attribuer le visage d'un
 * homme à un autre. Ces cas viennent de la vraie liste d'auteurs. */

import { describe, expect, it } from 'vitest'
import {
  ficheCorrespondante,
  normaliserArabe,
  normaliserLatin,
  titreCompatible,
} from './auteurs-portrait.mjs'

describe('normaliserArabe', () => {
  it('retire les voyelles et le tatweel', () => {
    expect(normaliserArabe('السَّلامُ')).toBe(normaliserArabe('السلام'))
  })

  it('unifie les variantes de l’alef', () => {
    expect(normaliserArabe('أحمد')).toBe(normaliserArabe('احمد'))
  })

  it('ramène la ta marbûta à un ha', () => {
    expect(normaliserArabe('رحمة')).toBe(normaliserArabe('رحم' + 'ة'))
  })

  it('ignore la ponctuation', () => {
    expect(normaliserArabe('الشيخ الحاج عبد العزيز سي ”الدباغي“')).toBe(
      normaliserArabe('الشيخ الحاج عبد العزيز سي الدباغي'),
    )
  })
})

describe('normaliserLatin', () => {
  it('ignore casse et accents', () => {
    expect(normaliserLatin('Abou Hassan Al-Chadhili')).toBe(normaliserLatin('abou hassan al chadhili'))
  })

  it('ignore les diacritiques latins', () => {
    expect(normaliserLatin('ʿAbdu R-Raḥmān')).toBe(normaliserLatin('abdu r rahman'))
  })
})

describe('ficheCorrespondante', () => {
  const fiches = [
    { id: 24, name: 'الشيخ الحاج محمد المنصور سي', photo_url: 'x.jpg' },
    { id: 13, name: 'الشيخ السيد أحمد التجاني الشريف الفاطمي', photo_url: 'y.jpg' },
    { id: 7, name: 'عبد العزيز لو', photo_url: 'z.jpg' },
  ]

  it('accepte un nom arabe strictement identique', () => {
    expect(ficheCorrespondante({ nameAr: 'عبد العزيز لو' }, fiches)?.id).toBe(7)
  })

  it('accepte despite les voyelles des deux côtés', () => {
    expect(ficheCorrespondante({ nameAr: 'السَّيِّدُ أَحْمَدُ الْعَرُوسِي' }, fiches)).toBeNull()
    expect(ficheCorrespondante({ nameAr: 'السَّيِّدُ أَحْمَدُ الْعَرُوسِي' }, [
      ...fiches,
      { id: 14, name: 'السَّيِّدُ أَحْمَدُ الْعَرُوسِي', photo_url: 'a.jpg' },
    ])?.id).toBe(14)
  })

  it('refuse un nom simplement contenu dans un autre', () => {
    /* Le cas réel de la bibliothèque : deux auteurs ne diffèrent que par un
       qualificatif. Le fuller nommé doit rester sans portrait. */
    expect(ficheCorrespondante({ nameAr: 'محمد المنصور سي' }, fiches)).toBeNull()
  })

  it('refuse quand le nom arabe est vide', () => {
    expect(ficheCorrespondante({ nameAr: '' }, fiches)).toBeNull()
  })
})

describe('titreCompatible', () => {
  it('accepte un titre qui porte exactement le même nom', () => {
    expect(titreCompatible('Imam Al-Busiri', 'Imam Al-Busiri')).toBe(true)
    expect(titreCompatible('Al-Qadi Madiakhate Kala', 'al Qādī Madiakhaté Kala')).toBe(true)
  })

  it('refuse un titre qui ajoute un qualificatif', () => {
    expect(titreCompatible('Al-Qadi al-Madiakhate Kala', 'al Qādī Madiakhaté Kala')).toBe(false)
  })

  it('refuse un ancêtre historique du même nom', () => {
    /* L'article Wikipédia porte un nom plus espacé. Concatener les lettres
       aurait accepté le portrait de l'homme de 1855-1922. */
    expect(titreCompatible('El Hadji Malick Sy', 'Elhadji Malick SY')).toBe(false)
  })

  it('refuse un nom simplement contenu dans un autre', () => {
    expect(titreCompatible('Mansour Sy', 'Serigne Mansour Sy Malick')).toBe(false)
  })

  it('refuse un titre absent', () => {
    expect(titreCompatible(undefined, 'Imam Busiri')).toBe(false)
  })
})