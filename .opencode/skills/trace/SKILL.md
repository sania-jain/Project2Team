---
name: trace
description: Map acceptance criteria to tests and find untraced criteria. Use when checking the traceability gate, when a user story has ACs such as US-002 AC1-AC8, or when /verify needs a traceability matrix.
---

# Trace Skill

Builds the acceptance-criteria-to-test traceability matrix for gate 6, and reports every
criterion that has no test and no manual test case.

## Layout facts

| What | Where (relative to repo root) |
|------|-------------------------------|
| User stories | `docs/requirements/US-*.md` |
| Automated tests | `src/src/services/*.test.ts`, `src/server/tests/**` |
| Manual test cases | `docs/tests/manual/*.md` |
| Report (written by `/verify`, not here) | `docs/verification-report.md` |

## Step 1 — Extract the criteria

Read each `docs/requirements/US-*.md`. The criteria are the numbered list under
`**Acceptance Criteria**`. Give each one the ID `<STORY>.AC<n>` using the story's own ID
from its heading (e.g. `US-002`) and the list position (`1` → `AC1`). US-002 has eight,
so the expected set is `US-002.AC1` … `US-002.AC8`.

Do not invent criteria, split one into several, or merge several into one. If a story's
numbering is ambiguous, report the ambiguity instead of guessing.

## Step 2 — Find the evidence

- **Automated:** search the test files for the tag `@ac <STORY>.AC<n>`, the convention
  established by `/test`. A tag may appear in a comment above a `test(...)` call or inside
  the test body. Record the file and test name that carries it.
- **Manual:** search `docs/tests/manual/*.md` for the same `@ac <STORY>.AC<n>` tag. A
  manual case must state the steps and the expected result, not just the tag.
- A criterion may have both; list every piece of evidence rather than only the first.

Search with `grep`/`rg` for the literal `@ac` token — do not infer coverage from a test's
name or from having read the source.

## Step 3 — Decide the row

| Status | Meaning |
|--------|---------|
| `covered` | at least one automated test or manual case carries the tag |
| `missing` | no test and no manual case carries the tag |

The gate passes only at **100% covered**. Report the count as `<covered>/<total>`.

## Step 4 — Report

Return this table to the invoking agent. `/verify` embeds it in the report; `/trace`
itself writes no files.

```md
### Traceability gate — <PASS|FAIL>

Criteria: <covered>/<total> covered

| Criterion | Status | Evidence |
|-----------|--------|----------|
| US-002.AC1 | covered | src/services/confirmRemoval.test.ts · "prompt names the item and applies nothing" |
| US-002.AC2 | missing | — |
```

After the table, list each `missing` criterion with the behaviour it demands and the
suggested test that would close it. Pass that list to `/test`.

## Known baseline

When first run, this project has **no `@ac` tags anywhere** and no `docs/tests/manual/`
directory, so every criterion reads `missing`. That is a real finding to report, not a
bug in the skill. Do not create placeholder manual cases to make the gate pass — a manual
case written only to satisfy the matrix is fabricated evidence. Write the real test, or
leave the row `missing` and let the verdict be not-ready.

## Rules

- **Do not edit tests, source, or the report.** This skill only reads and reports.
- **Never count a test as evidence without the tag.** A matching-looking test name is not
  a traceability link.
- **Never mark a criterion covered from source inspection alone.** Reading the code that
  implements a criterion proves the code exists, not that anything verifies it.
- **Never delete a criterion** from the matrix because it looks hard to test.

<instructions>
Trace by tag, not by name. Report exactly what you found.

ALWAYS:
- Derive IDs from the story heading and the numbered list order
- Quote the file and test name that carries each tag
- Report `missing` rows and the suggested test that would close them

DO NOT:
- Guess at coverage, or accept a tag you did not see
- Create placeholder tests or manual cases to reach 100%
- Write to `docs/verification-report.md` — that is the reviewer's file
</instructions>
