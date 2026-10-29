/* Génère les icônes PNG de la PWA à partir de public/favicon.svg.
   Usage : npm run icons
   L'icône maskable applique un marge de sécurité de 20 %. */

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = await readFile(path.join(root, 'public', 'favicon.svg'))

const sharpOptions = { density: 512 }

const plain = await sharp(source, sharpOptions)
  .resize(512, 512)
  .png()
  .toBuffer()

const maskable = await sharp(source, sharpOptions)
  .resize(410, 410)
  .extend({
    top: 51,
    bottom: 51,
    left: 51,
    right: 51,
    background: { r: 4, g: 7, b: 11, alpha: 1 },
  })
  .png()
  .toBuffer()

/* iOS applique son propre masque et remplit la transparence en noir : on aplatit
   l'icône sur le fond sombre pour éviter des coins noirs sur l'écran d'accueil. */
const appleTouch = await sharp(source, sharpOptions)
  .resize(180, 180)
  .flatten({ background: { r: 4, g: 7, b: 11 } })
  .png()
  .toBuffer()

const targets = [
  ['public/icons-192.png', await sharp(source, sharpOptions).resize(192, 192).png().toBuffer()],
  ['public/icons-512.png', plain],
  ['public/icons-maskable-512.png', maskable],
  ['public/apple-touch-icon.png', appleTouch],
]

for (const [file, buffer] of targets) {
  await writeFile(path.join(root, file), buffer)
  console.log(`✓ ${file}`)
}