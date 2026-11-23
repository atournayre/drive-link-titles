/* global DLT */
(async function () {
  'use strict';

  // Sites exclus (page d'options). Par défaut : docs.google.com et drive.google.com.
  let excludedHosts = DLT.DEFAULT_EXCLUDED_HOSTS;
  try {
    const stored = await chrome.storage.sync.get('excludedHosts');
    if (Array.isArray(stored.excludedHosts)) excludedHosts = stored.excludedHosts;
  } catch (e) {
    // storage indisponible : on garde les valeurs par défaut
  }
  if (DLT.isHostExcluded(location.hostname, excludedHosts)) return;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const SELECTOR = 'a[href*="docs.google.com"], a[href*="drive.google.com"]';
  // contenteditable="false" est très courant dans les apps de chat : il ne doit PAS exclure.
  const EDITABLE = '[contenteditable]:not([contenteditable="false"]), textarea';

  // État gardé dans le monde isolé du content script : la page ne voit ni attribut ni classe
  // qui lui dirait « ce lien a pu être résolu » (= tu as accès à ce document).
  const mounted = new WeakMap(); // lien -> { desc, host, shadow }
  const titles = new Map(); // href -> titre déjà résolu (réaffichage instantané si l'app re-rend le lien)

  // CSSOM (pas de <style>) : pas bloqué par la CSP des pages.
  const rawSheet = new CSSStyleSheet();
  rawSheet.replaceSync(':host { display: inline; }');
  const richSheet = new CSSStyleSheet();
  richSheet.replaceSync(`
    :host { display: inline-flex; align-items: center; gap: 0.35em; vertical-align: bottom; max-width: 100%; }
    .dlt-icon { flex: none; width: 1.1em; height: 1.1em; }
    .dlt-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .dlt-meta { flex: none; font-size: 0.85em; opacity: 0.65; }
  `);

  function svgEl(name, attrs) {
    const el = document.createElementNS(SVG_NS, name);
    for (const [key, value] of Object.entries(attrs || {})) el.setAttribute(key, value);
    return el;
  }

  const PAGE = 'M4.5 1h5.8L14 4.7V14a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z';
  const WHITE = { fill: '#fff' };
  const OUTLINE = { fill: 'none', stroke: '#fff', 'stroke-width': 1 };
  const ICONS = {
    docs: {
      color: '#4285f4',
      draw: (g) => [[3, 5], [8, 5], [10, 3]].forEach(([y, w]) => g.append(svgEl('rect', { x: 6, y, width: w, height: 1.2, ...WHITE }))),
    },
    sheets: {
      color: '#0f9d58',
      draw: (g) => {
        g.append(svgEl('rect', { x: 5.5, y: 6.5, width: 5, height: 5, ...OUTLINE }));
        g.append(svgEl('path', { d: 'M8 6.5v5M5.5 9h5', stroke: '#fff', 'stroke-width': 1 }));
      },
    },
    slides: { color: '#f4b400', draw: (g) => g.append(svgEl('rect', { x: 5.5, y: 6.5, width: 5, height: 4, ...OUTLINE })) },
    forms: {
      color: '#7248b9',
      draw: (g) => [6, 9].forEach((y) => {
        g.append(svgEl('rect', { x: 5.5, y, width: 1.2, height: 1.2, ...WHITE }));
        g.append(svgEl('rect', { x: 7.7, y, width: 3, height: 1.2, ...WHITE }));
      }),
    },
    file: { color: '#5f6368', draw: (g) => g.append(svgEl('rect', { x: 6, y: 8, width: 5, height: 1.2, ...WHITE })) },
  };

  function buildIcon(kind) {
    const svg = svgEl('svg', { viewBox: '0 0 16 16', class: 'dlt-icon', 'aria-hidden': 'true' });
    if (kind === 'folder') {
      svg.append(svgEl('path', {
        d: 'M1.5 3.5a1 1 0 0 1 1-1h3.6l1.4 1.5h6a1 1 0 0 1 1 1v7.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z',
        fill: '#5f6368',
      }));
      return svg;
    }
    const icon = ICONS[kind] || ICONS.file;
    svg.append(svgEl('path', { d: PAGE, fill: icon.color }));
    icon.draw(svg);
    return svg;
  }

  function span(className, text) {
    const el = document.createElement('span');
    el.className = className;
    el.textContent = text;
    return el;
  }

  /**
   * Le titre d'un doc privé ne doit pas être lisible par le JS de la page :
   * tout le contenu du lien vit dans un shadow root *fermé* (pas de a.shadowRoot,
   * ni textContent / innerText). Le lien est mis dans cet état dès le départ, avec son
   * URL d'origine, qu'on ait ou non accès au document : la page ne voit pas la différence.
   */
  function mount(link, state) {
    const host = document.createElement('span');
    const shadow = host.attachShadow({ mode: 'closed' });
    shadow.adoptedStyleSheets = [rawSheet];
    shadow.append(link.textContent);
    link.title = link.href; // l'URL complète reste visible au survol
    link.replaceChildren(host);
    state.host = host;
    state.shadow = shadow;
  }

  function showTitle(state, title) {
    const suffix = DLT.describeSuffix(state.desc);
    state.shadow.adoptedStyleSheets = [richSheet];
    state.shadow.replaceChildren(
      buildIcon(state.desc.kind),
      span('dlt-title', title),
      ...(suffix ? [span('dlt-meta', suffix)] : [])
    );
  }

  function process(link) {
    if (link.closest(EDITABLE)) return;
    const state = mounted.get(link);

    if (state) {
      // Déjà géré. Si l'app (React, etc.) a remplacé le contenu du lien, on le remet.
      if (state.host.parentNode === link) return;
      if (!DLT.isBareGoogleUrlText(link.textContent)) return;
      mount(link, state);
      if (titles.has(link.href)) showTitle(state, titles.get(link.href));
      return;
    }

    const desc = DLT.parseLink(link.href);
    // Seulement les liens auto (texte = URL) ; un [texte](url) écrit à la main reste intact.
    if (!desc || !DLT.isBareGoogleUrlText(link.textContent)) return;

    const fresh = { desc, host: null, shadow: null };
    mounted.set(link, fresh);
    mount(link, fresh);

    const known = titles.get(link.href);
    if (known) {
      showTitle(fresh, known);
      return;
    }
    chrome.runtime.sendMessage({ type: 'dlt:title', href: link.href }, (response) => {
      if (chrome.runtime.lastError || !response || !response.title) return;
      titles.set(link.href, response.title);
      showTitle(fresh, response.title);
    });
  }

  function scanWithin(node) {
    // un nœud texte ajouté dans un lien = l'app a re-rendu le lien
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!element) return;
    const link = element.closest(SELECTOR);
    if (link) process(link);
    if (node.nodeType === Node.ELEMENT_NODE) node.querySelectorAll(SELECTOR).forEach(process);
  }

  // Seuls les nœuds ajoutés sont analysés : léger même sur des pages très dynamiques.
  const added = new Set();
  let timer = null;
  function flush() {
    timer = null;
    const nodes = [...added];
    added.clear();
    nodes.forEach((node) => node.isConnected && scanWithin(node));
  }

  scanWithin(document.documentElement);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) mutation.addedNodes.forEach((node) => added.add(node));
    if (added.size && timer === null) timer = setTimeout(flush, 250);
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
