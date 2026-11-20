// AI-generated tests (Claude): confirmation step before removing an event.
import "../test/setupDom";
import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { EventDetailsModal } from "./EventDetailsModal";
import type { ScheduleEvent } from "../types";

afterEach(cleanup);

const event: ScheduleEvent = {
  id: "cs3114",
  title: "CS 3114",
  courseName: "Data Structures and Algorithms",
  days: [1, 3, 5],
  start: 9 * 60,
  end: 9 * 60 + 50,
  location: "Torgersen Hall",
  color: "pink",
};

function setup(shown: ScheduleEvent = event) {
  const calls = { closed: 0, removed: 0 };
  const view = render(
    <EventDetailsModal
      event={shown}
      onClose={() => calls.closed++}
      onRemove={() => calls.removed++}
    />,
  );
  const button = (name: string) =>
    view.queryByRole("button", { name, hidden: true });
  const click = (name: string) => fireEvent.click(button(name)!);
  return { ...view, calls, button, click };
}

test("shows the event's details, with no confirmation at first", () => {
  const { baseElement, button, queryByRole } = setup();
  assert.match(baseElement.textContent ?? "", /Data Structures and Algorithms/);
  assert.match(baseElement.textContent ?? "", /Mon \/ Wed \/ Fri/);
  assert.match(baseElement.textContent ?? "", /9:00 AM – 9:50 AM/);
  assert.ok(button("Remove from schedule"));
  assert.equal(queryByRole("alert", { hidden: true }), null);
});

test("omits Course and Notes rows when the event has neither", () => {
  const { baseElement } = setup({
    ...event,
    courseName: undefined,
    location: "",
  });
  assert.doesNotMatch(baseElement.textContent ?? "", /Course|Notes/);
  assert.match(baseElement.textContent ?? "", /No location set/);
});

test("the first Remove click asks for confirmation and removes nothing", () => {
  const { click, calls, button, getByRole } = setup();
  click("Remove from schedule");
  assert.equal(calls.removed, 0);
  assert.match(
    getByRole("alert", { hidden: true }).textContent ?? "",
    /Remove CS 3114 from your schedule\?/,
  );
  assert.equal(button("Remove from schedule"), null);
  assert.ok(button("Yes, remove"));
});

test("focus moves to the safe choice when confirmation appears", () => {
  const { click, button } = setup();
  click("Remove from schedule");
  assert.equal(document.activeElement, button("Keep it"));
});

test("confirming removes the event exactly once", () => {
  const { click, calls } = setup();
  click("Remove from schedule");
  click("Yes, remove");
  assert.equal(calls.removed, 1);
  assert.equal(calls.closed, 0);
});

test("Keep it returns to the details without removing or closing", () => {
  const { click, calls, button, queryByRole } = setup();
  click("Remove from schedule");
  click("Keep it");
  assert.equal(calls.removed, 0);
  assert.equal(calls.closed, 0);
  assert.equal(queryByRole("alert", { hidden: true }), null);
  assert.ok(button("Remove from schedule"));
});

test("the close icon still closes during confirmation without removing", () => {
  const { click, calls, getByLabelText } = setup();
  click("Remove from schedule");
  fireEvent.click(getByLabelText("Close dialog"));
  assert.equal(calls.closed, 1);
  assert.equal(calls.removed, 0);
});
