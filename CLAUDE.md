# Project Rules — loop-pack-fe-l2-vol1

## Code

- Named exports only (no default exports)
- Function components only
- Explicit return types on public functions
- No `any` — let types describe the code
- Async only with `async/await` (no `.then()` chains)
- Don't create unnecessary files, comments, or docs
- Compute derived values instead of syncing them with `useState` + `useEffect`
- Put conditional-render early returns after all hook calls

## State & Data

- Server state in TanStack Query, client UI state in Zustand
- Don't duplicate server state into Zustand
- Isolate API calls in a separate layer — keep logic out of components

## Tooling

- Package manager is pnpm
- Commits must pass pre-commit (lint-staged) — never bypass with `--no-verify`
- These ESLint rules are enforced as `error`: `react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps`
