# content/ — textes apportés au corpus

Ce dossier est la **source de vérité des œuvres qui ne viennent pas de xassida.sn** :
textes transmis, manuscrits numérisés, transcriptions de famille, œuvres d'auteurs
locaux. Il est versionné avec le code et relu par `npm run data:build`.

Tout ce qui est déposé ici est publié dans `public/data/` et apparaît dans
l'application. Rien n'est jamais effacé automatiquement : le script de build
calcule la liste des fichiers attendus et ne supprime que ceux qui ne le sont plus.

---

## Organisation

```
content/
  auteurs/<slug>.json         notice d'un auteur
  oeuvres/<slug>.json        une œuvre, avec ses versets
  oeuvres/<slug>.fr.json     traduction française de cette œuvre (optionnel)
  texte/<slug>.txt           variante : le texte brut, un verset par ligne
  texte/<slug>.json          variante : la fiche qui accompagne <slug>.txt
  traductions/<slug>.fr.json variante : traductions à part (optionnel)
  phonetique/<slug>.json     transcription phonétique latine de cette œuvre
  source/residu.json         figeage de ce que la source en ligne ne sert plus
```

**Le nom du fichier fait foi.** `<slug>` devient l'adresse de la page
(`/xassida/<slug>`, `/auteurs/<slug>`) et le nom des fichiers dans `public/data/`.
Corriger le titre d'une œuvre ne change donc pas son adresse : on ne renomme pas
les fichiers.

Trois modèles sont fournis, à copier puis à adapter :

```
cp content/auteurs/modele.json.exemple     content/auteurs/mon-auteur.json
cp content/oeuvres/modele.json.exemple    content/oeuvres/mon-oeuvre.json
cp content/oeuvres/modele.fr.json.exemple content/oeuvres/mon-oeuvre.fr.json
cp content/traductions/modele.fr.json.exemple content/traductions/mon-oeuvre.fr.json
cp content/texte/modele.txt.exemple       content/texte/mon-oeuvre.txt
```

---

## 1. Notice d'auteur — `content/auteurs/<slug>.json`

```json
{
  "name": "Nom Complet de l'Auteur",
  "nameAr": "اسم المؤلف",
  "tariha": "tidjan",
  "bio": "Notice biographique, quelques lignes.",
  "source": "Manuscrit transmis par …",
  "license": "Domaine public",
  "picture": "auteurs/mon-portrait.jpg"
}
```

| Champ | Requis | Rôle |
|---|---|---|
| `name` | oui | nom affiché |
| `id` | non | sinon le nom du fichier est utilisé comme identifiant |
| `nameAr` | recommandé | sinon le nom latin est repris |
| `tariha` | non | `tidjan` par défaut |
| `bio` | non | sans notice, l'auteur est exclu de la mise en avant sur l'accueil |
| `source` | non | provenance ; renseigne `bioSource` |
| `license` | non | licence du texte de la notice |
| `picture` | non | fichier réellement présent dans `public/authors/`, sinon ignoré |

L'auteur anonyme existe déjà côté source : utilisez l'`id` `9` pour un texte
transmis sans indication d'auteur.

---

## 2. Œuvre — `content/oeuvres/<slug>.json`

```json
{
  "name": "Titre de l'Oeuvre",
  "nameAr": "العنوان",
  "author": "mon-auteur",
  "source": "Manuscrit transmis par …",
  "license": "Domaine public",
  "providedBy": "Nom du contributeur",
  "chapters": [
    {
      "n": 1,
      "title": "Chapitre premier",
      "verses": [
        { "ar": "مَا بِالْوَجْدِ مِنْ أَلَمْ", "tr": "ma bil-wajdi mini alim" },
        { "ar": "مَا لِالْقَلْبِ مِنْ سَقَمْ", "tr": "ma lil-qalbi mini saqam" }
      ]
    }
  ]
}
```

| Champ | Requis | Rôle |
|---|---|---|
| `name` | oui | titre affiché |
| `nameAr` | non | sinon le premier verset court est repris |
| `author` / `authorId` | oui | `id` d'un auteur connu, sinon le build échoue |
| `source` | **oui** | provenance, obligatoire |
| `license` | **oui** | licence du texte, obligatoire |
| `previousAuthor` | non | `id` d'auteur en place, quand une œuvre déjà publiée change d'attribution |
| `meter` / `rhyme` / `category` | non | repères poétiques, `{ "nameAr": "…", "name": "…" }` |
| `chapters[].verses[].ar` | oui | le texte arabe |
| `chapters[].verses[].tr` | non | transcription latine |
| `chapters[].verses[].fr` | non | traduction au vers, dans la même fiche |
| `chapters[].verses[].sadr` / `adj` | non | les deux hémistiches, quand la source les distingue |

