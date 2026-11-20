---
name: test
description: Write and run tests that try to break the code with edge cases, tagging each acceptance criterion. Use when adding tests for a user story, an acceptance criterion, or an uncovered branch discovered by /coverage.
---

# Test Skill

Writes and runs tests for Hokie Scheduler. Produces new or strengthened test cases under
the project's existing test files, tagged so `/trace` can map them to acceptance criteria.

## Layout facts (read before writing anything)

The npm project root is **`src/`**, not the repo root. All commands run with the bash
`workdir` set to `src`.

| What | Where (relative to `src/`) |
|------|----------------------------|
| Client/service tests | `src/services/*.test.ts` |
| Server tests | `server/tests/*.test.ts` |
| Source that tests may import | `src/**` (React + `src/services/`), `server/**` |
| Test runner | `node:test` + `node:assert/strict`, run through `tsx` |

There is no test framework beyond Node's built-in runner: **do not add one**. Do not add,
remove, or upgrade any dependency (`npm install`, `npm i`, editing `package.json`,
`package-lock.json`) — that needs the team's approval, so stop and ask.

## How to work

1. **Read the target.** Parse the user story in `docs/requirements/` (or the module named
   by the caller) and the source under test. List the behaviour the code is supposed to
   have before you look at how it currently behaves.
2. **Enumerate edge cases first**, in writing, then write the tests. Cover at least:
   - boundaries: empty list, single item, first/last element, zero/negative durations
   - invalid input: `null`/`undefined` fields, wrong types, malformed dates, bad time strings
   - state transitions: cancel/confirm, repeated calls, ordering of two events
   - isolation: two items that share a title, day, or time slot must not affect each other
   - time: recurring (`days`) versus date-specific (`date`) events; day rollover
3. **Match the house style.** Look at an existing file (e.g.
   `src/services/scheduler.test.ts`) and follow it: `import test from "node:test"`,
   `import assert from "node:assert/strict"`, one `test("...")` per behaviour, plain
   `assert.equal`/`assert.deepEqual`.
4. **Tag every test** that verifies an acceptance criterion, on its own line immediately
   above or inside the test comment:

   ```ts
   // @ac US-002.AC3
   test("confirming removal drops the event and shows the toast", () => {});
   ```

   Use one tag per criterion. The tag is `@ac <STORY-ID>.AC<n>`, matching the numbered
   list under `**Acceptance Criteria**` in `docs/requirements/<STORY-ID>-*.md`.
5. **Run and report.** Run `npm test` from `src`. Report the raw summary
   (tests/pass/fail/skipped) and the exit code.

## Output

Return a short report to the invoking agent:

- tests added or changed, with file and test name
- the `@ac` tags covered
- the run result, verbatim from the runner
- **bugs found**: for each failing assertion that reveals a defect in `src/`, state the
  file, the function, the input that breaks it, and the observed versus expected value.
  Do not fix it — surface it so the maintainer can, with approval.

## Rules

- **Never edit source.** You may edit only `src/services/*.test.ts` and
  `server/tests/**`. If the code is wrong, write a failing test and report it.
- **Never weaken a test to make it pass.** No `.skip`, no `.todo`, no commenting out an
  assertion, no loosening `assert.equal` to a truthiness check, no catch-and-ignore, no
  widening a tolerance. No `--test-name-pattern`, `--test-only`, or `--test-skip-pattern`
  to dodge a failure. A skipped test is a failing gate.
- **Do not lower expectations to match a bug.** Write the assertion the story requires
  and let it fail.
- **Never touch** `package.json`, `package-lock.json`, `.oxlintrc.json`, `tsconfig*.json`,
  `vite.config.js`, `PHASE.md`, `AGENTS.md`, or anything under `.github/`.
- **Never read `.env`** or any other secret-bearing file; use `.env.example` if you need
  the variable names.

<instructions>
Follow the edge-case-first workflow: list the cases in writing, then encode them.

ALWAYS:
- Read the source before writing assertions, so tests pin real behaviour, not guesses
- Use the existing `node:test` style already in the repository
- Tag acceptance-criterion tests with `@ac <STORY>.AC<n>`
- Run `npm test` and quote the actual result
- If a test hangs or the suite never terminates, stop and report it rather than retrying
  with broader flags

DO NOT:
- Add dependencies, frameworks, mocks libraries, or test helpers from npm
- Modify production code
- Skip, silence, or generalize a failing assertion
- Claim a test passes without having run it
</instructions>
