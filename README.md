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

## Content grounding

Reviewed 2026-10-23 against `../../README.md`, `../../docs/specs/README.md`, `../../native/nook-agent/README.md`, and the current NeroNook public site. Distinguish product direction from scoped development evidence. Demo content is synthetic and never executes work or connects accounts.

## Local use

```sh
node check-site.mjs
python3 -m http.server 4183 --bind 127.0.0.1 --directory dist
```

Only `dist/` is public. Source, validation and deployment evidence are private. Hosting uses an independent Vercel project and a Cloudflare DNS-only CNAME for `fuego`; it does not change the Fuego application or NeroNook deployment.
