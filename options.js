/* global DLT */
(function () {
  'use strict';

  const textarea = document.getElementById('excluded');
  const status = document.getElementById('status');

  function show(hosts) {
    textarea.value = hosts.join('\n');
  }

  function say(message) {
    status.textContent = message;
    setTimeout(() => {
      status.textContent = '';
    }, 2500);
  }

  chrome.storage.sync.get('excludedHosts').then(({ excludedHosts }) => {
    show(Array.isArray(excludedHosts) ? excludedHosts : DLT.DEFAULT_EXCLUDED_HOSTS);
  });

  document.getElementById('save').addEventListener('click', async () => {
    const hosts = DLT.parseExcludedHosts(textarea.value);
    await chrome.storage.sync.set({ excludedHosts: hosts });
    show(hosts); // montre la forme normalisée (sans https://, chemins, etc.)
    say('Enregistré');
  });

  document.getElementById('reset').addEventListener('click', async () => {
    await chrome.storage.sync.remove('excludedHosts');
    show(DLT.DEFAULT_EXCLUDED_HOSTS);
    say('Valeurs par défaut rétablies');
  });
})();
