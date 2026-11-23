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
```text
Stores (1) a local cache of document titles for 6 hours, to avoid repeating requests, and (2) the user's list of excluded sites set in the options page. Nothing else is stored.
```

**Justification host permissions** (champ « Autorisation d'accès à l'hôte ») :
```text
Host permissions https://docs.google.com/* and https://drive.google.com/*: the background service worker fetches the page of a linked document to read its <title> (the document name), using the user's existing Google session. These are the only hosts the extension contacts.

Content script on http(s)://*/*: a Google Docs/Drive link can appear on any site (issue trackers, chat apps, wikis, webmail), so the script must run on all sites. It only looks at links pointing to docs.google.com or drive.google.com, and replaces them with an icon and the document name. Users can disable it on specific sites in the options page.
```

**Remote code** : Non.

**Données collectées** : cocher « Contenu du site Web » uniquement (liens lus dans les pages, titres mis en cache en local).

**Certifications** : cocher les trois.

**Privacy policy URL** :
```text
https://github.com/atournayre/drive-link-titles/blob/main/PRIVACY.md
```

## Distribution

Visibilité au choix : Public, ou Unlisted (accessible seulement par lien) pour un premier essai.
