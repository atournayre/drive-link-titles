# Politique de confidentialité — Drive Link Titles

Dernière mise à jour : 2026-11-23

Drive Link Titles remplace, dans les pages web, les liens Google Docs / Sheets / Slides / Forms / Drive
par une icône et le nom du document.

## Ce que l'extension traite

- **Liens de la page** : le script lit les liens (`<a>`) vers `docs.google.com` et `drive.google.com`
  présents dans les pages que tu visites. Le reste de la page n'est ni lu ni enregistré.
- **Titre du document** : pour chaque lien reconnu, l'extension demande la page correspondante à Google
  (`docs.google.com` ou `drive.google.com`) avec ta session Google existante (cookies envoyés par le
  navigateur à Google, jamais lus par l'extension), et ne garde que le contenu de la balise `<title>`.
- **Cache local** : les titres trouvés sont conservés 6 heures dans `chrome.storage.local`, sur ton
  appareil, pour éviter de refaire les requêtes.
- **Réglages** : la liste de sites exclus est enregistrée dans `chrome.storage.sync` (synchronisée par
  Chrome avec ton compte Google si la synchronisation est activée).

## Ce qui n'est jamais fait

- Aucune donnée n'est envoyée au développeur ni à un tiers : les seules requêtes réseau de l'extension
  vont à `docs.google.com` et `drive.google.com`.
- Aucun identifiant, statistique d'usage, publicité ni outil d'analyse.
- Aucune donnée n'est vendue, partagée ou utilisée à une autre fin que d'afficher le nom du document.
- Aucun code distant n'est chargé ni exécuté.
- Les cookies et identifiants Google ne sont pas lus, copiés ni stockés par l'extension.

## Limited Use

L'utilisation des informations obtenues par l'extension respecte la politique « Limited Use » du
Chrome Web Store : elles servent uniquement à fournir la fonction décrite (afficher le nom des
documents), ne sont transférées à personne, ne servent pas à de la publicité et ne sont pas lues par
des humains.

## Contrôle

- Liste de sites exclus : page d'options de l'extension.
- Suppression des données : désinstaller l'extension supprime le cache et les réglages locaux.

## Contact

aurelien.tournayre@gmail.com
