import { mockRecommendCourses } from "./mockScheduler";
import test from "node:test";
import assert from "node:assert/strict";
import { conflicts, filterCourses, occursOn } from "./scheduler";
import {
  baseEvents,
  courses,
  defaultFilters,
  personalEvents,
} from "../data/mockData";
test("adjacent meetings do not conflict, overlapping recurring meetings do", () => {
  const a = baseEvents[0];
  assert.equal(conflicts(a, { ...a, start: a.end, end: a.end + 60 }), false);
  assert.equal(conflicts(a, { ...a, start: a.start + 20 }), true);
  assert.equal(conflicts(a, { ...a, days: [2] }), false);
});
test("date-specific commitments do not repeat", () => {
  const event = { ...personalEvents[0], date: "2026-08-25" };
  assert.equal(occursOn(event, new Date(2026, 7, 25)), true);
  assert.equal(occursOn(event, new Date(2026, 8, 1)), false);
  assert.equal(conflicts(event, { ...event, date: "2026-09-01" }), false);
  assert.equal(
    conflicts(event, { ...event, date: undefined, days: [2] }),
    true,
  );
});
test("filters combine rather than ignore constraints", () => {
  assert.deepEqual(
    filterCourses(courses, {
      ...defaultFilters,
      modality: "Online",
      rating: "4.5+",
    }).map((c) => c.id),
    ["ENGL 3764"],
  );
  assert.equal(
    filterCourses(courses, { ...defaultFilters, credits: "4" }).length,
    0,
  );
});
test("prompt recommendations respect existing commitments", async () => {
  const result = await mockRecommendCourses({
    prompt: "A 3 credit class on Fridays",
    filters: defaultFilters,
    events: [...baseEvents, ...personalEvents],
  });
  assert.deepEqual(
    result.courses.map((c) => c.id),
    ["ENGL 3764"],
  );
  const blocked = await mockRecommendCourses({
    prompt: "CS electives",
    filters: defaultFilters,
    events: [...baseEvents, ...personalEvents, courses[0].meeting],
  });
  assert.ok(!blocked.courses.some((c) => c.id === "CS 3724"));
});
// AI-generated test (Claude): checks the demo events fit the single Mon–Fri sample week.
test("demo events fit the Mon–Fri sample week and demo classes have names", () => {
  for (const event of [...baseEvents, ...personalEvents]) {
    assert.equal(event.date, undefined);
    assert.ok(event.days.length > 0);
    assert.ok(event.days.every((day) => day >= 1 && day <= 5));
  }
  for (const event of baseEvents) assert.ok(event.courseName);
});
