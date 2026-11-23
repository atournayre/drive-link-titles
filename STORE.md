# Textes pour la fiche Chrome Web Store

Copier-coller dans le Developer Dashboard. Ne fait pas partie du zip.

## Store listing

**Nom** : Drive Link Titles

**Catégorie** : Productivité (à vérifier dans la liste du dashboard)

**Langue** : English

**Description détaillée** (à coller telle quelle) :

```text
Replaces Google Docs, Sheets, Slides, Forms and Drive links with an icon and the document name, on any website.

Ever received a link like docs.google.com/spreadsheets/d/1aBcD3fGh1JkLmN… and had to open it just to know what it is? Drive Link Titles shows the document name instead, like the smart chips in Google Chat.

Features
• Works on any website: GitHub, Discord, Notion, wikis, webmail…
• Icon by type: Docs, Sheets, Slides, Forms, Drive file or folder
• For Sheets, the tab (gid) and cell range are shown discreetly; the full URL stays in the tooltip
• Only bare links are replaced: a link you wrote with your own text is never modified
• Exclusion list in the options to disable the extension on specific sites
• Inaccessible document (signed out, no permission): the link stays as is

Privacy
• The title is read directly from Google with your existing Google session, and cached locally for 6 hours
• Nothing is sent to the developer or to any third party; the only requests go to docs.google.com and drive.google.com
• No analytics, no ads, no remote code

Limitation: uses your default Google account.
```

## Privacy tab

**Single purpose** :
Display the name and type of Google Docs, Sheets, Slides, Forms and Drive documents in place of their raw URLs in
web pages, so users can tell documents apart without opening them.

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