`source` et `license` sont **obligatoires** : le build refuse de publier une œuvre
dont on ne sait pas d'où elle vient. C'est la trace de provenance qui permet de
trancher plus tard si un texte doit être retiré.

### Remplacer une œuvre déjà publiée

Une fiche dont le nom de fichier reprend le slug d'une œuvre existante la
remplace : même adresse, texte à jour, et les traductions **dont le texte du
verset est identique à l'identique**. Les versets réellement nouveaux perdent
seuls leur traduction, ce qui est exact — une traduction ne vaut que pour les
mots qu'elle traduit.

Le build refuse cette reprise si l'auteur change, sauf si la fiche déclare
`previousAuthor` avec l'attribution en place. Cinq textes étaient catalogués
« auteur inconnu » faute de meilleure source ; une autre les rattache à un
auteur réel, et le nom de fichier garde son slug pour ne pas casser les
adresses.

### Repères poétiques

`meter` (mètre), `rhyme` (rive) et `category` (thème) ne sont affichés que
s'ils sont présents. Les 63 œuvres de la source d'origine n'en portent aucun :
leur absence doit rester invisible, pas afficher trois champs vides.

---

## 3. Traductions séparées

À utiliser quand les traductions arrivent plus tard que le texte arabe.
Deux emplacements possibles, au choix :

* `content/traductions/<slug>.fr.json`
* `content/oeuvres/<slug>.fr.json`

```json
{
  "verses": {
    "mon-oeuvre-c1-v1": "Traduction française du premier vers.",
    "mon-oeuvre-c1-v2": "Traduction française du deuxième vers."
  }
}
```

Les clefs sont les identifiants de verset : `<slug-oeuvre>-c<chapitre>-v<verset>`,
par exemple `mon-oeuvre-c1-v1`. Les séparateurs sont des tirets, jamais un `#` :
ces identifiants circulent dans les adresses (`?v=…`) et le navigateur couperait
la chaîne au caractère de début de fragment. Sans ce fichier, chaque œuvre reçoit
quand même un squelette de traduction à remplir — c'est le fichier que le build
écrit dans `public/data/translations/` et qu'il ne faut pas éditer à la main.

Une clé qui ne correspond à aucun verset fait **échouer** le build : une
traduction orpheline est un texte traduit déplacé, pas une donnée inutile.

---

## 4. Texte brut — `content/texte/<slug>.txt`

Pour un texte recopié depuis un manuscrit, sans mise en forme à écrire à la main :

* **un verset par ligne** ;
* **une ligne vide ouvre un nouveau chapitre**.

```
مَا بِالْوَجْدِ مِنْ أَلَمْ
مَا لِالْقَلْبِ مِنْ سَقَمْ

أَلْحُبُّ عَنْدَكَ رَاضِيٌّ
```

Le fichier `<slug>.txt` doit être accompagné de `content/oeuvres/<slug>.json` qui
porte les métadonnées (`name`, `author`, `source`, `license`). Les chapitres ne
sont pas numérotés dans le fichier : ils le sont automatiquement, dans l'ordre.

Pour ajouter une transcription latine à un texte brut, utilisez la forme JSON :
`tr` est alors renseigné verset par verset.

---

## 5. Transcription phonétique — `content/phonetique/<slug>.json`

Prononciation latine de chaque verset, pour lire un vers dont on ne connaît pas
l'arabe. Un fichier par œuvre, indexé par **identifiant de verset publié** :

```json
{
  "slug": "elhadji-malick-sy-abada-buruqun",
  "convention": "v1",
  "verses": {
    "2103": "smi llāhi r-raḥmāni r-raḥīmi",
    "2104": "ʾabadā burūqu taḥta junḥi ẓalāmi"
  }
}
```

La clef est l'identifiant de `public/data/verses/<slug>.json`, pas le numéro du
verset : `2103` et non `1`.

**Le publié passe avant la règle.** 2 420 versets du corpus avaient déjà une
transcription ; elle reste celle que le lecteur voit. `content/phonetique/` ne
remplit que les trous, et `npm run data:transcrire` refuse d'écrire là où le
corpus a déjà répondu : il compte les divergences et les propose, sans les
appliquer. Harmoniser le corpus entier sur cette convention reste un choix à
faire à la main, pas un effet de bord du build.

