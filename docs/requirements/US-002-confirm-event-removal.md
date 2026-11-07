<!--
Story produced from the Hokie Scheduler enhancement request: "Clicking remove on
an event or class asks for confirmation first, so a misclick no longer deletes
it. Cancelling keeps the event."
Grounded in: src/src/App.tsx (selectedEvent details Modal, "Remove from
schedule" button, setEvents filter, "Event removed" toast), src/src/components/
ScheduleCalendar.tsx (Day/Week/Month rendering via occursOn), src/src/components/
RecommendedCourses.tsx (CourseDetailsModal "Already in your schedule"),
src/src/types/index.ts (ScheduleEvent.courseId), src/src/data/mockData.ts.
-->

# User Stories: Hokie Scheduler

## US-002 — Confirm before removing an event or class from the schedule

**Story:** As a student planning my semester in Hokie Scheduler, I want to be asked to confirm before an event or class is removed from my schedule, so that a misclick does not delete the item I was only trying to inspect, and cancelling keeps the item exactly as it was.

**Acceptance Criteria**
1. Given the details dialog for a personal event (a `ScheduleEvent` with no `courseId`, e.g. "Gym") is open, when I click "Remove from schedule", then a confirmation prompt appears that names the item being removed and offers an explicit confirm action and an explicit cancel action, and no change has yet been applied to my schedule.
2. Given the confirmation prompt is showing for a personal event, when I choose cancel, then the event is still present on my calendar in the Day, Week, and Month views, the confirmation prompt closes, and no "Event removed" toast is shown.
3. Given the confirmation prompt is showing for a personal event, when I confirm the removal, then that event disappears from every view and every day it occupied, only that event is removed (all other events remain unchanged), the details dialog closes, and a removal confirmation message (the existing toast with `role="status"`) is shown.
4. Given the details dialog for a class on my schedule (a `ScheduleEvent` whose `courseId` is set, e.g. "CS 3114") is open, when I click "Remove from schedule" and then choose cancel, then the class remains on my calendar, the `CourseDetailsModal` for that course still reports "Already in your schedule", and the class does not reappear among the recommended/available courses.
5. Given the confirmation prompt is showing for a class, when I confirm the removal, then every meeting occurrence of that class (all days in its `days` list, in Day, Week, and Month views) is removed, and opening that course in `CourseDetailsModal` afterwards offers "Add to Schedule" again rather than "Already in your schedule".
6. Given the confirmation prompt is showing for either an event or a class, when I dismiss it without confirming (cancel action, Escape key, or clicking outside the prompt), then the item is retained and the outcome is identical to criterion 2 or 4 respectively.
7. Given I open a details dialog and close it without ever clicking "Remove from schedule", then no confirmation prompt is shown and no item is removed.
8. Given the confirmation prompt is showing for one item, when I confirm, then only that item is removed: other items that share the same title, day, or time slot are unaffected.

**Priority:** Must-have (MoSCoW)

**Related requirements:** No `REQ-###` or `UC-###` identifiers exist for this enhancement yet; this story traces to the Hokie Scheduler enhancement request "confirmation before event/class removal" and to the current removal behaviour in `App.tsx` (the details `Modal` opened via `selectedEvent`, whose primary button currently calls `setEvents(events.filter((e) => e.id !== selectedEvent.id))` immediately). Traceability links should be added once the corresponding requirement or use case is filed.

**Assumptions / dependencies:**
- Assumes a single removal entry point exists: clicking an item in `ScheduleCalendar` opens the details `Modal` in `App.tsx`, and that dialog's destructive action is the current "Remove from schedule" button. If a separate remove control (for example on the calendar item itself or in the class list) is added, criteria 1–8 apply to that control too. Verify with the team before implementation.
- Assumes a class is represented as its meeting `ScheduleEvent` carrying `courseId` (see `mockData.baseEvents` and `addCourse` in `App.tsx`), so "event" and "class" share one removal path and differ only in whether `courseId` is set. Verify against the current data model in `types/index.ts`.
- Assumes the confirmation step precedes the existing state update and toast: the removal effect on `events` and the "Event removed" toast occur only on confirm. Verify by inspection of the `Modal` footer handler in `App.tsx`.
- Assumes cancelling leaves the details dialog's underlying item intact but does not require the details dialog itself to stay open — whether cancel returns to the details dialog or closes it is not specified by the enhancement request and needs a decision (see open questions).
- Assumes no undo/restore is in scope: confirmation replaces the need for an undo affordance for this story.
- Assumes removal is in-memory only, matching current behaviour (`events` React state, no persistence layer); the story therefore makes no claim about surviving a page reload.
- Open question for Dr. Brown / the team: should the confirmation prompt be an in-app dialog consistent with the existing `Modal` component, or is a browser-native confirmation acceptable?
- Open question for Dr. Brown / the team: `chooseOption` in `App.tsx` rebuilds the schedule from `baseEvents` plus the chosen schedule option, so a removed base class can reappear or a removed class can be re-added by selecting a comparison option. Confirm whether US-002 must cover that resurrection path or whether it is handled in a follow-up story.
- Open question for Dr. Brown / the team: what wording and button labels should the confirmation use (for example "Remove CS 3114?" with "Remove" / "Keep"), so the destructive action is not the default-focused control.
