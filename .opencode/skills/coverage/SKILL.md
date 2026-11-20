---
name: coverage
description: Measure backend line coverage and find uncovered lines. Use when checking the 80% coverage gate, when /verify reports a coverage failure, or when deciding which tests to add next.
---

# Coverage Skill

Measures line coverage for the two directories the team holds to 80%, identifies the
uncovered lines, and reports them. Implements gate 5 of the quality gates.

## Layout facts

The npm project root is **`src/`**. Run every command with the bash `workdir` set to
`src`. Coverage uses **Node's built-in test-coverage support** (Node 24 is installed);
there is no `c8`, `nyc`, or `istanbul` in this project and none may be added without the
team's approval.

## The command

```sh
npx tsx --test --experimental-test-coverage \
  "--test-coverage-include=server/**/*.ts" \
  "--test-coverage-include=src/services/**/*.ts" \
  "--test-coverage-exclude=server/tests/**" \
  "--test-coverage-exclude=**/*.test.ts" \
  "--test-coverage-lines=80" \
  "src/services/*.test.ts" "server/tests/*.test.ts"
```

Keep the quotes: PowerShell on Windows will otherwise try to expand the globs. Each
argument is required and none may be removed:

- the two `--test-coverage-include` flags are the measured scope — `src/server/`
  (server code) and `src/src/services/` (client service logic)
- the two `--test-coverage-exclude` flags keep **test files themselves** out of the
  report; without them the suite reports near-100% by measuring its own assertions
- `--test-coverage-lines=80` is the threshold from the team's pass criteria

**Excluded by design:** the React UI (`src/src/components/`, `src/src/App.tsx`,
`src/src/main.tsx`, `src/src/data/`, `src/src/types/`) is not measured until a
component-testing library is approved. Do not add UI files to the include list on your
own initiative.

## Reading the result

Node prints a table of `file | line % | branch % | funcs % | uncovered lines`, and when the
threshold is missed it also emits:

```
ℹ Error: 70.82% line coverage does not meet threshold of 80%.
```

and exits with code `1`. The threshold is applied to the **aggregate** across all measured
files, not per file — a single file at 5% does not fail the run by itself, but it drags the
aggregate down. Report:

- the overall line percentage for the measured scope
- every file below 80%, with its percentage and its uncovered line numbers
- for each gap, the test file that should own the new assertion and the behaviour to pin

## The false-pass trap — check this every run

When nothing is instrumented, the report still prints:

```
ℹ file | line % | branch % | funcs % | uncovered lines
ℹ all files | 100.00 | 100.00 | 100.00 |
```

That is **not** a pass. A 100.00% row with **no file rows beneath it** means no measured
file was ever loaded — typically because the tests failed to import, a dependency is
missing, or the include patterns match nothing. Treat it as a hard failure.

A coverage gate passes only when **all four** hold:

1. the process exit code is `0`
2. the report contains at least one file row (not just the `all files` line)
3. the aggregate line percentage is `>= 80`
4. no test in the same run failed, was cancelled, or was skipped

## Rules

- **Never lower the threshold**, drop an `--test-coverage-include`, add an exclusion for
  production code, delete a file to raise the percentage, or mark dead code with ignore
  comments. Those changes always need the team's approval.
- **Never add a coverage dependency.** If the built-in runner proves inadequate, report
  the limitation and stop; do not install `c8` or similar.
- **Never edit source or tests.** Report uncovered lines so the maintainer can fix code
  and `/test` can add the assertion.
- Be explicit that unloaded files never appear in the report: a module that no test
  imports is **invisible**, not 0%. Call out any such module you know about
  (for example `server/index.ts`, `server/config.ts`, `server/doctor.ts`) as a known gap.

## Output

```md
### Coverage gate — <PASS|FAIL>

Scope: server/**/*.ts, src/services/**/*.ts (tests excluded)
Threshold: 80% lines
Measured: <n> files, <x>% lines
Exit code: <code>
Files below threshold: <file> <x>% — uncovered lines <a-b, c>
Not loaded by any test (invisible, not 0%): <files>
```

<instructions>
Run the exact command above; report measured values, never estimates.

ALWAYS:
- Quote the real table and the real exit code
- Confirm at least one file row exists before calling the gate a pass
- Name the uncovered lines and the test that should cover them

DO NOT:
- Change the include/exclude lists or the 80 threshold
- Report a percentage you did not measure
- Add a coverage tool
- Edit code or tests to improve the number yourself
</instructions>
