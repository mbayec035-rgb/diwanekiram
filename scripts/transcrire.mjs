#!/usr/bin/env node
/* ------------------------------------------------------------------
   Transcription phonétique du corpus.

   Parcourt le corpus publié (public/data/), applique la règle de
   prononciation et dépose le résultat dans content/phonetique/<slug>.json :

     {
       "slug": "abada-buruqun-tahta-junhi-zalami",
       "convention": "v1",
       "verses": {
         "abada-buruqun-tahta-junhi-zalami-c1-v1": "ʾabadā burūqu taḥta junḥi ẓalāmi"
       }
     }

   On lit public/data/ et non content/ : après fusion, c'est le seul
   endroit où les identifiants de versets sont définitifs. Une
   transcription rangée sous une clé que l'application ne cherche pas
   ne sert à rien.

   Usage :

     npm run data:transcrire                  rapport, n'écrit rien
     npm run data:transcrire -- --œuvre slug  une œuvre, texte et résultat
     npm run data:transcrire -- --rapport f  dépose la liste de relecture
     npm run data:transcrire -- --écrire      dépose les transcriptions
     npm run data:transcrire -- --force       réécrit les clefs existantes

   Deux garde-fous :

     1. sans --force, une clef déjà présente est laissée telle quelle —
        une relecture humaine ne se perd jamais ;
     2. un verset que la règle ne sait pas rendre proprement n'est pas
        transcrit du tout : il est compté, et nommé dans le rapport.

   Le rapport dit ce qui a été transcrit, ce qui a été refusé, et ce qui
   changerait dans les transcriptions déjà publiées. C'est la liste de
   relecture.
------------------------------------------------------------------ */

import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'

import { PHONETIQUE_DIR, loadPublishedWorks, readPhonetique, writePhonetique } from './lib/content.mjs'
import { BLOQUANTS, inspectVerse } from './lib/phonetique.mjs'

const CONVENTION = 'v1'

const argv = process.argv.slice(2)
const flag = (...names) => names.some((name) => argv.includes(name))
const option = (...names) => {
  const index = argv.findIndex((argument) => names.includes(argument))
  return index >= 0 ? (argv[index + 1] ?? null) : null
}

const ecrir = flag('--écrire', '--ecrire')
const forcer = flag('--force')
const oeuvre = option('--œuvre', '--oeuvre')
const rapport = option('--rapport', '--report')

const log = (...args) => console.log(...args)
const green = (value) => `\x1b[32m${value}\x1b[0m`
const yellow = (value) => `\x1b[33m${value}\x1b[0m`
const red = (value) => `\x1b[31m${value}\x1b[0m`

