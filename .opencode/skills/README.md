# Vendored agent skills

These skills are copied into the repository so every session gets the same
frontend guidance without a network install.

| Folder | Upstream | Pinned commit | Version | Licence | Vendored |
| --- | --- | --- | --- | --- | --- |
| `impeccable/` | https://github.com/pbakaus/impeccable | `d41d986` (2026-11-16) | 4.9.2 | Apache-2.0 | `SKILL.md`, `reference/`, `LICENSE` |
| `taste-skill/` | https://github.com/Leonxlnx/taste-skill | `f6b7657` (2026-11-07) | 2.5.1 | MIT | `SKILL.md`, `references/`, `library/`, `LICENSE` |

## What was left out and why

- `impeccable/scripts/` (~1.7 MB): the `impeccable` launcher downloads a
  self-contained binary on first run, plus a font index and a bundled browser
  script. Not needed for app work, and we do not run downloaded binaries
  automatically. When the skill asks for `impeccable context` and the launcher
  is absent, follow its documented fallback: read `PRODUCT.md` / `DESIGN.md`
  directly and continue with the reference playbooks.
- `taste-skill/assets/` (~33 MB): the landing-page kit (photographs, effects,
  component lab, backgrounds). EventSync is an app UI, not a marketing page, so
  only the doctrine is useful here. `taste-skill/scripts/` is also omitted: its
  finish gate drives headless Chrome against a static page and does not model a
  Vite SPA route.

## How to refresh

```powershell
git clone --depth 1 https://github.com/pbakaus/impeccable "$env:TEMP\impeccable"
Copy-Item "$env:TEMP\impeccable\.claude\skills\impeccable\SKILL.md" .opencode\skills\impeccable\
Copy-Item "$env:TEMP\impeccable\.claude\skills\impeccable\reference" .opencode\skills\impeccable\reference -Recurse -Force
```

Repeat for `taste-skill/skills/taste-skill`. Update the commit and version in
this table and in `client/README.md`.

## Attribution

- impeccable, Copyright Paul Bakaus, Apache License 2.0. See
  `impeccable/LICENSE`.
- tasteskill, Copyright (c) 2026 Leonxlnx, MIT License. See
  `taste-skill/LICENSE`.
