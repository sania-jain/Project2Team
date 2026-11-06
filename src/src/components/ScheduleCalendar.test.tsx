// AI-generated tests (Claude): CalendarEvent and ScheduleCalendar after PR #1.
import "../test/setupDom";
import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { CalendarEvent, ScheduleCalendar } from "./ScheduleCalendar";
import type { ScheduleEvent } from "../types";

afterEach(cleanup);

const event = (overrides: Partial<ScheduleEvent> = {}): ScheduleEvent => ({
  id: "cs3114",
  title: "CS 3114",
  courseName: "Data Structures and Algorithms",
  days: [1, 3, 5],
  start: 14 * 60,
  end: 15 * 60,
  location: "Torgersen Hall",
  color: "pink",
  ...overrides,
});

function renderCalendar(events: ScheduleEvent[] = []) {
  const calls = { added: 0, opened: [] as ScheduleEvent[] };
  const view = render(
    <ScheduleCalendar
      events={events}
      semester="Fall 2026"
      onAdd={() => calls.added++}
      onEvent={(e) => calls.opened.push(e)}
    />,
  );
  const columns = [...view.container.querySelectorAll<HTMLElement>(".day-column")];
  return { ...view, calls, columns };
}

const titlesIn = (column: HTMLElement) =>
  [...column.querySelectorAll("strong")].map((s) => s.textContent);

// ---- CalendarEvent ----

test("CalendarEvent shows the course code, time range and location", () => {
  const { getByRole } = render(
    <CalendarEvent event={event()} onClick={() => {}} />,
  );
  const button = getByRole("button");
  assert.equal(button.querySelector("strong")?.textContent, "CS 3114");
  assert.match(button.textContent ?? "", /2:00 PM – 3:00 PM/);
  assert.match(button.textContent ?? "", /Torgersen Hall/);
  assert.equal(
    button.getAttribute("title"),
    "CS 3114 · 2:00 PM – 3:00 PM · Torgersen Hall",
  );
});

test("CalendarEvent keeps the full class name for the expanded view only", () => {
  const { getByRole } = render(
    <CalendarEvent event={event()} onClick={() => {}} />,
  );
  assert.doesNotMatch(
    getByRole("button").textContent ?? "",
    /Data Structures and Algorithms/,
  );
});

test("CalendarEvent applies the event colour and no longer has a compact mode", () => {
  const { getByRole } = render(
    <CalendarEvent event={event({ color: "blue" })} onClick={() => {}} />,
  );
  const button = getByRole("button");
  assert.ok(button.classList.contains("calendar-event"));
  assert.ok(button.classList.contains("blue"));
  assert.ok(!button.classList.contains("compact"));
});

test("CalendarEvent is positioned on the 8 AM to 8 PM grid", () => {
  const position = (start: number, end: number) => {
    const { getByRole, unmount } = render(
      <CalendarEvent event={event({ start, end })} onClick={() => {}} />,
    );
    const { top, height } = getByRole("button").style;
    unmount();
    return { top: parseFloat(top), height: parseFloat(height) };
  };
  // Whole grid, 8:00 AM to 8:00 PM.
  assert.deepEqual(position(8 * 60, 20 * 60), { top: 0, height: 100 });
  // 2:00 PM is six hours into a twelve hour grid.
  assert.deepEqual(position(14 * 60, 17 * 60), { top: 50, height: 25 });
});

test("CalendarEvent calls onClick when pressed", () => {
  let clicks = 0;
  const { getByRole } = render(
    <CalendarEvent event={event()} onClick={() => clicks++} />,
  );
  fireEvent.click(getByRole("button"));
  assert.equal(clicks, 1);
});

// ---- ScheduleCalendar ----

test("ScheduleCalendar shows one Mon–Fri week with no dates", () => {
  const { container, columns } = renderCalendar();
  const headers = [...container.querySelectorAll(".calendar-day-headers strong")];
  assert.deepEqual(
    headers.map((h) => h.textContent),
    ["Mon", "Tue", "Wed", "Thu", "Fri"],
  );
  assert.equal(columns.length, 5);
  assert.doesNotMatch(
    container.querySelector(".calendar-day-headers")?.textContent ?? "",
    /\d/,
    "day headers must not show calendar dates",
  );
});

test("ScheduleCalendar removes the day/week/month switcher and date arrows", () => {
  const { queryByRole, queryByLabelText, container } = renderCalendar();
  for (const name of ["Day", "Week", "Month"])
    assert.equal(queryByRole("button", { name }), null);
  assert.equal(queryByLabelText(/^(previous|next) /i), null);
  assert.equal(container.querySelector(".month-grid"), null);
});

test("ScheduleCalendar labels the semester as a weekly view", () => {
  const { container } = renderCalendar();
  assert.match(
    container.querySelector(".calendar-toolbar p")?.textContent ?? "",
    /Fall 2026\s*•\s*Weekly View/,
  );
});

test("ScheduleCalendar draws hourly labels from 8 AM to 8 PM", () => {
  const { container } = renderCalendar();
  const labels = [...container.querySelectorAll(".time-labels span")].map(
    (l) => l.textContent,
  );
  assert.equal(labels.length, 13);
  assert.equal(labels[0], "8:00 AM");
  assert.equal(labels[4], "12:00 PM");
  assert.equal(labels[12], "8:00 PM");
});

test("ScheduleCalendar puts a recurring event in each of its weekday columns", () => {
  const { columns } = renderCalendar([
    event(),
    event({ id: "gym", title: "Gym", days: [2] }),
  ]);
  assert.deepEqual(columns.map(titlesIn), [
    ["CS 3114"],
    ["Gym"],
    ["CS 3114"],
    [],
    ["CS 3114"],
  ]);
});

test("ScheduleCalendar renders an empty week without events", () => {
  const { columns } = renderCalendar([]);
  assert.ok(columns.every((column) => titlesIn(column).length === 0));
});

test("ScheduleCalendar reports the clicked event and the Add Event button", () => {
  const first = event();
  const second = event({ id: "gym", title: "Gym", days: [2] });
  const { columns, calls, getByRole } = renderCalendar([first, second]);
  fireEvent.click(within(columns[1]).getByRole("button"));
  assert.deepEqual(calls.opened, [second]);
  fireEvent.click(getByRole("button", { name: /add event/i }));
  assert.equal(calls.added, 1);
});
