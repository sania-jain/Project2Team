---
name: verify
description: Run every quality gate in order and write docs/verification-report.md with a ready or not-ready verdict. Use before a milestone, or when asked whether the project is ready.
---

# Verify Skill

Runs all six gates in order, stops at the first hard failure, and writes the milestone
verification report. This is the only skill that produces `docs/verification-report.md`.

## Layout facts

The npm project root is **`src/`** — every `npm` command runs with the bash `workdir` set
to `src`. The report, requirements, and design docs live at the **repo root** under
`docs/`.

## Gates, in this order

| # | Gate | Command | Passes when |
|---|------|---------|-------------|
| 1 | Install | `npm ci` | exit 0, lockfile satisfied, no peer warnings treated as errors |
| 2 | Build | `npm run build` | exit 0 — `tsc -b`, `tsc -p tsconfig.server.json`, and `vite build` all succeed |
| 3 | Test | `npm test` | exit 0, `fail 0`, `skipped 0`, `cancelled 0` |
| 4 | Lint | `npm run lint` | exit 0, zero errors and zero warnings |
| 5 | Coverage | see `/coverage` | exit 0, ≥1 file row, ≥80% lines over the measured scope, no skipped tests |
| 6 | Trace | see `/trace` | 100% of acceptance criteria tagged in a test or a manual case |

Run them in that order and **stop at the first gate that fails**. Do not continue to later
gates to "gather more data" — a broken build makes the test result meaningless, and a
partial report invites a false ready verdict.

## Capture real output

For each gate record: the exact command, the exit code, and the measured value
(e.g. `tests 42, pass 42, fail 0, skipped 0`; `all files 86.41% lines`). Quote the actual
error text on failure. Never summarize an error you did not see and never write a
percentage or count you did not read from the tool's own output.

Get the commit SHA with `git rev-parse HEAD` from the repo root, and note whether the
working tree is dirty with `git status --porcelain` — a dirty tree means the report
describes uncommitted code, which must be stated.

**Trust exit codes, not colour.** Under PowerShell on Windows, a command that writes to
stderr is rendered as red `NativeCommandError` text even when it succeeded — `npm ci`
does this whenever it reports deprecation warnings. Read the exit code to decide pass or
fail, and quote the real error text when it genuinely fails.

**Formatting is not a gate.** `npx prettier --check` is a detection aid, not gate 4; the
lint gate is `npm run lint` (oxlint). Do not add a formatting gate on your own — the
current tree has pre-existing formatting drift, so it would fail permanently.

## Report format

Write to `docs/verification-report.md`, next to `docs/requirements/` and `docs/design/`.
Use exactly this structure:

```md
# Verification Report

**Commit:** <full SHA> (`<short SHA>`, `<branch>`)
**Working tree:** clean | dirty (<n> modified paths; verdict describes uncommitted code)
**Run:** <ISO-8601 timestamp>
**Verdict:** READY | NOT READY

## Gates

| # | Gate | Result | Measured | Notes |
|---|------|--------|----------|-------|
| 1 | Install (`npm ci`) | PASS | exit 0, 0 vulnerabilities reported | |
| 2 | Build (`npm run build`) | PASS | exit 0 | client and server compiled |
| 3 | Test (`npm test`) | PASS | tests 42, pass 42, fail 0, skipped 0 | |
| 4 | Lint (`npm run lint`) | PASS | exit 0, 0 errors, 0 warnings | |
| 5 | Coverage | FAIL | 71.20% lines over 4 files, threshold 80% | exit 0; see uncovered lines |
| 6 | Traceability | FAIL | 3/8 criteria covered | US-002.AC2, AC4, AC5, AC6, AC7 missing |

## Acceptance-criteria-to-test traceability

| Criterion | Status | Evidence |
|-----------|--------|----------|
| US-002.AC1 | covered | <file> · "<test name>" |
| US-002.AC2 | missing | — |

## Failure detail

<Only when the verdict is NOT READY. For the first failing gate, quote the command and the
verbatim error output, then state the smallest change that would clear it. One gate only —
the one that stopped the run.>

## Fixed by this agent

<What was changed, or "Nothing — the reviewer does not modify code.">

## Awaiting approval

<Each item that needs the team's sign-off before it can proceed, e.g.:
- Add `node:assert` case in `server/tests/degree.test.ts` to cover `audit.ts:88-94`
- Fix `recommend.ts:120` null-dereference (existing code, not caused by a verification change)
- Install `@testing-library/react` to bring the UI under coverage
- Raise coverage on `server/providers/reddit.ts` — currently excluded by import graph>

## Known gaps

- CI workflow `.github/workflows/github-actions.yml` is a placeholder: its test step only
  echoes `Running tests...` and never runs `npm ci`, `npm test`, or any gate.
- React UI (`src/src/components/`, `App.tsx`, `main.tsx`) is outside coverage until a
  component-testing library is approved.
- Files no test imports are absent from the coverage report rather than reported at 0%
  (e.g. `server/index.ts`, `server/config.ts`, `server/doctor.ts`), so coverage can read
  higher than the codebase's true coverage.
- <any other gap found this run>
```

## Deciding the verdict

`READY` only when all six gates pass. Any failure — including a skipped test, a lint
warning, an empty coverage table, or one untraced criterion — is `NOT READY`. State the
verdict plainly and let the evidence support it. This is an engineering readiness
judgment about the software; it is not a grade, and it carries no authority over
deadlines or academic outcomes.

## Failure behaviour

On a failing gate:

1. **Stop** at that gate.
2. **Explain** the problem with the actual error output, the command, and the exit code.
3. **Classify** the failure: caused by the verification change, pre-existing, or
   environmental (missing `node_modules`, no network).
4. **Fix only what is yours.** A verifier may fix lint and formatting fallout from its own
   edits, and nothing else. Fixing existing code, editing or skipping tests, adding a
   dependency, or lowering a threshold **always** needs the team's approval — put it under
   *Awaiting approval* and hand it to the maintainer.

## Rules

- **Never weaken a gate to reach READY.** No threshold edits, no new coverage exclusions,
  no `.skip`, no deleting a test, no `--test-name-pattern` narrowing, no editing
  `package.json`, `.oxlintrc.json`, `tsconfig*.json`, or `.github/`.
- **Never run `npm install <pkg>`**, `npm i`, `git push`, `git commit`, or any mutation of
  git state.
- **Never read `.env`.** Use `.env.example` for variable names.
- **Never edit** `PHASE.md`, `AGENTS.md`, `docs/requirements/`, `docs/design/`, tests, or
  source. Your only writable file is `docs/verification-report.md`.
- **If the report path is not writable** for the current agent, return the completed
  report body instead of writing it, and say so.

<instructions>
Run every gate in order against the real repository; stop at the first failure.

ALWAYS:
- Set bash `workdir` to `src` for npm commands
- Record the command, the exit code, and the tool's own measured values for each gate
- Include the full commit SHA and whether the tree is dirty
- End the report with fixed / awaiting-approval / known-gaps

DO NOT:
- Mark READY with any failing, skipped, or untraced gate
- Estimate a number instead of reading it from the output
- Continue past a failed gate
- Fix existing code, tests, dependencies, or thresholds without approval
</instructions>
