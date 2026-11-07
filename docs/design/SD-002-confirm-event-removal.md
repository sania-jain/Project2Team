# Sequence Diagram: confirm-event-removal

**Document ID:** SD-002
**Derives from:** US-002 — Confirm before removing an event or class from the schedule

## Diagram

```
[ Student ]             [ EventDetailsModal :Modal ]        [ ScheduleCalendar :UI ]     [ ScheduleState :ScheduleEvent[] ]
    |                                 |                                 |                                 |
    |  1. click item "Gym"            |                                 |                                 |
    |------------------------------------------------------------------>|                                 |
    |                                 |                                 |                                 |
    |                                 |  2. onEvent(event)              |                                 |
    |                                 |<--------------------------------|                                 |
    |                                 |                                 |                                 |
    |  3. show details for event      |                                 |                                 |
    |<--------------------------------|                                 |                                 |
    |                                 |                                 |                                 |
    |  4. "Remove from schedule"      |                                 |                                 |
    |-------------------------------->|                                 |                                 |
    |                                 |                                 |                                 |
    |  5. prompt "Remove Gym?"        |                                 |                                 |
    |<--------------------------------|                                 |                                 |
    |                                 |                                 |                                 |
    | [alt: Student confirms]         |                                 |                                 |
    |                                 |                                 |                                 |
    |  6a. choose "Remove"            |                                 |                                 |
    |-------------------------------->|                                 |                                 |
    |                                 |                                 |                                 |
    |                                 |  7a. setEvents(filter)          |                                 |
    |                                 |------------------------------------------------------------------>|
    |                                 |                                 |                                 |
    |  8a. close details dialog       |                                 |                                 |
    |<--------------------------------|                                 |                                 |
    |                                 |                                 |                                 |
    |                                 |  9a. setSelectedOption(null)    |                                 |
    |                                 |------------------------------------------------------------------>|
    |                                 |                                 |                                 |
    |  10a. toast "Event removed"     |                                 |                                 |
    |<--------------------------------|                                 |                                 |
    |                                 |                                 |                                 |
    |                                 |                                 |  11a. item gone (all views)     |
    |                                 |                                 |<--------------------------------|
    |                                 |                                 |                                 |
    | [else: Student cancels]         |                                 |                                 |
    |                                 |                                 |                                 |
    |  6b. choose "Keep"              |                                 |                                 |
    |-------------------------------->|                                 |                                 |
    |                                 |                                 |                                 |
    |  7b. prompt closes              |                                 |                                 |
    |<--------------------------------|                                 |                                 |
    |                                 |                                 |                                 |
    |  8b. no setEvents / setToast    |                                 |                                 |
    |<- - - - - - - - - - - - - - - - |                                 |                                 |
    |                                 |                                 |                                 |
    | [end alt]                       |                                 |                                 |
    |                                 |                                 |                                 |
```

## Notation
- header row — participants (actors and system components); give components a `:Type` suffix
- vertical line — lifeline (time flows downward)
- `|` block between two lifeline points — activation bar (the participant is executing)
- `--->` solid arrow — synchronous message / call
- `<---` / `- ->` arrow back — return message
- number every message in time order (`1.`, `2.`, ...)
- `[condition]` — guard, or wrap optional/alternative fragments in a labeled `alt`/`opt` block
- `[alt: ...]` / `[else: ...]` / `[end alt]` — branch markers written beside the first lifeline; the messages between `[alt]` and `[else]` are the confirm path, the messages between `[else]` and `[end alt]` are the cancel path, and exactly one path runs per scenario
- messages after a branch point are numbered `<step><branch>` (`6a`, `7a`, ... versus `6b`, `7b`, ...) because both branches occur at the same point in time
- an arrow spanning non-adjacent lifelines passes over the lifelines in between (messages 1, 7a and 9a)
- the `:Type` suffix names the real code symbol: `:Modal` — the `Modal` component used for the event details dialog (`src/src/components/Modal.tsx`), `:UI` — React component, `:ScheduleEvent[]` — the type of the `events` state declared in `src/src/App.tsx`

