# OpenFolks landing page

Static, dependency-free site (HTML + CSS + a little JS). No build step.

- Preview: `python -m http.server 5290 --directory landing` then open http://127.0.0.1:5290
- Deploy: publish the `landing/` folder as-is (GitHub Pages, Cloudflare Pages, Netlify, any static host).
- Download buttons use `releases/latest/download/<stable name>`, so they follow every new release automatically.
