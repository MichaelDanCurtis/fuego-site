# Fuego public website

Independent static marketing site for https://fuego.ailuxis.com/.

## Product brief and acceptance

- Audience: individuals and small teams bringing multiple AI accounts, agents and computers into a shared workspace.
- Message: give work a home, keep execution visible, retain human control. Fuego owns work and execution; NeroNook is an optional everyday Mac surface; Ember is the conversational assistant.
- Visual direction: existing Fuego flame, obsidian and warm ember colors, generous editorial typography, a light paper section connecting to the NeroNook brand.
- Status: active development. No general-availability, universal provider/platform support, security certification, price, performance or customer claims.
- Main action: explore an interactive, explicitly illustrative workflow. Secondary action: visit the existing NeroNook site. No invented signup/contact destination or download.
- Privacy: no custom analytics, tracking, form collection or external fonts. Hosting may process request logs.
- Acceptance: responsive desktop/mobile, keyboard-operable demo and navigation, reduced-motion support, valid local links/assets, metadata, public HTTPS on the exact requested domain.

## Ambient motion brief

- Replace the flat homepage background with a locally rendered WebGL field: sculpted ember ribbons, luminous fine edges, and a cursor-driven wake.
- Pointer movement bends the field; scroll position changes its composition. Keep foreground layout stable and text legible.
- No external runtime, texture downloads, tracking, or new network requests. One full-screen draw call with a bounded backing buffer and lower mobile frame rate.
- Respect reduced motion, offer a keyboard-accessible pause control, stop rendering in hidden tabs, and restore gracefully after context loss. A static CSS composition remains available without WebGL or JavaScript.
- Verify actual shader rendering, pointer/scroll response, pause/resume, reduced motion, mobile layout, context recovery, and unchanged product controls before publishing.

## Content grounding

Reviewed 2026-10-23 against `../../README.md`, `../../docs/specs/README.md`, `../../native/nook-agent/README.md`, and the current NeroNook public site. Distinguish product direction from scoped development evidence. Demo content is synthetic and never executes work or connects accounts.

## Local use

```sh
node check-site.mjs
python3 -m http.server 4183 --bind 127.0.0.1 --directory dist
```

Only `dist/` is public. Source, validation and deployment evidence are private. Hosting uses an independent Vercel project and a Cloudflare DNS-only CNAME for `fuego`; it does not change the Fuego application or NeroNook deployment.

## Production

- Public URL: https://fuego.ailuxis.com/
- Private source: https://github.com/MichaelDanCurtis/fuego-site
- Vercel project: `fuego-site` (`prj_6qmCrRchywHQ7tUSGRA6Opw3lqin`), in Michael Curtis' projects.
- Production branch: `main`; pushes deploy automatically. The build runs the site check before serving `dist/`.
- Cloudflare record: DNS-only `CNAME fuego → cname.vercel-dns.com`, TTL Auto.
- Initial publication: 2026-10-23, source `706ed3277932c25b24ba8411640722df41df710a`.
- Verified public HTTPS, exact bytes for all 11 public files, custom 404, deployed security headers, desktop/mobile layouts, menu, keyboard-accessible demo, FAQ, and privacy navigation. Screenshots and detailed checks are retained locally in `evidence/`.
