# Privacy Policy — Drive Link Titles

Last updated: 2026-11-23

Drive Link Titles replaces Google Docs / Sheets / Slides / Forms / Drive links in web pages with an icon
and the document name.

## What the extension processes

- **Links in the page**: the content script reads links (`<a>`) pointing to `docs.google.com` and
  `drive.google.com` in the pages you visit. The rest of the page is neither read nor stored.
- **Document title**: for each recognized link, the extension requests the matching page from Google
  (`docs.google.com` or `drive.google.com`) using your existing Google session (cookies are sent by the
  browser to Google, and are never read by the extension), and keeps only the content of the `<title>` tag.
- **Local cache**: titles found are kept for 6 hours in `chrome.storage.local`, on your device, to avoid
  repeating requests.
- **Settings**: the list of excluded sites is saved in `chrome.storage.sync` (synced by Chrome with your
  Google account if sync is enabled).

## What is never done

- No data is sent to the developer or to any third party: the only network requests made by the extension
  go to `docs.google.com` and `drive.google.com`.
- No identifiers, usage statistics, advertising or analytics tools.
- No data is sold, shared or used for any purpose other than displaying the document name.
- No remote code is loaded or executed.
- Google cookies and credentials are not read, copied or stored by the extension.

## Limited Use

The use of information obtained by the extension complies with the Chrome Web Store "Limited Use"
policy: it is used only to provide the described feature (displaying document names), is not transferred
to anyone, is not used for advertising and is not read by humans.

## Your control

- Excluded sites list: the extension's options page.
- Data removal: uninstalling the extension deletes the cache and the local settings.

## Contact

aurelien.tournayre@gmail.com
