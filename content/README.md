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

* le build **relit la source en ligne** à chaque exécution. Si xassida.sn est
  injoignable, le build échoue plutôt que d'effacer le catalogue : les textes
  déposés dans `content/` restent intacts dans tous les cas ;
* les fichiers de `public/data/` sont générés. Pour corriger un texte, on modifie
  le fichier dans `content/`, jamais le JSON généré.