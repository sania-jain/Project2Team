# Sequence Diagram: first-time-walkthrough

**Document ID:** SD-003
**Derives from:** US-003 — Walkthrough for first-time users

<!--
AI-generated following docs/templates/sequence-diagram.md; reviewed by the
team in the pull request.
-->

## Diagram

```
[ Student ]          [ App :UI ]            [ onboarding :module ]       [ localStorage :Storage ]     [ Walkthrough :Modal ]
    |                     |                           |                            |                            |
    |  1. open app        |                           |                            |                            |
    |-------------------->|                           |                            |                            |
    |                     |  2. hasSeenWalkthrough()  |                            |                            |
    |                     |-------------------------->|                            |                            |
    |                     |                           |  3. getItem(KEY)           |                            |
    |                     |                           |--------------------------->|                            |
    |                     |                           |  4. null | "true" | throws |                            |
    |                     |                           |<- - - - - - - - - - - - - -|                            |
    |                     |  5. seen: boolean         |                            |                            |
    |                     |<- - - - - - - - - - - - - |                            |                            |
    |                     |                           |                            |                            |
    | [alt: not seen]     |                           |                            |                            |
    |                     |  6a. render step 1 of 5   |                            |                            |
    |                     |------------------------------------------------------------------------------------>|
    |  7a. show step 1    |                           |                            |                            |
    |<------------------------------------------------------------------------------------------------------------|
    |  8a. Next / Back / dot (repeat)                 |                            |                            |
    |------------------------------------------------------------------------------------------------------------>|
    |  9a. Skip / Get started / X / Esc / backdrop    |                            |                            |
    |------------------------------------------------------------------------------------------------------------>|
    |                     |  10a. onClose()           |                            |                            |
    |                     |<------------------------------------------------------------------------------------|
    |                     |  11a. markWalkthroughSeen()                            |                            |
    |                     |-------------------------->|                            |                            |
    |                     |                           |  12a. setItem(KEY,"true")  |                            |
    |                     |                           |--------------------------->|                            |
    |  13a. dialog closes |                           |                            |                            |
    |<- - - - - - - - - - |                           |                            |                            |
    |                     |                           |                            |                            |
    | [else: seen]        |                           |                            |                            |
    |  6b. dashboard, no dialog                       |                            |                            |
    |<- - - - - - - - - - |                           |                            |                            |
    | [end alt]           |                           |                            |                            |
    |                     |                           |                            |                            |
    |  14. "How it works" (Header)                    |                            |                            |
    |-------------------->|                           |                            |                            |
    |                     |  15. render step 1 of 5 (then 8a-13a)                  |                            |
    |                     |------------------------------------------------------------------------------------>|
```

## Notation
- header row — participants; the `:Type` suffix names the real code symbol
- vertical line — lifeline (time flows downward)
- `--->` solid arrow — call; `<- - -` dashed arrow — return
- messages are numbered in time order; branch messages use `<step><branch>` (`6a`, `6b`)
- `[alt: ...]` / `[else: ...]` / `[end alt]` — exactly one branch runs per page load
- arrows spanning non-adjacent lifelines pass over the lifelines in between

## Scenario
- **Use case:** first-time student learns the app; returning student reopens the help. No `UC-###` exists for this scenario; see US-003.
- **Preconditions:** the app is loading in a browser; `KEY` is `hokie-scheduler:walkthrough-seen`.
- **Outcome:** **Not seen (6a–13a):** the walkthrough is shown, and after any close gesture the key is stored as `"true"`. **Seen (6b):** the dashboard loads without the dialog. **Reopen (14–15):** the walkthrough is shown again from step 1 regardless of the stored value.
- **Related requirement:** US-003 — Walkthrough for first-time users.

**Notes**
- **Where the code lives:** `App` owns the `walkthrough` state, initialised lazily from `hasSeenWalkthrough(browserStorage())` so storage is read once per load (messages 2–5). `Walkthrough` (`src/src/components/Walkthrough.tsx`) owns only the current step and wraps the shared `Modal`. Storage access and the step text live in `src/src/services/onboarding.ts`, which has no React dependency so it can be unit tested with `node:test`.
- **Failure handling (US-003 AC 8):** if `localStorage` is missing or throws at message 3, `hasSeenWalkthrough` returns `false` and the walkthrough is shown; if message 12a throws, the error is swallowed and the walkthrough simply shows again next visit.
- **Close gestures:** Skip, Get started, the X button, Escape (`onCancel`) and a backdrop click all reach the same `onClose` (message 10a), so every exit is remembered.
- **Step navigation (8a)** stays inside `Walkthrough`; `clampStep` keeps Back and Next within steps 1–5.

## Design decision
- **Chosen:** a modal step-through reusing `Modal`, with the "seen" flag in `localStorage`.
- **Alternatives considered:** anchored tooltips over each control (rejected: positions break across the responsive layouts at 1120, 800 and 520 px, and would need a new dependency); a static help page (rejected: first-time users would have to find it themselves); storing the flag on a server (rejected: the app has no accounts).
- **Trade-off:** the walkthrough describes the interface in words rather than pointing at it, so its text must be kept in sync with control names (see US-003 assumptions).

## Messages
| # | From → To | Message | Kind |
|---|-----------|---------|------|
| 1 | Student → [:App] | open Hokie Scheduler | call |
| 2 | [:App] → [:onboarding] | `hasSeenWalkthrough(browserStorage())` in the `useState` initialiser | call |
| 3 | [:onboarding] → [:localStorage] | `getItem("hokie-scheduler:walkthrough-seen")` | call |
| 4 | [:localStorage] → [:onboarding] | `null`, `"true"`, or an exception | return |
| 5 | [:onboarding] → [:App] | `true` only when the value is `"true"`; otherwise `false` | return |
| 6a | [:App] → [:Walkthrough] | render `<Walkthrough onClose={closeWalkthrough} />` | call |
| 7a | [:Walkthrough] → Student | "Welcome to Hokie Scheduler", step 1 of 5 | return |
| 8a | Student → [:Walkthrough] | Next, Back, or a progress dot (`setStep(clampStep(...))`) | call |
| 9a | Student → [:Walkthrough] | Skip, Get started, X, Escape, or backdrop click | call |
| 10a | [:Walkthrough] → [:App] | `onClose()` → `closeWalkthrough` | call |
| 11a | [:App] → [:onboarding] | `markWalkthroughSeen(browserStorage())` | call |
| 12a | [:onboarding] → [:localStorage] | `setItem(KEY, "true")`; errors ignored | call |
| 13a | [:App] → Student | `setWalkthrough(false)`; dialog closes | return |
| 6b | [:App] → Student | dashboard renders with no dialog | return |
| 14 | Student → [:App] | click "How it works" in `Header` (`onHelp`) | call |
| 15 | [:App] → [:Walkthrough] | `setWalkthrough(true)`; a new `Walkthrough` mounts at step 1 | call |
