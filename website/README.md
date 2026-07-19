# MQTT Access — website

Marketing site for [MQTT Access](https://github.com/aemzayn/mqtt-access), built
with [Astro](https://astro.build) + Tailwind CSS v4. Static output, no
client-side JS framework, optimized for SEO.

## Develop

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # outputs to ./dist
npm run preview   # preview the production build
```

## Structure

- `src/pages/index.astro` — home page (hero, features, theme showcase, download CTA)
- `src/pages/{privacy,security,eula,third-party-notices,license}.md` — legal
  pages, mirrored from the root project's `.md` files. Keep both in sync when
  those change.
- `src/layouts/BaseLayout.astro` — shared shell: SEO head, header, footer
- `src/layouts/DocLayout.astro` — prose wrapper used by the legal markdown pages
- `src/lib/site.ts` — repo URL, download link, site copy constants

## Deployment

Deployed to GitHub Pages at the custom domain `mqtt-access.com` by
`.github/workflows/deploy-website.yml`, which runs on every push to `main`
that touches `website/**` and publishes `website/dist`. `public/CNAME` tells
Pages which domain to serve; point the domain's DNS at GitHub Pages
(`aemzayn.github.io`) for it to resolve. `astro.config.mjs`'s `site` and
`public/robots.txt`'s sitemap URL both assume this domain — update both
together if it ever changes.

The download buttons point at the GitHub repo's `/releases` page.
