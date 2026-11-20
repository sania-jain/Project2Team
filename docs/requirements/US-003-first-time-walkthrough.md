<!--
Story produced from the Hokie Scheduler enhancement idea in the team contract:
"Instructions or some type of walkthrough for first-time users" (Usability
improvements). AI-generated following docs/templates/user-story.md;
reviewed by the team in the pull request.
Grounded in: src/src/App.tsx (request box, filters, recommendations, calendar,
Compare Schedules page), src/src/components/Header.tsx, src/src/components/
Modal.tsx.
-->

# User Stories: Hokie Scheduler

## US-003 — Walkthrough for first-time users

**Story:** As a student opening Hokie Scheduler for the first time, I want a short step-by-step walkthrough of how the app works, and a way to reopen it later, so that I know how to ask for courses, filter them, add them to my schedule, and compare schedules without guessing.

**Acceptance Criteria**
1. Given I have never completed or dismissed the walkthrough in this browser, when the app loads, then a "Welcome to Hokie Scheduler" dialog opens on step 1 of 5 and shows the progress ("Step 1 of 5").
2. Given the walkthrough is open, when I choose Next, then the next step is shown, and on any step after the first, when I choose Back, then the previous step is shown.
3. Given the walkthrough is open, when I select one of the progress dots, then that step is shown and its dot is marked as the current step.
4. Given the walkthrough is on its last step, when I look at the footer, then the primary button reads "Get started" instead of "Next", and choosing it closes the walkthrough.
5. Given the walkthrough is open, when I close it with Skip, Get started, the close (X) button, the Escape key, or a click outside the dialog, then it closes and is remembered as seen.
6. Given I have already closed the walkthrough, when I reload the app, then the walkthrough does not open automatically.
7. Given I have already closed the walkthrough, when I select "How it works" in the header, then the walkthrough opens again on step 1.
8. Given the browser blocks or lacks local storage, when the app loads, then the walkthrough still opens and the app does not crash, even though it cannot remember that I closed it.
9. Given each walkthrough step, when it is displayed, then it names a real part of the interface (the request box, Filters, AI Recommended Courses, My Schedule, Compare Schedules) and describes what the student does there.

**Priority:** Should-have (MoSCoW)

**Related requirements:** Team contract enhancement idea "Instructions or some type of walkthrough for first-time users". Design: SD-003. Related usability work: US-002 (confirm before removing an event).

**Assumptions / dependencies:**
- "Seen" is stored per browser in `localStorage`; the app has no user accounts, so it is not shared across devices.
- The walkthrough reuses the existing `Modal` component, so focus trapping, Escape and backdrop-click behaviour match the rest of the app.
- The step text describes the current interface; if a page or control is renamed, `walkthroughSteps` in `src/src/services/onboarding.ts` must be updated too.
- The team contract notes that prompts shorter than three words give poor results, so step 1 advises full-sentence requests.
