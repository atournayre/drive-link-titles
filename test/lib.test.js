'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseLink,
  decodeEntities,
  extractTitle,
  describeSuffix,
  isBareGoogleUrlText,
  parseExcludedHosts,
  isHostExcluded,
  DEFAULT_EXCLUDED_HOSTS,
} = require('../lib.js');

const ID = '1fEWCfF9GtPp-NS5CCpDnw0Odmg5j_Jas1IV4Orndo2U';

test('parseLink : Sheets avec gid et range dans le hash', () => {
  const d = parseLink(`https://docs.google.com/spreadsheets/d/${ID}/edit?gid=537543365#gid=537543365&range=A4`);
  assert.equal(d.kind, 'sheets');
  assert.equal(d.id, ID);
  assert.equal(d.key, `sheets:${ID}`);
  assert.equal(d.gid, '537543365');
  assert.equal(d.range, 'A4');
  assert.equal(d.fetchUrl, `https://docs.google.com/spreadsheets/d/${ID}/edit`);
});

test('parseLink : deux liens vers le même fichier ont la même clé', () => {
  const a = parseLink(`https://docs.google.com/spreadsheets/d/${ID}/edit?gid=0#gid=0&range=A1`);
  const b = parseLink(`https://docs.google.com/spreadsheets/d/${ID}/edit?gid=537543365#gid=537543365&range=A4`);
  assert.equal(a.key, b.key);
  assert.notEqual(a.gid, b.gid);
});

test('parseLink : Docs, Slides, compte /u/1/', () => {
  assert.equal(parseLink(`https://docs.google.com/document/d/${ID}/edit`).kind, 'docs');
  assert.equal(parseLink(`https://docs.google.com/presentation/d/${ID}/edit`).kind, 'slides');
  const d = parseLink(`https://docs.google.com/spreadsheets/u/1/d/${ID}/edit`);
  assert.equal(d.id, ID);
  assert.equal(d.fetchUrl, `https://docs.google.com/spreadsheets/d/${ID}/edit`);
});

test('parseLink : Forms publié (/d/e/)', () => {
  const d = parseLink(`https://docs.google.com/forms/d/e/${ID}/viewform`);
  assert.equal(d.kind, 'forms');
  assert.equal(d.key, `forms:e-${ID}`);
  assert.equal(d.fetchUrl, `https://docs.google.com/forms/d/e/${ID}/viewform`);
});

test('parseLink : Drive fichier, dossier, open?id=', () => {
  assert.equal(parseLink(`https://drive.google.com/file/d/${ID}/view?usp=sharing`).kind, 'file');
  const folder = parseLink(`https://drive.google.com/drive/u/0/folders/${ID}`);
  assert.equal(folder.kind, 'folder');
  assert.equal(folder.fetchUrl, `https://drive.google.com/drive/folders/${ID}`);
  assert.equal(parseLink(`https://drive.google.com/open?id=${ID}`).kind, 'file');
  assert.equal(parseLink(`https://docs.google.com/open?id=${ID}`).kind, 'file');
});

test('parseLink : rejette ce qui n\'est pas supporté ou suspect', () => {
  assert.equal(parseLink('http://docs.google.com/document/d/' + ID), null); // pas https
  assert.equal(parseLink('https://evil.example.com/document/d/' + ID), null);
  assert.equal(parseLink('https://docs.google.com.evil.example/document/d/' + ID), null);
  assert.equal(parseLink('https://docs.google.com/document/d/short'), null);
  assert.equal(parseLink('https://docs.google.com/'), null);
  assert.equal(parseLink('pas une url'), null);
  assert.equal(parseLink('https://github.com/foo/bar'), null);
});

test('parseLink : fetchUrl ne contient jamais de query ni de hash du lien d\'origine', () => {
  const d = parseLink(`https://docs.google.com/document/d/${ID}/edit?usp=sharing&x=<script>#evil`);
  assert.equal(d.fetchUrl, `https://docs.google.com/document/d/${ID}/edit`);
});

test('decodeEntities', () => {
  assert.equal(decodeEntities('Bon &amp; Pay &#39;x&#39; &quot;y&quot; &#x27;z&#x27; &lt;b&gt;'), `Bon & Pay 'x' "y" 'z' <b>`);
  assert.equal(decodeEntities('&inconnu; &#xZZ;'), '&inconnu; &#xZZ;');
});

test('extractTitle : retire le suffixe produit', () => {
  assert.equal(extractTitle('<html><head><title>Quarterly report - Google Sheets</title>'), 'Quarterly report');
  assert.equal(extractTitle('<title>Mon dossier - Google Drive</title>'), 'Mon dossier');
  assert.equal(extractTitle('<title>Spec &amp; plan - Google Docs</title>'), 'Spec & plan');
  assert.equal(extractTitle('<title>\n  Titre\n  multi-ligne - Google Slides\n</title>'), 'Titre multi-ligne');
});

test('extractTitle : garde un tiret qui fait partie du nom', () => {
  assert.equal(extractTitle('<title>Plan - V2 - Google Docs</title>'), 'Plan - V2');
});

test('extractTitle : null si connexion, erreur, accès refusé ou titre vide', () => {
  assert.equal(extractTitle('<title>Sign in - Google Accounts</title>'), null);
  assert.equal(extractTitle('<title>Connexion – Comptes Google</title>'), null);
  assert.equal(extractTitle('<title>Error 404 (Not Found)!!1</title>'), null);
  assert.equal(extractTitle('<title>Google Docs</title>'), null);
  assert.equal(extractTitle('<title> - Google Sheets</title>'), null);
  assert.equal(extractTitle('<html>pas de titre</html>'), null);
});

test('describeSuffix', () => {
  assert.equal(describeSuffix({ gid: '537543365', range: 'A4' }), 'gid 537543365 · A4');
  assert.equal(describeSuffix({ gid: '0', range: '' }), 'gid 0');
  assert.equal(describeSuffix({ gid: '', range: '' }), '');
});

test('isBareGoogleUrlText : seulement les liens auto', () => {
  assert.equal(isBareGoogleUrlText(`  https://docs.google.com/document/d/${ID}/edit `), true);
  assert.equal(isBareGoogleUrlText('The report'), false);
  assert.equal(isBareGoogleUrlText('https://github.com/foo'), false);
});

test('parseExcludedHosts : normalise les lignes', () => {
  const text = `
    # commentaire
    Example.com
    https://www.foo.org/chemin?x=1
    *.bar.net
    localhost:3000   # port ignoré

  `;
  assert.deepEqual(parseExcludedHosts(text), ['example.com', 'www.foo.org', 'bar.net', 'localhost']);
  assert.deepEqual(parseExcludedHosts(''), []);
});

test('isHostExcluded : domaine et sous-domaines, pas les faux amis', () => {
  const list = ['example.com'];
  assert.equal(isHostExcluded('example.com', list), true);
  assert.equal(isHostExcluded('sub.example.com', list), true);
  assert.equal(isHostExcluded('EXAMPLE.com', list), true);
  assert.equal(isHostExcluded('notexample.com', list), false);
  assert.equal(isHostExcluded('example.com.evil.net', list), false);
  assert.equal(isHostExcluded('github.com', []), false);
});

test('DEFAULT_EXCLUDED_HOSTS : les domaines Google sont exclus par défaut', () => {
  assert.equal(isHostExcluded('docs.google.com', DEFAULT_EXCLUDED_HOSTS), true);
  assert.equal(isHostExcluded('github.com', DEFAULT_EXCLUDED_HOSTS), false);
});