### La convention

| Notation | Prononce | Exemple |
|---|---|---|
| `ā ī ū` | voyelles longues | `r-raḥmāni`, `ṣallā` |
| `ʿ ḥ ṣ ṭ ẓ ḍ kh gh sh dh th` | lettres accentuées | `l-ʿālamīna`, `al-ḍiyāmu` |
| `l-` `r-` `s-` `ll` | l'article, assimilation comprise | `r-raḥmāni`, `llāhi` |
| `bil-` `lil-` `wallāhi` | proclitiques collés | `bil-ḥabībi` |
| `ʾ` | hamza | `ʾabadā`, `l-ʾakwāni` |
| `wajhu` | waw et fa ne sont pas des mots | `وَجْهُ مَيَّةَ` → `wajhu mayyata` |

Le tanwīn ne se prononce pas (`بُرُوقٌ` → `burūqu`), la shadda se double
(`رَبِّ` → `rabbi`), la tāʾ marbūṭa finale sans voyelle se tait
(`رَحْمَة` → `raḥma`).

### Générer

```bash
npm run data:transcrire                            # rapport, n'écrit rien
npm run data:transcrire -- --œuvre <slug>         # une œuvre, texte à texte
npm run data:transcrire -- --écrire                # dépose les sidecars
npm run data:transcrire -- --force                 # réécrit l'existant
npm run data:transcrire -- --rapport <fichier>     # liste de relecture
```

La règle est entièrement locale et déterministe (`scripts/lib/phonetique.mjs` :
aucun réseau, aucune dépendance). Deux garde-fous :

* **sans `--force`, une clef déjà présente n'est jamais réécrite** — une relecture
  humaine ne se perd pas ;
* **un verset que la règle ne sait pas rendre n'est pas transcrit du tout.** Il
  reste absent du sidecar ; le build garde alors pour ce verset la traduction
  déjà publiée, et le lecteur n'affiche une ligne de prononciation que si elle
  existe. Mieux vaut un vide qu'une approximation fausse.

### Relecture

Trois marques bloquent la transcription, trois autres demandent un œil :

| Marque | Effet | Sens |
|---|---|---|
| `sans-harakat` | bloque | voyelle non écrite, lecture indécidable (`قَد` : qadd ou qad) |
| `wolof` | bloque | digraphes wolofs translittérés (`ݧ`), aucune lecture arabe ne les restitue |
| `inconnu` | bloque | caractère non identifié |
| `harakat-déduite` | à relire | la mater nue donnait la voyelle (`فِى` → `fī`) |
| `ornement` | à relire | guillemets du Coran autour du verset |
| `atypique` | à relire | hamza sans voyelle, cas inattendu |

`npm run data:transcrire -- --rapport content/phonetique-relecture.json` dépose la
liste de travail : `refused` d'abord, `toReview` ensuite. Une relecture se
corrige à la main dans `content/phonetique/<slug>.json`, jamais dans
`public/data/` qui est généré.

État au dernier passage : **10 782 versets sur 10 860** transcrits (99 %),
78 refusés, 916 à relire. Ce décompte bouge à chaque fusion d'œuvre : c'est le
corpus entier qui est passé au crible, pas une œuvre à la fois.

---

## Construire

```bash
npm run data:build
```

Le script échoue **avant toute écriture** si le catalogue présente une anomalie :

* slug d'œuvre ou d'auteur en double ;
* œuvre dont l'auteur n'existe pas ;
* œuvre sans verset ;
* identifiant de chapitre ou de verset en double ;
* œuvre sans `source` ni `license` ;
* clef de traduction ne correspondant à aucun verset ;
* fichier de traduction dont le nom ne correspond à aucune œuvre.

Sans anomalie, il réécrit `public/data/` et affiche le résumé.

Deux points à connaître :

* le build est **hors ligne**. Il lit `content/source/residu.json`, pas le site ;
* les fichiers de `public/data/` sont générés. Pour corriger un texte, on modifie
  le fichier dans `content/`, jamais le JSON généré.

## La source figée — `content/source/residu.json`

`npm run data:build` a besoin d'une base : les œuvres, leurs chapitres, leurs
versets, les auteurs et les traductions françaises. Cette base est
`content/source/residu.json`.