async function main() {
  const corpus = await loadPublishedWorks()
  const selected = oeuvre ? corpus.works.filter((work) => work.slug === oeuvre) : corpus.works

  if (oeuvre && selected.length === 0) {
    throw new Error(`Aucune œuvre « ${oeuvre} » dans public/data/manifest.json.`)
  }

  if (!existsSync(PHONETIQUE_DIR) && ecrir) await mkdir(PHONETIQUE_DIR, { recursive: true })

  const total = {
    versets: 0,
    transcrits: 0,
    ajoutes: 0,
    dejaLa: 0,
    publies: 0,
    refuses: 0,
    manuels: 0,
    refusesPublies: 0,
    manquants: 0,
    ecrites: 0,
    changees: 0,
    identiques: 0,
    echangees: 0,
  }
  const refus = []
  const echanges = []
  const relire = []
  const marques = new Map()

  for (const work of selected) {
    const deja = await readPhonetique(work.slug)
    const versets = { ...(deja?.verses ?? {}) }
    let ajoutes = 0
    let dejaLa = 0

    for (const verse of work.verses) {
      total.versets += 1

      /* La règle passe sur tous les versets, même ceux déjà déposés : le
         rapport et la liste de relecture doivent rester complets. */
      const { latin, flags, blocked } = inspectVerse(verse.ar)
      for (const marque of flags) marques.set(marque, (marques.get(marque) ?? 0) + 1)

      if (blocked) {
        total.refuses += 1
        /* La règle ne sait pas le lire, mais ce n'est pas forcément un
           trou : une relecture à la main ou le publié peut déjà le dire. */
        let resolu = 'manquant'
        if (versets[verse.id]) {
          resolu = 'manuel'
          total.manuels += 1
        } else if (verse.tr) {
          resolu = 'publie'
          total.refusesPublies += 1
        } else {
          total.manquants += 1
        }
        refus.push({ slug: work.slug, verse, flags, resolu, latin: versets[verse.id] ?? null })
        continue
      }

      total.transcrits += 1

      /* Tout ce qui a été déduit est relu : une déduction se relit mieux
         qu'une transcription absente. */
      if (flags.length > 0) {
        relire.push({ slug: work.slug, id: verse.id, ar: verse.ar, tr: latin, flags })
      }

      /* Ce qui est déjà déposé n'est pas perdu : sans --force, une relecture
         humaine ne se remplace pas. */
      if (versets[verse.id] && !forcer) {
        dejaLa += 1
        continue
      }

      /* Ce qui est publié ne se réécrit pas : la règle ne remplit que les
         trous. Ce qu'elle dirait de plus n'est qu'une proposition, notée
         à part, pour qu'harmoniser le corpus publié reste un choix visible. */
      if (verse.tr) {
        total.publies += 1
        if (verse.tr === latin) total.identiques += 1
        else {
          total.changees += 1
          if (echanges.length < 12) echanges.push({ work, verse, avant: verse.tr, apres: latin })
        }
        continue
      }

      versets[verse.id] = latin
      ajoutes += 1
      total.ajoutes += 1
    }

    total.dejaLa += dejaLa

    if (ecrir && (ajoutes > 0 || forcer)) {
      await writePhonetique(work.slug, { slug: work.slug, convention: CONVENTION, verses: versets })
      total.ecrites += 1
    }

    if (oeuvre) {
      log(`\n\x1b[36m▸ ${work.slug}\x1b[0m — ${ajoutes} transcrits, ${dejaLa} déjà présents`)
      for (const verse of work.verses.slice(0, 8)) {
        log(`\n  ar : ${verse.ar}`)
        log(`  published : ${verse.tr || yellow('(vide)')}`)
        log(`  règle     : ${versets[verse.id] ?? yellow('(refusé)')}`)
      }
    }
  }

  const part = total.versets > 0 ? Math.round((100 * total.transcrits) / total.versets) : 0

  log('')
  log(`  ${corpus.works.length} œuvres, ${total.versets} versets lus`)
  log(`  ${green(`${total.transcrits} transcrits`)} (${part} %), ${total.ajoutes} ajoutés`)
  if (total.dejaLa > 0) log(`  ${total.dejaLa} déjà déposés, laissés tels quels (--force pour les réécrire)`)
  if (total.refuses > 0) {
    log(
      `  ${yellow(`${total.refuses} refusés par la règle`)} : ` +
        `${total.manuels} résolus à la main, ${total.refusesPublies} déjà publiés, ` +
        `${total.manquants > 0 ? red(`${total.manquants} manquants`) : green('aucun manquant')}`,
    )
  }
  if (total.publies > 0) {
    log(
      `  déjà publiés, laissés tels quels : ${total.publies} ` +
        `(${green(`${total.identiques} identiques`)}, ${yellow(`${total.changees} différents`)} — proposition, jamais écrite)`,
    )
  }
  if (marques.size > 0) {
    log(`  marques : ${[...marques].map(([nom, n]) => `${nom} ${n}`).join(', ')}`)
  }
  log(ecrir ? green(`  ${total.ecrites} œuvres écrites dans content/phonetique/`) : '  rapport seul : ajoute --écrire')

  if (rapport) {
const charge = {
      generatedAt: new Date().toISOString(),
      convention: CONVENTION,
      totals: { ...total },
      /* Les refusés d'abord : la règle n'a rien produit pour eux. `published`
         indique si le lecteur leur montre autre chose que le texte arabe. */
      refused: refus.map(({ slug, verse, flags, resolu, latin }) => ({
        slug,
        id: verse.id,
        ar: verse.ar,
        published: verse.tr || null,
        latin,
        resolu,
        reasons: flags,
      })),
      /* Puis ce qui demande un œil : déductions, ornements, atypiques. */
      toReview: relire,
    }
    await writeFile(rapport, `${JSON.stringify(charge, null, 2)}\n`, 'utf8')
    log(green(`  liste de relecture : ${rapport}`))
  }

  if (echanges.length > 0) {
    log('')
    log('  Exemples de transcriptions déjà publiées que la règle change :')
    for (const { verse, avant, apres } of echanges) {
      log(`\n  ${verse.id}`)
      log(`    publié : ${avant}`)
      log(`    règle  : ${apres}`)
    }
  }

  if (refus.length > 0 && refus.length <= 30) {
    log('')
    for (const { slug, verse, flags } of refus) {
      log(`  ${red('×')} ${slug} ${verse.id} — ${flags.filter((nom) => BLOQUANTS.includes(nom)).join(', ')}`)
      log(`    ${verse.ar}`)
    }
  } else if (refus.length > 0) {
    log('')
    log(`  ${refus.length} versets refusés : relance avec --œuvre pour les voir.`)
  }
}

try {
  await main()
} catch (error) {
  console.error(red(`✗ ${error.message}`))
  process.exitCode = 1
}