## Scenario
- **Use case:** SD-002 `confirm-event-removal` — student confirms before an event or class is removed from the schedule. No `UC-###` identifier exists for this scenario yet; see US-002, "Related requirements".
- **Preconditions:** The details `Modal` is open for exactly one `ScheduleEvent` held in App state as `selectedEvent`, reached by clicking an item that `ScheduleCalendar` renders for the current Day, Week, or Month view (`occursOn(event, date)`); `events` contains that item; no confirmation prompt is showing yet.
- **Outcome:** **Confirm (6a–11a):** the selected `id` is absent from `events`, `selectedEvent` and `selectedOption` are `null`, the "Event removed" toast (`role="status"`) is displayed and self-clears after 4500 ms, and the item is no longer rendered in Day, Week, or Month. **Cancel (6b–8b):** `events` is unchanged, no toast is shown, the item is still rendered in every view it occupied, and no prompt remains.
- **Related requirement:** US-001 — no `docs/requirements/US-001-*.md` file exists in this repository at the time of writing, so US-001 is referenced by identifier only; this line must be updated with US-001's exact title once that story is filed.

**Notes**
- **Where the confirmation step is inserted:** the current `App.tsx` handler for the "Remove from schedule" button runs `setEvents(events.filter((e) => e.id !== selectedEvent.id))`, `setSelectedEvent(null)`, `setSelectedOption(null)` and `setToast("Event removed")` immediately, in one `onClick`. SD-002 inserts message 5 (the prompt) before message 7a; messages 7a–10a are reachable only through 6a, so the state update and the toast cannot fire without an explicit confirmation.
- **Events versus classes:** both are `ScheduleEvent` records and share one removal path. A class is a `ScheduleEvent` whose `courseId` is set (for example `id: "cs3114"`, `courseId: "CS 3114"`, `days: [1, 3, 5]`); a personal event has no `courseId` (for example `id: "gym"`, `title: "Gym"`, `days: [2]`). Removing a class that has several `days` removes all of its occurrences (11a), and because `CourseDetailsModal` derives its button state from `events.some((e) => e.courseId === course.id)`, the course returns to "Add to Schedule" after 7a. The diagram is drawn once with a personal event (`"Gym"`); substituting a class changes the wording of messages 4 and 5 only.
- **Ordering and rendering:** messages 7a, 8a, 9a and 10a are all state updates queued in the same handler, which is why 11a is a single re-render that follows them rather than a re-render per update.
- **Cancel variants:** 6b covers all three dismissal gestures from US-002 AC 6 — the explicit cancel action, the Escape key, and a click outside the prompt — because the existing `Modal` already routes both `onCancel` and backdrop clicks to `onClose`.
- **Scope:** the diagram covers the single removal entry point that exists today (the details dialog reached from `ScheduleCalendar`). A second entry point added later must reproduce messages 5–11a before calling `setEvents`.

## Messages
| # | From → To | Message | Kind |
|---|-----------|---------|------|
| 1 | Student → [:ScheduleCalendar] | click an item rendered in the current Day, Week, or Month view (`Gym`, or a class such as `CS 3114`) | call |
| 2 | [:ScheduleCalendar] → [:EventDetailsModal] | `onEvent(event)` — App's `setSelectedEvent(event)` makes the details `Modal` render | call |
| 3 | [:EventDetailsModal] → Student | display title, When, Time, Location and Notes for the event | return |
| 4 | Student → [:EventDetailsModal] | click "Remove from schedule" | call |
| 5 | [:EventDetailsModal] → Student | show confirmation prompt naming the item, with an explicit confirm and an explicit cancel action; no change has been applied yet | return |
| 6a | Student → [:EventDetailsModal] | choose the confirm action ("Remove") | call |
| 7a | [:EventDetailsModal] → [:ScheduleState] | `setEvents(events.filter((e) => e.id !== selectedEvent.id))` — only that `id` is removed | call |
| 8a | [:EventDetailsModal] → Student | close the details dialog (`setSelectedEvent(null)`) | return |
| 9a | [:EventDetailsModal] → [:ScheduleState] | `setSelectedOption(null)` — the chosen comparison option no longer matches the schedule | call |
| 10a | [:EventDetailsModal] → Student | show toast "Event removed" (`setToast`, `role="status"`, cleared after 4500 ms) | return |
| 11a | [:ScheduleState] → [:ScheduleCalendar] | re-render from `events`; `occursOn` is now false for the removed `id` in Day, Week, and Month | call |
| 6b | Student → [:EventDetailsModal] | choose the cancel action ("Keep"), press Escape, or click outside the prompt | call |
| 7b | [:EventDetailsModal] → Student | close the confirmation prompt | return |
| 8b | [:EventDetailsModal] → Student | no `setEvents` and no `setToast` are called; `events` is unchanged, so the item stays in every view it occupied | return (no message sent to [:ScheduleState]) |
