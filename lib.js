/**
 * Fonctions pures partagées entre le content script, le service worker et les tests (node).
 */
(function (root) {
  'use strict';

  const ID = '([\\w-]{10,})';
  const DOC_PATH = new RegExp(
    '^/(document|spreadsheets|presentation|forms)(?:/u/\\d+)?/d/(e/)?' + ID
  );
  const DRIVE_FILE_PATH = new RegExp('^(?:/u/\\d+)?/file(?:/u/\\d+)?/d/' + ID);
  const DRIVE_FOLDER_PATH = new RegExp('^/drive(?:/u/\\d+)?/folders/' + ID);
  const OPEN_ID = new RegExp('^' + ID + '$');

  const DOC_KINDS = {
    document: 'docs',
    spreadsheets: 'sheets',
    presentation: 'slides',
    forms: 'forms',
  };

  /**
   * Analyse une URL Google Docs/Drive.
   * Retourne null si ce n'est pas un lien reconnu. fetchUrl est reconstruit
   * ici (jamais pris tel quel) : le service worker ne fetch que ces URLs-là.
   */
  function parseLink(href) {
    let url;
    try {
      url = new URL(href);
    } catch (e) {
      return null;
    }
    if (url.protocol !== 'https:') return null;

    const params = new URLSearchParams(url.hash.replace(/^#/, ''));
    const gid = url.searchParams.get('gid') || params.get('gid') || '';
    const range = url.searchParams.get('range') || params.get('range') || '';
    const make = (kind, id, fetchUrl) => ({
      kind,
      id,
      key: kind + ':' + id,
      fetchUrl,
      gid,
      range,
    });

    let m;
    if (url.hostname === 'docs.google.com') {
      if ((m = DOC_PATH.exec(url.pathname))) {
        const kind = DOC_KINDS[m[1]];
        const published = m[2] ? 'e/' : '';
        const tail = published ? 'viewform' : 'edit';
        return make(
          kind,
          (published ? 'e-' : '') + m[3],
          'https://docs.google.com/' + m[1] + '/d/' + published + m[3] + '/' + tail
        );
      }
      if (url.pathname === '/open' && OPEN_ID.test(url.searchParams.get('id') || '')) {
        const id = url.searchParams.get('id');
        return make('file', id, 'https://drive.google.com/file/d/' + id + '/view');
      }
      return null;
    }

    if (url.hostname === 'drive.google.com') {
      if ((m = DRIVE_FILE_PATH.exec(url.pathname))) {
        return make('file', m[1], 'https://drive.google.com/file/d/' + m[1] + '/view');
      }
      if ((m = DRIVE_FOLDER_PATH.exec(url.pathname))) {
        return make('folder', m[1], 'https://drive.google.com/drive/folders/' + m[1]);
      }
      if (url.pathname === '/open' && OPEN_ID.test(url.searchParams.get('id') || '')) {
        const id = url.searchParams.get('id');
        return make('file', id, 'https://drive.google.com/file/d/' + id + '/view');
      }
    }
    return null;
  }

  const NAMED_ENTITIES = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
  };

  function decodeEntities(text) {
    return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body) => {
      if (body[0] === '#') {
        const code = body[1].toLowerCase() === 'x' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
        try {
          return String.fromCodePoint(code);
        } catch (e) {
          return whole;
        }
      }
      const named = NAMED_ENTITIES[body.toLowerCase()];
      return named === undefined ? whole : named;
    });
  }

  const PRODUCT_SUFFIX =
    /(?:^|\s+)[-–—]\s+Google\s+(?:Docs|Sheets|Slides|Forms|Drive|Documents|Feuilles de calcul|Présentations|Formulaires)\s*$/i;

  // Titres renvoyés quand on n'a pas accès au document : on ne les affiche pas.
  const UNUSABLE_TITLE =
    /^(sign in|connexion|se connecter|google accounts|comptes google|error|erreur|not found|page introuvable|404|request access|demander l.acc[eè]s|acc[eè]s refus[eé]|access denied)\b/i;

  /**
   * Extrait le nom du document depuis le début du HTML.
   * Retourne null si pas de <title> ou si c'est une page de connexion / d'erreur.
   */
  function extractTitle(html) {
    const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
    if (!m) return null;
    const raw = decodeEntities(m[1]).replace(/\s+/g, ' ').trim();
    if (UNUSABLE_TITLE.test(raw)) return null;
    const title = raw.replace(PRODUCT_SUFFIX, '').trim();
    if (!title || /^google\s+(docs|sheets|slides|forms|drive)$/i.test(title)) return null;
    return title;
  }

  /** Texte discret affiché après le titre : onglet (gid) et plage de cellules. */
  function describeSuffix(desc) {
    const parts = [];
    if (desc.gid) parts.push('gid ' + desc.gid);
    if (desc.range) parts.push(desc.range);
    return parts.join(' · ');
  }

  /** Le texte du lien est-il lui-même une URL Google ? (= lien auto, pas un texte écrit à la main) */
  function isBareGoogleUrlText(text) {
    const t = text.trim();
    return /^https:\/\//i.test(t) && parseLink(t) !== null;
  }

  // Sites où l'extension ne fait rien par défaut : les pages Google Docs/Drive elles-mêmes.
  const DEFAULT_EXCLUDED_HOSTS = ['docs.google.com', 'drive.google.com'];

  /**
   * Texte de la page d'options -> liste de domaines.
   * Une entrée par ligne ; accepte "# commentaire", "https://", "*.", chemin et port.
   */
  function parseExcludedHosts(text) {
    return text
      .split(/\r?\n/)
      .map((line) => line.replace(/#.*/, '').trim().toLowerCase())
      .map((line) => line.replace(/^[a-z][a-z0-9+.-]*:\/\//, '').replace(/^\*\./, '').replace(/[/:?].*$/, ''))
      .filter(Boolean);
  }

  /** "example.com" exclut aussi "sub.example.com", mais pas "notexample.com". */
  function isHostExcluded(hostname, excludedHosts) {
    const host = hostname.toLowerCase();
    return excludedHosts.some((entry) => host === entry || host.endsWith('.' + entry));
  }

  const api = {
    parseLink,
    decodeEntities,
    extractTitle,
    describeSuffix,
    isBareGoogleUrlText,
    DEFAULT_EXCLUDED_HOSTS,
    parseExcludedHosts,
    isHostExcluded,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.DLT = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
