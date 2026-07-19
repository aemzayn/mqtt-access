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

## Before deploying

- `astro.config.mjs` has a placeholder `site` (`https://mqtt-access.com`) used
  for canonical URLs and the sitemap — update it to the real domain.
- `public/robots.txt` hardcodes the sitemap URL to the same placeholder domain
  — update it alongside `site`.
- The download buttons link to the GitHub repo's `/packages` page as a
  placeholder until real installers are published (see `DOWNLOAD_URL` in
  `src/lib/site.ts`).
