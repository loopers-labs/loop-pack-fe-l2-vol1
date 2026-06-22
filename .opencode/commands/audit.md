---
description: Run a read-only audit against project FSD, conventions, accessibility, and quality gates.
agent: hephaestus
---

# Audit Router

Arguments: $ARGUMENTS

You are the repository audit router for Loopers Pack Frontend L2 Vol.1.

## Goal

Audit the requested scope against the project rules without editing files.

## Scope Resolution

- No arguments: audit changed files.
- `--changed`: audit changed files.
- `--full`: audit `src`, root config files, `docs/rules`, and `.opencode`.
- Path arguments: audit only the requested paths.

When changed files are needed, inspect the working tree with read-only git commands. Include staged and unstaged changes.

## Read First

- `AGENTS.md`
- `docs/rules/conventions.md`
- `docs/rules/lint-and-format.md`
- `docs/rules/fsd-architecture.md`
- `docs/rules/accessibility.md`
- `docs/rules/testing.md`
- `docs/rules/audit.md`

## Route to Auditors

Run relevant auditors in parallel when available:

- `fsd-auditor` (`.opencode/agents/fsd-auditor.md`): always for `src/**` changes or architecture questions.
- `convention-auditor` (`.opencode/agents/convention-auditor.md`): always for code and documentation rule consistency.
- `a11y-auditor` (`.opencode/agents/a11y-auditor.md`): for `*.tsx`, `*.jsx`, CSS, UI, layout, interaction, or routing changes.
- `quality-auditor` (`.opencode/agents/quality-auditor.md`): always for verification gates, config changes, and suppressed errors.

If custom subagents are not available, perform the same checks yourself using the auditor documents in `.opencode/agents`.

## Must Do

- Stay read-only.
- Cite exact file paths and rules.
- Separate confirmed findings from risks and manual verification gaps.
- Prefer changed-file audit by default to keep feedback actionable.
- Report in Korean unless the user explicitly asks for English.
- Report required verification commands. Do not run commands that write files or build artifacts unless the user explicitly requested execution.

## Must Not Do

- Do not edit files.
- Do not run formatters or fix commands.
- Do not run build commands during the audit unless explicitly requested; builds may write artifacts such as `dist` or cache files.
- Do not weaken lint, TypeScript, test, or build settings.
- Do not suggest `any`, `as any`, TypeScript suppression comments, ESLint disable comments, or Git hook bypasses.

## Output Format

Use this format:

```txt
## 감사 범위
- ...

## 결과 요약
- ...

## Findings
[P1] path/to/file.tsx:line
원인: ...
해결: ...
근거: ...
신뢰도: High | Medium | Low

## 수동 확인 필요
- ...

## 실행/확인한 검증
- ...
```
