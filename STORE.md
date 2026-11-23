# Textes pour la fiche Chrome Web Store

Copier-coller dans le Developer Dashboard. Ne fait pas partie du zip.

## Store listing

**Nom** : Drive Link Titles

**Catégorie** : Productivité (à vérifier dans la liste du dashboard)

**Langue** : Français

**Description détaillée** :

Les liens Google Docs, Sheets, Slides, Forms et Drive affichent un identifiant illisible : impossible de savoir
de quel document il s'agit sans l'ouvrir. Drive Link Titles les remplace par une icône et le nom du document,
comme les puces de Google Chat.

- Fonctionne sur tous les sites (GitHub, Discord, Notion, wiki, webmail…)
- Onglet et plage d'un Google Sheets affichés en discret, URL complète au survol
- Seuls les liens « nus » sont remplacés : un lien écrit à la main avec son propre texte n'est jamais modifié
- Liste de sites exclus dans les options
- Aucune donnée envoyée à un tiers : le titre est lu directement chez Google avec ta session, puis gardé 6 h
  dans le cache local
- Document inaccessible (non connecté, pas les droits) : le lien reste tel quel

Limites : compte Google par défaut uniquement.

## Privacy tab

**Single purpose** :
Afficher le nom et le type des documents Google Docs / Sheets / Slides / Forms / Drive à la place de leurs URL
dans les pages web.

**Justification `storage`** :
Cache local des titres (6 h) et liste des sites exclus définie par l'utilisateur.

**Justification host permissions (`https://docs.google.com/*`, `https://drive.google.com/*`)** :
Le service worker lit le `<title>` du document avec la session Google de l'utilisateur pour obtenir son nom.
Ce sont les seuls hôtes contactés.

**Justification content script sur `http(s)://*/*`** :
Un lien Google Docs/Drive peut apparaître sur n'importe quel site (tickets, chats, wikis, mails). Le script
n'analyse que les liens vers docs.google.com et drive.google.com. Les sites peuvent être exclus dans les options.

**Remote code** : Non.

**Données collectées** : contenu de sites web (titre des documents) — traité localement, jamais transmis hors
de Google. Pas d'informations d'authentification collectées (cookies envoyés par le navigateur à Google,
jamais lus).

**Certifications** : cocher les trois (pas de vente, pas d'usage hors finalité, pas de crédit/prêt).

**Privacy policy URL** : URL publique de `PRIVACY.md` (le repo étant privé, voir plus bas).

## Distribution

Visibilité au choix : Public, ou Unlisted (accessible seulement par lien) pour un premier essai.
