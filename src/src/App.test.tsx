// AI-generated integration tests (Claude): the PR #1 calendar flows through App.
import "./test/setupDom";
import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react";
import App from "./App";
import { requestSchema, type Dependencies } from "../server/contracts";
import { parseTimetable } from "../server/providers/vt";
import { recommend } from "../server/recommend";

const realFetch = globalThis.fetch;
afterEach(() => {
  cleanup();
  globalThis.fetch = realFetch;
});

const columnIndex = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4 };
type Day = keyof typeof columnIndex;

function setup() {
  const view = render(<App />);
  const body = view.baseElement as HTMLElement;
  const column = (day: Day) =>
    body.querySelectorAll<HTMLElement>(".day-column")[columnIndex[day]];
  const titles = (day: Day) =>
    [...column(day).querySelectorAll("strong")].map((s) => s.textContent);
  const dialog = () => body.querySelector<HTMLElement>("dialog");
  const openEvent = (day: Day, title: string) => {
    const block = [...column(day).querySelectorAll("button")].find(
      (b) => b.querySelector("strong")?.textContent === title,
    );
    assert.ok(block, `${title} should be on ${day}`);
    fireEvent.click(block);
    return dialog()!;
  };
  // Reads the <dt>/<dd> pairs of the event details dialog.
  const details = () =>
    Object.fromEntries(
      [...dialog()!.querySelectorAll("dl > div")].map((row) => [
        row.querySelector("dt")?.textContent,
        row.querySelector("dd")?.textContent,
      ]),
    );
  const addEvent = (values: Record<string, string>) => {
    fireEvent.click(view.getByRole("button", { name: /add event/i }));
    for (const [name, value] of Object.entries(values))
      fireEvent.change(dialog()!.querySelector(`[name="${name}"]`)!, {
        target: { value },
      });
    fireEvent.click(
      within(dialog()!).getByRole("button", {
        name: "Save event",
        hidden: true,
      }),
    );
  };
  return { ...view, body, column, titles, dialog, openEvent, details, addEvent };
}

test("clicking a class shows its full name along with the meeting details", () => {
  const { openEvent, details } = setup();
  openEvent("Mon", "CS 3114");
  assert.deepEqual(details(), {
    Course: "Data Structures and Algorithms",
    When: "Mon / Wed / Fri",
    Time: "9:00 AM – 9:50 AM",
    Location: "Torgersen Hall",
  });
});

test("clicking a personal event shows no Course row", () => {
  const { openEvent, details } = setup();
  openEvent("Tue", "Gym");
  const shown = details();
  assert.equal(shown.Course, undefined);
  assert.equal(shown.When, "Tue");
});

test("the calendar has one fixed week with no date navigation", () => {
  const { queryByRole, queryByLabelText, body } = setup();
  for (const name of ["Day", "Week", "Month"])
    assert.equal(queryByRole("button", { name }), null);
  assert.equal(queryByLabelText(/^(previous|next) /i), null);
  assert.equal(body.querySelectorAll(".day-column").length, 5);
});

test("saving a personal event adds it to the chosen weekday only", () => {
  const { addEvent, titles, dialog, openEvent, details, queryByText } = setup();
  addEvent({ name: "Study group", day: "4", start: "08:00", end: "08:45" });
  assert.equal(dialog(), null, "the form closes after saving");
  assert.ok(queryByText("Personal event added to your calendar"));
  assert.ok(titles("Thu").includes("Study group"));
  for (const day of ["Mon", "Tue", "Wed", "Fri"] as const)
    assert.ok(!titles(day).includes("Study group"), day);
  openEvent("Thu", "Study group");
  assert.equal(details().When, "Thu");
  assert.equal(details().Course, undefined);
});

test("an invalid event keeps the form open and leaves the calendar alone", () => {
  const { addEvent, titles, dialog } = setup();
  addEvent({ name: "Backwards", start: "12:00", end: "11:00" });
  assert.ok(dialog(), "the form stays open");
  assert.match(dialog()!.textContent ?? "", /End time must be after start time/);
  assert.ok(!titles("Mon").includes("Backwards"));
});

const pressInDialog = (dialog: HTMLElement, name: string) =>
  fireEvent.click(within(dialog).getByRole("button", { name, hidden: true }));

test("removing an event takes a confirmation, then removes every occurrence", () => {
  const { openEvent, titles, dialog, queryByText } = setup();
  const details = openEvent("Mon", "CS 3114");
  pressInDialog(details, "Remove from schedule");
  assert.ok(dialog(), "the dialog stays open to confirm");
  assert.ok(titles("Mon").includes("CS 3114"), "nothing is removed yet");
  pressInDialog(details, "Yes, remove");
  assert.equal(dialog(), null);
  assert.ok(queryByText("Event removed"));
  for (const day of ["Mon", "Wed", "Fri"] as const)
    assert.ok(!titles(day).includes("CS 3114"), day);
});

