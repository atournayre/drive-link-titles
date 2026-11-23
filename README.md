# Drive Link Titles

Extension Chrome (Manifest V3, JS vanilla) : sur tous les sites, remplace les liens Google Docs / Sheets / Slides / Forms / Drive
par une icône + le nom du document. Pour les Sheets, l'onglet (`gid`) et la plage (`range`) s'affichent en discret,
et l'URL complète reste en infobulle.

## Installation

1. `chrome://extensions` → activer le « Mode développeur »
2. « Charger l'extension non empaquetée » → choisir ce dossier
3. (optionnel) Détails de l'extension → « Options » : liste des sites à exclure, un domaine par ligne
   (`example.com` exclut aussi ses sous-domaines). Exclus par défaut : `docs.google.com` et `drive.google.com`.
   Une liste déjà enregistrée dans les options remplace ces valeurs par défaut (bouton « Valeurs par défaut »
   pour revenir en arrière).
4. Le script tourne aussi dans les iframes (Google Chat dans Gmail, par exemple) et re-traite un lien si
   l'application (Discord, React…) le re-rend.

## Fonctionnement

- Le content script (`content.js`) repère les liens dont le texte est l'URL elle-même (liens auto).
  Un lien `[texte](url)` écrit à la main n'est jamais modifié.
- Le service worker (`background.js`) récupère le `<title>` de la page avec ta session Google (cookies),
  lit seulement le début du HTML, et met le résultat en cache 6 h (`chrome.storage.local`).
- Il ne fetch que des URLs reconstruites par `parseLink()` (`lib.js`), jamais l'URL envoyée par la page.
- Doc inaccessible (non connecté, pas les droits, supprimé) : le lien reste tel quel.

## Sécurité (extension active sur tous les sites)

Une page quelconque peut contenir un lien Google dont elle connaît l'ID. Pour qu'elle n'apprenne rien :

- Tout le contenu du lien vit dans un shadow root **fermé** : `innerText`, `textContent` et `shadowRoot` ne
  montrent rien à la page, que le doc soit accessible ou non.
- Aucun attribut ni classe ajouté qui indiquerait « résolu » (l'état est gardé dans le content script).
- Limite connue : la page peut encore mesurer la taille du lien (`getBoundingClientRect`) et en déduire
  grossièrement si un titre a été affiché. Pour l'éviter complètement, exclure les sites non fiables.

## Limites connues

- Compte Google par défaut uniquement (un lien `/u/1/` est lu avec le compte par défaut).
- Titres des fichiers et dossiers Drive : parsing testé sur un mock, pas sur le vrai Drive.
- Les exclusions s'appliquent aux pages ouvertes après l'enregistrement.

## Tests

```bash
node --test 'test/*.test.js'
```
