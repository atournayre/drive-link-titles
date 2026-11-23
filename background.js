/* global DLT */
importScripts('lib.js');

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // un titre change rarement
const FAILURE_TTL_MS = 5 * 60 * 1000; // évite de re-fetch en boucle un doc inaccessible
const MAX_CONCURRENT = 4;
const MAX_BYTES = 256 * 1024; // le <title> est tout au début du HTML

const inflight = new Map(); // key -> Promise<string>
const failures = new Map(); // key -> timestamp
const waiting = [];
let running = 0;

function limited(task) {
  return new Promise((resolve, reject) => {
    const start = () => {
      running++;
      task().then(resolve, reject).finally(() => {
        running--;
        const next = waiting.shift();
        if (next) next();
      });
    };
    if (running < MAX_CONCURRENT) start();
    else waiting.push(start);
  });
}

/** Lit le flux jusqu'à </title> puis l'annule : inutile de télécharger tout le doc. */
async function readHead(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let html = '';
  let bytes = 0;
  try {
    while (bytes < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      html += decoder.decode(value, { stream: true });
      if (/<\/title>/i.test(html)) break;
    }
  } finally {
    reader.cancel().catch(() => {});
  }
  return html;
}

async function fetchTitle(desc) {
  const response = await fetch(desc.fetchUrl, { credentials: 'include', redirect: 'follow' });
  const host = new URL(response.url).hostname;
  if (!response.ok) throw new Error('HTTP ' + response.status);
  if (host !== 'docs.google.com' && host !== 'drive.google.com') {
    throw new Error('redirigé vers ' + host + ' (non connecté ?)');
  }
  const title = DLT.extractTitle(await readHead(response));
  if (!title) throw new Error('titre inutilisable (accès refusé ou page de connexion)');
  return title;
}

async function resolveTitle(href) {
  const desc = DLT.parseLink(href);
  if (!desc) throw new Error('lien non supporté');

  const failedAt = failures.get(desc.key);
  if (failedAt && Date.now() - failedAt < FAILURE_TTL_MS) throw new Error('échec récent');

  const cached = (await chrome.storage.local.get(desc.key))[desc.key];
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.title;

  if (!inflight.has(desc.key)) {
    const promise = limited(() => fetchTitle(desc))
      .then(async (title) => {
        await chrome.storage.local.set({ [desc.key]: { title, ts: Date.now() } });
        return title;
      })
      .catch((error) => {
        failures.set(desc.key, Date.now());
        throw error;
      })
      .finally(() => inflight.delete(desc.key));
    inflight.set(desc.key, promise);
  }
  return inflight.get(desc.key);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) return false;
  if (!message || message.type !== 'dlt:title' || typeof message.href !== 'string') return false;
  // Le content script envoie l'URL du lien, mais seul parseLink() décide quoi fetch.
  resolveTitle(message.href).then(
    (title) => sendResponse({ title }),
    (error) => sendResponse({ error: String((error && error.message) || error) })
  );
  return true; // réponse asynchrone
});
