# PersonalMediaTracker — Claude Code Instructions

## Project

Electron + React + TypeScript desktop app for personal book tracking. Local-first, no backend, no auth.

- Build tool: electron-vite
- Styling: plain CSS (dark theme, custom properties) — no CSS frameworks
- Storage: three local JSON files (`data/books.json`, `data/books-meta.json`, `data/config.json`)
- Window: locked 16:10 ratio (1280×800), minimum 800×500

## Code style

- **No comments** by default. Only add one when the WHY is non-obvious (hidden invariant, workaround for a specific bug). Never explain what the code does.
- No backwards-compat shims, no commented-out code, no unused exports.
- Prefer editing existing files over creating new ones.
- Don't add features, abstractions, or error handling beyond what the task requires.

## CSS

- When removing a component or feature, also remove all its CSS classes from `src/renderer/index.html` / `index.css`. Grep for orphaned class names and delete them completely.

## Commits

- **Before creating any commit, remind the user to update the version in `package.json`.**
- Each commit must leave the app in a fully usable state. If a feature spans model + form + view, bundle them into one commit.
- Use conventional commit prefixes: `feat:`, `fix:`, `chore:`, `refactor:`.

## Version bumps

When bumping the version, update it in **all three places**:
1. `package.json` — `"version"` field
2. `src/renderer/index.html` — `<title>` tag
3. `README.md` — heading `# PersonalMediaTracker vX.Y.Z`

## Architecture notes

- Status (`pending` | `in-progress` | `finished` | `abandoned`) is derived by `getStatus(book)` — never stored.
- `tags` is omitted from JSON when undefined or empty — enforced by `normalizeBook()` in `src/main/index.ts`.
- Rereading / resuming always pushes a new `Reading` entry — never mutates an existing one.
- `WORDS_PER_LINE = 9` in `src/renderer/src/utils.ts` is the single source of truth for word-count estimates.
