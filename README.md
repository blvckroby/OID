# OID Ltd — website

Static one-page site for [OID Ltd](https://www.oidltd.info/) (Foshan OID Technology Consulting CO. Ltd).

- `index.html` — semantic markup, SEO/Open Graph tags, JSON-LD
- `styles.css` — design tokens and components (no framework, no build step)
- `script.js` — header, mobile menu, scroll reveals, service showcase, dialogs, lightbox, contact form (vanilla JS)

## Deploy

Upload the three files to any static host (GitHub Pages, Netlify, a WordPress `public_html`, …). No build is needed.

`assets/` holds the OID logo (SVG, grey and white, full and mark-only), the favicon and the Foshan photo.

Other photos, films and QR codes are loaded from the existing media library at
`https://www.oidltd.info/wp-content/uploads/`. If that library is removed, copy the files into this
repository and update the URLs.

The contact form has no backend: it validates the fields, then opens the visitor's email application with a
message to `info@oidltd.info`. To collect messages server-side, set the form's `action` to a form endpoint
and remove the `submit` handler in `script.js`.