test("declining the confirmation keeps the event on the schedule", () => {
  const { openEvent, titles, dialog, queryByText } = setup();
  const details = openEvent("Tue", "Gym");
  pressInDialog(details, "Remove from schedule");
  pressInDialog(details, "Keep it");
  assert.ok(dialog(), "back on the details view");
  assert.ok(titles("Tue").includes("Gym"));
  assert.equal(queryByText("Event removed"), null);
});

test("reopening an event after backing out does not stay in confirm mode", () => {
  const { openEvent, dialog } = setup();
  const first = openEvent("Tue", "Gym");
  pressInDialog(first, "Remove from schedule");
  fireEvent.click(within(first).getByLabelText("Close dialog"));
  assert.equal(dialog(), null);
  const second = openEvent("Tue", "Gym");
  assert.ok(
    within(second).queryByRole("button", {
      name: "Remove from schedule",
      hidden: true,
    }),
  );
  assert.equal(
    within(second).queryByRole("button", { name: "Yes, remove", hidden: true }),
    null,
  );
});

test("changing semester relabels the calendar and keeps the same week", () => {
  const { body, getByLabelText, titles } = setup();
  fireEvent.change(getByLabelText(/Semester/), {
    target: { value: "Spring 2027" },
  });
  assert.match(
    body.querySelector(".calendar-toolbar p")?.textContent ?? "",
    /Spring 2027\s*•\s*Weekly View/,
  );
  assert.ok(titles("Mon").includes("CS 3114"));
});

test("a comparison preset adds a class whose name shows in its details", () => {
  const { getAllByRole, openEvent, details } = setup();
  // Options render as A, B, Best Match.
  fireEvent.click(getAllByRole("button", { name: "View Schedule" })[2]);
  openEvent("Tue", "CS 3724");
  assert.equal(details().Course, "Intro to Human-Computer Interaction");
});

const timetable = (days: string) =>
  `<table summary="This table displays the Timetable of Classes"><tr><td>CRN</td><td>Course</td></tr><tr><td>12345</td><td>CS-3724</td><td>Human Computer Interaction</td><td>L</td><td>Face-to-Face Instruction</td><td>3</td><td>40</td><td>N/A</td><td>${days}</td><td>10:00AM</td><td>11:15AM</td><td>MCB 100</td><td>10T</td></tr></table>`;

// Runs the real parser and recommender behind a stubbed network call.
function stubBackend(html: string) {
  const items = parseTimetable(html, "Fall 2026");
  const deps: Dependencies = {
    timetable: async () => ({
      items,
      status: { source: "vt-timetable", state: "ready", detail: "test" },
    }),
    catalog: async () => ({
      items: [],
      status: { source: "vt-catalog", state: "unavailable", detail: "test" },
    }),
    reviews: async () => ({
      items: [],
      status: {
        source: "ratemyprofessors",
        state: "not-configured",
        detail: "test",
      },
    }),
    reddit: async () => ({
      items: [],
      status: { source: "reddit", state: "not-configured", detail: "test" },
    }),
  };
  const requests: unknown[] = [];
  globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    requests.push(body);
    const result = await recommend(requestSchema.parse(body), deps);
    return new Response(JSON.stringify(result), { status: 200 });
  }) as typeof fetch;
  return requests;
}

async function addRecommendedCourse(ui: ReturnType<typeof setup>) {
  fireEvent.change(ui.getByLabelText("Ask for course recommendations"), {
    target: { value: "Show me CS electives" },
  });
  fireEvent.click(ui.getByRole("button", { name: "Find courses" }));
  const card = await waitFor(() => {
    const found = ui.body.querySelector<HTMLElement>(".course-card");
    assert.ok(found, "a recommendation card should appear");
    return found;
  });
  fireEvent.click(card);
  fireEvent.click(
    within(ui.dialog()!).getByRole("button", {
      name: "Add to Schedule",
      hidden: true,
    }),
  );
}

test("timetable class name reaches the calendar: parse, recommend, add, expand", async () => {
  const requests = stubBackend(timetable("T R"));
  const ui = setup();
  await addRecommendedCourse(ui);
  await waitFor(() => assert.ok(ui.titles("Tue").includes("CS 3724")));
  assert.ok(ui.titles("Thu").includes("CS 3724"));
  ui.openEvent("Tue", "CS 3724");
  assert.equal(ui.details().Course, "Human Computer Interaction");
  assert.equal(ui.details().Location, "MCB 100");
  // The app's own events, including courseName, must pass API validation.
  assert.equal(requests.length, 1);
});

test(
  "an added Saturday section can be seen on the calendar",
  {
    todo: "Finding: weekend sections can be added but the Mon–Fri calendar never draws them",
  },
  async () => {
    stubBackend(timetable("S"));
    const ui = setup();
    await addRecommendedCourse(ui);
    await waitFor(() =>
      assert.ok(ui.queryByText("CS 3724 added to your schedule")),
    );
    const visible = [...ui.body.querySelectorAll(".day-column strong")].some(
      (s) => s.textContent === "CS 3724",
    );
    assert.ok(visible, "an added section must appear on the calendar");
  },
);
