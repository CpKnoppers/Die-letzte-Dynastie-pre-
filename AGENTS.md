# Repository Guidelines

## Project Structure & Modules
- Root HTML: `index.html` (landing) and `game.html` (playable prototype).
- Assets: `assets/`
  - Styles: `assets/css/style.css`
  - Scripts: `assets/js/script.js`, optional module `eltheonFull.esm.js`
  - Images: `assets/img/`
- Design spec: `README.md` (German, game and economy details). Treat as source of truth.

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
- Keep `script.js` focused on UI + simple state; if logic grows, split into `assets/js/` modules.

## Testing Guidelines
- Manual playtest: verify monthly progression, event choices, build/recruit options, and end screen.
- Cross‑browser sanity: latest Chrome and Firefox.
- Console hygiene: no uncaught errors or noisy logs.
- If adding logic modules, prefer lightweight unit tests (e.g., Jest) in `assets/js/__tests__/` with `*.test.js` and pure functions without DOM.

## Commit & Pull Request Guidelines
- Commits: imperative, concise; prefer Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`). Example: `feat: add temple building and morale tick`.
- Scope small; one topic per commit.
- PRs: include summary, rationale, before/after screenshots for UI, test notes (manual steps), and link related issues.

## Security & Configuration Tips
- No secrets or tokens in the repo; this is a static site.
- Keep images optimized (PNG/JPG < 500 KB where possible) to reduce load times.
- When introducing third‑party libraries, add them under `assets/js/` and document their purpose and license in the PR.

