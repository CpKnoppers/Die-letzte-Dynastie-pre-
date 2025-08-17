# Repository Guidelines

## Project Structure & Modules
- Root HTML: `index.html` (landing) and `game.html` (playable prototype).
- Assets: `assets/`
  - Styles: `assets/css/style.css`
  - Scripts: `assets/js/script.js`, optional module `eltheonFull.esm.js`
  - Logic modules (UMD + CommonJS): `assets/js/logic/`
    - `economy.js` (monthly resolution), `ai.js` (heuristics), `text.js` (labels/icons/scoring),
      `score.js` (end summary), `datetime.js` (formatting/ticks), `seasons.js` (banner rotation)
  - Images: `assets/img/`
- Design spec: `README.md` (German, game and economy details). Treat as source of truth.
 - Backlog: `docs/backlog.md` (curated ideas → agent tickets).

## Development, Build, and Run
- Static site (no build step). Serve locally to avoid CORS issues.
  - Python: `python3 -m http.server 8000` then open `http://localhost:8000/index.html` or `game.html`.
  - Node (optional): `npx serve .`
- Quick check: ensure browser console has no errors and UI loads images from `assets/img/`.

## Coding Style & Naming
- HTML/CSS/JS with 2‑space indentation; keep lines under ~100 chars.
- JavaScript: `camelCase` for variables/functions; avoid globals—group related logic in functions near usage.
- CSS: class/ID names in `kebab-case` (e.g., `.province-card`, `#game-container`).
- Filenames: lowercase with hyphens or clear words (e.g., `game.html`, `script.js`, `header.png`).
- Keep `script.js` focused on UI + simple state; move pure logic into `assets/js/logic/*`.
- Add English JSDoc to public functions and key helpers.

## Testing Guidelines
- Manual playtest: verify monthly progression, event choices, build/recruit options, and end screen.
- Cross‑browser sanity: latest Chrome and Firefox.
- Console hygiene: no uncaught errors or noisy logs.
- If adding logic modules, prefer lightweight unit tests (Jest) in `assets/js/__tests__/` with `*.test.js` and pure functions without DOM. Current coverage includes economy/ai/text/score/datetime/seasons.
 - Detailed checklists live in `docs/testing.md` (Smoke + feature‑spezifisch).

## Commit & Pull Request Guidelines
- Commits: imperative, concise; prefer Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`). Example: `feat: add temple building and morale tick`.
- Scope small; one topic per commit.
- PRs: include summary, rationale, before/after screenshots for UI, test notes (manual steps), and link related issues.

## Backlog & Tickets
- Source of truth for upcoming work: `docs/backlog.md`.
- Product Owner lists 3–5 priorisierte Ideen pro Batch (P1/P2/P3).
- Agents wandeln Einträge in Mini‑Specs gemäß Template (Titel, Ziel, Scope, Akzeptanz, Dateien, Tests, Notizen) und verlinken PRs.
- Guardrails: Loop nicht pausieren; Auto‑Resolve bei Monatswechsel; statische Seite ohne Build; keine Globals.

## Security & Configuration Tips
- No secrets or tokens in the repo; this is a static site.
- Keep images optimized (PNG/JPG < 500 KB where possible) to reduce load times.
- When introducing third‑party libraries, add them under `assets/js/` and document their purpose and license in the PR.

## Sync & Handoff (Local Mirror)
- Purpose: Keep a writable mirror of the repo on the host for immediate access.
- Target path (host/WSL): `/mnt/c/Users/Reemon.CpKnoppers/Source/Repos/dld/`.
- Command: `npm run sync:host` (copies files with overwrite; excludes `.git`, `node_modules`).
- Script location: `scripts/sync-to-host.sh`.
- Notes:
  - Uses `rsync` if available (fast, deletes removed files). Falls back to `cp -a` without deletion.
  - Default exclusions: `.git`, `.DS_Store`. Adjust in script if needed.
  - To change target: pass as first arg, e.g., `bash scripts/sync-to-host.sh /custom/target`.
  - Use `--clean` to remove stale files in target when `rsync` is not available:
    - `bash scripts/sync-to-host.sh /custom/target --clean`

## Project Recap
- Rebrand: project name is “Die letzte Dynastie”.

### Gameplay Loop
- Loop runs via `EltheonJS.scheduler.every('gameTick', 1000, ...)`.
- Start date: 01.04.0925 (`new Date(925, 3, 1)`).
- Day ticks every second; at day=1: process month (`nextMonth(true)`).
- Events: shown at month start without pausing the loop (Option A).
- Auto-resolve: if an event is still open at month rollover, the worst option is auto-selected (heuristic on label).
- End: when `month > 24`, end screen is shown and the scheduler is stopped.

### UI & Templates
- EltheonJS templating is used throughout; call `EltheonJS.templatingExt.init()` on DOM ready.
- Generic options template `options-list` renders event/build/recruit options with icons in labels.
- Province cards redesigned:
  - Stats grid with icons; food capacity meter; morale meter with color thresholds.
  - Production hints: food (net), gold (net), morale delta with tooltips showing breakdowns.
  - Badges for buildings (Markt, Kaserne, Fort, Tempel ×N).
  - Header shows role pill (Spieler/Vasall), AI emblem, and optional crest image (`crestImg`) or fallback initial (`crestText`).
- Icons: PNGs masked via CSS (`.icon` uses `mask-image` + `currentColor`) so they inherit text color.
  - Small variants live under `assets/img/icons/small/` (48x48).
 - Seasonal banner: header image rotates by season (Jan/Apr/Jul/Oct); assets in `assets/img/banners/`. Desktop framing uses vertical squash with top focus; mobile shows true 16:9.

### Architecture Notes
- `nextMonth` uses `DLD.logicEconomy.applyMonthlyEconomy` (required).
- AI uses `DLD.logicAI.applyAI` (required).
- End screen uses `DLD.logicScore`.
- Date formatting and progress bar use `DLD.logicDatetime`.
- Option label scoring/iconization uses `DLD.logicText`.

### State & Testing
- Global state module is not used yet; ignore `EltheonJS.state` for now.
- Manual playtest: verify loop ticks, auto-resolve at month change, build/recruit actions, and end screen.

### Sync
- Use `npm run sync:host` to mirror files to Windows path for local review.

### Notes for Contributors
- When adding new option labels, keep resource words (Nahrung/Gold/Moral/Truppen/Arbeiter) so the iconizer can detect and decorate them.
- For new provinces, you can set `crestImg` (prefer square SVG/PNG ~26–64px) or rely on `crestText` fallback.
