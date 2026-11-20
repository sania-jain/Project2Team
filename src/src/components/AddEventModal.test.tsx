// AI-generated tests (Claude): AddEventModal's day-of-week form after PR #1.
import "../test/setupDom";
import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { AddEventModal } from "./AddEventModal";
import { conflicts, meetingDays, occursOn } from "../services/scheduler";
import type { ScheduleEvent } from "../types";

afterEach(cleanup);

// `hidden: true`: role queries otherwise depend on dialog visibility in jsdom.
function setup() {
  const saved: ScheduleEvent[] = [];
  let closed = 0;
  const view = render(
    <AddEventModal onClose={() => closed++} onSave={(e) => saved.push(e)} />,
  );
  const field = (name: string) =>
    view.baseElement.querySelector<HTMLInputElement>(`[name="${name}"]`)!;
  const fill = (values: Record<string, string>) => {
    for (const [name, value] of Object.entries(values))
      fireEvent.change(field(name), { target: { value } });
  };
  const save = () =>
    fireEvent.click(
      view.getByRole("button", { name: "Save event", hidden: true }),
    );
  const alert = () =>
    view.queryByRole("alert", { hidden: true })?.textContent ?? null;
  return {
    ...view,
    saved,
    field,
    fill,
    save,
    alert,
    closedCount: () => closed,
  };
}

test("the form offers Monday to Friday, defaulting to Monday", () => {
  const { field } = setup();
  const select = field("day") as unknown as HTMLSelectElement;
  assert.deepEqual(
    [...select.options].map((o) => [o.value, o.textContent]),
    [
      ["1", "Monday"],
      ["2", "Tuesday"],
      ["3", "Wednesday"],
      ["4", "Thursday"],
      ["5", "Friday"],
    ],
  );
  assert.equal(select.value, "1");
});

test("the form no longer asks for a specific date", () => {
  const { baseElement, field } = setup();
  assert.equal(field("date"), null);
  assert.equal(baseElement.querySelector('input[type="date"]'), null);
});

test("saving builds a recurring weekday event with no date", () => {
  const { saved, fill, save, alert } = setup();
  fill({
    name: "  Study group  ",
    day: "4",
    start: "09:30",
    end: "10:45",
    location: "  Newman Library ",
    notes: " bring laptop ",
  });
  save();
  assert.equal(alert(), null);
  assert.equal(saved.length, 1);
  const { id, ...rest } = saved[0];
  assert.ok(id.length > 0);
  assert.deepEqual(rest, {
    title: "Study group",
    days: [4],
    start: 9 * 60 + 30,
    end: 10 * 60 + 45,
    location: "Newman Library",
    notes: "bring laptop",
    color: "green",
  });
});

test("each saved event gets its own id", () => {
  const { saved, fill, save } = setup();
  fill({ name: "Coffee" });
  save();
  save();
  assert.equal(saved.length, 2);
  assert.notEqual(saved[0].id, saved[1].id);
});

test("an end time at or before the start time is rejected", () => {
  for (const [start, end] of [
    ["10:00", "10:00"],
    ["11:00", "10:00"],
  ]) {
    const { saved, fill, save, alert, unmount } = setup();
    fill({ name: "Backwards", start, end });
    save();
    assert.equal(alert(), "End time must be after start time.");
    assert.equal(saved.length, 0);
    unmount();
  }
});

test("times outside the 8 AM to 8 PM grid are rejected", () => {
  for (const [start, end] of [
    ["07:59", "09:00"],
    ["19:00", "20:01"],
  ]) {
    const { saved, fill, save, alert, unmount } = setup();
    fill({ name: "Off grid", start, end });
    save();
    assert.match(alert() ?? "", /between 8:00 AM and 8:00 PM/);
    assert.equal(saved.length, 0);
    unmount();
  }
});

test("an event spanning exactly 8 AM to 8 PM is accepted", () => {
  const { saved, fill, save, alert } = setup();
  fill({ name: "All day", start: "08:00", end: "20:00" });
  save();
  assert.equal(alert(), null);
  assert.equal(saved[0].start, 480);
  assert.equal(saved[0].end, 1200);
});

test("Cancel and the close icon both close without saving", () => {
  const { getByRole, getByLabelText, saved, closedCount } = setup();
  fireEvent.click(getByRole("button", { name: "Cancel", hidden: true }));
  fireEvent.click(getByLabelText("Close dialog"));
  assert.equal(closedCount(), 2);
  assert.equal(saved.length, 0);
});

test(
  "a name made only of spaces is rejected",
  { todo: "Finding: saves an event with an empty title" },
  () => {
    const { saved, fill, save } = setup();
    fill({ name: "   " });
    save();
    assert.equal(saved.length, 0);
  },
);

// Integration: the modal's output working with the scheduler helpers.
test("a saved event works with occursOn, meetingDays and conflicts", () => {
  const { saved, fill, save } = setup();
  fill({ name: "Tutoring", day: "3", start: "11:00", end: "12:00" });
  save();
  const tutoring = saved[0];
  assert.equal(meetingDays(tutoring.days), "Wed");
  // It repeats every Wednesday: 2026-09-02 and 2026-09-09 are both Wednesdays.
  assert.equal(occursOn(tutoring, new Date(2026, 8, 2)), true);
  assert.equal(occursOn(tutoring, new Date(2026, 8, 9)), true);
  assert.equal(occursOn(tutoring, new Date(2026, 8, 3)), false);

  const course: ScheduleEvent = {
    id: "math",
    title: "MATH 2204",
    days: [1, 3, 5],
    start: 11 * 60,
    end: 11 * 60 + 50,
    location: "Goodwin Hall",
    color: "blue",
  };
  assert.equal(conflicts(tutoring, course), true);
  assert.equal(conflicts(tutoring, { ...course, days: [2, 4] }), false);
  assert.equal(conflicts(tutoring, { ...course, start: 720, end: 770 }), false);
});