Elle existe parce que la source en ligne a régressé. Le site est passé de
`xassida.sn` à `markazulfuhum.app`, puis de Next.js à une API. Cette API n'expose
plus que **241 œuvres / 8 867 lignes**, alors que le corpus en compte **276 /
10 860**. Trente-cinq œuvres n'existent plus que dans `public/data/`. Un build qui
relirait l'API les **supprimerait**.

`content/source/residu.json` fige donc le minimum vital : le texte des œuvres que
`content/oeuvres/` ne dépose pas, les traductions françaises qu'aucun dépôt ne
porte déjà, les auteurs que `content/auteurs/` ne dépose pas, et les pistes audio.
Le texte des 241 œuvres déposées n'est pas dupliqué : il reste la propriété de
`content/oeuvres/`. Il en va de même d'une traduction déposée dans
`content/traductions/` ou `content/oeuvres/<slug>.fr.json` : la figer une seconde
fois lui donnerait deux sources de vérité.

```bash
node scripts/snapshot-source.mjs            # regénère le figeage depuis public/data/
node scripts/snapshot-source.mjs --check    # vérifie qu'il est à jour (sort en 1 sinon)
```

Ne pas éditer ce fichier à la main. Après un build, `--check` doit dire « à jour ».

## Deux recensions de la même œuvre

`Khilāṣu Dh-dhahabi Fī Sīrati Khayri L-ʿarabi` est arrivée deux fois dans le
corpus, du même auteur (Elhadji Malick SY, id 6) et sous le même titre arabe :
d'un côté l'œuvre déposée par `markazulfuhum.app`, tronquée au **chapitre 12**
sur 427 versets alors que l'édition imprimée en compte environ 30 ; de l'autre,
`xassida.sn`, complète sur **30 chapitres / 1 056 versets** et traduite en
français. Ce n'est pas un défaut d'extraction de l'API — elle déclare
`chapters_count: 12` — mais deux tirages du même poème, avec des variantes
lexicales et orthographiques d'un tirage à l'autre.

Les deux entrées ont été fusionnées le 3 octobre 2026 dans celle qui avait
l'identifiant lisible et les repères poétiques (Al-Basīt / Mīmiyya /
Muhammadiyyāt) :

* texte, transcription et traduction des 30 chapitres repris de la recension
  complète, deposited dans `content/oeuvres/khilasu-dh-dhahabi-fi-sirati-khayri-l-arabi.json`
  et `….fr.json` ;
* la coupe des deux hémistiches, absente du tirage complet, reportée de l'ancien
  fichier pour les 427 versets qui en avaient une. Les 629 versets des chapitres
  12 (v81 à v116) et 13 à 30 n'ont aucun repère antérieur : ils s'affichent sur
  une ligne ;
* l'ancienne entrée et son sidecar supprimés, ses traductions réindexées sur les
  identifiants de l'œuvre conservée.

Le compteur de l'auteur est passé de 86 œuvres / 5 329 versets à 85 œuvres /
4 902 versets : les 427 versets de la recension courte sont remplacés, pas
ajoutés.

La fusion est reproductible : `node scripts/merge-khilass-zahab.mjs` refait le
travail et s'arrête si elle a déjà été appliquée, `--appliquer` écrit. Le
script compare les textes aux lettres près et non aux mots : la recension
complète détache la particule (`وَ الْقِدَمِ`) là où l'autre l'attache
(`وَالْقِدَمِ`), ce qui décale tout comptage de mots. Une coupe d'hémistiche qui
ne retrouve pas les deux moitiés est refusée plutôt que devinée.

Pour compléter une œuvre depuis une édition imprimée :

```bash
node scripts/import-chapters.mjs <slug> <source.json> --dry-run
node scripts/import-chapters.mjs <slug> <source.json>
```

Le fichier source peut être `{"chapters": [...]}` ou un tableau de chapitres.
Un verset porte `ar` (obligatoire), et facultativement `sadr`, `adj`, `tr` et
`fr`. `license`, `source`, `providedBy` et `edition` sont repris à la racine pour
attester la provenance.

Le script **n'écrit rien** si un contrôle échoue : numérotation de chapitre
continue, numérotation de verset redémarrant à 1, aucun chapitre déjà présent,
aucun verset vide ou sans caractère arabe, aucun identifiant de verset réutilisé.
Ce dernier point est le plus important : les transcriptions phonétiques sont
indexées sur `<slug>-c<chapitre>-v<verset>`, et un identifiant réutilisé
attacherait une transcription au mauvais verset.

Après l'import : `npm run data:build`, puis `npm run data:transcrire` pour les
nouveaux versets.